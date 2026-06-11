import Skill from '../models/Skill.js';
import Task from '../models/Task.js';
import Completion from '../models/Completion.js';

// GET /api/skills
// Returns the user's skills, each with a live count of its active tasks.
export const getSkills = async (req, res, next) => {
  try {
    const skills = await Skill.find({ user: req.user._id }).sort('-createdAt').lean();

    // Count active tasks per skill in ONE query instead of one query per skill.
    const counts = await Task.aggregate([
      { $match: { user: req.user._id, isActive: true } },
      { $group: { _id: '$skill', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

    res.json({
      skills: skills.map((s) => ({
        ...s,
        taskCount: countMap[s._id.toString()] || 0,
      })),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/skills
export const createSkill = async (req, res, next) => {
  try {
    const { name, color, icon } = req.body;
    const skill = await Skill.create({ user: req.user._id, name, color, icon });
    res.status(201).json({ skill: { ...skill.toObject(), taskCount: 0 } });
  } catch (err) {
    // Unique index on (user, name) -> friendlier message than the generic handler's
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You already have a skill with that name' });
    }
    next(err);
  }
};

// PATCH /api/skills/:id
export const updateSkill = async (req, res, next) => {
  try {
    // Always scope queries by user - otherwise anyone could edit anyone's skill by id.
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    const { name, color, icon } = req.body;
    if (name !== undefined) skill.name = name;
    if (color !== undefined) skill.color = color;
    if (icon !== undefined) skill.icon = icon;
    await skill.save();

    res.json({ skill });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You already have a skill with that name' });
    }
    next(err);
  }
};

// DELETE /api/skills/:id
// Deleting a skill cascades: its tasks and their completion history go too.
export const deleteSkill = async (req, res, next) => {
  try {
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    await Task.deleteMany({ skill: skill._id });
    await Completion.deleteMany({ skill: skill._id });

    res.json({ message: 'Skill deleted' });
  } catch (err) {
    next(err);
  }
};
