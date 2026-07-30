import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import {
  initTestApp,
  closeTestApp,
  createUser,
  createGroupPermission,
  createUserGroupPermissions,
  createFolder,
  addAppToFolder,
  createApplication,
  login,
  saveEntity,
  createWorkflowForUser,
  createUserWorkflowPermissions as grantLegacyWorkflowPermissions,
} from 'test-helper';
import { GranularPermissions } from '@entities/granular_permissions.entity';
import { FoldersGroupPermissions } from '@entities/folders_group_permissions.entity';
import { GroupFolders } from '@entities/group_folders.entity';
import { Folder } from '@entities/folder.entity';
import { GroupPermissions } from '@entities/group_permissions.entity';
import { MODULES } from '@modules/app/constants/modules';
import { ResourceType } from '@modules/group-permissions/constants';
import { APP_TYPES } from '@modules/apps/constants';
import { AbilityService } from '@modules/ability/interfaces/IService';

/**
 * Grants a WORKFLOW_FOLDER-tagged granular permission to `groupId`, optionally scoped to
 * `options.folderId`. Mirrors folders.spec.ts's grantFolderPermission / folder-apps.spec.ts's
 * grantFolderEditApps, just tagged with ResourceType.WORKFLOW_FOLDER instead of FOLDER.
 */
let grantWorkflowFolderPermissionCallCount = 0;

async function grantWorkflowFolderPermission(
  groupId: string,
  options: { folderId?: string; canEditFolder?: boolean; canEditApps?: boolean; canViewApps?: boolean; isAll?: boolean }
): Promise<void> {
  const isAll = options.isAll ?? !options.folderId;
  // `name` participates in a (name, group_id) unique constraint — a plain constant collides
  // when this helper is called more than once for the same group (e.g. two folder-scoped
  // grants on one group). Suffix with a call counter to keep every row unique.
  grantWorkflowFolderPermissionCallCount += 1;
  const granular = await saveEntity(GranularPermissions, {
    groupId,
    name: `Workflow folder permissions ${grantWorkflowFolderPermissionCallCount}`,
    type: ResourceType.WORKFLOW_FOLDER,
    isAll,
  } as any);
  const folderPerm = await saveEntity(FoldersGroupPermissions, {
    granularPermissionId: granular.id,
    canEditFolder: options.canEditFolder ?? false,
    canEditApps: options.canEditApps ?? false,
    canViewApps: options.canViewApps ?? false,
  } as any);
  if (options.folderId && !isAll) {
    await saveEntity(GroupFolders, {
      folderId: options.folderId,
      foldersGroupPermissionsId: folderPerm.id,
    } as any);
  }
}

/** @group platform */
describe('Ability resolution — WORKFLOW_FOLDER → editableWorkflowsId/executableWorkflowsId', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('canEditFolder:true scoped to a workflow folder makes its workflow editable', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a1@tooljet.io' });
    const group = await createGroupPermission(nestApp, { organization, group: 'a1-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a1-group']);

    const folder = await createFolder(nestApp, { name: 'a1-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createWorkflowForUser(nestApp, user, 'a1-workflow');
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group.id, { folderId: folder.id, canEditFolder: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toContain(workflow.id);
  });

  it('canEditApps:true (canEditFolder false) scoped to a workflow folder makes its workflow editable', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a2@tooljet.io' });
    const group = await createGroupPermission(nestApp, { organization, group: 'a2-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a2-group']);

    const folder = await createFolder(nestApp, { name: 'a2-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createWorkflowForUser(nestApp, user, 'a2-workflow');
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group.id, { folderId: folder.id, canEditApps: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toContain(workflow.id);
  });

  // This is the bug-repro at the resolution layer: execute-only (canViewApps) on a workflow
  // folder must grant execute access ONLY — never edit access. Before the fix,
  // createUserWorkflowPermissions never read WORKFLOW_FOLDER grants at all, so this workflow
  // would incorrectly be absent from BOTH arrays (rather than present only in executable).
  it('canViewApps:true only (execute-only) scoped to a workflow folder does NOT make its workflow editable', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a3@tooljet.io' });
    const group = await createGroupPermission(nestApp, { organization, group: 'a3-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a3-group']);

    // Owned by a different user in the same org — createWorkflowForUser(nestApp, user, ...)
    // would make the workflow unconditionally editable via the "owned by user" rule,
    // masking exactly the bug this test is meant to catch.
    const { user: owner } = await createUser(nestApp, { email: 'a3-owner@tooljet.io', organization });
    const folder = await createFolder(nestApp, { name: 'a3-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createWorkflowForUser(nestApp, owner, 'a3-workflow');
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group.id, { folderId: folder.id, canViewApps: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].executableWorkflowsId).toContain(workflow.id);
    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).not.toContain(workflow.id);
  });

  it('a grant scoped to a different folder does not leak into an unrelated folder\'s workflow', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a4@tooljet.io' });
    const group = await createGroupPermission(nestApp, { organization, group: 'a4-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a4-group']);

    // Owned by a different user — see a3's comment on why the actor under test can't own it.
    const { user: owner } = await createUser(nestApp, { email: 'a4-owner@tooljet.io', organization });
    const folder1 = await createFolder(nestApp, { name: 'a4-folder1', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const folder2 = await createFolder(nestApp, { name: 'a4-folder2', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow2 = await createWorkflowForUser(nestApp, owner, 'a4-workflow2');
    await addAppToFolder(nestApp, workflow2, folder2);

    await grantWorkflowFolderPermission(group.id, { folderId: folder1.id, canEditFolder: true, canViewApps: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).not.toContain(workflow2.id);
    expect(perms[MODULES.WORKFLOWS].executableWorkflowsId).not.toContain(workflow2.id);
  });

  // Note: an isAll WORKFLOW_FOLDER grant does NOT flip perms[MODULES.WORKFLOWS].isAllEditable
  // itself — confirmed against the mirrored Apps+FOLDER code path (server/src/modules/ability/
  // util.service.ts, exercised by folders.spec.ts), which never sets MODULES.APP.isAllEditable
  // from an isAll folder grant either. Instead it resolves to concrete membership: every
  // workflow that currently sits in *some* workflow folder lands in editableWorkflowsId.
  it('isAll:true, canEditFolder:true makes every folder-contained workflow editable', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a5@tooljet.io', groups: ['all_users'] });
    // Owned by a different user — see a3's comment on why the actor under test can't own it.
    const { user: owner } = await createUser(nestApp, { email: 'a5-owner@tooljet.io', organization });
    const group = await createGroupPermission(nestApp, { organization, group: 'a5-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a5-group']);

    const folder = await createFolder(nestApp, { name: 'a5-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createWorkflowForUser(nestApp, owner, 'a5-workflow');
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group.id, { isAll: true, canEditFolder: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toContain(workflow.id);
  });

  it('isAll:true, canViewApps:true only makes folder-contained workflows executable but not editable', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a6@tooljet.io', groups: ['all_users'] });
    // Owned by a different user — see a3's comment on why the actor under test can't own it.
    const { user: owner } = await createUser(nestApp, { email: 'a6-owner@tooljet.io', organization });
    const group = await createGroupPermission(nestApp, { organization, group: 'a6-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a6-group']);

    const folder = await createFolder(nestApp, { name: 'a6-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createWorkflowForUser(nestApp, owner, 'a6-workflow');
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group.id, { isAll: true, canViewApps: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].executableWorkflowsId).toContain(workflow.id);
    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).not.toContain(workflow.id);
  });

  // Ownership path: createFolder (test-helper) does not support setting createdBy, so the
  // owned folder is built directly with saveEntity — same pattern folder-apps.spec.ts uses
  // for the same need (see its `builder owned workflow folder` case).
  it('a workflow in a folder owned (created) by the user is editable even with no explicit grant', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a7@tooljet.io' });

    const ownedFolder = await saveEntity(Folder, {
      name: 'a7-owned-folder',
      type: APP_TYPES.WORKFLOW,
      organizationId: organization.id,
      createdBy: user.id,
    } as any);
    const workflow = await createWorkflowForUser(nestApp, user, 'a7-workflow');
    await addAppToFolder(nestApp, workflow, ownedFolder);

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toContain(workflow.id);
  });

  it('two separate folders with different grant tiers do not cross-contaminate', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a8@tooljet.io' });
    const group = await createGroupPermission(nestApp, { organization, group: 'a8-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a8-group']);

    // workflowB is owned by a different user — see a3's comment on why the actor under test
    // can't own it (workflowA's ownership doesn't matter: ownership only ever adds to
    // editableWorkflowsId, which is already the expected outcome for workflowA below).
    const { user: owner } = await createUser(nestApp, { email: 'a8-owner@tooljet.io', organization });
    const folderA = await createFolder(nestApp, { name: 'a8-folderA', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const folderB = await createFolder(nestApp, { name: 'a8-folderB', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflowA = await createWorkflowForUser(nestApp, user, 'a8-workflowA');
    const workflowB = await createWorkflowForUser(nestApp, owner, 'a8-workflowB');
    await addAppToFolder(nestApp, workflowA, folderA);
    await addAppToFolder(nestApp, workflowB, folderB);

    await grantWorkflowFolderPermission(group.id, { folderId: folderA.id, canEditFolder: true });
    await grantWorkflowFolderPermission(group.id, { folderId: folderB.id, canViewApps: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toContain(workflowA.id);
    expect(perms[MODULES.WORKFLOWS].executableWorkflowsId).not.toContain(workflowA.id);
    expect(perms[MODULES.WORKFLOWS].executableWorkflowsId).toContain(workflowB.id);
    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).not.toContain(workflowB.id);
  });

  // See a5/a6's note: an isAll WORKFLOW_FOLDER grant resolves via concrete membership
  // (editableWorkflowsId/executableWorkflowsId), not by flipping isAllEditable/isAllExecutable.
  // The "union without cancelling" property is exercised here as both arrays containing the
  // same folder-derived workflow, one via each group's separate isAll grant.
  it('two separate custom groups (isAll editable via one, isAll executable via another) union without cancelling', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a9@tooljet.io', groups: ['all_users'] });
    // Owned by a different user — see a3's comment on why the actor under test can't own it.
    const { user: owner } = await createUser(nestApp, { email: 'a9-owner@tooljet.io', organization });
    const group1 = await createGroupPermission(nestApp, { organization, group: 'a9-group1' } as any);
    const group2 = await createGroupPermission(nestApp, { organization, group: 'a9-group2' } as any);
    await createUserGroupPermissions(nestApp, user, ['a9-group1', 'a9-group2']);

    const folder = await createFolder(nestApp, { name: 'a9-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createWorkflowForUser(nestApp, owner, 'a9-workflow');
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group1.id, { isAll: true, canEditFolder: true });
    await grantWorkflowFolderPermission(group2.id, { isAll: true, canViewApps: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toContain(workflow.id);
    expect(perms[MODULES.WORKFLOWS].executableWorkflowsId).toContain(workflow.id);
  });

  // Locks in the confirmed-intentional additive-only design: a folder-scoped WORKFLOW_FOLDER
  // grant must never downgrade an isAllEditable that already came from an item-level WORKFLOWS
  // grant (e.g. a builder's default role). This is the exact real-world scenario from the
  // original bug report — the builder's role already grants full edit; folder scoping only adds.
  it('non-override: an existing isAllEditable (item-level WORKFLOWS grant) survives a canViewApps-only folder grant', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a10@tooljet.io' });
    await grantLegacyWorkflowPermissions(nestApp, user, organization.id, { isAllEditable: true });

    const group = await createGroupPermission(nestApp, { organization, group: 'a10-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a10-group']);
    const folder = await createFolder(nestApp, { name: 'a10-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    await grantWorkflowFolderPermission(group.id, { folderId: folder.id, canViewApps: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].isAllEditable).toBe(true);
  });

  // Isolation: a grant tagged ResourceType.FOLDER (not WORKFLOW_FOLDER) scoped to a folder whose
  // own `type` column happens to be APP_TYPES.WORKFLOW must not leak into workflow ability —
  // resourceActionsPermission for MODULES.WORKFLOWS only reads ResourceType.WORKFLOW_FOLDER rows.
  it('isolation: a FOLDER-tagged grant on a workflow-type folder does not grant workflow access', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a11@tooljet.io' });
    // Owned by a different user — see a3's comment on why the actor under test can't own it.
    const { user: owner } = await createUser(nestApp, { email: 'a11-owner@tooljet.io', organization });
    const group = await createGroupPermission(nestApp, { organization, group: 'a11-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a11-group']);

    const folder = await createFolder(nestApp, { name: 'a11-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createWorkflowForUser(nestApp, owner, 'a11-workflow');
    await addAppToFolder(nestApp, workflow, folder);

    const granular = await saveEntity(GranularPermissions, {
      groupId: group.id,
      name: 'Mistagged folder grant',
      type: ResourceType.FOLDER,
      isAll: false,
    } as any);
    const folderPerm = await saveEntity(FoldersGroupPermissions, {
      granularPermissionId: granular.id,
      canEditFolder: true,
      canEditApps: true,
      canViewApps: true,
    } as any);
    await saveEntity(GroupFolders, { folderId: folder.id, foldersGroupPermissionsId: folderPerm.id } as any);

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).not.toContain(workflow.id);
    expect(perms[MODULES.WORKFLOWS].executableWorkflowsId).not.toContain(workflow.id);
  });

  // Cross-org: documents CURRENT behavior, does not assert "correctness". The per-folder-id
  // resolution branch (ee/ability/service.ts ~L636-663, mirrored from util.service.ts's Apps+
  // FOLDER equivalent) has no organizationId filter, unlike the isAll branch which does filter
  // by org. So a grant whose folderId happens to belong to a different org's folder resolves
  // against that folder's workflows regardless of org — a known, shared, pre-existing gap (same
  // shape existed already in the Apps+FOLDER code) that this suite documents, not fixes.
  it('cross-org: a WORKFLOW_FOLDER grant scoped to another org\'s folder id is not organization-isolated (documents pre-existing gap)', async () => {
    const { user: user1, organization: org1 } = await createUser(nestApp, { email: 'a12-org1@tooljet.io' });
    const { user: user2, organization: org2 } = await createUser(nestApp, { email: 'a12-org2@tooljet.io' });

    const folder2 = await createFolder(nestApp, { name: 'a12-folder-org2', type: APP_TYPES.WORKFLOW, organizationId: org2.id });
    const workflow2 = await createWorkflowForUser(nestApp, user2, 'a12-workflow-org2');
    await addAppToFolder(nestApp, workflow2, folder2);

    const group1 = await createGroupPermission(nestApp, { organization: org1, group: 'a12-group1' } as any);
    await createUserGroupPermissions(nestApp, user1, ['a12-group1']);
    // Bypasses controller-level cross-org validation on purpose — testing the resolution layer directly.
    await grantWorkflowFolderPermission(group1.id, { folderId: folder2.id, canEditFolder: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user1, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: org1.id,
    });

    // Documenting actual (leaky) behavior: org1's user resolves org2's folder-scoped workflow
    // as editable because the folderId IN (...) lookup is not org-scoped. If this assertion
    // ever starts failing because the code was tightened to filter by org, that's a welcome
    // fix — update this test to assert non-leakage instead of deleting the coverage.
    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toContain(workflow2.id);
  });

  it('a workflow folder with zero workflows produces no spurious editableWorkflowsId entries and does not throw', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a13@tooljet.io' });
    const group = await createGroupPermission(nestApp, { organization, group: 'a13-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a13-group']);

    const emptyFolder = await createFolder(nestApp, { name: 'a13-empty-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    await grantWorkflowFolderPermission(group.id, { folderId: emptyFolder.id, isAll: false, canEditFolder: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toEqual([]);
  });

  it('null-safety: a WORKFLOW_FOLDER GranularPermissions row with no FoldersGroupPermissions row does not throw', async () => {
    // groups: ['all_users'] avoids createUser's default admin+end-user groups — the admin
    // default group's own isAll WORKFLOWS grant would otherwise make isAllEditable true
    // regardless of this test's dangling grant, defeating the false-default assertion below.
    const { user, organization } = await createUser(nestApp, { email: 'a14@tooljet.io', groups: ['all_users'] });
    const group = await createGroupPermission(nestApp, { organization, group: 'a14-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a14-group']);

    // Deliberately incomplete: GranularPermissions row with no associated FoldersGroupPermissions.
    await saveEntity(GranularPermissions, {
      groupId: group.id,
      name: 'Dangling workflow folder grant',
      type: ResourceType.WORKFLOW_FOLDER,
      isAll: false,
    } as any);

    const abilityService = nestApp.get(AbilityService);
    // No throw is the primary assertion here — the earlier bug-prone code path guards a null
    // foldersGroupPermissions relation with `if (!folderPermission) continue;`.
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });
    expect(perms[MODULES.WORKFLOWS].isAllEditable).toBe(false);
    expect(perms[MODULES.WORKFLOWS].isAllExecutable).toBe(false);
    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toEqual([]);
  });

  it('null-safety: a non-isAll WORKFLOW_FOLDER grant with a FoldersGroupPermissions row but zero GroupFolders rows does not throw', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a15@tooljet.io' });
    const group = await createGroupPermission(nestApp, { organization, group: 'a15-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a15-group']);

    const granular = await saveEntity(GranularPermissions, {
      groupId: group.id,
      name: 'Folderless workflow folder grant',
      type: ResourceType.WORKFLOW_FOLDER,
      isAll: false,
    } as any);
    // FoldersGroupPermissions exists, but no GroupFolders rows point at it.
    await saveEntity(FoldersGroupPermissions, {
      granularPermissionId: granular.id,
      canEditFolder: true,
      canEditApps: true,
      canViewApps: true,
    } as any);

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toEqual([]);
    expect(perms[MODULES.WORKFLOWS].executableWorkflowsId).toEqual([]);
  });

  it('canEditFolder:true AND canViewApps:true simultaneously on the same folder grants BOTH edit and execute', async () => {
    const { user, organization } = await createUser(nestApp, { email: 'a16@tooljet.io' });
    const group = await createGroupPermission(nestApp, { organization, group: 'a16-group' } as any);
    await createUserGroupPermissions(nestApp, user, ['a16-group']);

    const folder = await createFolder(nestApp, { name: 'a16-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createWorkflowForUser(nestApp, user, 'a16-workflow');
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group.id, { folderId: folder.id, canEditFolder: true, canViewApps: true });

    const abilityService = nestApp.get(AbilityService);
    const perms = await abilityService.resourceActionsPermission(user, {
      resources: [{ resource: MODULES.WORKFLOWS }],
      organizationId: organization.id,
    });

    expect(perms[MODULES.WORKFLOWS].editableWorkflowsId).toContain(workflow.id);
    expect(perms[MODULES.WORKFLOWS].executableWorkflowsId).toContain(workflow.id);
  });
});

/** @group platform */
describe('HTTP enforcement — PUT/GET /api/apps/:id for workflow-type apps gated by folder permission', () => {
  let nestApp: INestApplication;

  beforeAll(async () => {
    ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'enterprise' }));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(async () => {
    await closeTestApp(nestApp);
  }, 60_000);

  it('bug repro: canViewApps-only WORKFLOW_FOLDER grant allows GET but returns 403 on PUT', async () => {
    const adminUserData = await createUser(nestApp, { email: 'b1-admin@tooljet.io' });
    const adminUser = adminUserData.user;
    const organization = adminUserData.organization;

    // Deliberately NOT groups:['builder'] — that preset already bakes in isAllEditable:true at
    // the item level for workflows, which would silently mask this exact bug scenario.
    const endUserData = await createUser(nestApp, {
      email: 'b1-enduser@tooljet.io',
      groups: ['all_users'],
      organization,
    });
    const { tokenCookie } = await login(nestApp, 'b1-enduser@tooljet.io', 'password');

    const group = await createGroupPermission(nestApp, { organization, group: 'b1-group' } as any);
    await createUserGroupPermissions(nestApp, endUserData.user, ['b1-group']);

    const folder = await createFolder(nestApp, { name: 'b1-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createApplication(nestApp, { user: adminUser, name: 'b1-workflow', type: APP_TYPES.WORKFLOW }, false);
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group.id, { folderId: folder.id, canViewApps: true });

    await request(nestApp.getHttpServer())
      .put(`/api/apps/${workflow.id}`)
      .set('tj-workspace-id', adminUser.defaultOrganizationId)
      .set('Cookie', tokenCookie)
      .send({ app: { name: 'renamed by execute-only user' } })
      .expect(403);

    await request(nestApp.getHttpServer())
      .get(`/api/apps/${workflow.id}`)
      .set('tj-workspace-id', adminUser.defaultOrganizationId)
      .set('Cookie', tokenCookie)
      .expect(200);
  });

  it('canEditFolder:true WORKFLOW_FOLDER grant allows PUT (200)', async () => {
    const adminUserData = await createUser(nestApp, { email: 'b2-admin@tooljet.io' });
    const adminUser = adminUserData.user;
    const organization = adminUserData.organization;

    const endUserData = await createUser(nestApp, {
      email: 'b2-enduser@tooljet.io',
      groups: ['all_users'],
      organization,
    });
    const { tokenCookie } = await login(nestApp, 'b2-enduser@tooljet.io', 'password');

    const group = await createGroupPermission(nestApp, { organization, group: 'b2-group' } as any);
    await createUserGroupPermissions(nestApp, endUserData.user, ['b2-group']);

    const folder = await createFolder(nestApp, { name: 'b2-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createApplication(nestApp, { user: adminUser, name: 'b2-workflow', type: APP_TYPES.WORKFLOW }, false);
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group.id, { folderId: folder.id, canEditFolder: true });

    await request(nestApp.getHttpServer())
      .put(`/api/apps/${workflow.id}`)
      .set('tj-workspace-id', adminUser.defaultOrganizationId)
      .set('Cookie', tokenCookie)
      .send({ app: { name: 'renamed by edit-granted user' } })
      .expect(200);
  });

  it('negative control: no grant at all on an unrelated folder returns 403 for both PUT and GET', async () => {
    const adminUserData = await createUser(nestApp, { email: 'b3-admin@tooljet.io' });
    const adminUser = adminUserData.user;
    const organization = adminUserData.organization;

    const endUserData = await createUser(nestApp, {
      email: 'b3-enduser@tooljet.io',
      groups: ['all_users'],
      organization,
    });
    const { tokenCookie } = await login(nestApp, 'b3-enduser@tooljet.io', 'password');

    const unrelatedFolder = await createFolder(nestApp, { name: 'b3-unrelated-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow2 = await createApplication(nestApp, { user: adminUser, name: 'b3-workflow2', type: APP_TYPES.WORKFLOW }, false);
    await addAppToFolder(nestApp, workflow2, unrelatedFolder);

    await request(nestApp.getHttpServer())
      .put(`/api/apps/${workflow2.id}`)
      .set('tj-workspace-id', adminUser.defaultOrganizationId)
      .set('Cookie', tokenCookie)
      .send({ app: { name: 'should not be renamed' } })
      .expect(403);

    await request(nestApp.getHttpServer())
      .get(`/api/apps/${workflow2.id}`)
      .set('tj-workspace-id', adminUser.defaultOrganizationId)
      .set('Cookie', tokenCookie)
      .expect(403);
  });

  // Documents the confirmed non-bug over HTTP: a builder's item-level isAllEditable:true must
  // not be downgraded by an additional canViewApps-only folder grant layered on top.
  it('non-override over HTTP: a builder with isAllEditable plus a canViewApps-only folder grant can still PUT (200)', async () => {
    const adminUserData = await createUser(nestApp, { email: 'b4-admin@tooljet.io' });
    const adminUser = adminUserData.user;
    const organization = adminUserData.organization;

    const builderData = await createUser(nestApp, {
      email: 'b4-builder@tooljet.io',
      groups: ['builder'],
      organization,
    });
    const { tokenCookie } = await login(nestApp, 'b4-builder@tooljet.io', 'password');

    const group = await createGroupPermission(nestApp, { organization, group: 'b4-group' } as any);
    await createUserGroupPermissions(nestApp, builderData.user, ['b4-group']);

    const folder = await createFolder(nestApp, { name: 'b4-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
    const workflow = await createApplication(nestApp, { user: adminUser, name: 'b4-workflow', type: APP_TYPES.WORKFLOW }, false);
    await addAppToFolder(nestApp, workflow, folder);

    await grantWorkflowFolderPermission(group.id, { folderId: folder.id, canViewApps: true });

    await request(nestApp.getHttpServer())
      .put(`/api/apps/${workflow.id}`)
      .set('tj-workspace-id', adminUser.defaultOrganizationId)
      .set('Cookie', tokenCookie)
      .send({ app: { name: 'renamed by builder (still allowed)' } })
      .expect(200);
  });
});

/** @group platform */
describe('Licensing gates — plan: basic/starter hardcoded-role fallback', () => {
  describe('plan: basic, builder role', () => {
    let nestApp: INestApplication;

    beforeAll(async () => {
      ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'basic' }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(nestApp);
    }, 60_000);

    // Under a restricted plan, getResourcePermission short-circuits to a single hardcoded role
    // row and never queries real GranularPermissions rows at all — so a DB WORKFLOW_FOLDER
    // grant here is inert. isAllEditable comes entirely from the hardcoded builder-role fallback.
    it('a custom-group WORKFLOW_FOLDER grant is ignored; isAllEditable comes from the hardcoded builder fallback', async () => {
      const { user, organization } = await createUser(nestApp, { email: 'c1-builder@tooljet.io', groups: ['builder'] });

      const group = await createGroupPermission(nestApp, { organization, group: 'c1-group' } as any);
      await createUserGroupPermissions(nestApp, user, ['c1-group']);
      const folder = await createFolder(nestApp, { name: 'c1-folder', type: APP_TYPES.WORKFLOW, organizationId: organization.id });
      await grantWorkflowFolderPermission(group.id, { folderId: folder.id, canViewApps: true });

      const abilityService = nestApp.get(AbilityService);
      const perms = await abilityService.resourceActionsPermission(user, {
        resources: [{ resource: MODULES.WORKFLOWS }],
        organizationId: organization.id,
      });

      expect(perms[MODULES.WORKFLOWS].isAllEditable).toBe(true);
    });
  });

  describe('plan: basic, end-user role', () => {
    let nestApp: INestApplication;

    beforeAll(async () => {
      ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'basic' }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(nestApp);
    }, 60_000);

    it('end-user role yields isAllExecutable:true, isAllEditable:false', async () => {
      const { user, organization } = await createUser(nestApp, { email: 'c2-enduser@tooljet.io', groups: ['end-user'] });

      const abilityService = nestApp.get(AbilityService);
      const perms = await abilityService.resourceActionsPermission(user, {
        resources: [{ resource: MODULES.WORKFLOWS }],
        organizationId: organization.id,
      });

      expect(perms[MODULES.WORKFLOWS].isAllExecutable).toBe(true);
      expect(perms[MODULES.WORKFLOWS].isAllEditable).toBe(false);
    });
  });

  describe('plan: starter, builder role', () => {
    let nestApp: INestApplication;

    beforeAll(async () => {
      ({ app: nestApp } = await initTestApp({ edition: 'ee', plan: 'starter' }));
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    afterAll(async () => {
      await closeTestApp(nestApp);
    }, 60_000);

    it('builder role yields isAllEditable:true (confirms isRestrictedPlan matches "starter" too)', async () => {
      const { user, organization } = await createUser(nestApp, { email: 'c3-builder@tooljet.io', groups: ['builder'] });

      const abilityService = nestApp.get(AbilityService);
      const perms = await abilityService.resourceActionsPermission(user, {
        resources: [{ resource: MODULES.WORKFLOWS }],
        organizationId: organization.id,
      });

      expect(perms[MODULES.WORKFLOWS].isAllEditable).toBe(true);
    });
  });
});
