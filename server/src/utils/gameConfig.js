// =====================================================================
// Every game-balance number and pure game-math function lives here.
// Tuning the game = editing this file, never hunting through controllers.
//
// Three SEPARATE progression systems (never mixed):
//   1. Lifetime level  - from totalXP, only goes up, never resets
//   2. Competitive rank - from rankRating, moves up/down WEEKLY, seasonal
//   3. Duel rating      - future Elo for 1v1 duels (see models/DuelRating.js)
// =====================================================================

// ---------- Task XP ----------
export const DIFFICULTY_XP = {
  easy: 10,
  medium: 25,
  hard: 50,
  deepwork: 75,
};

// ---------- Anti-abuse caps ----------
export const DAILY_XP_CAP = 300;

// Per-difficulty XP caps per day (null = no specific cap, daily cap still applies).
// Farming 30 easy tasks gets you at most 60 XP from them.
export const DIFFICULTY_DAILY_CAPS = {
  easy: 60,
  medium: 125,
  hard: 200,
  deepwork: null,
};

// After this many completions in one day, further completions earn half XP.
export const DIMINISHING_AFTER = 6;
export const DIMINISHING_MULTIPLIER = 0.5;

// ---------- XP multipliers (small, capped by the rules above) ----------
export const PROOF_MULTIPLIERS = {
  none: 1.0,
  note: 1.05, // wrote a text note about the work
  image: 1.1, // attached an image link as proof
  link: 1.2, // verifiable link (GitHub commit, LeetCode submission...)
};

export const streakMultiplier = (streak) => {
  if (streak >= 30) return 1.2;
  if (streak >= 14) return 1.15;
  if (streak >= 7) return 1.1;
  if (streak >= 3) return 1.05;
  return 1.0;
};

// ---------- System 1: lifetime level ----------
// XP required to REACH level L: 100 * (L-1)^2  (everyone starts at level 1)
//   level 2 at 100 XP, level 3 at 400, level 4 at 900, level 5 at 1600...
export const calculateLevel = (totalXp) =>
  Math.floor(Math.sqrt(Math.max(totalXp, 0) / 100)) + 1;

export const xpRequiredForLevel = (level) => 100 * Math.pow(level - 1, 2);

export const getXpForNextLevel = (currentLevel) => xpRequiredForLevel(currentLevel + 1);

export const getLevelProgress = (totalXp) => {
  const level = calculateLevel(totalXp);
  const floor = xpRequiredForLevel(level);
  const next = xpRequiredForLevel(level + 1);
  return {
    level,
    currentLevelXp: totalXp - floor,
    neededForNext: next - floor,
    progress: Math.min((totalXp - floor) / (next - floor), 1),
  };
};

// ---------- System 2: competitive rank (Codeforces-inspired) ----------
export const STARTING_RATING = 1000; // every new user starts here -> Grinder

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

export const rankForRating = (rating) => {
  let current = RANKS[0].name;
  for (const rank of RANKS) {
    if (rating >= rank.minRating) current = rank.name;
  }
  return current;
};

// The weekly score a player at this rating is EXPECTED to produce.
// Higher rating -> higher expectations -> harder to keep climbing.
//   1000 -> ~22, 1300 -> ~41, 1500 -> ~53, 1900 -> ~78, capped at 80.
export const calculateExpectedScore = (rating) =>
  Math.min(Math.max((rating - 650) / 16, 15), 80);

// K controls how fast the rating moves.
export const kFactorFor = (finalizedWeeks, rating) => {
  if (finalizedWeeks < 4) return 1.0; // new users settle quickly
  if (rating >= 1900) return 0.3; // top of the ladder moves slowly
  return 0.5;
};

export const calculateRatingChange = (weeklyScore, expectedScore, kFactor) =>
  Math.round((weeklyScore - expectedScore) * kFactor);

// ---------- Weekly score (0-100, computed from a Monday-Sunday week) ----------
export const WEEKLY_WEIGHTS = {
  consistency: 0.4, // active days / 7 - the biggest factor by design
  xp: 0.25, // difficulty-adjusted XP vs a weekly target
  focus: 0.15, // focus minutes vs a weekly target (safe 0 if unused)
  improvement: 0.1, // better week than last week?
  streak: 0.1, // current streak (capped so it can't dominate)
};

export const WEEKLY_XP_TARGET = 1400; // ~200 XP/day average = a strong week
export const WEEKLY_FOCUS_TARGET = 600; // 10 hours of tracked focus = max focus score

// A day counts as "active" for consistency if real work happened,
// not a single 10-XP checkbox.
export const MEANINGFUL_DAY_XP = 20;
export const isActiveDay = (dayStats) =>
  dayStats.xpEarned >= MEANINGFUL_DAY_XP || dayStats.tasksCompleted >= 2;

// ---------- Heatmap ----------
// Intensity is about CONSISTENCY (task count), with XP as a tiebreaker
// so one genuinely heavy task still registers as a medium day.
export const getHeatmapIntensity = (completedTasks, totalXp = 0) => {
  if (completedTasks >= 5) return 3; // high
  if (completedTasks >= 2) return 2; // medium
  if (completedTasks >= 1) return totalXp >= 75 ? 2 : 1; // low (or medium if it was a deep-work day)
  return 0; // empty
};
