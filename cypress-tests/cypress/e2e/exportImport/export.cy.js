import { commonSelectors } from "Selectors/common";
import {
  appVersionSelectors,
  exportAppModalSelectors,
} from "Selectors/exportImport";
import { exportAppModalText, appVersionText } from "Texts/exportImport";
import {
  verifyElementsOfExportModal,
  createNewVersion,
  clickOnExportButtonAndVerify,
  exportAllVersionsAndVerify,
} from "Support/utils/exportImport";
import {
  closeModal,
  navigateToAppEditor,
  selectAppCardOption,
} from "Support/utils/common";
import { commonText } from "Texts/common";
import { fake } from "Fixtures/fake";
import { buttonText } from "Texts/button";

describe("App Export Functionality", () => {
  var data = {};
  data.appName1 = `${fake.companyName}-App`;
  let currentVersion = "";
  let otherVersions = [];
  beforeEach(() => {
    cy.appUILogin();
  });

  it("Verify the elements of export dialog box", () => {
    cy.createApp(data.appName1);
    cy.dragAndDropWidget(buttonText.defaultWidgetText);
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    cy.renameApp(data.appName1);
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "have.value",
      data.appName1
    );
    cy.waitForAutoSave();
    cy.get(appVersionSelectors.currentVersionField((currentVersion = "v1")))
      .should("be.visible")
      .invoke("text")
      .then(() => {
        cy.get(commonSelectors.editorPageLogo).should("be.visible").click();
        cy.get(commonSelectors.appHeaderLable).should("be.visible");
        cy.reload();
        selectAppCardOption(
          data.appName1,
          commonSelectors.appCardOptions(commonText.exportAppOption)
        );
        verifyElementsOfExportModal((currentVersion = "v1"));
      });
  });

  it("Verify 'Export app' functionality of an application", () => {
    cy.get(commonSelectors.appHeaderLable).should("be.visible");

    selectAppCardOption(
      data.appName1,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );
    verifyElementsOfExportModal((currentVersion = "v1"));
    closeModal(exportAppModalText.modalCloseButton);

    selectAppCardOption(
      data.appName1,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );
    cy.get(exportAppModalSelectors.currentVersionSection).should("be.visible");
    cy.get(
      exportAppModalSelectors.versionRadioButton((currentVersion = "v1"))
    ).verifyVisibleElement("be.checked");
    clickOnExportButtonAndVerify(
      exportAppModalText.exportSelectedVersion,
      data.appName1
    );
    cy.exec("cd ./cypress/downloads/ && rm -rf *");

    selectAppCardOption(
      data.appName1,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );
    cy.get(exportAppModalSelectors.currentVersionSection).should("be.visible");
    exportAllVersionsAndVerify(data.appName1, (currentVersion = "v1"));
    cy.exec("cd ./cypress/downloads/ && rm -rf *");

    navigateToAppEditor(data.appName1);
    cy.get('[data-cy="widget-list-box-table"]').should("be.visible");
    cy.get(".driver-close-btn").click();
    cy.get(appVersionSelectors.appVersionMenuField)
      .should("be.visible")
      .click();
    createNewVersion((otherVersions = ["v2"]), (currentVersion = "v1"));
    cy.wait(500);
    cy.dragAndDropWidget("Toggle Switch", 50, 50);
    cy.waitForAutoSave();
    cy.get(appVersionSelectors.currentVersionField((otherVersions = "v2")))
      .should("be.visible")
      .invoke("text")
      .then(() => {
        cy.get(commonSelectors.editorPageLogo).click();
        cy.get(commonSelectors.appHeaderLable).should("be.visible");
        selectAppCardOption(
          data.appName1,
          commonSelectors.appCardOptions(commonText.exportAppOption)
        );
        verifyElementsOfExportModal(
          (currentVersion = "v2"),
          (otherVersions = ["v1"])
        );
        exportAllVersionsAndVerify(
          data.appName1,
          (currentVersion = "v2"),
          (otherVersions = ["v1"])
        );
        cy.exec("cd ./cypress/downloads/ && rm -rf *");
      });

    selectAppCardOption(
      data.appName1,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );
    cy.get(exportAppModalSelectors.currentVersionSection).should("be.visible");
    cy.get(
      exportAppModalSelectors.versionRadioButton((currentVersion = "v2"))
    ).verifyVisibleElement("be.checked");
    cy.get(exportAppModalSelectors.versionRadioButton((currentVersion = "v1")))
      .click()
      .verifyVisibleElement("be.checked");
    clickOnExportButtonAndVerify(
      exportAppModalText.exportSelectedVersion,
      data.appName1
    );
    cy.exec("cd ./cypress/downloads/ && rm -rf *");
  });
});
