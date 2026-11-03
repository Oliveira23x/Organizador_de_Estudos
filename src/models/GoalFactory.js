import { TimeGoal } from './TimeGoal.js';
import { SessionGoal } from './SessionGoal.js';
import { ValidationError } from './ValidationError.js';

export function createGoal(record) {
  if ((record.goal_type || 'time') === 'time') return new TimeGoal(record);
  if (record.goal_type === 'sessions') return new SessionGoal(record);
  throw new ValidationError('Selecione um tipo de meta válido.', 'goal_type');
}

export function presentGoal(record, today) {
  const goal = createGoal(record);
  // Polimorfismo real: a mesma chamada calcula minutos ou quantidade de sessões.
  return {
    ...record,
    progress: goal.progress(record),
    status: goal.status(record, today),
    progress_label: goal.progressLabel(record),
  };
}
