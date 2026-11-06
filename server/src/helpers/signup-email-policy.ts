import { readFileSync } from 'fs';
import { promises as dns } from 'dns';
import * as path from 'path';
import { ForbiddenException, Logger } from '@nestjs/common';
import { getTooljetEdition } from '@helpers/utils.helper';
import { recordSignup, SignupMethod } from '@otel/signup-metrics';

// Checks run on self-serve signups before we send any email or create any user.
// Order: allow list -> block lists (with parent walk) -> cached MX lookup that fails open.
// Instance restricted domains are not repeated here: the password path already enforces them.

export type EmailVerdict =
  | { ok: true; mx: 'ok' | 'unknown' | 'skipped' }
  | { ok: false; reason: 'blocked_domain' | 'no_mx' };

// One message for every reason, so a script can't probe which check it tripped.
export const SIGNUP_EMAIL_BLOCKED_MESSAGE = 'Please sign up with a permanent work or personal email address.';

const MX_TIMEOUT_MS = 2000;
const MX_CACHE_TTL_MS = 60 * 60 * 1000;
const MX_CACHE_MAX = 10_000;
const NO_MX_CODES = new Set(['ENOTFOUND', 'ENODATA']);

const logger = new Logger('SignupEmailPolicy');

// ---- calculations ----

const domainSet = (csv: string | undefined): Set<string> =>
  new Set(
    (csv ?? '')
      .split(',')
      .map((d) => normalizeDomain(d))
      .filter(Boolean)
  );

const normalizeDomain = (domain: string): string => domain.trim().toLowerCase().replace(/\.$/, '');

export const emailDomain = (email: string): string => normalizeDomain(email.slice(email.lastIndexOf('@') + 1));

// a.b.mailinator.com -> [a.b.mailinator.com, b.mailinator.com, mailinator.com].
// Throwaway services hand out subdomains. Bare TLDs are never on a list, so we stop at two labels.
const selfAndParents = (domain: string): string[] => {
  const labels = domain.split('.');
  return labels.slice(0, Math.max(1, labels.length - 1)).map((_, i) => labels.slice(i).join('.'));
};

export const isBlockedDomain = (domain: string, blocked: Set<string>, allowed: Set<string>): boolean => {
  const names = selfAndParents(domain);
  if (names.some((name) => allowed.has(name))) return false;
  return names.some((name) => blocked.has(name));
};

const isOn = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined || value === '' ? fallback : value.toLowerCase() !== 'off' && value.toLowerCase() !== 'false';

// ---- actions ----

// Public-domain (CC0) list from github.com/disposable-email-domains. Refresh by replacing the file.
let disposableDomains: Set<string> | undefined;
const bundledDisposableDomains = (): Set<string> => {
  if (!disposableDomains) {
    try {
      const file = readFileSync(path.join(__dirname, '../assets/signup/disposable-email-domains.txt'), 'utf8');
      disposableDomains = new Set(file.split('\n').map(normalizeDomain).filter(Boolean));
    } catch (error) {
      // Fail open: a missing file must not stop real people signing up. The env list still applies.
      logger.error(`Disposable domain list not loaded: ${(error as Error).message}`);
      disposableDomains = new Set();
    }
  }
  return disposableDomains;
};

const mxCache = new Map<string, { hasMx: boolean | 'unknown'; expiresAt: number }>();
export const clearMxCache = (): void => mxCache.clear();

const lookupMx = async (domain: string): Promise<boolean | 'unknown'> => {
  const cached = mxCache.get(domain);
  if (cached && cached.expiresAt > Date.now()) return cached.hasMx;

  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(Object.assign(new Error('MX lookup timed out'), { code: 'ETIMEOUT' })),
      MX_TIMEOUT_MS
    );
  });

  let hasMx: boolean | 'unknown';
  try {
    const records = await Promise.race([dns.resolveMx(domain), timeout]);
    hasMx = records.length > 0;
  } catch (error) {
    hasMx = NO_MX_CODES.has((error as NodeJS.ErrnoException).code ?? '') ? false : 'unknown';
  } finally {
    clearTimeout(timer);
  }

  // Don't cache 'unknown': the next request should retry a resolver that was briefly down.
  if (hasMx !== 'unknown') {
    // ponytail: wipe-when-full, not LRU. 10k distinct domains per hour per pod is already an attack.
    if (mxCache.size >= MX_CACHE_MAX) mxCache.clear();
    mxCache.set(domain, { hasMx, expiresAt: Date.now() + MX_CACHE_TTL_MS });
  }
  return hasMx;
};

const block = (method: SignupMethod, domain: string, reason: 'blocked_domain' | 'no_mx'): EmailVerdict => {
  recordSignup(method, reason);
  // Domain only, never the full address.
  logger.log({ msg: 'signup.blocked', reason, method, domain });
  return { ok: false, reason };
};

export async function checkSignupEmail(email: string, method: SignupMethod): Promise<EmailVerdict> {
  if (!isOn(process.env.SIGNUP_EMAIL_POLICY, getTooljetEdition() === 'cloud')) return { ok: true, mx: 'skipped' };

  const domain = emailDomain(email);
  const allowed = domainSet(process.env.ALLOWED_SIGNUP_EMAIL_DOMAINS);
  const blocked =
    isBlockedDomain(domain, bundledDisposableDomains(), allowed) ||
    isBlockedDomain(domain, domainSet(process.env.BLOCKED_SIGNUP_EMAIL_DOMAINS), allowed);
  if (blocked) return block(method, domain, 'blocked_domain');

  if (!isOn(process.env.SIGNUP_MX_CHECK, true)) return { ok: true, mx: 'skipped' };

  const hasMx = await lookupMx(domain);
  if (hasMx === false) return block(method, domain, 'no_mx');
  if (hasMx === 'unknown') {
    recordSignup(method, 'mx_unknown');
    return { ok: true, mx: 'unknown' };
  }
  return { ok: true, mx: 'ok' };
}

export async function assertSignupEmailAllowed(email: string, method: SignupMethod): Promise<void> {
  const verdict = await checkSignupEmail(email, method);
  if (!verdict.ok) throw new ForbiddenException(SIGNUP_EMAIL_BLOCKED_MESSAGE);
}
