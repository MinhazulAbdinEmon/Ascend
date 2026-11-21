import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import XPBar from '../components/XPBar';
import MissionList from '../components/MissionList';
import Heatmap from '../components/Heatmap';
import WeeklyScoreCard from '../components/WeeklyScoreCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import FocusSession from '../components/FocusSession';
import useDailyReset from '../lib/useDailyReset';
import { rankProgress, RANKS } from '../lib/game';

const emptyProof = { note: '', proofUrl: '', focusMinutes: '' };

export default function Dashboard() {
  const { user, setUser } = useAuth();

  const [missionFilter, setMissionFilter] = useState('All');
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
  useEffect(() => { load(); }, []);
  useDailyReset(load);

  // The reward banner fades away on its own.
  useEffect(() => {
    if (!reward) return;
    const t = setTimeout(() => setReward(null), 3500);
    return () => clearTimeout(t);
  }, [reward]);

  const submitCompletion = async (task, proof = {}) => {
    setCompletingId(task._id);
    setError('');
    setProofError('');
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
      setReward({ levelUp: updatedUser.level > user.level, xpAwarded, multipliers, cappedDaily, cappedDifficulty, diminished });
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

  const handleComplete = (task, focusProof = {}) => {
    if (task.requiresProof || focusProof.focusMinutes) {
      // This mission demands evidence - collect it first.
      setProofForm({ ...emptyProof, ...focusProof });
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
  const capProgress = Math.min(todayStats.xpEarned / (todayStats.xpCap || 300), 1);
  const rp = rankProgress(user.rankRating);

  return (
    <div className="space-y-6">
      <div className="dashboard-heading">
        <div><p className="eyebrow">YOUR NEXT CHAPTER STARTS TODAY</p><h1>{greeting()}, {user.username}<span className="text-neon">.</span></h1><p className="muted-copy">Small wins. Real progress. A stronger you.</p></div>
        <Link to="/tasks" className="btn-primary">＋ New mission</Link>
      </div>
      {reward && <div role="status" className="reward-toast"><span className="reward-symbol">✦</span><div><strong>{reward.levelUp ? 'LEVEL UP! A new milestone.' : 'MISSION COMPLETE'}</strong><p>{rewardText(reward)}</p></div><button aria-label="Dismiss reward" onClick={() => setReward(null)}>×</button></div>}
      <ErrorMessage message={error} />
      <section className="rank-hero">
        <div className="hero-content"><p className="eyebrow"><span className="live-dot" /> THE CLIMB IS PERSONAL</p><h2>Build yourself.<br /><span>One mission at a time.</span></h2><p>Every focused session is a move forward.<br />Make your next move count.</p><a className="btn-primary" href="#daily-missions">Enter your missions <span>↗</span></a></div>
        <div className="rank-emblem" aria-hidden="true"><div className="emblem-orbit orbit-one" /><div className="emblem-orbit orbit-two" /><div className="emblem-core">♜</div><span className="emblem-caption">{user.rank} · {user.rankRating} RP</span></div>
        <div className="hero-bottom"><span>YOUR CURRENT RANK <strong>{user.rank}</strong></span><span>{rp.next ? `${rp.next.minRating - user.rankRating} rating to ${rp.next.name}` : 'Highest rank achieved'} ↗</span></div>
      </section>
      <div className="stat-grid">
        <div className="glass stat-card"><span className="stat-icon green">ϟ</span><div><p>LIFETIME XP</p><strong>{user.totalXP.toLocaleString()}</strong><small>Level {user.level} · keep growing</small></div></div>
        <div className="glass stat-card"><span className="stat-icon gold">♨</span><div><p>CURRENT STREAK</p><strong>{user.currentStreak}<em> {user.currentStreak === 1 ? 'day' : 'days'}</em></strong><small>Personal best: {user.longestStreak} days</small></div></div>
        <div className="glass stat-card"><span className="stat-icon purple">⌖</span><div><p>DAILY MISSIONS</p><strong>{dailyDone}<em> / {tasks.length}</em></strong><small>{tasks.length && dailyDone === tasks.length ? 'All cleared. Beautiful work!' : 'Your next win is waiting'}</small></div></div>
        <div className="glass stat-card"><span className="stat-icon blue">↗</span><div><p>XP TODAY</p><strong>{todayStats.xpEarned}<em> / {todayStats.xpCap}</em></strong><small>{Math.round(capProgress * 100)}% of daily XP limit</small></div></div>
      </div>
      <div className="dashboard-columns">
        <div className="space-y-6 min-w-0">
          <section className="glass mission-board" id="daily-missions">
            <div className="section-heading"><div><p className="eyebrow">SHOW UP. CHECK IN. LEVEL UP.</p><h2>Today's missions <span className="count-pill">{tasks.length}</span></h2></div><Link to="/tasks" className="subtle-link">View all ↗</Link></div>
            <div className="mission-tabs" aria-label="Filter missions">{['All', 'In progress', 'Completed'].map(filter => <button key={filter} aria-pressed={missionFilter === filter} onClick={() => setMissionFilter(filter)}>{filter}{filter === 'Completed' && ` (${dailyDone})`}</button>)}</div>
            {tasks.length === 0 ? <div className="quest-empty"><span>⌖</span><h3>Your adventure starts with one mission.</h3><p>Choose a skill you want to grow, then give yourself a daily quest.</p><Link to="/skills" className="btn-primary">Choose your first skill ↗</Link></div> : (() => {
              const visible = tasks.filter(task => missionFilter === 'All' || (missionFilter === 'Completed' ? completedTaskIds.includes(task._id) : !completedTaskIds.includes(task._id)));
              return visible.length ? <MissionList tasks={visible} completedTaskIds={completedTaskIds} completingId={completingId} onComplete={handleComplete} /> : <p className="py-10 text-center text-sm text-slate-400">{missionFilter === 'Completed' ? 'Your first win is waiting. Complete a mission to see it here.' : 'Daily board cleared. Take a moment to enjoy your progress.'}</p>;
            })()}
            <div className="mission-footer"><span>✦ Consistency beats intensity.</span><span>{dailyDone} / {tasks.length} complete</span></div>
          </section>
          <section className="glass p-6"><div className="section-heading"><div><h2>The consistency grid</h2><p className="muted-copy">A little effort, repeated. This is what growth looks like.</p></div><Link to="/profile" className="subtle-link">Full year ↗</Link></div><div className="mt-5"><Heatmap days={heatmapDays} weeks={26} /></div></section>
          <WeeklyScoreCard data={weekly} />
        </div>
        <div className="space-y-6 min-w-0">
          <FocusSession tasks={tasks.filter(task => !completedTaskIds.includes(task._id))} />
          <section className="glass rank-journey"><div className="section-heading"><h2>Your rank journey</h2><Link to="/guide" className="subtle-link">ⓘ</Link></div><p className="muted-copy">Earn your place, week after week.</p><div className="journey-steps">{RANKS.slice(Math.max(0, rp.index - 1), Math.max(0, rp.index - 1) + 3).map(rank => <div key={rank.name} className={`journey-step ${rank.name === user.rank ? 'current' : ''}`}><span>{user.rankRating >= rank.minRating ? '◆' : '◇'}</span><div><strong>{rank.name}</strong><small>{rank.minRating} RP</small></div>{rank.name === user.rank && <b>YOU ARE HERE</b>}</div>)}</div><div className="h-1.5 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-neon" style={{ width: `${rp.progress * 100}%` }} /></div><p className="timer-footnote">Weekly performance moves your rating. XP grows your level.</p><div className="mt-5 border-t border-white/5 pt-4"><XPBar totalXP={user.totalXP} /></div></section>
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
