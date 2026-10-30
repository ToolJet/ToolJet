import { INestApplication } from '@nestjs/common';
import { initTestApp, closeTestApp, createUser, createGroupPermission, getEntityRepository } from 'test-helper';
import { createUserGroupPermissions } from '../../../helpers/seed';
import { LoginConfigsUtilService } from '@ee/login-configs/util.service';
import { OauthService } from '@ee/auth/oauth/service';
import { SSOConfigs, SSOType, ConfigScope } from 'src/entities/sso_config.entity';
import { SsoConfigOidcGroupSync } from 'src/entities/sso_config_oidc_group_sync.entity';
import { GroupUsers } from 'src/entities/group_users.entity';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';
import { GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';
import { MockOidcIdp, startMockOidcIdp } from '../../../helpers/mock-oidc-idp';

const SSO_EMAIL = 'sso-user@example.com';
const mapping = { sales: 'sales', custom_group: 'custom_group' };

/** @group platform */
describe('OIDC login with group sync (mock IdP)', () => {
  let app: INestApplication;
  let idp: MockOidcIdp;
  let organization: Organization;
  let ssoUser: User & { organizationId: string };
  let configId: string;
  let syncId: string;

  const fakeResponse = () => ({ cookie: jest.fn(), clearCookie: jest.fn(), setHeader: jest.fn() }) as any;

  const configureSync = (sync: Partial<SsoConfigOidcGroupSync>) =>
    getEntityRepository(SsoConfigOidcGroupSync).update(syncId, { groupMapping: mapping, ...sync });

  const login = (claims: Record<string, unknown>) => {
    idp.setClaims({ sub: 'sso-sub', email: SSO_EMAIL, ...claims });
    return app
      .get(OauthService)
      .signIn(fakeResponse(), { token: 'code', organizationId: organization.id } as any, configId, null, undefined, {});
  };

  const customGroupsOf = async (email: string) => {
    const user = await getEntityRepository(User).findOneByOrFail({ email });
    const memberships = await getEntityRepository(GroupUsers).find({
      where: { userId: user.id },
      relations: ['group'],
    });
    return memberships
      .filter(
        ({ group }) => group.type === GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP && group.organizationId === organization.id
      )
      .map(({ group }) => group.name)
      .sort();
  };

  beforeAll(async () => {
    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));
    idp = await startMockOidcIdp();

    ({ organization } = await createUser(app, { email: 'idp-admin@example.com', organizationName: 'OIDC Flow Org' }));
    await createGroupPermission(app, { organization, name: 'sales' } as any);
    await createGroupPermission(app, { organization, name: 'custom_group' } as any);

    const configs = {
      name: 'mock',
      clientId: idp.clientId,
      clientSecret: 'mock-secret',
      wellKnownUrl: idp.wellKnownUrl,
      grantType: 'authorization_code',
      customScopes: '',
    };
    await app.get(LoginConfigsUtilService).encryptSecret(configs);
    const ssoConfig = await getEntityRepository(SSOConfigs).save({
      organizationId: organization.id,
      sso: SSOType.OPENID,
      enabled: true,
      configScope: ConfigScope.ORGANIZATION,
      configs,
    } as any);
    configId = ssoConfig.id;
    const sync = await getEntityRepository(SsoConfigOidcGroupSync).save({
      ssoConfigId: configId,
      organizationId: null,
      claimName: 'groups',
      groupMapping: mapping,
      enableGroupSync: true,
    } as any);
    syncId = sync.id;
  }, 90_000);

  afterAll(async () => {
    await idp.close();
    await closeTestApp(app);
  });

  beforeEach(async () => {
    delete process.env.OIDC_GROUPS_DELIMITER;
    idp.setScopesSupported(['openid', 'email', 'profile', 'offline_access']);
    await getEntityRepository(Organization).update(organization.id, { enableSignUp: false });
    await getEntityRepository(User).delete({ email: SSO_EMAIL });
    ({ user: ssoUser } = await createUser(app, { email: SSO_EMAIL, organization, groups: ['end-user'] }));
  });

  describe('groups claim shape and delimiter', () => {
    it.each([
      [
        'a top-level array with no delimiter',
        { claimName: 'groups', delimiter: null },
        { groups: ['sales'] },
        ['sales'],
      ],
      [
        'a nested string split on a space delimiter',
        { claimName: 'custom_attributes.groups', delimiter: 'space' },
        { custom_attributes: { groups: 'sales custom_group' } },
        ['custom_group', 'sales'],
      ],
      [
        'a nested string split on a comma delimiter',
        { claimName: 'custom_attributes.groups', delimiter: ',' },
        { custom_attributes: { groups: 'sales,custom_group' } },
        ['custom_group', 'sales'],
      ],
    ])('should attach mapped groups from %s', async (_label, sync, claims, expected) => {
      await configureSync(sync);

      await login(claims);

      expect(await customGroupsOf(SSO_EMAIL)).toEqual(expected);
    });

    it.each([
      [
        'a string claim with no delimiter',
        { claimName: 'custom_attributes.groups', delimiter: null },
        { custom_attributes: { groups: 'sales' } },
      ],
      [
        'a string claim whose separator does not match the delimiter',
        { claimName: 'custom_attributes.groups', delimiter: ';' },
        { custom_attributes: { groups: 'sales,custom_group' } },
      ],
      ['an array claim when a delimiter is set', { claimName: 'groups', delimiter: ',' }, { groups: ['sales'] }],
    ])('should detach the user from synced groups for %s', async (_label, sync, claims) => {
      await configureSync(sync);
      await createUserGroupPermissions(app, ssoUser, ['sales']);
      expect(await customGroupsOf(SSO_EMAIL)).toEqual(['sales']);

      await login(claims);

      expect(await customGroupsOf(SSO_EMAIL)).toEqual([]);
    });

    it('should remove a group once its value is dropped from the claim', async () => {
      await configureSync({ claimName: 'custom_attributes.groups', delimiter: 'space' });
      await login({ custom_attributes: { groups: 'sales custom_group' } });
      expect(await customGroupsOf(SSO_EMAIL)).toEqual(['custom_group', 'sales']);

      await login({ custom_attributes: { groups: 'sales' } });

      expect(await customGroupsOf(SSO_EMAIL)).toEqual(['sales']);
    });

    it('should let a global OIDC_GROUPS_DELIMITER override the saved delimiter', async () => {
      await configureSync({ claimName: 'custom_attributes.groups', delimiter: ',' });
      process.env.OIDC_GROUPS_DELIMITER = ';';

      await login({ custom_attributes: { groups: 'sales;custom_group' } });

      expect(await customGroupsOf(SSO_EMAIL)).toEqual(['custom_group', 'sales']);
    });
  });

  describe('user registration', () => {
    const NEW_EMAIL = 'unregistered@example.com';

    beforeEach(async () => {
      await configureSync({ claimName: 'groups', delimiter: null });
      await getEntityRepository(User).delete({ email: NEW_EMAIL });
    });

    it('should reject a user who is not in the workspace when sign up is disabled', async () => {
      await expect(login({ email: NEW_EMAIL, groups: ['sales'] })).rejects.toThrow(
        'User does not exist in the workspace'
      );
    });

    it('should create the user and attach groups when sign up is enabled', async () => {
      await getEntityRepository(Organization).update(organization.id, { enableSignUp: true });

      await login({ email: NEW_EMAIL, groups: ['sales'] });

      expect(await customGroupsOf(NEW_EMAIL)).toEqual(['sales']);
    });
  });

  describe('groups scope in the authorization request', () => {
    const requestedScopes = async () => {
      const { authorizationUrl } = await app.get(OauthService).handleOIDCConfigs(fakeResponse(), configId);
      return new URL(authorizationUrl).searchParams.get('scope').split(' ');
    };

    it('should not request groups when the IdP does not advertise it', async () => {
      expect(await requestedScopes()).not.toContain('groups');
    });

    it('should request groups when the IdP advertises it', async () => {
      idp.setScopesSupported(['openid', 'email', 'profile', 'groups']);

      expect(await requestedScopes()).toContain('groups');
    });

    it('should request groups when the IdP publishes no scope list', async () => {
      idp.setScopesSupported(undefined);

      expect(await requestedScopes()).toContain('groups');
    });
  });
});
