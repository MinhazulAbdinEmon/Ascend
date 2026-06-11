import Completion from '../models/Completion.js';
import DailyStats from '../models/DailyStats.js';
import WeeklyStats from '../models/WeeklyStats.js';
import Skill from '../models/Skill.js';
import { DAILY_XP_CAP, calculateExpectedScore, kFactorFor, calculateRatingChange } from '../utils/gameConfig.js';
import { todayString, daysAgoString, weekStartString } from '../utils/dates.js';
import { toSafeUser } from '../utils/safeUser.js';
import { calculateWeeklyScore } from '../services/gameService.js';

// GET /api/stats/dashboard
// Everything the dashboard needs about TODAY in one round-trip.
export const getDashboardStats = async (req, res, next) => {
  try {
    const tz = req.user.timezone || 'UTC';
    const today = todayString(tz);

    const stats = await DailyStats.findOne({ user: req.user._id, date: today });
    const completions = await Completion.find({ user: req.user._id, date: today }).select('task');

    res.json({
      today: {
        date: today,
        tasksCompleted: stats?.tasksCompleted || 0,
        xpEarned: stats?.xpEarned || 0,
        xpCap: DAILY_XP_CAP,
      },
      // Which tasks are already done today (the UI uses this to draw checkmarks).
      completedTaskIds: [...new Set(completions.map((c) => c.task.toString()))],
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/heatmap?days=365
// Returns one entry per ACTIVE day - days with zero completions simply
// have no document, and the frontend renders them as empty squares.
export const getHeatmap = async (req, res, next) => {
  try {
    const tz = req.user.timezone || 'UTC';
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 365, 1), 366);
    const start = daysAgoString(days - 1, tz);

    const entries = await DailyStats.find({ user: req.user._id, date: { $gte: start } })
      .select('date tasksCompleted xpEarned intensity')
      .sort('date');

    res.json({
      start,
      end: todayString(tz),
      days: entries.map((e) => ({
        date: e.date,
        count: e.tasksCompleted,
        xp: e.xpEarned,
        intensity: e.intensity,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/weekly
// The CURRENT week's live score breakdown + what it would do to the rating,
// plus the last finalized week for comparison.
export const getWeeklyStats = async (req, res, next) => {
  try {
    const user = req.user;
    const weekStart = weekStartString(user.timezone || 'UTC');

    const live = await calculateWeeklyScore(user, weekStart);
    const finalizedWeeks = await WeeklyStats.countDocuments({ user: user._id });
    const expectedScore = Math.round(calculateExpectedScore(user.rankRating) * 10) / 10;
    const kFactor = kFactorFor(finalizedWeeks, user.rankRating);

    const lastWeek = await WeeklyStats.findOne({ user: user._id }).sort('-weekStart');

    res.json({
      live: {
        ...live,
        expectedScore,
        kFactor,
        // What the rating would change by if the week ended right now.
        projectedChange: calculateRatingChange(live.weeklyScore, expectedScore, kFactor),
      },
      lastWeek,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/profile
// Lifetime stats for the profile page.
export const getProfileStats = async (req, res, next) => {
  try {
    const [totalCompletions, skills] = await Promise.all([
      Completion.countDocuments({ user: req.user._id }),
      Skill.find({ user: req.user._id }).sort('-totalXP').select('name color icon totalXP'),
    ]);

    res.json({
      user: toSafeUser(req.user),
      totalCompletions,
      skills,
      bestSkill: skills[0] || null, // skills are sorted by XP, so the first is the best
    });
  } catch (err) {
    next(err);
  }
};
