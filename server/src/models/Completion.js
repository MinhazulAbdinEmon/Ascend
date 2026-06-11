import mongoose from 'mongoose';

// One document per task completion - the raw event log.
// Heatmap, stats, weekly scores and anti-abuse checks are all built from these.
const completionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
    skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
    date: { type: String, required: true }, // 'YYYY-MM-DD' in the user's timezone
    xpEarned: { type: Number, required: true },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'deepwork'],
      default: 'easy',
    },

    // Optional proof attached at completion time (drives the proof multiplier).
    proofType: { type: String, enum: ['none', 'note', 'image', 'link'], default: 'none' },
    proofUrl: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    focusMinutes: { type: Number, min: 0, max: 600, default: 0 },
  },
  { timestamps: true }
);

// Fast lookups: "everything user X did on day Y" and "did user X complete task Z today?"
completionSchema.index({ user: 1, date: 1 });
completionSchema.index({ user: 1, task: 1, date: 1 });

export default mongoose.model('Completion', completionSchema);
