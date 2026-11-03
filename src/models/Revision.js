import { isISODate } from '../utils/dates.js';
import { ValidationError, optionalText, requireInteger } from './ValidationError.js';

export class Revision {
  #data;
  constructor({
    id = null,
    subject_id,
    title = '',
    planned_on,
    planned_minutes,
    priority = 'normal',
    notes = '',
  }) {
    this.#data = {
      id,
      subject_id: requireInteger(
        subject_id,
        1,
        Number.MAX_SAFE_INTEGER,
        'Disciplina',
        'subject_id',
      ),
      title: optionalText(title, 100, 'Conteúdo da revisão', 'title'),
      planned_on,
      planned_minutes: requireInteger(
        planned_minutes,
        1,
        1440,
        'Duração prevista',
        'planned_minutes',
      ),
      priority,
      notes: optionalText(notes, 500, 'Anotações', 'notes'),
    };
    this.validate();
  }
  validate() {
    if (this.#data.title.length < 2)
      throw new ValidationError(
        'Informe o conteúdo da revisão com pelo menos 2 caracteres.',
        'title',
      );
    if (!isISODate(this.#data.planned_on))
      throw new ValidationError(
        'Informe uma data válida para a revisão: DD/MM/AAAA.',
        'planned_on',
      );
    if (!['high', 'normal', 'low'].includes(this.#data.priority))
      throw new ValidationError('Selecione uma prioridade válida.', 'priority');
    return true;
  }
  toRecord() {
    return { ...this.#data };
  }
}
