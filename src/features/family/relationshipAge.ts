import { ADULT_AGE } from '@/utils/age';

/** Oldest age the Add member form accepts for anyone. */
export const MAX_MEMBER_AGE = 120;
/** A parent must be at least this many years older than the account holder. */
const MIN_PARENT_GAP = 12;
/** Twins born either side of midnight can be a day apart. */
const MAX_TWIN_GAP_DAYS = 1;

/** Calendar day number for a DOB (YYYY-MM-DD, an ISO timestamp, or MM/DD/YYYY). */
function dayNumber(dob: string): number {
  const iso = dob.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const mdy = dob.match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/);
  if (!iso && !mdy) return NaN;
  const [y, m, d] = iso ? [iso[1], iso[2], iso[3]] : [mdy![3], mdy![1], mdy![2]];
  return Date.UTC(Number(y), Number(m) - 1, Number(d)) / 86_400_000;
}

/**
 * Age check for a new family member, by relationship. Returns the message to
 * show under the date of birth, or null when the age fits.
 *
 * `ownAge` / `ownDob` are the account holder's. When they're unknown, the
 * Child, Parent and Twin rules are skipped (the backend doesn't enforce them
 * either). A Twin is the account holder's own twin, so the DOBs must match.
 */
export function relationshipAgeError(
  relationship: string,
  age: number,
  ownAge?: number,
  dob?: string,
  ownDob?: string,
): string | null {
  if (age > MAX_MEMBER_AGE) return 'Enter a real date of birth';
  const own = ownAge != null && Number.isFinite(ownAge) ? ownAge : null;
  switch (relationship) {
    case 'Spouse':
      return age < ADULT_AGE ? `A spouse must be ${ADULT_AGE} or older` : null;
    case 'Guardian':
      return age < ADULT_AGE ? `A guardian must be ${ADULT_AGE} or older` : null;
    case 'Child':
      return own != null && age >= own ? 'Your child must be younger than you' : null;
    case 'Parent':
      return own != null && age - own < MIN_PARENT_GAP
        ? `A parent must be at least ${MIN_PARENT_GAP} years older than you`
        : null;
    case 'Twin': {
      const gap = dob && ownDob ? Math.abs(dayNumber(dob) - dayNumber(ownDob)) : NaN;
      if (Number.isFinite(gap)) return gap > MAX_TWIN_GAP_DAYS ? 'Your twin must have the same date of birth as you' : null;
      return own != null && age !== own ? 'Your twin must be the same age as you' : null;
    }
    default:
      return null;
  }
}
