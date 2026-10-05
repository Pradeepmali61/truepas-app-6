/**
 * Document number for display. Older app versions created documents with the
 * placeholder number "PENDING"; the backend masks it like a real number
 * ("•••DING"). Those placeholders, and empty numbers, display as nothing so
 * callers can show their own fallback ("—" or just the expiry).
 */
export function displayDocNumber(n: string | null | undefined): string {
  const raw = (n ?? '').trim();
  if (!raw) return '';
  const core = raw.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  // A visible tail of the word PENDING with no digits = the old placeholder.
  if (core && !/\d/.test(core) && 'PENDING'.endsWith(core)) return '';
  return raw;
}
