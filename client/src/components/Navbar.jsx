import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RankBadge from './RankBadge';

// Top bar inside the app shell: brand, rank, streak, logout.
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const title = { '/dashboard': 'Overview', '/statistics': 'Statistics', '/tasks': 'Missions', '/skills': 'Skill tree', '/profile': 'Player profile', '/leaderboard': 'Leaderboard', '/guide': 'How to play' }[location.pathname] || 'Overview';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-edge bg-ink/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/dashboard" className="font-display text-xl font-bold tracking-tight text-white md:hidden">
          A<span className="text-neon">scend</span>
        </Link>

        <div className="hidden md:flex items-center gap-3 text-xs"><span className="text-slate-500">Your playground</span><span className="text-slate-600">/</span><span>{title}</span></div><div className="ml-auto flex items-center gap-3 sm:gap-4">
          {user && (
            <>
              <span
                className="hidden items-center gap-1.5 text-sm font-medium text-ember sm:flex"
                title="Current streak"
              >
                🔥 {user.currentStreak} day{user.currentStreak === 1 ? '' : 's'}
              </span>
              <RankBadge rank={user.rank} />
              <span className="hidden text-sm font-medium text-slate-300 sm:block">
                {user.username}
              </span>
            </>
          )}
          <button onClick={handleLogout} className="btn-ghost !px-3 !py-1.5 text-xs">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
