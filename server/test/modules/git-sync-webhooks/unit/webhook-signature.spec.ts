/** @group gitsync */
import * as crypto from 'crypto';
import { WebhookSignatureService } from '@ee/git-sync-webhooks/services/webhook-signature.service';

const githubSig = (secret: string, body: string) =>
  'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

describe('WebhookSignatureService', () => {
  const makeService = (oldSecret: string | null = null) => {
    const get = jest.fn().mockResolvedValue(oldSecret);
    const redisService = { getClient: () => ({ get }) } as any;
    return { service: new WebhookSignatureService(redisService), get };
  };

  it('rejects when the secret or the received signature is missing', async () => {
    const { service } = makeService();
    await expect(service.verifySignature('github', '', 'body', 'sig', 'org')).resolves.toBe(false);
    await expect(service.verifySignature('github', 'secret', 'body', '', 'org')).resolves.toBe(false);
  });

  describe('github', () => {
    const secret = 'shhh';
    const body = '{"ref":"refs/heads/main"}';

    it('accepts a valid HMAC-SHA256 signature', async () => {
      const { service } = makeService();
      await expect(service.verifySignature('github', secret, body, githubSig(secret, body), 'org')).resolves.toBe(true);
    });
    it('rejects a signature computed with the wrong secret', async () => {
      const { service } = makeService();
      await expect(service.verifySignature('github', secret, body, githubSig('wrong', body), 'org')).resolves.toBe(
        false
      );
    });
    it('rejects a length-mismatched signature without throwing', async () => {
      const { service } = makeService();
      await expect(service.verifySignature('github', secret, body, 'sha256=short', 'org')).resolves.toBe(false);
    });
    it('accepts via the OLD secret during the rotation grace period', async () => {
      const oldSecret = 'previous';
      const { service, get } = makeService(oldSecret);
      // current secret is different → first verify fails → falls back to redis old secret
      await expect(service.verifySignature('github', secret, body, githubSig(oldSecret, body), 'org-7')).resolves.toBe(
        true
      );
      expect(get).toHaveBeenCalledWith('gitsync:old_secret:org-7');
    });
    it('rejects when neither current nor old secret matches', async () => {
      const { service } = makeService('another-old');
      await expect(service.verifySignature('github', secret, body, githubSig('nope', body), 'org')).resolves.toBe(
        false
      );
    });
  });

  describe('gitlab', () => {
    it('accepts a matching X-Gitlab-Token', async () => {
      const { service } = makeService();
      await expect(service.verifySignature('gitlab', 'glpat-tok', 'body', 'glpat-tok', 'org')).resolves.toBe(true);
    });
    it('rejects a non-matching token', async () => {
      const { service } = makeService();
      await expect(service.verifySignature('gitlab', 'glpat-tok', 'body', 'glpat-different', 'org')).resolves.toBe(
        false
      );
    });
    it('rejects a length-mismatched token without throwing', async () => {
      const { service } = makeService();
      await expect(service.verifySignature('gitlab', 'glpat-tok', 'body', 'x', 'org')).resolves.toBe(false);
    });
  });

  // Bitbucket uses the same HMAC-SHA256 `sha256=<hex>` scheme as GitHub (sent as X-Hub-Signature).
  describe('bitbucket', () => {
    const secret = 'bb-secret';
    const body = '{"push":{"changes":[]}}';

    it('accepts a valid HMAC-SHA256 signature', async () => {
      const { service } = makeService();
      await expect(service.verifySignature('bitbucket', secret, body, githubSig(secret, body), 'org')).resolves.toBe(
        true
      );
    });
    it('rejects a signature computed with the wrong secret', async () => {
      const { service } = makeService();
      await expect(service.verifySignature('bitbucket', secret, body, githubSig('wrong', body), 'org')).resolves.toBe(
        false
      );
    });
    it('rejects a signature over a tampered body', async () => {
      const { service } = makeService();
      await expect(
        service.verifySignature('bitbucket', secret, body, githubSig(secret, body + ' '), 'org')
      ).resolves.toBe(false);
    });
    it('does not accept a GitLab-style plain token as the signature', async () => {
      const { service } = makeService();
      await expect(service.verifySignature('bitbucket', secret, body, secret, 'org')).resolves.toBe(false);
    });
    it('accepts via the OLD secret during the rotation grace period', async () => {
      const oldSecret = 'bb-previous';
      const { service, get } = makeService(oldSecret);
      await expect(
        service.verifySignature('bitbucket', secret, body, githubSig(oldSecret, body), 'org-9')
      ).resolves.toBe(true);
      expect(get).toHaveBeenCalledWith('gitsync:old_secret:org-9');
    });
  });
});
