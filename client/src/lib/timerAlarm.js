// Schedule on the audio clock: the alarm does not wait for an API response.
// Pulses have short fades to avoid clicks, and never overlap or clip.
export function scheduleTimerAlarm(context, { delay = 0, volume = 0.8, pulses = 12 } = {}) {
  const nodes = [];
  const start = context.currentTime + Math.max(0, delay);
  for (let i = 0; i < pulses; i++) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const at = start + i * 0.65;
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(i % 2 ? 880 : 660, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(Math.max(0, Math.min(1, volume)) * 0.45, at + 0.025);
    gain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)) * 0.45, at + 0.35);
    gain.gain.linearRampToValueAtTime(0, at + 0.5);
    oscillator.connect(gain); gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(at); oscillator.stop(at + 0.51);
    nodes.push({ oscillator, gain });
  }
  return () => nodes.forEach(({ oscillator, gain }) => {
    gain.disconnect();
    try { oscillator.stop(); } catch { /* Already stopped. */ }
    oscillator.disconnect();
  });
}
