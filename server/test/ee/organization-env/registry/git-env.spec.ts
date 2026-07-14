jest.mock('@modules/organizations/repository', () => ({
  OrganizationRepository: jest.fn(),
}));

import { GitSyncEnvUtilService } from '@ee/organization-env/services/gitsync.util.service';
import { GIT_ENV_KEYS } from '@modules/organization-env/constants';
import { GITConnectionType } from 'src/entities/organization_git_sync.entity';

const ORG_ID = '11111111-1111-1111-1111-111111111111';

function makeOrgEnvService(overrides: Partial<Record<string, jest.Mock>> = {}) {
  return {
    getResolvedOrganizationIds: jest.fn().mockReturnValue([]),
    has: jest.fn().mockReturnValue(false),
    hasAll: jest.fn().mockReturnValue(false),
    get: jest.fn().mockResolvedValue(undefined),
    ensureResolved: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function makeService(orgEnvService: ReturnType<typeof makeOrgEnvService>) {
  const orgGitSyncRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOrgGitByOrganizationId: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockReturnValue({}),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const logger = {
    log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
  };
  const licenseTerms = {
    getLicenseTerms: jest.fn().mockResolvedValue(true),
  };
  return new GitSyncEnvUtilService(
    orgEnvService as any,
    orgGitSyncRepo as any,
    logger as any,
    licenseTerms as any,
  );
}

function makeServiceWithMocks(
  orgEnvService: ReturnType<typeof makeOrgEnvService>,
  licenseResult = true,
) {
  const orgGitSyncRepo = {
    find: jest.fn().mockResolvedValue([]),
    findOrgGitByOrganizationId: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(undefined),
    create: jest.fn().mockReturnValue({}),
    save: jest.fn().mockResolvedValue(undefined),
  };
  const logger = {
    log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(),
  };
  const licenseTerms = {
    getLicenseTerms: jest.fn().mockResolvedValue(licenseResult),
  };
  const service = new GitSyncEnvUtilService(
    orgEnvService as any,
    orgGitSyncRepo as any,
    logger as any,
    licenseTerms as any,
  );
  return { service, orgGitSyncRepo, licenseTerms };
}

describe('GitSyncEnvUtilService', () => {
  describe('initialize() — proactive provider state from env store', () => {
    it('sets HTTPS provider isEnabled=true when at least one HTTPS key is mapped', async () => {
      const orgEnvService = makeOrgEnvService({
        getResolvedOrganizationIds: jest.fn().mockReturnValue([ORG_ID]),
        has: jest.fn().mockImplementation((_id: string, key: string) =>
          key === GIT_ENV_KEYS.HTTPS.URL,
        ),
      });
      const service = makeService(orgEnvService);

      await service.initialize();

      expect(service.getProviderState(ORG_ID, GITConnectionType.GITHUB_HTTPS)).toEqual({
        isEnabled: true,
        isFinalized: false,
      });
    });


    it('sets GitLab provider isEnabled=true when GitLab key is mapped', async () => {
      const orgEnvService = makeOrgEnvService({
        getResolvedOrganizationIds: jest.fn().mockReturnValue([ORG_ID]),
        has: jest.fn().mockImplementation((_id: string, key: string) =>
          key === GIT_ENV_KEYS.GITLAB.URL,
        ),
      });
      const service = makeService(orgEnvService);

      await service.initialize();

      expect(service.getProviderState(ORG_ID, GITConnectionType.GITLAB)).toEqual({
        isEnabled: true,
        isFinalized: false,
      });
    });

    it('leaves provider disabled when no keys are mapped for that provider', async () => {
      const orgEnvService = makeOrgEnvService({
        getResolvedOrganizationIds: jest.fn().mockReturnValue([ORG_ID]),
        has: jest.fn().mockReturnValue(false),
      });
      const service = makeService(orgEnvService);

      await service.initialize();

      expect(service.getProviderState(ORG_ID, GITConnectionType.GITHUB_HTTPS)).toEqual({
        isEnabled: false,
        isFinalized: false,
      });
    });

    it('does not call has() when no resolved orgs exist', async () => {
      const orgEnvService = makeOrgEnvService({
        getResolvedOrganizationIds: jest.fn().mockReturnValue([]),
        has: jest.fn().mockReturnValue(true),
      });
      const service = makeService(orgEnvService);

      await service.initialize();

      expect(orgEnvService.has).not.toHaveBeenCalled();
    });

    it('sets provider isEnabled=false when license is not valid', async () => {
      const orgEnvService = makeOrgEnvService({
        getResolvedOrganizationIds: jest.fn().mockReturnValue([ORG_ID]),
        has: jest.fn().mockImplementation((_id: string, key: string) =>
          key === GIT_ENV_KEYS.HTTPS.URL,
        ),
      });
      const { service } = makeServiceWithMocks(orgEnvService, false);

      await service.initialize();

      expect(service.getProviderState(ORG_ID, GITConnectionType.GITHUB_HTTPS)).toEqual({
        isEnabled: false,
        isFinalized: false,
      });
    });

    it('does not call hydrateUseEnvConfig when license is not valid', async () => {
      const orgEnvService = makeOrgEnvService({
        getResolvedOrganizationIds: jest.fn().mockReturnValue([ORG_ID]),
        has: jest.fn().mockImplementation((_id: string, key: string) =>
          key === GIT_ENV_KEYS.HTTPS.URL,
        ),
      });
      const { service, orgGitSyncRepo } = makeServiceWithMocks(orgEnvService, false);

      await service.initialize();

      // hydrateUseEnvConfig calls save (create path) or update — neither should be called
      expect(orgGitSyncRepo.save).not.toHaveBeenCalled();
      expect(orgGitSyncRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('ensureResolved() — license-aware state + dedup', () => {
    it('sets provider isEnabled=false when license is not valid', async () => {
      const orgEnvService = makeOrgEnvService({
        has: jest.fn().mockImplementation((_id: string, key: string) =>
          key === GIT_ENV_KEYS.HTTPS.URL,
        ),
      });
      const { service } = makeServiceWithMocks(orgEnvService, false);

      await service.ensureResolved(ORG_ID);

      expect(service.getProviderState(ORG_ID, GITConnectionType.GITHUB_HTTPS)).toEqual({
        isEnabled: false,
        isFinalized: false,
      });
    });

    it('does not call hydrateUseEnvConfig when license is not valid', async () => {
      const orgEnvService = makeOrgEnvService({
        has: jest.fn().mockImplementation((_id: string, key: string) =>
          key === GIT_ENV_KEYS.HTTPS.URL,
        ),
      });
      const { service, orgGitSyncRepo } = makeServiceWithMocks(orgEnvService, false);

      await service.ensureResolved(ORG_ID);

      expect(orgGitSyncRepo.save).not.toHaveBeenCalled();
      expect(orgGitSyncRepo.update).not.toHaveBeenCalled();
    });

    it('runs license check only once across multiple ensureResolved calls (dedup)', async () => {
      const orgEnvService = makeOrgEnvService({
        has: jest.fn().mockImplementation((_id: string, key: string) =>
          key === GIT_ENV_KEYS.HTTPS.URL,
        ),
      });
      const { service, licenseTerms } = makeServiceWithMocks(orgEnvService, false);

      await service.ensureResolved(ORG_ID);
      await service.ensureResolved(ORG_ID);

      // getLicenseTerms called twice per check (WORKSPACE_ENV + VALID), but only on first call
      expect(licenseTerms.getLicenseTerms).toHaveBeenCalledTimes(2);
    });
  });
});
