import { createHash, timingSafeEqual } from 'crypto';

/**
 * Compares a presented secret (token, password-like value) with the expected one in constant time.
 * `===` stops at the first differing character, so its timing can reveal how much of a guess was
 * right. Both values are hashed first, so the comparison is over equal-length digests and the
 * secret's length doesn't leak either. An unset expected secret never matches.
 */
export function secretsMatch(given: string | undefined | null, expected: string | undefined | null): boolean {
  if (typeof expected !== 'string' || expected.length === 0 || typeof given !== 'string') return false;
  const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();
  return timingSafeEqual(digest(given), digest(expected));
}
