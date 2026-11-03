import { optionalText, requireInteger, ValidationError } from './ValidationError.js';

export class FocusTimer {
  #data;
  constructor({
    subject_id,
    topic = '',
    target_minutes = 25,
    accumulated_seconds = 0,
    started_at_ms = null,
    status = 'paused',
  }) {
    this.#data = {
      subject_id: requireInteger(
        subject_id,
        1,
        Number.MAX_SAFE_INTEGER,
        'Disciplina',
        'subject_id',
      ),
      topic: optionalText(topic, 100, 'Conteúdo', 'topic'),
      target_minutes: requireInteger(
        target_minutes,
        1,
        180,
        'Duração do foco em minutos',
        'target_minutes',
      ),
      accumulated_seconds: requireInteger(
        accumulated_seconds,
        0,
        10800,
        'Tempo acumulado',
        'accumulated_seconds',
      ),
      started_at_ms,
      status,
    };
    if (this.#data.topic.length < 2)
      throw new ValidationError(
        'Descreva o conteúdo do foco com pelo menos 2 caracteres.',
        'topic',
      );
    if (!['running', 'paused'].includes(status))
      throw new ValidationError('Situação inválida do cronômetro.');
    if (status === 'running' && (!Number.isSafeInteger(started_at_ms) || started_at_ms < 0))
      throw new ValidationError('O início do cronômetro é inválido.');
  }
  elapsedSeconds(now = Date.now()) {
    const running =
      this.#data.status === 'running'
        ? Math.max(0, Math.floor((now - this.#data.started_at_ms) / 1000))
        : 0;
    return Math.min(this.#data.target_minutes * 60, this.#data.accumulated_seconds + running);
  }
  remainingSeconds(now = Date.now()) {
    return this.#data.target_minutes * 60 - this.elapsedSeconds(now);
  }
  pause(now = Date.now()) {
    return new FocusTimer({
      ...this.#data,
      accumulated_seconds: this.elapsedSeconds(now),
      started_at_ms: null,
      status: 'paused',
    });
  }
  resume(now = Date.now()) {
    if (this.#data.status === 'running') return this;
    return new FocusTimer({ ...this.#data, started_at_ms: now, status: 'running' });
  }
  toRecord() {
    return { ...this.#data };
  }
}
