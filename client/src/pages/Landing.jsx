import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;
  return <div className="min-h-screen overflow-hidden">
    <header className="landing-header mx-auto flex max-w-6xl items-center justify-between px-6 py-5 border-b border-white/5">
      <Link to="/" className="sidebar-brand !p-0"><span className="brand-mark">◭</span> ASCEND</Link>
      <div className="flex items-center gap-3"><Link to="/login" className="btn-ghost">Log in</Link><Link to="/register" className="btn-primary">Start playing ↗</Link></div>
    </header>
    <main className="mx-auto max-w-6xl px-6">
      <section className="landing-grid">
        <div><p className="eyebrow text-neon">A DIFFERENT KIND OF COMPETITIVE GAME</p><h1>Your life.<br />Your next<br /><span>level.</span></h1><p className="description">Turn the things you want to get better at into missions worth showing up for. Build skills, earn XP, and climb a rating ladder powered by your real-world effort.</p><div className="mt-8 flex flex-wrap items-center gap-5"><Link to="/register" className="btn-primary !px-6 !py-3">Begin your climb ↗</Link><a href="#how-it-works" className="subtle-link">How it works ↓</a></div><p className="mt-5 text-xs text-slate-500">Your only starting requirement? Show up.</p></div>
        <div className="glass landing-preview"><div className="section-heading"><span className="eyebrow">YOUR PLAYER CARD</span><span className="small-tag">A LOOK INSIDE</span></div><div className="preview-rank"><span aria-hidden="true">♜</span><h2>Potential, unlocked.</h2><p className="muted-copy">From your first mission to your next milestone.</p></div><div className="preview-mission"><span className="text-neon">⌘</span><span>Solve a coding challenge</span><b>+25 XP</b></div><div className="preview-mission"><span className="text-neon">◇</span><span>Move your body</span><b>+10 XP</b></div><div className="preview-mission"><span className="text-neon">▤</span><span>Read. Reflect. Repeat.</span><b>+10 XP</b></div><p className="timer-footnote">Example missions · You choose your own path</p></div>
      </section>
      <section id="how-it-works" className="pb-20"><p className="eyebrow mb-5">REAL EFFORT. VISIBLE PROGRESS.</p><div className="grid gap-4 sm:grid-cols-3">{[
        ['01', 'Build your skill tree', 'Coding, fitness, reading, or something entirely your own. Pick what matters and create your missions.'],
        ['02', 'Make your daily moves', 'Enter a focus session, complete a mission, and collect XP. Every check-in builds your story.'],
        ['03', 'Earn your next rank', 'Your weekly consistency and effort move your competitive rating. Your lifetime XP always stays yours.'],
      ].map(([number, title, body]) => <div key={number} className="glass p-7"><div className="landing-step">{number} ↗</div><h2 className="font-display text-lg text-white">{title}</h2><p className="muted-copy mt-3">{body}</p></div>)}</div></section>
      <footer className="border-t border-white/10 py-6 flex justify-between text-[10px] tracking-widest text-slate-500"><span>ASCEND · BETTER EVERY DAY</span><span>THE CLIMB IS PERSONAL.</span></footer>
    </main>
  </div>;
}
