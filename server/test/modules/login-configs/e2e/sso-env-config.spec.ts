import * as fs from 'fs';
import { INestApplication } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Issuer } from 'openid-client';
import { initTestApp, closeTestApp, ensureInstanceSSOConfigs, createUser, getEntityRepository } from 'test-helper';
import { OrganizationEnvUtilService } from '@ee/organization-env/util.service';
import { LoginConfigsService } from '@ee/login-configs/service';
import { SSOConfigs, SSOType } from 'src/entities/sso_config.entity';
import { Organization } from 'src/entities/organization.entity';

const TEST_ORG_SLUG = 'sso-env-config-test-org';

/**
 * Covers the "map SSO credentials to environment variables" feature end-to-end: boot-time
 * auto-enable, self-healing (system-managed rows get deleted and retried, not stuck disabled),
 * human decisions being permanent, and the PRD's plain-object-only .env shape for workspace
 * configs (an array-wrapped value is rejected). Runs against a real app + real Postgres; the
 * only thing mocked is OIDC's external discovery call, same style as
 * test/modules/auth/e2e/oauth-saml.spec.ts. All fixtures are set directly on process.env in
 * beforeAll — nothing depends on .env.test, which is gitignored and never present in CI.
 */
/** @group platform */
describe('SSO env-config (e2e)', () => {
  let app: INestApplication;
  let ssoConfigsRepository: ReturnType<typeof getEntityRepository<SSOConfigs>>;
  let orgId: string;

  // Baseline fixtures, set in beforeAll — the per-describe-block tests below temporarily
  // override these and restore them in afterEach.
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
    // Instance-level OIDC fixture — constant for every test in "Instance OIDC" below;
    // Issuer.discover is mocked, so the well-known URL is never actually hit.
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
      [TEST_ORG_SLUG]: { LDAP_HOST_NAME: 'localhost', LDAP_PORT: '389', LDAP_BASE_DN: 'dc=example,dc=com', LDAP_NAME: 'Test LDAP' },
    });
    process.env.WORKSPACE_OIDC_CONFIG = baselineWorkspaceOidcConfig;
    process.env.WORKSPACE_SAML_CONFIG = baselineWorkspaceSamlConfig;
    process.env.WORKSPACE_LDAP_CONFIG = baselineWorkspaceLdapConfig;

    ({ app } = await initTestApp({ edition: 'ee', plan: 'enterprise', freshApp: true }));
    ssoConfigsRepository = getEntityRepository(SSOConfigs);

    const { organization } = await createUser(app, { organizationName: 'SSO Env Config Test Org' });
    orgId = organization.id;
    // createUser()'s org-creation path doesn't set a slug (unlike the real app's org creation
    // service) — set one explicitly so workspace-key resolution has something to match on.
    // Must match the workspace key baked into the WORKSPACE_*_CONFIG fixtures set above.
    await getEntityRepository(Organization).update(orgId, { slug: TEST_ORG_SLUG });

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

  // ─── Instance-level OIDC ────────────────────────────────────────────────
  // OIDC_CLIENT_ID / OIDC_CLIENT_SECRET / OIDC_WELL_KNOWN_URL / OIDC_NAME / OIDC_GRANT_TYPE are
  // set once in beforeAll — never overridden by these tests, only the DB row state and the
  // Issuer.discover mock change between cases.

  describe('Instance OIDC', () => {
    beforeEach(async () => {
      await ssoConfigsRepository.update(
        { sso: SSOType.OPENID, organizationId: IsNull() },
        { useEnvConfig: false, enabled: false, configs: { clientId: '', clientSecret: '', name: '', wellKnownUrl: '' } }
      );
    });

    it('auto-enables on boot when the well-known URL resolves', async () => {
      jest.spyOn(Issuer, 'discover').mockResolvedValue({} as any);

      await runBootSequence();

      const row = await getInstanceOidcRow();
      expect(row?.useEnvConfig).toBe(true);
      expect(row?.enabled).toBe(true);
      expect((row?.configs as Record<string, unknown>)?.isAutoEnabled).toBe(true);
    });

    it('stays disabled, then self-heals once the well-known URL becomes reachable', async () => {
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

    it('never re-enables a provider a human explicitly disabled, even after the config is fixed', async () => {
      jest.spyOn(Issuer, 'discover').mockResolvedValue({} as any);
      await runBootSequence();
      const enabledRow = await getInstanceOidcRow();
      expect(enabledRow?.useEnvConfig).toBe(true);

      await ssoConfigsRepository.update(
        { sso: SSOType.OPENID, organizationId: IsNull() },
        { useEnvConfig: false, configs: { ...(enabledRow?.configs as Record<string, unknown>), isAutoEnabled: false } }
      );

      await runBootSequence();

      expect((await getInstanceOidcRow())?.useEnvConfig).toBe(false);
    });
  });

  // ─── Workspace-level OIDC ───────────────────────────────────────────────
  // The baseline WORKSPACE_OIDC_CONFIG (set in beforeAll) is the 2-provider case. The
  // single-provider (bare-key) case temporarily overrides it, then restores the baseline.

  describe('Workspace OIDC', () => {
    afterEach(async () => {
      process.env.WORKSPACE_OIDC_CONFIG = baselineWorkspaceOidcConfig;
      await clearOrgRows(SSOType.OPENID);
    });

    it('auto-enables a single provider (bare keys)', async () => {
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

    it('auto-enables multiple providers independently, each claiming its own slot', async () => {
      jest.spyOn(Issuer, 'discover').mockResolvedValue({} as any);
      // Uses the baseline fixture directly (already a 2-provider config).

      await runBootSequence();

      const rows = await ssoConfigsRepository.find({ where: { sso: SSOType.OPENID, organizationId: orgId } });
      expect(rows).toHaveLength(2);
      const indices = rows.map((r) => (r.configs as Record<string, unknown>)?.envConfigIndex).sort();
      expect(indices).toEqual([0, 1]);
      expect(rows.every((r) => r.useEnvConfig && r.enabled)).toBe(true);
    });
  });

  // ─── Workspace-level SAML ───────────────────────────────────────────────

  describe('Workspace SAML', () => {
    afterEach(async () => {
      process.env.WORKSPACE_SAML_CONFIG = baselineWorkspaceSamlConfig;
      await clearOrgRows(SSOType.SAML);
    });

    it('auto-enables when the IdP metadata is structurally valid', async () => {
      // Uses the baseline fixture directly.
      await runBootSequence();

      const row = await getOrgRow(SSOType.SAML);
      expect(row?.useEnvConfig).toBe(true);
      expect(row?.enabled).toBe(true);
      expect((row?.configs as Record<string, unknown>)?.isAutoEnabled).toBe(true);
    });

    it('self-heals: deletes the system-managed row when config becomes invalid, then re-creates it once fixed', async () => {
      await runBootSequence();
      expect((await getOrgRow(SSOType.SAML))?.useEnvConfig).toBe(true);

      // Break it — metadata missing the required cert/SSO-endpoint structure.
      process.env.WORKSPACE_SAML_CONFIG = JSON.stringify({
        [TEST_ORG_SLUG]: { SAML_IDP_METADATA: '<EntityDescriptor></EntityDescriptor>', SAML_NAME: 'Test SAML' },
      });
      await runBootSequence();
      expect(await getOrgRow(SSOType.SAML)).toBeNull();

      // Restore the baseline fixture — should get a fresh row, not stay permanently gone.
      process.env.WORKSPACE_SAML_CONFIG = baselineWorkspaceSamlConfig;
      await runBootSequence();

      const row = await getOrgRow(SSOType.SAML);
      expect(row?.useEnvConfig).toBe(true);
      expect(row?.enabled).toBe(true);
    });
  });

  // ─── Workspace-level LDAP ───────────────────────────────────────────────

  describe('Workspace LDAP', () => {
    afterEach(async () => {
      process.env.WORKSPACE_LDAP_CONFIG = baselineWorkspaceLdapConfig;
      await clearOrgRows(SSOType.LDAP);
    });

    it('auto-enables with no live connectivity check', async () => {
      // Uses the baseline fixture directly.
      await runBootSequence();

      const row = await getOrgRow(SSOType.LDAP);
      expect(row?.useEnvConfig).toBe(true);
      expect(row?.enabled).toBe(true);
    });
  });

  // ─── Plain-object-only .env shape enforcement (matches the PRD) ────────

  describe('Plain-object-only workspace config shape', () => {
    afterEach(async () => {
      process.env.WORKSPACE_LDAP_CONFIG = baselineWorkspaceLdapConfig;
      await clearOrgRows(SSOType.LDAP);
    });

    it('ignores an array-wrapped WORKSPACE_LDAP_CONFIG — no row gets created', async () => {
      // Same fixture values as the baseline, just wrapped in an outer array the PRD doesn't
      // document — must be rejected, not silently accepted.
      process.env.WORKSPACE_LDAP_CONFIG = JSON.stringify([JSON.parse(baselineWorkspaceLdapConfig)]);

      await runBootSequence();

      expect(await getOrgRow(SSOType.LDAP)).toBeNull();
    });
  });
});
