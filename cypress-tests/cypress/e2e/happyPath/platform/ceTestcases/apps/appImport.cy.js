import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { appVersionSelectors, importSelectors } from "Selectors/exportImport";
import { dashboardSelector } from "Selectors/dashboard";
import { buttonText } from "Texts/button";

import { importText } from "Texts/exportImport";
import { importAndVerifyApp } from "Support/utils/exportImport";
import { switchVersionAndVerify } from "Support/utils/version";
import { renameApp, verifyAppName, verifyCurrentEnvironment, verifyCurrentVersion, addNewVersion, promoteEnv } from 'Support/utils/editor/editorHeaderOperations';

describe("App Import", () => {
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

  beforeEach(() => {
    cy.viewport(1400, 1400);
    data = {
      workspaceName: fake.firstName,
      workspaceSlug: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
      appName: `${fake.companyName}-IE-App`,
      appReName: `${fake.companyName}-${fake.companyName}-IE-App`,
      dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
    };

    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then((workspace) => {
      Cypress.env("workspaceId", workspace.body.organization_id);
    });
    cy.skipWalkthrough();
    cy.visit(`${data.workspaceSlug}`);
  });
  it("should verify invalid import files", () => {

    cy.get(importSelectors.dropDownMenu).should("be.visible").click();
    cy.get(importSelectors.importOptionLabel).verifyVisibleElement(
      "have.text",
      importText.importOption
    );

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


  });

  it("should verify app with multiple version", () => {

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
    cy.get(commonSelectors.toastCloseButton).click();
    cy.wait(500);
    cy.get('[data-cy="edit-app-name-button"]').verifyVisibleElement(
      "have.text",
      "three-versions"
    );
    cy.get(appVersionSelectors.currentVersionField("v3")).should("be.visible");

    //App editing is pending

    renameApp(data.appName);
    cy.get('[data-cy="edit-app-name-button"]').verifyVisibleElement(
      "have.text",
      data.appName
    );

    // Verify initial widget states

    verifyCommonData({
      text2: "",
      textInput1: "",
      textInput2: "Leanne Graham",
    });

    // cy.get(
    //   commonWidgetSelector.draggableWidget("textInput3")
    // ).verifyVisibleElement("have.value", "");

    // Setup database and data sources
    cy.visit(`${data.workspaceSlug}/database`);
    cy.get('[data-cy="student-table"]').verifyVisibleElement(
      "have.text",
      "student"
    );

    // cy.apiAddDataToTable("student", {
    //   name: "Paramu",
    //   country: "India",
    //   state: "Kerala",
    // });

    cy.visit(`${data.workspaceSlug}/data-sources`);
    cy.get('[data-cy="postgresql-button"]').should("be.visible");

    const edition = Cypress.env("environment");
    if (edition === "Community" || edition === "Enterprise") {
      const dsEnv = edition === "Community" ? "production" : "development";
      cy.apiUpdateDataSource("postgresql", dsEnv, {
        options: [{
          key: "password",
          value: Cypress.env("pg_password"),
          encrypted: true,
        }],
      });
      cy.apiCreateWorkspaceConstant("pageHeader", "Import and Export", ["Global"], [dsEnv]);
      cy.apiCreateWorkspaceConstant("db_name", "persons", ["Secret"], [dsEnv]);
    }

    // Verify app after setup
    cy.wait("@importApp").then((interception) => {
      const appId = interception.response.body.imports.app[0].id;
      cy.log(`Imported app id: ${appId}`);
      cy.openApp(
        "",
        Cypress.env("workspaceId"),
        appId,
        commonWidgetSelector.draggableWidget("text2")
      );
    });

    verifyCommonData({
      text2: "Import and Export",
      textInput1: "John",
      textInput2: "Leanne Graham",
    });
    // cy.get(
    //   commonWidgetSelector.draggableWidget("textInput3")
    // ).verifyVisibleElement("have.value", "India");

    switchVersionAndVerify("v3", "v1");

    verifyCommonData({
      text2: "Import and Export",
      textInput1: "John",
      textInput2: "Leanne Graham",
    });

    cy.wait(1000);
    cy.backToApps();

    // Test single version import

  });

  it("should verify app with single version", () => {

    cy.get(importSelectors.dropDownMenu).click();
    const edition = Cypress.env("environment");
    let dsEnv
    if (edition === "Community" || edition === "Enterprise") {
      dsEnv = edition === "Community" ? "production" : "development";
      cy.apiCreateWorkspaceConstant("pageHeader", "Import and Export", ["Global"], [dsEnv]);
      cy.apiCreateWorkspaceConstant("db_name", "persons", ["Secret"], [dsEnv]);
    }

    importAndVerifyApp(TEST_DATA.appFiles.singleVersion);

    cy.get('[data-cy="edit-app-name-button"]').verifyVisibleElement(
      "have.text",
      "one_version"
    );
    cy.apiUpdateDataSource("postgresql", dsEnv, {
      options: [{
        key: "password",
        value: Cypress.env("pg_password"),
        encrypted: true,
      }],
    });

    cy.reload()



    verifyCommonData({
      text2: "Import and Export",
      textInput1: "John",
      textInput2: "Leanne Graham",
    });
  });
});

const verifyCommonData = (values) => {
  cy.get(commonWidgetSelector.draggableWidget("text2")).verifyVisibleElement(
    "have.text",
    values.text2
  );
  cy.get(
    commonWidgetSelector.draggableWidget("textInput1")
  ).verifyVisibleElement("have.value", values.textInput1);
  cy.get(
    commonWidgetSelector.draggableWidget("textInput2")
  ).verifyVisibleElement("have.value", values.textInput2);
};
