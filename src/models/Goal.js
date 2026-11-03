import { ValidationError, optionalText, requireInteger } from './ValidationError.js';
import { isISODate } from '../utils/dates.js';

export class Goal {
  #data;

  constructor({
    id = null,
    subject_id = null,
    title = '',
    target_minutes = 1,
    target_sessions = 1,
    goal_type = 'time',
    start_on,
    end_on,
  }) {
    // JavaScript não possui a palavra-chave abstract. Esta proteção garante
    // que a classe base só seja construída por uma subclasse concreta.
    if (new.target === Goal) {
      throw new TypeError('Goal é uma classe base abstrata. Use TimeGoal ou SessionGoal.');
    }
    this.#data = {
      id,
      subject_id:
        subject_id == null || subject_id === ''
          ? null
          : requireInteger(subject_id, 1, Number.MAX_SAFE_INTEGER, 'Disciplina', 'subject_id'),
      title: optionalText(title, 80, 'Título da meta', 'title'),
      target_minutes: requireInteger(
        target_minutes,
        1,
        100000,
        'Tempo da meta em minutos',
        'target_minutes',
      ),
      start_on,
      end_on,
      goal_type,
      target_sessions: requireInteger(
        target_sessions,
        1,
        1000,
        'Quantidade de sessões',
        'target_sessions',
      ),
    };
    this.validate();
  }

  validate() {
    if (!['time', 'sessions'].includes(this.#data.goal_type))
      throw new ValidationError('Selecione um tipo de meta válido.', 'goal_type');
    if (this.#data.title.length < 3)
      throw new ValidationError('O título da meta deve ter pelo menos 3 caracteres.', 'title');
    if (!isISODate(this.#data.start_on))
      throw new ValidationError('Informe uma data inicial válida: DD/MM/AAAA.', 'start_on');
    if (!isISODate(this.#data.end_on))
      throw new ValidationError('Informe um prazo válido: DD/MM/AAAA.', 'end_on');
    if (this.#data.end_on < this.#data.start_on)
      throw new ValidationError('O prazo deve ser igual ou posterior à data inicial.', 'end_on');
    return true;
  }

  currentValue() {
    throw new Error('A subclasse deve implementar currentValue().');
  }

  targetValue() {
    throw new Error('A subclasse deve implementar targetValue().');
  }

  progressLabel() {
    throw new Error('A subclasse deve implementar progressLabel().');
  }

  progress(metrics) {
    // Método herdado: chama implementações diferentes conforme o objeto real.
    return Math.min(
      100,
      Math.max(0, Math.floor((this.currentValue(metrics) / this.targetValue()) * 100)),
    );
  }

  status(metrics, today) {
    if (this.currentValue(metrics) >= this.targetValue()) return 'completed';
    if (this.#data.end_on < today) return 'overdue';
    if (this.#data.start_on > today) return 'scheduled';
    return 'active';
  }

  toRecord() {
    return { ...this.#data };
  }
}
