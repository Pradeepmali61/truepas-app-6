/** Under-18s can only join as family members; adults can be members or hold their own account (see Terms). */
export const ADULT_AGE = 18;

export function ageFromDob(dob: string): number {
  // Backend accepts MM/DD/YYYY or YYYY-MM-DD — parse both.
  const mdy = dob.match(/^(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})$/);
  const iso = dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!mdy && !iso) return NaN;
  const [, a, b, c] = (mdy ?? iso)!;
  const [month, day, year] = mdy ? [a, b, c] : [b, c, a];
  const birth = new Date(Number(year), Number(month) - 1, Number(day));
  // Reject impossible calendar dates — Date() silently rolls over (e.g.
  // Feb 30 → Mar 2) and maps 2-digit years to the 1900s.
  if (
    birth.getFullYear() !== Number(year) ||
    birth.getMonth() !== Number(month) - 1 ||
    birth.getDate() !== Number(day)
  ) {
    return NaN;
  }
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
