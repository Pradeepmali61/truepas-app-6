import { useEffect, useState } from 'react';

import type { ApiError } from '@/api/errors';

/**
 * Seconds until a server lock ends: `retry_after` (seconds) first, else
 * `locked_until` (ISO). null when the error carries neither.
 */
export function lockSecondsFrom(err: ApiError): number | null {
  if (err.retryAfterSeconds != null && err.retryAfterSeconds > 0) return Math.ceil(err.retryAfterSeconds);
  if (err.lockedUntil) {
    const ms = new Date(err.lockedUntil).getTime();
    if (!Number.isNaN(ms)) {
      const secs = Math.ceil((ms - Date.now()) / 1000);
      return secs > 0 ? secs : null;
    }
  }
  return null;
}

/**
 * Deadline-based lock countdown (survives re-renders and background drift).
 * `lockFor(seconds)` starts it; `secondsLeft` ticks to 0, then `locked` is false.
 */
export function useLockCountdown() {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (deadline == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left === 0) setDeadline(null);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline]);

  return {
    secondsLeft,
    locked: secondsLeft > 0,
    lockFor: (seconds: number) => setDeadline(Date.now() + seconds * 1000),
  };
}

/** 905 → "15:05", 59 → "0:59", 3725 → "1:02:05". */
export function formatWait(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}
