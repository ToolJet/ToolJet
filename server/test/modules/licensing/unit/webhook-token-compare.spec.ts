import * as crypto from 'crypto';
import { EntityManager } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { secretsMatch } from '@helpers/secret-compare.helper';
import { WebhookGuard } from '@modules/licensing/guards/webhook.guard';
import { AppsRepository } from '@modules/apps/repository';
import { LicenseTermsService } from '@modules/licensing/interfaces/IService';

const WORKFLOW_TOKEN = 'wf-token-0123456789abcdef';
const EXTERNAL_TOKEN = 'ext-token-fedcba9876543210';

/**
 * @group workflows
 */
describe('Webhook token comparison', () => {
  describe('secretsMatch', () => {
    it('should match an identical secret', () => {
      expect(secretsMatch(WORKFLOW_TOKEN, WORKFLOW_TOKEN)).toBe(true);
    });

    it.each([
      ['a different secret of the same length', WORKFLOW_TOKEN.replace(/f$/, 'e')],
      ['a prefix of the secret', WORKFLOW_TOKEN.slice(0, 10)],
      ['a longer string starting with the secret', `${WORKFLOW_TOKEN}x`],
      ['an empty string', ''],
    ])('should not match %s', (_label, given) => {
      expect(secretsMatch(given, WORKFLOW_TOKEN)).toBe(false);
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['empty', ''],
    ])('should never match when the expected secret is %s', (_label, expected) => {
      expect(secretsMatch('', expected)).toBe(false);
      expect(secretsMatch('anything', expected)).toBe(false);
    });

    it('should compare in constant time over fixed-length digests', () => {
      const timingSafeEqual = jest.spyOn(crypto, 'timingSafeEqual');

      secretsMatch('short', WORKFLOW_TOKEN);

      expect(timingSafeEqual).toHaveBeenCalledWith(expect.any(Buffer), expect.any(Buffer));
      const [a, b] = timingSafeEqual.mock.calls[0] as [Buffer, Buffer];
      expect(a.length).toBe(32);
      expect(b.length).toBe(32);
      timingSafeEqual.mockRestore();
    });
  });

  describe('WebhookGuard | which bearer tokens authenticate', () => {
    const guard = (externalToken: string | undefined, externalApiEnabled = true) =>
      new WebhookGuard(
        {} as EntityManager,
        {} as AppsRepository,
        { getLicenseTermsInstance: jest.fn().mockResolvedValue(true) } as unknown as LicenseTermsService,
        {
          get: (key: string) =>
            ({
              ENABLE_EXTERNAL_API: externalApiEnabled ? 'true' : 'false',
              EXTERNAL_API_ACCESS_TOKEN: externalToken,
            })[key],
        } as unknown as ConfigService
      );

    const authenticates = (instance: WebhookGuard, header: string | undefined, workflowApiToken: string | null) =>
      (
        instance as unknown as { validateAuthentication(r: unknown, a: unknown): Promise<boolean> }
      ).validateAuthentication({ headers: { authorization: header } }, { workflowApiToken });

    it("should accept the workflow's own token", async () => {
      await expect(authenticates(guard(undefined), `Bearer ${WORKFLOW_TOKEN}`, WORKFLOW_TOKEN)).resolves.toBe(true);
    });

    it('should accept the external API token when the external API is enabled', async () => {
      await expect(authenticates(guard(EXTERNAL_TOKEN), `Bearer ${EXTERNAL_TOKEN}`, WORKFLOW_TOKEN)).resolves.toBe(
        true
      );
    });

    it.each([
      ['a wrong token', `Bearer ${WORKFLOW_TOKEN}x`, WORKFLOW_TOKEN],
      ['no header', undefined, WORKFLOW_TOKEN],
      ['another scheme', `Basic ${WORKFLOW_TOKEN}`, WORKFLOW_TOKEN],
      ['a workflow with no token, given any token', 'Bearer x', null],
    ])('should refuse %s', async (_label, header, workflowApiToken) => {
      await expect(authenticates(guard(undefined), header, workflowApiToken)).resolves.toBe(false);
    });

    it('should refuse the external API token when the external API is disabled', async () => {
      await expect(
        authenticates(guard(EXTERNAL_TOKEN, false), `Bearer ${EXTERNAL_TOKEN}`, WORKFLOW_TOKEN)
      ).resolves.toBe(false);
    });

    it('should compare both tokens in constant time', async () => {
      const timingSafeEqual = jest.spyOn(crypto, 'timingSafeEqual');

      await authenticates(guard(EXTERNAL_TOKEN), 'Bearer nope', WORKFLOW_TOKEN);

      expect(timingSafeEqual).toHaveBeenCalledTimes(2);
      timingSafeEqual.mockRestore();
    });
  });
});
