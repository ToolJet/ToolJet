/** @group platform */
import { FeatureAbilityFactory } from '@modules/organizations/ability';
import { FEATURE_KEY } from '@modules/organizations/constants';
import { Organization } from '@entities/organization.entity';
import { User } from '@entities/user.entity';
import { InstanceSettingsUtilService } from '@modules/instance-settings/util.service';
import { AbilityService } from '@modules/ability/interfaces/IService';

type Role = 'superAdmin' | 'admin' | 'builder';

const OWN_WORKSPACE = 'ws-own';
const OTHER_WORKSPACE = 'ws-other';

const buildAbility = async (
  role: Role,
  opts: { personalWorkspaceAllowed?: boolean; target?: string; body?: Record<string, unknown> } = {}
) => {
  const instanceSettings = {
    getSettings: async () => String(opts.personalWorkspaceAllowed ?? false),
  } as unknown as InstanceSettingsUtilService;
  const factory = new FeatureAbilityFactory(instanceSettings, {} as AbilityService);

  const user = { id: 'u1', organizationId: OWN_WORKSPACE } as User;
  const request = {
    // Pre-computed permissions skip the DB lookup in AbilityFactory.createAbility.
    tj_user_permissions: {
      isSuperAdmin: role === 'superAdmin',
      isAdmin: role !== 'builder',
      isBuilder: role === 'builder',
    },
    tj_workspace: opts.target ? { id: opts.target } : undefined,
    body: opts.body ?? {},
  };
  return factory.createAbility(user, { moduleName: 'organizations', features: [] }, [], request);
};

describe('Organizations ability | dashboard and External API v2 rules in one place', () => {
  describe('Shared predicates', () => {
    it('should let a super admin archive, unarchive and set the default on both surfaces', async () => {
      const ability = await buildAbility('superAdmin');
      for (const key of [
        FEATURE_KEY.WORKSPACE_ARCHIVE,
        FEATURE_KEY.ARCHIVE_WORKSPACE_V2,
        FEATURE_KEY.WORKSPACE_UNARCHIVE,
        FEATURE_KEY.UNARCHIVE_WORKSPACE_V2,
        FEATURE_KEY.SET_DEFAULT,
        FEATURE_KEY.SET_DEFAULT_WORKSPACE_V2,
      ]) {
        expect(ability.can(key, Organization)).toBe(true);
      }
    });

    it('should keep archive and set-default away from a workspace admin on both surfaces', async () => {
      const ability = await buildAbility('admin', { target: OWN_WORKSPACE });
      expect(ability.can(FEATURE_KEY.WORKSPACE_ARCHIVE, Organization)).toBe(false);
      expect(ability.can(FEATURE_KEY.ARCHIVE_WORKSPACE_V2, Organization)).toBe(false);
      expect(ability.can(FEATURE_KEY.SET_DEFAULT_WORKSPACE_V2, Organization)).toBe(false);
    });

    it('should tie workspace creation to the personal-workspace setting on both surfaces', async () => {
      const allowed = await buildAbility('builder', { personalWorkspaceAllowed: true });
      expect(allowed.can(FEATURE_KEY.CREATE, Organization)).toBe(true);
      expect(allowed.can(FEATURE_KEY.CREATE_WORKSPACE_V2, Organization)).toBe(true);

      const blocked = await buildAbility('builder', { personalWorkspaceAllowed: false });
      expect(blocked.can(FEATURE_KEY.CREATE, Organization)).toBe(false);
      expect(blocked.can(FEATURE_KEY.CREATE_WORKSPACE_V2, Organization)).toBe(false);
    });
  });

  describe('UPDATE_WORKSPACE_V2 | target comes from the URL', () => {
    it('should let an admin rename their own workspace', async () => {
      const ability = await buildAbility('admin', { target: OWN_WORKSPACE, body: { name: 'New name' } });
      expect(ability.can(FEATURE_KEY.UPDATE_WORKSPACE_V2, Organization)).toBe(true);
    });

    it('should not let an admin edit another workspace', async () => {
      const ability = await buildAbility('admin', { target: OTHER_WORKSPACE, body: { name: 'New name' } });
      expect(ability.can(FEATURE_KEY.UPDATE_WORKSPACE_V2, Organization)).toBe(false);
    });

    it('should not let an admin change status or default', async () => {
      for (const body of [{ status: 'archived' }, { default: true }]) {
        const ability = await buildAbility('admin', { target: OWN_WORKSPACE, body });
        expect(ability.can(FEATURE_KEY.UPDATE_WORKSPACE_V2, Organization)).toBe(false);
      }
    });

    it('should let a super admin change any workspace, including status', async () => {
      const ability = await buildAbility('superAdmin', { target: OTHER_WORKSPACE, body: { status: 'archived' } });
      expect(ability.can(FEATURE_KEY.UPDATE_WORKSPACE_V2, Organization)).toBe(true);
    });

    it('should not let a builder update a workspace', async () => {
      const ability = await buildAbility('builder', { target: OWN_WORKSPACE, body: { name: 'New name' } });
      expect(ability.can(FEATURE_KEY.UPDATE_WORKSPACE_V2, Organization)).toBe(false);
    });
  });
});
