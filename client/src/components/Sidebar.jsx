import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '◈' },
  { to: '/tasks', label: 'Missions', icon: '⌖' },
  { to: '/skills', label: 'Skills', icon: '⬡' },
  { to: '/leaderboard', label: 'Leaderboard', icon: '♛' },
  { to: '/profile', label: 'Profile', icon: '◉' },
  { to: '/guide', label: 'Guide', icon: '✦' },
];

// Desktop: fixed left sidebar. Mobile: bottom tab bar (game-style).
export default function Sidebar() {
  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive
        ? 'bg-neon/10 text-neon'
        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
    }`;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-edge bg-panel/60 p-4 backdrop-blur-md md:flex">
        <NavLink to="/dashboard" className="mb-8 px-3 font-display text-2xl font-bold tracking-tight text-white">
          A<span className="text-neon">scend</span>
        </NavLink>
        <nav className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClasses}>
              <span className="text-base">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-auto px-3 text-xs text-slate-600">Season 1 · Ignition</p>
      </aside>

      {/* Mobile bottom tab bar. The bottom padding respects the iPhone
          home-indicator area (safe-area-inset) so taps aren't swallowed. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-edge bg-panel/90 px-1 pt-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex min-w-0 flex-col items-center gap-0.5 rounded-lg px-1.5 py-1 text-[9px] font-medium ${
                isActive ? 'text-neon' : 'text-slate-500'
              }`
            }
          >
            <span className="text-lg leading-none">{link.icon}</span>
            <span className="truncate">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
