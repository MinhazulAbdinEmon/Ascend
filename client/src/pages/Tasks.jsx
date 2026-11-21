import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import useDailyReset from '../lib/useDailyReset';
import DayCountdown from '../components/DayCountdown';
import { DIFFICULTIES, FREQUENCIES } from '../lib/game';

const emptyForm = {
  title: '',
  description: '',
  skill: '',
  difficulty: 'easy',
  frequency: 'daily',
  repeatable: false,
  requiresProof: false,
};

const FREQUENCY_TABS = [{ value: 'all', label: 'All' }, ...FREQUENCIES];

export default function Tasks() {
  const { setUser } = useAuth();
  const [completing, setCompleting] = useState(false);
  const [proofTask, setProofTask] = useState(null);
  const [proof, setProof] = useState({ note: '', proofUrl: '', focusMinutes: '' });
  const [proofError, setProofError] = useState('');
  const [reward, setReward] = useState('');
  const [tasks, setTasks] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [frequencyTab, setFrequencyTab] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');

  // Modal state: null = closed, otherwise { mode: 'create' | 'edit', task? }
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      // Both requests fire in parallel - faster than awaiting one after the other.
      const [taskRes, skillRes] = await Promise.all([api.get('/tasks'), api.get('/skills')]);
      setTasks(taskRes.data.tasks);
      setSkills(skillRes.data.skills);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load missions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const clock = useDailyReset(loadData);
  useEffect(() => {
    if (!reward) return;
    const timeout = setTimeout(() => setReward(''), 4500);
    return () => clearTimeout(timeout);
  }, [reward]);
  const complete = async (task, evidence = {}) => {
    setCompleting(true); setError(''); setProofError('');
    try {
      const body = { ...evidence };
      if (body.focusMinutes === '') delete body.focusMinutes;
      const { data } = await api.post(`/tasks/${task._id}/complete`, body);
      setUser(data.user);
      setTasks(current => current.map(item => item._id === task._id ? { ...item, completed: true } : item));
      setProofTask(null);
      setReward(`Mission complete · +${data.xpAwarded} XP. Another small win.`);
      await loadData();
    } catch (err) {
      const message = err.response?.data?.message || 'Could not complete mission';
      if (proofTask) setProofError(message); else setError(message);
      if (err.response?.status === 409) await loadData();
    } finally { setCompleting(false); }
  };
  const handleComplete = task => {
    if (task.requiresProof) { setProofTask(task); setProof({ note: '', proofUrl: '', focusMinutes: '' }); setProofError(''); }
    else complete(task);
  };
  const createAnother = task => {
    openEdit(task);
    setModal({ mode: 'create' });
  };

  // Filtering happens client-side: we already have all the tasks in memory.
  const visibleTasks = tasks.filter((t) => {
    if (frequencyTab !== 'all' && t.frequency !== frequencyTab) return false;
    if (skillFilter !== 'all' && t.skill?._id !== skillFilter) return false;
    return true;
  });

  const openCreate = () => {
    setForm({ ...emptyForm, skill: skills[0]?._id || '' });
    setFormError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description || '',
      skill: task.skill?._id || '',
      difficulty: task.difficulty,
      frequency: task.frequency,
      repeatable: task.repeatable,
      requiresProof: task.requiresProof || false,
    });
    setFormError('');
    setModal({ mode: 'edit', task });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await api.post('/tasks', form);
      } else {
        await api.patch(`/tasks/${modal.task._id}`, form);
      }
      setModal(null);
      await loadData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save mission');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== task._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete mission');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Missions</h1>
          <p className="mt-1 text-sm text-slate-400">
            Check off a mission, earn XP, and keep your win on the board. Want another round? Create another mission.
          </p>
        </div>
        <button onClick={openCreate} disabled={skills.length === 0} className="btn-primary">
          + New mission
        </button>
      </div>

      <DayCountdown clock={clock} total={tasks.filter(task => task.frequency === 'daily' || task.repeatable).length} completed={tasks.filter(task => (task.frequency === 'daily' || task.repeatable) && task.completed).length} />
      {reward && <div role="status" className="glass p-4 text-sm text-neon">✦ {reward}</div>}
      <ErrorMessage message={error} />

      {skills.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center py-20 text-center">
          <p className="text-3xl">⌖</p>
          <p className="mt-3 text-sm font-medium text-slate-300">Missions need a skill first</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Create at least one skill, then come back and add missions under it.
          </p>
          <Link to="/skills" className="btn-primary mt-6">
            Go to Skills
          </Link>
        </div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-edge bg-white/[0.02] p-1">
              {FREQUENCY_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFrequencyTab(tab.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    frequencyTab === tab.value
                      ? 'bg-neon/10 text-neon'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="input !w-auto !py-1.5 text-xs"
            >
              <option value="all">All skills</option>
              {skills.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mission list */}
          {visibleTasks.length === 0 ? (
            <div className="glass flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm font-medium text-slate-300">No missions match</p>
              <p className="mt-1 text-xs text-slate-500">
                {tasks.length === 0
                  ? 'Create your first mission to start earning XP.'
                  : 'Try a different filter.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleTasks.map((task) => (
                <TaskCard key={task._id} task={task} onEdit={openEdit} onDelete={handleDelete} onComplete={handleComplete} onCreateAnother={createAnother} busy={completing} />
              ))}
            </div>
          )}
        </>
      )}

      <Modal open={!!proofTask} title="Complete your mission" onClose={() => !completing && setProofTask(null)}>
        <form className="space-y-4" onSubmit={e => { e.preventDefault(); complete(proofTask, proof); }}>
          <p className="text-sm text-slate-400">{proofTask?.title}: add a note, a link, or at least 25 focus minutes.</p>
          <ErrorMessage message={proofError} />
          <label className="block text-sm">What did you accomplish?<textarea className="input mt-2" maxLength={300} value={proof.note} onChange={e => setProof({ ...proof, note: e.target.value })} /></label>
          <label className="block text-sm">Proof link<input className="input mt-2" type="url" value={proof.proofUrl} onChange={e => setProof({ ...proof, proofUrl: e.target.value })} /></label>
          <label className="block text-sm">Focus minutes<input className="input mt-2" type="number" min={0} max={600} value={proof.focusMinutes} onChange={e => setProof({ ...proof, focusMinutes: e.target.value })} /></label>
          <button className="btn-primary w-full" disabled={completing}>{completing ? 'Saving…' : 'Complete mission'}</button>
        </form>
      </Modal>
      {/* Create / edit modal */}
      <Modal
        open={!!modal}
        title={modal?.mode === 'create' ? 'New mission' : 'Edit mission'}
        onClose={() => setModal(null)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <ErrorMessage message={formError} />

          <div>
            <label htmlFor="task-title" className="mb-1.5 block text-sm font-medium text-slate-300">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              required
              minLength={3}
              maxLength={100}
              className="input"
              placeholder="e.g. Solve 2 LeetCode problems"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="task-desc" className="mb-1.5 block text-sm font-medium text-slate-300">
              Description <span className="text-slate-500">(optional)</span>
            </label>
            <textarea
              id="task-desc"
              rows={2}
              maxLength={500}
              className="input resize-none"
              placeholder="Any details or rules for yourself"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="task-skill" className="mb-1.5 block text-sm font-medium text-slate-300">
              Skill
            </label>
            <select
              id="task-skill"
              required
              className="input"
              value={form.skill}
              onChange={(e) => setForm({ ...form, skill: e.target.value })}
            >
              {skills.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.icon} {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">Difficulty</p>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setForm({ ...form, difficulty: d.value })}
                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    form.difficulty === d.value
                      ? d.classes
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/25'
                  }`}
                >
                  {d.label} <span className="opacity-70">+{d.xp} XP</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-freq" className="mb-1.5 block text-sm font-medium text-slate-300">
                Frequency
              </label>
              <select
                id="task-freq"
                className="input"
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex cursor-pointer items-end gap-2 pb-2.5 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={form.repeatable}
                onChange={(e) => setForm({ ...form, repeatable: e.target.checked })}
                className="h-4 w-4 accent-[#22d3ee]"
              />
              Repeat daily
            </label>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={form.requiresProof}
              onChange={(e) => setForm({ ...form, requiresProof: e.target.checked })}
              className="h-4 w-4 accent-[#22d3ee]"
            />
            Require proof
            <span className="text-xs text-slate-500">(focus minutes, note, or link to complete)</span>
          </label>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : modal?.mode === 'create' ? 'Create mission' : 'Save changes'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
