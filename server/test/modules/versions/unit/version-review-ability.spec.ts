import { Ability, AbilityBuilder } from '@casl/ability';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '@modules/versions/constants';
import { FeatureAbility } from '@modules/versions/ability';
import { defineAppVersionAbility } from '@modules/versions/ability/app-version.ability';

const APP_ID = 'app-1';

// A builder in the default group: may promote anywhere, edits only the apps listed.
const builder = (editable: string[], resourceType = MODULES.APP) =>
  ({
    superAdmin: false,
    isAdmin: false,
    isBuilder: true,
    resource: [{ resourceType }],
    userPermission: {
      appPromote: true,
      [MODULES.APP]: { isAllEditable: false, isAllViewable: false, editableAppsId: editable, viewableAppsId: [] },
    },
  }) as any;

const abilityFor = (perms: any) => {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability);
  defineAppVersionAbility(can, perms, APP_ID);
  return build();
};

describe('who may approve a review', () => {
  it('is not every builder: approving needs edit access to that app', () => {
    expect(abilityFor(builder([])).can(FEATURE_KEY.REVIEW_APPROVE, App)).toBe(false);
    expect(abilityFor(builder([APP_ID])).can(FEATURE_KEY.REVIEW_APPROVE, App)).toBe(true);
  });

  it('never lets a builder release without a review, not even on a module', () => {
    expect(abilityFor(builder([APP_ID])).can(FEATURE_KEY.REVIEW_OVERRIDE, App)).toBe(false);
    expect(abilityFor(builder([APP_ID], MODULES.MODULES)).can(FEATURE_KEY.REVIEW_OVERRIDE, App)).toBe(false);
    expect(abilityFor(builder([APP_ID], MODULES.MODULES)).can(FEATURE_KEY.REVIEW_APPROVE, App)).toBe(false);
  });

  it('lets admins approve and override', () => {
    const admin = { ...builder([]), isAdmin: true };
    expect(abilityFor(admin).can(FEATURE_KEY.REVIEW_APPROVE, App)).toBe(true);
    expect(abilityFor(admin).can(FEATURE_KEY.REVIEW_OVERRIDE, App)).toBe(true);
  });
});
