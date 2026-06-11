import Task from '../models/Task.js';
import Skill from '../models/Skill.js';
import Completion from '../models/Completion.js';
import DailyStats from '../models/DailyStats.js';
import {
  DIFFICULTY_XP,
  DAILY_XP_CAP,
  DIFFICULTY_DAILY_CAPS,
  DIMINISHING_AFTER,
  DIMINISHING_MULTIPLIER,
  PROOF_MULTIPLIERS,
  streakMultiplier,
  calculateLevel,
  getHeatmapIntensity,
} from '../utils/gameConfig.js';
import { todayString, daysAgoString, weekStartString } from '../utils/dates.js';
import { toSafeUser } from '../utils/safeUser.js';
import { refreshLiveWeeklySnapshot } from '../services/gameService.js';

// Which DailyStats field tracks each difficulty's XP (for the per-difficulty caps).
const DIFFICULTY_FIELD = {
  easy: 'easyXp',
  medium: 'mediumXp',
  hard: 'hardXp',
  deepwork: 'deepWorkXp',
};

// GET /api/tasks?skill=<id>&frequency=daily|weekly|once
export const getTasks = async (req, res, next) => {
  try {
    const { skill, frequency } = req.query;

    const filter = { user: req.user._id, isActive: true };
    if (skill) filter.skill = skill;
    if (frequency) filter.frequency = frequency;

    // populate() swaps the skill ObjectId for the actual skill fields the UI needs.
    const tasks = await Task.find(filter)
      .populate('skill', 'name color icon')
      .sort('-createdAt');

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks
export const createTask = async (req, res, next) => {
  try {
    const { title, description, skill, difficulty, frequency, repeatable, requiresProof, estimatedMinutes } = req.body;

    // The skill must exist AND belong to this user.
    const ownedSkill = await Skill.findOne({ _id: skill, user: req.user._id });
    if (!ownedSkill) return res.status(404).json({ message: 'Skill not found' });

    const task = await Task.create({
      user: req.user._id,
      skill,
      title,
      description,
      difficulty,
      frequency,
      repeatable,
      requiresProof,
      estimatedMinutes,
      // XP is decided by the SERVER from difficulty - the client can never
      // send its own xpReward. That's an anti-cheat rule.
      xpReward: DIFFICULTY_XP[difficulty || 'easy'],
    });

    const populated = await task.populate('skill', 'name color icon');
    res.status(201).json({ task: populated });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/tasks/:id
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { title, description, skill, difficulty, frequency, repeatable, isActive, requiresProof, estimatedMinutes } = req.body;

    if (skill !== undefined && skill !== task.skill.toString()) {
      const ownedSkill = await Skill.findOne({ _id: skill, user: req.user._id });
      if (!ownedSkill) return res.status(404).json({ message: 'Skill not found' });
      task.skill = skill;
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (frequency !== undefined) task.frequency = frequency;
    if (repeatable !== undefined) task.repeatable = repeatable;
    if (isActive !== undefined) task.isActive = isActive;
    if (requiresProof !== undefined) task.requiresProof = requiresProof;
    if (estimatedMinutes !== undefined) task.estimatedMinutes = estimatedMinutes;
    if (difficulty !== undefined) {
      task.difficulty = difficulty;
      task.xpReward = DIFFICULTY_XP[difficulty]; // keep reward in sync with difficulty
    }

    await task.save();
    const populated = await task.populate('skill', 'name color icon');
    res.json({ task: populated });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks/:id/complete
// The heart of the game. Everything is decided on the SERVER - the client
// only says "I did this (here's my proof)" and receives the outcome.
//
// XP pipeline, in order:
//   base XP -> proof multiplier -> streak multiplier
//           -> diminishing returns -> per-difficulty cap -> daily cap
export const completeTask = async (req, res, next) => {
  try {
    const user = req.user;
    const tz = user.timezone || 'UTC';
    const today = todayString(tz);

    const task = await Task.findOne({ _id: req.params.id, user: user._id, isActive: true });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // --- Proof handling ---
    const { note = '', proofUrl = '', focusMinutes = 0 } = req.body;
    let proofType = 'none';
    if (proofUrl) proofType = req.body.proofType === 'image' ? 'image' : 'link';
    else if (note) proofType = 'note';

    // Deep-work style tasks can demand evidence: proof or 25+ tracked minutes.
    if (task.requiresProof && proofType === 'none' && focusMinutes < 25) {
      return res.status(400).json({
        message: 'This mission requires proof: add a note, a link, or at least 25 focus minutes',
      });
    }

    // --- No double-completing (unless the task is repeatable) ---
    if (!task.repeatable) {
      let conflictFilter = { user: user._id, task: task._id, date: today };
      let conflictMessage = 'Already completed today';

      if (task.frequency === 'weekly') {
        conflictFilter = { user: user._id, task: task._id, date: { $gte: weekStartString(tz) } };
        conflictMessage = 'Already completed this week';
      } else if (task.frequency === 'once') {
        conflictFilter = { user: user._id, task: task._id };
        conflictMessage = 'Already completed';
      }

      const existing = await Completion.findOne(conflictFilter);
      if (existing) return res.status(409).json({ message: conflictMessage });
    }

    // --- Today's numbers so far (drive caps and diminishing returns) ---
    const stats = await DailyStats.findOne({ user: user._id, date: today });
    const completionsToday = stats?.tasksCompleted || 0;
    const xpToday = stats?.xpEarned || 0;
    const difficultyField = DIFFICULTY_FIELD[task.difficulty];
    const difficultyXpToday = stats?.[difficultyField] || 0;

    // --- Streak (decided BEFORE XP so the streak multiplier is correct) ---
    // Only the first completion of the day moves the streak.
    const isFirstToday = user.lastCompletionDate !== today;
    if (isFirstToday) {
      const yesterday = daysAgoString(1, tz);
      user.currentStreak = user.lastCompletionDate === yesterday ? user.currentStreak + 1 : 1;
      user.longestStreak = Math.max(user.longestStreak, user.currentStreak);
      user.lastCompletionDate = today;
    }

    // --- XP pipeline ---
    const proofMult = PROOF_MULTIPLIERS[proofType];
    const streakMult = streakMultiplier(user.currentStreak);
    let xpAwarded = Math.round(task.xpReward * proofMult * streakMult);

    let diminished = false;
    if (completionsToday >= DIMINISHING_AFTER) {
      xpAwarded = Math.round(xpAwarded * DIMINISHING_MULTIPLIER);
      diminished = true;
    }

    let cappedDifficulty = false;
    const difficultyCap = DIFFICULTY_DAILY_CAPS[task.difficulty];
    if (difficultyCap !== null) {
      const remaining = Math.max(difficultyCap - difficultyXpToday, 0);
      if (xpAwarded > remaining) {
        xpAwarded = remaining;
        cappedDifficulty = true;
      }
    }

    let cappedDaily = false;
    const remainingDaily = Math.max(DAILY_XP_CAP - xpToday, 0);
    if (xpAwarded > remainingDaily) {
      xpAwarded = remainingDaily;
      cappedDaily = true;
    }

    // --- Record the completion (even at 0 XP it still counts for the heatmap) ---
    const completion = await Completion.create({
      user: user._id,
      task: task._id,
      skill: task.skill,
      date: today,
      xpEarned: xpAwarded,
      difficulty: task.difficulty,
      proofType,
      proofUrl,
      note,
      focusMinutes,
    });

    // --- Update today's stats (upsert = create the day's document if missing) ---
    const newStats = await DailyStats.findOneAndUpdate(
      { user: user._id, date: today },
      {
        $inc: {
          tasksCompleted: 1,
          xpEarned: xpAwarded,
          [difficultyField]: xpAwarded,
          focusMinutes: focusMinutes || 0,
        },
        $set: { intensity: getHeatmapIntensity(completionsToday + 1, xpToday + xpAwarded) },
      },
      { new: true, upsert: true }
    );

    // --- System 1: lifetime XP and level (rank is NOT touched here -
    //     rankRating only moves at weekly finalization) ---
    user.totalXP += xpAwarded;
    user.seasonXP += xpAwarded;
    user.level = calculateLevel(user.totalXP);

    // --- Live weekly score snapshot (powers the weekly leaderboard) ---
    const weekly = await refreshLiveWeeklySnapshot(user);
    await user.save();

    // --- Credit the skill ---
    await Skill.findByIdAndUpdate(task.skill, { $inc: { totalXP: xpAwarded } });

    res.json({
      message:
        xpAwarded === 0 && (cappedDaily || cappedDifficulty)
          ? 'XP cap reached - logged without XP'
          : 'Mission complete',
      xpAwarded,
      multipliers: { proof: proofMult, streak: streakMult },
      diminished,
      cappedDaily,
      cappedDifficulty,
      todayXP: newStats.xpEarned,
      todayTasks: newStats.tasksCompleted,
      weeklyScore: weekly.weeklyScore,
      user: toSafeUser(user),
      completion,
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Remove its completion history too (heatmap stats stay - DailyStats is the record of the day).
    await Completion.deleteMany({ task: task._id });

    res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
};
