/// <reference types="jest" />
import { defineWorkflowAbility } from '@modules/apps/ability/workflow.ability';
import { FeatureAbility } from '@modules/apps/ability/index';
import { FEATURE_KEY } from '@modules/apps/constants';
import { MODULES } from '@modules/app/constants/modules';
import { App } from '@entities/app.entity';
import { buildPermissions, makeAbilityBuilder, expectFeatures } from 'test-helper';

const makeBuilder = () => makeAbilityBuilder<FeatureAbility>();

const EDIT_ACTIONS = [
  FEATURE_KEY.UPDATE,
  FEATURE_KEY.GET_ONE,
  FEATURE_KEY.GET_BY_SLUG,
  FEATURE_KEY.RELEASE,
  FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
  FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS,
  FEATURE_KEY.UPDATE_ICON,
];
const EXECUTE_ONLY_ACTIONS = [FEATURE_KEY.GET_ONE, FEATURE_KEY.GET_BY_SLUG, FEATURE_KEY.VALIDATE_RELEASED_APP_ACCESS];

const buildWorkflowPermissions = (overrides: {
  superAdmin?: boolean;
  isAdmin?: boolean;
  workflowCreate?: boolean;
  workflowDelete?: boolean;
  isAllEditable?: boolean;
  isAllExecutable?: boolean;
  editableWorkflowsId?: string[];
  executableWorkflowsId?: string[];
}) =>
  buildPermissions({
    superAdmin: overrides.superAdmin,
    isAdmin: overrides.isAdmin,
    userPermission: {
      workflowCreate: overrides.workflowCreate ?? false,
      workflowDelete: overrides.workflowDelete ?? false,
      [MODULES.WORKFLOWS]: {
        isAllEditable: overrides.isAllEditable ?? false,
        isAllExecutable: overrides.isAllExecutable ?? false,
        editableWorkflowsId: overrides.editableWorkflowsId ?? [],
        executableWorkflowsId: overrides.executableWorkflowsId ?? [],
      },
    } as any,
  });

/** @group platform */
describe('defineWorkflowAbility', () => {
  it('always grants GET (workflow listing) even with zero permissions', () => {
    const perms = buildWorkflowPermissions({});
    const { can, build } = makeBuilder();
    defineWorkflowAbility(can, perms);
    const ability = build();

    expect(ability.can(FEATURE_KEY.GET, App)).toBe(true);
    expectFeatures(ability, App, { denied: [...EDIT_ACTIONS, FEATURE_KEY.CREATE, FEATURE_KEY.DELETE] });
  });

  describe('admin / superAdmin bypass', () => {
    it('grants full CRUD + management actions to isAdmin', () => {
      const perms = buildWorkflowPermissions({ isAdmin: true });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, {
        allowed: [FEATURE_KEY.GET, FEATURE_KEY.CREATE, FEATURE_KEY.DELETE, ...EDIT_ACTIONS],
      });
    });

    it('grants full CRUD + management actions to superAdmin', () => {
      const perms = buildWorkflowPermissions({ superAdmin: true });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, {
        allowed: [FEATURE_KEY.GET, FEATURE_KEY.CREATE, FEATURE_KEY.DELETE, ...EDIT_ACTIONS],
      });
    });
  });

  describe('workflowCreate', () => {
    it('grants CREATE alone, without granting edit or delete access', () => {
      const perms = buildWorkflowPermissions({ workflowCreate: true });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.CREATE, App)).toBe(true);
      expectFeatures(ability, App, { denied: [...EDIT_ACTIONS, FEATURE_KEY.DELETE] });
    });
  });

  describe('editable grants (isAllEditable / editableWorkflowsId)', () => {
    it('grants the edit bucket when isAllEditable is true, but not DELETE without workflowDelete', () => {
      const perms = buildWorkflowPermissions({ isAllEditable: true });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS, denied: [FEATURE_KEY.DELETE] });
    });

    it('grants DELETE in addition to the edit bucket when workflowDelete is also true', () => {
      const perms = buildWorkflowPermissions({ isAllEditable: true, workflowDelete: true });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, { allowed: [...EDIT_ACTIONS, FEATURE_KEY.DELETE] });
    });

    it('grants the edit bucket when the workflowId is in editableWorkflowsId', () => {
      const workflowId = 'workflow-1';
      const perms = buildWorkflowPermissions({ editableWorkflowsId: [workflowId] });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms, workflowId);
      const ability = build();

      expectFeatures(ability, App, { allowed: EDIT_ACTIONS });
    });

    it('denies the edit bucket when the workflowId is not in editableWorkflowsId', () => {
      const perms = buildWorkflowPermissions({ editableWorkflowsId: ['other-workflow'] });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms, 'workflow-1');
      const ability = build();

      expectFeatures(ability, App, { denied: EDIT_ACTIONS });
    });

    it('workflowDelete alone (no edit access) does not grant DELETE', () => {
      const perms = buildWorkflowPermissions({ workflowDelete: true });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.DELETE, App)).toBe(false);
    });
  });

  describe('executable grants (isAllExecutable / executableWorkflowsId)', () => {
    it('grants the execute-only bucket when isAllExecutable is true, without edit-only actions', () => {
      const perms = buildWorkflowPermissions({ isAllExecutable: true });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms);
      const ability = build();

      expectFeatures(ability, App, {
        allowed: EXECUTE_ONLY_ACTIONS,
        denied: [
          FEATURE_KEY.UPDATE,
          FEATURE_KEY.RELEASE,
          FEATURE_KEY.VALIDATE_PRIVATE_APP_ACCESS,
          FEATURE_KEY.UPDATE_ICON,
        ],
      });
    });

    it('grants the execute-only bucket when the workflowId is in executableWorkflowsId', () => {
      const workflowId = 'workflow-2';
      const perms = buildWorkflowPermissions({ executableWorkflowsId: [workflowId] });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms, workflowId);
      const ability = build();

      expectFeatures(ability, App, { allowed: EXECUTE_ONLY_ACTIONS });
    });

    it('denies the execute-only bucket when the workflowId is not in executableWorkflowsId', () => {
      const perms = buildWorkflowPermissions({ executableWorkflowsId: ['other-workflow'] });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms, 'workflow-2');
      const ability = build();

      expectFeatures(ability, App, { denied: EXECUTE_ONLY_ACTIONS });
    });

    it('combines with workflowCreate: CREATE + execute-only actions together, still no UPDATE', () => {
      const perms = buildWorkflowPermissions({ workflowCreate: true, isAllExecutable: true });
      const { can, build } = makeBuilder();
      defineWorkflowAbility(can, perms);
      const ability = build();

      expect(ability.can(FEATURE_KEY.CREATE, App)).toBe(true);
      expectFeatures(ability, App, { allowed: EXECUTE_ONLY_ACTIONS, denied: [FEATURE_KEY.UPDATE] });
    });
  });
});
