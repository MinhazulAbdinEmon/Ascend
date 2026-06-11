import mongoose from 'mongoose';

// Competitive seasons (~8-10 weeks). At season end, seasonXP and ranks soft-reset.
const seasonSchema = new mongoose.Schema(
  {
    number: { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true }, // e.g. "Season 1: Ignition"
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Season', seasonSchema);
