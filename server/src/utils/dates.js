// All "what day/week is it?" logic lives here.
// Days are stored as 'YYYY-MM-DD' strings computed in the USER's timezone,
// weeks run Monday-Sunday and are keyed like '2026-W24' (ISO week).

// 'en-CA' formats dates as YYYY-MM-DD, exactly the key format we store.
export const dateString = (date, timezone = 'UTC') =>
  new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(date);

export const todayString = (timezone = 'UTC') => dateString(new Date(), timezone);

export const daysAgoString = (n, timezone = 'UTC') =>
  dateString(new Date(Date.now() - n * 24 * 60 * 60 * 1000), timezone);

// Shift a 'YYYY-MM-DD' string by n days (date-only math, no timezone surprises).
export const shiftDate = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

// Monday of the week containing this date.
export const weekStartOf = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const daysSinceMonday = (d.getUTCDay() + 6) % 7; // getUTCDay: 0=Sunday
  return shiftDate(dateStr, -daysSinceMonday);
};

// Monday of the CURRENT week in the user's timezone.
export const weekStartString = (timezone = 'UTC') => weekStartOf(todayString(timezone));

// The 7 date strings of a week, given its Monday.
export const weekDates = (weekStartStr) =>
  Array.from({ length: 7 }, (_, i) => shiftDate(weekStartStr, i));

// ISO week key like '2026-W24' (sortable as a string within a year).
export const weekKeyFor = (dateStr) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = (d.getUTCDay() + 6) % 7; // 0=Monday
  d.setUTCDate(d.getUTCDate() - day + 3); // the Thursday decides the ISO year
  const isoYear = d.getUTCFullYear();
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const week = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7);
  return `${isoYear}-W${String(week).padStart(2, '0')}`;
};
