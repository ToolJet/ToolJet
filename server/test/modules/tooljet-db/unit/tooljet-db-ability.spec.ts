/**
 * ToolJet-DB ability — proxy/view authorization
 *
 * Regression for the TJDB proxy authorization bypass:
 *  - A logged-in end-user with NO data query could reach PROXY_POSTGREST
 *    because the grant keyed on `!orgMismatch`, which is false when no data query is
 *    resolved (direct /proxy call with no `data-query-id` header). Any member of
 *    any role, including a foreign-workspace member switching via `tj-workspace-id`, was
 *    granted. Access now requires a resolved in-workspace data query (or builder/admin/tjdbCRUD).
 *  - VIEW_TABLE / VIEW_TABLES were granted unconditionally, letting end-users enumerate
 *    the workspace's internal tables. Now builder/admin/tjdbCRUD only.
 *
 * @group database
 */
import { FeatureAbilityFactory } from 'src/modules/tooljet-db/ability';
import { FEATURE_KEY } from 'src/modules/tooljet-db/constants';
import { InternalTable } from 'src/entities/internal_table.entity';

const ORG_A = 'org-a';
const ORG_B = 'org-b';
const TABLE_X = '11111111-1111-4111-8111-111111111111';
const TABLE_Y = '22222222-2222-4222-8222-222222222222';

type RoleFlags = {
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  isBuilder?: boolean;
  isEndUser?: boolean;
  tjdbCRUD?: boolean;
};

/**
 * Drives the real FeatureAbilityFactory with a mocked data-query lookup and a role injected
 * via request.tj_user_permissions (so createAbility skips the live permission service).
 */
async function buildAbility(opts: {
  role: RoleFlags;
  organizationId?: string | null;
  dataQueryId?: string;
  /** The org the resolved data query's app belongs to (undefined => manager returns null). */
  dataQueryAppOrg?: string;
  dataQueryIsPublic?: boolean;
  /** The data query's own operation and table; defaults to a read of TABLE_X. */
  dataQueryOptions?: Record<string, unknown>;
  /** The proxy request; defaults to a read of TABLE_X, matching the default data query. */
  method?: string;
  url?: string;
}) {
  const {
    role,
    organizationId = ORG_A,
    dataQueryId,
    dataQueryAppOrg,
    dataQueryIsPublic,
    dataQueryOptions = { operation: 'list_rows', table_id: TABLE_X },
    method = 'GET',
    url = `/api/tooljet-db/proxy/${TABLE_X}`,
  } = opts;

  const dataQuery =
    dataQueryAppOrg === undefined
      ? null
      : {
          app: { organizationId: dataQueryAppOrg },
          appVersion: { isPublic: !!dataQueryIsPublic },
          options: dataQueryOptions,
        };

  const manager = { findOne: jest.fn().mockResolvedValue(dataQuery) };
  const abilityService = { resourceActionsPermission: jest.fn() };

  const factory = new FeatureAbilityFactory(manager as any, abilityService as any);

  const headers: Record<string, string> = {};
  if (organizationId !== null) headers['tj-workspace-id'] = organizationId;
  if (dataQueryId) headers['data-query-id'] = dataQueryId;

  const user = { id: 'user-1', organizationId: organizationId ?? undefined } as any;
  const request: any = {
    method,
    url,
    originalUrl: url,
    headers,
    user: organizationId === null ? undefined : user,
    tj_user_permissions: {
      isSuperAdmin: !!role.isSuperAdmin,
      isAdmin: !!role.isAdmin,
      isBuilder: !!role.isBuilder,
      isEndUser: !!role.isEndUser,
      tjdbCRUD: !!role.tjdbCRUD,
    },
  };

  return factory.createAbility(user, { moduleName: 'tooljet_database', features: [] }, [], request);
}

describe('ToolJet-DB FeatureAbilityFactory', () => {
  describe('PROXY_POSTGREST — data access', () => {
    it('denies a logged-in end-user with NO data query (the bypass)', async () => {
      const ability = await buildAbility({ role: { isEndUser: true }, organizationId: ORG_A });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(false);
    });

    it('denies a foreign-workspace end-user switching workspace by header with no data query', async () => {
      // Session member operating with tj-workspace-id = ORG_A but no resolved data query.
      const ability = await buildAbility({ role: { isEndUser: true }, organizationId: ORG_A });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(false);
    });

    it('allows an end-user running a valid in-workspace data query (app runtime)', async () => {
      const ability = await buildAbility({
        role: { isEndUser: true },
        organizationId: ORG_A,
        dataQueryId: 'dq-1',
        dataQueryAppOrg: ORG_A,
      });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(true);
    });

    it('denies an end-user whose data query belongs to a different workspace (orgMismatch)', async () => {
      const ability = await buildAbility({
        role: { isEndUser: true },
        organizationId: ORG_A,
        dataQueryId: 'dq-1',
        dataQueryAppOrg: ORG_B,
      });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(false);
    });

    it('allows a builder without a data query', async () => {
      const ability = await buildAbility({ role: { isBuilder: true }, organizationId: ORG_A });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(true);
    });

    it('allows an admin without a data query', async () => {
      const ability = await buildAbility({ role: { isAdmin: true }, organizationId: ORG_A });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(true);
    });

    it('allows a tjdbCRUD custom-permission role (preserved) without a data query', async () => {
      const ability = await buildAbility({ role: { isEndUser: true, tjdbCRUD: true }, organizationId: ORG_A });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(true);
    });

    it('allows a public-app request (no org, public data query)', async () => {
      const ability = await buildAbility({
        role: { isEndUser: true },
        organizationId: null,
        dataQueryId: 'dq-1',
        dataQueryAppOrg: ORG_A,
        dataQueryIsPublic: true,
      });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(true);
    });
  });

  // A data query only opens the proxy for its own table and its own operation.
  describe('PROXY_POSTGREST — bound to the data query', () => {
    const endUserWith = (overrides: Parameters<typeof buildAbility>[0] extends infer O ? Partial<O> : never) =>
      buildAbility({
        role: { isEndUser: true },
        organizationId: ORG_A,
        dataQueryId: 'dq-1',
        dataQueryAppOrg: ORG_A,
        ...overrides,
      });
    const canProxy = async (overrides) =>
      (await endUserWith(overrides)).can(FEATURE_KEY.PROXY_POSTGREST, InternalTable);

    it("allows a HEAD on the read query's table", async () => {
      expect(await canProxy({ method: 'HEAD' })).toBe(true);
    });

    it('denies a read query used on another table', async () => {
      expect(await canProxy({ url: `/api/tooljet-db/proxy/${TABLE_Y}` })).toBe(false);
    });

    it.each([['POST'], ['PATCH'], ['PUT'], ['DELETE']])('denies a read query used for %s', async (method) => {
      expect(await canProxy({ method })).toBe(false);
    });

    it.each([
      ['create_row', 'POST'],
      ['update_rows', 'PATCH'],
      ['delete_rows', 'DELETE'],
    ])('allows a %s query its own method (%s) on its own table', async (operation, method) => {
      expect(await canProxy({ method, dataQueryOptions: { operation, table_id: TABLE_X } })).toBe(true);
    });

    it('denies a create_row query used to delete rows', async () => {
      expect(
        await canProxy({ method: 'DELETE', dataQueryOptions: { operation: 'create_row', table_id: TABLE_X } })
      ).toBe(false);
    });

    it.each([['join_tables'], ['sql_execution'], ['bulk_update_with_primary_key']])(
      'denies a %s query, which never runs through the proxy',
      async (operation) => {
        expect(await canProxy({ dataQueryOptions: { operation, table_id: TABLE_X } })).toBe(false);
      }
    );

    it('denies a read that embeds another table', async () => {
      expect(await canProxy({ url: `/api/tooljet-db/proxy/${TABLE_X}?select=*,${TABLE_Y}(*)` })).toBe(false);
    });

    it('denies a read that embeds another table behind URL encoding', async () => {
      expect(await canProxy({ url: `/api/tooljet-db/proxy/${TABLE_X}?select=*,${TABLE_Y}%28*%29` })).toBe(false);
    });

    it("denies a read that filters on another table's columns", async () => {
      expect(await canProxy({ url: `/api/tooljet-db/proxy/${TABLE_X}?${TABLE_Y}.id=eq.1` })).toBe(false);
    });

    it('denies a table addressed by a name placeholder', async () => {
      expect(await canProxy({ url: `/api/tooljet-db/proxy/\${other_table}` })).toBe(false);
    });

    it('allows a read of its own table with ordinary filters and environment', async () => {
      expect(
        await canProxy({ url: `/api/tooljet-db/proxy/${TABLE_X}?select=id,name&id=eq.1&environment_id=env-1` })
      ).toBe(true);
    });

    it("denies a public app's read query used on another table", async () => {
      const ability = await buildAbility({
        role: { isEndUser: true },
        organizationId: null,
        dataQueryId: 'dq-1',
        dataQueryAppOrg: ORG_A,
        dataQueryIsPublic: true,
        url: `/api/tooljet-db/proxy/${TABLE_Y}`,
      });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(false);
    });

    it('still allows a builder any table and method without a data query', async () => {
      const ability = await buildAbility({
        role: { isBuilder: true },
        organizationId: ORG_A,
        method: 'DELETE',
        url: `/api/tooljet-db/proxy/${TABLE_Y}`,
      });
      expect(ability.can(FEATURE_KEY.PROXY_POSTGREST, InternalTable)).toBe(true);
    });
  });

  describe('VIEW_TABLE / VIEW_TABLES — table-metadata enumeration', () => {
    it('denies an end-user from listing/viewing tables (the enumeration leak)', async () => {
      const ability = await buildAbility({ role: { isEndUser: true }, organizationId: ORG_A });
      expect(ability.can(FEATURE_KEY.VIEW_TABLES, InternalTable)).toBe(false);
      expect(ability.can(FEATURE_KEY.VIEW_TABLE, InternalTable)).toBe(false);
    });

    it('allows builder / admin / tjdbCRUD to view tables', async () => {
      for (const role of [{ isBuilder: true }, { isAdmin: true }, { isEndUser: true, tjdbCRUD: true }]) {
        const ability = await buildAbility({ role, organizationId: ORG_A });
        expect(ability.can(FEATURE_KEY.VIEW_TABLES, InternalTable)).toBe(true);
      }
    });
  });
});
