import { Router } from 'express';
import { body, param } from 'express-validator';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import FocusSession from '../models/FocusSession.js';
import { elapsedSeconds, settleSession, productivitySummary } from '../utils/focus.js';
import { todayString, shiftDate, dateString } from '../utils/dates.js';

const router = Router();
router.use(protect);
const view = session => session ? { ...session.toObject(), elapsedSeconds: Math.min(session.minutes * 60, elapsedSeconds(session)), serverNow: Date.now() } : null;
const handleError = (error, res, next) => {
  if (error.code === 11000 || error.name === 'VersionError') return res.status(409).json({ message: 'Your timer changed in another tab. Refreshing its state.' });
  next(error);
};

router.get('/current', async (req, res, next) => {
  try {
    const session = await FocusSession.findOne({ user: req.user._id, status: { $in: ['running', 'paused'] } });
    res.json({ session: view(session) });
  } catch (error) { next(error); }
});

router.post('/', [body('kind').isIn(['focus', 'break']), body('minutes').isInt({ min: 1, max: 180 }).toInt(), body('label').optional().trim().isLength({ max: 100 })], validate, async (req, res, next) => {
  try {
    const session = await FocusSession.create({ user: req.user._id, kind: req.body.kind, minutes: req.body.minutes, label: req.body.label || (req.body.kind === 'break' ? 'Recharge' : 'Free focus'), segments: [{ start: new Date() }] });
    res.status(201).json({ session: view(session) });
  } catch (error) { handleError(error, res, next); }
});

router.post('/:id/:action', [param('id').isMongoId(), param('action').isIn(['pause', 'resume', 'finish', 'cancel'])], validate, async (req, res, next) => {
  try {
    const session = await FocusSession.findOne({ _id: req.params.id, user: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (!['completed', 'cancelled'].includes(session.status)) {
      const settled = settleSession(session);
      if (!settled) {
        const action = req.params.action;
        if (action === 'finish') return res.status(409).json({ message: 'This session still has time remaining.' });
        if (action === 'pause' && session.status === 'running') { session.segments.at(-1).end = new Date(); session.status = 'paused'; }
        if (action === 'resume' && session.status === 'paused') { session.segments.push({ start: new Date() }); session.status = 'running'; }
        if (action === 'cancel') { if (session.status === 'running') session.segments.at(-1).end = new Date(); session.status = 'cancelled'; }
      }
      await session.save();
    }
    res.json({ session: view(session) });
  } catch (error) { handleError(error, res, next); }
});

router.get('/statistics', async (req, res, next) => {
  try {
    const count = Number(req.query.days) === 30 ? 30 : 7;
    const timezone = req.user.timezone || 'UTC';
    const end = todayString(timezone);
    const start = shiftDate(end, 1 - count);
    const sessions = await FocusSession.find({ user: req.user._id, kind: 'focus', status: 'completed', completedAt: { $gte: new Date(new Date(start + 'T00:00:00Z').getTime() - 86400000) } }).sort('-completedAt').lean();
    res.json({ ...productivitySummary(sessions, end, count, timezone), timezone, recent: sessions.filter(s => dateString(s.completedAt, timezone) >= start).slice(0, 12).map(s => ({ id: s._id, label: s.label, minutes: s.minutes, completedAt: s.completedAt })) });
  } catch (error) { next(error); }
});
export default router;
