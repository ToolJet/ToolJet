import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { appVersionSelectors, importSelectors } from "Selectors/exportImport";
import { commonText } from "Texts/common";
import { dashboardSelector } from "Selectors/dashboard";
import { buttonText } from "Texts/button";

import { exportAppModalText, importText } from "Texts/exportImport";
import {
  clickOnExportButtonAndVerify,
  exportAllVersionsAndVerify,
  verifyElementsOfExportModal,
  importAndVerifyApp,
} from "Support/utils/exportImport";
import { selectAppCardOption, closeModal } from "Support/utils/common";
import { switchVersionAndVerify } from "Support/utils/version";

describe("App Import Functionality", () => {
  const TEST_DATA = {
    toolJetImage: "cypress/fixtures/Image/tooljet.png",
    invalidApp: "cypress/fixtures/templates/invalid_app.json",
    invalidFile: "cypress/fixtures/templates/invalid_file.json",
    appFiles: {
      multiVersion: "cypress/fixtures/templates/three-versions.json",
      singleVersion: "cypress/fixtures/templates/one_version.json",
    },
  };

  let data;

  const initializeData = () => {
    const firstName = fake.firstName;
    return {
      workspaceName: firstName,
      workspaceSlug: firstName.toLowerCase().replace(/\s+/g, "-"),
      appName: `${fake.companyName}-IE-App`,
      appReName: `${fake.companyName}-${fake.companyName}-IE-App`,
      dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
    };
  };

  data = initializeData();

  before(() => {
    cy.exec("mkdir -p ./cypress/downloads/");
    cy.wait(3000);
  });

  beforeEach(() => {
    cy.viewport(1200, 1300);
    cy.apiLogin();
  });

  it("should verify app import functionality", () => {
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.apiLogout();
    cy.apiLogin();
    cy.visit(`${data.workspaceSlug}`);

    // Test invalid file import
    cy.get(dashboardSelector.importAppButton).click();
    importAndVerifyApp(
      TEST_DATA.toolJetImage,
      importText.couldNotImportAppToastMessage
    );

    cy.wait(500);
    cy.get(dashboardSelector.importAppButton).click();
    importAndVerifyApp(
      TEST_DATA.invalidApp,
      "Could not import: SyntaxError: Expected ',' or '}' after property value in JSON at position 246 (line 11 column 13)"
    );

    cy.wait(500);
    cy.get(dashboardSelector.importAppButton).click();
    cy.get(importSelectors.importOptionInput)
      .eq(0)
      .selectFile(TEST_DATA.invalidFile, {
        force: true,
      });
    cy.get(importSelectors.importAppTitle).should("be.visible");
    cy.get(importSelectors.importAppButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "tooljet_version must be a string"
    );
    cy.wait(500);

    // Test valid app import
    cy.get(importSelectors.dropDownMenu).should("be.visible").click();
    cy.get(importSelectors.importOptionLabel).verifyVisibleElement(
      "have.text",
      importText.importOption
    );

    cy.intercept("POST", "/api/v2/resources/import").as("importApp");
    cy.get(importSelectors.importOptionInput)
      .eq(0)
      .selectFile(TEST_DATA.appFiles.multiVersion, {
        force: true,
      });
    cy.wait(1500);

    cy.get(importSelectors.importAppTitle).verifyVisibleElement(
      "have.text",
      "Import app"
    );
    cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
      "have.text",
      "App name"
    );
    cy.get(commonSelectors.appNameInput)
      .should("be.visible")
      .and("have.value", "three-versions");
    cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
      "have.text",
      "App name must be unique and max 50 characters"
    );
    cy.get(commonSelectors.cancelButton)
      .should("be.visible")
      .and("have.text", "Cancel");
    cy.get(commonSelectors.importAppButton).verifyVisibleElement(
      "have.text",
      "Import app"
    );

    cy.get(importSelectors.importAppButton).click();
    cy.get(".go3958317564")
      .should("be.visible")
      .and("have.text", importText.appImportedToastMessage);

    // Verify imported app
    cy.get(".driver-close-btn").click();
    cy.wait(500);
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "contain.value",
      "three-versions"
    );

    // Configure app
    cy.skipEditorPopover();
    cy.dragAndDropWidget(buttonText.defaultWidgetText);
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    cy.get(commonWidgetSelector.widgetConfigHandle("button1")).should(
      "be.visible"
    );

    cy.renameApp(data.appName);
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "contain.value",
      data.appName
    );
    cy.waitForAutoSave();

    // Verify initial widget states

    verifyCommonData({
      text2: "",
      textInput1: "",
      textInput2: "Leanne Graham",
    });

    cy.get(
      commonWidgetSelector.widgetConfigHandle("textInput3")
    ).verifyVisibleElement("have.value", "");

    // Setup database and data sources
    cy.visit(`${data.workspaceSlug}/database`);
    cy.get('[data-cy="student-table"]').verifyVisibleElement(
      "have.text",
      "student"
    );

    cy.apiAddDataToTable("student", {
      name: "Paramu",
      country: "India",
      state: "Kerala",
    });

    cy.visit(`${data.workspaceSlug}/data-sources`);
    cy.get('[data-cy="postgresql-button"]').should("be.visible");
    cy.apiUpdateDataSource("postgresql", "production", {
      options: [
        {
          key: "password",
          value: `${Cypress.env("pg_password")}`,
          encrypted: true,
        },
      ],
    });

    cy.apiCreateWsConstant(
      "pageHeader",
      "Import and Export",
      ["Global"],
      ["production"]
    );
    cy.apiCreateWsConstant("db_name", "persons", ["Secret"], ["production"]);

    // Verify app after setup
    cy.wait("@importApp").then((interception) => {
      const appId = interception.response.body.imports.app[0].id;
      cy.openApp(
        "",
        Cypress.env("workspaceId"),
        appId,
        commonWidgetSelector.widgetConfigHandle("text2")
      );
    });

    verifyCommonData({
      text2: "Import and Export",
      textInput1: "John",
      textInput2: "Leanne Graham",
    });
    cy.get(
      commonWidgetSelector.widgetConfigHandle("textInput3")
    ).verifyVisibleElement("have.value", "India");

    switchVersionAndVerify("v3", "v1");

    verifyCommonData({
      text2: "Import and Export",
      textInput1: "John",
      textInput2: "Leanne Graham",
    });

    cy.wait(1000);
    cy.backToApps();

    // Test single version import
    cy.get(importSelectors.dropDownMenu).click();
    importAndVerifyApp(TEST_DATA.appFiles.singleVersion);

    // Verify final state
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "contain.value",
      "one_version"
    );

    verifyCommonData({
      text2: "Import and Export",
      textInput1: "John",
      textInput2: "Leanne Graham",
    });
  });

  it("Verify the elements of export dialog box", () => {
    cy.exec("cd ./cypress/downloads/ && rm -rf *");

    cy.visit(`${data.workspaceSlug}`);

    // Select the app card option to export the app
    selectAppCardOption(
      data.appName,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );

    // Verify the elements of the export modal
    verifyElementsOfExportModal("v3", ["v2", "v1"], [true, false, false]);

    // Close the modal
    closeModal(exportAppModalText.modalCloseButton);

    // Ensure the modal title is no longer visible
    cy.get(
      commonSelectors.modalTitle(exportAppModalText.selectVersionTitle)
    ).should("not.exist");

    // Re-open the export modal and click the export button
    selectAppCardOption(
      data.appName,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );
    clickOnExportButtonAndVerify(exportAppModalText.exportAll, data.appName);

    cy.exec("ls ./cypress/downloads/").then((result) => {
      const downloadedAppExportFileName = result.stdout.split("\n")[0];
      const filePath = `./cypress/downloads/${downloadedAppExportFileName}`;

      // Ensure the file name contains the expected app export name
      expect(downloadedAppExportFileName).to.contain(
        data.appName.toLowerCase()
      );

      // Read and validate the exported JSON file
      cy.readFile(filePath).then((appData) => {
        // Validate the app name
        const appNameFromFile = appData.app[0].definition.appV2.name;
        expect(appNameFromFile).to.equal(data.appName);

        // Validate the schema for the student table in tooljetdb
        const tooljetDatabase = appData.tooljet_database.find(
          (db) => db.table_name === "student"
        );
        expect(tooljetDatabase).to.exist;
        expect(tooljetDatabase.schema).to.exist;

        // Validate components and queries
        const components = appData.app[0].definition.appV2.components;

        const text2Component = components.find(
          (component) => component.name === "text2"
        );
        expect(text2Component).to.exist;
        expect(text2Component.properties.text.value).to.equal(
          "{{constants.pageHeader}}"
        );

        const textinput1 = components.find(
          (component) => component.name === "textinput1"
        );
        expect(textinput1).to.exist;
        expect(textinput1.properties.value.value).to.include("queries");

        const textinput2 = components.find(
          (component) => component.name === "textinput2"
        );
        expect(textinput2).to.exist;
        expect(textinput2.properties.value.value).to.include("queries");

        const textinput3 = components.find(
          (component) => component.name === "textinput3"
        );
        expect(textinput3).to.exist;
        expect(textinput3.properties.value.value).to.include("queries");

        // Validate the data queries
        const dataQueries = appData.app[0].definition.appV2.dataQueries;

        const postgresqlQuery = dataQueries.find(
          (query) => query.name === "postgresql1"
        );
        expect(postgresqlQuery).to.exist;
        expect(postgresqlQuery.options.query).to.include(
          "Select * from {{secrets.db_name}}"
        );

        const restapiQuery = dataQueries.find(
          (query) => query.name === "restapi1"
        );
        expect(restapiQuery).to.exist;
        expect(restapiQuery.options.url).to.equal(
          "https://jsonplaceholder.typicode.com/users/1"
        );

        const tooljetdbQuery = dataQueries.find(
          (query) => query.name === "tooljetdb1"
        );
        expect(tooljetdbQuery).to.exist;
        expect(tooljetdbQuery.options.operation).to.equal("list_rows");

        // Ensure appVersions exists
        const appVersions = appData.app[0].definition.appV2.appVersions;
        expect(appVersions).to.exist;

        // Map and verify app version names
        const versionNames = appVersions.map((version) => version.name);
        expect(versionNames).to.include.members(["v1", "v2", "v3"]);
      });
    });

    cy.exec("cd ./cypress/downloads/ && rm -rf *");

    selectAppCardOption(
      data.appName,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );
    cy.get(`[data-cy="v1-radio-button"]`).check();
    cy.get(
      commonSelectors.buttonSelector(exportAppModalText.exportSelectedVersion)
    ).click();

    cy.exec("ls ./cypress/downloads/").then((result) => {
      const downloadedAppExportFileName = result.stdout.split("\n")[0];
      const filePath = `./cypress/downloads/${downloadedAppExportFileName}`;

      // Ensure the file name contains the expected app export name
      expect(downloadedAppExportFileName).to.contain(
        data.appName.toLowerCase()
      );

      // Read and validate the exported JSON file
      cy.readFile(filePath).then((appData) => {
        // Validate the app name
        const appNameFromFile = appData.app[0].definition.appV2.name;
        expect(appNameFromFile).to.equal(data.appName);
      });
    });
  });

  it.skip("Verify 'Export app' functionality of an application inside app editor", () => {
    data.appName2 = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName2);
    cy.openApp(data.appName2);

    cy.dragAndDropWidget("Text Input", 50, 50);

    cy.get('[data-cy="left-sidebar-settings-button"]').click();
    cy.get('[data-cy="button-user-status-change"]').click();

    verifyElementsOfExportModal("v1");

    exportAllVersionsAndVerify(data.appName1, "v1");
  });
});

const verifyCommonData = (values) => {
  cy.get(commonWidgetSelector.widgetConfigHandle("text2")).verifyVisibleElement(
    "have.text",
    values.text2
  );
  cy.get(
    commonWidgetSelector.widgetConfigHandle("textInput1")
  ).verifyVisibleElement("have.value", values.textInput1);
  cy.get(
    commonWidgetSelector.widgetConfigHandle("textInput2")
  ).verifyVisibleElement("have.value", values.textInput2);
};
