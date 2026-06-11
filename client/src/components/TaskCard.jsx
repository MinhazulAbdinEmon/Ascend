import { difficultyMeta } from '../lib/game';

// One mission row in the Missions list.
export default function TaskCard({ task, onEdit, onDelete }) {
  const diff = difficultyMeta(task.difficulty);

  return (
    <div className="glass group flex items-center gap-4 p-4 transition hover:border-white/20">
      {/* Skill color dot + icon */}
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{ background: `${task.skill?.color}1a`, border: `1px solid ${task.skill?.color}40` }}
      >
        {task.skill?.icon || '🎯'}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-100">{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span style={{ color: task.skill?.color }}>{task.skill?.name}</span>
          <span>·</span>
          <span className="capitalize">{task.frequency === 'once' ? 'one-time' : task.frequency}</span>
          {task.repeatable && (
            <>
              <span>·</span>
              <span>repeatable</span>
            </>
          )}
        </div>
      </div>

      <span
        className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-block ${diff.classes}`}
      >
        {diff.label} +{task.xpReward} XP
      </span>

      <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={() => onEdit(task)}
          className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-200"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task)}
          className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-danger/10 hover:text-danger"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
