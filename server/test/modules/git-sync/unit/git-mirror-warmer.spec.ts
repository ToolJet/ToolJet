/** @group platform */
import { GitMirrorWarmerService } from '@ee/git-sync/git-mirror-warmer.service';

const fakeManager = { findOne: jest.fn() };
jest.mock('@helpers/database.helper', () => ({
  getConnectionInstance: () => ({ manager: fakeManager }),
}));

const ORG = 'org-1';
const URL = 'https://github.com/acme/repo.git';

function build() {
  const publisher = { publish: jest.fn().mockResolvedValue(1), disconnect: jest.fn() };
  const redisService = {
    createPublisher: jest.fn(() => publisher),
    createSubscriber: jest.fn(),
  };
  const orgGitRepo = { findOrgGitByOrganizationId: jest.fn() };
  const httpsUtil = {
    resolveHttpsConfigs: jest.fn(),
    getAuthenticatedOctokitForInstallation: jest.fn(),
  };
  const cache = { isEnabled: jest.fn(() => true), warmMirror: jest.fn().mockResolvedValue(undefined) };
  const service = new GitMirrorWarmerService(
    redisService as never,
    orgGitRepo as never,
    httpsUtil as never,
    cache as never
  );
  return { service, publisher, redisService, orgGitRepo, httpsUtil, cache };
}

describe('GitMirrorWarmerService', () => {
  afterEach(() => {
    delete process.env.DISABLE_GIT_CACHE_WARM_ON_CONNECT;
    jest.clearAllMocks();
  });

  it('should broadcast a credential-less warm message with only the org id', async () => {
    const { service, publisher } = build();
    await service.broadcastWarm(ORG);
    expect(publisher.publish).toHaveBeenCalledWith('tj:git-cache:warm', JSON.stringify({ organizationId: ORG }));
  });

  it('should skip the broadcast when DISABLE_GIT_CACHE_WARM_ON_CONNECT=true', async () => {
    process.env.DISABLE_GIT_CACHE_WARM_ON_CONNECT = 'true';
    const { service, publisher } = build();
    await service.broadcastWarm(ORG);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('should skip the broadcast when the object cache is disabled', async () => {
    const { service, publisher, cache } = build();
    cache.isEnabled.mockReturnValue(false);
    await service.broadcastWarm(ORG);
    expect(publisher.publish).not.toHaveBeenCalled();
  });

  it('should resolve creds locally and warm the mirror on message', async () => {
    const { service, orgGitRepo, httpsUtil, cache } = build();
    orgGitRepo.findOrgGitByOrganizationId.mockResolvedValue({ id: 'g1' });
    httpsUtil.resolveHttpsConfigs.mockResolvedValue({ httpsUrl: URL });
    httpsUtil.getAuthenticatedOctokitForInstallation.mockResolvedValue({ installationToken: 'tok' });
    fakeManager.findOne.mockResolvedValue({ name: 'master' });

    await service.handleMessage(JSON.stringify({ organizationId: ORG }));

    expect(cache.warmMirror).toHaveBeenCalledWith(ORG, URL, 'tok', 'master');
  });

  it('should ignore malformed messages', async () => {
    const { service, cache, orgGitRepo } = build();
    await service.handleMessage('not-json');
    await service.handleMessage(JSON.stringify({ nope: true }));
    expect(orgGitRepo.findOrgGitByOrganizationId).not.toHaveBeenCalled();
    expect(cache.warmMirror).not.toHaveBeenCalled();
  });

  it('should skip warm when org has no git config, no https config, or no default branch', async () => {
    const { service, orgGitRepo, httpsUtil, cache } = build();
    orgGitRepo.findOrgGitByOrganizationId.mockResolvedValueOnce(null);
    await service.handleMessage(JSON.stringify({ organizationId: ORG }));
    expect(cache.warmMirror).not.toHaveBeenCalled();

    orgGitRepo.findOrgGitByOrganizationId.mockResolvedValueOnce({ id: 'g1' });
    httpsUtil.resolveHttpsConfigs.mockResolvedValueOnce(null);
    await service.handleMessage(JSON.stringify({ organizationId: ORG }));
    expect(cache.warmMirror).not.toHaveBeenCalled();

    orgGitRepo.findOrgGitByOrganizationId.mockResolvedValueOnce({ id: 'g1' });
    httpsUtil.resolveHttpsConfigs.mockResolvedValue({ httpsUrl: URL });
    httpsUtil.getAuthenticatedOctokitForInstallation.mockResolvedValue({ installationToken: 'tok' });
    fakeManager.findOne.mockResolvedValue(null);
    await service.handleMessage(JSON.stringify({ organizationId: ORG }));
    expect(cache.warmMirror).not.toHaveBeenCalled();
  });

  it('should swallow resolver failures — warm is best-effort', async () => {
    const { service, orgGitRepo } = build();
    orgGitRepo.findOrgGitByOrganizationId.mockRejectedValue(new Error('db down'));
    await expect(service.handleMessage(JSON.stringify({ organizationId: ORG }))).resolves.toBeUndefined();
  });
});
