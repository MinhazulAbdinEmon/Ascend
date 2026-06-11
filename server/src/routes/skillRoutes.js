import { Router } from 'express';
import { body, param } from 'express-validator';
import { getSkills, createSkill, updateSkill, deleteSkill } from '../controllers/skillController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Every skill route requires a logged-in user.
router.use(protect);

// Validation rules are FACTORIES (functions returning a fresh chain) because
// express-validator chains are mutable - sharing one instance between routes
// would let .optional() on one route leak into another.
const nameRule = () =>
  body('name').trim().isLength({ min: 2, max: 30 }).withMessage('Skill name must be 2-30 characters');

const colorRule = () =>
  body('color').optional().matches(/^#[0-9a-fA-F]{6}$/).withMessage('Color must be a hex value like #22d3ee');

const iconRule = () => body('icon').optional().isLength({ max: 20 }).withMessage('Icon is too long');

const idRule = () => param('id').isMongoId().withMessage('Invalid skill id');

router.get('/', getSkills);
router.post('/', [nameRule(), colorRule(), iconRule()], validate, createSkill);
router.patch('/:id', [idRule(), nameRule().optional(), colorRule(), iconRule()], validate, updateSkill);
router.delete('/:id', [idRule()], validate, deleteSkill);

export default router;
