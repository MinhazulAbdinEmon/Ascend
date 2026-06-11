// Shape the user object we send to the frontend.
// Never send the password hash or internal fields.
export const toSafeUser = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,

  // System 1: lifetime level
  totalXP: user.totalXP,
  level: user.level,

  // System 2: competitive rank
  rankRating: user.rankRating,
  rank: user.rank,
  seasonXP: user.seasonXP,
  seasonScore: user.seasonScore,
  weeklyScore: user.weeklyScore,

  // Streaks
  currentStreak: user.currentStreak,
  longestStreak: user.longestStreak,
  lastCompletionDate: user.lastCompletionDate,

  createdAt: user.createdAt,
});
