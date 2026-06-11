import Season from '../models/Season.js';
import User from '../models/User.js';
import { finalizePendingWeeks } from '../services/gameService.js';

const SEASON_LENGTH_DAYS = 70; // ~10 weeks

// GET /api/seasons/current
// Returns the active season, creating Season 1 automatically on first call.
export const getCurrentSeason = async (req, res, next) => {
  try {
    let season = await Season.findOne({ isActive: true });

    if (!season) {
      const count = await Season.countDocuments();
      const start = new Date();
      const end = new Date(start.getTime() + SEASON_LENGTH_DAYS * 24 * 60 * 60 * 1000);
      season = await Season.create({
        number: count + 1,
        name: `Season ${count + 1}: Ignition`,
        startDate: start,
        endDate: end,
        isActive: true,
      });
    }

    const msLeft = new Date(season.endDate) - new Date();
    res.json({
      season,
      daysRemaining: Math.max(Math.ceil(msLeft / (24 * 60 * 60 * 1000)), 0),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/seasons/recalculate-weekly-ranks
// Finalizes every ended-but-unprocessed week for ALL users.
// Normally this happens lazily per user on app load (see getMe), but this
// endpoint exists to force a full pass - e.g. before showing season results.
// Idempotent: already-finalized weeks are skipped via the unique index.
export const recalculateWeeklyRanks = async (req, res, next) => {
  try {
    const users = await User.find({});
    let usersProcessed = 0;
    let weeksFinalized = 0;

    for (const user of users) {
      const results = await finalizePendingWeeks(user);
      usersProcessed++;
      weeksFinalized += results.length;
    }

    res.json({ message: 'Weekly ranks recalculated', usersProcessed, weeksFinalized });
  } catch (err) {
    next(err);
  }
};
