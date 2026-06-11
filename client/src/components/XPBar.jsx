import { getLevelProgress } from '../lib/game';

// XP progress bar toward the next lifetime level.
// The curve mirrors the server: level L is reached at 100 * (L-1)^2 XP.
export default function XPBar({ totalXP = 0 }) {
  const { level, currentLevelXp, neededForNext, progress } = getLevelProgress(totalXP);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="font-semibold text-slate-300">Level {level}</span>
        <span className="text-slate-500">
          {currentLevelXp} / {neededForNext} XP to level {level + 1}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon to-violet transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
