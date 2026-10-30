import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SQLiteAdapter } from './helpers/sqliteAdapter.js';
import { initializeDatabase } from '../src/database/schema.js';
import { StudyService } from '../src/services/StudyService.js';
import { Subject } from '../src/models/Subject.js';
import { StudySession } from '../src/models/StudySession.js';
import { Goal } from '../src/models/Goal.js';
import { addDays, fromBRDate, isISODate, toISODate, weekStart } from '../src/utils/dates.js';
import { readableError } from '../src/utils/errors.js';

async function setup(t) {
  const db = new SQLiteAdapter();
  await initializeDatabase(db);
  t.after(() => db.closeAsync());
  const service = new StudyService(db);
  const first = await service.saveSubject({ name: 'Programação' });
  const second = await service.saveSubject({ name: 'Inglês', color: '#C9853B' });
  return { db, service, first: first.lastInsertRowId, second: second.lastInsertRowId };
}

test('migração é idempotente e ativa integridade referencial', async (t) => {
  const { db } = await setup(t);
  await initializeDatabase(db);
  assert.equal((await db.getFirstAsync('PRAGMA foreign_keys')).foreign_keys, 1);
  assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, 1);
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS count FROM subjects')).count, 2);
});

test('CRUD de disciplinas, busca literal, ordenação e proteção de parâmetros', async (t) => {
  const { service, first } = await setup(t);
  await service.saveSubject({
    id: first,
    name: 'JavaScript 100%',
    description: 'Classes e objetos',
  });
  assert.equal((await service.subjects.list({ search: '100%' })).length, 1);
  assert.equal((await service.subjects.list({ search: "' OR 1=1 --" })).length, 0);
  assert.equal((await service.subjects.list({ sort: 'name' }))[0].name, 'Inglês');
  await service.deleteSubject(first);
  assert.equal((await service.subjects.list()).length, 1);
});

test('duplicidade de disciplina produz mensagem compreensível', async (t) => {
  const { service } = await setup(t);
  await assert.rejects(service.saveSubject({ name: 'programação' }), (error) =>
    /Já existe uma disciplina/.test(readableError(error)),
  );
});

test('sessões: inclusão, consulta filtrada com JOIN, alteração, ordenação e exclusão', async (t) => {
  const { service, first, second } = await setup(t);
  const a = await service.saveSession({
    subject_id: first,
    topic: 'Classes',
    minutes: 45,
    studied_on: '2026-01-10',
  });
  await service.saveSession({
    subject_id: second,
    topic: 'Verbos',
    minutes: 20,
    studied_on: '2026-01-11',
  });
  const rows = await service.sessions.list({
    subjectId: first,
    from: '2026-01-10',
    to: '2026-01-10',
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].subject_name, 'Programação');
  await service.saveSession({
    id: a.lastInsertRowId,
    subject_id: first,
    topic: 'Encapsulamento',
    minutes: 60,
    studied_on: '2026-01-12',
  });
  assert.equal((await service.sessions.list({ sort: 'duration' }))[0].minutes, 60);
  assert.equal((await service.sessions.list({ sort: 'oldest' }))[0].topic, 'Verbos');
  assert.equal((await service.sessions.list({ search: 'Inglês' })).length, 1);
  await service.sessions.delete(a.lastInsertRowId);
  assert.equal((await service.sessions.list()).length, 1);
});

test('validações rejeitam dados inválidos antes da persistência', async (t) => {
  const { service, first, db } = await setup(t);
  assert.throws(() => new Subject({ name: ' ' }), /entre 2 e 60/);
  for (const minutes of ['', '1.5', '-5', '0', '1441', 'abc', 'Infinity']) {
    await assert.rejects(
      service.saveSession({
        subject_id: first,
        topic: 'Revisão',
        minutes,
        studied_on: '2026-01-01',
      }),
    );
  }
  assert.throws(
    () =>
      new StudySession({
        subject_id: first,
        topic: 'Revisão',
        minutes: 30,
        studied_on: '2026-02-30',
      }),
    /data válida/,
  );
  assert.throws(
    () =>
      new StudySession({
        subject_id: first,
        topic: 'Revisão',
        minutes: 30,
        studied_on: '2099-01-01',
      }),
    /futuro/,
  );
  await assert.rejects(
    service.saveSession({ subject_id: 999, topic: 'Teste', minutes: 30, studied_on: '2026-01-01' }),
    /não existe/,
  );
  assert.equal((await db.getFirstAsync('SELECT COUNT(*) AS count FROM sessions')).count, 0);
});

test('exclusão protege disciplina com sessões ou metas e o banco também recusa órfãos', async (t) => {
  const { service, db, first, second } = await setup(t);
  await service.saveSession({
    subject_id: first,
    topic: 'Classes',
    minutes: 45,
    studied_on: '2026-01-10',
  });
  await assert.rejects(service.deleteSubject(first), /sessões ou metas vinculadas/);
  await assert.rejects(db.runAsync('DELETE FROM subjects WHERE id = ?', first), /FOREIGN KEY/);
  await service.saveGoal({
    subject_id: second,
    title: 'Estudar inglês',
    target_minutes: 120,
    start_on: '2026-01-01',
    end_on: '2026-01-31',
  });
  await assert.rejects(service.deleteSubject(second), /sessões ou metas vinculadas/);
});

test('metas somam somente a disciplina e o período, calculam status e aceitam CRUD', async (t) => {
  const { service, first, second } = await setup(t);
  for (const [subject_id, minutes, studied_on] of [
    [first, 30, '2026-01-01'],
    [first, 20, '2026-01-03'],
    [first, 100, '2025-12-31'],
    [second, 90, '2026-01-02'],
  ]) {
    await service.saveSession({ subject_id, topic: 'Revisão', minutes, studied_on });
  }
  const g = await service.saveGoal({
    subject_id: first,
    title: 'Meta por disciplina',
    target_minutes: 100,
    start_on: '2026-01-01',
    end_on: '2026-01-03',
  });
  await service.saveGoal({
    title: 'Meta geral',
    target_minutes: 120,
    start_on: '2026-01-01',
    end_on: '2026-01-03',
  });
  const goals = await service.goals.list({ today: '2026-01-02' });
  assert.equal(goals.find((row) => row.id === g.lastInsertRowId).studied_minutes, 50);
  assert.equal(goals.find((row) => row.title === 'Meta geral').studied_minutes, 140);
  assert.equal((await service.goals.list({ today: '2026-01-02', status: 'completed' })).length, 1);
  assert.equal((await service.goals.list({ today: '2026-01-04', status: 'overdue' })).length, 1);
  assert.equal(
    (await service.goals.list({ today: '2025-12-01', status: 'scheduled', subjectId: first }))
      .length,
    1,
  );
  await service.saveGoal({
    id: g.lastInsertRowId,
    subject_id: first,
    title: 'Meta alterada',
    target_minutes: 40,
    start_on: '2026-01-01',
    end_on: '2026-01-03',
  });
  assert.equal(
    (await service.goals.list({ today: '2026-01-04', subjectId: first }))[0].status,
    'completed',
  );
  await service.goals.delete(g.lastInsertRowId);
  assert.equal((await service.goals.list({ today: '2026-01-02' })).length, 1);
});

test('indicadores: semana começa na segunda, soma total, distribuição e sequência', async (t) => {
  const { service, first } = await setup(t);
  for (const [studied_on, minutes] of [
    ['2026-01-04', 90],
    ['2026-01-05', 40],
    ['2026-01-06', 20],
    ['2026-01-06', 10],
  ]) {
    await service.saveSession({ subject_id: first, topic: 'Revisão', minutes, studied_on });
  }
  const data = await service.dashboard('2026-01-07');
  assert.equal(data.total_minutes, 160);
  assert.equal(data.week_minutes, 70);
  assert.equal(data.total_sessions, 4);
  assert.equal(data.study_days, 3);
  assert.equal(data.streak, 3);
  assert.equal(data.distribution[0].minutes, 160);
  assert.equal(data.chart.length, 7);
  assert.equal(data.chart.at(-1).minutes, 0);
});

test('metas validam datas e encapsulam os dados', () => {
  assert.throws(
    () =>
      new Goal({ title: 'Meta', target_minutes: 10, start_on: '2026-01-10', end_on: '2026-01-01' }),
    /prazo/,
  );
  const goal = new Goal({
    title: 'Meta',
    target_minutes: 60,
    start_on: '2026-01-01',
    end_on: '2026-01-31',
  });
  goal.toRecord().target_minutes = 0;
  assert.equal(goal.progress(30), 50);
  assert.equal(goal.progress(90), 100);
  assert.equal(goal.status(0, '2026-02-01'), 'overdue');
  assert.equal(goal.status(60, '2026-02-01'), 'completed');
});

test('datas locais tratam virada do mês, ano bissexto e conversão brasileira', () => {
  assert.equal(fromBRDate('29/02/2024'), '2024-02-29');
  assert.equal(isISODate('2024-02-29'), true);
  assert.equal(isISODate('2026-02-29'), false);
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(weekStart('2026-01-04'), '2025-12-29');
});

test('exemplos são transacionais e não sobrescrevem dados existentes', async (t) => {
  const db = new SQLiteAdapter();
  t.after(() => db.closeAsync());
  await initializeDatabase(db);
  const service = new StudyService(db);
  await service.loadExamples();
  assert.equal((await service.sessions.list()).length, 6);
  assert.equal((await service.subjects.list()).length, 3);
  await assert.rejects(service.loadExamples(), /aplicativo está vazio/);
  assert.equal((await service.subjects.list()).length, 3);
});

test('persistência: registros sobrevivem ao fechamento e reabertura do arquivo SQLite', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ritmo-test-'));
  const path = join(dir, 'ritmo.db');
  let db;
  try {
    db = new SQLiteAdapter(path);
    await initializeDatabase(db);
    const service = new StudyService(db);
    const inserted = await service.saveSubject({ name: 'Persistência' });
    await service.saveSession({
      subject_id: inserted.lastInsertRowId,
      topic: 'SQLite local',
      minutes: 30,
      studied_on: toISODate(),
    });
    await db.closeAsync();
    db = new SQLiteAdapter(path);
    await initializeDatabase(db);
    const reopened = new StudyService(db);
    assert.equal((await reopened.subjects.list())[0].name, 'Persistência');
    assert.equal((await reopened.sessions.list())[0].minutes, 30);
  } finally {
    if (db) await db.closeAsync();
    await rm(dir, { recursive: true, force: true });
  }
});
