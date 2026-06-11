import mongoose from 'mongoose';

// A Task (mission) belongs to a Skill. Completing it grants XP.
const taskSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Task title must be at least 3 characters'],
      maxlength: [100, 'Task title must be at most 100 characters'],
    },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'deepwork'],
      default: 'easy',
    },
    xpReward: { type: Number, required: true }, // derived from difficulty when created
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'once'],
      default: 'daily',
    },
    repeatable: { type: Boolean, default: false }, // can it be completed more than once per day?
    isActive: { type: Boolean, default: true }, // soft-delete / archive flag
    // When true, completing requires proof: a note, a link, or 25+ focus minutes.
    // Meant for deep-work missions where "I did it" should mean something.
    requiresProof: { type: Boolean, default: false },
    estimatedMinutes: { type: Number, min: 0, max: 480, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('Task', taskSchema);
