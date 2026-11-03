import { Goal } from './Goal.js';
import { formatMinutes } from '../utils/dates.js';

// Herança: compartilha validação, encapsulamento, progress() e status() de Goal.
export class TimeGoal extends Goal {
  constructor(data) {
    super({ ...data, goal_type: 'time' });
  }

  // Sobrescritas: o serviço chama a mesma interface sem conhecer o tipo concreto.
  currentValue(metrics) {
    return typeof metrics === 'number' ? metrics : Number(metrics?.studied_minutes || 0);
  }
  targetValue() {
    return this.toRecord().target_minutes;
  }
  progressLabel(metrics) {
    return `${formatMinutes(this.currentValue(metrics))} de ${formatMinutes(this.targetValue())}`;
  }
}
