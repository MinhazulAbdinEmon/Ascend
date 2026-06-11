import { useEffect, useState } from 'react';
import api from '../api/axios';
import LeaderboardTable from '../components/LeaderboardTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Leaderboard() {
  const [mode, setMode] = useState('weekly'); // 'weekly' | 'season'
  const [entries, setEntries] = useState([]);
  const [season, setSeason] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [lbRes, seasonRes] = await Promise.all([
          api.get(`/leaderboard/${mode}`),
          api.get('/seasons/current'),
        ]);
        if (cancelled) return;
        setEntries(lbRes.data.entries);
        setSeason(seasonRes.data);
        setError('');
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load the leaderboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true; // ignore stale responses if the user switches tabs fast
    };
  }, [mode]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Leaderboard</h1>
          {season && (
            <p className="mt-1 text-sm text-slate-400">
              {season.season.name} · {season.daysRemaining} days remaining
            </p>
          )}
        </div>

        <div className="flex rounded-lg border border-edge bg-white/[0.02] p-1">
          {[
            { value: 'weekly', label: 'This week' },
            { value: 'season', label: 'Season' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setMode(tab.value)}
              className={`rounded-md px-4 py-1.5 text-xs font-semibold transition ${
                mode === tab.value ? 'bg-neon/10 text-neon' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={error} />

      {loading ? (
        <div className="flex justify-center py-24">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <LeaderboardTable entries={entries} mode={mode} />
          <p className="text-xs text-slate-500">
            {mode === 'weekly'
              ? 'Sorted by live weekly performance score. Resets every Monday.'
              : 'Sorted by competitive rating — the real ladder. Rating moves at the end of each week.'}
          </p>
        </>
      )}
    </div>
  );
}
