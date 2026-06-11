import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { STARTING_RATING } from '../utils/gameConfig.js';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be at most 20 characters'],
      match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by queries unless explicitly asked for
    },

    // --- System 1: lifetime level (never goes down, never resets) ---
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },

    // --- System 2: competitive rank (moves up AND down, weekly) ---
    rankRating: { type: Number, default: STARTING_RATING },
    rank: { type: String, default: 'Grinder' }, // display name derived from rankRating
    seasonXP: { type: Number, default: 0 }, // resets every season
    seasonScore: { type: Number, default: 0 }, // sum of finalized weekly scores this season

    // Live snapshot of the CURRENT week (recomputed on every completion,
    // used by the weekly leaderboard without scanning everyone's stats).
    weeklyScore: { type: Number, default: 0 },
    weeklyXP: { type: Number, default: 0 },
    weeklyActiveDays: { type: Number, default: 0 },
    weeklyWeekKey: { type: String, default: null },

    // --- Streaks ---
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletionDate: { type: String, default: null }, // 'YYYY-MM-DD'
    timezone: { type: String, default: 'UTC' }, // "what day is it for this user"
  },
  { timestamps: true }
);

// Hash the password before saving (only when it actually changed).
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model('User', userSchema);
