// Small lifetime-level chip. Level only ever goes up - it's the
// permanent record, separate from the competitive rank.
export default function LevelBadge({ level = 1, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-bold tracking-wider text-slate-200 ${className}`}
      title="Lifetime level - never goes down"
    >
      LVL {level}
    </span>
  );
}
