import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import * as common from "Support/utils/common";
import { resetDsPermissions } from "Support/utils/eeCommon";
import { eeGroupsSelector } from "Selectors/eeCommon";
import { eeGroupsText } from "Texts/eeCommon";

const groupName = fake.firstName.replaceAll("[^A-Za-z]", "");

describe("Manage Groups", () => {
  before(() => {
    cy.appUILogin();
    resetDsPermissions();
  });
  it("Should verify the datasource permission UI elements on manage groups page", () => {
    common.navigateToManageGroups();
    cy.get(groupsSelector.groupLink("Admin")).click();
    cy.get(groupsSelector.groupLink("All users")).click();

    cy.get(groupsSelector.permissionsLink).click();
    cy.get(eeGroupsSelector.resourceDs).verifyVisibleElement(
      "have.text",
      eeGroupsText.resourceDs
    );
    cy.get(eeGroupsSelector.dsCreateCheck).should("be.visible");
    cy.get(eeGroupsSelector.dsDeleteCheck).should("be.visible");
    cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
      "have.text",
      groupsText.createLabel
    );
    cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
      "have.text",
      groupsText.deleteLabel
    );

    cy.wait(1000)
    cy.get(eeGroupsSelector.dsCreateCheck).check();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );
    cy.get(eeGroupsSelector.dsDeleteCheck).check();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );

    cy.get(eeGroupsSelector.datasourceLink).click();
    cy.get(eeGroupsSelector.dsSearch).should("be.visible");
    cy.get(eeGroupsSelector.AddDsButton).verifyVisibleElement(
      "have.text",
      eeGroupsText.AddDsButton
    );
    cy.get(eeGroupsSelector.dsNameHeader).verifyVisibleElement(
      "have.text",
      eeGroupsText.dsNameHeader
    );
    cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
      "have.text",
      groupsText.permissionstableHedaer
    );
    cy.get(groupsSelector.permissionsLink).click();

    cy.get(groupsSelector.groupLink("Admin")).click();
    cy.get(groupsSelector.groupLink("All users")).click();
    cy.get(groupsSelector.groupLink("Admin")).click();

    cy.get(eeGroupsSelector.resourceDs).verifyVisibleElement(
      "have.text",
      eeGroupsText.resourceDs
    );
    cy.get(eeGroupsSelector.dsCreateCheck).should("be.visible");
    cy.get(eeGroupsSelector.dsDeleteCheck).should("be.visible");
    cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
      "have.text",
      groupsText.createLabel
    );
    cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
      "have.text",
      groupsText.deleteLabel
    );

    cy.get(eeGroupsSelector.dsCreateCheck).verifyVisibleElement("be.disabled");
    cy.get(eeGroupsSelector.dsDeleteCheck).verifyVisibleElement("be.disabled");

    cy.get(groupsSelector.createNewGroupButton).click();
    cy.clearAndType(groupsSelector.groupNameInput, groupName);
    cy.get(groupsSelector.createGroupButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.groupCreatedToast
    );
    cy.get(groupsSelector.groupLink(groupName)).click();

    cy.get(groupsSelector.permissionsLink).click();
    cy.get(eeGroupsSelector.resourceDs).verifyVisibleElement(
      "have.text",
      eeGroupsText.resourceDs
    );
    cy.get(eeGroupsSelector.dsCreateCheck).should("be.visible");
    cy.get(eeGroupsSelector.dsDeleteCheck).should("be.visible");
    cy.get(groupsSelector.appsCreateLabel).verifyVisibleElement(
      "have.text",
      groupsText.createLabel
    );
    cy.get(groupsSelector.appsDeleteLabel).verifyVisibleElement(
      "have.text",
      groupsText.deleteLabel
    );

    cy.get(eeGroupsSelector.dsCreateCheck).check();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );
    cy.get(eeGroupsSelector.dsDeleteCheck).check();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      groupsText.permissionUpdatedToast
    );

    cy.get(eeGroupsSelector.datasourceLink).click();
    cy.get(eeGroupsSelector.dsSearch).should("be.visible");
    cy.get(eeGroupsSelector.AddDsButton).verifyVisibleElement(
      "have.text",
      eeGroupsText.AddDsButton
    );
    cy.get(eeGroupsSelector.dsNameHeader).verifyVisibleElement(
      "have.text",
      eeGroupsText.dsNameHeader
    );
    cy.get(groupsSelector.permissionstableHedaer).verifyVisibleElement(
      "have.text",
      groupsText.permissionstableHedaer
    );
    cy.get(groupsSelector.permissionsLink).click();

    cy.get(groupsSelector.deleteGroupLink(groupName)).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();
  });
});
