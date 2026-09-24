import { OidcOAuthService } from '@ee/auth/oauth/util-services/oidc-auth.service';

function makeService() {
  const configService = { get: () => undefined };
  return new OidcOAuthService(configService as any, {} as any, {} as any, {} as any);
}

describe('OidcOAuthService.processGroups() — instance-level (multi-workspace) group sync', () => {
  it('should not apply an arbitrary workspace mapping to userDetail.groups when the shared instance provider serves multiple workspaces', () => {
    const service = makeService();
    const userDetail: any = {
      userinfoResponse: { groups: ['engineering'] },
    };
    const configs = {
      enableGroupSync: true,
      oidcGroupSyncs: [
        {
          organizationId: 'org-other',
          claimName: 'groups',
          enableGroupSync: true,
          groupMapping: { engineering: 'from-other-org' },
        },
        {
          organizationId: 'org-current',
          claimName: 'groups',
          enableGroupSync: true,
          groupMapping: { engineering: 'from-current-org' },
        },
      ],
    };

    const result = service.processGroups(userDetail, configs);

    expect(result.groups).toEqual([]);
    expect(result.instanceLevelGroupSyncs).toEqual(
      expect.arrayContaining([
        { organizationId: 'org-other', groups: ['from-other-org'] },
        { organizationId: 'org-current', groups: ['from-current-org'] },
      ])
    );
  });

  it('should still resolve groups directly for a single-provider (workspace) login', () => {
    const service = makeService();
    const userDetail: any = {
      userinfoResponse: { groups: ['engineering'] },
    };
    const configs = {
      enableGroupSync: undefined,
      oidcGroupSyncs: [
        {
          organizationId: 'org-current',
          claimName: 'groups',
          enableGroupSync: true,
          groupMapping: { engineering: 'workspace-group' },
        },
      ],
    };

    const result = service.processGroups(userDetail, configs);

    expect(result.groups).toEqual(['workspace-group']);
    expect(result.enableGroupSync).toBe(true);
  });
});
