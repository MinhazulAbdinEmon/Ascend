import { Router } from 'express';
import { getDashboardStats, getHeatmap, getProfileStats, getWeeklyStats } from '../controllers/statsController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/heatmap', getHeatmap);
router.get('/profile', getProfileStats);
router.get('/weekly', getWeeklyStats);

export default router;
