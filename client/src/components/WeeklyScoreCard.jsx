import { WEEKLY_COMPONENTS } from '../lib/game';

// Live breakdown of this week's performance score - the number that will
// move your rating when the week ends (Sunday night).
export default function WeeklyScoreCard({ data }) {
  if (!data) return null;
  const { weeklyScore, expectedScore, projectedChange, activeDays } = data;

  const changeColor =
    projectedChange > 0 ? 'text-emerald-400' : projectedChange < 0 ? 'text-danger' : 'text-slate-400';
  const changeText =
    projectedChange > 0 ? `+${projectedChange}` : `${projectedChange}`;

  return (
    <div className="glass p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">This week</h2>
          <p className="mt-1 text-xs text-slate-500">
            {activeDays} active day{activeDays === 1 ? '' : 's'} · rating updates when the week ends
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-3xl font-bold text-white">
            {weeklyScore}
            <span className="text-sm font-medium text-slate-500"> / 100</span>
          </p>
          <p className="text-xs text-slate-500">
            expected {expectedScore} ·{' '}
            <span className={`font-semibold ${changeColor}`} title="Projected rating change if the week ended now">
              {changeText} rating
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {WEEKLY_COMPONENTS.map((c) => {
          const value = data[c.key] ?? 0;
          return (
            <div key={c.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-slate-300">
                  {c.label} <span className="text-slate-600">· {c.weight}%</span>
                </span>
                <span className="text-slate-500">{value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-neon transition-all duration-500"
                  style={{ width: `${Math.min(value, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
