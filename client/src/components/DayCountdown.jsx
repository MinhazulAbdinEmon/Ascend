export default function DayCountdown({ clock, completed, total }) {
  const { secondsLeft, timezone } = clock;
  const parts = [Math.floor(secondsLeft / 3600), Math.floor(secondsLeft / 60) % 60, secondsLeft % 60];
  const remaining = Math.max(0, total - completed);
  return <section className="day-countdown">
    <div><p className="eyebrow">MAKE TODAY COUNT</p><h2>{total && !remaining ? 'Today’s board is cleared. Nice work.' : 'There’s still time for your next win.'}</h2><p>{total ? `${completed} of ${total} daily missions complete. ` : 'Choose one small mission and start. '}{remaining ? `${remaining} left — one focused step at a time.` : 'Create another mission if you want to keep going.'}</p><small>Daily missions reset after 11:59 PM · {timezone}</small></div>
    <div className="day-clock" role="timer" aria-label={`${parts[0]} hours ${parts[1]} minutes ${parts[2]} seconds left today`}><div>{parts.map((value, i) => <span key={i}><strong>{String(value).padStart(2, '0')}</strong><small>{['HOURS', 'MINUTES', 'SECONDS'][i]}</small></span>)}</div><p>LEFT IN YOUR DAY</p></div>
  </section>;
}
