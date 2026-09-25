import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { User } from '@entities/user.entity';
import { Organization } from '@entities/organization.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { AppsGroupPermissions } from '@entities/apps_group_permissions.entity';
import { GroupApps } from '@entities/group_apps.entity';
import { ResourceType } from '@modules/group-permissions/constants';
import { APP_TYPES } from '@modules/apps/constants';
import {
  initTestApp,
  closeTestApp,
  createAdmin,
  createEndUser,
  createApplication,
  createApplicationVersion,
  createUserGroupPermissions,
  findEntityOrFail,
  saveEntity,
  uniqueEmail,
} from 'test-helper';

/**
 * app-git authorizes a resource against the permission bucket that matches the resource's
 * app type. A WORKFLOW must resolve through the user's WORKFLOWS granular permissions, not
 * their front-end APP permissions.
 *
 * Both halves of the mapping live in `app-git/ability/resource-type.ts`
 * (`resourceTypeForAppType`): the guard (`ability/guard.ts`) uses it to decide which bucket
 * gets POPULATED, and the ability factory (`ability/index.ts`) uses it to decide which gets
 * READ. Before that helper existed both files did `type === MODULE ? MODULES.MODULES :
 * MODULES.APP`, so a workflow was authorized against front-end app permissions — wrong in
 * both directions at once:
 *
 *   A. under-permissive — a user granted Edit on workflows but not on apps was denied.
 *   B. over-permissive  — a user granted Edit on ALL apps but nothing on workflows was
 *                         allowed. That is a privilege escalation, not just a UX bug.
 *
 * The route exercised is GET /api/app-git/:organizationId/app/:versionId
 * (FEATURE_KEY.GIT_GET_APP_CONFIG), the cheapest app-git route behind
 * AppResourceGuard + FeatureAbilityGuard. This is an AUTHORIZATION test: the handler may
 * well fail afterwards for unrelated git reasons, so every assertion is 403 vs. not-403
 * rather than a success status.
 *
 * The test users must be NON-admin — `defineAbilityFor` short-circuits to full access for
 * admin/superAdmin before any bucket logic runs, and the default BUILDER role carries both
 * appCreate and workflowCreate, so neither can discriminate. Hence end-users placed in
 * custom groups carrying exactly one granular grant. The resources are owned by a separate
 * admin because both `createUserAppsPermissions` and `createUserWorkflowPermissions` add
 * every resource the caller created to their own editable set, which would mask the bug.
 *
 * @group gitsync
 */
describe('app-git authorization — workflows use the WORKFLOWS permission bucket', () => {
  let nestApp: INestApplication;

  let workspace: Organization;
  let organizationId: string;
  let workflowVersionId: string;
  let workflowAppId: string;
  let frontEndVersionId: string;

  /** Custom group holding a single granular grant, with `user` as its only member. */
  async function customGroupFor(user: User & { organizationId: string }, name: string): Promise<GroupPermissions> {
    await createUserGroupPermissions(nestApp, user, [name]);
    return findEntityOrFail(GroupPermissions, { organizationId: user.organizationId, name });
  }

  /** GranularPermissions(isAll) -> AppsGroupPermissions(canEdit) for one resource type. */
  async function grantEditOnAll(groupId: string, type: ResourceType, appType: APP_TYPES): Promise<void> {
    const granular = await saveEntity(GranularPermissions, {
      groupId,
      name: `${type}-all`,
      type,
      isAll: true,
    });
    await saveEntity(AppsGroupPermissions, {
      granularPermissionId: granular.id,
      appType,
      canEdit: true,
      canView: true,
      hideFromDashboard: false,
    });
  }

  /**
   * GranularPermissions(isAll: false) -> AppsGroupPermissions(canEdit) -> GroupApps(appId).
   *
   * The allowlist counterpart of grantEditOnAll: grants Edit on ONE named resource instead of
   * the whole type. `isAll: false` is what makes it interesting — it leaves `isAllEditable`
   * false, so `defineAbilityFor` has to fall through to the per-resource id list, which is the
   * half of the mapping `resourceTypeForAppType` also drives (editableWorkflowsId for a
   * workflow, editableAppsId otherwise).
   */
  async function grantEditOnOne(groupId: string, type: ResourceType, appType: APP_TYPES, appId: string): Promise<void> {
    const granular = await saveEntity(GranularPermissions, {
      groupId,
      name: `${type}-one-${appId.slice(0, 8)}`,
      type,
      isAll: false,
    });
    const appsGroupPermission = await saveEntity(AppsGroupPermissions, {
      granularPermissionId: granular.id,
      appType,
      canEdit: true,
      canView: true,
      hideFromDashboard: false,
    });
    await saveEntity(GroupApps, {
      appId,
      appsGroupPermissionsId: (appsGroupPermission as { id: string }).id,
    });
  }

  const getAppConfig = (versionId: string, cookie: string[]) =>
    request(nestApp.getHttpServer())
      .get(`/api/app-git/${organizationId}/app/${versionId}`)
      .set('tj-workspace-id', organizationId)
      .set('Cookie', cookie);

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));

    // Owner is an admin so neither test user inherits creator-edit on these resources.
    const owner = await createAdmin(nestApp, uniqueEmail('appgit-perm-owner'));
    workspace = owner.workspace;
    organizationId = workspace.id;
    const ownerUser = { ...owner.user, organizationId } as User & { organizationId: string };

    const workflow = await createApplication(nestApp, {
      name: 'perm-bucket-workflow',
      user: ownerUser,
      type: APP_TYPES.WORKFLOW,
    });
    workflowAppId = (workflow as { id: string }).id;
    workflowVersionId = (await createApplicationVersion(nestApp, workflow as never, { name: 'wfv' })).id;

    const frontEndApp = await createApplication(nestApp, {
      name: 'perm-bucket-app',
      user: ownerUser,
      type: APP_TYPES.FRONT_END,
    });
    frontEndVersionId = (await createApplicationVersion(nestApp, frontEndApp as never, { name: 'appv' })).id;
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('A: workflow-edit permission (and no app-edit) is enough for an app-git route on a workflow', async () => {
    const user = await createEndUser(nestApp, uniqueEmail('appgit-perm-wf-editor'), { workspace });
    const group = await customGroupFor(user.user, 'perm-bucket-workflow-editors');
    await grantEditOnAll(group.id, ResourceType.WORKFLOWS, APP_TYPES.WORKFLOW);

    // The bug: read against the APP bucket, this user has no app edit -> 403.
    const onWorkflow = await getAppConfig(workflowVersionId, user.cookie);
    expect(onWorkflow.status).not.toBe(403);

    // Control — the grant is workflow-scoped and must not leak to front-end apps. Without
    // this, "not 403" above could just mean the route stopped checking permissions.
    const onFrontEndApp = await getAppConfig(frontEndVersionId, user.cookie);
    expect(onFrontEndApp.status).toBe(403);
  });

  it('B: app-edit permission alone does NOT authorize an app-git route on a workflow', async () => {
    const user = await createEndUser(nestApp, uniqueEmail('appgit-perm-app-editor'), { workspace });
    const group = await customGroupFor(user.user, 'perm-bucket-app-editors');
    await grantEditOnAll(group.id, ResourceType.APP, APP_TYPES.FRONT_END);

    // Control first — proves the APP grant really took effect, so the 403 below is the
    // bucket mapping refusing the workflow and not a group that was never applied.
    const onFrontEndApp = await getAppConfig(frontEndVersionId, user.cookie);
    expect(onFrontEndApp.status).not.toBe(403);

    // The escalation: app edit must buy nothing on a workflow.
    const onWorkflow = await getAppConfig(workflowVersionId, user.cookie);
    expect(onWorkflow.status).toBe(403);
  });

  it('C: per-resource workflow grant is read from the workflow allowlist, not the app one', async () => {
    const user = await createEndUser(nestApp, uniqueEmail('appgit-perm-wf-one'), { workspace });
    const group = await customGroupFor(user.user, 'perm-bucket-workflow-one');
    await grantEditOnOne(group.id, ResourceType.WORKFLOWS, APP_TYPES.WORKFLOW, workflowAppId);

    // Tests A and B both grant isAll, so `isAllEditable` short-circuits the `||` in
    // defineAbilityFor and the id allowlist is never consulted. This case leaves
    // isAllEditable false, so authorization can only succeed by reading
    // editableWorkflowsId — swapping that back to editableAppsId denies this user.
    const onWorkflow = await getAppConfig(workflowVersionId, user.cookie);
    expect(onWorkflow.status).not.toBe(403);

    // Control — the grant names one workflow, so it must buy nothing on the front-end app.
    const onFrontEndApp = await getAppConfig(frontEndVersionId, user.cookie);
    expect(onFrontEndApp.status).toBe(403);
  });
});
