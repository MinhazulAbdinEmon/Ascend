import { RANKS, rankProgress } from '../lib/game';
import RankBadge from './RankBadge';

// The full rank ladder, Sovereign at the top - so you always see
// where you are and what's left to climb.
export default function RankLadder({ rankRating = 1000 }) {
  const { current, next, index, progress } = rankProgress(rankRating);

  return (
    <div className="glass p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-white">The ladder</h2>
        <span className="text-xs text-slate-500">
          {next
            ? `${next.minRating - rankRating} rating to ${next.name}`
            : 'Top of the ladder. Stay there.'}
        </span>
      </div>

      {/* Progress within the current rank */}
      {next && (
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs text-slate-500">
            <span>
              {current.name} · {rankRating} rating
            </span>
            <span>
              {next.name} at {next.minRating}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet to-neon transition-all duration-700"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* All ranks, top rank first */}
      <ul className="mt-5 space-y-1.5">
        {[...RANKS].reverse().map((rank) => {
          const i = RANKS.indexOf(rank);
          const isCurrent = i === index;
          const achieved = i < index;

          return (
            <li
              key={rank.name}
              className={`flex items-center justify-between rounded-xl border px-4 py-2.5 transition ${
                isCurrent
                  ? 'border-neon/40 bg-neon/[0.06]'
                  : achieved
                    ? 'border-white/10 bg-white/[0.03]'
                    : 'border-white/5 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <RankBadge rank={rank.name} />
                {isCurrent && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-neon">
                    ← You are here
                  </span>
                )}
                {achieved && <span className="text-xs text-emerald-400">✓</span>}
              </div>
              <span className="text-xs font-medium text-slate-500">
                {rank.minRating === 0 ? 'Below 900' : `${rank.minRating.toLocaleString()}+`}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        Your rating moves once a week, like a ranked ladder: a weekly performance score (consistency
        is 40% of it) is compared against what's expected at your rating. Beat expectations and you
        climb; coast and you slide. One huge day can't buy a rank — showing up all week can.
      </p>
    </div>
  );
}
