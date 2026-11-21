import { weekStartOf } from './dates.js';

// Repeatable missions return tomorrow; they never allow multiple checks today.
export function missionPeriod(task, today) {
  if (task.repeatable || task.frequency === 'daily') return { start: today, key: today, message: 'Already completed today. Create another mission to keep going.' };
  if (task.frequency === 'weekly') return { start: weekStartOf(today), key: weekStartOf(today), message: 'Already completed this week' };
  return { start: null, key: 'once', message: 'Already completed' };
}
export const missionDone = (task, latestDate, today) => !!latestDate && (!missionPeriod(task, today).start || latestDate >= missionPeriod(task, today).start);
