export const localDay = (now, timezone) => new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date(now));

// Locate the next local midnight, including 23/25-hour daylight-saving days.
export function dayWindow(now, timezone) {
  const date = localDay(now, timezone);
  let low = now, high = now + 36 * 60 * 60 * 1000;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (localDay(middle, timezone) === date) low = middle;
    else high = middle;
  }
  return { date, resetsAt: high };
}
