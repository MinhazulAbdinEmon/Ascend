import User from '../models/User.js';
import { sendTokenCookie, clearTokenCookie } from '../utils/token.js';
import { toSafeUser } from '../utils/safeUser.js'; // shared with stats/task controllers
import { finalizePendingWeeks } from '../services/gameService.js';

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { username, email, password, timezone } = req.body;

    // The unique indexes on username/email also protect us,
    // but checking first gives a friendlier error.
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      const field = existing.email === email ? 'email' : 'username';
      return res.status(409).json({ message: `That ${field} is already taken` });
    }

    // The browser sends its timezone so streaks and "today" use the USER's
    // midnight, not UTC's. Validate it actually exists; fall back to UTC.
    let tz = 'UTC';
    if (timezone) {
      try {
        new Intl.DateTimeFormat('en', { timeZone: timezone });
        tz = timezone;
      } catch {
        // unknown timezone string - keep UTC
      }
    }

    const user = await User.create({ username, email, password, timezone: tz });
    sendTokenCookie(res, user._id);
    res.status(201).json({ user: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // password has select:false in the schema, so we must ask for it explicitly
    const user = await User.findOne({ email }).select('+password');

    // Same message for "no such user" and "wrong password" -
    // never tell an attacker which one was wrong.
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    sendTokenCookie(res, user._id);
    res.json({ user: toSafeUser(user) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  clearTokenCookie(res);
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me  (protected - req.user is set by the auth middleware)
// This runs on every app load, so it's also where we lazily finalize any
// weeks that ended since the user's last visit (no cron needed in the MVP).
export const getMe = async (req, res, next) => {
  try {
    await finalizePendingWeeks(req.user);
    res.json({ user: toSafeUser(req.user) });
  } catch (err) {
    next(err);
  }
};
