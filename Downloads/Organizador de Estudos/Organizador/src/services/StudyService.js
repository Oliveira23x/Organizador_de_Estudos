import { Subject } from '../models/Subject.js';
import { StudySession } from '../models/StudySession.js';
import { Goal } from '../models/Goal.js';
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
    const goal = new Goal(data);
    if (goal.toRecord().subject_id) await this.ensureSubject(goal.toRecord().subject_id);
    return this.goals.save(goal.toRecord());
  }

  async deleteSubject(id) {
    const links = await this.subjects.references(id);
    if (links.sessions || links.goals) {
      throw new ValidationError(
        'Esta disciplina tem sessões ou metas vinculadas. Exclua ou altere esses registros antes de remover a disciplina.',
      );
    }
    return this.subjects.delete(id);
  }

  async listGoals(filters = {}) {
    const goals = await this.goals.list({ ...filters, today: toISODate() });
    return goals.map((row) => ({ ...row, progress: new Goal(row).progress(row.studied_minutes) }));
  }

  async dashboard(today = toISODate()) {
    const [summary, days, distribution, dates, goals, recent] = await Promise.all([
      this.indicators.summary({ today, weekStart: weekStart(today) }),
      this.indicators.days(addDays(today, -6), today),
      this.indicators.distribution(),
      this.indicators.studyDates(),
      this.goals.list({ today }),
      this.sessions.list(),
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
      completed_goals: goals.filter((g) => g.status === 'completed').length,
      total_goals: goals.length,
      goals: goals
        .filter((g) => g.status === 'active')
        .slice(0, 2)
        .map((g) => ({ ...g, progress: new Goal(g).progress(g.studied_minutes) })),
    };
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
    });
  }
}
