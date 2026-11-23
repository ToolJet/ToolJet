import { Ability, AbilityBuilder } from '@casl/ability';
import { FeatureAbilityFactory, FeatureAbility } from '../../../../src/modules/data-sources/ability';
import { FEATURE_KEY } from '../../../../src/modules/data-sources/constants';
import { DataSource } from '../../../../src/entities/data_source.entity';
import { MODULES } from '../../../../src/modules/app/constants/modules';
import { UserAllPermissions } from '../../../../src/modules/app/types';

// Builds the data-source ability for a given permission set and reports whether the
// principal may call the OAuth-URL endpoint (which resolves workspace secrets).
function canGenerateOAuthUrl(permissions: Partial<UserAllPermissions>): boolean {
  const factory = new FeatureAbilityFactory({} as never);
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as never);
  const full: UserAllPermissions = {
    superAdmin: false,
    isAdmin: false,
    isBuilder: false,
    isEndUser: false,
    userPermission: { [MODULES.GLOBAL_DATA_SOURCE]: {} } as never,
    ...permissions,
  };
  // defineAbilityFor is protected; the test exercises it directly.
  (factory as unknown as { defineAbilityFor: (...a: unknown[]) => void }).defineAbilityFor(
    can,
    full,
    { moduleName: 'DATA_SOURCE', features: [] },
    {}
  );
  return build({ detectSubjectType: (i) => i.constructor as never }).can(FEATURE_KEY.GET_OAUTH2_BASE_URL, DataSource);
}

const endUserPerms = { [MODULES.GLOBAL_DATA_SOURCE]: {}, isEndUser: true } as never;

describe('DataSource ability | GET_OAUTH2_BASE_URL authorization', () => {
  it('should deny a plain end-user', () => {
    expect(canGenerateOAuthUrl({ isEndUser: true, userPermission: endUserPerms })).toBe(false);
  });

  it('should deny a view-only user (usable but not configurable)', () => {
    expect(
      canGenerateOAuthUrl({
        userPermission: { [MODULES.GLOBAL_DATA_SOURCE]: { isAllUsable: true } } as never,
      })
    ).toBe(false);
  });

  it('should allow an admin', () => {
    expect(canGenerateOAuthUrl({ isAdmin: true })).toBe(true);
  });

  it('should allow a super admin', () => {
    expect(canGenerateOAuthUrl({ superAdmin: true })).toBe(true);
  });

  it('should allow a builder', () => {
    expect(canGenerateOAuthUrl({ isBuilder: true })).toBe(true);
  });

  it('should allow a user with data source create permission', () => {
    expect(
      canGenerateOAuthUrl({
        userPermission: { [MODULES.GLOBAL_DATA_SOURCE]: {}, dataSourceCreate: true } as never,
      })
    ).toBe(true);
  });

  it('should allow a user with configurable data sources', () => {
    expect(
      canGenerateOAuthUrl({
        userPermission: {
          [MODULES.GLOBAL_DATA_SOURCE]: { configurableDataSourceId: ['ds-1'] },
        } as never,
      })
    ).toBe(true);
  });
});
