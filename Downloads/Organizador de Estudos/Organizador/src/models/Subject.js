import { ValidationError, optionalText } from './ValidationError.js';

export const SUBJECT_COLORS = ['#197568', '#6975C5', '#C9853B', '#BB6688', '#448CB5', '#8B9760'];

export class Subject {
  #id;
  #name;
  #description;
  #color;

  constructor({ id = null, name = '', description = '', color = SUBJECT_COLORS[0] }) {
    this.#id = id;
    this.#name = String(name).trim().replace(/\s+/g, ' ');
    this.#description = optionalText(description, 200, 'Descrição', 'description');
    this.#color = color;
    this.validate();
  }

  validate() {
    if (this.#name.length < 2 || this.#name.length > 60) {
      throw new ValidationError('O nome da disciplina deve ter entre 2 e 60 caracteres.', 'name');
    }
    if (!SUBJECT_COLORS.includes(this.#color))
      throw new ValidationError('Selecione uma cor para a disciplina.', 'color');
    return true;
  }

  get id() {
    return this.#id;
  }
  get name() {
    return this.#name;
  }
  toRecord() {
    return { id: this.#id, name: this.#name, description: this.#description, color: this.#color };
  }
}
