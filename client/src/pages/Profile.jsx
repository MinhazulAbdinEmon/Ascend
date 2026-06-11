import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProfileHeader from '../components/ProfileHeader';
import RankLadder from '../components/RankLadder';
import Heatmap from '../components/Heatmap';
import WeeklyScoreCard from '../components/WeeklyScoreCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [heatmapDays, setHeatmapDays] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, heatRes, weeklyRes] = await Promise.all([
          api.get('/stats/profile'),
          api.get('/stats/heatmap?days=366'),
          api.get('/stats/weekly'),
        ]);
        setProfile(profileRes.data);
        setHeatmapDays(heatRes.data.days);
        setWeekly(weeklyRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load your profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) return <ErrorMessage message={error} />;

  const { user, totalCompletions, skills, bestSkill } = profile;
  const activeDays = heatmapDays.filter((d) => d.count > 0).length;
  const maxSkillXP = Math.max(...skills.map((s) => s.totalXP), 1);

  const stats = [
    { label: 'Total XP', value: user.totalXP, color: 'text-neon' },
    { label: 'Missions completed', value: totalCompletions, color: 'text-white' },
    { label: 'Current streak', value: `${user.currentStreak}d`, color: 'text-ember' },
    { label: 'Longest streak', value: `${user.longestStreak}d`, color: 'text-violet' },
  ];

  return (
    <div className="space-y-6">
      <ProfileHeader user={user} />

      {/* Lifetime stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="glass p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className={`mt-2 font-display text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Rank ladder */}
      <RankLadder rankRating={user.rankRating} />

      {/* Weekly performance: live week + last finalized week */}
      <WeeklyScoreCard data={weekly?.live} />
      {weekly?.lastWeek && (
        <div className="glass flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Last week</p>
            <p className="mt-1 text-sm text-slate-300">
              Score <span className="font-semibold text-white">{weekly.lastWeek.weeklyScore}</span> · expected{' '}
              {weekly.lastWeek.expectedScore} · {weekly.lastWeek.activeDays} active days
            </p>
          </div>
          <p
            className={`font-display text-2xl font-bold ${
              weekly.lastWeek.ratingChange > 0
                ? 'text-emerald-400'
                : weekly.lastWeek.ratingChange < 0
                  ? 'text-danger'
                  : 'text-slate-400'
            }`}
          >
            {weekly.lastWeek.ratingChange > 0 ? '+' : ''}
            {weekly.lastWeek.ratingChange} rating
          </p>
        </div>
      )}

      {/* Full-year heatmap */}
      <div className="glass p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-white">Consistency grid</h2>
          <span className="text-xs text-slate-500">
            {activeDays} active day{activeDays === 1 ? '' : 's'} in the last year
          </span>
        </div>
        <div className="mt-4">
          <Heatmap days={heatmapDays} weeks={52} />
        </div>
      </div>

      {/* Skill breakdown */}
      <div className="glass p-6">
        <h2 className="font-display text-lg font-semibold text-white">Skills</h2>

        {skills.length === 0 ? (
          <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-white/10 py-10 text-center">
            <p className="text-sm text-slate-400">No skills yet.</p>
            <Link to="/skills" className="btn-primary mt-4 !py-2 text-xs">
              Create your first skill
            </Link>
          </div>
        ) : (
          <>
            {bestSkill && bestSkill.totalXP > 0 && (
              <p className="mt-1 text-sm text-slate-400">
                Best skill:{' '}
                <span className="font-semibold" style={{ color: bestSkill.color }}>
                  {bestSkill.icon} {bestSkill.name}
                </span>{' '}
                with {bestSkill.totalXP} XP
              </p>
            )}

            <div className="mt-5 space-y-4">
              {skills.map((skill) => (
                <div key={skill._id}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-200">
                      {skill.icon} {skill.name}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: skill.color }}>
                      {skill.totalXP} XP
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(skill.totalXP / maxSkillXP) * 100}%`,
                        background: skill.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
