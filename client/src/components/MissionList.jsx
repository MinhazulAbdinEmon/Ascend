import { difficultyMeta } from '../lib/game';

// Mission list with working complete buttons.
// Props:
//   tasks            - today's tasks
//   completedTaskIds - ids already completed today (from /api/stats/dashboard)
//   completingId     - task currently being submitted (disables its button)
//   onComplete(task) - called when the user clicks the circle
export default function MissionList({ tasks, completedTaskIds = [], completingId, onComplete }) {
  const completedSet = new Set(completedTaskIds);

  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const diff = difficultyMeta(task.difficulty);
        const doneToday = completedSet.has(task._id);
        const locked = doneToday && !task.repeatable; // repeatable tasks stay clickable

        return (
          <li
            key={task._id}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition ${
              doneToday
                ? 'border-neon/20 bg-neon/[0.04]'
                : 'border-white/5 bg-white/[0.02] hover:border-white/15'
            }`}
          >
            <button
              onClick={() => !locked && onComplete(task)}
              disabled={locked || completingId === task._id}
              title={
                locked
                  ? 'Completed - come back tomorrow'
                  : doneToday
                    ? 'Repeatable - complete again'
                    : 'Complete mission'
              }
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition active:scale-90 sm:h-8 sm:w-8 ${
                doneToday
                  ? 'border-neon/60 bg-neon/20 text-neon'
                  : 'border-white/20 text-transparent hover:border-neon/60 hover:text-neon/60'
              } ${locked ? 'cursor-default' : 'cursor-pointer'} ${
                completingId === task._id ? 'animate-pulse' : ''
              }`}
            >
              {doneToday && !locked ? '↻' : '✓'}
            </button>

            <span className="text-base">{task.skill?.icon || '🎯'}</span>
            <span
              className={`min-w-0 flex-1 truncate text-sm ${
                locked ? 'text-slate-500 line-through' : 'text-slate-200'
              }`}
            >
              {task.title}
              {task.requiresProof && (
                <span className="ml-1.5 text-xs" title="Requires proof: focus minutes, note, or link">
                  📎
                </span>
              )}
            </span>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${diff.classes}`}>
              +{task.xpReward} XP
            </span>
          </li>
        );
      })}
    </ul>
  );
}
