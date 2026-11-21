import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { scheduleTimerAlarm } from '../lib/timerAlarm';

const FocusContext = createContext(null);
export const useFocus = () => useContext(FocusContext);
export const formatClock = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function FocusProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [celebration, setCelebration] = useState(null);
  const [revision, setRevision] = useState(0);
  const [permission, setPermission] = useState(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);
  const lock = useRef(false);
  const retryAt = useRef(0);
  const requestVersion = useRef(0);
  const alerted = useRef(new Set());
  const audio = useRef(null);
  const alarm = useRef(null);
  const preview = useRef(null);
  const armedSession = useRef(null);
  const [soundReady, setSoundReady] = useState(false);
  const [soundError, setSoundError] = useState('');
  const [volume, setVolume] = useState(0.8);
  const stopAlarm = () => { alarm.current?.(); alarm.current = null; preview.current?.(); preview.current = null; };
  const dismissNotice = () => { stopAlarm(); setCelebration(null); };
  const accept = useCallback(value => setSession(value ? { ...value, receivedAt: Date.now() } : null), []);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    try { const { data } = await api.get('/focus/current', { timeout: 10000 }); if (version === requestVersion.current) { accept(data.session); setError(''); setLoaded(true); } }
    catch (err) { setError(err.response?.data?.message || 'Could not reconnect to your timer.'); }
  }, [accept]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    const sync = () => { if (!document.hidden && !lock.current) { refresh(); setRevision(value => value + 1); } };
    document.addEventListener('visibilitychange', sync);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', sync); };
  }, [refresh]);
  const elapsed = session ? session.elapsedSeconds + (session.status === 'running' ? Math.max(0, now - session.receivedAt) / 1000 : 0) : 0;
  const remaining = session ? Math.max(0, Math.ceil(session.minutes * 60 - elapsed)) : 0;

  useEffect(() => () => { alarm.current?.(); preview.current?.(); audio.current?.close().catch(() => {}); }, []);
  const unlockSound = async () => {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Sound is unavailable in this browser.');
      if (!audio.current || audio.current.state === 'closed') audio.current = new Audio();
      await audio.current.resume();
      if (audio.current.state !== 'running') throw new Error('Click Test alarm to enable sound in this tab.');
      setSoundReady(true); setSoundError('');
      return audio.current;
    } catch (err) { setSoundReady(false); setSoundError(err.message || 'Could not enable alarm sound.'); return null; }
  };
  const testAlarm = async () => {
    const context = await unlockSound();
    if (context) { preview.current?.(); preview.current = scheduleTimerAlarm(context, { volume, pulses: 3 }); }
  };
  useEffect(() => {
    if (!session) return;
    if (session.status !== 'running') { stopAlarm(); armedSession.current = null; return; }
    if (!soundReady || !audio.current || audio.current.state !== 'running') return;
    // Re-arm after a pause, resume, volume change or server clock sync.
    alarm.current?.();
    const delay = Math.max(0, session.minutes * 60 - session.elapsedSeconds - (Date.now() - session.receivedAt) / 1000);
    alarm.current = scheduleTimerAlarm(audio.current, { delay, volume });
    armedSession.current = session._id;
  }, [session, soundReady, volume]);
  const notify = value => {
    if (alerted.current.has(value._id)) return;
    alerted.current.add(value._id);
    setCelebration(value); setRevision(n => n + 1);
    if (armedSession.current !== value._id && audio.current?.state === 'running') {
      alarm.current?.(); alarm.current = scheduleTimerAlarm(audio.current, { volume });
      armedSession.current = value._id;
    }
    const title = value.kind === 'focus' ? 'Focus complete. Time to recharge!' : 'Break over. Ready for your next move?';
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try { new Notification(title, { body: value.kind === 'focus' ? `${value.minutes} focused minute${value.minutes === 1 ? '' : 's'} saved to Statistics.` : 'Start another focus session when you’re ready.', tag: value._id }); } catch { /* In-app notification works on unsupported browsers. */ }
    }
  };
  const act = async (action, options) => {
    if (lock.current) return false;
    if (action === 'start' || action === 'resume') { stopAlarm(); unlockSound(); }
    lock.current = true; requestVersion.current++; setBusy(true); setError('');
    try {
      const { data } = await api.post(action === 'start' ? '/focus' : `/focus/${session._id}/${action}`, options || {}, { timeout: 10000 });
      const value = data.session;
      if (value.status === 'completed') { accept(null); notify(value); }
      else if (value.status === 'cancelled') { stopAlarm(); armedSession.current = null; accept(null); }
      else accept(value);
      if (action === 'start') setCelebration(null);
      return true;
    } catch (err) {
      if (err.response?.status === 409) await refresh();
      setError(err.response?.data?.message || 'Connection lost. Your session is safe; retry when connected.');
      retryAt.current = Date.now() + 10000;
      return false;
    } finally { lock.current = false; setBusy(false); }
  };
  useEffect(() => {
    if (session?.status === 'running' && remaining === 0 && !lock.current && now >= retryAt.current) act('finish');
  }, [remaining, now, session]);
  useEffect(() => {
    if (!session) return;
    const original = document.title;
    document.title = `${formatClock(remaining)} · ${session.kind === 'focus' ? 'Focus' : 'Break'} · Ascend`;
    return () => { document.title = original; };
  }, [remaining, session]);
  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    try { setPermission(await Notification.requestPermission()); } catch { setPermission('unsupported'); }
  };
  const silence = () => {
    // Testing/silencing during a session must not cancel its future completion alarm.
    preview.current?.(); preview.current = null;
    if (!session || remaining === 0) { alarm.current?.(); alarm.current = null; }
  };
  const changeVolume = value => { if (!session) stopAlarm(); setVolume(value); };
  return <FocusContext.Provider value={{ session, remaining, loaded, busy, error, act, refresh, revision, permission, enableNotifications, unlockSound, celebration, soundReady, soundError, volume, setVolume: changeVolume, testAlarm, stopAlarm: silence }}>
    {children}
    {celebration && <div className="focus-notice" role="status" aria-live="polite"><button className="notice-close" aria-label="Dismiss timer notification" onClick={dismissNotice}>×</button><span className="text-3xl text-neon">{celebration.kind === 'focus' ? '✦' : '☕'}</span><strong>{celebration.kind === 'focus' ? 'Focus complete. You earned a break.' : 'Recharged. Your next move is waiting.'}</strong><p>{celebration.kind === 'focus' ? `${celebration.minutes} minute${celebration.minutes === 1 ? '' : 's'} saved to your statistics.` : 'Break time stays separate from productivity time.'}</p><div className="flex gap-2 flex-wrap mt-3"><button className="btn-ghost" onClick={stopAlarm}>Silence alarm</button>{!session && <button disabled={busy} className="btn-primary" onClick={() => { unlockSound(); act('start', { kind: celebration.kind === 'focus' ? 'break' : 'focus', minutes: celebration.kind === 'focus' ? 5 : 25 }); }}>{celebration.kind === 'focus' ? '☕ Take a 5-minute break' : '▶ Start 25-minute focus'}</button>}<Link className="btn-ghost" to="/statistics" onClick={dismissNotice}>View statistics ↗</Link></div></div>}
  </FocusContext.Provider>;
}
