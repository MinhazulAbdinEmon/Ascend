import { RANK_COLORS } from '../lib/game';

// Color-coded chip showing a rank.
export default function RankBadge({ rank = 'Rookie', className = '' }) {
  const colors = RANK_COLORS[rank] || RANK_COLORS.Rookie;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colors} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {rank}
    </span>
  );
}
