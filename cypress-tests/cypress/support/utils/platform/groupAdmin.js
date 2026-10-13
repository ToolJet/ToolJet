import { commonSelectors } from "Selectors/common";
import { commonEeSelectors } from "Selectors/platform/eeCommon";
import { groupsSelector } from "Selectors/platform/manageGroups";
import { groupAdminSelector } from "Selectors/platform/manageGroups";
import { groupAdminText } from "Texts/platform/manageGroups";
import { permissions } from "Support/utils/platform/groupsUI";
import { openGroupThreeDotMenu } from "Support/utils/platform/customGroups";


const host = () => Cypress.env("server_host");

export const apiGetUserIdByEmail = (email) => {
  return cy.apiGetUserDetails().then((res) => {
    const resp = res?.body ?? res;
    const users = Array.isArray(resp?.users) ? resp.users : [];
    const user = users.find((u) => u.email === email);
    if (!user) throw new Error(`User not found for email: ${email}`);
    return user.user_id || user.id;
  });
};


export const apiGetGroupAdmins = (groupId) => {
  return cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "GET",
      url: `${host()}/api/v2/group-permissions/${groupId}/admins`,
      headers,
      failOnStatusCode: false,
      log: false,
    })
  );
};

export const apiGetAddableAdmins = (groupId) => {
  return cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "GET",
      url: `${host()}/api/v2/group-permissions/${groupId}/admins/addable`,
      headers,
      failOnStatusCode: false,
      log: false,
    })
  );
};

export const apiAssignGroupAdmin = (groupId, email, { failOnStatusCode = true } = {}) => {
  return apiGetUserIdByEmail(email).then((userId) =>
    apiAssignGroupAdminById(groupId, userId, { failOnStatusCode })
  );
};


export const apiAssignGroupAdminById = (groupId, userId, { failOnStatusCode = true } = {}) => {
  return cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: "POST",
        url: `${host()}/api/v2/group-permissions/${groupId}/admins`,
        headers,
        body: { userId },
        failOnStatusCode,
        log: false,
      })
      .then((response) => {
        if (failOnStatusCode) expect(response.status).to.eq(201);
        return response;
      })
  );
};


export const apiRevokeGroupAdmin = (groupId, email, { failOnStatusCode = true } = {}) => {
  return apiGetUserIdByEmail(email).then((userId) =>
    apiGetGroupAdmins(groupId).then((res) => {
      const row = (res.body || []).find((ga) => ga.userId === userId);
      if (!row) throw new Error(`No group-admin row for ${email} in group ${groupId}`);
      return cy.getAuthHeaders().then((headers) =>
        cy.request({
          method: "DELETE",
          url: `${host()}/api/v2/group-permissions/${groupId}/admins/${row.id}`,
          headers,
          failOnStatusCode,
          log: false,
        })
      );
    })
  );
};

export const apiAddUsersToGroupAsCurrent = (
  groupId,
  emails,
  { allowRoleChange = false, failOnStatusCode = true } = {}
) => {
  const list = Array.isArray(emails) ? emails : [emails];
  return cy.wrap(list).then(() => {
    const userIds = [];
    return cy
      .wrap(list)
      .each((email) =>
        apiGetUserIdByEmail(email).then((id) => {
          userIds.push(id);
        })
      )
      .then(() =>
        cy.getAuthHeaders().then((headers) =>
          cy.request({
            method: "POST",
            url: `${host()}/api/v2/group-permissions/${groupId}/users`,
            headers,
            body: { userIds, groupId, allowRoleChange },
            failOnStatusCode,
            log: false,
          })
        )
      );
  });
};

export const apiGetGroupMembers = (groupId) => {
  return cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "GET",
      url: `${host()}/api/v2/group-permissions/${groupId}/users`,
      headers,
      failOnStatusCode: false,
      log: false,
    })
  );
};

export const verifyGroupMembership = (groupId, email, shouldExist = true) => {
  return apiGetGroupMembers(groupId).then((res) => {
    const members = res.body || [];
    const found = members.some(
      (m) => m.email === email || m.user?.email === email
    );
    expect(found, `${email} membership in ${groupId}`).to.eq(shouldExist);
  });
};

export const apiGetVisibleGroups = () => {
  return cy.getAuthHeaders().then((headers) =>
    cy.request({
      method: "GET",
      url: `${host()}/api/v2/group-permissions`,
      headers,
      failOnStatusCode: false,
      log: false,
    })
  );
};


export const openCustomGroupAdminsTab = (groupName) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupAdminSelector.groupAdminsLink).should("be.visible").click();
  cy.wait(1000);
};

export const verifyGroupAdminsTabHidden = (groupName) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupAdminSelector.groupAdminsLink).should("not.exist");
};

export const verifyGroupAdminTabOrder = () => {
  cy.get(".nav-item.nav-link").then(($tabs) => {
    const order = [...$tabs].map((t) => t.getAttribute("data-cy"));
    const gaIndex = order.indexOf("group-admins-link");
    expect(order.indexOf("users-link")).to.be.lessThan(gaIndex);
    expect(gaIndex).to.be.lessThan(order.indexOf("permissions-link"));
    expect(order.indexOf("permissions-link")).to.be.lessThan(
      order.indexOf("granular-access-link")
    );
  });
};

export const verifyGroupAdminEmptyState = () => {
  cy.get(groupAdminSelector.adminEmptyPageIcon).should("be.visible");
  cy.get(groupAdminSelector.adminEmptyPageTitle).verifyVisibleElement(
    "have.text",
    groupAdminText.emptyStateTitle
  );
  cy.get(groupAdminSelector.adminEmptyPageInfoText).should(
    "contain.text",
    groupAdminText.emptyStateInfo
  );
};


export const assignGroupAdminViaUI = (groupName, email) => {
  openCustomGroupAdminsTab(groupName);
  cy.get(groupAdminSelector.adminMultiSelectInput).clear().type(email);
  cy.wait(1500);
  cy.get(
    `${groupAdminSelector.adminMultiSelectSearch} .select-search__row .item-renderer [type="checkbox"]`
  )
    .eq(0)
    .check();
  cy.get(groupAdminSelector.assignGroupAdminButton).should("be.enabled").click();
  cy.verifyToastMessage(commonSelectors.toastMessage, groupAdminText.assignedToast);
};

export const verifyAdminInGroupAdminsList = (email) => {
  cy.get(groupAdminSelector.adminUserRow(email)).should("exist");
};

export const revokeGroupAdminViaUI = (groupName, email) => {
  openCustomGroupAdminsTab(groupName);
  cy.get(groupAdminSelector.adminUserRow(email))
    .find(groupAdminSelector.revokeButton)
    .click();
  cy.verifyToastMessage(commonSelectors.toastMessage, groupAdminText.removedToast);
  cy.get(groupAdminSelector.adminUserRow(email)).should("not.exist");
};

export const verifyUserAssignable = (email) => {
  cy.get(groupAdminSelector.adminMultiSelectInput).clear().type(email);
  cy.wait(1000);
  cy.get(groupAdminSelector.adminMultiSelectSearch).within(() => {
    cy.contains(".item-renderer", email).should("exist");
  });
  cy.get(groupAdminSelector.adminMultiSelectInput).clear();
};

export const verifyUserNotAssignable = (email) => {
  cy.get(groupAdminSelector.adminMultiSelectInput).clear().type(email);
  cy.wait(1000);
  cy.get(groupAdminSelector.adminMultiSelectSearch).within(() => {
    cy.contains(".item-renderer", email).should("not.exist");
  });
  cy.get(groupAdminSelector.adminMultiSelectInput).clear();
};


export const verifyGroupAdminCannotManageAdmins = (groupName) => {
  openCustomGroupAdminsTab(groupName);
  cy.get(groupAdminSelector.adminMultiSelectSearch).should("not.exist");
  cy.get(groupAdminSelector.assignGroupAdminButton).should("not.exist");
  cy.get(groupAdminSelector.revokeButton).should("not.exist");
};


export const addMemberExpectRoleChangeModal = (groupName, email, { adminLine = false } = {}) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.clearAndType(groupsSelector.multiSelectSearchInput, email);
  cy.wait(2000);
  cy.get('.select-search__row .item-renderer [type="checkbox"]').eq(0).check();
  cy.get(groupsSelector.addUserButton).click();
  cy.contains(groupAdminText.cannotAddEndUserTitle).should("be.visible");
  if (adminLine) {
    cy.contains(groupAdminText.adminOnlyRoleChange).should("be.visible");
  } else {
    cy.contains(groupAdminText.adminOnlyRoleChange).should("not.exist");
  }
  cy.reload();
  cy.wait(500);
};


export const assignMultipleGroupAdminsViaUI = (groupName, emails) => {
  openCustomGroupAdminsTab(groupName);
  emails.forEach((email) => {
    cy.get(groupAdminSelector.adminMultiSelectInput).clear().type(email);
    cy.wait(1500);
    cy.get(
      `${groupAdminSelector.adminMultiSelectSearch} .select-search__row .item-renderer [type="checkbox"]`
    )
      .eq(0)
      .check();
  });
  cy.get(groupAdminSelector.assignGroupAdminButton).should("be.enabled").click();
  cy.verifyToastMessage(commonSelectors.toastMessage, groupAdminText.assignedToast);
  emails.forEach((email) =>
    cy.get(groupAdminSelector.adminUserRow(email)).should("exist")
  );
};

export const removeGroupMemberViaUI = (groupName, email) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupsSelector.usersLink).click();
  cy.get(groupsSelector.userRow(email))
    .find(groupAdminSelector.revokeButton)
    .click();
  cy.verifyToastMessage(commonSelectors.toastMessage, groupAdminText.memberRemovedToast);
  cy.get(groupsSelector.userRow(email)).should("not.exist");
};

export const verifyMemberInGroupUI = (groupName, email, shouldExist = true) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupsSelector.usersLink).click();
  cy.get(groupsSelector.userRow(email)).should(shouldExist ? "exist" : "not.exist");
};

export const verifyGroupAdminUsersTabHasNoRoleControls = (groupName, email) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupsSelector.usersLink).click();

  cy.get(`${groupsSelector.userRow(email)} > :nth-child(3)`).click({ force: true });
  cy.get(groupsSelector.changeRoleModalHeader).should("not.exist");
};

export const verifyGroupAdminHasNoGroupCrudControls = (groupName) => {
  cy.get(groupsSelector.createNewGroupButton).should("not.exist");

  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupsSelector.groupNameUpdateLink).should("not.exist");
  cy.get(groupsSelector.groupLink(groupName)).realHover();
  cy.get(groupsSelector.groupOptionIcon(groupName)).should("not.exist");
};

export const verifyGroupAdminPermissionTabsReadOnly = (groupName) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.get(groupAdminSelector.permissionsLink).should("be.visible");
  cy.get(groupAdminSelector.granularLink).should("be.visible");

  cy.get(groupAdminSelector.permissionsLink).click();
  verifyPermissionCheckboxesDisabled();
  cy.get(groupAdminSelector.granularLink).click();
  cy.get(groupsSelector.addPermissionButton).should("be.disabled");
};

const verifyPermissionCheckboxesDisabled = () => {
  permissions.forEach((selector) => {
    cy.get("body").then(($body) => {
      if ($body.find(selector).length) {
        cy.get(selector).should("be.disabled");
      }
    });
  });
};

export const verifyBuilderGADefaultGroupsReadOnly = () => {
  cy.get(groupAdminSelector.userRoleSectionTitle).should("be.visible");
  ["Admin", "Builder", "End-user"].forEach((defaultGroup) =>
    cy.get(groupsSelector.groupLink(defaultGroup)).should("be.visible")
  );

  cy.get(groupsSelector.groupLink("Builder")).click();
  cy.get(groupAdminSelector.permissionsLink).click();
  verifyPermissionCheckboxesDisabled();
};

export const verifyEndUserGASettingsNavScope = () => {
  cy.get(commonSelectors.manageGroupsOption).should("be.visible");
  cy.get(commonSelectors.manageUsersOption).should("not.exist");
  cy.get(commonSelectors.manageSSOOption).should("not.exist");
  cy.get(commonSelectors.themesOption).should("not.exist");
};

export const verifyRestrictedSettingsPagesRedirect = (workspaceSlug) => {
  const restricted = [
    "users",
    "workspace-login",
    "custom-styles",
    "configure-git",
    "themes",
  ];
  restricted.forEach((page) => {
    cy.visit(`${workspaceSlug}/workspace-settings/${page}`);
    cy.wait(1000);
    cy.url().should("not.include", `/workspace-settings/${page}`);
  });
};


export const verifyNoBuilderCapabilities = (workspaceSlug) => {
  cy.visit(workspaceSlug);
  cy.wait(2000);
  cy.get(commonSelectors.appCreateButton).should("not.exist");
  cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");
  cy.get(commonSelectors.databaseIcon).should("not.exist");
};


export const duplicateGroupWithAdminsViaUI = (groupName) => {
  openGroupThreeDotMenu(groupName);
  cy.get(groupsSelector.duplicateOption).click();
  cy.get(groupAdminSelector.groupAdminsCheckInput).check();
  cy.get(commonEeSelectors.confirmButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, groupAdminText.duplicatedToast);
};

export const verifyUsersTableGroupAdminColumn = (
  workspaceSlug,
  userName,
  groupName,
  shouldExist = true
) => {
  cy.visit(`${workspaceSlug}/workspace-settings/users`);
  cy.wait(1000);
  cy.get(groupsSelector.userRow(userName))
    .find('[data-name="role-header"]')
    .next("td")
    .within(() => {
      cy.contains(groupAdminSelector.groupChipCell, groupName).should(
        shouldExist ? "exist" : "not.exist"
      );
    });
};
