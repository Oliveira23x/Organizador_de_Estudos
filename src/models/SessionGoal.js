import { Goal } from './Goal.js';

export class SessionGoal extends Goal {
  constructor(data) {
    super({ ...data, goal_type: 'sessions', target_minutes: 1 });
  }

  currentValue(metrics) {
    return typeof metrics === 'number' ? metrics : Number(metrics?.studied_sessions || 0);
  }
  targetValue() {
    return this.toRecord().target_sessions;
  }
  progressLabel(metrics) {
    return `${this.currentValue(metrics)} de ${this.targetValue()} sessões`;
  }
}
