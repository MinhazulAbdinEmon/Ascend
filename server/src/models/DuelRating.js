import mongoose from 'mongoose';

// FUTURE FEATURE (post-MVP): 1v1 duels - "7-day study duel", "deep work duel"...
// Duels will use classic chess Elo, kept COMPLETELY SEPARATE from rankRating:
//
//   expectedResult = 1 / (1 + 10^((opponentRating - myRating) / 400))
//   actualResult   = 1 win | 0.5 draw | 0 loss
//   newRating      = rating + K * (actualResult - expectedResult)   (K ~ 32)
//
// Winner gains what the loser loses; beating a stronger opponent pays more.
// No duel endpoints exist yet - this model just reserves the shape.
const duelRatingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    rating: { type: Number, default: 1000 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('DuelRating', duelRatingSchema);
