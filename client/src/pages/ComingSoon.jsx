// Placeholder for pages that arrive in later build phases.
export default function ComingSoon({ title, phase }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
      <p className="mt-3 max-w-sm text-sm text-slate-400">
        This area unlocks in <span className="font-semibold text-neon">Phase {phase}</span> of the
        build. The route, layout and auth guard are already wired up.
      </p>
    </div>
  );
}
