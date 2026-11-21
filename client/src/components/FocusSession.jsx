import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useFocus, formatClock } from '../context/FocusContext';

export default function FocusSession({ tasks = [] }) {
  const timer = useFocus();
  const [mode, setMode] = useState('focus');
  const [duration, setDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [taskId, setTaskId] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const { session, busy, loaded, remaining, error, act } = timer;
  const kind = session?.kind || mode;
  const minutes = session?.minutes || (kind === 'focus' ? duration : breakDuration);
  const seconds = session ? remaining : minutes * 60;
  useEffect(() => { setConfirmReset(false); }, [session?._id]);
  const running = session?.status === 'running';
  const presets = kind === 'focus' ? [15, 25, 50] : [5, 10, 15];
  return <section id="focus-chamber" className={`glass focus-card ${kind === 'break' ? 'break-mode' : ''}`}>
    <div className="section-heading"><h2>Focus chamber</h2><Link to="/statistics" className="small-tag">YOUR STATS ↗</Link></div>
    <div className="focus-mode-switch">{['focus', 'break'].map(value => <button key={value} disabled={!!session || busy} aria-pressed={kind === value} onClick={() => setMode(value)}>{value === 'focus' ? '⌖ Focus' : '☕ Break'}</button>)}</div>
    <p className="muted-copy text-center">{kind === 'focus' ? 'One mission. Your undivided attention.' : 'Step away. Stretch. Let your mind recharge.'}</p>
    <div className={`timer-ring ${running ? 'timer-running' : ''}`} style={{ '--progress': `${(session ? 1 - seconds / (minutes * 60) : 0) * 360}deg` }}><div><strong>{formatClock(seconds)}</strong><small>{session?.status === 'paused' ? 'PAUSED · TAKE YOUR TIME' : running ? (kind === 'focus' ? 'BUILDING YOUR NEXT LEVEL' : 'RECHARGING YOUR ENERGY') : 'READY WHEN YOU ARE'}</small></div></div>
    <div className="timer-options">{presets.map(value => <button key={value} disabled={!!session || busy} aria-pressed={minutes === value} onClick={() => kind === 'focus' ? setDuration(value) : setBreakDuration(value)}>{value} min</button>)}</div>
    <label className="custom-duration">Custom minutes<input aria-label="Custom timer minutes" type="number" min="1" max="180" value={minutes} disabled={!!session || busy} onChange={e => { const value = e.target.value === '' ? '' : Number(e.target.value); kind === 'focus' ? setDuration(value) : setBreakDuration(value); }} /></label>
    {kind === 'focus' && <><label className="sr-only" htmlFor="focus-mission">Focus mission</label>{session ? <p className="focus-session-label">⌖ {session.label}</p> : <select id="focus-mission" className="input mt-3" value={taskId} disabled={busy} onChange={e => setTaskId(e.target.value)}><option value="">Free focus · no mission needed</option>{tasks.map(task => <option key={task._id} value={task._id}>{task.title}</option>)}</select>}</>}
    <div className="mt-4 flex gap-2"><button className="btn-primary flex-1" disabled={!loaded || busy || !Number.isInteger(minutes) || minutes < 1 || minutes > 180} onClick={() => { timer.unlockSound(); session ? act(running ? 'pause' : 'resume') : act('start', { kind, minutes, label: kind === 'focus' ? tasks.find(t => t._id === taskId)?.title || 'Free focus' : 'Recharge' }); }}>{busy ? 'Saving…' : !loaded ? 'Connecting…' : running ? 'Ⅱ Pause' : session ? '▶ Resume' : kind === 'focus' ? '▶ Start focus' : '☕ Start break'}</button>{session && <button className="btn-ghost" disabled={busy} aria-label="Reset timer" onClick={() => setConfirmReset(true)}>↻</button>}</div>
    {confirmReset && session && <div className="timer-confirm"><p>Discard this session? Unfinished time won’t be added to statistics.</p><button disabled={busy} className="btn-ghost" onClick={async () => { if (await act('cancel')) setConfirmReset(false); }}>Discard session</button><button className="subtle-link" onClick={() => setConfirmReset(false)}>Keep going</button></div>}
    {error && <div role="alert" className="mt-3 text-xs text-danger">{error}<button className="block mt-2 underline" onClick={timer.refresh}>Reconnect timer</button></div>}
    <div className="alarm-controls">
      <label htmlFor="alarm-volume">Completion alarm <strong>{Math.round(timer.volume * 100)}%</strong></label>
      <input id="alarm-volume" type="range" min="0" max="100" value={Math.round(timer.volume * 100)} onChange={e => timer.setVolume(Number(e.target.value) / 100)} />
      <div className="flex gap-2"><button className="btn-ghost flex-1" onClick={timer.testAlarm}>♪ Test alarm</button><button className="btn-ghost" onClick={timer.stopAlarm}>Silence</button></div>
      <p role="status">{timer.soundError || (timer.volume === 0 ? 'Alarm muted.' : timer.soundReady ? 'Loud alarm ready · rings for 8 seconds.' : 'Start the timer or test the alarm to enable sound.')}</p>
      <small>Keep this tab open and your device volume on. After a refresh, test the alarm to re-enable sound.</small>
    </div>
    <div className="notification-setting">{timer.permission === 'default' ? <button onClick={timer.enableNotifications}>♧ Enable desktop notifications</button> : <span>{timer.permission === 'granted' ? '✓ Desktop notifications enabled' : timer.permission === 'denied' ? 'Notifications blocked in browser settings · in-app alerts active' : 'In-app completion alerts active'}</span>}</div>
    <p className="timer-footnote">{kind === 'focus' ? 'Completed focus saves automatically. Pauses and breaks don’t count.' : 'Breaks are for you. They don’t add study minutes.'}<br />Timer survives navigation and refresh. Alerts need the app open.</p>
  </section>;
}
