import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SQLiteAdapter } from './helpers/sqliteAdapter.js';
import { initializeDatabase, SCHEMA_SQL, SCHEMA_VERSION } from '../src/database/schema.js';
import { StudyService } from '../src/services/StudyService.js';
import { Goal } from '../src/models/Goal.js';
import { TimeGoal } from '../src/models/TimeGoal.js';
import { SessionGoal } from '../src/models/SessionGoal.js';
import { FocusTimer } from '../src/models/FocusTimer.js';
import { Revision } from '../src/models/Revision.js';
import { createGoal, presentGoal } from '../src/models/GoalFactory.js';
import { toISODate } from '../src/utils/dates.js';

async function fixture(t, path = ':memory:') {
  const db = new SQLiteAdapter(path);
  await initializeDatabase(db);
  t.after(() => db.closeAsync());
  const service = new StudyService(db);
  const subject = await service.saveSubject({ name: 'Programação' });
  const other = await service.saveSubject({ name: 'Inglês' });
  return { db, service, subject: subject.lastInsertRowId, other: other.lastInsertRowId };
}

test('v1 → v2 migra sem apagar disciplinas, sessões ou metas existentes', async (t) => {
  const db = new SQLiteAdapter();
  t.after(() => db.closeAsync());
  await db.execAsync(SCHEMA_SQL + 'PRAGMA user_version = 1;');
  await db.runAsync("INSERT INTO subjects (name) VALUES ('Matemática')");
  await db.runAsync(
    "INSERT INTO sessions (subject_id,topic,minutes,studied_on) VALUES (1,'Frações',30,'2026-01-10')",
  );
  await db.runAsync(
    "INSERT INTO goals (title,target_minutes,start_on,end_on) VALUES ('Revisar frações',60,'2026-01-01','2026-01-31')",
  );
  await initializeDatabase(db);
  await initializeDatabase(db);
  assert.equal((await db.getFirstAsync('PRAGMA user_version')).user_version, SCHEMA_VERSION);
  const goal = (await new StudyService(db).goals.list({ today: '2026-01-15' }))[0];
  assert.equal(goal.goal_type, 'time');
  assert.equal(goal.studied_minutes, 30);
  assert.equal(presentGoal(goal, '2026-01-15').progress, 50);
  assert.equal((await db.getAllAsync('SELECT * FROM subjects')).length, 1);
  assert.equal((await db.getAllAsync('SELECT * FROM sessions')).length, 1);
});

test('herança e polimorfismo: duas subclasses usam a mesma chamada com comportamentos distintos', () => {
  const base = {
    title: 'Meta de estudo',
    target_minutes: 120,
    target_sessions: 4,
    start_on: '2026-01-01',
    end_on: '2026-01-31',
  };
  const objects = [new TimeGoal(base), new SessionGoal(base)];
  assert.throws(() => new Goal(base), /classe base abstrata/);
  assert.equal(Object.getPrototypeOf(TimeGoal.prototype), Goal.prototype);
  assert.equal(Object.getPrototypeOf(SessionGoal.prototype), Goal.prototype);
  assert.equal(objects[0].progress, objects[1].progress);
  assert.ok(objects.every((goal) => goal instanceof Goal));
  const metrics = { studied_minutes: 60, studied_sessions: 1 };
  assert.deepEqual(
    objects.map((goal) => goal.progress(metrics)),
    [50, 25],
  );
  assert.deepEqual(
    objects.map((goal) => goal.progressLabel(metrics)),
    ['1h de 2h', '1 de 4 sessões'],
  );
  assert.notEqual(TimeGoal.prototype.currentValue, SessionGoal.prototype.currentValue);
  assert.ok(createGoal({ ...base, goal_type: 'sessions' }) instanceof SessionGoal);
  assert.ok(createGoal({ ...base, goal_type: 'time' }) instanceof TimeGoal);
  assert.throws(() => createGoal({ ...base, goal_type: 'invalid' }), /tipo de meta/);
});

test('metas por sessões usam COUNT, intervalo, disciplina, situação, busca e ordenação SQL', async (t) => {
  const { service, subject, other } = await fixture(t);
  for (const [subject_id, date, minutes] of [
    [subject, '2026-01-01', 60],
    [subject, '2026-01-02', 10],
    [other, '2026-01-02', 30],
    [subject, '2025-12-31', 60],
  ]) {
    await service.saveSession({ subject_id, topic: 'Revisão', minutes, studied_on: date });
  }
  await service.saveGoal({
    title: 'Rotina por sessões',
    subject_id: subject,
    goal_type: 'sessions',
    target_sessions: 4,
    start_on: '2026-01-01',
    end_on: '2026-01-31',
  });
  await service.saveGoal({
    title: 'Tempo de estudo',
    subject_id: subject,
    target_minutes: 70,
    start_on: '2026-01-01',
    end_on: '2026-01-31',
  });
  const records = await service.goals.list({ today: '2026-01-15', sort: 'progress' });
  assert.equal(records[0].goal_type, 'time');
  assert.equal(records[0].status, 'completed');
  const count = (
    await service.goals.list({ today: '2026-01-15', goalType: 'sessions', search: 'Rotina' })
  )[0];
  assert.equal(count.studied_sessions, 2);
  assert.equal(count.studied_minutes, 70);
  assert.equal(presentGoal(count, '2026-01-15').progress, 50);
  assert.equal(
    (await service.goals.list({ today: '2026-01-15', goalType: 'sessions', status: 'completed' }))
      .length,
    0,
  );
  await service.saveGoal({ ...count, target_sessions: 2 });
  assert.equal(
    (await service.goals.list({ today: '2026-01-15', goalType: 'sessions', status: 'completed' }))
      .length,
    1,
  );
  assert.throws(() => new SessionGoal({ ...count, target_sessions: 0 }), /entre 1 e 1000/);
});

test('agenda tem CRUD e filtros por busca, disciplina, atraso, prioridade e data', async (t) => {
  const { service, subject, other } = await fixture(t);
  const first = await service.saveRevision({
    subject_id: subject,
    title: 'Herança',
    planned_on: '2026-01-01',
    planned_minutes: 25,
    priority: 'high',
  });
  await service.saveRevision({
    subject_id: other,
    title: 'Vocabulário',
    planned_on: '2026-01-02',
    planned_minutes: 20,
    priority: 'low',
  });
  let rows = await service.revisions.list({
    today: '2026-01-02',
    status: 'overdue',
    subjectId: subject,
    priority: 'high',
    search: 'Herança',
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].subject_name, 'Programação');
  await service.saveRevision({ ...rows[0], title: 'Herança e objetos', planned_on: '2026-01-02' });
  assert.equal(
    (await service.revisions.list({ today: '2026-01-02', status: 'overdue' })).length,
    0,
  );
  rows = await service.revisions.list({
    today: '2026-01-02',
    status: 'today',
    from: '2026-01-02',
    to: '2026-01-02',
    sort: 'priority',
  });
  assert.equal(rows[0].title, 'Herança e objetos');
  assert.equal(rows.length, 2);
  await service.revisions.delete(first.lastInsertRowId);
  assert.equal((await service.revisions.list({ today: '2026-01-02' })).length, 1);
  assert.throws(
    () =>
      new Revision({
        subject_id: subject,
        title: '',
        planned_on: '2026-02-30',
        planned_minutes: 0,
      }),
  );
});

test('concluir revisão cria uma sessão, atualiza metas e impede conclusão duplicada', async (t) => {
  const { service, subject } = await fixture(t);
  const today = toISODate();
  const revision = await service.saveRevision({
    subject_id: subject,
    title: 'Praticar POO',
    planned_on: today,
    planned_minutes: 25,
  });
  await service.saveGoal({
    title: 'Uma revisão',
    subject_id: subject,
    goal_type: 'sessions',
    target_sessions: 1,
    start_on: today,
    end_on: today,
  });
  await assert.rejects(service.completeRevision(revision.lastInsertRowId, '0'), /entre 1 e 1440/);
  assert.equal((await service.sessions.list()).length, 0);
  await service.completeRevision(revision.lastInsertRowId, '30');
  assert.equal((await service.sessions.list())[0].minutes, 30);
  assert.equal((await service.listGoals())[0].progress, 100);
  assert.equal((await service.revisions.find(revision.lastInsertRowId)).status, 'done');
  await assert.rejects(
    service.completeRevision(revision.lastInsertRowId, '30'),
    /já foi concluída/,
  );
  assert.equal((await service.sessions.list()).length, 1);
});

test('falha ao concluir revisão desfaz a sessão e preserva os dados por rollback', async (t) => {
  const { service, db, subject } = await fixture(t);
  const revision = await service.saveRevision({
    subject_id: subject,
    title: 'Falha controlada',
    planned_on: toISODate(),
    planned_minutes: 20,
  });
  const original = db.runAsync.bind(db);
  db.runAsync = async (sql, ...params) => {
    if (sql.startsWith('UPDATE revisions SET status')) throw new Error('Falha de disco simulada');
    return original(sql, ...params);
  };
  await assert.rejects(service.completeRevision(revision.lastInsertRowId, 20), /Falha de disco/);
  assert.equal((await service.sessions.list()).length, 0);
  assert.equal((await service.revisions.find(revision.lastInsertRowId)).status, 'pending');
});

test('excluir revisão preserva o histórico e excluir sessão mantém a revisão concluída', async (t) => {
  const { service, subject } = await fixture(t);
  const a = await service.saveRevision({
    subject_id: subject,
    title: 'Revisão A',
    planned_on: toISODate(),
    planned_minutes: 20,
  });
  await service.completeRevision(a.lastInsertRowId, 20);
  await service.revisions.delete(a.lastInsertRowId);
  assert.equal((await service.sessions.list()).length, 1);
  const b = await service.saveRevision({
    subject_id: subject,
    title: 'Revisão B',
    planned_on: toISODate(),
    planned_minutes: 20,
  });
  await service.completeRevision(b.lastInsertRowId, 20);
  const row = await service.revisions.find(b.lastInsertRowId);
  await service.sessions.delete(row.session_id);
  const after = await service.revisions.find(b.lastInsertRowId);
  assert.equal(after.status, 'done');
  assert.equal(after.session_id, null);
});

test('cronômetro conta apenas tempo em execução, limita ao alvo e protege estado privado', () => {
  const timer = new FocusTimer({ subject_id: 1, topic: 'Foco', target_minutes: 2 }).resume(100000);
  const paused = timer.pause(130000);
  assert.equal(paused.elapsedSeconds(999999), 30);
  const resumed = paused.resume(200000);
  assert.equal(resumed.elapsedSeconds(230000), 60);
  assert.equal(resumed.remainingSeconds(230000), 60);
  assert.equal(resumed.elapsedSeconds(999999), 120);
  resumed.toRecord().target_minutes = 0;
  assert.equal(resumed.toRecord().target_minutes, 2);
  assert.throws(() => new FocusTimer({ subject_id: 1, topic: 'Foco', target_minutes: '1.5' }));
});

test('foco salva uma única sessão, retoma do SQLite e evita tempo menor que um minuto', async (t) => {
  const { service, db, subject } = await fixture(t);
  await service.startFocus(
    { subject_id: subject, topic: 'Estudar SQL', target_minutes: 2 },
    100000,
  );
  await assert.rejects(
    service.startFocus({ subject_id: subject, topic: 'Duplicado', target_minutes: 2 }, 100000),
    /Já existe/,
  );
  await assert.rejects(service.finishFocus(130000), /pelo menos 1 minuto/);
  await service.pauseFocus(160000);
  const recovered = new StudyService(db);
  assert.equal(new FocusTimer(await recovered.focus.current()).elapsedSeconds(900000), 60);
  await recovered.resumeFocus(200000);
  await recovered.finishFocus(260000);
  assert.equal((await service.sessions.list())[0].minutes, 2);
  assert.equal(await service.focus.current(), null);
  await assert.rejects(service.finishFocus(260000), /já foi salvo/);
  assert.equal((await service.sessions.list()).length, 1);
});

test('disciplinas com revisão ou foco ativo são protegidas contra exclusão', async (t) => {
  const { service, subject, other } = await fixture(t);
  await service.saveRevision({
    subject_id: subject,
    title: 'Revisão',
    planned_on: toISODate(),
    planned_minutes: 20,
  });
  await assert.rejects(service.deleteSubject(subject), /revisões ou um foco ativo/);
  await service.startFocus({ subject_id: other, topic: 'Foco de inglês', target_minutes: 25 });
  await assert.rejects(service.deleteSubject(other), /revisões ou um foco ativo/);
  await service.focus.clear();
  await service.deleteSubject(other);
});

test('novos filtros SQL combinam duração, busca, disciplina e intervalo inclusivo', async (t) => {
  const { service, subject } = await fixture(t);
  for (const minutes of [10, 30, 60])
    await service.saveSession({
      subject_id: subject,
      topic: 'Revisão SQL',
      minutes,
      studied_on: '2026-01-10',
    });
  assert.equal((await service.sessions.list({ minMinutes: 60 })).length, 1);
  assert.equal(
    (
      await service.sessions.list({
        maxMinutes: 30,
        subjectId: subject,
        search: 'SQL',
        from: '2026-01-10',
        to: '2026-01-10',
      })
    ).length,
    2,
  );
  assert.equal((await service.sessions.list({ minMinutes: 31, maxMinutes: 59 })).length, 0);
});

test('foco, agenda e metas por sessões permanecem após fechar e reabrir o arquivo', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ritmo-v2-'));
  const file = join(directory, 'ritmo.db');
  let db;
  try {
    db = new SQLiteAdapter(file);
    await initializeDatabase(db);
    let service = new StudyService(db);
    const subject = (await service.saveSubject({ name: 'Persistência v2' })).lastInsertRowId;
    await service.saveRevision({
      subject_id: subject,
      title: 'Retomar amanhã',
      planned_on: toISODate(),
      planned_minutes: 20,
    });
    await service.saveGoal({
      title: 'Duas sessões',
      goal_type: 'sessions',
      target_sessions: 2,
      start_on: toISODate(),
      end_on: toISODate(),
    });
    await service.startFocus(
      { subject_id: subject, topic: 'Persistir foco', target_minutes: 25 },
      100000,
    );
    await db.closeAsync();
    db = new SQLiteAdapter(file);
    await initializeDatabase(db);
    service = new StudyService(db);
    assert.equal((await service.revisions.list({ today: toISODate() })).length, 1);
    assert.equal((await service.listGoals())[0].goal_type, 'sessions');
    assert.equal(new FocusTimer(await service.focus.current()).elapsedSeconds(160000), 60);
  } finally {
    if (db) await db.closeAsync();
    await rm(directory, { recursive: true, force: true });
  }
});
