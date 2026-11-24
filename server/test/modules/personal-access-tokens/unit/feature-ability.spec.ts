import { AbilityBuilder, Ability } from '@casl/ability';
import { FeatureAbilityFactory } from '@modules/personal-access-tokens/ability';
import { FEATURE_KEY } from '@modules/personal-access-tokens/constants';
import { UserPersonalAccessToken } from '@entities/user_personal_access_tokens.entity';

/*
  Every token feature must be reachable by someone: a feature missing here is refused for everyone by the guard. A
  merge of main's patCreate gate once dropped the device-login steps, and `tooljet auth login` stopped working.
*/
const abilityFor = (perms: { isAdmin?: boolean; superAdmin?: boolean; patCreate?: boolean }) => {
  const { can, build } = new AbilityBuilder<Ability<[FEATURE_KEY, any]>>(Ability as any);
  const factory = Object.create(FeatureAbilityFactory.prototype) as any;
  factory.defineAbilityFor(can, {
    isAdmin: !!perms.isAdmin,
    superAdmin: !!perms.superAdmin,
    userPermission: { patCreate: !!perms.patCreate },
  });
  return build();
};

describe('personal access token feature permissions', () => {
  it('lets a builder with patCreate use every feature, device login and AI render session included', () => {
    const ability = abilityFor({ patCreate: true });
    for (const key of Object.values(FEATURE_KEY)) {
      expect([key, ability.can(key, UserPersonalAccessToken)]).toEqual([key, true]);
    }
  });

  it('lets an admin approve a device login without patCreate', () => {
    expect(abilityFor({ isAdmin: true }).can(FEATURE_KEY.APPROVE_DEVICE_LOGIN, UserPersonalAccessToken)).toBe(true);
  });

  it('keeps minting gated: without patCreate no token and no device-login approval, the rest stays open', () => {
    const ability = abilityFor({});
    expect(ability.can(FEATURE_KEY.CREATE_PAT, UserPersonalAccessToken)).toBe(false);
    expect(ability.can(FEATURE_KEY.APPROVE_DEVICE_LOGIN, UserPersonalAccessToken)).toBe(false);
    for (const key of [
      FEATURE_KEY.START_DEVICE_LOGIN,
      FEATURE_KEY.POLL_DEVICE_LOGIN,
      FEATURE_KEY.LOOKUP_DEVICE_LOGIN,
      FEATURE_KEY.LIST_PATS,
      FEATURE_KEY.CREATE_AI_RENDER_SESSION,
    ]) {
      expect([key, ability.can(key, UserPersonalAccessToken)]).toEqual([key, true]);
    }
  });
});
