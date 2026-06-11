import { useEffect, useState } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import SkillCard from '../components/SkillCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { SKILL_COLORS, SKILL_ICONS } from '../lib/game';

const emptyForm = { name: '', color: SKILL_COLORS[0], icon: SKILL_ICONS[0] };

export default function Skills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state: null = closed, otherwise { mode: 'create' | 'edit', skill? }
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadSkills = async () => {
    try {
      const res = await api.get('/skills');
      setSkills(res.data.skills);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (skill) => {
    setForm({ name: skill.name, color: skill.color, icon: skill.icon });
    setFormError('');
    setModal({ mode: 'edit', skill });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (modal.mode === 'create') {
        await api.post('/skills', form);
      } else {
        await api.patch(`/skills/${modal.skill._id}`, form);
      }
      setModal(null);
      await loadSkills();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Could not save skill');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (skill) => {
    const sure = window.confirm(
      `Delete "${skill.name}"? Its ${skill.taskCount} mission(s) and their history will be deleted too.`
    );
    if (!sure) return;
    try {
      await api.delete(`/skills/${skill._id}`);
      setSkills((prev) => prev.filter((s) => s._id !== skill._id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete skill');
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
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">Skills</h1>
          <p className="mt-1 text-sm text-slate-400">
            The areas you're grinding. Every mission lives under a skill.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          + New skill
        </button>
      </div>

      <ErrorMessage message={error} />

      {skills.length === 0 ? (
        <div className="glass flex flex-col items-center justify-center py-20 text-center">
          <p className="text-3xl">⬡</p>
          <p className="mt-3 text-sm font-medium text-slate-300">No skills yet</p>
          <p className="mt-1 max-w-xs text-xs text-slate-500">
            Create your first skill — Coding, Fitness, Study, Reading — then add missions under it.
          </p>
          <button onClick={openCreate} className="btn-primary mt-6">
            Create your first skill
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <SkillCard key={skill._id} skill={skill} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        title={modal?.mode === 'create' ? 'New skill' : 'Edit skill'}
        onClose={() => setModal(null)}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <ErrorMessage message={formError} />

          <div>
            <label htmlFor="skill-name" className="mb-1.5 block text-sm font-medium text-slate-300">
              Name
            </label>
            <input
              id="skill-name"
              type="text"
              required
              minLength={2}
              maxLength={30}
              className="input"
              placeholder="e.g. Coding"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">Icon</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setForm({ ...form, icon })}
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition ${
                    form.icon === icon
                      ? 'border-neon/60 bg-neon/10'
                      : 'border-white/10 bg-white/5 hover:border-white/25'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-300">Color</p>
            <div className="flex flex-wrap gap-2">
              {SKILL_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm({ ...form, color })}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    form.color === color ? 'scale-110 border-white' : 'border-transparent'
                  }`}
                  style={{ background: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : modal?.mode === 'create' ? 'Create skill' : 'Save changes'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
