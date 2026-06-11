import User from '../models/User.js';
import { todayString, weekKeyFor } from '../utils/dates.js';

// Fields safe to show publicly on a leaderboard (no emails!).
const PUBLIC_FIELDS = 'username rank rankRating weeklyScore weeklyXP weeklyActiveDays seasonScore seasonXP currentStreak';

const withYouFlag = (entries, meId) =>
  entries.map((u, i) => ({
    position: i + 1,
    id: u._id,
    username: u.username,
    rank: u.rank,
    rankRating: u.rankRating,
    weeklyScore: u.weeklyScore,
    weeklyXP: u.weeklyXP,
    weeklyActiveDays: u.weeklyActiveDays,
    seasonScore: u.seasonScore,
    seasonXP: u.seasonXP,
    currentStreak: u.currentStreak,
    isYou: u._id.toString() === meId.toString(),
  }));

// GET /api/leaderboard/weekly
// Sorted by the live weekly score. Users whose snapshot is from an older
// week simply haven't done anything yet this week - they're filtered out.
export const getWeeklyLeaderboard = async (req, res, next) => {
  try {
    const currentWeekKey = weekKeyFor(todayString('UTC'));

    const entries = await User.find({ weeklyWeekKey: currentWeekKey })
      .select(PUBLIC_FIELDS)
      .sort('-weeklyScore -weeklyXP')
      .limit(50);

    res.json({
      weekKey: currentWeekKey,
      entries: withYouFlag(entries, req.user._id),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/leaderboard/season
// The actual ladder: sorted by competitive rating.
export const getSeasonLeaderboard = async (req, res, next) => {
  try {
    const entries = await User.find({})
      .select(PUBLIC_FIELDS)
      .sort('-rankRating -seasonXP')
      .limit(50);

    res.json({ entries: withYouFlag(entries, req.user._id) });
  } catch (err) {
    next(err);
  }
};
