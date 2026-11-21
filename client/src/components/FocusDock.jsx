import { Link, useLocation } from 'react-router-dom';
import { useFocus, formatClock } from '../context/FocusContext';
export default function FocusDock() {
  const { session, remaining, busy, act } = useFocus();
  const { pathname } = useLocation();
  if (!session || ['/dashboard', '/statistics'].includes(pathname)) return null;
  return <div className="focus-dock"><Link to="/statistics">{session.kind === 'focus' ? '⌖ Focus' : '☕ Break'} <strong>{formatClock(remaining)}</strong></Link><button disabled={busy} onClick={() => act(session.status === 'running' ? 'pause' : 'resume')}>{session.status === 'running' ? 'Ⅱ Pause' : '▶ Resume'}</button></div>;
}
