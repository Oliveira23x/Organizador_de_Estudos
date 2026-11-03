import { ValidationError, optionalText, requireInteger } from './ValidationError.js';
import { isISODate, toISODate } from '../utils/dates.js';

export class StudySession {
  #data;

  constructor(
    { id = null, subject_id, topic = '', minutes, studied_on, notes = '' },
    today = toISODate(),
  ) {
    this.#data = {
      id,
      subject_id: requireInteger(
        subject_id,
        1,
        Number.MAX_SAFE_INTEGER,
        'Disciplina',
        'subject_id',
      ),
      topic: optionalText(topic, 100, 'Conteúdo', 'topic'),
      minutes: requireInteger(minutes, 1, 1440, 'Duração em minutos', 'minutes'),
      studied_on,
      notes: optionalText(notes, 500, 'Anotações', 'notes'),
    };
    this.validate(today);
  }

  validate(today = toISODate()) {
    if (this.#data.topic.length < 2)
      throw new ValidationError(
        'Descreva o conteúdo estudado com pelo menos 2 caracteres.',
        'topic',
      );
    if (!isISODate(this.#data.studied_on))
      throw new ValidationError('Informe uma data válida no formato DD/MM/AAAA.', 'studied_on');
    if (this.#data.studied_on > today)
      throw new ValidationError('A sessão de estudo não pode estar no futuro.', 'studied_on');
    return true;
  }

  get hours() {
    return this.#data.minutes / 60;
  }
  toRecord() {
    return { ...this.#data };
  }
}
