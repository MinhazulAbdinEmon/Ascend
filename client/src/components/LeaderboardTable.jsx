import RankBadge from './RankBadge';

// Shared table for the weekly and season leaderboards.
// `mode` decides which columns matter.
export default function LeaderboardTable({ entries, mode = 'weekly' }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="glass flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm font-medium text-slate-300">Nobody on the board yet</p>
        <p className="mt-1 text-xs text-slate-500">Complete a mission to claim the top spot.</p>
      </div>
    );
  }

  const medal = (pos) => (pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `#${pos}`);

  return (
    <div className="glass overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-edge text-[11px] uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Player</th>
            <th className="px-4 py-3 font-semibold">Rank</th>
            <th className="px-4 py-3 font-semibold text-right">Rating</th>
            {mode === 'weekly' ? (
              <>
                <th className="px-4 py-3 font-semibold text-right">Week score</th>
                <th className="px-4 py-3 font-semibold text-right">Active days</th>
                <th className="px-4 py-3 font-semibold text-right">Week XP</th>
              </>
            ) : (
              <>
                <th className="px-4 py-3 font-semibold text-right">Season score</th>
                <th className="px-4 py-3 font-semibold text-right">Season XP</th>
              </>
            )}
            <th className="px-4 py-3 font-semibold text-right">Streak</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={e.id}
              className={`border-b border-white/5 last:border-0 ${
                e.isYou ? 'bg-neon/[0.06]' : 'hover:bg-white/[0.02]'
              }`}
            >
              <td className="px-4 py-3 font-semibold text-slate-400">{medal(e.position)}</td>
              <td className="px-4 py-3 font-medium text-slate-100">
                {e.username}
                {e.isYou && <span className="ml-2 text-[10px] font-bold uppercase text-neon">You</span>}
              </td>
              <td className="px-4 py-3">
                <RankBadge rank={e.rank} />
              </td>
              <td className="px-4 py-3 text-right font-semibold text-violet">{e.rankRating}</td>
              {mode === 'weekly' ? (
                <>
                  <td className="px-4 py-3 text-right font-semibold text-white">{e.weeklyScore}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{e.weeklyActiveDays}/7</td>
                  <td className="px-4 py-3 text-right text-neon">{e.weeklyXP}</td>
                </>
              ) : (
                <>
                  <td className="px-4 py-3 text-right font-semibold text-white">{e.seasonScore}</td>
                  <td className="px-4 py-3 text-right text-neon">{e.seasonXP}</td>
                </>
              )}
              <td className="px-4 py-3 text-right text-ember">🔥 {e.currentStreak}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
