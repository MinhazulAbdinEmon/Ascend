import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dayWindow, localDay } from './dayClock';

export default function useDailyReset(onReset) {
  const { user } = useAuth();
  const timezone = user?.timezone || 'UTC';
  const callback = useRef(onReset);
  callback.current = onReset;
  const [clock, setClock] = useState(() => ({ ...dayWindow(Date.now(), timezone), now: Date.now() }));
  useEffect(() => {
    let current = dayWindow(Date.now(), timezone);
    const tick = () => {
      const now = Date.now();
      if (localDay(now, timezone) !== current.date) {
        current = dayWindow(now, timezone);
        callback.current?.();
      }
      setClock({ ...current, now });
    };
    tick();
    const interval = setInterval(tick, 1000);
    const visible = () => { if (!document.hidden) { tick(); callback.current?.(); } };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', visible); };
  }, [timezone]);
  return { ...clock, timezone, secondsLeft: Math.max(0, Math.ceil((clock.resetsAt - clock.now) / 1000)) };
}
