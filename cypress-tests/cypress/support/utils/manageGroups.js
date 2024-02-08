import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";
import { navigateToAllUserGroup, createGroup, navigateToManageGroups } from "Support/utils/common";
import { cyParamName } from "../../constants/selectors/common";

export const manageGroupsElements = () => {
  cy.get(groupsSelector.groupLink("All users")).verifyVisibleElement(
    "have.text",
    groupsText.allUsers
  );
  cy.get(groupsSelector.groupLink("Admin")).verifyVisibleElement(
    "have.text",
    groupsText.admin
  );

  navigateToAllUserGroup();

  cy.get(groupsSelector.groupPageTitle("All Users")).verifyVisibleElement(
    "have.text",
    groupsText.allUsers
  );
  cy.get(groupsSelector.createNewGroupButton).verifyVisibleElement(
    "have.text",
    groupsText.createNewGroupButton
  );

  cy.get(groupsSelector.appsLink).verifyVisibleElement(
    "have.text",
    groupsText.appsLink
  );
  cy.get(groupsSelector.usersLink).verifyVisibleElement(
    "have.text",
    groupsText.usersLink
  );
  cy.get(groupsSelector.permissionsLink).verifyVisibleElement(
    "have.text",
    groupsText.permissionsLink
  );

  cy.get(groupsSelector.appsLink).click();

  cy.get(groupsSelector.textDefaultGroup).verifyVisibleElement(
    "have.text",
    groupsText.textDefaultGroup
  );

  cy.get(groupsSelector.searchBox).should("be.visible");
  cy.get(groupsSelector.selectAddButton).verifyVisibleElement(
    "have.text",
    groupsText.addButton
  );

  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.textAppName
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get("body").then(($title) => {
    if ($title.find(groupsSelector.helperTextNoAppsAdded).length > 0) {
      cy.get(groupsSelector.helperTextNoAppsAdded)
        .eq(0)
        .verifyVisibleElement("have.text", groupsText.helperTextNoAppsAdded);
      cy.get(groupsSelector.helperTextPermissions)
        .eq(0)
        .verifyVisibleElement("have.text", groupsText.helperTextPermissions);
    }
  });

  cy.get(groupsSelector.createNewGroupButton).should("be.visible").click();
  cy.get(groupsSelector.addNewGroupModalTitle).verifyVisibleElement(
    "have.text",
    groupsText.cardTitle
  );
  cy.get(groupsSelector.groupNameInput).should("be.visible");
  cy.get(groupsSelector.cancelButton).verifyVisibleElement(
    "have.text",
    groupsText.cancelButton
  );
  cy.get(groupsSelector.createGroupButton).verifyVisibleElement(
    "have.text",
    groupsText.createGroupButton
  );
  cy.get(groupsSelector.cancelButton).click();
  cy.get(groupsSelector.helperTextAllUsersIncluded).verifyVisibleElement(
    "have.text",
    groupsText.helperTextAllUsersIncluded
  );

  // cy.get(groupsSelector.usersLink).click();
  // cy.get(groupsSelector.helperTextAllUsersIncluded).verifyVisibleElement(
  //   "have.text",
  //   groupsText.helperTextAllUsersIncluded
  // );
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
  cy.get(groupsSelector.appsCreateCheck).should("be.visible").check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.createLabel
  );
  cy.get(groupsSelector.appsCreateCheck).uncheck();
  cy.get(groupsSelector.appsDeleteCheck).should("be.visible").check();
  cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
    "have.text",
    groupsText.deleteLabel
  );
  cy.get(groupsSelector.appsDeleteCheck).uncheck();

  cy.get(groupsSelector.resourcesFolders).verifyVisibleElement(
    "have.text",
    groupsText.resourcesFolders
  );
  cy.get(groupsSelector.foldersCreateCheck).should("be.visible").check();
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get(groupsSelector.foldersCreateCheck).uncheck();

  cy.get(groupsSelector.resourcesWorkspaceVar).verifyVisibleElement(
    "have.text",
    groupsText.resourcesWorkspaceVar
  );
  cy.get(groupsSelector.workspaceVarCheckbox).check();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    groupsText.permissionUpdatedToast
  );
  cy.get(groupsSelector.workspaceVarCheckbox).uncheck();

  navigateToAllUserGroup();
  cy.get(groupsSelector.groupLink("Admin")).click();
  cy.get(groupsSelector.groupLink("Admin")).verifyVisibleElement(
    "have.text",
    groupsText.admin
  );

  cy.get(groupsSelector.appsLink).click();
  cy.get(groupsSelector.textDefaultGroup).verifyVisibleElement(
    "have.text",
    groupsText.textDefaultGroup
  );

  cy.get(groupsSelector.nameTableHeader).verifyVisibleElement(
    "have.text",
    groupsText.textAppName
  );

  cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
    "have.text",
    groupsText.permissionstableHedaer
  );

  cy.get("body").then(($title) => {
    if ($title.find(groupsSelector.helperTextNoAppsAdded).length > 0) {
      cy.get(groupsSelector.helperTextNoAppsAdded)
        .eq(0)
        .verifyVisibleElement("have.text", groupsText.helperTextNoAppsAdded);
      cy.get(groupsSelector.helperTextPermissions)
        .eq(0)
        .verifyVisibleElement("have.text", groupsText.helperTextPermissions);
    }
  });

  cy.get(groupsSelector.usersLink).click();
  cy.get(groupsSelector.multiSelectSearch).should("be.visible");
  cy.get(groupsSelector.mutiSelectAddButton("Admin")).verifyVisibleElement(
    "have.text",
    groupsText.addUsersButton
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
  cy.get(groupsSelector.appsCreateCheck).verifyVisibleElement("be.disabled");
  cy.get(groupsSelector.appsDeleteCheck).verifyVisibleElement("be.disabled");
  cy.get(groupsSelector.foldersCreateLabel).verifyVisibleElement(
    "have.text",
    groupsText.folderCreateLabel
  );
  cy.get(groupsSelector.foldersCreateCheck).verifyVisibleElement("be.disabled");
  cy.get(groupsSelector.workspaceVarCheckbox).verifyVisibleElement(
    "be.disabled"
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
  cy.intercept("GET", "http://localhost:3000/api/group_permissions").as(
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
        url: `http://localhost:3000/api/group_permissions/${groupId}`,
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
          url: `http://localhost:3000/api/group_permissions/${groupId}`,
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

export const groupPermission = (fieldsToCheckOrUncheck, groupName = "All users", shouldCheck = false,) => {
  navigateToManageGroups();
  cy.get(groupsSelector.groupLink(groupName))
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
  cy.get(groupsSelector.duplicateOption).click()
}