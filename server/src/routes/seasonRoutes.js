import { Router } from 'express';
import { getCurrentSeason, recalculateWeeklyRanks } from '../controllers/seasonController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/current', getCurrentSeason);
router.post('/recalculate-weekly-ranks', recalculateWeeklyRanks);

export default router;
