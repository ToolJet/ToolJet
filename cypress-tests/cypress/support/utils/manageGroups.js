import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import {
  navigateToAllUserGroup,
  createGroup,
  navigateToManageGroups,
} from "Support/utils/common";
import { cyParamName } from "Selectors/common";

export const manageGroupsElements = () => {
  cy.get('[data-cy="page-title"]').should(($el) => {
    expect($el.contents().last().text().trim()).to.eq("Groups");
  });

  cy.get('[data-cy="admin-list-item"]').verifyVisibleElement(
    "have.text",
    "Admin"
  );
  cy.get('[data-cy="user-role-title"]').verifyVisibleElement(
    "have.text",
    "USER ROLE"
  );
  cy.get('[data-cy="admin-title"]').verifyVisibleElement(
    "have.text",
    "Admin (1)"
  );

  cy.get(groupsSelector.groupLink("Admin")).verifyVisibleElement(
    "have.text",
    groupsText.admin
  );
  cy.get(groupsSelector.createNewGroupButton).verifyVisibleElement(
    "have.text",
    groupsText.createNewGroupButton
  );
  cy.get(groupsSelector.usersLink).verifyVisibleElement(
    "have.text",
    groupsText.usersLink
  );
  cy.get(groupsSelector.permissionsLink).verifyVisibleElement(
    "have.text",
    groupsText.permissionsLink
  );
  cy.get('[data-cy="granular-access-link"]').verifyVisibleElement(
    "have.text",
    "Granular access"
  );

  // cy.get(groupsSelector.appsLink).click();

  cy.get(groupsSelector.textDefaultGroup).verifyVisibleElement(
    "have.text",
    groupsText.textDefaultGroup
  );

  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.userNameTableHeader
  );
  cy.get(groupsSelector.emailTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.emailTableHeader
  );

  cy.get(groupsSelector.permissionsLink).click();
  cy.get('[data-cy="helper-text-admin-app-access"]')
    .eq(0)
    .verifyVisibleElement(
      "have.text",
      " Admin has edit access to all apps. These are not editableread documentation to know more !"
    );
  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );

  cy.get(groupsSelector.appsCreateCheck)
    .should("be.visible")
    .and("have.attr", "disabled");

  cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.createLabel
  );
  cy.get('[data-cy="app-create-helper-text"]').verifyVisibleElement(
    "have.text",
    "Create apps in this workspace"
  );
  cy.get(groupsSelector.appsDeleteCheck)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
    "have.text",
    groupsText.deleteLabel
  );
  cy.get('[data-cy="app-delete-helper-text"]').verifyVisibleElement(
    "have.text",
    "Delete any app in this workspace"
  );

  cy.get(groupsSelector.resourcesFolders).verifyVisibleElement(
    "have.text",
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get('[data-cy="folder-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on folders"
  );

  cy.get(groupsSelector.resourcesWorkspaceVar).verifyVisibleElement(
    "have.text",
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="workspace-constants-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on workspace constants"
  );

  cy.get('[data-cy="granular-access-link"]').click();
  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    "Name"
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    "Permission"
  );
  cy.get('[data-cy="resource-header"]:eq(1)').verifyVisibleElement(
    "have.text",
    "Resource"
  );
  cy.get('[data-cy="apps-text"]').verifyVisibleElement("have.text", "  Apps");
  cy.get('[data-cy="app-edit-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="app-edit-radio"]').should("be.checked");
  cy.get('[data-cy="app-edit-label"]').verifyVisibleElement(
    "have.text",
    "Edit"
  );
  cy.get('[data-cy="app-edit-helper-text"]').verifyVisibleElement(
    "have.text",
    "Access to app builder"
  );

  cy.get('[data-cy="app-view-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="app-view-label"]').verifyVisibleElement(
    "have.text",
    "View"
  );
  cy.get('[data-cy="app-view-helper-text"]').verifyVisibleElement(
    "have.text",
    "Only access released version of apps"
  );
  cy.get('[data-cy="app-hide-from-dashboard-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");

  cy.get(
    '[data-cy="app-hide-from-dashboard-helper-text"]'
  ).verifyVisibleElement("have.text", "App will be accessible by URL only");
  cy.get('[data-cy="group-chip"]').verifyVisibleElement(
    "have.text",
    "All apps"
  );
  cy.get('[data-cy="add-apps-buton"]').verifyVisibleElement(
    "have.text",
    "Add apps"
  );

  cy.get(groupsSelector.groupLink("Builder")).click();
  cy.get(groupsSelector.groupLink("Builder")).verifyVisibleElement(
    "have.text",
    "Builder"
  );

  cy.get('[data-cy="builder-title"]').verifyVisibleElement(
    "have.text",
    "Builder (1)"
  );

  cy.get(groupsSelector.createNewGroupButton).verifyVisibleElement(
    "have.text",
    groupsText.createNewGroupButton
  );
  cy.get(groupsSelector.usersLink).verifyVisibleElement(
    "have.text",
    groupsText.usersLink
  );
  cy.get(groupsSelector.permissionsLink).verifyVisibleElement(
    "have.text",
    groupsText.permissionsLink
  );
  cy.get('[data-cy="granular-access-link"]').verifyVisibleElement(
    "have.text",
    "Granular access"
  );
  cy.get(groupsSelector.usersLink).click();
  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.userNameTableHeader
  );
  cy.get(groupsSelector.emailTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.emailTableHeader
  );

  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.appsCreateCheck).should("be.visible").and("be.checked");
  cy.get(groupsSelector.appsCreateCheck).uncheck();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.appsCreateCheck).check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.createLabel
  );
  cy.get('[data-cy="app-create-helper-text"]').verifyVisibleElement(
    "have.text",
    "Create apps in this workspace"
  );
  cy.get(groupsSelector.appsDeleteCheck).should("be.visible").and("be.checked");
  cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
    "have.text",
    groupsText.deleteLabel
  );
  cy.get('[data-cy="app-delete-helper-text"]').verifyVisibleElement(
    "have.text",
    "Delete any app in this workspace"
  );

  cy.get(groupsSelector.appsDeleteCheck).uncheck();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.appsDeleteCheck).check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  cy.get(groupsSelector.resourcesFolders).verifyVisibleElement(
    "have.text",
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck)
    .should("be.visible")
    .and("be.checked");
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get('[data-cy="folder-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on folders"
  );
  cy.get(groupsSelector.foldersCreateCheck).uncheck();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.foldersCreateCheck).check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  cy.get(groupsSelector.resourcesWorkspaceVar).verifyVisibleElement(
    "have.text",
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox)
    .should("be.visible")
    .and("be.checked");
  cy.get('[data-cy="workspace-constants-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on workspace constants"
  );
  cy.get(groupsSelector.workspaceVarCheckbox).uncheck();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.workspaceVarCheckbox).check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );

  cy.get('[data-cy="granular-access-link"]').click();
  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    "Name"
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    "Permission"
  );
  cy.get('[data-cy="resource-header"]:eq(1)').verifyVisibleElement(
    "have.text",
    "Resource"
  );
  cy.get('[data-cy="apps-text"]').verifyVisibleElement("have.text", "  Apps");
  cy.get('[data-cy="app-edit-radio"]').should("be.visible").and("be.checked");
  cy.get('[data-cy="app-edit-label"]').verifyVisibleElement(
    "have.text",
    "Edit"
  );
  cy.get('[data-cy="app-edit-helper-text"]').verifyVisibleElement(
    "have.text",
    "Access to app builder"
  );

  cy.get('[data-cy="app-view-radio"]').should("be.visible");
  cy.get('[data-cy="app-view-label"]').verifyVisibleElement(
    "have.text",
    "View"
  );
  cy.get('[data-cy="app-view-helper-text"]').verifyVisibleElement(
    "have.text",
    "Only access released version of apps"
  );
  cy.get('[data-cy="app-hide-from-dashboard-radio"]').should("be.visible");

  cy.get(
    '[data-cy="app-hide-from-dashboard-helper-text"]'
  ).verifyVisibleElement("have.text", "App will be accessible by URL only");
  cy.get('[data-cy="group-chip"]').verifyVisibleElement(
    "have.text",
    "All apps"
  );
  cy.get('[data-cy="add-apps-buton"]').verifyVisibleElement(
    "have.text",
    "Add apps"
  );

  cy.get(groupsSelector.groupLink("End-user")).click();
  cy.get(groupsSelector.groupLink("End-user")).verifyVisibleElement(
    "have.text",
    "End-user"
  );

  cy.get('[data-cy="end-user-title"]').verifyVisibleElement(
    "have.text",
    "End-user (0)"
  );

  cy.get(groupsSelector.createNewGroupButton).verifyVisibleElement(
    "have.text",
    groupsText.createNewGroupButton
  );
  cy.get(groupsSelector.usersLink).verifyVisibleElement(
    "have.text",
    groupsText.usersLink
  );
  cy.get(groupsSelector.permissionsLink).verifyVisibleElement(
    "have.text",
    groupsText.permissionsLink
  );
  cy.get('[data-cy="granular-access-link"]').verifyVisibleElement(
    "have.text",
    "Granular access"
  );
  cy.get(groupsSelector.usersLink).click();
  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.userNameTableHeader
  );
  cy.get(groupsSelector.emailTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.emailTableHeader
  );

  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get(groupsSelector.resourcesApps).verifyVisibleElement(
    "have.text",
    groupsText.resourcesApps
  );
  cy.get(groupsSelector.appsCreateCheck)
    .should("be.visible")
    .and("have.attr", "disabled");

  cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.createLabel
  );
  cy.get('[data-cy="app-create-helper-text"]').verifyVisibleElement(
    "have.text",
    "Create apps in this workspace"
  );
  cy.get(groupsSelector.appsDeleteCheck)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
    "have.text",
    groupsText.deleteLabel
  );
  cy.get('[data-cy="app-delete-helper-text"]').verifyVisibleElement(
    "have.text",
    "Delete any app in this workspace"
  );

  cy.get(groupsSelector.resourcesFolders).verifyVisibleElement(
    "have.text",
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get('[data-cy="folder-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on folders"
  );

  cy.get(groupsSelector.resourcesWorkspaceVar).verifyVisibleElement(
    "have.text",
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox)
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="workspace-constants-helper-text"]').verifyVisibleElement(
    "have.text",
    "All operations on workspace constants"
  );

  cy.get('[data-cy="granular-access-link"]').click();
  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    "Name"
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    "Permission"
  );
  cy.get('[data-cy="resource-header"]:eq(1)').verifyVisibleElement(
    "have.text",
    "Resource"
  );
  cy.get('[data-cy="apps-text"]').verifyVisibleElement("have.text", "  Apps");
  cy.get('[data-cy="app-edit-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="app-edit-label"]').verifyVisibleElement(
    "have.text",
    "Edit"
  );
  cy.get('[data-cy="app-edit-helper-text"]').verifyVisibleElement(
    "have.text",
    "Access to app builder"
  );

  cy.get('[data-cy="app-view-radio"]')
    .should("be.visible")
    .and("have.attr", "disabled");
  cy.get('[data-cy="app-view-radio"]').should("be.checked");
  cy.get('[data-cy="app-view-label"]').verifyVisibleElement(
    "have.text",
    "View"
  );
  cy.get('[data-cy="app-view-helper-text"]').verifyVisibleElement(
    "have.text",
    "Only access released version of apps"
  );
  cy.get('[data-cy="app-hide-from-dashboard-radio"]').should("be.visible");

  cy.get(
    '[data-cy="app-hide-from-dashboard-helper-text"]'
  ).verifyVisibleElement("have.text", "App will be accessible by URL only");
  cy.get('[data-cy="group-chip"]').verifyVisibleElement(
    "have.text",
    "All apps"
  );
  cy.get('[data-cy="add-apps-buton"]').verifyVisibleElement(
    "have.text",
    "Add apps"
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

export const addUserToGroup = (groupName, email) => {
  cy.get(groupsSelector.usersLink).click();
  cy.get(".select-search__input").type(email);
  cy.get(".item-renderer").within(() => {
    cy.get("input").check();
  });
  cy.get(`[data-cy="${groupName}-group-add-button"]`).click();
};

export const createGroupAddAppAndUserToGroup = (groupName, email) => {
  cy.intercept("GET", "/api/group_permissions").as(
    `${groupName}`
  );
  createGroup(groupName);

  cy.wait(`@${groupName}`).then((groupResponse) => {
    const groupId = groupResponse.response.body.group_permissions.find(
      (group) => group.group === groupName
    ).id;

    cy.getCookie("tj_auth_token").then((cookie) => {
      const headers = {
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: `tj_auth_token=${cookie.value}`,
      };

      cy.request({
        method: "PUT",
        url: `${Cypress.env("server_host")}/api/group_permissions/${groupId}`,
        headers: headers,
        body: { add_apps: [Cypress.env("appId")] },
      }).then((patchResponse) => {
        expect(patchResponse.status).to.equal(200);
      });

      cy.task("updateId", {
        dbconfig: Cypress.env("app_db"),
        sql: `select id from users where email='${email}';`,
      }).then((resp) => {
        const userId = resp.rows[0].id;

        cy.request({
          method: "PUT",
          url: `${Cypress.env("server_host")}/api/group_permissions/${groupId}`,
          headers: headers,
          body: { add_users: [userId] },
        }).then((patchResponse) => {
          expect(patchResponse.status).to.equal(200);
        });

        cy.get('[data-cy="all-users-list-item"] > span').click();
        cy.get(`[data-cy="${cyParamName(groupName)}-list-item"]`).click();
        cy.wait(1000);
        cy.get(groupsSelector.appsLink).click();
        cy.wait(1000);
        cy.get('[data-cy="checkbox-app-edit"]').check();
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
  groupName = "All users",
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
          cy.get(selector).uncheck();
        }
      }
    });
  });
};

export const duplicateGroup = () => {
  OpenGroupCardOption(groupName);
  cy.get(groupsSelector.duplicateOption).click();
};
