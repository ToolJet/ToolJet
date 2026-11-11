/// <reference types="jest" />
import { FeatureAbility } from '@modules/versions/ability/index';
import { defineWorkflowVersionAbility } from '@modules/versions/ability/workflow-version.ability';
import { FEATURE_KEY } from '@modules/versions/constants';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { buildPermissions, makeAbilityBuilder, expectFeatures } from 'test-helper';

const makeBuilder = () => makeAbilityBuilder<FeatureAbility>();

const EDIT_ACTIONS = [
  FEATURE_KEY.GET,
  FEATURE_KEY.DELETE,
  FEATURE_KEY.CREATE,
  FEATURE_KEY.GET_ONE,
  FEATURE_KEY.UPDATE,
  FEATURE_KEY.UPDATE_SETTINGS,
  FEATURE_KEY.PROMOTE,
  FEATURE_KEY.APP_VERSION_CREATE,
  FEATURE_KEY.APP_VERSION_DELETE,
  FEATURE_KEY.APP_VERSION_UPDATE,
  FEATURE_KEY.APP_DRAFT_VERSION_CREATE,
];

const buildWorkflowPermissions = (overrides: {
  superAdmin?: boolean;
  isAdmin?: boolean;
  isAllEditable?: boolean;
  isAllExecutable?: boolean;
  editableWorkflowsId?: string[];
  executableWorkflowsId?: string[];
}) =>
  buildPermissions({
    superAdmin: overrides.superAdmin,
    isAdmin: overrides.isAdmin,
    resource: [{ resourceType: MODULES.WORKFLOWS }],
    userPermission: {
      [MODULES.WORKFLOWS]: {
        isAllEditable: overrides.isAllEditable ?? false,
        isAllExecutable: overrides.isAllExecutable ?? false,
        editableWorkflowsId: overrides.editableWorkflowsId ?? [],
        executableWorkflowsId: overrides.executableWorkflowsId ?? [],
      },
    } as any,
  });

/** @group workflows */
describe('defineWorkflowVersionAbility', () => {
  describe('admin / superAdmin bypass', () => {
    it('grants every edit action to isAdmin with no granular permissions', () => {
      const perms = buildWorkflowPermissions({ isAdmin: true });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('grants every edit action to superAdmin with no granular permissions', () => {
      const perms = buildWorkflowPermissions({ superAdmin: true });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('does NOT grant GET_EVENTS to isAdmin without isAllExecutable — the admin branch returns before the execute check runs', () => {
      // Documents current behavior: admin's early `return` skips the isAllExecutable/executableWorkflowsId
      // check entirely, so GET_EVENTS is only reachable through the non-admin branch below. Worth a
      // second look — an admin who can't see workflow run events looks like an unintended gap.
      const perms = buildWorkflowPermissions({ isAdmin: true });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.GET_EVENTS, App)).toBe(false);
    });
  });

  describe('no permissions', () => {
    it('denies every edit action and GET_EVENTS with no admin bypass and no granular grants', () => {
      const perms = buildWorkflowPermissions({});
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, { denied: [...EDIT_ACTIONS, FEATURE_KEY.GET_EVENTS] });
    });
  });

  describe('editable grants', () => {
    it('grants all edit actions when isAllEditable is true', () => {
      const perms = buildWorkflowPermissions({ isAllEditable: true });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS, denied: [FEATURE_KEY.GET_EVENTS] });
    });

    it('grants all edit actions when the resourceId is in editableWorkflowsId', () => {
      const resourceId = 'workflow-1';
      const perms = buildWorkflowPermissions({ editableWorkflowsId: [resourceId] });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms, resourceId);
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('denies edit actions when the resourceId is not in editableWorkflowsId', () => {
      const perms = buildWorkflowPermissions({ editableWorkflowsId: ['other-workflow'] });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms, 'workflow-1');
      const ability = build();

      expectFeatures(ability, App, { denied: EDIT_ACTIONS });
    });

    it('denies edit actions when editableWorkflowsId is set but resourceId is undefined', () => {
      const perms = buildWorkflowPermissions({ editableWorkflowsId: ['workflow-1'] });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms, undefined);
      const ability = build();

      expectFeatures(ability, App, { denied: EDIT_ACTIONS });
    });

    it('editable access alone does not grant GET_EVENTS', () => {
      const perms = buildWorkflowPermissions({ isAllEditable: true });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.GET_EVENTS, App)).toBe(false);
    });
  });

  describe('executable grants', () => {
    it('grants GET_EVENTS when isAllExecutable is true', () => {
      const perms = buildWorkflowPermissions({ isAllExecutable: true });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.GET_EVENTS, App)).toBe(true);
    });

    it('grants GET_EVENTS when the resourceId is in executableWorkflowsId', () => {
      const resourceId = 'workflow-2';
      const perms = buildWorkflowPermissions({ executableWorkflowsId: [resourceId] });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms, resourceId);
      const ability = build();

      expect(ability.can(FEATURE_KEY.GET_EVENTS, App)).toBe(true);
    });

    it('denies GET_EVENTS when the resourceId is not in executableWorkflowsId', () => {
      const perms = buildWorkflowPermissions({ executableWorkflowsId: ['other-workflow'] });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms, 'workflow-2');
      const ability = build();

      expect(ability.can(FEATURE_KEY.GET_EVENTS, App)).toBe(false);
    });

    it('execute-only access does not grant edit actions', () => {
      const perms = buildWorkflowPermissions({ isAllExecutable: true });
      const { can, build } = makeBuilder();
      defineWorkflowVersionAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, { denied: EDIT_ACTIONS });
    });
  });
});
