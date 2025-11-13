import { commonSelectors, cyParamName } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { usersSelector } from "Selectors/manageUsers";
import { onboardingSelectors } from "Selectors/onboarding";
import { navigateToManageGroups } from "Support/utils/common";
import { getUser } from "Support/utils/externalApi";
import {
  fetchAndVisitInviteLink,
  fillUserInviteForm,
} from "Support/utils/manageUsers";
import { groupsText } from "Texts/manageGroups";

export const apiCreateGroup = (groupName, cachedHeaders = false) => {
  return cy.getAuthHeaders(cachedHeaders).then((headers) => {
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
        headers: headers,
        body: { name: groupName },
        log: false
      })
      .then((response) => {
        expect(response.status).to.equal(201);
        Cypress.log({ name: "Create group :", message: ` ${groupName}` });
        return response.body.id; // Returns the group ID as resolved value
      });
  });
};

export const apiDeleteGroup = (groupName, cachedHeaders = false) => {
  cy.apiGetGroupId(groupName).then((groupId) => {
    cy.getAuthHeaders(cachedHeaders).then((headers) => {
      cy.request({
        method: "DELETE",
        url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}`,
        headers: headers,
      }).then((response) => {
        expect(response.status).to.equal(200);
      });
    });
  });
};

export const deleteGroup = (groupName, workspaceId) => {
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `DELETE FROM permission_groups WHERE name='${groupName}' AND organization_id='${workspaceId}';`,
  });
};

export const OpenGroupCardOption = (groupName) => {
  cy.get(groupsSelector.groupLink(groupName))
    .trigger("mouseenter")
    .trigger("mouseover")
    .then(() => {
      cy.wait(2000).then(() => {
        cy.get(
          `[data-cy="${cyParamName(
            groupName
          )}-list-item"] > :nth-child(2) > .tj-base-btn`
        ).click({ force: true });
      });
    });
};

export const duplicateMultipleGroups = (groupNames) => {
  groupNames.forEach((groupName) => {
    OpenGroupCardOption(groupName);
    cy.wait(2000);
    cy.get(commonSelectors.duplicateOption).click(); // Click on the duplicate option
    cy.get(commonSelectors.confirmDuplicateButton).click(); // Confirm duplication if needed
  });
};

export const verifyGroupCardOptions = (groupName) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  OpenGroupCardOption(groupName);
  cy.get(groupsSelector.duplicateOption).verifyVisibleElement(
    "have.text",
    "Duplicate group"
  );
  cy.get(groupsSelector.deleteGroupOption).verifyVisibleElement(
    "have.text",
    groupsText.deleteGroupButton
  );
};

export const groupPermission = (
  fieldsToCheckOrUncheck,
  groupName = "Admin",
  shouldCheck = false
) => {
  navigateToManageGroups();
  cy.get(groupsSelector.groupLink(groupName));
  cy.get(groupsSelector.permissionsLink).click();

  fieldsToCheckOrUncheck.forEach((field) => {
    const selector = groupsSelector[field];
    cy.get(selector).then(($el) => {
      if ($el.is(":checked") !== shouldCheck) {
        if (shouldCheck) {
          cy.get(selector).check();
        } else {
          // cy.get(selector).uncheck();
        }
      }
    });
  });
};

export const updateRole = (user, role, email, message = null) => {
  cy.get(groupsSelector.groupLink(user)).click();
  cy.get(groupsSelector.usersLink).click();
  cy.get(`[data-cy="${email}-user-row"] > :nth-child(3)`).click();
  cy.get(
    ".css-nwhe5y-container > .react-select__control > .react-select__value-container"
  )
    .click()
    .type(`${role}{enter}`);
  cy.get(groupsSelector.confimButton).click();
  if (message) {
    cy.get('[data-cy="modal-body"]').should("have.text", message);
  }
  cy.get(groupsSelector.confimButton).click();
  if (user != "Admin") {
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.roleUpdateToastMessage
    );
  }
  cy.wait(2000);
  cy.get(groupsSelector.groupLink(role)).click();
  cy.get(`[data-cy="${email}-user-row"]`).should("exist");
};

export const createGroupsAndAddUserInGroup = (groupName, email) => {
  cy.get(groupsSelector.createNewGroupButton).click();
  cy.clearAndType(groupsSelector.groupNameInput, groupName);
  cy.get(groupsSelector.createGroupButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.groupCreatedToast
  );
  addUserInGroup(groupName, email);
};

export const addUserInGroup = (groupName, email) => {
  cy.get(groupsSelector.groupLink(groupName)).click();
  cy.clearAndType(groupsSelector.multiSelectSearchInput, email);
  cy.wait(2000);
  cy.get('.select-search__row .item-renderer [type="checkbox"]').eq(0).check();
  cy.get(groupsSelector.addUserButton).should("be.enabled").click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.userAddedToast
  );
};

export const inviteUserBasedOnRole = (firstName, email, role = "end-user") => {
  fillUserInviteForm(firstName, email);

  cy.get(".css-1mlj61j").type(`${role}{enter}`);
  cy.get(usersSelector.buttonInviteUsers).click();
  cy.wait(500);

  fetchAndVisitInviteLink(email);
  cy.wait(2000);

  cy.get(onboardingSelectors.loginPasswordInput).should("be.visible");
  cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
  cy.get(commonSelectors.continueButton).click();
  cy.wait(500);
  cy.get(commonSelectors.acceptInviteButton).click();
  cy.wait(500);
  cy.get(commonSelectors.dashboardIcon).click();
};

export const setupWorkspaceAndInviteUser = (
  workspaceName,
  workspaceSlug,
  firstName,
  email,
  role = "end-user"
) => {
  cy.apiCreateWorkspace(workspaceName, workspaceSlug).then((workspace) => {
    Cypress.env("workspaceId", workspace.body.organization_id);
  });

  cy.apiFullUserOnboarding(firstName, email, role, "password", workspaceName);
  cy.apiLogout();

  cy.apiLogin(email, "password");
  cy.visit(workspaceSlug);
  cy.wait(2000);
};

export const verifyUserPrivileges = (
  expectedButtonState,
  shouldHaveWorkspaceSettings
) => {
  cy.get(commonSelectors.dashboardAppCreateButton).should(expectedButtonState);
  cy.get(commonSelectors.settingsIcon).click();

  if (shouldHaveWorkspaceSettings) {
    cy.get(commonSelectors.workspaceSettings).should("exist");
  } else {
    cy.get(commonSelectors.workspaceSettings).should("not.exist");
  }
};

export const setupAndUpdateRole = (currentRole, endRole, email) => {
  navigateToManageGroups();
  updateRole(currentRole, endRole, email);
  cy.wait(1000);
  cy.apiLogout();
};

export const verifyUserRole = (userIdAlias, expectedRole, expectedGroups) => {
  cy.get(userIdAlias).then((userId) => {
    getUser(userId).then((response) => {
      const groupNames = response.body.userGroups.map((g) => g.name);
      if (expectedGroups) {
        expectedGroups.forEach((group) => expect(groupNames).to.include(group));
      }
      const roleName = response.body.workspaces[0].userPermission.name;
      expect(roleName).to.equal(expectedRole);
    });
  });
};

export const apiAddUserToGroup = (groupId, email) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy.apiGetUserDetails(email).then((response) => {
      const userId = response.body.users.find((u) => u.email === email).user_id;
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}/users`,
          headers: headers,
          body: {
            userIds: [userId],
            groupId: groupId,
          },
          log: false,
        })
        .then((addResponse) => {
          expect(addResponse.status).to.equal(201);
          return userId;
        });
    });
  });
};
