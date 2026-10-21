/** @group platform */
import { Ability, AbilityBuilder } from '@casl/ability';
import { App } from '@entities/app.entity';
import { MODULES } from '@modules/app/constants/modules';
import { FEATURE_KEY } from '@modules/versions/constants';
import { FeatureAbility } from '@modules/versions/ability';
import { defineAppVersionAbility } from '@modules/versions/ability/app-version.ability';

const APP_ID = 'app-1';

const permissions = (
  role: { superAdmin?: boolean; isAdmin?: boolean; isBuilder?: boolean; isEndUser?: boolean },
  app: Record<string, any>
) =>
  ({
    superAdmin: false,
    isAdmin: false,
    isBuilder: false,
    isEndUser: false,
    ...role,
    resource: [{ resourceType: MODULES.APP }],
    userPermission: { appPromote: false, [MODULES.APP]: app },
  }) as any;

const abilityFor = (perms: any) => {
  const { can, build } = new AbilityBuilder<FeatureAbility>(Ability);
  defineAppVersionAbility(can, perms, APP_ID);
  return build();
};

const noApps = { isAllEditable: false, isAllViewable: false, editableAppsId: [], viewableAppsId: [] };

// A coding agent snapshots a version before it edits it (through the MCP server). The right to do
// so is the right to compare: whoever can open the compare view on an app can snapshot it, nobody else.
describe('who may take a snapshot', () => {
  it.each([
    ['an admin', permissions({ isAdmin: true }, noApps), true],
    ['a super admin', permissions({ superAdmin: true }, noApps), true],
    ['a builder who can edit every app', permissions({ isBuilder: true }, { ...noApps, isAllEditable: true }), true],
    [
      'a builder who can edit this app',
      permissions({ isBuilder: true }, { ...noApps, editableAppsId: [APP_ID] }),
      true,
    ],
    [
      'a builder who can edit other apps only',
      permissions({ isBuilder: true }, { ...noApps, editableAppsId: ['app-2'] }),
      false,
    ],
    [
      'a builder who can only view this app',
      permissions({ isBuilder: true }, { ...noApps, viewableAppsId: [APP_ID] }),
      false,
    ],
    ['a builder who can view every app', permissions({ isBuilder: true }, { ...noApps, isAllViewable: true }), false],
    ['an end user', permissions({ isEndUser: true }, { ...noApps, isAllViewable: true }), false],
  ])('%s: granted exactly when COMPARE is', (_who, perms, expected) => {
    const ability = abilityFor(perms);
    expect(ability.can(FEATURE_KEY.COMPARE, App)).toBe(expected);
    expect(ability.can(FEATURE_KEY.SNAPSHOT_CREATE, App)).toBe(expected);
    expect(ability.can(FEATURE_KEY.SNAPSHOT_RENAME, App)).toBe(expected);
    expect(ability.can(FEATURE_KEY.SNAPSHOT_RESTORE, App)).toBe(expected);
  });

  it('is not granted on a module to a builder who cannot edit it', () => {
    const perms = { ...permissions({ isBuilder: false }, noApps), resource: [{ resourceType: MODULES.MODULES }] };
    const ability = abilityFor(perms);
    expect(ability.can(FEATURE_KEY.COMPARE, App)).toBe(false);
    expect(ability.can(FEATURE_KEY.SNAPSHOT_CREATE, App)).toBe(false);
    expect(ability.can(FEATURE_KEY.SNAPSHOT_RENAME, App)).toBe(false);
  });
});
