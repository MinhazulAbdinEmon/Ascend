// Display metadata for game values. All numbers MUST mirror
// server/src/utils/gameConfig.js - the server is the source of truth,
// these exist only so the UI can label and draw things.

export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy', xp: 10, classes: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
  { value: 'medium', label: 'Medium', xp: 25, classes: 'text-sky-300 border-sky-500/40 bg-sky-500/10' },
  { value: 'hard', label: 'Hard', xp: 50, classes: 'text-violet border-violet/40 bg-violet/10' },
  { value: 'deepwork', label: 'Deep work', xp: 75, classes: 'text-ember border-ember/40 bg-ember/10' },
];

export const difficultyMeta = (value) =>
  DIFFICULTIES.find((d) => d.value === value) || DIFFICULTIES[0];

export const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'once', label: 'One-time' },
];

// ---------- System 1: lifetime level ----------
// XP required to REACH level L: 100 * (L-1)^2 (everyone starts at level 1).
export const calculateLevel = (totalXp) =>
  Math.floor(Math.sqrt(Math.max(totalXp, 0) / 100)) + 1;

export const getLevelProgress = (totalXp) => {
  const level = calculateLevel(totalXp);
  const floor = 100 * Math.pow(level - 1, 2);
  const next = 100 * Math.pow(level, 2);
  return {
    level,
    currentLevelXp: totalXp - floor,
    neededForNext: next - floor,
    progress: Math.min((totalXp - floor) / (next - floor), 1),
  };
};

// ---------- System 2: competitive rank (rating-based) ----------
export const RANKS = [
  { name: 'Rookie', minRating: 0 },
  { name: 'Grinder', minRating: 900 },
  { name: 'Focused', minRating: 1100 },
  { name: 'Disciplined', minRating: 1300 },
  { name: 'Elite', minRating: 1500 },
  { name: 'Prime', minRating: 1700 },
  { name: 'Spartan', minRating: 1900 },
  { name: 'Sovereign', minRating: 2200 },
];

// Chip colors per rank (shared by RankBadge, RankLadder, LeaderboardTable).
export const RANK_COLORS = {
  Rookie: 'text-slate-300 border-slate-500/40 bg-slate-500/10',
  Grinder: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10',
  Focused: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
  Disciplined: 'text-violet border-violet/40 bg-violet/10',
  Elite: 'text-fuchsia-300 border-fuchsia-500/40 bg-fuchsia-500/10',
  Prime: 'text-neon border-neon/40 bg-neon/10',
  Spartan: 'text-danger border-red-500/50 bg-red-500/10',
  Sovereign: 'text-yellow-300 border-yellow-400/50 bg-yellow-400/10',
};

// Where does `rankRating` put you on the ladder, and how far is the next rank?
export const rankProgress = (rankRating) => {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (rankRating >= RANKS[i].minRating) index = i;
  }
  const current = RANKS[index];
  const next = RANKS[index + 1] || null;
  const progress = next
    ? (rankRating - current.minRating) / (next.minRating - current.minRating)
    : 1;
  return { current, next, index, progress: Math.min(Math.max(progress, 0), 1) };
};

// Weekly score component labels (weights mirror the server).
export const WEEKLY_COMPONENTS = [
  { key: 'consistencyScore', label: 'Consistency', weight: 40, hint: 'active days this week' },
  { key: 'difficultyAdjustedXpScore', label: 'XP earned', weight: 25, hint: 'vs a strong-week target' },
  { key: 'focusScore', label: 'Focus time', weight: 15, hint: 'tracked focus minutes' },
  { key: 'improvementScore', label: 'Improvement', weight: 10, hint: 'vs last week' },
  { key: 'streakScore', label: 'Streak', weight: 10, hint: 'current streak' },
];

// Preset accent colors for skills.
export const SKILL_COLORS = [
  '#22d3ee', '#a78bfa', '#f59e0b', '#34d399',
  '#f87171', '#f472b6', '#facc15', '#60a5fa',
];

// Preset icons for skills (plain emoji keeps it dependency-free).
export const SKILL_ICONS = ['💻', '🏋️', '📚', '✍️', '📈', '🧠', '🗣️', '🎯', '🛌', '🕌'];
