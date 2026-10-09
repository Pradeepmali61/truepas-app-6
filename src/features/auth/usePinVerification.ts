import { useEffect, useState } from 'react';

import { toApiError } from '@/api/errors';
import { useVerifyPin } from '@/features/auth/mutations';
import type { PinScope } from '@/types/domain';

export const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 5;
/** Contract: 5 wrong attempts lock PIN entry for 15 minutes. */
const DEFAULT_LOCK_SECONDS = 15 * 60;

/** Reads a server-provided attempts-remaining count if the backend sends one. */
function attemptsRemainingFrom(err: unknown): number | null {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const value = data?.attemptsRemaining ?? data?.attempts_remaining ?? data?.remainingAttempts;
  return typeof value === 'number' && value >= 0 ? value : null;
}

/** Reads a server-provided lock duration: retryAfter seconds or a lockedUntil
 *  timestamp (epoch seconds/ms or ISO string). Falls back to the 15-min
 *  contract default when the backend sends nothing usable. */
function lockSecondsFrom(err: unknown): number | null {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  const retry = data?.retryAfter ?? data?.retry_after ?? data?.retryAfterSeconds;
  if (typeof retry === 'number' && retry > 0) return retry;
  const until = data?.lockedUntil ?? data?.locked_until;
  if (typeof until === 'number' && until > 0) {
    const ms = until < 1e12 ? until * 1000 : until; // epoch seconds vs ms
    return Math.max(0, Math.ceil((ms - Date.now()) / 1000));
  }
  if (typeof until === 'string') {
    const ms = new Date(until).getTime();
    if (!Number.isNaN(ms)) return Math.max(0, Math.ceil((ms - Date.now()) / 1000));
  }
  return null;
}

/**
 * Shared PIN-gate logic for confirm-pin and face-update/pin: POST
 * /auth/verify-pin with real attempt accounting + lockout.
 *
 * - Only real rejections (4xx) burn an attempt — network/5xx failures don't.
 * - Lock starts on 429/423, a server-provided lock duration, an explicit
 *   attemptsRemaining: 0, or the local counter reaching 0 (contract).
 * - `locked` stays true until the countdown ends, then attempts reset. If the
 *   server lock is actually longer, the next attempt re-locks from its
 *   response.
 */
export function usePinVerification(scope?: PinScope) {
  const [pin, setPinState] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  // null = no error — screens test `error != null`, so '' must never be the
  // idle value ('' != null renders red cells + an icon with no message).
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockSecondsLeft, setLockSecondsLeft] = useState(0);
  const verifyPin = useVerifyPin(scope);

  const locked = lockSecondsLeft > 0;

  // Deadline-based countdown (same approach as useCountdown, but the duration
  // isn't known until the lock response arrives).
  useEffect(() => {
    if (lockedUntil == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000));
      setLockSecondsLeft(left);
      if (left === 0) {
        setLockedUntil(null);
        setAttemptsLeft(MAX_ATTEMPTS);
        setError(null);
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [lockedUntil]);

  /** Returns the verified PIN on success, null on failure. */
  const submit = async (value?: string): Promise<string | null> => {
    const code = value ?? pin;
    if (code.length !== PIN_LENGTH || verifyPin.isPending || locked) return null;
    setError(null);
    try {
      await verifyPin.mutateAsync(code);
      return code;
    } catch (err) {
      const apiErr = toApiError(err);
      const status = apiErr.status;
      const lockSecs = lockSecondsFrom(err);
      const remaining = attemptsRemainingFrom(err);
      const isRejection = status !== null && status >= 400 && status < 500;
      const nextAttempts = remaining ?? Math.max(0, attemptsLeft - 1);

      if (status === 429 || status === 423 || lockSecs != null || (isRejection && nextAttempts === 0)) {
        setAttemptsLeft(0);
        setLockedUntil(Date.now() + (lockSecs ?? DEFAULT_LOCK_SECONDS) * 1000);
      } else if (isRejection) {
        setAttemptsLeft(nextAttempts);
        setError(apiErr.message || 'Incorrect PIN. Please try again.');
      } else {
        // Network/timeout/5xx — not a wrong PIN, don't burn an attempt.
        setError(apiErr.message || 'Could not verify PIN. Please try again.');
      }
      setPinState('');
      return null;
    }
  };

  // Typing again after a failure clears the error state (same UX as the
  // OTP verify screens).
  const setPin = (value: string) => {
    setPinState(value);
    if (error) setError(null);
  };

  return {
    pin,
    setPin,
    submit,
    attemptsLeft,
    maxAttempts: MAX_ATTEMPTS,
    error,
    locked,
    lockSecondsLeft,
    isPending: verifyPin.isPending,
  };
}
