import { useEffect, useState } from 'react';
import api from '../api/axios';
import FocusSession from '../components/FocusSession';
import LoadingSpinner from '../components/LoadingSpinner';
import { useFocus } from '../context/FocusContext';

const duration = seconds => { const minutes = Math.round(seconds / 60); return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; };
const dayLabel = date => new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' });

export default function Statistics() {
  const { revision, session } = useFocus();
  const [range, setRange] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    api.get(`/focus/statistics?days=${range}`).then(({ data: result }) => {
      if (!cancelled) { setData(result); setSelected(result.days.at(-1)?.date); }
    }).catch(err => { if (!cancelled) setError(err.response?.data?.message || 'Could not load statistics.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range, revision, retry]);
  const today = data?.days.at(-1);
  const selectedDay = data?.days.find(day => day.date === selected);
  const peak = data?.hours.reduce((best, hour) => hour.seconds > best.seconds ? hour : best, { seconds: 0, hour: 0 });
  const maxDay = Math.max(60, ...(data?.days.map(day => day.seconds) || []));
  const maxHour = Math.max(60, ...(data?.hours.map(hour => hour.seconds) || []));
  return <div className="space-y-6">
    <div className="dashboard-heading"><div><p className="eyebrow">EVERY MINUTE IS A MOVE FORWARD</p><h1>Your effort, <span className="text-neon">in focus.</span></h1><p className="muted-copy">The time you put in. The patterns that move you forward.</p></div><div className="flex items-center gap-3 flex-wrap"><a className="subtle-link" href="#focus-chamber">Open timer ↓</a><div className="stats-range">{[7, 30].map(days => <button key={days} aria-pressed={range === days} onClick={() => setRange(days)}>Last {days} days</button>)}</div></div></div>
    <div className="statistics-layout"><div className="space-y-5 min-w-0" aria-busy={loading}>
      {error ? <div role="alert" className="glass p-6 text-danger">{error}<button className="btn-ghost ml-3" onClick={() => setRetry(n => n + 1)}>Try again</button></div> : loading ? <div className="glass py-16 flex justify-center"><LoadingSpinner /></div> : data && <>
        <div className="stats-summary-grid">{[
          ['FOCUS TODAY', duration(today?.seconds || 0), `${today?.sessions || 0} completed sessions`, 'ϟ'],
          ['TOTAL FOCUS', duration(data.totalSeconds), `Across the last ${range} days`, '◷'],
          ['DAILY AVERAGE', duration(data.totalSeconds / range), 'Including rest days', '↗'],
        ].map(([label, value, detail, icon]) => <div className="glass stat-card" key={label}><span className="stat-icon green">{icon}</span><div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div></div>)}</div>
        <section className="glass productivity-card"><div className="section-heading"><div><h2>Your daily focus</h2><p className="muted-copy">Completed timer minutes, day by day.</p></div><span className="small-tag">{data.completedSessions} SESSIONS</span></div>
          <div className="daily-chart" style={{ '--columns': range }} aria-label="Daily focus minutes">{data.days.map(day => <button key={day.date} className={`day-column ${selected === day.date ? 'selected' : ''}`} aria-pressed={selected === day.date} aria-label={`${dayLabel(day.date)}: ${Math.round(day.seconds / 60)} focus minutes, ${day.sessions} sessions`} onClick={() => setSelected(day.date)}><span className="day-bar-area"><span className="day-bar" style={{ height: `${Math.max(2, day.seconds / maxDay * 100)}%` }} /></span><span className="day-axis">{range === 7 ? new Date(day.date + 'T12:00:00Z').toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }) : day.date.slice(-2)}</span></button>)}</div>
          <div className="chart-detail" aria-live="polite"><span>{selectedDay ? dayLabel(selectedDay.date) : 'Choose a day'}</span><strong>{duration(selectedDay?.seconds || 0)}</strong><span>{selectedDay?.sessions || 0} sessions</span></div>
          {!data.totalSeconds && <p className="chart-empty">Your first focused session starts the story. Start the timer and finish a session to light up your chart.</p>}
        </section>
        <section className="glass productivity-card"><div className="section-heading"><div><h2>Find your productive hours</h2><p className="muted-copy">Focus time grouped by hour of day.</p></div><span className="small-tag">{peak.seconds ? `PEAK · ${String(peak.hour).padStart(2, '0')}:00` : 'BUILD YOUR PATTERN'}</span></div>
          <div className="hour-chart" aria-label="Focus time by hour of day">{data.hours.map(hour => <div className="hour-column" key={hour.hour}><div className="hour-bar-area"><button className="hour-bar" style={{ height: `${Math.max(3, hour.seconds / maxHour * 100)}%` }} aria-label={`${hour.hour}:00–${hour.hour + 1}:00: ${Math.round(hour.seconds / 60)} focused minutes`} title={`${hour.hour}:00–${hour.hour + 1}:00 · ${duration(hour.seconds)}`}><span className="hour-tooltip">{hour.hour}:00 · {duration(hour.seconds)}</span></button></div>{hour.hour % 6 === 0 && <small>{String(hour.hour).padStart(2, '0')}:00</small>}</div>)}</div>
          <p className="timer-footnote">Timezone: {data.timezone}. Sessions crossing midnight are split across days.</p>
        </section>
        <section className="glass productivity-card"><div className="section-heading"><h2>Recent focus sessions</h2><span className="subtle-link">Saved automatically ✓</span></div>{data.recent.length ? <ul className="session-history">{data.recent.map(item => <li key={item.id}><span className="session-check">✓</span><div><strong>{item.label}</strong><small>{new Date(item.completedAt).toLocaleString(undefined, { timeZone: data.timezone, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</small></div><b>{item.minutes} min</b></li>)}</ul> : <p className="chart-empty">No completed focus sessions yet. Free focus works even without a mission.</p>}</section>
        <p className="timer-footnote">These charts use completed focus timers only. Manually entered mission minutes and breaks are excluded.</p>
      </>}
    </div><div className="space-y-5"><FocusSession /><section className="glass p-6"><p className="eyebrow">YOUR NEXT SMALL WIN</p><h2 className="font-display text-lg mt-3">Focus. Recover. Repeat.</h2><p className="muted-copy">Try 25 minutes of focused effort, followed by a 5-minute break. A short walk or stretch makes the next session easier.</p>{session && <p className="mt-4 text-xs text-neon">Your {session.kind} session is {session.status}. You can explore the app while it runs.</p>}</section></div></div>
  </div>;
}
