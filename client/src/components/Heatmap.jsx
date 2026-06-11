// GitHub-style contribution heatmap.
// Props:
//   days  - [{ date: 'YYYY-MM-DD', count, xp, intensity }] from /api/stats/heatmap
//   weeks - how many columns (weeks) to draw. 52 = full year, 26 = dashboard preview.
const LEVEL_COLORS = [
  'rgba(255,255,255,0.05)', // 0 - empty
  'rgba(34,211,238,0.25)',  // 1 - low
  'rgba(34,211,238,0.55)',  // 2 - medium
  '#22d3ee',                // 3 - high
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Local 'YYYY-MM-DD' key for a Date (toISOString would shift the day in some timezones).
const toKey = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function Heatmap({ days = [], weeks = 52 }) {
  const byDate = new Map(days.map((d) => [d.date, d]));

  // The grid ends today and starts on the Sunday `weeks` ago (GitHub layout:
  // columns are weeks, rows are Sun..Sat, last column may be partial).
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1));
  start.setDate(start.getDate() - start.getDay()); // back up to a Sunday

  const columns = [];
  const cursor = new Date(start);
  while (cursor <= today) {
    const col = [];
    for (let row = 0; row < 7; row++) {
      if (cursor > today) {
        col.push(null); // future cell in the partial last week
      } else {
        const key = toKey(cursor);
        col.push({ key, ...(byDate.get(key) || { count: 0, xp: 0, intensity: 0 }) });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    columns.push(col);
  }

  // Month label above the first column of each new month.
  let prevMonth = -1;
  const monthLabels = columns.map((col) => {
    const firstDate = new Date(`${col[0].key}T00:00:00`);
    const month = firstDate.getMonth();
    const label = month !== prevMonth ? MONTHS[month] : '';
    prevMonth = month;
    return label;
  });

  return (
    <div className="overflow-x-auto pb-1">
      <div className="inline-block">
        {/* Month labels */}
        <div className="mb-1 flex gap-1 text-[9px] leading-none text-slate-500">
          {monthLabels.map((label, i) => (
            <div key={i} className="w-3 overflow-visible whitespace-nowrap">
              {label}
            </div>
          ))}
        </div>

        {/* The grid */}
        <div className="flex gap-1">
          {columns.map((col, c) => (
            <div key={c} className="flex flex-col gap-1">
              {col.map((cell, r) =>
                cell === null ? (
                  <div key={r} className="h-3 w-3" />
                ) : (
                  <div
                    key={cell.key}
                    title={`${cell.key} — ${cell.count} mission${cell.count === 1 ? '' : 's'}, ${cell.xp} XP`}
                    className="h-3 w-3 rounded-[3px] transition hover:ring-1 hover:ring-white/40"
                    style={{ background: LEVEL_COLORS[cell.intensity] || LEVEL_COLORS[0] }}
                  />
                )
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
          Less
          {LEVEL_COLORS.map((color) => (
            <span key={color} className="h-3 w-3 rounded-[3px]" style={{ background: color }} />
          ))}
          More
        </div>
      </div>
    </div>
  );
}
