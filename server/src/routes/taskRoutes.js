import { Router } from 'express';
import { body, param } from 'express-validator';
import { getTasks, createTask, updateTask, deleteTask, completeTask } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Every task route requires a logged-in user.
router.use(protect);

// Rule factories - see skillRoutes.js for why these are functions, not constants.
const titleRule = () =>
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Task title must be 3-100 characters')
    // Anti-spam: reject titles that are one character repeated ("aaaaaaa", ".......")
    .custom((value) => {
      if (/^(.)\1+$/.test(value.replace(/\s/g, ''))) {
        throw new Error('Give the task a real title');
      }
      return true;
    });

const sharedRules = () => [
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description is too long (max 500)'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard', 'deepwork']).withMessage('Invalid difficulty'),
  body('frequency').optional().isIn(['daily', 'weekly', 'once']).withMessage('Invalid frequency'),
  body('repeatable').optional().isBoolean().withMessage('repeatable must be true or false'),
  body('requiresProof').optional().isBoolean().withMessage('requiresProof must be true or false'),
  body('estimatedMinutes').optional({ values: 'null' }).isInt({ min: 0, max: 480 }).withMessage('estimatedMinutes must be 0-480'),
];

// Optional proof attached when completing a mission.
const completeRules = () => [
  body('note').optional().trim().isLength({ max: 300 }).withMessage('Note is too long (max 300)'),
  body('proofUrl').optional({ values: 'falsy' }).trim().isURL().withMessage('Proof must be a valid URL'),
  body('proofType').optional().isIn(['none', 'note', 'image', 'link']).withMessage('Invalid proof type'),
  body('focusMinutes').optional().isInt({ min: 0, max: 600 }).withMessage('focusMinutes must be 0-600').toInt(),
];

const idRule = () => param('id').isMongoId().withMessage('Invalid task id');

router.get('/', getTasks);

router.post(
  '/',
  [titleRule(), body('skill').isMongoId().withMessage('A skill is required'), ...sharedRules()],
  validate,
  createTask
);

router.patch(
  '/:id',
  [
    idRule(),
    titleRule().optional(),
    body('skill').optional().isMongoId().withMessage('Invalid skill id'),
    body('isActive').optional().isBoolean(),
    ...sharedRules(),
  ],
  validate,
  updateTask
);

router.post('/:id/complete', [idRule(), ...completeRules()], validate, completeTask);

router.delete('/:id', [idRule()], validate, deleteTask);

export default router;
