import mongoose from 'mongoose';

// One document per user per day - a pre-computed summary.
// The heatmap and the per-difficulty XP caps read these directly
// instead of re-counting completions every time.
const dailyStatsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    tasksCompleted: { type: Number, default: 0 },
    xpEarned: { type: Number, default: 0 },

    // XP broken down by difficulty - this is what enforces the
    // per-difficulty daily caps (easy 60, medium 125, hard 200).
    easyXp: { type: Number, default: 0 },
    mediumXp: { type: Number, default: 0 },
    hardXp: { type: Number, default: 0 },
    deepWorkXp: { type: Number, default: 0 },

    focusMinutes: { type: Number, default: 0 },
    intensity: { type: Number, default: 0 }, // 0 empty | 1 low | 2 medium | 3 high
  },
  { timestamps: true }
);

// Exactly one stats document per user per day.
dailyStatsSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyStats', dailyStatsSchema);
