import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  kind: { type: String, enum: ['focus', 'break'], required: true },
  minutes: { type: Number, required: true, min: 1, max: 180 },
  label: { type: String, default: 'Free focus', maxlength: 100 },
  status: { type: String, enum: ['running', 'paused', 'completed', 'cancelled'], default: 'running' },
  segments: [{ _id: false, start: Date, end: Date }],
  completedAt: Date,
}, { timestamps: true, optimisticConcurrency: true });
schema.index({ user: 1 }, { unique: true, partialFilterExpression: { status: { $in: ['running', 'paused'] } } });
schema.index({ user: 1, status: 1, completedAt: -1 });
export default mongoose.model('FocusSession', schema);
