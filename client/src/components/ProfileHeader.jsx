import RankBadge from './RankBadge';

// Top section of the profile page: avatar, name, rank, member-since.
export default function ProfileHeader({ user }) {
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="glass flex flex-wrap items-center gap-5 p-6">
      {/* Avatar: first letter of the username on a neon gradient */}
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-neon/30 to-violet/30 font-display text-3xl font-bold text-white">
        {user.username[0].toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-white">{user.username}</h1>
          <RankBadge rank={user.rank} />
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Level {user.level} · {user.rankRating} rating · Member since {memberSince}
        </p>
      </div>
    </div>
  );
}
