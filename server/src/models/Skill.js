import mongoose from 'mongoose';

// A Skill is a category the user is improving: Coding, Fitness, Study, Reading...
const skillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
      minlength: [2, 'Skill name must be at least 2 characters'],
      maxlength: [30, 'Skill name must be at most 30 characters'],
    },
    color: { type: String, default: '#22d3ee' }, // accent color used in the UI
    icon: { type: String, default: 'target' },
    totalXP: { type: Number, default: 0 }, // XP earned inside this skill
  },
  { timestamps: true }
);

// A user cannot have two skills with the same name.
skillSchema.index({ user: 1, name: 1 }, { unique: true });

export default mongoose.model('Skill', skillSchema);
