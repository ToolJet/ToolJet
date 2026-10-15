import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import { groupsSelector, groupAdminSelector } from "Selectors/platform/manageGroups";
import {
  apiCreateGroup,
  apiAddUserToGroup,
  addUserInGroup,
} from "Support/utils/manageGroups";
import { apiArchiveUnarchiveUser } from "Support/utils/manageUsers";
import { getGroupPermissionInput } from "Support/utils/userPermissions";
import {
  apiAssignGroupAdmin,
  apiRevokeGroupAdmin,
  openCustomGroupAdminsTab,
  assignGroupAdminViaUI,
  assignMultipleGroupAdminsViaUI,
  verifyAdminInGroupAdminsList,
  revokeGroupAdminViaUI,
  verifyUserAssignable,
  verifyUserNotAssignable,
  verifyGroupAdminCannotManageAdmins,
  addMemberExpectRoleChangeModal,
  removeGroupMemberViaUI,
  verifyMemberInGroupUI,
  verifyGroupAdminUsersTabHasNoRoleControls,
  verifyGroupAdminHasNoGroupCrudControls,
  verifyGroupAdminPermissionTabsReadOnly,
  verifyBuilderGADefaultGroupsReadOnly,
  verifyEndUserGASettingsNavScope,
  verifyRestrictedSettingsPagesRedirect,
  verifyNoBuilderCapabilities,
  duplicateGroupWithAdminsViaUI,
  verifyUsersTableGroupAdminColumn,
} from "Support/utils/platform/groupAdmin";


describe("Group Admin - functionality (Builder & End-user)", () => {
  const data = {};

  // Switch the active session to another user, scoped to the default workspace.
  const loginAs = (email) =>
    cy.get("@orgId").then((orgId) => {
      cy.apiLogout();
      cy.apiLogin(email, "password", orgId);
    });
  const loginAsAdmin = () => loginAs("dev@tooljet.io");

  const visitGroupsPage = () => {
    cy.visit(`${data.workspaceSlug}/workspace-settings/groups`);
  };

  beforeEach(() => {
    data.builder = { name: fake.firstName, email: fake.email.toLowerCase() };
    data.endUser1 = { name: fake.firstName, email: fake.email.toLowerCase() };
    data.endUser2 = { name: fake.firstName, email: fake.email.toLowerCase() };
    data.g1 = `g1${sanitize(fake.firstName)}`; // end-user-level custom group
    data.g3 = `g3${sanitize(fake.firstName)}`; // builder-level custom group
    data.workspaceName = fake.firstName;
    data.workspaceSlug = data.workspaceName.toLowerCase().replace(/[^a-z0-9]/g, "");

    cy.defaultWorkspaceLogin();
    
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then((response) => {
      const orgId = response.body.organization_id;
      Cypress.env("workspaceId", orgId);
      cy.wrap(orgId).as("orgId");
    });

    cy.get("@orgId").then((orgId) => {
      cy.apiLogin("dev@tooljet.io", "password", orgId);

      apiCreateGroup(data.g1);
      apiCreateGroup(data.g3).then(() => {
        cy.apiUpdateGroupPermission(data.g3, getGroupPermissionInput(true, true));
      });

      cy.apiFullUserOnboarding(data.builder.name, data.builder.email, "builder", "password", data.workspaceName);
      cy.apiLogout();
      cy.apiLogin("dev@tooljet.io", "password", orgId);
      cy.apiFullUserOnboarding(data.endUser1.name, data.endUser1.email, "end-user", "password", data.workspaceName);
      cy.apiLogout();
      cy.apiLogin("dev@tooljet.io", "password", orgId);
      cy.apiFullUserOnboarding(data.endUser2.name, data.endUser2.email, "end-user", "password", data.workspaceName);
    });

    loginAsAdmin();
  });

  // ---- 1. Workspace admin assigns group admins ----------------------------

  it("Workspace admin assigns group admins; the list reflects them and assigned users drop out of the dropdown", () => {
    visitGroupsPage();

    assignGroupAdminViaUI(data.g1, data.endUser1.email);
    verifyAdminInGroupAdminsList(data.endUser1.email);

    assignGroupAdminViaUI(data.g1, data.builder.email);
    verifyAdminInGroupAdminsList(data.builder.email);

    // an already-assigned user can't be assigned again.
    verifyUserNotAssignable(data.endUser1.email);
    verifyUserNotAssignable(data.builder.email);

    // Multiple users can be assigned together in one action (multi-select).
    assignMultipleGroupAdminsViaUI(data.g3, [data.endUser2.email, data.builder.email]);

    // The Users table "Group admins" column reflects the assignment
    verifyUsersTableGroupAdminColumn(data.workspaceSlug, data.endUser1.name, data.g1, true);
  });

  // ---- 2. Archived & invited users are not assignable ---------------------

  it("Archived and invited users do not appear in the assign-group-admin dropdown", () => {
    apiArchiveUnarchiveUser(data.endUser2.email, "archive");
    const invited = { name: fake.firstName, email: fake.email.toLowerCase() };
    cy.apiUserInvite(invited.name, invited.email, "end-user");

    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);

    verifyUserAssignable(data.builder.email); // active member → assignable
    verifyUserNotAssignable(data.endUser2.email); // archived → not assignable
    verifyUserNotAssignable(invited.email); // invited/pending → not assignable
  });

  // ---- 3. Revoking keeps group membership ---------------------------------

  it("Revoking a group admin removes them from the admins list but keeps their group membership", () => {
  
    cy.apiGetGroupId(data.g1).then((g1Id) => {
      apiAddUserToGroup(g1Id, data.endUser1.email);
      apiAssignGroupAdmin(g1Id, data.endUser1.email);
    });

    // Users table shows g1 in the Group admins column before revoking.
    verifyUsersTableGroupAdminColumn(data.workspaceSlug, data.endUser1.name, data.g1, true);

    visitGroupsPage();
    revokeGroupAdminViaUI(data.g1, data.endUser1.email);

    // Still a member: the Users tab of the same group shows the row.
    cy.get(groupsSelector.usersLink).click();
    cy.get(groupAdminSelector.adminUserRow(data.endUser1.email)).should("exist");

    // ...but the Group admins column no longer lists g1 for them
    verifyUsersTableGroupAdminColumn(data.workspaceSlug, data.endUser1.name, data.g1, false);
  });

  // ---- 4. Membership role boundary ----------------------------------------

  it("A group admin can add members to an end-user group, but adding an end-user to a builder group is blocked", () => {

    cy.apiGetGroupId(data.g1).then((g1Id) => apiAssignGroupAdmin(g1Id, data.endUser1.email));
    cy.apiGetGroupId(data.g3).then((g3Id) => {
      apiAssignGroupAdmin(g3Id, data.endUser1.email);
      apiAssignGroupAdmin(g3Id, data.builder.email);
    });

    // (a) End-user group admin adds an end-user to their end-user-level group → allowed.
    loginAs(data.endUser1.email);
    visitGroupsPage();
    addUserInGroup(data.g1, data.endUser2.email);

    // (b) ...but adding an end-user to a builder-level group is blocked
    addMemberExpectRoleChangeModal(data.g3, data.endUser2.email, { adminLine: true });

    // (c) A builder group admin is blocked the same way
    loginAs(data.builder.email);
    visitGroupsPage();
    addMemberExpectRoleChangeModal(data.g3, data.endUser2.email, { adminLine: true });

    // (d) A workspace admin also gets the block modal
    loginAsAdmin();
    visitGroupsPage();
    addMemberExpectRoleChangeModal(data.g3, data.endUser2.email, { adminLine: false });

    // (e) After the workspace admin promotes the end-user to builder, the add succeeds.
    // Re-auth first: the modal helper above ends with cy.reload(), whose session
    // re-initialization can race the next API call and return a stale user list.
    cy.apiLogin();
    cy.apiUpdateUserRole(data.endUser2.email, "builder");
    visitGroupsPage();
    addUserInGroup(data.g3, data.endUser2.email);
    verifyMemberInGroupUI(data.g3, data.endUser2.email, true);
  });

  // ---- 4b. A group admin can remove members and manage their own membership ----

  it("A group admin can remove members, and removing themselves from the group keeps their admin assignment", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => {
      apiAssignGroupAdmin(g1Id, data.endUser1.email);
      apiAddUserToGroup(g1Id, data.endUser1.email); // admin is also a member
      apiAddUserToGroup(g1Id, data.endUser2.email);
    });

    loginAs(data.endUser1.email);
    visitGroupsPage();

    // Can remove another member.
    removeGroupMemberViaUI(data.g1, data.endUser2.email);

    // Can remove themselves as a member...
    removeGroupMemberViaUI(data.g1, data.endUser1.email);

    // ...and still administers the group (self-removal does not revoke the admin role).
    visitGroupsPage();
    cy.get(groupsSelector.groupLink(data.g1)).should("be.visible");
    openCustomGroupAdminsTab(data.g1);
    verifyAdminInGroupAdminsList(data.endUser1.email);
  });

  // ---- 5. Lifecycle effects on the assignment -----------------------------

  it("A group admin assignment survives role demotion and is cleared by archiving", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => {
      apiAssignGroupAdmin(g1Id, data.builder.email);
      apiAssignGroupAdmin(g1Id, data.endUser1.email);
    });

    // Demoting the builder group admin to end-user keeps the assignment.
    cy.apiUpdateUserRole(data.builder.email, "end-user");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    verifyAdminInGroupAdminsList(data.builder.email);

    // Archiving a group admin removes them from the list...
    apiArchiveUnarchiveUser(data.endUser1.email, "archive");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    cy.get(groupAdminSelector.adminUserRow(data.endUser1.email)).should("not.exist");

    // ...and unarchiving does not restore it.
    apiArchiveUnarchiveUser(data.endUser1.email, "unarchive");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    cy.get(groupAdminSelector.adminUserRow(data.endUser1.email)).should("not.exist");

    // ...and unarchiving re-enters the user into the invite flow, so they are
    // not immediately reassignable as a group admin — they must re-accept the
    // invite before reappearing in the assign dropdown.
    openCustomGroupAdminsTab(data.g1);
    verifyUserNotAssignable(data.endUser1.email);
  });

  // ---- 6. End-user group admin of a builder-level group -------------------

  it("An end-user assigned as admin of a builder group can see and manage it but gains no builder abilities", () => {
    // Assigning an end-user as GA of a builder-level group is allowed (role-agnostic).
    cy.apiGetGroupId(data.g3).then((g3Id) => apiAssignGroupAdmin(g3Id, data.endUser1.email));

    loginAs(data.endUser1.email);
    visitGroupsPage();

    // Scoped sidebar: the administered group is visible; a non-administered custom group is not.
    cy.get(groupsSelector.groupLink(data.g3)).should("be.visible");
    cy.get(groupsSelector.groupLink(data.g1)).should("not.exist");

    // An end-user group admin does NOT see the default "USER ROLE" groups
    cy.get(groupAdminSelector.userRoleSectionTitle).should("not.exist");
    ["Admin", "Builder", "End-user"].forEach((defaultGroup) =>
      cy.get(groupsSelector.groupLink(defaultGroup)).should("not.exist")
    );

    // Can manage g3: adding a role-compatible (builder) member succeeds.
    addUserInGroup(data.g3, data.builder.email);

    // Still an end-user: no builder capabilities on the dashboard — no app create,
    // and no access to data sources, workflows, or the ToolJet database.
    verifyNoBuilderCapabilities(data.workspaceSlug);
  });

  // ---- 7. A group admin cannot assign or revoke group admins --------------

  it("A group admin (non-workspace-admin) cannot assign or revoke group admins", () => {
    // Setup (API): two admins on g1 so there is a list to inspect.
    cy.apiGetGroupId(data.g1).then((g1Id) => {
      apiAssignGroupAdmin(g1Id, data.endUser1.email);
      apiAssignGroupAdmin(g1Id, data.builder.email);
    });

    loginAs(data.endUser1.email);
    visitGroupsPage();

    // The group admin sees the tab and the list, but no assign or revoke controls.
    verifyGroupAdminCannotManageAdmins(data.g1);
  });

  // ---- 8. End-user group admin: workspace-settings scope ------------------

  it("An end-user group admin's workspace settings are scoped to Groups only, and restricted pages redirect away", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => apiAssignGroupAdmin(g1Id, data.endUser1.email));
    // Resolve g3's id while still admin — an end-user group admin cannot list a
    // group they do not administer, so this lookup must happen before loginAs.
    cy.apiGetGroupId(data.g3).as("g3Id");

    loginAs(data.endUser1.email);
    visitGroupsPage();

    // Only "Groups" is available in the workspace-settings navigation.
    verifyEndUserGASettingsNavScope();

    // Direct URL access to other settings pages redirects to the dashboard.
    verifyRestrictedSettingsPagesRedirect(data.workspaceSlug);

    // Direct URL access to a custom group they do not administer is not granted.
    cy.get("@g3Id").then((g3Id) => {
      cy.visit(`${data.workspaceSlug}/workspace-settings/groups/${g3Id}`);
      cy.wait(1000);
      cy.get(groupsSelector.groupLink(data.g3)).should("not.exist");
    });
  });

  // ---- 9. End-user group admin: limited group controls -------------------

  it("An end-user group admin has no group CRUD controls and no role-change controls", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => {
      apiAssignGroupAdmin(g1Id, data.endUser1.email);
      apiAddUserToGroup(g1Id, data.endUser2.email);
    });

    loginAs(data.endUser1.email);
    visitGroupsPage();

    // No create / rename / duplicate / delete controls.
    verifyGroupAdminHasNoGroupCrudControls(data.g1);

    // Permissions & Granular-access tabs are visible but read-only (disabled
    // checkboxes, no add-permission control).
    verifyGroupAdminPermissionTabsReadOnly(data.g1);

    // The Users tab offers add / remove only — no role change.
    verifyGroupAdminUsersTabHasNoRoleControls(data.g1, data.endUser2.email);
  });

  // ---- 10. Managing multiple administered groups independently ------------

  it("A group admin managing multiple groups loses visibility of a group only when revoked from it", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => apiAssignGroupAdmin(g1Id, data.endUser1.email));
    cy.apiGetGroupId(data.g3).then((g3Id) => apiAssignGroupAdmin(g3Id, data.endUser1.email));

    loginAs(data.endUser1.email);
    visitGroupsPage();
    cy.get(groupsSelector.groupLink(data.g1)).should("be.visible");
    cy.get(groupsSelector.groupLink(data.g3)).should("be.visible");

    // Workspace admin revokes the admin from g3 only.
    loginAsAdmin();
    cy.apiGetGroupId(data.g3).then((g3Id) => apiRevokeGroupAdmin(g3Id, data.endUser1.email));

    // g3 drops out of the admin's sidebar; g1 remains.
    loginAs(data.endUser1.email);
    visitGroupsPage();
    cy.get(groupsSelector.groupLink(data.g3)).should("not.exist");
    cy.get(groupsSelector.groupLink(data.g1)).should("be.visible");
  });

  // ---- 11. Assignment persists across role promotion ---------------------

  it("A group admin assignment persists when the user is promoted from end-user to builder to admin", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => apiAssignGroupAdmin(g1Id, data.endUser1.email));

    // Promote end-user -> builder: still a group admin.
    cy.apiUpdateUserRole(data.endUser1.email, "builder");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    verifyAdminInGroupAdminsList(data.endUser1.email);

    // Promote builder -> admin: still a group admin.
    cy.apiUpdateUserRole(data.endUser1.email, "admin");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    verifyAdminInGroupAdminsList(data.endUser1.email);
  });

  // ---- 12. Duplicating a group copies its admins -------------------------

  it("Duplicating a group copies its group admins, and a group admin cannot duplicate a group", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => apiAssignGroupAdmin(g1Id, data.endUser1.email));

    // Workspace admin duplicates g1 with the "Group admins" option selected.
    visitGroupsPage();
    duplicateGroupWithAdminsViaUI(data.g1);

    // The copied group carries the same group admin.
    openCustomGroupAdminsTab(`${data.g1}_copy`);
    verifyAdminInGroupAdminsList(data.endUser1.email);

    // A group admin has no duplicate control (covered by the no-CRUD-controls check).
    loginAs(data.endUser1.email);
    visitGroupsPage();
    verifyGroupAdminHasNoGroupCrudControls(data.g1);
  });

  // ---- 13. Builder group-admin persona -----------------------------------

  it("A builder group admin can manage membership but cannot assign admins or change roles", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => apiAssignGroupAdmin(g1Id, data.builder.email));

    loginAs(data.builder.email);
    visitGroupsPage();

    // A builder group admin also sees the default "USER ROLE" groups, read-only.
    verifyBuilderGADefaultGroupsReadOnly();

    // Can manage membership of the administered group.
    addUserInGroup(data.g1, data.endUser1.email);
    verifyMemberInGroupUI(data.g1, data.endUser1.email, true);

    // Cannot assign or revoke other group admins.
    verifyGroupAdminCannotManageAdmins(data.g1);
  });
});
