import { ADULT_AGE } from '@/utils/age';

/** Oldest age the Add member form accepts for anyone. */
export const MAX_MEMBER_AGE = 120;
/** A parent must be at least this many years older than the account holder. */
const MIN_PARENT_GAP = 12;

/**
 * Age check for a new family member, by relationship. Returns the message to
 * show under the date of birth, or null when the age fits.
 *
 * `ownAge` is the account holder's age. When it's unknown, the Child and
 * Parent rules are skipped (the backend doesn't enforce them either).
 */
export function relationshipAgeError(relationship: string, age: number, ownAge?: number): string | null {
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
    default:
      return null;
  }
}
