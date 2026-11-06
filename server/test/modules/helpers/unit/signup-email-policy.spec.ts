/** @group platform */
import { promises as dns } from 'dns';
import { ForbiddenException } from '@nestjs/common';
import {
  assertSignupEmailAllowed,
  checkSignupEmail,
  clearMxCache,
  isBlockedDomain,
  SIGNUP_EMAIL_BLOCKED_MESSAGE,
} from '@helpers/signup-email-policy';

const dnsError = (code: string) => Object.assign(new Error(code), { code });

describe('signup email policy', () => {
  const env = { ...process.env };
  let resolveMx: jest.SpyInstance;

  beforeEach(() => {
    process.env.SIGNUP_EMAIL_POLICY = 'on';
    delete process.env.BLOCKED_SIGNUP_EMAIL_DOMAINS;
    delete process.env.ALLOWED_SIGNUP_EMAIL_DOMAINS;
    delete process.env.SIGNUP_MX_CHECK;
    clearMxCache();
    resolveMx = jest.spyOn(dns, 'resolveMx').mockResolvedValue([{ exchange: 'mx.example.com', priority: 10 }]);
  });

  afterEach(() => {
    process.env = { ...env };
    jest.restoreAllMocks();
  });

  describe('isBlockedDomain | which domains are blocked', () => {
    const blocked = new Set(['mailinator.com']);

    it('should block a listed domain and any subdomain of it', () => {
      expect([
        isBlockedDomain('mailinator.com', blocked, new Set()),
        isBlockedDomain('a.b.mailinator.com', blocked, new Set()),
        isBlockedDomain('notmailinator.com', blocked, new Set()),
      ]).toEqual([true, true, false]);
    });

    it('should let the allow list win over the block list', () => {
      expect(isBlockedDomain('a.mailinator.com', blocked, new Set(['mailinator.com']))).toBe(false);
    });
  });

  describe('checkSignupEmail | the verdict', () => {
    it('should block a domain on the bundled disposable list', async () => {
      expect(await checkSignupEmail('bot@mailinator.com', 'password')).toEqual({ ok: false, reason: 'blocked_domain' });
      expect(resolveMx).not.toHaveBeenCalled();
    });

    it('should block a domain from BLOCKED_SIGNUP_EMAIL_DOMAINS, case and trailing dot ignored', async () => {
      process.env.BLOCKED_SIGNUP_EMAIL_DOMAINS = 'fresh-throwaway.io, other.io';
      expect(await checkSignupEmail('Bot@Sub.Fresh-Throwaway.IO.', 'ai_otp')).toEqual({
        ok: false,
        reason: 'blocked_domain',
      });
    });

    it('should allow a listed domain that is in ALLOWED_SIGNUP_EMAIL_DOMAINS', async () => {
      process.env.ALLOWED_SIGNUP_EMAIL_DOMAINS = 'mailinator.com';
      expect(await checkSignupEmail('dev@mailinator.com', 'password')).toEqual({ ok: true, mx: 'ok' });
    });

    it('should block a domain with no MX records', async () => {
      resolveMx.mockRejectedValue(dnsError('ENOTFOUND'));
      expect(await checkSignupEmail('a@no-mail-here.example', 'password')).toEqual({ ok: false, reason: 'no_mx' });
    });

    it('should block a domain whose MX list is empty', async () => {
      resolveMx.mockResolvedValue([]);
      expect(await checkSignupEmail('a@empty-mx.example', 'password')).toEqual({ ok: false, reason: 'no_mx' });
    });

    it('should allow (fail open) when DNS errors or times out', async () => {
      resolveMx.mockRejectedValue(dnsError('ETIMEOUT'));
      expect(await checkSignupEmail('a@flaky-dns.example', 'password')).toEqual({ ok: true, mx: 'unknown' });
    });

    it('should cache MX results so a popular domain costs one lookup', async () => {
      await checkSignupEmail('a@gmail.com', 'password');
      await checkSignupEmail('b@gmail.com', 'password');
      expect(resolveMx).toHaveBeenCalledTimes(1);
    });

    it('should skip only the MX step when SIGNUP_MX_CHECK=off', async () => {
      process.env.SIGNUP_MX_CHECK = 'off';
      expect([
        await checkSignupEmail('a@anything.example', 'password'),
        await checkSignupEmail('a@mailinator.com', 'password'),
      ]).toEqual([
        { ok: true, mx: 'skipped' },
        { ok: false, reason: 'blocked_domain' },
      ]);
      expect(resolveMx).not.toHaveBeenCalled();
    });

    it('should skip every check when SIGNUP_EMAIL_POLICY=off', async () => {
      process.env.SIGNUP_EMAIL_POLICY = 'off';
      expect(await checkSignupEmail('bot@mailinator.com', 'password')).toEqual({ ok: true, mx: 'skipped' });
      expect(resolveMx).not.toHaveBeenCalled();
    });

    it('should default to off outside Cloud', async () => {
      delete process.env.SIGNUP_EMAIL_POLICY;
      process.env.TOOLJET_EDITION = 'ee';
      expect(await checkSignupEmail('bot@mailinator.com', 'password')).toEqual({ ok: true, mx: 'skipped' });
    });

    it('should default to on for Cloud', async () => {
      delete process.env.SIGNUP_EMAIL_POLICY;
      process.env.TOOLJET_EDITION = 'cloud';
      expect(await checkSignupEmail('bot@mailinator.com', 'password')).toEqual({ ok: false, reason: 'blocked_domain' });
    });
  });

  describe('assertSignupEmailAllowed | what callers see', () => {
    it('should throw the same 403 message for every block reason', async () => {
      resolveMx.mockRejectedValue(dnsError('ENODATA'));
      const errors = await Promise.all(
        ['bot@mailinator.com', 'a@no-mail-here.example'].map((email) =>
          assertSignupEmailAllowed(email, 'password').catch((e) => e)
        )
      );
      for (const error of errors) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe(SIGNUP_EMAIL_BLOCKED_MESSAGE);
      }
    });

    it('should resolve for an allowed email', async () => {
      await expect(assertSignupEmailAllowed('person@gmail.com', 'password')).resolves.toBeUndefined();
    });
  });
});
