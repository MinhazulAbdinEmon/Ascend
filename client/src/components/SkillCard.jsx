// One skill in the Skills grid. The left border + glow use the skill's color.
export default function SkillCard({ skill, onEdit, onDelete }) {
  return (
    <div
      className="glass group relative overflow-hidden p-5 transition hover:border-white/20"
      style={{ borderLeft: `3px solid ${skill.color}` }}
    >
      {/* Soft glow in the corner, tinted with the skill color */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: skill.color }}
      />

      <div className="flex items-start justify-between">
        <span className="text-2xl">{skill.icon}</span>
        <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onEdit(skill)}
            className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(skill)}
            className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-danger/10 hover:text-danger"
          >
            Delete
          </button>
        </div>
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold text-white">{skill.name}</h3>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>
          {skill.taskCount} mission{skill.taskCount === 1 ? '' : 's'}
        </span>
        <span style={{ color: skill.color }} className="font-semibold">
          {skill.totalXP} XP
        </span>
      </div>
    </div>
  );
}
