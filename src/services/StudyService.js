import { Subject } from '../models/Subject.js';
import { StudySession } from '../models/StudySession.js';
import { createGoal, presentGoal } from '../models/GoalFactory.js';
import { Revision } from '../models/Revision.js';
import { FocusTimer } from '../models/FocusTimer.js';
import { FocusRepository, RevisionRepository } from '../repositories/PlanningRepository.js';
import { ValidationError } from '../models/ValidationError.js';
import {
  SubjectRepository,
  SessionRepository,
  GoalRepository,
  IndicatorRepository,
} from '../repositories/StudyRepository.js';
import { addDays, toISODate, weekStart } from '../utils/dates.js';

export class StudyService {
  constructor(db) {
    this.db = db;
    this.subjects = new SubjectRepository(db);
    this.sessions = new SessionRepository(db);
    this.goals = new GoalRepository(db);
    this.indicators = new IndicatorRepository(db);
    this.revisions = new RevisionRepository(db);
    this.focus = new FocusRepository(db);
  }

  async ensureSubject(id) {
    if (!(await this.subjects.find(id)))
      throw new ValidationError(
        'A disciplina selecionada não existe. Cadastre ou selecione outra.',
        'subject_id',
      );
  }

  async saveSubject(data) {
    const subject = new Subject(data).toRecord();
    const existing = await this.subjects.findByName(subject.name);
    // Valida antes do INSERT: algumas implementações web do SQLite omitem
    // o detalhe da restrição ao finalizar uma consulta que falhou.
    if (existing && existing.id !== subject.id) {
      throw new ValidationError(
        'Já existe uma disciplina com esse nome. Escolha outro nome.',
        'name',
      );
    }
    return this.subjects.save(subject);
  }

  async saveSession(data) {
    const session = new StudySession(data);
    await this.ensureSubject(session.toRecord().subject_id);
    return this.sessions.save(session.toRecord());
  }

  async saveGoal(data) {
    const goal = createGoal(data);
    if (goal.toRecord().subject_id) await this.ensureSubject(goal.toRecord().subject_id);
    return this.goals.save(goal.toRecord());
  }

  async deleteSubject(id) {
    const links = await this.subjects.references(id);
    if (links.revisions || links.focus)
      throw new ValidationError(
        'Esta disciplina tem revisões ou um foco ativo. Remova ou altere esses vínculos antes de excluir.',
      );
    if (links.sessions || links.goals) {
      throw new ValidationError(
        'Esta disciplina tem sessões ou metas vinculadas. Exclua ou altere esses registros antes de remover a disciplina.',
      );
    }
    return this.subjects.delete(id);
  }

  async listGoals(filters = {}) {
    const goals = await this.goals.list({ ...filters, today: toISODate() });
    return goals.map((row) => presentGoal(row, toISODate()));
  }

  async dashboard(today = toISODate()) {
    const [summary, days, distribution, dates, goals, recent, planning] = await Promise.all([
      this.indicators.summary({ today, weekStart: weekStart(today) }),
      this.indicators.days(addDays(today, -6), today),
      this.indicators.distribution(),
      this.indicators.studyDates(),
      this.goals.list({ today }),
      this.sessions.list(),
      this.revisions.summary(today),
    ]);
    const dateSet = new Set(dates.map((r) => r.studied_on));
    // A sequência continua válida até o fim de hoje se houve estudo ontem.
    let cursor = dateSet.has(today) ? today : addDays(today, -1);
    let streak = 0;
    while (dateSet.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    const chart = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index - 6);
      return { date, minutes: days.find((r) => r.studied_on === date)?.minutes || 0 };
    });
    return {
      ...summary,
      streak,
      chart,
      distribution,
      recent: recent.slice(0, 3),
      planning,
      completed_goals: goals.filter((g) => g.status === 'completed').length,
      total_goals: goals.length,
      goals: goals
        .filter((g) => g.status === 'active')
        .slice(0, 2)
        .map((g) => presentGoal(g, today)),
    };
  }

  async saveRevision(data) {
    const revision = new Revision(data).toRecord();
    await this.ensureSubject(revision.subject_id);
    return this.revisions.save(revision);
  }

  async completeRevision(id, actualMinutes, today = toISODate()) {
    await this.db.withTransactionAsync(async () => {
      const revision = await this.revisions.find(id);
      if (!revision) throw new ValidationError('Esta revisão não existe mais.');
      if (revision.status === 'done')
        throw new ValidationError('Esta revisão já foi concluída. O estudo não será duplicado.');
      const session = new StudySession(
        {
          subject_id: revision.subject_id,
          topic: revision.title,
          minutes: actualMinutes,
          studied_on: today,
          notes: revision.notes
            ? `Revisão concluída. ${revision.notes}`
            : 'Revisão concluída pela agenda.',
        },
        today,
      );
      const result = await this.sessions.save(session.toRecord());
      await this.revisions.complete(id, result.lastInsertRowId, today);
    });
  }

  async startFocus(data, now = Date.now()) {
    const timer = new FocusTimer({
      ...data,
      accumulated_seconds: 0,
      status: 'running',
      started_at_ms: now,
    });
    await this.ensureSubject(timer.toRecord().subject_id);
    if (await this.focus.current())
      throw new ValidationError('Já existe um foco em andamento. Retome ou descarte o atual.');
    return this.focus.create(timer.toRecord());
  }

  async pauseFocus(now = Date.now()) {
    const row = await this.focus.current();
    if (!row) throw new ValidationError('Nenhum foco ativo foi encontrado.');
    return this.focus.update(new FocusTimer(row).pause(now).toRecord());
  }

  async resumeFocus(now = Date.now()) {
    const row = await this.focus.current();
    if (!row) throw new ValidationError('Nenhum foco ativo foi encontrado.');
    return this.focus.update(new FocusTimer(row).resume(now).toRecord());
  }

  async finishFocus(now = Date.now(), today = toISODate()) {
    await this.db.withTransactionAsync(async () => {
      const row = await this.focus.current();
      if (!row) throw new ValidationError('Este foco já foi salvo ou descartado.');
      const minutes = Math.floor(new FocusTimer(row).elapsedSeconds(now) / 60);
      if (minutes < 1)
        throw new ValidationError('Estude por pelo menos 1 minuto para salvar a sessão.');
      const session = new StudySession(
        {
          subject_id: row.subject_id,
          topic: row.topic,
          minutes,
          studied_on: today,
          notes: 'Sessão registrada pelo cronômetro de foco.',
        },
        today,
      );
      await this.sessions.save(session.toRecord());
      await this.focus.clear();
    });
  }

  async loadExamples(today = toISODate()) {
    const count = await this.db.getFirstAsync(`SELECT
      (SELECT COUNT(*) FROM subjects) + (SELECT COUNT(*) FROM sessions) + (SELECT COUNT(*) FROM goals) AS total`);
    if (count.total)
      throw new ValidationError(
        'Os exemplos só podem ser adicionados quando o aplicativo está vazio.',
      );
    await this.db.withTransactionAsync(async () => {
      const programming = await this.saveSubject({
        name: 'Programação',
        description: 'JavaScript, POO e aplicações mobile',
        color: '#197568',
      });
      const database = await this.saveSubject({
        name: 'Banco de Dados',
        description: 'SQL, modelagem e persistência',
        color: '#6975C5',
      });
      const english = await this.saveSubject({
        name: 'Inglês',
        description: 'Conversação e vocabulário',
        color: '#C9853B',
      });
      const p = programming.lastInsertRowId,
        b = database.lastInsertRowId,
        e = english.lastInsertRowId;
      for (const data of [
        {
          subject_id: p,
          topic: 'Classes e encapsulamento',
          minutes: 50,
          studied_on: today,
          notes: 'Pratiquei campos privados e métodos de validação.',
        },
        { subject_id: e, topic: 'Conversação do dia a dia', minutes: 25, studied_on: today },
        {
          subject_id: b,
          topic: 'Consultas com JOIN e GROUP BY',
          minutes: 60,
          studied_on: addDays(today, -1),
        },
        {
          subject_id: p,
          topic: 'Componentes e estado no React Native',
          minutes: 45,
          studied_on: addDays(today, -2),
        },
        {
          subject_id: e,
          topic: 'Revisão de vocabulário',
          minutes: 30,
          studied_on: addDays(today, -3),
        },
        {
          subject_id: b,
          topic: 'Modelagem do banco de dados',
          minutes: 55,
          studied_on: addDays(today, -5),
        },
      ])
        await this.sessions.save(new StudySession(data, today).toRecord());
      await this.saveGoal({
        title: 'Construir uma rotina de estudos',
        target_minutes: 360,
        start_on: addDays(today, -6),
        end_on: addDays(today, 3),
      });
      await this.saveGoal({
        title: 'Avançar em Programação',
        subject_id: p,
        target_minutes: 180,
        start_on: addDays(today, -6),
        end_on: addDays(today, 5),
      });
      await this.saveGoal({
        title: 'Praticar inglês',
        subject_id: e,
        target_minutes: 50,
        start_on: addDays(today, -6),
        end_on: today,
      });
      await this.saveGoal({
        title: 'Estudar Programação em 4 sessões',
        subject_id: p,
        goal_type: 'sessions',
        target_sessions: 4,
        start_on: addDays(today, -6),
        end_on: addDays(today, 7),
      });
      await this.saveRevision({
        subject_id: p,
        title: 'Revisar herança e polimorfismo',
        planned_on: today,
        planned_minutes: 25,
        priority: 'high',
        notes: 'Praticar subclasses e a chamada do mesmo método em objetos diferentes.',
      });
      await this.saveRevision({
        subject_id: b,
        title: 'Reforçar consultas com JOIN',
        planned_on: addDays(today, -1),
        planned_minutes: 30,
        priority: 'normal',
      });
      await this.saveRevision({
        subject_id: e,
        title: 'Revisar vocabulário da semana',
        planned_on: addDays(today, 1),
        planned_minutes: 20,
        priority: 'low',
      });
    });
  }
}
