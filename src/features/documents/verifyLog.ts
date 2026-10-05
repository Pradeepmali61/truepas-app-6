/**
 * Logs for the document scan → upload → verify flow.
 *
 * Every line of one attempt carries the same tag and id, so an attempt can be
 * followed in Metro or `adb logcat` (filter on `[DocVerify]`):
 *
 *   [DocVerify] #k3f9 start flow=self type=drivingLicense
 *   [DocVerify] #k3f9 images front=1080x1920 477KB
 *   [DocVerify] #k3f9 create document ok ms=412 document=cdb62c62-…
 *   [DocVerify] #k3f9 upload-urls ok ms=290 parts=front
 *   [DocVerify] #k3f9 put front ok ms=2140
 *   [DocVerify] #k3f9 session ok ms=480 session=… mode=presigned
 *   [DocVerify] #k3f9 verify ok ms=8930 outcome=rejected reason=DOCUMENT_FACE_MISMATCH match=0.335 portrait=yes decision=…
 *   [DocVerify] #k3f9 end rejected total=12.4s
 *
 * A failed step logs the HTTP status, endpoint, server error code/message and
 * trace id — what the backend team needs to find it in their logs.
 *
 * No personal data: never names, dates of birth, document numbers or image
 * bytes — only ids, codes, sizes and timings.
 */
import { AxiosError } from 'axios';

import { decodeBase64Head, describeImage, readImageHeader } from '@/utils/imageHeader';

export type LogFields = Record<string, unknown>;

const TAG = '[DocVerify]';

function format(fields?: LogFields): string {
  if (!fields) return '';
  return Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
    .join(' ');
}

/** Status, endpoint, server code/message and trace id of a failed call. */
export function errorFields(err: unknown): LogFields {
  if (err instanceof AxiosError) {
    const data = (err.response?.data ?? {}) as Record<string, unknown>;
    return {
      http: err.response?.status ?? 'no-response',
      endpoint: `${err.config?.method?.toUpperCase() ?? ''} ${err.config?.url ?? ''}`.trim(),
      code: data.code ?? err.code,
      message: typeof data.message === 'string' ? data.message : err.message,
      trace: data.trace_id ?? data.traceId,
    };
  }
  return { error: err instanceof Error ? err.message : String(err) };
}

/** "1080x1920 477KB" for a base64 image (data: prefix allowed), or undefined. */
export function imageLabel(base64?: string | null): string | undefined {
  if (!base64) return undefined;
  const raw = base64.startsWith('data:') ? base64.slice(base64.indexOf(',') + 1) : base64;
  let header = null;
  try {
    header = readImageHeader(decodeBase64Head(raw, 256 * 1024));
  } catch {
    // Unreadable header — the size alone is still useful.
  }
  return describeImage(header, (raw.length * 3) / 4);
}

/* ── per-attempt logger ──────────────────────────────────────────────── */

export interface DocLog {
  readonly id: string;
  info(event: string, fields?: LogFields): void;
  warn(event: string, fields?: LogFields): void;
  /** Runs an async step and logs `<event> ok` or `<event> failed` with its duration. */
  step<T>(event: string, run: () => Promise<T>, describe?: (result: T) => LogFields): Promise<T>;
  /** Last line of the attempt, with the total time. */
  end(outcome: string, fields?: LogFields): void;
}

export function startDocLog(context: LogFields): DocLog {
  const id = Math.random().toString(36).slice(2, 6);
  const startedAt = Date.now();
  const line = (level: 'log' | 'warn', event: string, fields?: LogFields) =>
    console[level](TAG, `#${id}`, event, format(fields));

  line('log', 'start', context);
  return {
    id,
    info: (event, fields) => line('log', event, fields),
    warn: (event, fields) => line('warn', event, fields),
    async step(event, run, describe) {
      const t = Date.now();
      try {
        const result = await run();
        line('log', `${event} ok`, { ms: Date.now() - t, ...(describe ? describe(result) : {}) });
        return result;
      } catch (err) {
        line('warn', `${event} failed`, { ms: Date.now() - t, ...errorFields(err) });
        throw err;
      }
    },
    end(outcome, fields) {
      line(outcome === 'error' ? 'warn' : 'log', `end ${outcome}`, {
        ...fields,
        total: `${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
      });
    },
  };
}
