import { AbilityBuilder, Ability } from '@casl/ability';
import { CustomComponentLibrary } from 'src/entities/custom_component_library.entity';
import { FEATURE_KEY } from 'src/modules/custom-component-libraries/constants';
import { UserAllPermissions } from 'src/modules/app/types';
import { FeatureAbility, FeatureAbilityFactory } from 'src/modules/custom-component-libraries/ability';

/** Calls defineAbilityFor directly, without the NestJS DI / AbilityService round trip. */
function buildAbility(permissions: Partial<UserAllPermissions>): FeatureAbility {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability as any);
  const factory = new FeatureAbilityFactory({} as any);
  // defineAbilityFor is protected — cast to access it directly in tests.
  (factory as any).defineAbilityFor(can, permissions as UserAllPermissions);
  return build({ detectSubjectType: (item: any) => item.constructor });
}

function makePermissions(overrides: Partial<UserAllPermissions> = {}): UserAllPermissions {
  return {
    superAdmin: false,
    isAdmin: false,
    isBuilder: false,
    isEndUser: true,
    user: { id: 'user-1' } as any,
    resource: [],
    userPermission: {} as any,
    ...overrides,
  };
}

const AUTHORING_KEYS = [
  FEATURE_KEY.CREATE_LIBRARY,
  FEATURE_KEY.FIND_OR_CREATE_LIBRARY,
  FEATURE_KEY.UPLOAD_DEV_BUNDLE,
  FEATURE_KEY.STREAM_DEV_BUNDLE,
  FEATURE_KEY.PUBLISH_REVISION,
];

const READ_KEYS = [FEATURE_KEY.GET_LIBRARY, FEATURE_KEY.LIST_LIBRARIES, FEATURE_KEY.SERVE_BUNDLE];

describe('FeatureAbilityFactory — custom-component-libraries ability', () => {
  describe.each([
    ['superAdmin', { superAdmin: true, isEndUser: false }],
    ['admin', { isAdmin: true, isEndUser: false }],
    ['builder', { isBuilder: true, isEndUser: false }],
  ])('%s', (_role, overrides) => {
    const ability = buildAbility(makePermissions(overrides as Partial<UserAllPermissions>));

    it.each(AUTHORING_KEYS)('can %s', (key) => {
      expect(ability.can(key, CustomComponentLibrary)).toBe(true);
    });

    it.each(READ_KEYS)('can %s', (key) => {
      expect(ability.can(key, CustomComponentLibrary)).toBe(true);
    });
  });

  describe('end user', () => {
    const ability = buildAbility(makePermissions());

    it.each(AUTHORING_KEYS)('cannot %s', (key) => {
      // Break this catches: any of CREATE_LIBRARY/FIND_OR_CREATE_LIBRARY/UPLOAD_DEV_BUNDLE/
      // STREAM_DEV_BUNDLE/PUBLISH_REVISION falling back into the always-on read grant below.
      expect(ability.can(key, CustomComponentLibrary)).toBe(false);
    });

    it.each(READ_KEYS)('can %s', (key) => {
      // An app with a CCL component must still render for an end user viewing it.
      expect(ability.can(key, CustomComponentLibrary)).toBe(true);
    });

    it('cannot DELETE_LIBRARY', () => {
      expect(ability.can(FEATURE_KEY.DELETE_LIBRARY, CustomComponentLibrary)).toBe(false);
    });
  });

  describe('DELETE_LIBRARY', () => {
    it('builder alone cannot DELETE_LIBRARY', () => {
      const ability = buildAbility(makePermissions({ isBuilder: true, isEndUser: false }));
      expect(ability.can(FEATURE_KEY.DELETE_LIBRARY, CustomComponentLibrary)).toBe(false);
    });

    it('admin can DELETE_LIBRARY', () => {
      const ability = buildAbility(makePermissions({ isAdmin: true, isEndUser: false }));
      expect(ability.can(FEATURE_KEY.DELETE_LIBRARY, CustomComponentLibrary)).toBe(true);
    });

    it('superAdmin can DELETE_LIBRARY', () => {
      const ability = buildAbility(makePermissions({ superAdmin: true, isEndUser: false }));
      expect(ability.can(FEATURE_KEY.DELETE_LIBRARY, CustomComponentLibrary)).toBe(true);
    });
  });
});
