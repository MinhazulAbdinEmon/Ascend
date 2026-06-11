import mongoose from 'mongoose';

// One document per user per FINALIZED week (Monday-Sunday).
// Created when a week ends; stores the score breakdown and the
// rating change that was applied. This is the user's competitive history.
const weeklyStatsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekKey: { type: String, required: true }, // ISO week, e.g. '2026-W24'
    weekStart: { type: String, required: true }, // the Monday, 'YYYY-MM-DD'

    // Raw activity
    activeDays: { type: Number, default: 0 },
    totalXp: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    focusMinutes: { type: Number, default: 0 },

    // Score components (each 0-100, see utils/gameConfig.js for weights)
    consistencyScore: { type: Number, default: 0 },
    difficultyAdjustedXpScore: { type: Number, default: 0 },
    focusScore: { type: Number, default: 0 },
    improvementScore: { type: Number, default: 0 },
    streakScore: { type: Number, default: 0 },
    weeklyScore: { type: Number, default: 0 },

    // Rating math that was applied at finalization
    expectedScore: { type: Number, default: 0 },
    kFactor: { type: Number, default: 0.5 },
    ratingChange: { type: Number, default: 0 },
    ratingAfter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// A week can only be finalized once per user (this is what makes
// the recalculation endpoints safe to call repeatedly).
weeklyStatsSchema.index({ user: 1, weekKey: 1 }, { unique: true });

export default mongoose.model('WeeklyStats', weeklyStatsSchema);
