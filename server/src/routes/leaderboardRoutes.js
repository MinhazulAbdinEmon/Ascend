import { Router } from 'express';
import { getWeeklyLeaderboard, getSeasonLeaderboard } from '../controllers/leaderboardController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/weekly', getWeeklyLeaderboard);
router.get('/season', getSeasonLeaderboard);

export default router;
