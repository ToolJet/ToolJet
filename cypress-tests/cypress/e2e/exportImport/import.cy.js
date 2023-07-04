import { commonSelectors } from "Selectors/common";
import {
  appVersionSelectors,
  exportAppModalSelectors,
  importSelectors,
} from "Selectors/exportImport";
import { exportAppModalText, importText } from "Texts/exportImport";
import {
  clickOnExportButtonAndVerify,
  createNewVersion,
  exportAllVersionsAndVerify,
} from "Support/utils/exportImport";
import { selectAppCardOption, navigateToAppEditor } from "Support/utils/common";
import { commonText } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";
import { fake } from "Fixtures/fake";
import { buttonText } from "Texts/button";

describe("App Import Functionality", () => {
  let appData;
  var data = {};
  data.appName = `${fake.companyName}-App`;
  data.appReName = `${fake.companyName}-App`;
  let currentVersion = "";
  let otherVersions = "";
  const toolJetImage = "cypress/fixtures/Image/tooljet.png";
  const appFile = "cypress/fixtures/templates/test-app.json";
  let exportedFilePath;

  beforeEach(() => {
    cy.appUILogin();
  });
  before(() => {
    cy.fixture("templates/test-app.json").then((app) => {
      cy.exec("cd ./cypress/downloads/ && rm -rf *", {
        failOnNonZeroExit: false,
      });
      appData = app;
    });
  });
  it("Verify the Import functionality of an Application", () => {
    cy.get("body").then(($title) => {
      if ($title.text().includes(commonText.welcomeTooljetWorkspace)) {
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
    cy.get(".driver-close-btn").click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      importText.appImportedToastMessage
    );
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "contain.value",
      appData.name
    );
    cy.dragAndDropWidget(buttonText.defaultWidgetText);
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    cy.renameApp(data.appName);
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "contain.value",
      data.appName
    );
    cy.waitForAutoSave();
    cy.get(commonSelectors.editorPageLogo).should("be.visible").click();
    cy.get(commonSelectors.appHeaderLable).should("be.visible");
    cy.reload();
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
      cy.get(
        `[data-cy="draggable-widget-${buttonText.defaultWidgetName}"]`
      ).should("be.visible");
      cy.readFile(exportedFilePath).then((newApp) => {
        let exportedAppData = newApp;

        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
          "contain.value",
          exportedAppData.appV2.name
        );
        cy.get(
          appVersionSelectors.currentVersionField((currentVersion = "v1"))
        ).verifyVisibleElement(
          "have.text",
          exportedAppData.appV2.appVersions[0].name
        );
      });
      cy.exec("cd ./cypress/downloads/ && rm -rf *");
    });
    cy.renameApp(data.appReName);
    cy.get(commonSelectors.editorPageLogo).click();
    cy.get(commonSelectors.appHeaderLable).should("be.visible");
    cy.reload();
    navigateToAppEditor(data.appReName);

    cy.wait(500);
    cy.get(appVersionSelectors.appVersionMenuField)
      .should("be.visible")
      .click();
    createNewVersion((otherVersions = ["v2"]), (currentVersion = "v1"));
    cy.get(appVersionSelectors.currentVersionField((otherVersions = "v2")))
      .should("be.visible")
      .click()
      .then(() => {
        cy.get(appVersionSelectors.appVersionContentList)
          .invoke("text")
          .then((versionText) => {
            cy.log(versionText);
            cy.get(commonSelectors.editorPageLogo).click();
            cy.get(commonSelectors.appHeaderLable).should("be.visible");
            cy.reload();
            selectAppCardOption(
              data.appReName,
              commonSelectors.appCardOptions(commonText.exportAppOption)
            );
            exportAllVersionsAndVerify(
              data.appReName,
              (currentVersion = "v2"),
              (otherVersions = ["v1"])
            );
            cy.exec("ls ./cypress/downloads/").then((result) => {
              cy.log(result);
              const newdownloadedAppExportFileName =
                result.stdout.split("\n")[0];
              cy.log(newdownloadedAppExportFileName);
              exportedFilePath = `cypress/downloads/${newdownloadedAppExportFileName}`;
              cy.get(importSelectors.dropDownMenu).should("be.visible").click();
              cy.get(importSelectors.importOptionLabel).verifyVisibleElement(
                "have.text",
                importText.importOption
              );
              cy.get(importSelectors.importOptionInput).selectFile(
                exportedFilePath,
                {
                  force: true,
                }
              );
              cy.verifyToastMessage(
                commonSelectors.toastMessage,
                importText.appImportedToastMessage
              );
              cy.get(appVersionSelectors.appVersionMenuField).click();
              cy.get(appVersionSelectors.appVersionContentList).should(
                "have.text",
                versionText
              );
              cy.get(
                `[data-cy="draggable-widget-${buttonText.defaultWidgetName}"]`
              ).should("be.visible");
              cy.readFile(exportedFilePath).then((newApp) => {
                let exportedAppData = newApp;

                cy.get(commonSelectors.appNameInput).verifyVisibleElement(
                  "contain.value",
                  exportedAppData.appV2.name
                );
                cy.get(
                  appVersionSelectors.currentVersionField(
                    (currentVersion = "v2")
                  )
                ).verifyVisibleElement(
                  "have.text",
                  exportedAppData.appV2.appVersions[1].name
                );
              });
            });
            cy.exec("cd ./cypress/downloads/ && rm -rf *");
          });
      });
  });
});
