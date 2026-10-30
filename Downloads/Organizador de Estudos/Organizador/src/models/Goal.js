import { ValidationError, optionalText, requireInteger } from './ValidationError.js';
import { isISODate } from '../utils/dates.js';

export class Goal {
  #data;

  constructor({ id = null, subject_id = null, title = '', target_minutes, start_on, end_on }) {
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
    };
    this.validate();
  }

  validate() {
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

  progress(studiedMinutes) {
    return Math.min(
      100,
      Math.max(0, Math.floor((studiedMinutes / this.#data.target_minutes) * 100)),
    );
  }

  status(studiedMinutes, today) {
    if (studiedMinutes >= this.#data.target_minutes) return 'completed';
    if (this.#data.end_on < today) return 'overdue';
    if (this.#data.start_on > today) return 'scheduled';
    return 'active';
  }

  toRecord() {
    return { ...this.#data };
  }
}
