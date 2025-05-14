import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { commonSelectors } from "Selectors/common";
import { navigateToManageGroups } from "Support/utils/common";
import { cyParamName } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { onboardingSelectors } from "Selectors/onboarding";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { fillUserInviteForm } from "Support/utils/manageUsers";
import { navigateToManageUsers, logout } from "Support/utils/common";

export const manageGroupsElements = () => {
  cy.get('[data-cy="page-title"]').should(($el) => {
    expect($el.contents().last().text().trim()).to.eq("Groups");
  });

  cy.get('[data-cy="user-role-title"]').verifyVisibleElement(
    "have.text",
    "USER ROLE"
  );

  // Admin Permissions
  // Admin List Item Verification
  cy.verifyElement(groupsSelector.adminListItem, "Admin");
  cy.verifyElement(groupsSelector.adminTitle, "Admin (1)");

  // Group Permission Elements Verification
  cy.verifyElement(
    groupsSelector.createNewGroupButton,
    groupsText.createNewGroupButton
  );
  cy.verifyElement(groupsSelector.usersLink, groupsText.usersLink);
  cy.verifyElement(groupsSelector.permissionsLink, groupsText.permissionsLink);
  cy.verifyElement(groupsSelector.granularLink, "Granular access");

  // Resource Verification
  cy.verifyElement(
    groupsSelector.textDefaultGroup,
    groupsText.textDefaultGroup
  );
  cy.verifyElement(
    groupsSelector.nameTableHeader,
    groupsText.userNameTableHeader
  );
  cy.verifyElement(
    groupsSelector.emailTableHeader,
    groupsText.emailTableHeader
  );

  // Permissions Page Navigation and Verifications
  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.helperTextAdminAppAccess)
    .eq(0)
    .verifyVisibleElement("have.text", groupsText.adminAccessHelperText);

  // Granular Access Verifications
  cy.verifyElement(groupsSelector.resourcesApps, groupsText.resourcesApps);
  cy.verifyElement(
    groupsSelector.permissionsTableHeader,
    groupsText.permissionsTableHeader
  );
  cy.get(groupsSelector.appsCreateCheck)
    .should("be.visible")
    .and("be.checked")
    .and("be.disabled");
  cy.verifyElement(groupsSelector.appsCreateLabel, groupsText.createLabel);
  cy.verifyElement(
    groupsSelector.appCreateHelperText,
    groupsText.appCreateHelperText
  );
  cy.get(groupsSelector.appsDeleteCheck)
    .should("be.visible")
    .and("be.checked")
    .and("be.disabled");
  cy.verifyElement(groupsSelector.appsDeleteLabel, groupsText.deleteLabel);
  cy.verifyElement(
    groupsSelector.appDeleteHelperText,
    groupsText.appDeleteHelperText
  );

  // Folder Permissions
  cy.verifyElement(
    groupsSelector.resourcesFolders,
    groupsText.resourcesFolders
  );
  cy.verifyElement(
    groupsSelector.foldersCreateLabel,
    groupsText.folderCreateLabel
  );
  cy.verifyElement(
    groupsSelector.foldersHelperText,
    groupsText.folderHelperText
  );
  cy.get(groupsSelector.foldersCreateCheck)
    .should("be.visible")
    .and("be.checked")
    .and("be.disabled");

  // Workspace Variable Permissions
  cy.verifyElement(
    groupsSelector.resourcesWorkspaceVar,
    groupsText.resourcesWorkspaceVar
  );
  cy.verifyElement(
    groupsSelector.workspaceCreateLabel,
    groupsText.workspaceCreateLabel
  );
  cy.verifyElement(
    groupsSelector.workspaceHelperText,
    groupsText.workspaceHelperText
  );
  cy.get(groupsSelector.workspaceVarCheckbox)
    .should("be.visible")
    .and("be.checked")
    .and("be.disabled");
  // Granular Permissions
  cy.get(groupsSelector.granularLink).click();
  cy.verifyElement(groupsSelector.nameTableHeader, groupsText.nameTableHeader);
  cy.verifyElement(
    groupsSelector.permissionsTableHeader,
    groupsText.granularAccessPermissionHeader
  );
  cy.verifyElement(
    `${groupsSelector.resourceHeader}:eq(1)`,
    groupsText.resourcesTableHeader
  );
  cy.verifyElement(groupsSelector.appsText, "  Apps");
  cy.get(groupsSelector.appEditRadio)
    .should("be.visible")
    .and("be.checked")
    .and("have.attr", "disabled");
  cy.verifyElement(groupsSelector.appEditLabel, groupsText.appEditLabelText);
  cy.verifyElement(
    groupsSelector.appEditHelperText,
    groupsText.appEditHelperText
  );
  cy.get(groupsSelector.appViewRadio)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.verifyElement(groupsSelector.appViewLabel, groupsText.appViewLabel);
  cy.verifyElement(
    groupsSelector.appViewHelperText,
    groupsText.appViewHelperText
  );
  cy.get(groupsSelector.appHideCheckbox).should("be.visible");
  cy.verifyElement(
    groupsSelector.appHideHelperText,
    groupsText.appHideHelperText
  );
  cy.verifyElement(groupsSelector.addAppButton, groupsText.addButton);
  cy.get(groupsSelector.addAppButton).should("be.disabled");

  //Builder
  cy.get(groupsSelector.groupLink("Builder")).click();
  cy.verifyElement(groupsSelector.builderListItem, "Builder");
  cy.verifyElement(groupsSelector.builderTitle, "Builder (0)");

  // Group Permission Elements Verification
  cy.verifyElement(
    groupsSelector.createNewGroupButton,
    groupsText.createNewGroupButton
  );
  cy.verifyElement(groupsSelector.usersLink, groupsText.usersLink);
  cy.verifyElement(groupsSelector.permissionsLink, groupsText.permissionsLink);
  cy.verifyElement(groupsSelector.granularLink, "Granular access");

  // Resource Verification
  cy.verifyElement(
    groupsSelector.textDefaultGroup,
    groupsText.textDefaultGroup
  );
  cy.get(groupsSelector.usersLink).click();
  cy.verifyElement(
    groupsSelector.nameTableHeader,
    groupsText.userNameTableHeader
  );
  cy.verifyElement(
    groupsSelector.emailTableHeader,
    groupsText.emailTableHeader
  );
  cy.get(groupsSelector.userEmptyPageIcon).should("be.visible");
  cy.get(groupsSelector.userEmptyPageTitle).verifyVisibleElement(
    "have.text",
    groupsText.userEmptyPageTitle
  );
  cy.get(groupsSelector.userEmptyPageHelperText).verifyVisibleElement(
    "have.text",
    groupsText.userEmptyPageHelperText
  );

  // Granular Access Verifications
  cy.get(groupsSelector.permissionsLink).click();
  cy.verifyElement(groupsSelector.resourcesApps, groupsText.resourcesApps);
  cy.verifyElement(
    groupsSelector.permissionsTableHeader,
    groupsText.permissionsTableHeader
  );

  cy.get(groupsSelector.appsCreateCheck).should("be.visible").and("be.checked");
  cy.verifyElement(groupsSelector.appsCreateLabel, groupsText.createLabel);
  cy.verifyElement(
    groupsSelector.appCreateHelperText,
    groupsText.appCreateHelperText
  );
  toggleCheckbox(
    groupsSelector.appsCreateCheck,
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  cy.get(groupsSelector.appsDeleteCheck).should("be.visible").and("be.checked");
  cy.verifyElement(groupsSelector.appsDeleteLabel, groupsText.deleteLabel);
  cy.verifyElement(
    groupsSelector.appDeleteHelperText,
    groupsText.appDeleteHelperText
  );
  toggleCheckbox(
    groupsSelector.appsDeleteCheck,
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  // Folder Permissions
  cy.verifyElement(
    groupsSelector.resourcesFolders,
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck)
    .should("be.visible")
    .and("be.checked");
  cy.verifyElement(
    groupsSelector.foldersCreateLabel,
    groupsText.folderCreateLabel
  );
  cy.verifyElement(
    groupsSelector.foldersHelperText,
    groupsText.folderHelperText
  );
  toggleCheckbox(
    groupsSelector.foldersCreateCheck,
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  // Workspace Variable Permissions
  cy.verifyElement(
    groupsSelector.resourcesWorkspaceVar,
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox)
    .should("be.visible")
    .and("be.checked");
  cy.verifyElement(
    groupsSelector.workspaceCreateLabel,
    groupsText.workspaceCreateLabel
  );
  cy.verifyElement(
    groupsSelector.workspaceHelperText,
    groupsText.workspaceHelperText
  );
  toggleCheckbox(
    groupsSelector.workspaceVarCheckbox,
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  // Granular Permissions
  cy.get(groupsSelector.granularLink).click();

  cy.verifyElement(groupsSelector.nameTableHeader, groupsText.nameTableHeader);
  cy.verifyElement(
    groupsSelector.permissionsTableHeader,
    groupsText.granularAccessPermissionHeader
  );
  cy.verifyElement(
    `${groupsSelector.resourceHeader}:eq(1)`,
    groupsText.resourcesTableHeader
  );
  cy.verifyElement(groupsSelector.appsText, groupsText.appsLink);
  cy.get(groupsSelector.appEditRadio)
    .should("be.visible")
    .and("be.checked")
    .and("be.enabled");
  cy.verifyElement(groupsSelector.appEditLabel, groupsText.appEditLabelText);
  cy.verifyElement(
    groupsSelector.appEditHelperText,
    groupsText.appEditHelperText
  );
  cy.get(groupsSelector.appViewRadio).should("be.visible").and("be.enabled");
  cy.verifyElement(groupsSelector.appViewLabel, groupsText.appViewLabel);
  cy.verifyElement(
    groupsSelector.appViewHelperText,
    groupsText.appViewHelperText
  );
  cy.get(groupsSelector.appHideCheckbox)
    .should("be.visible")
    .and("be.disabled");
  cy.verifyElement(
    groupsSelector.appHideLabel,
    groupsText.appHideLabelPermissionModal
  );
  cy.verifyElement(
    groupsSelector.appHideHelperText,
    groupsText.appHideHelperText
  );

  cy.get(groupsSelector.granularAccessPermission)
    .trigger("mouseenter")
    .click({ force: true });
  cy.get(".modal-base").should("be.visible");
  cy.get(groupsSelector.deletePermissionIcon)
    .should("be.visible")
    .and("be.enabled");
  cy.get(groupsSelector.deletePermissionIcon).click();
  cy.get(".confirm-dialogue-modal").should("be.visible");
  cy.verifyElement(groupsSelector.deleteMessage, groupsText.deleteMessage);
  cy.get(groupsSelector.yesButton).should("be.visible").and("be.enabled");
  cy.get(groupsSelector.cancelButton).should("be.visible").and("be.enabled");
  cy.contains("Cancel").click();
  cy.get(groupsSelector.granularAccessPermission)
    .trigger("mouseenter")
    .click({ force: true });
  cy.verifyElement(
    `${groupsSelector.addEditPermissionModalTitle}:eq(2)`,
    groupsText.editPermissionModalTitle
  );
  permissionModal();

  cy.get(groupsSelector.customradio).should("be.visible").should("be.disabled");
  cy.verifyElement(groupsSelector.customLabel, groupsText.customLabel);
  cy.verifyElement(
    groupsSelector.customHelperText,
    groupsText.customHelperText
  );

  cy.verifyElement(groupsSelector.confimButton, groupsText.updateButtonText);
  cy.get(groupsSelector.confimButton).should("be.disabled");
  cy.verifyElement(groupsSelector.cancelButton, groupsText.cancelButton);
  cy.get(groupsSelector.cancelButton).click();

  //Add modal
  cy.verifyElement(groupsSelector.addAppButton, groupsText.addButton);
  cy.get(groupsSelector.addAppButton)
    .should("be.visible")
    .and("be.enabled")
    .click();
  cy.verifyElement(
    `${groupsSelector.addEditPermissionModalTitle}:eq(2)`,
    groupsText.addPermissionModalTitle
  );
  permissionModal();
  cy.get(groupsSelector.customradio).should("be.visible").should("be.disabled");
  cy.verifyElement(groupsSelector.customLabel, groupsText.customLabel);
  cy.verifyElement(
    groupsSelector.customHelperText,
    groupsText.customHelperText
  );
  cy.verifyElement(groupsSelector.confimButton, groupsText.addButtonText);
  cy.get(groupsSelector.confimButton).should("be.disabled");
  cy.verifyElement(groupsSelector.cancelButton, groupsText.cancelButton);
  cy.get(groupsSelector.cancelButton).click();

  //End User

  cy.get(groupsSelector.groupLink("End-user")).click();
  cy.get(groupsSelector.groupLink("End-user")).verifyVisibleElement(
    "have.text",
    "End-user"
  );

  cy.get(groupsSelector.enduserTitle).verifyVisibleElement(
    "have.text",
    "End-user (0)"
  );

  cy.verifyElement(
    groupsSelector.createNewGroupButton,
    groupsText.createNewGroupButton
  );
  cy.verifyElement(groupsSelector.usersLink, groupsText.usersLink);
  cy.verifyElement(groupsSelector.permissionsLink, groupsText.permissionsLink);
  cy.verifyElement(groupsSelector.granularLink, "Granular access");

  // Resource Verification
  cy.verifyElement(
    groupsSelector.textDefaultGroup,
    groupsText.textDefaultGroup
  );
  cy.get(groupsSelector.usersLink).click();
  cy.verifyElement(
    groupsSelector.nameTableHeader,
    groupsText.userNameTableHeader
  );
  cy.verifyElement(
    groupsSelector.emailTableHeader,
    groupsText.emailTableHeader
  );
  cy.get(groupsSelector.userEmptyPageIcon).should("be.visible");
  cy.get(groupsSelector.userEmptyPageTitle).verifyVisibleElement(
    "have.text",
    groupsText.userEmptyPageTitle
  );
  cy.get(groupsSelector.userEmptyPageHelperText).verifyVisibleElement(
    "have.text",
    groupsText.userEmptyPageHelperText
  );

  // Granular Access Verifications
  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.helperTextAdminAppAccess)
    .eq(0)
    .verifyVisibleElement("have.text", groupsText.enduserAccessHelperText);
  cy.verifyElement(groupsSelector.resourcesApps, groupsText.resourcesApps);
  cy.verifyElement(
    groupsSelector.permissionsTableHeader,
    groupsText.permissionsTableHeader
  );

  cy.get(groupsSelector.appsCreateCheck)
    .should("be.visible")
    .and("not.be.checked")
    .and("be.disabled");
  cy.verifyElement(groupsSelector.appsCreateLabel, groupsText.createLabel);
  cy.verifyElement(
    groupsSelector.appCreateHelperText,
    groupsText.appCreateHelperText
  );
  cy.get(groupsSelector.appsDeleteCheck)
    .should("be.visible")
    .and("not.be.checked")
    .and("be.disabled");
  cy.verifyElement(groupsSelector.appsDeleteLabel, groupsText.deleteLabel);
  cy.verifyElement(
    groupsSelector.appDeleteHelperText,
    groupsText.appDeleteHelperText
  );

  // Folder Permissions
  cy.verifyElement(
    groupsSelector.resourcesFolders,
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck)
    .should("be.visible")
    .and("not.be.checked")
    .and("be.disabled");
  cy.verifyElement(
    groupsSelector.foldersCreateLabel,
    groupsText.folderCreateLabel
  );
  cy.verifyElement(
    groupsSelector.foldersHelperText,
    groupsText.folderHelperText
  );

  // Workspace Variable Permissions
  cy.verifyElement(
    groupsSelector.resourcesWorkspaceVar,
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox)
    .should("be.visible")
    .and("not.be.checked")
    .and("be.disabled");
  cy.verifyElement(
    groupsSelector.workspaceCreateLabel,
    groupsText.workspaceCreateLabel
  );
  cy.verifyElement(
    groupsSelector.workspaceHelperText,
    groupsText.workspaceHelperText
  );

  // Granular Permissions
  cy.get(groupsSelector.granularLink).click();
  cy.verifyElement(groupsSelector.nameTableHeader, groupsText.nameTableHeader);
  cy.verifyElement(
    groupsSelector.permissionsTableHeader,
    groupsText.granularAccessPermissionHeader
  );
  cy.verifyElement(
    `${groupsSelector.resourceHeader}:eq(1)`,
    groupsText.resourcesTableHeader
  );
  cy.verifyElement(groupsSelector.appsText, groupsText.appsLink);
  cy.get(groupsSelector.appEditRadio)
    .should("be.visible")
    .and("not.be.checked")
    .and("be.disabled");
  cy.verifyElement(groupsSelector.appEditLabel, groupsText.appEditLabelText);
  cy.verifyElement(
    groupsSelector.appEditHelperText,
    groupsText.appEditHelperText
  );
  cy.get(groupsSelector.appViewRadio)
    .should("be.visible")
    .and("be.disabled")
    .and("be.checked");
  cy.verifyElement(groupsSelector.appViewLabel, groupsText.appViewLabel);
  cy.verifyElement(
    groupsSelector.appViewHelperText,
    groupsText.appViewHelperText
  );
  cy.get(groupsSelector.appHideCheckbox).should("be.visible").and("be.enabled");
  cy.verifyElement(
    groupsSelector.appHideLabel,
    groupsText.appHideLabelPermissionModal
  );
  cy.verifyElement(
    groupsSelector.appHideHelperText,
    groupsText.appHideHelperText
  );

  cy.get(groupsSelector.granularAccessPermission)
    .trigger("mouseenter")
    .click({ force: true });
  cy.get(".modal-base").should("be.visible");
  cy.get(groupsSelector.deletePermissionIcon)
    .should("be.visible")
    .and("be.enabled");
  cy.get(groupsSelector.deletePermissionIcon).click();
  cy.get(".confirm-dialogue-modal").should("be.visible");
  cy.verifyElement(groupsSelector.deleteMessage, groupsText.deleteMessage);
  cy.get(groupsSelector.yesButton).should("be.visible").and("be.enabled");
  cy.get(groupsSelector.cancelButton).should("be.visible").and("be.enabled");
  cy.contains("Cancel").click();
  cy.get(groupsSelector.granularAccessPermission)
    .trigger("mouseenter")
    .click({ force: true });
  cy.verifyElement(
    `${groupsSelector.addEditPermissionModalTitle}:eq(2)`,
    groupsText.editPermissionModalTitle
  );
  permissionModal();

  cy.get(groupsSelector.customradio).should("be.visible").should("be.disabled");
  cy.verifyElement(groupsSelector.customLabel, groupsText.customLabel);
  cy.verifyElement(
    groupsSelector.customHelperText,
    groupsText.customHelperText
  );

  cy.verifyElement(groupsSelector.confimButton, groupsText.updateButtonText);
  cy.get(groupsSelector.confimButton).should("be.disabled");
  cy.verifyElement(groupsSelector.cancelButton, groupsText.cancelButton);
  cy.get(groupsSelector.cancelButton).click();
  //Add Modal
  cy.verifyElement(groupsSelector.addAppButton, groupsText.addButton);
  cy.get(groupsSelector.addAppButton)
    .should("be.visible")
    .and("be.enabled")
    .click();
  cy.verifyElement(
    `${groupsSelector.addEditPermissionModalTitle}:eq(2)`,
    groupsText.addPermissionModalTitle
  );
  permissionModal();
  cy.get(groupsSelector.customradio).should("be.visible").should("be.disabled");
  cy.verifyElement(groupsSelector.customLabel, groupsText.customLabel);
  cy.verifyElement(
    groupsSelector.customHelperText,
    groupsText.customHelperText
  );
  cy.verifyElement(groupsSelector.confimButton, groupsText.addButtonText);
  cy.get(groupsSelector.confimButton).should("be.disabled");
  cy.verifyElement(groupsSelector.cancelButton, groupsText.cancelButton);
  cy.get(groupsSelector.cancelButton).click();
};

const toggleCheckbox = (selector, toastSelector, toastMessage) => {
  cy.get(selector).should("be.visible").uncheck();
  cy.verifyToastMessage(toastSelector, toastMessage);
  cy.get(selector).check();
  cy.verifyToastMessage(toastSelector, toastMessage);
};

// Permission Modal Verification
export const permissionModal = () => {
  cy.verifyElement(
    groupsSelector.permissionNameLabel,
    groupsText.permissionNameLabel
  );
  cy.verifyElement(
    groupsSelector.permissionNameHelperText,
    groupsText.permissionNameHelperText
  );

  cy.verifyElement(groupsSelector.permissionLabel, groupsText.permissionLabel);
  cy.verifyElement(
    groupsSelector.editPermissionLabel,
    groupsText.editPermissionLabel
  );
  cy.verifyElement(
    groupsSelector.editPermissionHelperText,
    groupsText.editPermissionHelperText
  );

  cy.verifyElement(
    groupsSelector.viewPermissionLabel,
    groupsText.viewPermissionLabel
  );
  cy.verifyElement(
    groupsSelector.viewPermissionHelperText,
    groupsText.viewPermissionHelperText
  );

  cy.get(groupsSelector.hidePermissionInput).should("be.visible");
  cy.verifyElement(groupsSelector.resourceLabel, groupsText.resourcesheader);
  cy.get(groupsSelector.resourceContainer).should("be.visible");
  cy.get(groupsSelector.allAppsRadio).should("be.visible").and("be.checked");
  cy.verifyElement(groupsSelector.allAppsLabel, groupsText.allAppsLabel);
  cy.verifyElement(
    groupsSelector.allAppsHelperText,
    groupsText.allAppsHelperText
  );
};

export const addAppToGroup = (appName) => {
  cy.get(groupsSelector.appsLink).click();
  cy.wait(500);
  cy.get(groupsSelector.appSearchBox).realClick();
  cy.wait(500);
  cy.get(groupsSelector.searchBoxOptions).contains(appName).click();
  cy.get(groupsSelector.selectAddButton).click();
  cy.contains("tr", appName)
    .parent()
    .within(() => {
      cy.get("td input").eq(1).check();
    });
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "App permissions updated"
  );
};

export const createGroupAddAppAndUserToGroup = (groupName, email) => {
  let groupId;

  cy.getCookie("tj_auth_token").then((cookie) => {
    const headers = {
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
      "Content-Type": "application/json",
    };

    cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/v2/group-permissions`,
      headers: headers,
      body: {
        name: groupName,
      },
    }).then((response) => {
      expect(response.status).to.equal(201);
      groupId = response.body.id;
      cy.wrap(groupId).as("groupId");

      cy.request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}/granular-permissions`,
        headers: headers,
        body: {
          name: "Apps",
          type: "app",
          groupId: groupId,
          isAll: false,
          createResourcePermissionObject: {
            canEdit: true,
            canView: false,
            hideFromDashboard: false,
            resourcesToAdd: [
              {
                appId: Cypress.env("appId"),
              },
            ],
          },
        },

      }).then((response) => {
        expect(response.status).to.equal(201);
      });

      cy.wait(2000);
      cy.task("dbConnection", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from users where email='${email}';`,
      }).then((resp) => {
        const userId = resp.rows[0].id;
        cy.log(userId);

        cy.request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions/${groupId}/users`,
          headers: headers,
          body: {
            userIds: [userId],
            groupId: groupId,
          },
        }).then((response) => {
          expect(response.status).to.equal(201);
        });
      });
    });
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
}

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

export const duplicateGroup = () => {
  OpenGroupCardOption(groupName);
  cy.get(groupsSelector.duplicateOption).click();
};

export const updateRoleUI = (user, role, email, message) => {
  cy.get(groupsSelector.groupLink(user)).click();
  cy.get(groupsSelector.usersLink).click();
  cy.get(`[data-cy="${email}-user-row"] > :nth-child(3)`).click();
  cy.get('[data-cy="modal-title"] > .tj-text-md').should(
    "have.text",
    "Edit user role"
  );
  cy.get('[data-cy="user-email"]').should("have.text", email);
  cy.get(groupsSelector.userRoleLabel).should("have.text", groupsText.userRole);
  cy.get(groupsSelector.warningText).should(
    "have.text",
    groupsText.warningText
  );
  cy.get(groupsSelector.cancelButton)
    .should("have.text", groupsText.cancelButton)
    .and("be.enabled");
  cy.get(groupsSelector.confimButton).should("be.disabled");
  cy.get(
    ".css-nwhe5y-container > .react-select__control > .react-select__value-container"
  )
    .click()
    .type(`${role}{enter}`);
  cy.get(groupsSelector.confimButton)
    .should("be.enabled")
    .and("have.text", groupsText.continueButtonText)
    .click();
  cy.get('[data-cy="modal-body"]').should("have.text", message);
  cy.get(groupsSelector.cancelButton).click();
  cy.get(`[data-cy="${email}-user-row"] > :nth-child(3)`).click();
  cy.get(
    ".css-nwhe5y-container > .react-select__control > .react-select__value-container"
  )
    .click()
    .type(`${role}{enter}`);
  cy.get(groupsSelector.confimButton)
    .should("be.enabled")
    .and("have.text", groupsText.continueButtonText)
    .click();
  cy.get(groupsSelector.confimButton).click();
  if (user != "Admin") {
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.roleUpdateToastMessage
    );
  }
  cy.get(groupsSelector.groupLink(role)).click();
  cy.get(`[data-cy="${email}-user-row"]`).should("exist");
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
}

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
};

export const verifyBasicPermissions = (canCreate = true) => {
  cy.get(commonSelectors.dashboardAppCreateButton).should(
    canCreate ? "be.enabled" : "be.disabled"
  );
};

export const setupWorkspaceAndInviteUser = (workspaceName, workspaceSlug, firstName, email, role = "end-user") => {
  cy.apiCreateWorkspace(workspaceName, workspaceSlug);
  cy.visit(workspaceSlug);
  cy.wait(1000);
  navigateToManageUsers();
  inviteUserBasedOnRole(firstName, email, role);
  cy.wait(2000);
};

export const verifySettingsAccess = (shouldExist = true) => {
  cy.get(commonSelectors.settingsIcon).click();
  cy.get(commonSelectors.workspaceSettings).should(
    shouldExist ? "exist" : "not.exist"
  );
};

export const verifyUserPrivileges = (expectedButtonState, shouldHaveWorkspaceSettings) => {
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