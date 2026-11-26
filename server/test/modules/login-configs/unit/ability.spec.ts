/** @group platform */
import { FeatureAbilityFactory } from '@modules/login-configs/ability';
import { FEATURE_KEY } from '@modules/login-configs/constants';
import { Organization } from '@entities/organization.entity';

type Role = 'endUser' | 'builder' | 'admin' | 'superAdmin';

const PERMISSIONS: Record<Role, Record<string, boolean>> = {
  endUser: { isEndUser: true },
  builder: { isBuilder: true },
  admin: { isAdmin: true },
  superAdmin: { isSuperAdmin: true },
};

async function abilityFor(role: Role) {
  const factory = new FeatureAbilityFactory({ resourceActionsPermission: jest.fn() } as any);
  const request: any = { tj_user_permissions: PERMISSIONS[role] };
  const user = { id: 'user-1', organizationId: 'org-1' } as any;
  return factory.createAbility(user, { moduleName: 'login_configs', features: [] }, [], request);
}

describe('login-configs feature abilities', () => {
  describe('GET_INSTANCE_SSO (instance sign-in settings)', () => {
    it.each<[Role, boolean]>([
      ['endUser', false],
      ['builder', false],
      ['admin', true],
      ['superAdmin', true],
    ])('%s -> allowed: %s', async (role, allowed) => {
      const ability = await abilityFor(role);
      expect(ability.can(FEATURE_KEY.GET_INSTANCE_SSO, new Organization())).toBe(allowed);
    });
  });

  describe('GET_PUBLIC_CONFIGS (login page)', () => {
    it('stays open to every role', async () => {
      for (const role of Object.keys(PERMISSIONS) as Role[]) {
        const ability = await abilityFor(role);
        expect(ability.can(FEATURE_KEY.GET_PUBLIC_CONFIGS, new Organization())).toBe(true);
      }
    });
  });
});
