import { Ability, AbilityBuilder, AbilityClass } from '@casl/ability';
import { FeatureAbilityFactory, FeatureAbility } from '@modules/group-permissions/ability';
import { AbilityService } from '@modules/ability/interfaces/IService';
import { FEATURE_KEY, GROUP_PERMISSIONS_TYPE } from '@modules/group-permissions/constants';
import { GroupPermissions } from '@entities/group_permissions.entity';

const makeBuilder = () => new AbilityBuilder<FeatureAbility>(Ability as AbilityClass<FeatureAbility>);

// All features granted to admins/superAdmins
const ALL_ADMIN_FEATURES = [
  FEATURE_KEY.ADD_GROUP_USER,
  FEATURE_KEY.CREATE,
  FEATURE_KEY.DELETE,
  FEATURE_KEY.DELETE_GROUP_USER,
  FEATURE_KEY.DUPLICATE,
  FEATURE_KEY.GET_ADDABLE_USERS,
  FEATURE_KEY.GET_ONE,
  FEATURE_KEY.GET_ALL,
  FEATURE_KEY.UPDATE,
  FEATURE_KEY.GET_ALL_GROUP_USER,
  FEATURE_KEY.DELETE_GRANULAR_APP_PERMISSIONS,
  FEATURE_KEY.DELETE_GRANULAR_DATA_PERMISSIONS,
  FEATURE_KEY.CREATE_GRANULAR_APP_PERMISSIONS,
  FEATURE_KEY.CREATE_GRANULAR_DATA_PERMISSIONS,
  FEATURE_KEY.GET_ALL_GRANULAR_PERMISSIONS,
  FEATURE_KEY.GET_ADDABLE_APPS,
  FEATURE_KEY.UPDATE_GRANULAR_APP_PERMISSIONS,
  FEATURE_KEY.UPDATE_GRANULAR_DATA_PERMISSIONS,
  FEATURE_KEY.GET_ADDABLE_DS,
  FEATURE_KEY.USER_ROLE_CHANGE,
  FEATURE_KEY.CREATE_GRANULAR_FOLDER_PERMISSIONS,
  FEATURE_KEY.UPDATE_GRANULAR_FOLDER_PERMISSIONS,
  FEATURE_KEY.DELETE_GRANULAR_FOLDER_PERMISSIONS,
  FEATURE_KEY.GET_ADDABLE_FOLDERS,
  FEATURE_KEY.ASSIGN_GROUP_ADMIN,
  FEATURE_KEY.REVOKE_GROUP_ADMIN,
  FEATURE_KEY.GET_GROUP_ADMINS,
  FEATURE_KEY.GET_ADDABLE_ADMINS,
  FEATURE_KEY.GET_USER_ADMIN_GROUPS,
];

// Features a group-admin builder gets regardless of which group is requested
const BUILDER_LIST_FEATURES = [
  FEATURE_KEY.GET_ALL,
  FEATURE_KEY.GET_ADDABLE_APPS,
  FEATURE_KEY.GET_ADDABLE_DS,
  FEATURE_KEY.GET_ADDABLE_FOLDERS,
  FEATURE_KEY.GET_USER_ADMIN_GROUPS,
];

// Features a group-admin builder gets on their own administered custom group
const BUILDER_ADMIN_GROUP_FEATURES = [
  FEATURE_KEY.GET_ONE,
  FEATURE_KEY.ADD_GROUP_USER,
  FEATURE_KEY.DELETE_GROUP_USER,
  FEATURE_KEY.GET_ADDABLE_USERS,
  FEATURE_KEY.GET_ALL_GROUP_USER,
  FEATURE_KEY.GET_GROUP_ADMINS,
  FEATURE_KEY.GET_ALL_GRANULAR_PERMISSIONS,
];

// Features that builders must NEVER get (admin-escalation guard)
const BUILDER_BLOCKED_FEATURES = [
  FEATURE_KEY.CREATE,
  FEATURE_KEY.UPDATE,
  FEATURE_KEY.DELETE,
  FEATURE_KEY.DUPLICATE,
  FEATURE_KEY.ASSIGN_GROUP_ADMIN,
  FEATURE_KEY.REVOKE_GROUP_ADMIN,
  FEATURE_KEY.GET_ADDABLE_ADMINS,
  FEATURE_KEY.USER_ROLE_CHANGE,
  FEATURE_KEY.CREATE_GRANULAR_APP_PERMISSIONS,
  FEATURE_KEY.CREATE_GRANULAR_DATA_PERMISSIONS,
  FEATURE_KEY.CREATE_GRANULAR_FOLDER_PERMISSIONS,
  FEATURE_KEY.UPDATE_GRANULAR_APP_PERMISSIONS,
  FEATURE_KEY.UPDATE_GRANULAR_DATA_PERMISSIONS,
  FEATURE_KEY.UPDATE_GRANULAR_FOLDER_PERMISSIONS,
  FEATURE_KEY.DELETE_GRANULAR_APP_PERMISSIONS,
  FEATURE_KEY.DELETE_GRANULAR_DATA_PERMISSIONS,
  FEATURE_KEY.DELETE_GRANULAR_FOLDER_PERMISSIONS,
];

describe('FeatureAbilityFactory :: group permissions', () => {
  const factory = new FeatureAbilityFactory({} as AbilityService);

  async function build(perms: Partial<typeof basePerms>, request?: any) {
    const { can, build: buildAbility } = makeBuilder();
    await (factory as any).defineAbilityFor(can, { ...basePerms, ...perms }, undefined, request);
    return buildAbility();
  }

  const basePerms = {
    superAdmin: false,
    isAdmin: false,
    isBuilder: false,
    isEndUser: false,
    user: { id: 'user-1', organizationId: 'org-1' },
    userPermission: {} as any,
    resource: [],
  };

  // ---------------------------------------------------------------------------
  // End-users
  // ---------------------------------------------------------------------------

  describe('end-user', () => {
    it('gets no group-permissions features whatsoever', async () => {
      const ability = await build({ isEndUser: true });
      for (const feature of ALL_ADMIN_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(false);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Admin
  // ---------------------------------------------------------------------------

  describe('admin', () => {
    it('gets all features', async () => {
      const ability = await build({ isAdmin: true });
      for (const feature of ALL_ADMIN_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // SuperAdmin
  // ---------------------------------------------------------------------------

  describe('superAdmin', () => {
    it('gets all features', async () => {
      const ability = await build({ superAdmin: true });
      for (const feature of ALL_ADMIN_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(true);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Builder with NO group-admin assignments
  // ---------------------------------------------------------------------------

  describe('builder — no group-admin assignments', () => {
    it('gets no features when tj_admin_groups is missing', async () => {
      const ability = await build({ isBuilder: true }, { params: {} });
      for (const feature of ALL_ADMIN_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(false);
      }
    });

    it('gets no features when tj_admin_groups is empty array', async () => {
      const ability = await build({ isBuilder: true }, { tj_admin_groups: [], params: {} });
      for (const feature of ALL_ADMIN_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(false);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Builder-admin — list-level access (no specific group requested)
  // ---------------------------------------------------------------------------

  describe('builder-admin — no group context (list-level)', () => {
    const request = {
      tj_admin_groups: [{ id: 'group-1', name: 'ops' }],
      params: {},
    };

    it('grants list-level features', async () => {
      const ability = await build({ isBuilder: true }, request);
      for (const feature of BUILDER_LIST_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(true);
      }
    });

    it('does not grant any group-specific or write features', async () => {
      const ability = await build({ isBuilder: true }, request);
      for (const feature of BUILDER_BLOCKED_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(false);
      }
      expect(ability.can(FEATURE_KEY.GET_ONE, GroupPermissions)).toBe(false);
      expect(ability.can(FEATURE_KEY.ADD_GROUP_USER, GroupPermissions)).toBe(false);
      expect(ability.can(FEATURE_KEY.DELETE_GROUP_USER, GroupPermissions)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Builder-admin — administered custom group
  // ---------------------------------------------------------------------------

  describe('builder-admin — their own administered custom group', () => {
    const request = {
      tj_admin_groups: [{ id: 'group-1', name: 'ops' }],
      tj_group: { id: 'group-1', type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP },
      tj_resource_id: 'group-1',
      params: {},
    };

    it('grants user-management features on the administered group', async () => {
      const ability = await build({ isBuilder: true }, request);
      for (const feature of BUILDER_ADMIN_GROUP_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(true);
      }
    });

    it('also retains list-level features', async () => {
      const ability = await build({ isBuilder: true }, request);
      for (const feature of BUILDER_LIST_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(true);
      }
    });

    it('never grants write/destructive or admin-escalation features', async () => {
      const ability = await build({ isBuilder: true }, request);
      for (const feature of BUILDER_BLOCKED_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(false);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Builder-admin — custom group they do NOT administer
  // ---------------------------------------------------------------------------

  describe('builder-admin — custom group they do not administer', () => {
    const request = {
      tj_admin_groups: [{ id: 'group-1', name: 'ops' }],
      tj_group: { id: 'group-99', type: GROUP_PERMISSIONS_TYPE.CUSTOM_GROUP },
      tj_resource_id: 'group-99',
      params: {},
    };

    it('gets only list-level features, no group-specific access', async () => {
      const ability = await build({ isBuilder: true }, request);
      for (const feature of BUILDER_LIST_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(true);
      }
      expect(ability.can(FEATURE_KEY.GET_ONE, GroupPermissions)).toBe(false);
      expect(ability.can(FEATURE_KEY.ADD_GROUP_USER, GroupPermissions)).toBe(false);
      expect(ability.can(FEATURE_KEY.DELETE_GROUP_USER, GroupPermissions)).toBe(false);
      expect(ability.can(FEATURE_KEY.GET_ALL_GROUP_USER, GroupPermissions)).toBe(false);
    });

    it('never grants write or admin-escalation features', async () => {
      const ability = await build({ isBuilder: true }, request);
      for (const feature of BUILDER_BLOCKED_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(false);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Builder-admin — default group (read-only)
  // ---------------------------------------------------------------------------

  describe('builder-admin — default group (not administered)', () => {
    const request = {
      tj_admin_groups: [{ id: 'group-1', name: 'ops' }],
      tj_group: { id: 'default-group', type: GROUP_PERMISSIONS_TYPE.DEFAULT },
      tj_resource_id: 'default-group',
      params: {},
    };

    it('can read group details and list users/granular-permissions', async () => {
      const ability = await build({ isBuilder: true }, request);
      expect(ability.can(FEATURE_KEY.GET_ONE, GroupPermissions)).toBe(true);
      expect(ability.can(FEATURE_KEY.GET_ALL_GROUP_USER, GroupPermissions)).toBe(true);
      expect(ability.can(FEATURE_KEY.GET_ALL_GRANULAR_PERMISSIONS, GroupPermissions)).toBe(true);
    });

    it('cannot mutate users on a default group', async () => {
      const ability = await build({ isBuilder: true }, request);
      expect(ability.can(FEATURE_KEY.ADD_GROUP_USER, GroupPermissions)).toBe(false);
      expect(ability.can(FEATURE_KEY.DELETE_GROUP_USER, GroupPermissions)).toBe(false);
      expect(ability.can(FEATURE_KEY.GET_ADDABLE_USERS, GroupPermissions)).toBe(false);
    });

    it('never grants write or admin-escalation features', async () => {
      const ability = await build({ isBuilder: true }, request);
      for (const feature of BUILDER_BLOCKED_FEATURES) {
        expect(ability.can(feature, GroupPermissions)).toBe(false);
      }
    });
  });
});
