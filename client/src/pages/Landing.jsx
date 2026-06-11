import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    title: 'Ranked self-improvement',
    body: 'Climb from Rookie to Sovereign. Your rank is earned through consistency, not luck.',
    accent: 'text-neon',
  },
  {
    title: 'Proof in pixels',
    body: 'A GitHub-style heatmap turns every completed mission into a visible grid of effort.',
    accent: 'text-violet',
  },
  {
    title: 'Streaks that matter',
    body: 'Show up daily. Protect the flame. Watch the compound effect take over.',
    accent: 'text-ember',
  },
];

export default function Landing() {
  const { user, loading } = useAuth();

  // Already logged in? Straight to the dashboard.
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-130 w-200 -translate-x-1/2 rounded-full bg-neon/10 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl font-bold tracking-tight text-white">
          A<span className="text-neon">scend</span>
        </span>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost !py-2 text-sm">
            Log in
          </Link>
          <Link to="/register" className="btn-primary !py-2 text-sm">
            Start climbing
          </Link>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6">
        <section className="py-20 text-center sm:py-28">
          <p className="mb-4 inline-block rounded-full border border-edge px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Season 1 · Ignition
          </p>
          <h1 className="mx-auto max-w-3xl font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-6xl">
            Rank up in <span className="bg-gradient-to-r from-neon to-violet bg-clip-text text-transparent">real life</span>.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base text-slate-400 sm:text-lg">
            Track anything you want to master — coding, lifting, reading, trading. Complete
            missions, earn XP, keep your streak alive, and climb a ranked ladder built for
            people who take themselves seriously.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary !px-8 !py-3 text-base">
              Create your profile
            </Link>
          </div>
        </section>

        <section className="grid gap-5 pb-24 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="glass p-6 transition hover:border-white/20">
              <h3 className={`font-display text-lg font-semibold ${f.accent}`}>{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
