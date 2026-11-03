import { Goal } from '../src/models/Goal.js';
import { TimeGoal } from '../src/models/TimeGoal.js';
import { SessionGoal } from '../src/models/SessionGoal.js';

const common = {
  title: 'Aprender JavaScript',
  target_minutes: 120,
  target_sessions: 4,
  start_on: '2026-01-01',
  end_on: '2026-12-31',
};
const goals = [new TimeGoal(common), new SessionGoal(common)];
const metrics = { studied_minutes: 60, studied_sessions: 1 };
for (const goal of goals) {
  console.log(`${goal.constructor.name} herda de Goal: ${goal instanceof Goal}`);
  console.log(`${goal.progressLabel(metrics)} -> ${goal.progress(metrics)}%`);
}

console.log('O método progress() é herdado da mesma classe base:', goals[0].progress === goals[1].progress);
console.log('Cada subclasse sobrescreve currentValue(), targetValue() e progressLabel().');
