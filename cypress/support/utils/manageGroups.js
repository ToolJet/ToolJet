import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import {commonSelectors} from "Selectors/common";

export const manageGroupsElements = () =>{
  cy.get(groupsSelector.pageTitle).should("be.visible").and("have.text", groupsText.pageTitle);
  cy.get(groupsSelector.createNewGroupButton).should("be.visible").and("have.text", groupsText.createNewGroupButton);
  cy.get(groupsSelector.tableHeader).should("be.visible").and("have.text", groupsText.tableHeader);
  cy.get(groupsSelector.groupName).contains(groupsText.allUsers).should("be.visible").and("have.text", groupsText.allUsers);
  cy.get(groupsSelector.groupName).contains(groupsText.admin).should("be.visible").and("have.text", groupsText.admin);
  cy.get(groupsSelector.createNewGroupButton).should("be.visible").click();
  cy.get(groupsSelector.cardTitle).should("be.visible").and("have.text", groupsText.cardTitle);
  cy.get(groupsSelector.groupNameInput).should("be.visible");
  cy.get(groupsSelector.cancelButton).should("be.visible").and("have.text", groupsText.cancelButton);
  cy.get(groupsSelector.createGroupButton).should("be.visible").and("have.text", groupsText.createGroupButton);
  cy.get(groupsSelector.cancelButton).click();

  cy.get(groupsSelector.groupName).contains(groupsText.allUsers).click();
  cy.get(groupsSelector.userGroup).should("be.visible").and("have.text", groupsText.userGroup);
  cy.get(groupsSelector.groupName).should("be.visible").and("have.text", groupsText.allUsers);
  cy.get(groupsSelector.searchBox).should("be.visible");
  cy.get(groupsSelector.addButton).should("be.visible").and("have.text", groupsText.addButton);
  cy.get(groupsSelector.nameTableHeader).should("be.visible").and("have.text", groupsText.nameTableHeader);
  cy.get(groupsSelector.permissionstableHedaer).should("be.visible").and("have.text", groupsText.permissionstableHedaer);

  cy.get(groupsSelector.usersLink).click();
  cy.get(groupsSelector.searchBox).should("be.visible");
  cy.get(groupsSelector.addButton).should("be.visible").and("have.text", groupsText.addButton);
  cy.get(groupsSelector.nameTableHeader).should("be.visible").and("have.text", groupsText.nameTableHeader);
  cy.get(groupsSelector.emailTableHeader).should("be.visible").and("have.text", groupsText.emailTableHeader);

  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.resourcesApps).should("be.visible").and("have.text", groupsText.resourcesApps);
  cy.get(groupsSelector.permissionstableHedaer).should("be.visible").and("have.text", groupsText.permissionstableHedaer);

  cy.get(groupsSelector.resourcesApps).should("be.visible").and("have.text", groupsText.resourcesApps);
  cy.get(groupsSelector.appsCreateCheck).should("be.visible").check();
  cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.permissionUpdatedToast);
  cy.get(groupsSelector.appsCreateLabel).should("be.visible").and("have.text", groupsText.createLabel);
  cy.get(groupsSelector.appsCreateCheck).uncheck();
  cy.get(groupsSelector.appsDeleteCheck).should("be.visible").check();
  cy.get(groupsSelector.appsDeleteLabel).should("be.visible").and("have.text", groupsText.deleteLabel);
  cy.get(groupsSelector.appsDeleteCheck).uncheck();

  cy.get(groupsSelector.resourcesFolders).should("be.visible").and("have.text", groupsText.resourcesFolders);
  cy.get(groupsSelector.foldersCreateCheck).should("be.visible").check();
  cy.get(groupsSelector.foldersCreateLabel).should("be.visible").and("have.text", groupsText.folderCreateLabel);
  cy.get(groupsSelector.foldersCreateCheck).uncheck();
  cy.get(groupsSelector.userGroup).click();

  cy.get(groupsSelector.groupName).contains(groupsText.admin).click();
  cy.get(groupsSelector.userGroup).should("be.visible").and("have.text", groupsText.userGroup);
  cy.get(groupsSelector.groupName).should("be.visible").and("have.text", groupsText.admin);
  cy.get(groupsSelector.searchBox).should("be.visible");
  cy.get(groupsSelector.addButton).should("be.visible").and("have.text", groupsText.addButton);
  cy.get(groupsSelector.nameTableHeader).should("be.visible").and("have.text", groupsText.nameTableHeader);
  cy.get(groupsSelector.permissionstableHedaer).should("be.visible").and("have.text", groupsText.permissionstableHedaer);

  cy.get(groupsSelector.usersLink).click();
  cy.get(groupsSelector.searchBox).should("be.visible");
  cy.get(groupsSelector.addButton).should("be.visible").and("have.text", groupsText.addButton);
  cy.get(groupsSelector.nameTableHeader).should("be.visible").and("have.text", groupsText.nameTableHeader);
  cy.get(groupsSelector.emailTableHeader).should("be.visible").and("have.text", groupsText.emailTableHeader);

  cy.get(groupsSelector.permissionsLink).click();
  cy.get(groupsSelector.resourcesApps).should("be.visible").and("have.text", groupsText.resourcesApps);
  cy.get(groupsSelector.permissionstableHedaer).should("be.visible").and("have.text", groupsText.permissionstableHedaer);

  cy.get(groupsSelector.resourcesApps).should("be.visible").and("have.text", groupsText.resourcesApps);
  cy.get(groupsSelector.appsCreateCheck).should("be.visible").and("be.disabled");
  cy.get(groupsSelector.appsDeleteCheck).should("be.visible").and("be.disabled");
  cy.get(groupsSelector.foldersCreateLabel).should("be.visible").and("have.text", groupsText.folderCreateLabel);
  cy.get(groupsSelector.foldersCreateCheck).should("be.visible").and("be.disabled");
  cy.get(groupsSelector.userGroup).click();
};