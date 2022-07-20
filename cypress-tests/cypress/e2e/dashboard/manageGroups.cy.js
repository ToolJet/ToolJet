import {commonSelectors} from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import * as groups from "Support/utils/manageGroups";

const groupName = fake.firstName.replaceAll("[^A-Za-z]", "");

describe("Manage Groups", ()=>{
  before(()=>{
   cy.appUILogin();
  });
  it("Should verify the elements and functionalities on manage groups page",()=>{
   common.navigateToManageGroups();
   groups.manageGroupsElements();
   cy.get(groupsSelector.createNewGroupButton).click();
   cy.clearAndType(groupsSelector.groupNameInput, groupsText.admin);
   cy.get(groupsSelector.createGroupButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.groupNameExistToast);
   cy.get(groupsSelector.cancelButton).click();
   cy.get(groupsSelector.tableHeader).should("be.visible").and("have.text", groupsText.tableHeader);
   cy.wait(2000);
   cy.get(groupsSelector.createNewGroupButton).click();
   cy.clearAndType(groupsSelector.groupNameInput, groupName);
   cy.get(groupsSelector.createGroupButton).click();
   cy.verifyToastMessage(commonSelectors.toastMessage, groupsText.groupCreatedToast);

   cy.get(groupsSelector.groupName).contains(groupName).click();
   cy.get(groupsSelector.userGroup).should("be.visible").and("have.text", groupsText.userGroup);
   cy.get(groupsSelector.groupName).should("be.visible").and("have.text", groupName);
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

   cy.get(groupsSelector.userGroup).click();
   cy.contains('td', groupName).parent().within(() => {
    cy.get('td a').contains("Delete").click();
   });
   cy.get(groupsSelector.confirmText).should("be.visible").and("have.text", groupsText.confirmText);
   cy.get(groupsSelector.confirmCancelButton).should("be.visible").and("have.text", groupsText.confirmCancelButton);
   cy.get(groupsSelector.confirmYesButton).should("be.visible").and("have.text", groupsText.confirmYesButton);
   cy.get(groupsSelector.confirmCancelButton).click();

   cy.contains('td', groupName).parent().within(() => {
    cy.get('td a').contains("Delete").click();
   });
   cy.get(groupsSelector.confirmYesButton).click();
  });
});