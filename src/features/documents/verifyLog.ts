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

/* ── image size from the header (no full decode) ─────────────────────── */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INDEX = new Map([...B64].map((c, i) => [c, i]));

/** Decode the first `maxBytes` of a base64 string. */
function decodeHead(b64: string, maxBytes: number): Uint8Array {
  const chars = b64.slice(0, Math.ceil(maxBytes / 3) * 4 + 64).replace(/[^A-Za-z0-9+/]/g, '');
  const out = new Uint8Array(Math.floor(chars.length / 4) * 3);
  let o = 0;
  for (let i = 0; i + 3 < chars.length; i += 4) {
    const n =
      (B64_INDEX.get(chars[i])! << 18) |
      (B64_INDEX.get(chars[i + 1])! << 12) |
      (B64_INDEX.get(chars[i + 2])! << 6) |
      B64_INDEX.get(chars[i + 3])!;
    out[o++] = (n >> 16) & 255;
    out[o++] = (n >> 8) & 255;
    out[o++] = n & 255;
  }
  return out.subarray(0, o);
}

/** Width × height from a JPEG's SOF marker or a PNG's IHDR. */
function dimensions(b: Uint8Array): { w: number; h: number } | null {
  if (b[0] === 0x89 && b[1] === 0x50 && b.length >= 24) {
    const u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    return { w: u32(16), h: u32(20) };
  }
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1; // fill byte
      continue;
    }
    // Start-of-frame markers (not DHT C4, JPG C8, DAC CC) carry the size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8] };
    }
    i += 2 + ((b[i + 2] << 8) | b[i + 3]);
  }
  return null;
}

/** "1080x1920 477KB" for a base64 image (data: prefix allowed), or undefined. */
export function imageLabel(base64?: string | null): string | undefined {
  if (!base64) return undefined;
  const raw = base64.startsWith('data:') ? base64.slice(base64.indexOf(',') + 1) : base64;
  const kb = Math.round((raw.length * 3) / 4 / 1024);
  let size: { w: number; h: number } | null = null;
  try {
    size = dimensions(decodeHead(raw, 64 * 1024));
  } catch {
    // Unreadable header — size alone is still useful.
  }
  return size ? `${size.w}x${size.h} ${kb}KB` : `${kb}KB`;
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
