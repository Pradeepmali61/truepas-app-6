/**
 * Facts about a JPEG or PNG read from its first bytes, without decoding the
 * image: pixel size and the EXIF orientation tag. Used for diagnostics and to
 * spot photos stored on their side (CameraX writes the rotation into EXIF
 * instead of turning the pixels).
 */

export interface ImageHeader {
  format: 'jpeg' | 'png';
  /** Stored pixel size — before applying the EXIF orientation. */
  width: number;
  height: number;
  /** EXIF orientation 1–8 (1 = as stored). */
  orientation: number;
}

/** Orientations 5–8 are stored a quarter turn from how the photo is viewed. */
export const isQuarterTurn = (orientation: number) => orientation >= 5 && orientation <= 8;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_INDEX = new Map([...B64].map((c, i) => [c, i]));

/** Decode the first `maxBytes` of a base64 string (data: prefix allowed). */
export function decodeBase64Head(base64: string, maxBytes: number): Uint8Array {
  const raw = base64.startsWith('data:') ? base64.slice(base64.indexOf(',') + 1) : base64;
  const chars = raw.slice(0, Math.ceil(maxBytes / 3) * 4 + 64).replace(/[^A-Za-z0-9+/]/g, '');
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

/** The orientation tag from an APP1 "Exif" segment, or null. */
function exifOrientation(b: Uint8Array, start: number, end: number): number | null {
  // "Exif\0\0", then a TIFF header: byte order, 42, offset of IFD0.
  if (end - start < 14 || b[start] !== 0x45 || b[start + 1] !== 0x78 || b[start + 2] !== 0x69 || b[start + 3] !== 0x66) {
    return null;
  }
  const tiff = start + 6;
  const little = b[tiff] === 0x49; // "II"
  const u16 = (p: number) => (little ? b[p] | (b[p + 1] << 8) : (b[p] << 8) | b[p + 1]);
  const u32 = (p: number) =>
    (little
      ? b[p] | (b[p + 1] << 8) | (b[p + 2] << 16) | (b[p + 3] << 24)
      : (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3]) >>> 0;
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > end) return null;
  const count = u16(ifd);
  for (let k = 0; k < count; k++) {
    const entry = ifd + 2 + k * 12;
    if (entry + 12 > end) return null;
    if (u16(entry) === 0x0112) return u16(entry + 8);
  }
  return null;
}

/** Size and orientation from the start of an image file, or null if unreadable. */
export function readImageHeader(b: Uint8Array): ImageHeader | null {
  if (b.length >= 24 && b[0] === 0x89 && b[1] === 0x50) {
    const u32 = (i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
    return { format: 'png', width: u32(16), height: u32(20), orientation: 1 };
  }
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let orientation = 1;
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1; // fill byte
      continue;
    }
    const length = (b[i + 2] << 8) | b[i + 3];
    if (marker === 0xe1) {
      orientation = exifOrientation(b, i + 4, Math.min(b.length, i + 2 + length)) ?? orientation;
    }
    // Start-of-frame markers (not DHT C4, JPG C8, DAC CC) carry the size.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { format: 'jpeg', height: (b[i + 5] << 8) | b[i + 6], width: (b[i + 7] << 8) | b[i + 8], orientation };
    }
    i += 2 + length;
  }
  return null;
}

/** "1080x1920 477KB", with " exif=6" when the photo is stored rotated or mirrored. */
export function describeImage(header: ImageHeader | null, bytes: number): string {
  const kb = `${Math.round(bytes / 1024)}KB`;
  if (!header) return kb;
  return `${header.width}x${header.height}${header.orientation !== 1 ? ` exif=${header.orientation}` : ''} ${kb}`;
}
