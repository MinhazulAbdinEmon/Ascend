import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import RankBadge from '../components/RankBadge';
import LevelBadge from '../components/LevelBadge';
import XPBar from '../components/XPBar';
import MissionList from '../components/MissionList';
import Heatmap from '../components/Heatmap';
import WeeklyScoreCard from '../components/WeeklyScoreCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { rankProgress } from '../lib/game';

const emptyProof = { note: '', proofUrl: '', focusMinutes: '' };

export default function Dashboard() {
  const { user, setUser } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [todayStats, setTodayStats] = useState({ tasksCompleted: 0, xpEarned: 0, xpCap: 300 });
  const [completedTaskIds, setCompletedTaskIds] = useState([]);
  const [heatmapDays, setHeatmapDays] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [completingId, setCompletingId] = useState(null);
  const [reward, setReward] = useState(null); // flash message after completing

  // Proof dialog (opens for missions with requiresProof)
  const [proofTask, setProofTask] = useState(null);
  const [proofForm, setProofForm] = useState(emptyProof);
  const [proofError, setProofError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [taskRes, dashRes, heatRes, weeklyRes] = await Promise.all([
          api.get('/tasks?frequency=daily'),
          api.get('/stats/dashboard'),
          api.get('/stats/heatmap?days=182'),
          api.get('/stats/weekly'),
        ]);
        setTasks(taskRes.data.tasks);
        setTodayStats(dashRes.data.today);
        setCompletedTaskIds(dashRes.data.completedTaskIds);
        setHeatmapDays(heatRes.data.days);
        setWeekly(weeklyRes.data.live);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // The reward banner fades away on its own.
  useEffect(() => {
    if (!reward) return;
    const t = setTimeout(() => setReward(null), 3500);
    return () => clearTimeout(t);
  }, [reward]);

  const submitCompletion = async (task, proof = {}) => {
    setCompletingId(task._id);
    try {
      const body = {};
      if (proof.note) body.note = proof.note;
      if (proof.proofUrl) body.proofUrl = proof.proofUrl;
      if (proof.focusMinutes) body.focusMinutes = Number(proof.focusMinutes);

      const res = await api.post(`/tasks/${task._id}/complete`, body);
      const { user: updatedUser, xpAwarded, multipliers, cappedDaily, cappedDifficulty, diminished, todayXP, todayTasks } = res.data;

      setUser(updatedUser); // navbar, badges and stat cards all update instantly
      setTodayStats((prev) => ({ ...prev, xpEarned: todayXP, tasksCompleted: todayTasks }));
      setCompletedTaskIds((prev) => [...prev, task._id]);
      setReward({ xpAwarded, multipliers, cappedDaily, cappedDifficulty, diminished });
      setProofTask(null);

      // Refresh heatmap + weekly score quietly in the background.
      api.get('/stats/heatmap?days=182').then((r) => setHeatmapDays(r.data.days)).catch(() => {});
      api.get('/stats/weekly').then((r) => setWeekly(r.data.live)).catch(() => {});
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not complete mission';
      if (proofTask) setProofError(msg);
      else setError(msg);
      return false;
    } finally {
      setCompletingId(null);
    }
  };

  const handleComplete = (task) => {
    if (task.requiresProof) {
      // This mission demands evidence - collect it first.
      setProofForm(emptyProof);
      setProofError('');
      setProofTask(task);
    } else {
      submitCompletion(task);
    }
  };

  const rewardText = (r) => {
    if (r.xpAwarded === 0) return 'XP cap reached — mission logged, no XP. Rest is part of the grind.';
    const boosted = r.multipliers && (r.multipliers.proof > 1 || r.multipliers.streak > 1);
    let text = `+${r.xpAwarded} XP`;
    if (boosted) text += ' (boosted';
    if (r.multipliers?.proof > 1 && boosted) text += ` · proof x${r.multipliers.proof}`;
    if (r.multipliers?.streak > 1 && boosted) text += ` · streak x${r.multipliers.streak}`;
    if (boosted) text += ')';
    if (r.diminished) text += ' · diminishing returns';
    return `${text} 🔥`;
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  const dailyDone = tasks.filter((t) => completedTaskIds.includes(t._id)).length;
  const capProgress = Math.min(todayStats.xpEarned / todayStats.xpCap, 1);
  const rp = rankProgress(user.rankRating);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            {greeting()}, {user.username}
          </h1>
          <p className="mt-1 text-sm text-slate-400">Today is another chance to climb.</p>
        </div>
        <div className="flex items-center gap-2">
          <LevelBadge level={user.level} />
          <RankBadge rank={user.rank} />
        </div>
      </div>

      {/* Reward flash */}
      {reward && (
        <div className="rounded-lg border border-neon/30 bg-neon/10 px-4 py-2.5 text-sm font-semibold text-neon">
          {rewardText(reward)}
        </div>
      )}

      <ErrorMessage message={error} />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total XP</p>
          <p className="mt-2 font-display text-3xl font-bold text-neon">{user.totalXP}</p>
          <div className="mt-4">
            <XPBar totalXP={user.totalXP} />
          </div>
        </div>

        <div className="glass p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">XP today</p>
          <p className="mt-2 font-display text-3xl font-bold text-white">
            {todayStats.xpEarned}
            <span className="text-base font-medium text-slate-500"> / {todayStats.xpCap}</span>
          </p>
          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-neon transition-all duration-500"
              style={{ width: `${capProgress * 100}%` }}
            />
          </div>
        </div>

        <div className="glass p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Streak</p>
          <p className="mt-2 font-display text-3xl font-bold text-ember">
            🔥 {user.currentStreak} <span className="text-base font-medium text-slate-400">days</span>
          </p>
          <p className="mt-4 text-xs text-slate-500">Longest: {user.longestStreak} days</p>
        </div>

        <div className="glass p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rank rating</p>
          <p className="mt-2 font-display text-3xl font-bold text-violet">{user.rankRating}</p>
          {rp.next ? (
            <>
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet to-neon transition-all duration-500"
                  style={{ width: `${rp.progress * 100}%` }}
                />
              </div>
              <Link to="/profile" className="mt-2 block text-xs text-slate-500 hover:text-slate-300">
                {rp.next.minRating - user.rankRating} to <span className="font-semibold text-neon">{rp.next.name}</span> →
              </Link>
            </>
          ) : (
            <p className="mt-4 text-xs text-slate-500">Top of the ladder. Stay there.</p>
          )}
        </div>
      </div>

      {/* Today's missions */}
      <div className="glass p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Today's missions</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              {dailyDone} / {tasks.length} complete
            </span>
            <Link to="/tasks" className="text-xs font-semibold text-neon hover:underline">
              Manage →
            </Link>
          </div>
        </div>

        <div className="mt-4">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-12 text-center">
              <p className="text-sm font-medium text-slate-300">No daily missions yet</p>
              <p className="mt-1 max-w-xs text-xs text-slate-500">
                Create skills and add daily missions under them to fill this list.
              </p>
              <Link to="/tasks" className="btn-primary mt-5 !py-2 text-xs">
                Create a mission
              </Link>
            </div>
          ) : (
            <MissionList
              tasks={tasks}
              completedTaskIds={completedTaskIds}
              completingId={completingId}
              onComplete={handleComplete}
            />
          )}
        </div>
      </div>

      {/* This week's performance (the number that moves your rating) */}
      <WeeklyScoreCard data={weekly} />

      {/* Heatmap preview (last ~6 months) */}
      <div className="glass p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-white">Consistency grid</h2>
          <Link to="/profile" className="text-xs font-semibold text-neon hover:underline">
            Full year →
          </Link>
        </div>
        <div className="mt-4">
          <Heatmap days={heatmapDays} weeks={26} />
        </div>
      </div>

      {/* Proof dialog for missions that require evidence */}
      <Modal
        open={!!proofTask}
        title="Attach proof"
        onClose={() => setProofTask(null)}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitCompletion(proofTask, proofForm);
          }}
          className="space-y-4"
        >
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-slate-200">{proofTask?.title}</span> requires
            evidence: focus minutes, a note, or a link. Linked proof earns a 1.2x XP boost.
          </p>

          <ErrorMessage message={proofError} />

          <div>
            <label htmlFor="proof-minutes" className="mb-1.5 block text-sm font-medium text-slate-300">
              Focus minutes
            </label>
            <input
              id="proof-minutes"
              type="number"
              min={0}
              max={600}
              className="input"
              placeholder="e.g. 50"
              value={proofForm.focusMinutes}
              onChange={(e) => setProofForm({ ...proofForm, focusMinutes: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="proof-url" className="mb-1.5 block text-sm font-medium text-slate-300">
              Proof link <span className="text-slate-500">(GitHub, LeetCode… · 1.2x XP)</span>
            </label>
            <input
              id="proof-url"
              type="url"
              className="input"
              placeholder="https://github.com/you/repo/commit/..."
              value={proofForm.proofUrl}
              onChange={(e) => setProofForm({ ...proofForm, proofUrl: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="proof-note" className="mb-1.5 block text-sm font-medium text-slate-300">
              Note <span className="text-slate-500">(what did you do? · 1.05x XP)</span>
            </label>
            <textarea
              id="proof-note"
              rows={2}
              maxLength={300}
              className="input resize-none"
              placeholder="Finished chapter 4 and took notes"
              value={proofForm.note}
              onChange={(e) => setProofForm({ ...proofForm, note: e.target.value })}
            />
          </div>

          <button type="submit" disabled={completingId === proofTask?._id} className="btn-primary w-full">
            {completingId === proofTask?._id ? 'Completing…' : 'Complete mission'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
