import DailyStats from '../models/DailyStats.js';
import WeeklyStats from '../models/WeeklyStats.js';
import {
  WEEKLY_WEIGHTS,
  WEEKLY_XP_TARGET,
  WEEKLY_FOCUS_TARGET,
  isActiveDay,
  calculateExpectedScore,
  kFactorFor,
  calculateRatingChange,
  rankForRating,
} from '../utils/gameConfig.js';
import { weekStartString, weekDates, weekKeyFor, shiftDate, dateString, weekStartOf } from '../utils/dates.js';

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const round1 = (n) => Math.round(n * 10) / 10;

// =====================================================================
// calculateWeeklyScore: turn one Monday-Sunday week of DailyStats into
// the five 0-100 components and the weighted weeklyScore.
// =====================================================================
export const calculateWeeklyScore = async (user, weekStartStr) => {
  const dates = weekDates(weekStartStr);
  const days = await DailyStats.find({ user: user._id, date: { $in: dates } });

  const activeDays = days.filter(isActiveDay).length;
  const totalXp = days.reduce((sum, d) => sum + d.xpEarned, 0);
  const completedTasks = days.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const focusMinutes = days.reduce((sum, d) => sum + (d.focusMinutes || 0), 0);

  // 1. Consistency (40%): how many days had meaningful work. The heaviest
  //    weight on purpose - it's the one thing you cannot fake in one sitting.
  const consistencyScore = round1((activeDays / 7) * 100);

  // 2. Difficulty-adjusted XP (25%): XP vs a strong-week target. The daily
  //    and per-difficulty caps have ALREADY filtered out spam XP upstream.
  const difficultyAdjustedXpScore = round1(clamp((totalXp / WEEKLY_XP_TARGET) * 100, 0, 100));

  // 3. Focus (15%): tracked focus minutes vs target. Safely 0 if unused.
  const focusScore = round1(clamp((focusMinutes / WEEKLY_FOCUS_TARGET) * 100, 0, 100));

  // 4. Improvement (10%): this week's XP vs last week's. 50 = same as last
  //    week (or no history), 100 = doubled it, 0 = collapsed.
  const prevDates = weekDates(shiftDate(weekStartStr, -7));
  const prevDays = await DailyStats.find({ user: user._id, date: { $in: prevDates } });
  const prevXp = prevDays.reduce((sum, d) => sum + d.xpEarned, 0);
  const improvementScore =
    prevDays.length === 0
      ? 50
      : round1(clamp(50 + ((totalXp - prevXp) / Math.max(prevXp, 1)) * 50, 0, 100));

  // 5. Streak (10%): current streak, maxed at 30 days so it supports
  //    consistency without overpowering it.
  const streakScore = round1(clamp((user.currentStreak / 30) * 100, 0, 100));

  const weeklyScore = round1(
    consistencyScore * WEEKLY_WEIGHTS.consistency +
      difficultyAdjustedXpScore * WEEKLY_WEIGHTS.xp +
      focusScore * WEEKLY_WEIGHTS.focus +
      improvementScore * WEEKLY_WEIGHTS.improvement +
      streakScore * WEEKLY_WEIGHTS.streak
  );

  return {
    weekKey: weekKeyFor(weekStartStr),
    weekStart: weekStartStr,
    activeDays,
    totalXp,
    completedTasks,
    focusMinutes,
    consistencyScore,
    difficultyAdjustedXpScore,
    focusScore,
    improvementScore,
    streakScore,
    weeklyScore,
  };
};

// =====================================================================
// refreshLiveWeeklySnapshot: recompute the CURRENT (unfinished) week's
// score and store it on the user document. Called after every completion
// so the weekly leaderboard can sort users without heavy aggregation.
// Mutates user, does NOT save - the caller saves.
// =====================================================================
export const refreshLiveWeeklySnapshot = async (user) => {
  const weekStart = weekStartString(user.timezone || 'UTC');
  const stats = await calculateWeeklyScore(user, weekStart);
  user.weeklyScore = stats.weeklyScore;
  user.weeklyXP = stats.totalXp;
  user.weeklyActiveDays = stats.activeDays;
  user.weeklyWeekKey = stats.weekKey;
  return stats;
};

// =====================================================================
// finalizePendingWeeks: the lazy "end of week" job.
// There is no cron in the MVP, so whenever a user loads the app we check:
// are there fully-ended weeks since they joined that were never finalized?
// For each one (oldest first): compute the weekly score, compare with the
// expected score for their rating, and apply the rating change.
// Idempotent: the unique (user, weekKey) index makes double-runs harmless.
// =====================================================================
export const finalizePendingWeeks = async (user) => {
  const tz = user.timezone || 'UTC';
  const currentWeekStart = weekStartString(tz); // this week is still in progress

  // Start from the week after the last finalized one,
  // or from the week the account was created.
  const lastFinalized = await WeeklyStats.findOne({ user: user._id }).sort('-weekStart');
  let cursor = lastFinalized
    ? shiftDate(lastFinalized.weekStart, 7)
    : weekStartOf(dateString(user.createdAt, tz));

  let finalizedWeeks = await WeeklyStats.countDocuments({ user: user._id });
  const results = [];
  let guard = 0;

  while (cursor < currentWeekStart && guard < 12) {
    guard++;

    const stats = await calculateWeeklyScore(user, cursor);
    const expectedScore = round1(calculateExpectedScore(user.rankRating));
    const kFactor = kFactorFor(finalizedWeeks, user.rankRating);
    const ratingChange = calculateRatingChange(stats.weeklyScore, expectedScore, kFactor);

    user.rankRating = Math.max(user.rankRating + ratingChange, 0);
    user.rank = rankForRating(user.rankRating);
    user.seasonScore = round1(user.seasonScore + stats.weeklyScore);

    try {
      await WeeklyStats.create({
        user: user._id,
        ...stats,
        expectedScore,
        kFactor,
        ratingChange,
        ratingAfter: user.rankRating,
      });
      results.push({ weekKey: stats.weekKey, weeklyScore: stats.weeklyScore, ratingChange });
      finalizedWeeks++;
    } catch (err) {
      if (err.code !== 11000) throw err; // 11000 = already finalized, skip quietly
    }

    cursor = shiftDate(cursor, 7);
  }

  // Keep the display rank honest even when nothing was finalized
  // (covers users created before the rating system existed).
  const correctRank = rankForRating(user.rankRating);
  if (results.length > 0 || user.rank !== correctRank) {
    user.rank = correctRank;
    await user.save();
  }

  return results;
};
