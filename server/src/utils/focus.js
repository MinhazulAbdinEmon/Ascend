import { dateString, shiftDate } from './dates.js';

export const elapsedSeconds = (session, now = Date.now()) => session.segments.reduce(
  (sum, segment) => sum + Math.max(0, (new Date(segment.end || now) - new Date(segment.start)) / 1000), 0
);

// Clamp the last segment to the planned deadline, even after sleep or a closed tab.
export function settleSession(session, now = Date.now()) {
  if (session.status !== 'running' || elapsedSeconds(session, now) < session.minutes * 60) return false;
  const last = session.segments.at(-1);
  const previous = elapsedSeconds({ segments: session.segments.slice(0, -1) }, now);
  last.end = new Date(new Date(last.start).getTime() + (session.minutes * 60 - previous) * 1000);
  session.completedAt = last.end;
  session.status = 'completed';
  return true;
}

export function productivitySummary(sessions, endDate, count, timezone) {
  const days = Array.from({ length: count }, (_, i) => ({ date: shiftDate(endDate, i - count + 1), seconds: 0, sessions: 0 }));
  const byDate = new Map(days.map(day => [day.date, day]));
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, seconds: 0 }));
  const hourFormat = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', hourCycle: 'h23' });
  let completedSessions = 0;
  for (const session of sessions) {
    if (session.kind !== 'focus' || session.status !== 'completed') continue;
    const touched = new Set();
    for (const segment of session.segments) {
      // Minute boundaries handle midnight, DST and fractional-offset timezones.
      for (let cursor = +new Date(segment.start), end = +new Date(segment.end); cursor < end;) {
        const next = Math.min(end, (Math.floor(cursor / 60000) + 1) * 60000);
        const date = dateString(new Date(cursor), timezone);
        if (byDate.has(date)) {
          const seconds = (next - cursor) / 1000;
          byDate.get(date).seconds += seconds;
          hours[Number(hourFormat.format(new Date(cursor)))].seconds += seconds;
          touched.add(date);
        }
        cursor = next;
      }
    }
    if (touched.size) completedSessions++;
    for (const date of touched) byDate.get(date).sessions++;
  }
  return { days, hours, completedSessions, totalSeconds: days.reduce((sum, day) => sum + day.seconds, 0) };
}
