import { commonSelectors } from "Selectors/common";
import {
  appVersionSelectors,
  exportAppModalSelectors,
  importSelectors,
} from "Selectors/exportImport";
import { exportAppModalText, importText } from "Texts/exportImport";
import { clickOnExportButtonAndVerify } from "Support/utils/exportImport";
import { selectAppCardOption } from "Support/utils/common";
import { commonText } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";
import { fake } from "Fixtures/fake";

describe("App Import Functionality", () => {
  let appData;
  var data = {};
  data.appName = `${fake.companyName}-App`;
  data.appReName = `${fake.companyName}-App`;
  let currentVersion = "";
  let otherVersions = [];
  const toolJetImage = "cypress/fixtures/Image/tooljet.png";
  const appFile = "cypress/fixtures/templates/test-app.json";
  let exportedFilePath;

  beforeEach(() => {
    cy.appUILogin();
  });
  before(() => {
    cy.fixture("templates/test-app.json").then((app) => {
      appData = app;
    });
  });
  it("Verify the Import functionality of an Application", () => {
    cy.get("body").then(($title) => {
      if ($title.text().includes(commonText.introductionMessage)) {
        cy.get(dashboardSelector.importAppButton).click();
      } else {
        cy.get(importSelectors.dropDownMenu).should("be.visible").click();
        cy.get(importSelectors.importOptionLabel).verifyVisibleElement(
          "have.text",
          importText.importOption
        );
      }
    });
    cy.get(importSelectors.importOptionInput).selectFile(toolJetImage, {
      force: true,
    });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      importText.couldNotImportAppToastMessage
    );

    cy.get(importSelectors.importOptionInput).selectFile(appFile, {
      force: true,
    });
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      importText.appImportedToastMessage
    );
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "have.value",
      appData.name
    );
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    cy.renameApp(data.appName);
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "have.value",
      data.appName
    );
    cy.waitForAutoSave();
    cy.get(commonSelectors.editorPageLogo).should("be.visible").click();
    cy.get(commonSelectors.folderPageTitle).should("be.visible");
    selectAppCardOption(
      data.appName,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );
    cy.get(exportAppModalSelectors.currentVersionSection).should("be.visible");
    cy.get(
      exportAppModalSelectors.versionRadioButton((currentVersion = "v1"))
    ).verifyVisibleElement("be.checked");
    clickOnExportButtonAndVerify(
      exportAppModalText.exportSelectedVersion,
      data.appName
    );
    cy.exec("ls ./cypress/downloads/").then((result) => {
      cy.log(result);
      const downloadedAppExportFileName = result.stdout.split("\n")[0];
      exportedFilePath = `cypress/downloads/${downloadedAppExportFileName}`;
      cy.log(exportedFilePath);
      cy.get(importSelectors.dropDownMenu).should("be.visible").click();
      cy.get(importSelectors.importOptionLabel).verifyVisibleElement(
        "have.text",
        importText.importOption
      );
      cy.get(importSelectors.importOptionInput).selectFile(exportedFilePath, {
        force: true,
      });
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        importText.appImportedToastMessage
      );
      cy.readFile(exportedFilePath).then((newApp) => {
        let exportedAppData = newApp;

        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
          "have.value",
          exportedAppData.name
        );
        cy.get(
          appVersionSelectors.currentVersionField((currentVersion = "v1"))
        ).verifyVisibleElement(
          "have.text",
          exportedAppData.appVersions[0].name
        );
      });
    });
  });
});
