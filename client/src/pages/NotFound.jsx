import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-7xl font-bold text-neon">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-white">Off the map</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-400">
        This page doesn't exist. The grind, however, continues.
      </p>
      <Link to="/dashboard" className="btn-primary mt-8">
        Back to dashboard
      </Link>
    </div>
  );
}
