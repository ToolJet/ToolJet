jest.mock('@modules/organizations/repository', () => ({
  OrganizationRepository: jest.fn(),
}));

import { OrganizationEnvRegistryService } from '@ee/organization-env/service';

describe('OrganizationEnvRegistryService', () => {
  let service: OrganizationEnvRegistryService;

  beforeEach(() => {
    service = new OrganizationEnvRegistryService(
      { encryptColumnValue: jest.fn(), decryptColumnValue: jest.fn() } as any,
      { findOne: jest.fn() } as any
      // { log: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() } as any,
    );
  });

  describe('getResolvedOrganizationIds()', () => {
    it('returns empty array when no orgs are resolved', () => {
      expect(service.getResolvedOrganizationIds()).toEqual([]);
    });

    it('returns all UUIDs that have been added to resolvedIds', () => {
      const orgId = '11111111-1111-1111-1111-111111111111';
      (service as any).resolvedIds.add(orgId);

      const result = service.getResolvedOrganizationIds();
      expect(result).toContain(orgId);
      expect(result).toHaveLength(1);
    });

    it('returns all resolved UUIDs when multiple orgs are present', () => {
      const orgId1 = '11111111-1111-1111-1111-111111111111';
      const orgId2 = '22222222-2222-2222-2222-222222222222';
      (service as any).resolvedIds.add(orgId1);
      (service as any).resolvedIds.add(orgId2);

      const result = service.getResolvedOrganizationIds();
      expect(result).toContain(orgId1);
      expect(result).toContain(orgId2);
      expect(result).toHaveLength(2);
    });
  });
});
