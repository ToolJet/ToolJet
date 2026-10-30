import { OidcOAuthService, shouldRequestGroupsScope } from '@ee/auth/oauth/util-services/oidc-auth.service';

function makeService(env: Record<string, string> = {}) {
  const configService = { get: (key: string) => env[key] };
  return new OidcOAuthService(configService as any, {} as any, {} as any, {} as any);
}

describe('OidcOAuthService.processGroups() — nested claims and delimiter', () => {
  const workspaceConfig = (claimName: string, groupMapping: Record<string, string>, delimiter?: string) => ({
    enableGroupSync: undefined,
    oidcGroupSyncs: [{ organizationId: 'org-current', claimName, delimiter, enableGroupSync: true, groupMapping }],
  });
  const mapping = { Sales: 'sales', Billing: 'billing' };

  it('reads a nested string claim via dot path (Salesforce shape)', () => {
    const userDetail: any = { userinfoResponse: { custom_attributes: { groups: 'Sales Billing' } } };

    const result = makeService().processGroups(userDetail, workspaceConfig('custom_attributes.groups', mapping, ' '));

    expect(result.groups).toEqual(['sales', 'billing']);
  });

  it('reads a nested array from the id token via dot path', () => {
    const userDetail: any = {
      userinfoResponse: { id_token_decrypted: { custom_attributes: { groups: ['Sales'] } } },
    };

    const result = makeService().processGroups(userDetail, workspaceConfig('custom_attributes.groups', mapping));

    expect(result.groups).toEqual(['sales']);
  });

  it('exact dotted key wins over path walking', () => {
    const userDetail: any = {
      userinfoResponse: {
        'https://example.com/groups': ['Sales'],
        'https://example': { 'com/groups': ['Billing'] },
      },
    };

    const result = makeService().processGroups(userDetail, workspaceConfig('https://example.com/groups', mapping));

    expect(result.groups).toEqual(['sales']);
  });

  it('broken path returns no groups without throwing', () => {
    const userDetail: any = { userinfoResponse: { custom_attributes: 'not-an-object' } };

    const result = makeService().processGroups(userDetail, workspaceConfig('custom_attributes.groups.deep', mapping));

    expect(result.groups).toEqual([]);
  });

  it.each([
    [' ', 'Sales  Billing'],
    [';', 'Sales;Billing'],
    [',', 'Sales, Billing'],
    ['|', 'Sales|Billing'],
    ['space', 'Sales Billing'],
  ])('splits a string claim on delimiter %j', (delimiter, value) => {
    const userDetail: any = { userinfoResponse: { groups: value } };

    const result = makeService().processGroups(userDetail, workspaceConfig('groups', mapping, delimiter));

    expect(result.groups).toEqual(['sales', 'billing']);
  });

  it('keeps spaces inside names when the delimiter is a comma', () => {
    const userDetail: any = { userinfoResponse: { groups: 'Sales Team,Billing' } };

    const result = makeService().processGroups(
      userDetail,
      workspaceConfig('groups', { 'Sales Team': 'sales', Billing: 'billing' }, ',')
    );

    expect(result.groups).toEqual(['sales', 'billing']);
  });

  it('ignores a string claim when no delimiter is set', () => {
    const userDetail: any = { userinfoResponse: { groups: 'Sales Billing' } };

    const result = makeService().processGroups(userDetail, workspaceConfig('groups', mapping));

    expect(result.groups).toEqual([]);
  });

  it('ignores an array claim when a delimiter is set', () => {
    const userDetail: any = { userinfoResponse: { groups: ['Sales'] } };

    const result = makeService().processGroups(userDetail, workspaceConfig('groups', mapping, ','));

    expect(result.groups).toEqual([]);
  });

  it('falls through to the next token when the string parses to nothing', () => {
    const userDetail: any = {
      userinfoResponse: { groups: ';', id_token_decrypted: { groups: 'Sales' } },
    };

    const result = makeService().processGroups(userDetail, workspaceConfig('groups', mapping, ';'));

    expect(result.groups).toEqual(['sales']);
  });

  it('legacy OIDC_GROUPS_DELIMITER=space wins over the configured delimiter', () => {
    const userDetail: any = { userinfoResponse: { groups: 'Sales Billing' } };

    const result = makeService({ OIDC_GROUPS_DELIMITER: 'space' }).processGroups(
      userDetail,
      workspaceConfig('groups', mapping, ';')
    );

    expect(result.groups).toEqual(['sales', 'billing']);
  });

  it('applies each workspace delimiter on the shared instance provider', () => {
    const userDetail: any = { userinfoResponse: { groups: 'Sales;Billing' } };
    const configs = {
      enableGroupSync: true,
      oidcGroupSyncs: [
        { organizationId: 'org-a', claimName: 'groups', delimiter: ';', enableGroupSync: true, groupMapping: mapping },
        { organizationId: 'org-b', claimName: 'groups', delimiter: ',', enableGroupSync: true, groupMapping: mapping },
      ],
    };

    const result = makeService().processGroups(userDetail, configs);

    expect(result.instanceLevelGroupSyncs).toEqual([{ organizationId: 'org-a', groups: ['sales', 'billing'] }]);
  });
});

describe('shouldRequestGroupsScope()', () => {
  const base = { enableGroupSync: true, customScopes: [], isAzureIdP: false };

  it('skips groups when the IdP advertises scopes without groups (Salesforce)', () => {
    expect(shouldRequestGroupsScope({ ...base, scopesSupported: ['openid', 'email', 'profile'] })).toBe(false);
  });

  it('requests groups when the IdP advertises it', () => {
    expect(shouldRequestGroupsScope({ ...base, scopesSupported: ['openid', 'groups'] })).toBe(true);
  });

  it('requests groups when the IdP publishes no scope list', () => {
    expect(shouldRequestGroupsScope({ ...base, scopesSupported: undefined })).toBe(true);
  });

  it('never requests groups when custom scopes are set', () => {
    expect(shouldRequestGroupsScope({ ...base, customScopes: ['openid'], scopesSupported: ['groups'] })).toBe(false);
  });
});
