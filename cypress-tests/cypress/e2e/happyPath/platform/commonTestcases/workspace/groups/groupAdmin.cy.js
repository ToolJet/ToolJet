import { fake } from "Fixtures/fake";
import { sanitize } from "Support/utils/common";
import { groupsSelector, groupAdminSelector } from "Selectors/platform/manageGroups";
import {
  apiCreateGroup,
  apiAddUserToGroup,
  addUserInGroup,
} from "Support/utils/manageGroups";
import { apiArchiveUnarchiveUser, cleanAllUsers } from "Support/utils/manageUsers";
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
    cleanAllUsers();

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

  it("Workspace admin assigns and revokes group admins; the list, dropdown, membership and Users-table all reflect it", () => {
    visitGroupsPage();

    assignGroupAdminViaUI(data.g1, data.endUser1.email);
    verifyAdminInGroupAdminsList(data.endUser1.email);

    assignGroupAdminViaUI(data.g1, data.builder.email);
    verifyAdminInGroupAdminsList(data.builder.email);

    verifyUserNotAssignable(data.endUser1.email);
    verifyUserNotAssignable(data.builder.email);

    assignMultipleGroupAdminsViaUI(data.g3, [data.endUser2.email, data.builder.email]);

    verifyUsersTableGroupAdminColumn(data.workspaceSlug, data.endUser1.name, data.g1, true);

    // Make the g1 admin also a member, so revoking can be shown to keep membership.
    cy.apiGetGroupId(data.g1).then((g1Id) => apiAddUserToGroup(g1Id, data.endUser1.email));

    visitGroupsPage();
    revokeGroupAdminViaUI(data.g1, data.endUser1.email);

    // Revoke removes the admin but keeps membership
    cy.get(groupsSelector.usersLink).click();
    cy.get(groupAdminSelector.adminUserRow(data.endUser1.email)).should("exist");

    verifyUsersTableGroupAdminColumn(data.workspaceSlug, data.endUser1.name, data.g1, false);
  });

  it("Group-admin assignment persists through role changes and duplication, but excludes archived and invited users", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => {
      apiAssignGroupAdmin(g1Id, data.endUser1.email);
      apiAssignGroupAdmin(g1Id, data.builder.email);
    });

    cy.apiUpdateUserRole(data.endUser1.email, "builder");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    verifyAdminInGroupAdminsList(data.endUser1.email);

    cy.apiUpdateUserRole(data.endUser1.email, "admin");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    verifyAdminInGroupAdminsList(data.endUser1.email);

    cy.apiUpdateUserRole(data.builder.email, "end-user");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    verifyAdminInGroupAdminsList(data.builder.email);

    verifyUserAssignable(data.endUser2.email);

    // Duplicate copies group admins
    visitGroupsPage();
    duplicateGroupWithAdminsViaUI(data.g1);
    openCustomGroupAdminsTab(`${data.g1}_copy`);
    verifyAdminInGroupAdminsList(data.endUser1.email);

    apiArchiveUnarchiveUser(data.builder.email, "archive");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    cy.get(groupAdminSelector.adminUserRow(data.builder.email)).should("not.exist");

    const invited = { name: fake.firstName, email: fake.email.toLowerCase() };
    cy.apiUserInvite(invited.name, invited.email, "end-user");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    verifyUserNotAssignable(data.builder.email); // archived → not assignable
    verifyUserNotAssignable(invited.email); // invited / pending → not assignable

    // Unarchiving does not restore the group admin access
    apiArchiveUnarchiveUser(data.builder.email, "unarchive");
    visitGroupsPage();
    openCustomGroupAdminsTab(data.g1);
    cy.get(groupAdminSelector.adminUserRow(data.builder.email)).should("not.exist");
    verifyUserNotAssignable(data.builder.email);
  });

  it("An end-user group admin of a group: limited controls, Groups-only settings scope, and membership management", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => {
      apiAssignGroupAdmin(g1Id, data.endUser1.email);
      apiAssignGroupAdmin(g1Id, data.builder.email);
      apiAddUserToGroup(g1Id, data.endUser1.email);
      apiAddUserToGroup(g1Id, data.endUser2.email);
    });
   
    cy.apiGetGroupId(data.g3).as("g3Id");

    loginAs(data.endUser1.email);
    visitGroupsPage();

    verifyGroupAdminHasNoGroupCrudControls(data.g1);
    verifyGroupAdminPermissionTabsReadOnly(data.g1);
    verifyGroupAdminUsersTabHasNoRoleControls(data.g1, data.endUser2.email);
    verifyGroupAdminCannotManageAdmins(data.g1);

    verifyEndUserGASettingsNavScope();
    verifyRestrictedSettingsPagesRedirect(data.workspaceSlug);

    // Direct URL access to a custom group they do not administer is not granted.
    cy.get("@g3Id").then((g3Id) => {
      cy.visit(`${data.workspaceSlug}/workspace-settings/groups/${g3Id}`);
      cy.wait(1000);
      cy.get(groupsSelector.groupLink(data.g3)).should("not.exist");
    });

    visitGroupsPage();
    removeGroupMemberViaUI(data.g1, data.endUser2.email);
    removeGroupMemberViaUI(data.g1, data.endUser1.email);

    // Self-removal does not revoke the group admin role
    visitGroupsPage();
    cy.get(groupsSelector.groupLink(data.g1)).should("be.visible");
    openCustomGroupAdminsTab(data.g1);
    verifyAdminInGroupAdminsList(data.endUser1.email);
  });

  it("An end-user admin of a builder group: scoped view, no builder abilities, and sidebar tracks assignment/revocation", () => {
    cy.apiGetGroupId(data.g3).then((g3Id) => apiAssignGroupAdmin(g3Id, data.endUser1.email));

    loginAs(data.endUser1.email);
    visitGroupsPage();

    cy.get(groupsSelector.groupLink(data.g3)).should("be.visible");
    cy.get(groupsSelector.groupLink(data.g1)).should("not.exist");

    // An end-user group admin does NOT see the default "USER ROLE" groups.
    cy.get(groupAdminSelector.userRoleSectionTitle).should("not.exist");
    ["Admin", "Builder", "End-user"].forEach((defaultGroup) =>
      cy.get(groupsSelector.groupLink(defaultGroup)).should("not.exist")
    );

    addUserInGroup(data.g3, data.builder.email);
    verifyNoBuilderCapabilities(data.workspaceSlug);

    loginAsAdmin();
    cy.apiGetGroupId(data.g1).then((g1Id) => apiAssignGroupAdmin(g1Id, data.endUser1.email));

    loginAs(data.endUser1.email);
    visitGroupsPage();
    cy.get(groupsSelector.groupLink(data.g1)).should("be.visible");
    cy.get(groupsSelector.groupLink(data.g3)).should("be.visible");

    loginAsAdmin();
    cy.apiGetGroupId(data.g3).then((g3Id) => apiRevokeGroupAdmin(g3Id, data.endUser1.email));

    loginAs(data.endUser1.email);
    visitGroupsPage();
    cy.get(groupsSelector.groupLink(data.g3)).should("not.exist");
    cy.get(groupsSelector.groupLink(data.g1)).should("be.visible");
  });

  it("A group admin can add members to an end-user group, but adding an end-user to a builder group is blocked", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => apiAssignGroupAdmin(g1Id, data.endUser1.email));
    cy.apiGetGroupId(data.g3).then((g3Id) => {
      apiAssignGroupAdmin(g3Id, data.endUser1.email);
      apiAssignGroupAdmin(g3Id, data.builder.email);
    });

    loginAs(data.endUser1.email);
    visitGroupsPage();
    addUserInGroup(data.g1, data.endUser2.email);

    addMemberExpectRoleChangeModal(data.g3, data.endUser2.email, { adminLine: true });

    loginAs(data.builder.email);
    visitGroupsPage();
    addMemberExpectRoleChangeModal(data.g3, data.endUser2.email, { adminLine: true });

    loginAsAdmin();
    visitGroupsPage();
    addMemberExpectRoleChangeModal(data.g3, data.endUser2.email, { adminLine: false });

    cy.apiLogin();
    cy.apiUpdateUserRole(data.endUser2.email, "builder");
    visitGroupsPage();
    addUserInGroup(data.g3, data.endUser2.email);
    verifyMemberInGroupUI(data.g3, data.endUser2.email, true);
  });

  it("A builder group admin can manage membership but cannot assign admins or change roles", () => {
    cy.apiGetGroupId(data.g1).then((g1Id) => apiAssignGroupAdmin(g1Id, data.builder.email));

    loginAs(data.builder.email);
    visitGroupsPage();

    // Unlike an end-user GA, a builder GA sees the default "USER ROLE" groups, read-only.
    verifyBuilderGADefaultGroupsReadOnly();

    addUserInGroup(data.g1, data.endUser1.email);
    verifyMemberInGroupUI(data.g1, data.endUser1.email, true);

    verifyGroupAdminCannotManageAdmins(data.g1);
  });
});
