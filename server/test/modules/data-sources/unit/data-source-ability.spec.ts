import { AbilityBuilder, Ability } from '@casl/ability';
import { DataSource } from '@entities/data_source.entity';
import { FEATURE_KEY } from 'src/modules/data-sources/constants';
import { MODULES } from 'src/modules/app/constants/modules';
import { UserAllPermissions } from 'src/modules/app/types';
import { FeatureAbility, FeatureAbilityFactory } from 'src/modules/data-sources/ability';

/** Calls defineAbilityFor directly, without the NestJS DI / AbilityService round trip. */
function buildAbility(permissions: Partial<UserAllPermissions>, request?: { tj_resource_id?: string }): FeatureAbility {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as any);
  const factory = new FeatureAbilityFactory({} as any);
  // defineAbilityFor is protected — cast to access it directly in tests.
  (factory as any).defineAbilityFor(can, permissions as UserAllPermissions, undefined, request);
  return build({ detectSubjectType: (item: any) => item.constructor });
}

type GlobalDataSourcePermission = {
  isAllConfigurable?: boolean;
  isAllUsable?: boolean;
  configurableDataSourceId?: string[];
  usableDataSourcesId?: string[];
};

/** Non-admin builder whose global data source permissions are exactly those passed in. */
function builderPermissions(
  userPermission: {
    dataSourceCreate?: boolean;
    dataSourceDelete?: boolean;
    isEndUser?: boolean;
    dataSource?: GlobalDataSourcePermission;
  } = {}
): UserAllPermissions {
  const { dataSourceCreate = false, dataSourceDelete = false, isEndUser = false, dataSource = {} } = userPermission;
  return {
    superAdmin: false,
    isAdmin: false,
    isBuilder: true,
    isEndUser,
    user: { id: 'user-1' } as any,
    resource: [],
    userPermission: {
      dataSourceCreate,
      dataSourceDelete,
      isEndUser,
      [MODULES.GLOBAL_DATA_SOURCE]: dataSource,
    } as any,
  } as UserAllPermissions;
}

// Must never be reachable through the Delete permission alone.
const CONFIGURATION_KEYS = [
  FEATURE_KEY.UPDATE,
  FEATURE_KEY.GET_BY_ENVIRONMENT,
  FEATURE_KEY.TEST_CONNECTION,
  FEATURE_KEY.VALIDATE_OPTIONS,
];

const DATA_SOURCE_ID = 'ds-1';

describe('FeatureAbilityFactory — data-sources ability', () => {
  describe('delete-only builder', () => {
    // dataSourceDelete=true, dataSourceCreate=false, no configurable data sources.
    const ability = buildAbility(builderPermissions({ dataSourceDelete: true }), { tj_resource_id: DATA_SOURCE_ID });

    it('can DELETE and run its dependency check', () => {
      expect(ability.can(FEATURE_KEY.DELETE, DataSource)).toBe(true);
      expect(ability.can(FEATURE_KEY.QUERIES_LINKED_TO_DATASOURCE, DataSource)).toBe(true);
    });

    it('can GET so the data source can be listed for deletion', () => {
      expect(ability.can(FEATURE_KEY.GET, DataSource)).toBe(true);
    });

    // Regression: delete-only must not grant UPDATE/configuration (credential-redirect escalation).
    it.each(CONFIGURATION_KEYS)('cannot %s', (key) => {
      expect(ability.can(key, DataSource)).toBe(false);
    });

    it('cannot CREATE', () => {
      expect(ability.can(FEATURE_KEY.CREATE, DataSource)).toBe(false);
    });
  });

  describe('create-only builder', () => {
    const ability = buildAbility(builderPermissions({ dataSourceCreate: true }));

    it('can CREATE and configure data sources', () => {
      expect(ability.can(FEATURE_KEY.CREATE, DataSource)).toBe(true);
      expect(ability.can(FEATURE_KEY.UPDATE, DataSource)).toBe(true);
      expect(ability.can(FEATURE_KEY.GET, DataSource)).toBe(true);
    });

    it('cannot DELETE', () => {
      expect(ability.can(FEATURE_KEY.DELETE, DataSource)).toBe(false);
    });
  });

  describe('delete + configure-all builder', () => {
    // Configure legitimately grants UPDATE — Delete must not short-circuit before this branch.
    const ability = buildAbility(
      builderPermissions({ dataSourceDelete: true, dataSource: { isAllConfigurable: true } })
    );

    it('can both DELETE and UPDATE', () => {
      expect(ability.can(FEATURE_KEY.DELETE, DataSource)).toBe(true);
      expect(ability.can(FEATURE_KEY.UPDATE, DataSource)).toBe(true);
    });
  });

  describe('delete + per-data-source configure builder', () => {
    const permissions = builderPermissions({
      dataSourceDelete: true,
      dataSource: { configurableDataSourceId: [DATA_SOURCE_ID] },
    });

    it('can UPDATE the specifically-configurable data source', () => {
      const ability = buildAbility(permissions, { tj_resource_id: DATA_SOURCE_ID });
      expect(ability.can(FEATURE_KEY.UPDATE, DataSource)).toBe(true);
      expect(ability.can(FEATURE_KEY.DELETE, DataSource)).toBe(true);
    });

    it('cannot UPDATE a different data source it was not granted Configure on', () => {
      const ability = buildAbility(permissions, { tj_resource_id: 'ds-other' });
      expect(ability.can(FEATURE_KEY.UPDATE, DataSource)).toBe(false);
    });
  });

  describe('builder with no data source permissions', () => {
    const ability = buildAbility(builderPermissions());

    it.each([FEATURE_KEY.CREATE, FEATURE_KEY.UPDATE, FEATURE_KEY.DELETE])('cannot %s', (key) => {
      expect(ability.can(key, DataSource)).toBe(false);
    });
  });

  describe.each([
    ['admin', { isAdmin: true }],
    ['superAdmin', { superAdmin: true }],
  ])('%s', (_role, overrides) => {
    const ability = buildAbility({
      ...builderPermissions({ dataSourceDelete: true }),
      isBuilder: false,
      ...overrides,
    } as Partial<UserAllPermissions>);

    it('can both UPDATE and DELETE', () => {
      expect(ability.can(FEATURE_KEY.UPDATE, DataSource)).toBe(true);
      expect(ability.can(FEATURE_KEY.DELETE, DataSource)).toBe(true);
    });
  });
});
