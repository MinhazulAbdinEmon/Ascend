import { Link } from 'react-router-dom';
import { RANKS, DIFFICULTIES } from '../lib/game';
import RankBadge from '../components/RankBadge';

// The game manual. Static page - all numbers here mirror
// server/src/utils/gameConfig.js (keep them in sync when tuning).
const Section = ({ title, children }) => (
  <div className="glass p-6">
    <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
    <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-400">{children}</div>
  </div>
);

const Chip = ({ children }) => (
  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-xs text-neon">{children}</span>
);

export default function Guide() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">How Ascend works</h1>
        <p className="mt-1 text-sm text-slate-400">
          The manual. Read it once and the whole game makes sense.
        </p>
      </div>

      <Section title="The goal">
        <p>
          Ascend is a ranked ladder for real life. You define what "better" means —{' '}
          <span className="text-slate-200">skills</span> like Coding, Fitness or Study — then grind
          daily <span className="text-slate-200">missions</span> under them. Completing missions
          earns XP, builds streaks, fills your heatmap, and once a week the game judges your
          performance and moves your rank up or down.
        </p>
        <p className="font-medium text-slate-300">
          The core loop: create missions → complete them daily → earn XP → protect your streak →
          win the week → climb the ladder.
        </p>
      </Section>

      <Section title="Missions & XP">
        <p>Every mission has a difficulty that sets its base XP:</p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((d) => (
            <span key={d.value} className={`rounded-full border px-3 py-1 text-xs font-semibold ${d.classes}`}>
              {d.label} +{d.xp} XP
            </span>
          ))}
        </div>
        <p>
          Missions are <span className="text-slate-200">daily</span> (completable once per day),{' '}
          <span className="text-slate-200">weekly</span> (once per Mon–Sun week), or{' '}
          <span className="text-slate-200">one-time</span>. Mark a mission{' '}
          <span className="text-slate-200">repeatable</span> to complete it multiple times a day
          (e.g. "drink water").
        </p>
        <p>
          <span className="text-slate-200">Boosts:</span> attach proof when completing — a note
          (<Chip>×1.05</Chip>), an image link (<Chip>×1.10</Chip>), or a verifiable link like a
          GitHub commit (<Chip>×1.20</Chip>). Your streak also boosts XP: 3 days{' '}
          <Chip>×1.05</Chip>, 7 days <Chip>×1.10</Chip>, 14 days <Chip>×1.15</Chip>, 30 days{' '}
          <Chip>×1.20</Chip>.
        </p>
        <p>
          Missions marked <span className="text-slate-200">📎 requires proof</span> only complete
          with evidence: 25+ focus minutes, a note, or a link.
        </p>
      </Section>

      <Section title="The anti-grind rules">
        <p>You cannot farm your way up. The system caps everything:</p>
        <ul className="list-inside list-disc space-y-1">
          <li>Max <Chip>300 XP</Chip> per day, total.</li>
          <li>Per difficulty per day: easy <Chip>60</Chip>, medium <Chip>125</Chip>, hard <Chip>200</Chip>.</li>
          <li>After 6 completions in a day, everything pays half XP.</li>
          <li>Completions past the caps still count for your heatmap and streak — just 0 XP.</li>
        </ul>
        <p>
          Translation: one monster day is worth at most 300 XP. Seven normal days are worth up to
          2,100. The math always favors showing up.
        </p>
      </Section>

      <Section title="Level — your lifetime record">
        <p>
          Level comes from total XP and <span className="text-slate-200">never goes down</span>.
          Reaching level L takes <Chip>100 × (L−1)²</Chip> XP: level 2 at 100, level 3 at 400,
          level 5 at 1,600, level 10 at 8,100. It's your odometer — proof of everything you've
          ever done, separate from rank.
        </p>
      </Section>

      <Section title="Rank — your current discipline">
        <p>
          Rank comes from your <span className="text-slate-200">rating</span>. Everyone starts at{' '}
          <Chip>1000</Chip> (Grinder). Rookie below you is a demotion tier — you only fall there by
          coasting.
        </p>
        <div className="flex flex-wrap gap-2">
          {[...RANKS].reverse().map((r) => (
            <span key={r.name} className="flex items-center gap-1.5">
              <RankBadge rank={r.name} />
              <span className="text-xs text-slate-600">{r.minRating === 0 ? '<900' : `${r.minRating}+`}</span>
            </span>
          ))}
        </div>
        <p>
          Your rating moves <span className="text-slate-200">once a week</span>, when the Mon–Sun
          week ends. The game computes your <span className="text-slate-200">weekly score</span>{' '}
          (0–100):
        </p>
        <ul className="list-inside list-disc space-y-1">
          <li><span className="text-slate-200">Consistency, 40%</span> — days with meaningful work (20+ XP or 2+ missions) out of 7. The king stat.</li>
          <li><span className="text-slate-200">XP earned, 25%</span> — vs a 1,400 XP/week target.</li>
          <li><span className="text-slate-200">Focus time, 15%</span> — tracked focus minutes vs 10h/week.</li>
          <li><span className="text-slate-200">Improvement, 10%</span> — did you beat last week?</li>
          <li><span className="text-slate-200">Streak, 10%</span> — maxes at 30 days.</li>
        </ul>
        <p>
          Then: <Chip>rating change = (your score − expected score) × K</Chip>. The expected score
          rises with your rating — a Grinder is expected to score ~22, an Elite ~53, a Spartan ~78.
          Beat expectations and you climb. Coast and you fall. The higher you go, the harder it is
          to stay. That's the ladder.
        </p>
        <p className="text-slate-300">
          The "This week" card on your dashboard shows your live score and projected rating change
          at all times — you always know where you stand before Sunday.
        </p>
      </Section>

      <Section title="Streaks & the heatmap">
        <p>
          Your streak grows the first time you complete anything each day, and resets if you skip a
          day. It boosts XP (up to ×1.2) and feeds your weekly score — but its real job is the 🔥
          number you don't want to lose.
        </p>
        <p>
          The heatmap is your year at a glance, GitHub-style: empty → low (1 mission) → medium
          (2–4) → high (5+). It can't be faked, bought, or crammed. Six months from now it IS your
          proof of who you were.
        </p>
      </Section>

      <Section title="Leaderboard & seasons">
        <p>
          <span className="text-slate-200">This week</span> ranks everyone by live weekly score —
          it resets every Monday, so anyone can win any week.{' '}
          <span className="text-slate-200">Season</span> ranks by rating — the real ladder. Seasons
          run ~10 weeks; future seasons will soft-reset ratings so the climb stays fresh.
        </p>
      </Section>

      <Section title="How to actually climb (strategy)">
        <ul className="list-inside list-disc space-y-1">
          <li>Create 3–5 daily missions you can do on your worst day. Consistency is 40% of your score.</li>
          <li>Make one of them a deep-work mission with proof required — 75 XP and it keeps you honest.</li>
          <li>Log focus minutes on study/work sessions. That 15% is free rating most players ignore.</li>
          <li>Never skip two days in a row: one bad day dents the week, two kill the streak.</li>
          <li>Don't spam easy tasks — caps make it pointless. One hard task beats five easy ones.</li>
        </ul>
        <p>
          <Link to="/tasks" className="font-semibold text-neon hover:underline">
            Create your first missions →
          </Link>
        </p>
      </Section>
    </div>
  );
}
