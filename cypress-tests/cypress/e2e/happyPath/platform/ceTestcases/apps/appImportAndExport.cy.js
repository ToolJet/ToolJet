import { commonSelectors } from "Selectors/common";
import { addNewconstants } from "Support/utils/workspaceConstants";

import {
  appVersionSelectors,
  exportAppModalSelectors,
  importSelectors,
} from "Selectors/exportImport";

import { addQuery, verifyValueOnInspector } from "Support/utils/dataSource";

import {
  verifyComponent,
  deleteComponentAndVerify,
} from "Support/utils/basicComponents";

import {
  selectAndAddDataSource,
  fillConnectionForm,
} from "Support/utils/postgreSql";

import { dataSourceText } from "Texts/dataSource";

import { exportAppModalText, importText } from "Texts/exportImport";

import {
  clickOnExportButtonAndVerify,
  createNewVersion,
  exportAllVersionsAndVerify,
  verifyElementsOfExportModal,
} from "Support/utils/exportImport";

import {
  selectAppCardOption,
  navigateToAppEditor,
  closeModal,
  pinInspector,
} from "Support/utils/common";

import { commonText } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";
import { fake } from "Fixtures/fake";
import { buttonText } from "Texts/button";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";

describe("App Import Functionality", () => {
  let appData;
  var data = {};
  data.appName = `${fake.companyName}-App`;
  data.appReName = `${fake.companyName}-${fake.companyName}-App`;
  let currentVersion = "";
  let otherVersions = "";
  const toolJetImage = "cypress/fixtures/Image/tooljet.png";
  const appFile = "cypress/fixtures/templates/test-app.json";
  let exportedFilePath;
  data.dsName1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

  beforeEach(() => {
    cy.apiLogin();
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
    cy.visit("/");

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

    cy.get(importSelectors.importOptionInput).eq(0).selectFile(toolJetImage, {
      force: true,
    });

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      importText.couldNotImportAppToastMessage
    );

    cy.get(importSelectors.dropDownMenu).should("be.visible").click();
    cy.get(importSelectors.importOptionLabel).verifyVisibleElement(
      "have.text",
      importText.importOption
    );
    cy.get(importSelectors.importOptionInput).eq(0).selectFile(appFile, {
      force: true,
    });
    cy.wait(2000);
    cy.get(importSelectors.importAppTitle).should("be.visible");
    cy.get(importSelectors.importAppButton).click();
    cy.get(".go3958317564")
      .should("be.visible")
      .and("have.text", importText.appImportedToastMessage);

    cy.get(".driver-close-btn").click();
    cy.wait(500);

    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "contain.value",
      appData.name.toLowerCase()
    );

    cy.skipEditorPopover();
    cy.modifyCanvasSize(900, 600);
    cy.dragAndDropWidget(buttonText.defaultWidgetText);
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");

    cy.renameApp(data.appName);
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "contain.value",
      data.appName
    );

    cy.waitForAutoSave();
    cy.get(commonSelectors.editorPageLogo).should("be.visible");
    cy.backToApps();

    cy.get(commonSelectors.appHeaderLable).should("be.visible");

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

      cy.get(importSelectors.importAppTitle).should("be.visible");
      cy.get(importSelectors.importAppButton).click();
      cy.get(".go3958317564")
        .should("be.visible")
        .and("have.text", importText.appImportedToastMessage);
      cy.get(
        `[data-cy="draggable-widget-${buttonText.defaultWidgetName}"]`
      ).should("be.visible");
      cy.readFile(exportedFilePath).then((newApp) => {
        let exportedAppData = newApp;

        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
          "contain.value",
          exportedAppData.app[0].definition.appV2.name.toLowerCase()
        );

        cy.get(
          appVersionSelectors.currentVersionField((currentVersion = "v1"))
        ).verifyVisibleElement(
          "have.text",
          exportedAppData.app[0].definition.appV2.appVersions[0].name
        );
      });
      cy.exec("cd ./cypress/downloads/ && rm -rf *");
    });

    cy.renameApp(data.appReName);
    cy.backToApps();
    cy.get(commonSelectors.appHeaderLable).should("be.visible");

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
            cy.backToApps();
            cy.get(commonSelectors.appHeaderLable).should("be.visible");

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
              cy.get(importSelectors.importAppTitle).should("be.visible");
              cy.get(importSelectors.importAppButton).click();
              cy.get(".go3958317564")
                .should("be.visible")
                .and("have.text", importText.appImportedToastMessage);
              cy.get(appVersionSelectors.appVersionMenuField).click();

              cy.get(
                `[data-cy="draggable-widget-${buttonText.defaultWidgetName}"]`
              ).should("be.visible");
              cy.readFile(exportedFilePath).then((newApp) => {
                let exportedAppData = newApp;

                cy.get(commonSelectors.appNameInput).verifyVisibleElement(
                  "contain.value",
                  exportedAppData.app[0].definition.appV2.name.toLowerCase()
                );

                cy.get(
                  appVersionSelectors.currentVersionField(
                    (currentVersion = "v2")
                  )
                ).verifyVisibleElement(
                  "have.text",
                  exportedAppData.app[0].definition.appV2.appVersions[1].name
                );
              });
            });
            cy.exec("cd ./cypress/downloads/ && rm -rf *");
          });
      });
  });

  it("Verify the elements of export dialog box", () => {
    data.appName1 = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName1);

    cy.openApp();

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
        cy.get(commonSelectors.editorPageLogo).should("be.visible");
        cy.backToApps();
        cy.get(commonSelectors.appHeaderLable).should("be.visible");

        selectAppCardOption(
          data.appName1,
          commonSelectors.appCardOptions(commonText.exportAppOption)
        );

        verifyElementsOfExportModal((currentVersion = "v1"));
      });
  });

  it("Verify 'Export app' functionality of an application ", () => {
    data.appName1 = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName1);

    cy.visit("/");
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
    cy.skipEditorPopover();
    cy.get(appVersionSelectors.appVersionMenuField)
      .should("be.visible")
      .click();

    createNewVersion((otherVersions = ["v2"]), (currentVersion = "v1"));
    cy.wait(500);
    cy.dragAndDropWidget("Text Input", 50, 50);
    cy.waitForAutoSave();
    cy.get(appVersionSelectors.currentVersionField((otherVersions = "v2")))
      .should("be.visible")
      .invoke("text")
      .then(() => {
        cy.backToApps();
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

  it("Verify 'Export and import' functionality of an application with DS,Constants for same and different workspace", () => {
    data.appName2 = `${fake.companyName}-App`;
    data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.newConstvalue = `New ${data.constName}`;
    data.constantsName = fake.firstName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
    data.constantsValue = "dJ_8Q~BcaMPd";

    cy.apiCreateApp(data.appName2);

    cy.visit("/");

    //add constants

    cy.get(commonSelectors.workspaceConstantsIcon).click();
    addNewconstants(data.constName, data.constName);

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      workspaceConstantsText.constantCreatedToast("Global")
    );
    cy.get('[data-cy="icon-dashboard"]').click();

    cy.openApp(data.appName2);
    cy.dragAndDropWidget("Text Input", 50, 50);
    cy.waitForAutoSave();
    cy.skipEditorPopover();
    cy.get('[data-cy="default-value-input-field"]').clearAndTypeOnCodeMirror(
      `{{constants.${data.constName}}`
    );
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    // add data sources

    cy.backToApps();
    cy.get(commonSelectors.globalDataSourceIcon).click();

    selectAndAddDataSource(
      "databases",
      dataSourceText.postgreSQL,
      data.dsName1
    );

    cy.intercept("GET", "api/v2/data_sources").as("datasource");
    fillConnectionForm(
      {
        Host: Cypress.env("pg_host"),
        Port: "5432",
        "Database Name": Cypress.env("pg_user"),
        Username: Cypress.env("pg_user"),
        Password: Cypress.env("pg_password"),
      },
      ".form-switch"
    );

    cy.visit("/");
    navigateToAppEditor(data.appName2);

    deleteComponentAndVerify("textinput1");
    cy.wait(500);
    pinInspector();

    addQuery(
      "table_preview",
      `SELECT * FROM persons;`,
      `cypress-${data.dsName1}-postgresql`
    );

    cy.wait(500);
    cy.dragAndDropWidget("Text Input", 50, 50);
    cy.waitForAutoSave();
    cy.skipEditorPopover();
    cy.get('[data-cy="default-value-input-field"]').clearAndTypeOnCodeMirror(
      `{{constants.${data.constName}}`
    );
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.get('[data-cy="query-preview-button"]').click();

    //Export the app

    cy.backToApps();
    selectAppCardOption(
      data.appName2,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );

    clickOnExportButtonAndVerify(
      exportAppModalText.exportSelectedVersion,
      data.appName2
    );

    // Import same app and verify components\
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

      cy.get(importSelectors.importAppTitle).should("be.visible");
      cy.get(importSelectors.importAppButton).click();
      cy.get(".go3958317564")
        .should("be.visible")
        .and("have.text", importText.appImportedToastMessage);
      cy.wait(3000);
      cy.get('button[title="Unpin"]').click();
      cy.forceClickOnCanvas();
      cy.wait(2000);
      cy.get('[data-cy="draggable-widget-textinput1"]').should(
        "have.value",
        `${data.constName}`
      );
      cy.get('[data-cy="list-query-table_preview"]').should("be.visible");

      // Import same to app to different workspace and verify

      data.workspaceName = `${fake.companyName}-App`;
      data.workspaceSlug = fake.firstName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");

      cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
      cy.visitTheWorkspace(data.workspaceName);

      cy.exec("ls ./cypress/downloads/").then((result) => {
        const downloadedAppExportFileName = result.stdout.split("\n")[0].trim();
        const exportedFilePath = `cypress/downloads/${downloadedAppExportFileName}`;

        cy.log("Exported File Path:", exportedFilePath);

        cy.readFile(exportedFilePath).should("exist");

        cy.get(importSelectors.dropDownMenu).should("be.visible").click();
        cy.get(importSelectors.importOptionLabel).verifyVisibleElement(
          "have.text",
          importText.importOption
        );
        cy.get(importSelectors.importOptionInput)
          .eq(1)
          .selectFile(exportedFilePath, {
            force: true,
          });

        cy.get(importSelectors.importAppTitle).should("be.visible");
        cy.get(importSelectors.importAppButton).click();
        cy.get(".go3958317564")
          .should("be.visible")
          .and("have.text", importText.appImportedToastMessage);

        cy.wait(3000);

        cy.skipWalkthrough();
        cy.forceClickOnCanvas();
        cy.wait(2000);

        cy.get('[data-cy="list-query-table_preview"]').should("be.visible");
      });
    });
  });

  it("Verify 'Export and import' functionality of an application with tj_DB for same and different workspace", () => {
    data.appName3 = `${fake.companyName}-App`;
    cy.visit("/");
    cy.createAppFromTemplate("applicant-tracking-system");
    cy.wait(500);
    cy.clearAndType('[data-cy="app-name-input"]', data.appName3);
    cy.get('[data-cy="+-create-app"]').click();
    cy.wait(500);
    cy.skipWalkthrough();

    //Export the app

    cy.backToApps();
    selectAppCardOption(
      data.appName3,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );

    clickOnExportButtonAndVerify(
      exportAppModalText.exportSelectedVersion,
      data.appName3
    );

    // Import same app and verify components

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

      cy.get(importSelectors.importAppTitle).should("be.visible");
      cy.get(importSelectors.importAppButton).click();
      cy.get(".go3958317564")
        .should("be.visible")
        .and("have.text", importText.appImportedToastMessage);
      cy.wait(3000);
      const selectors = [
        '[data-cy="list-query-getactivejobs"]',
        '[data-cy="list-query-addnewjob"]',
        '[data-cy="list-query-addnewapplicant"]',
        '[data-cy="list-query-updatejob"]',
      ];

      selectors.forEach((selector) => {
        cy.get(selector).should("be.visible");
      });

      // Import same to app to different workspace and verify

      data.workspaceName = `${fake.companyName}-App`;
      data.workspaceSlug = fake.firstName
        .toLowerCase()
        .replaceAll("[^A-Za-z]", "");

      cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
      cy.visitTheWorkspace(data.workspaceName);

      cy.exec("ls ./cypress/downloads/").then((result) => {
        const downloadedAppExportFileName = result.stdout.split("\n")[0].trim();
        const exportedFilePath = `cypress/downloads/${downloadedAppExportFileName}`;

        cy.log("Exported File Path:", exportedFilePath);

        cy.readFile(exportedFilePath).should("exist");

        cy.get(importSelectors.dropDownMenu).should("be.visible").click();
        cy.get(importSelectors.importOptionLabel).verifyVisibleElement(
          "have.text",
          importText.importOption
        );
        cy.get(importSelectors.importOptionInput)
          .eq(1)
          .selectFile(exportedFilePath, {
            force: true,
          });

        cy.get(importSelectors.importAppTitle).should("be.visible");
        cy.get(importSelectors.importAppButton).click();
        cy.get(".go3958317564")
          .should("be.visible")
          .and("have.text", importText.appImportedToastMessage);

        cy.wait(3000);

        cy.skipWalkthrough();
        cy.wait(2000);
        selectors.forEach((selector) => {
          cy.get(selector).should("be.visible");
        });
      });
    });
  });

  it.skip("Verify 'Export app' functionality of an application inside app editor", () => {
    data.appName2 = `${fake.companyName}-App`;

    cy.apiCreateApp(data.appName2);
    cy.visit("/");
    navigateToAppEditor(data.appName2);

    cy.get('[data-cy="widget-list-box-table"]').should("be.visible");
    cy.skipEditorPopover();

    cy.get(appVersionSelectors.appVersionMenuField)
      .should("be.visible")
      .click();

    createNewVersion((otherVersions = ["v2"]), (currentVersion = "v1"));
    cy.wait(500);
    cy.dragAndDropWidget("Text Input", 50, 50);
    cy.waitForAutoSave();

    cy.get(appVersionSelectors.currentVersionField((otherVersions = "v2")))
      .should("be.visible")
      .invoke("text");
    cy.get('[data-cy="left-sidebar-settings-button"]').click();
    cy.get('[data-cy="button-user-status-change"]').click();

    verifyElementsOfExportModal(
      (currentVersion = "v2"),
      (otherVersions = ["v1"])
    );

    exportAllVersionsAndVerify(
      data.appName1,
      (currentVersion = "v2"),
      (otherVersions = ["v1"])
    );
  });
});
