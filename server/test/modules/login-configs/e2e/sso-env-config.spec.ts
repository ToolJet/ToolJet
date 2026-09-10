import * as fs from 'fs';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Issuer } from 'openid-client';
import {
  initTestApp,
  closeTestApp,
  ensureInstanceSSOConfigs,
  createUser,
  getEntityRepository,
  buildTestSession,
} from 'test-helper';
import { OrganizationEnvUtilService } from '@ee/organization-env/util.service';
import { LoginConfigsService } from '@ee/login-configs/service';
import { SSOConfigs, SSOType } from 'src/entities/sso_config.entity';
import { Organization } from 'src/entities/organization.entity';
import { User } from 'src/entities/user.entity';

const TEST_ORG_SLUG = 'sso-env-config-test-org';

/** @group platform */
describe('LoginConfigsController', () => {
  describe('EE (plan: enterprise)', () => {
    let app: INestApplication;
    let ssoConfigsRepository: ReturnType<typeof getEntityRepository<SSOConfigs>>;
    let orgId: string;
    let adminUser: User;
    let tokenCookie: string[];

    let baselineWorkspaceOidcConfig: string;
    let baselineWorkspaceSamlConfig: string;
    let baselineWorkspaceLdapConfig: string;

    const runBootSequence = async () => {
      await app.get(OrganizationEnvUtilService).initialize();
      await app.get(LoginConfigsService).autoEnableEnvConfigs();
    };

    const getInstanceOidcRow = () =>
      ssoConfigsRepository.findOne({ where: { sso: SSOType.OPENID, organizationId: IsNull() } });

    const getOrgRow = (sso: SSOType) => ssoConfigsRepository.findOne({ where: { sso, organizationId: orgId } });

    const clearOrgRows = async (sso: SSOType) => {
      await ssoConfigsRepository.delete({ sso, organizationId: orgId });
    };

    beforeAll(async () => {
      process.env.OIDC_CLIENT_ID = 'instance-client-id';
      process.env.OIDC_CLIENT_SECRET = 'instance-client-secret';
      process.env.OIDC_WELL_KNOWN_URL = 'https://instance-idp.example.com/.well-known/openid-configuration';
      process.env.OIDC_NAME = 'Instance OIDC';
      process.env.OIDC_GRANT_TYPE = 'authorization_code';

      const samlIdpMetadata = fs.readFileSync('./test/__mocks__/test_idp_metadata.xml').toString('utf8');
      baselineWorkspaceOidcConfig = JSON.stringify({
        [TEST_ORG_SLUG]: [
          {
            OIDC_1_CLIENT_ID: 'ws-client-1',
            OIDC_1_CLIENT_SECRET: 'ws-secret-1',
            OIDC_1_WELL_KNOWN_URL: 'https://idp1.example.com/.well-known/openid-configuration',
            OIDC_1_NAME: 'first',
            OIDC_1_GRANT_TYPE: 'authorization_code',
          },
          {
            OIDC_2_CLIENT_ID: 'ws-client-2',
            OIDC_2_CLIENT_SECRET: 'ws-secret-2',
            OIDC_2_WELL_KNOWN_URL: 'https://idp2.example.com/.well-known/openid-configuration',
            OIDC_2_NAME: 'second',
            OIDC_2_GRANT_TYPE: 'authorization_code',
          },
        ],
      });
      baselineWorkspaceSamlConfig = JSON.stringify({
        [TEST_ORG_SLUG]: { SAML_IDP_METADATA: samlIdpMetadata, SAML_NAME: 'Test SAML' },
      });
      baselineWorkspaceLdapConfig = JSON.stringify({
        [TEST_ORG_SLUG]: {
          LDAP_HOST_NAME: 'localhost',
          LDAP_PORT: '389',
          LDAP_BASE_DN: 'dc=example,dc=com',
          LDAP_NAME: 'Test LDAP',
        },
      });
      process.env.WORKSPACE_OIDC_CONFIG = baselineWorkspaceOidcConfig;
      process.env.WORKSPACE_SAML_CONFIG = baselineWorkspaceSamlConfig;
      process.env.WORKSPACE_LDAP_CONFIG = baselineWorkspaceLdapConfig;

      ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));
      ssoConfigsRepository = getEntityRepository(SSOConfigs);

      const { organization, user } = await createUser(app, { organizationName: 'SSO Env Config Test Org' });
      orgId = organization.id;
      adminUser = user;
      await getEntityRepository(Organization).update(orgId, { slug: TEST_ORG_SLUG });
      ({ tokenCookie } = await buildTestSession(adminUser, orgId));

      await ensureInstanceSSOConfigs();
      await ssoConfigsRepository.update(
        { sso: SSOType.OPENID, organizationId: IsNull() },
        { useEnvConfig: false, enabled: false, configs: { clientId: '', clientSecret: '', name: '', wellKnownUrl: '' } }
      );
    }, 90_000);

    afterAll(async () => {
      await closeTestApp(app);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    describe('instance OIDC env config', () => {
      beforeEach(async () => {
        await ssoConfigsRepository.update(
          { sso: SSOType.OPENID, organizationId: IsNull() },
          {
            useEnvConfig: false,
            enabled: false,
            configs: { clientId: '', clientSecret: '', name: '', wellKnownUrl: '' },
          }
        );
      });

      it('should auto-enable on boot when the well-known URL resolves', async () => {
        jest.spyOn(Issuer, 'discover').mockResolvedValue({} as any);

        await runBootSequence();

        const row = await getInstanceOidcRow();
        expect(row?.useEnvConfig).toBe(true);
        expect(row?.enabled).toBe(true);
        expect((row?.configs as Record<string, unknown>)?.isAutoEnabled).toBe(true);
      });

      it('should stay disabled, then self-heal once the well-known URL becomes reachable', async () => {
        jest.spyOn(Issuer, 'discover').mockRejectedValue(new Error('connect ECONNREFUSED'));
        await runBootSequence();
        expect((await getInstanceOidcRow())?.useEnvConfig).toBe(false);

        jest.restoreAllMocks();
        jest.spyOn(Issuer, 'discover').mockResolvedValue({} as any);
        await runBootSequence();

        const row = await getInstanceOidcRow();
        expect(row?.useEnvConfig).toBe(true);
        expect(row?.enabled).toBe(true);
      });

      it('should never re-enable a provider a human explicitly disabled, even after the config is fixed', async () => {
        jest.spyOn(Issuer, 'discover').mockResolvedValue({} as any);
        await runBootSequence();
        const enabledRow = await getInstanceOidcRow();
        expect(enabledRow?.useEnvConfig).toBe(true);

        await ssoConfigsRepository.update(
          { sso: SSOType.OPENID, organizationId: IsNull() },
          {
            useEnvConfig: false,
            configs: { ...(enabledRow?.configs as Record<string, unknown>), isAutoEnabled: false },
          }
        );

        await runBootSequence();

        expect((await getInstanceOidcRow())?.useEnvConfig).toBe(false);
      });

      it('should throw the specific missing keys on a manual toggle attempt with an incomplete config', async () => {
        const savedWellKnownUrl = process.env.OIDC_WELL_KNOWN_URL;
        delete process.env.OIDC_WELL_KNOWN_URL;
        try {
          await app.get(OrganizationEnvUtilService).initialize();
          await expect(
            app.get(LoginConfigsService).toggleInstanceOidcEnvConfig({ useEnvConfig: true }, 'a-human-user-id')
          ).rejects.toThrow(/OIDC_WELL_KNOWN_URL/);
        } finally {
          process.env.OIDC_WELL_KNOWN_URL = savedWellKnownUrl;
          await app.get(OrganizationEnvUtilService).initialize();
        }
      });
    });

    describe('workspace OIDC env config', () => {
      afterEach(async () => {
        process.env.WORKSPACE_OIDC_CONFIG = baselineWorkspaceOidcConfig;
        await clearOrgRows(SSOType.OPENID);
      });

      it('should auto-enable a single provider given as bare keys', async () => {
        jest.spyOn(Issuer, 'discover').mockResolvedValue({} as any);
        process.env.WORKSPACE_OIDC_CONFIG = JSON.stringify({
          [TEST_ORG_SLUG]: [
            {
              OIDC_CLIENT_ID: 'id-1',
              OIDC_CLIENT_SECRET: 'secret-1',
              OIDC_WELL_KNOWN_URL: 'https://idp1.example.com/.well-known/openid-configuration',
              OIDC_NAME: 'first',
              OIDC_GRANT_TYPE: 'authorization_code',
            },
          ],
        });

        await runBootSequence();

        const row = await getOrgRow(SSOType.OPENID);
        expect(row?.useEnvConfig).toBe(true);
        expect(row?.enabled).toBe(true);
        expect((row?.configs as Record<string, unknown>)?.envConfigIndex).toBe(0);
      });

      it('should auto-enable multiple providers independently, each claiming its own slot', async () => {
        jest.spyOn(Issuer, 'discover').mockResolvedValue({} as any);

        await runBootSequence();

        const rows = await ssoConfigsRepository.find({ where: { sso: SSOType.OPENID, organizationId: orgId } });
        expect(rows).toHaveLength(2);
        const indices = rows.map((r) => (r.configs as Record<string, unknown>)?.envConfigIndex).sort();
        expect(indices).toEqual([0, 1]);
        expect(rows.every((r) => r.useEnvConfig && r.enabled)).toBe(true);
      });

      it('should throw the specific missing keys on a manual toggle attempt with an incomplete config', async () => {
        process.env.WORKSPACE_OIDC_CONFIG = JSON.stringify({
          [TEST_ORG_SLUG]: [{ OIDC_CLIENT_ID: 'id-1', OIDC_NAME: 'first' }],
        });
        await app.get(OrganizationEnvUtilService).initialize();

        await expect(
          app.get(LoginConfigsService).toggleOidcEnvConfig('a-human-user-id', orgId, { useEnvConfig: true })
        ).rejects.toThrow(/OIDC_WELL_KNOWN_URL/);
      });
    });

    describe('workspace SAML env config', () => {
      afterEach(async () => {
        process.env.WORKSPACE_SAML_CONFIG = baselineWorkspaceSamlConfig;
        await clearOrgRows(SSOType.SAML);
      });

      it('should auto-enable when the IdP metadata is structurally valid', async () => {
        await runBootSequence();

        const row = await getOrgRow(SSOType.SAML);
        expect(row?.useEnvConfig).toBe(true);
        expect(row?.enabled).toBe(true);
        expect((row?.configs as Record<string, unknown>)?.isAutoEnabled).toBe(true);
      });

      it('should delete the system-managed row when config becomes invalid, then re-create it once fixed', async () => {
        await runBootSequence();
        expect((await getOrgRow(SSOType.SAML))?.useEnvConfig).toBe(true);

        process.env.WORKSPACE_SAML_CONFIG = JSON.stringify({
          [TEST_ORG_SLUG]: { SAML_IDP_METADATA: '<EntityDescriptor></EntityDescriptor>', SAML_NAME: 'Test SAML' },
        });
        await runBootSequence();
        expect(await getOrgRow(SSOType.SAML)).toBeNull();

        process.env.WORKSPACE_SAML_CONFIG = baselineWorkspaceSamlConfig;
        await runBootSequence();

        const row = await getOrgRow(SSOType.SAML);
        expect(row?.useEnvConfig).toBe(true);
        expect(row?.enabled).toBe(true);
      });

      it('should throw the specific missing keys on a manual toggle attempt with an incomplete config', async () => {
        process.env.WORKSPACE_SAML_CONFIG = JSON.stringify({ [TEST_ORG_SLUG]: { SAML_NAME: 'Test SAML' } });
        await app.get(OrganizationEnvUtilService).initialize();

        await expect(
          app.get(LoginConfigsService).toggleSamlEnvConfig('a-human-user-id', orgId, { useEnvConfig: true })
        ).rejects.toThrow(/SAML_IDP_METADATA/);
      });
    });

    describe('workspace LDAP env config', () => {
      afterEach(async () => {
        process.env.WORKSPACE_LDAP_CONFIG = baselineWorkspaceLdapConfig;
        await clearOrgRows(SSOType.LDAP);
      });

      it('should auto-enable with no live connectivity check', async () => {
        await runBootSequence();

        const row = await getOrgRow(SSOType.LDAP);
        expect(row?.useEnvConfig).toBe(true);
        expect(row?.enabled).toBe(true);
      });

      it('should throw the specific missing keys on a manual toggle attempt with an incomplete config', async () => {
        process.env.WORKSPACE_LDAP_CONFIG = JSON.stringify({
          [TEST_ORG_SLUG]: { LDAP_HOST_NAME: 'localhost', LDAP_PORT: '389' },
        });
        await app.get(OrganizationEnvUtilService).initialize();

        await expect(
          app.get(LoginConfigsService).toggleLdapEnvConfig('a-human-user-id', orgId, { useEnvConfig: true })
        ).rejects.toThrow(/LDAP_BASE_DN/);
      });
    });

    describe('workspace config shape enforcement', () => {
      afterEach(async () => {
        process.env.WORKSPACE_LDAP_CONFIG = baselineWorkspaceLdapConfig;
        await clearOrgRows(SSOType.LDAP);
      });

      it('should ignore an array-wrapped WORKSPACE_LDAP_CONFIG and create no row', async () => {
        process.env.WORKSPACE_LDAP_CONFIG = JSON.stringify([JSON.parse(baselineWorkspaceLdapConfig)]);

        await runBootSequence();

        expect(await getOrgRow(SSOType.LDAP)).toBeNull();
      });
    });

    describe('PATCH /api/login-configs/:provider/env-configs', () => {
      it.each(['oidc', 'saml', 'ldap'])('should dispatch %s to the matching provider', async (provider) => {
        await request(app.getHttpServer())
          .patch(`/api/login-configs/${provider}/env-configs`)
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ useEnvConfig: false })
          .expect(200);
      });

      it('should return 400 for an unknown provider', async () => {
        await request(app.getHttpServer())
          .patch('/api/login-configs/not-a-provider/env-configs')
          .set('Cookie', tokenCookie)
          .set('tj-workspace-id', orgId)
          .send({ useEnvConfig: false })
          .expect(400);
      });
    });
  });
});
