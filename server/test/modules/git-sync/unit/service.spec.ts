/** @group gitsync */
import { GitSyncService } from '@ee/git-sync/service';
import { LICENSE_FIELD } from '@modules/licensing/constants';

// Regression coverage: the phase-2 split dropped the LICENSE_FIELD.VALID check that main enforced
// alongside LICENSE_FIELD.WORKSPACE_ENV before letting a workspace toggle env-based git config on.
function makeService(licenseTerms: Record<string, boolean>) {
  const sourceControlProviderService = { getSourceControlService: jest.fn().mockResolvedValue({}) };
  const baseGitUtilService = {};
  const licenseTermsService = {
    getLicenseTerms: jest.fn().mockImplementation((field: string) => Promise.resolve(licenseTerms[field])),
  };
  const gitObjectCache = {};
  const remoteBranchCache = {};

  const service = new GitSyncService(
    sourceControlProviderService as any,
    baseGitUtilService as any,
    licenseTermsService as any,
    gitObjectCache as any,
    remoteBranchCache as any
  );
  return { service, sourceControlProviderService };
}

describe('GitSyncService.toggleEnvProviderConfig', () => {
  it('rejects when the license is invalid, even if WORKSPACE_ENV is granted', async () => {
    const { service, sourceControlProviderService } = makeService({
      [LICENSE_FIELD.WORKSPACE_ENV]: true,
      [LICENSE_FIELD.VALID]: false,
    });

    await expect(
      service.toggleEnvProviderConfig('user-1', 'org-1', { useEnvConfig: true, provider: 'github_https' } as any)
    ).rejects.toThrow('Valid license is required to use this feature.');
    expect(sourceControlProviderService.getSourceControlService).not.toHaveBeenCalled();
  });

  it('rejects when WORKSPACE_ENV is not entitled, even with a valid license', async () => {
    const { service, sourceControlProviderService } = makeService({
      [LICENSE_FIELD.WORKSPACE_ENV]: false,
      [LICENSE_FIELD.VALID]: true,
    });

    await expect(
      service.toggleEnvProviderConfig('user-1', 'org-1', { useEnvConfig: true, provider: 'github_https' } as any)
    ).rejects.toThrow('Environment variable mapping is not available in this plan.');
    expect(sourceControlProviderService.getSourceControlService).not.toHaveBeenCalled();
  });

  it('proceeds to the provider strategy when both license checks pass', async () => {
    const { service, sourceControlProviderService } = makeService({
      [LICENSE_FIELD.WORKSPACE_ENV]: true,
      [LICENSE_FIELD.VALID]: true,
    });
    (sourceControlProviderService.getSourceControlService as jest.Mock).mockResolvedValue({
      toggleEnvProviderConfig: jest.fn().mockResolvedValue(undefined),
    });

    await service.toggleEnvProviderConfig('user-1', 'org-1', { useEnvConfig: true, provider: 'github_https' } as any);

    expect(sourceControlProviderService.getSourceControlService).toHaveBeenCalledWith(null, 'github_https');
  });
});
