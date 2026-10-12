import 'reflect-metadata';
import { authorizeWorkflowExecution, resolveWorkflowExecutionApp } from '@ee/workflows/guards/authorize-execution';
import { APP_RESOURCE_ACTIONS } from 'src/constants/global.constant';
jest.mock('@ee/workflows/services/workflow-schedules.service', () => ({ WorkflowSchedulesService: class {} }));
import { FeatureAbilityFactory } from '@ee/workflows/ability/app';
import { FEATURE_KEY } from '@modules/workflows/constants';
import { MODULES } from '@modules/app/constants/modules';

describe('Shared authenticated workflow authorization', () => {
  const app = { id: 'synthetic-workflow', organizationId: 'orchard', type: 'workflow' };
  test.each([{ oauthGrantId: 'synthetic-grant' }, { isPATLogin: true }, {}])('uses actual workflow permission for credential %j', async (kind) => {
    const user = { id: 'synthetic-user', organizationId: 'orchard', ...kind };
    const ability = { can: jest.fn().mockReturnValue(true) };
    const factory = { appsActions: jest.fn().mockResolvedValue(ability) };
    await authorizeWorkflowExecution(user, app, factory);
    expect(factory.appsActions).toHaveBeenCalledWith(user, app.id);
    expect(ability.can).toHaveBeenCalledWith(APP_RESOURCE_ACTIONS.VIEW, app);
    await expect(authorizeWorkflowExecution(user, { ...app, organizationId: 'other' }, factory)).rejects.toThrow();
    ability.can.mockReturnValue(false);
    await expect(authorizeWorkflowExecution(user, app, factory)).rejects.toThrow();
  });
  test('mixed app and version selectors authorize the actual service-selected workflow', async () => {
    const victim = { ...app, id: 'another-workflow', organizationId: 'other' };
    const apps = { findOne: jest.fn().mockResolvedValue(app) };
    const versions = { findOne: jest.fn().mockResolvedValue({ app: victim }) };
    const selected = await resolveWorkflowExecutionApp({ executeUsing: 'app', appId: app.id, appVersionId: 'victim-version' }, apps, versions);
    expect(selected).toBe(victim);
    expect(apps.findOne).not.toHaveBeenCalled();
    await expect(authorizeWorkflowExecution({ organizationId: app.organizationId }, selected, {})).rejects.toThrow();
    versions.findOne.mockResolvedValue(null);
    await expect(resolveWorkflowExecutionApp({ appId: app.id, appVersionId: 'missing-version' }, apps, versions)).rejects.toThrow();
    expect(apps.findOne).not.toHaveBeenCalled();
  });
  test('missing selectors fail closed instead of selecting an arbitrary workflow', async () => {
    const apps = { findOne: jest.fn() }; const versions = { findOne: jest.fn() };
    await expect(resolveWorkflowExecutionApp({}, apps, versions)).rejects.toThrow();
    await expect(resolveWorkflowExecutionApp({ appId: app.id, appVersionId: '' }, apps, versions)).rejects.toThrow();
    expect(apps.findOne).not.toHaveBeenCalled();
  });
  test('keeps the intentional anonymous execution route policy', async () => {
    const factory = { appsActions: jest.fn() };
    await authorizeWorkflowExecution(undefined, app, factory);
    expect(factory.appsActions).not.toHaveBeenCalled();
  });
  test('webhook changes require same-workspace workflow edit permission', async () => {
    const factory: any = Object.create(FeatureAbilityFactory.prototype);
    factory.appsRepository = { findOne: jest.fn().mockResolvedValue(app) };
    const userPermission = { [MODULES.WORKFLOWS]: { editableWorkflowsId: [], executableWorkflowsId: [app.id] } };
    const perms = { userPermission, superAdmin: false };
    const metadata = { features: [FEATURE_KEY.UPDATE_WORKFLOW_WEBHOOK_DETAILS] };
    const request = { user: { organizationId: 'orchard' }, params: { id: app.id } };
    const can = jest.fn();
    await factory.defineAbilityFor(can, perms, metadata, request);
    expect(can.mock.calls.flat(2)).not.toContain(FEATURE_KEY.UPDATE_WORKFLOW_WEBHOOK_DETAILS);
    userPermission[MODULES.WORKFLOWS].editableWorkflowsId = [app.id];
    await factory.defineAbilityFor(can, perms, metadata, request);
    expect(can.mock.calls.flat(2)).toContain(FEATURE_KEY.UPDATE_WORKFLOW_WEBHOOK_DETAILS);
    factory.appsRepository.findOne.mockResolvedValue({ ...app, organizationId: 'other' });
    await expect(factory.defineAbilityFor(can, perms, metadata, request)).rejects.toThrow();
  });
});
