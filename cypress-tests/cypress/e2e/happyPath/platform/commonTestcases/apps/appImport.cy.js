import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { appVersionSelectors, importSelectors } from "Selectors/exportImport";
import { dashboardSelector } from "Selectors/dashboard";
import { importText } from "Texts/exportImport";
import {
  importAndVerifyApp,
  verifyImportModalElements,
  setupDataSourceWithConstants,
} from "Support/utils/exportImport";
import { switchVersionAndVerify } from "Support/utils/version";
import { renameApp } from "Support/utils/editor/editorHeaderOperations";

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

  const generateTestData = () => ({
    workspaceName: fake.firstName,
    workspaceSlug: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
    appName: `${fake.companyName}-IE-App`,
    appReName: `${fake.companyName}-${fake.companyName}-IE-App`,
    dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
  });

  const setupWorkspaceConstants = (dsEnv) => {
    cy.apiCreateWorkspaceConstant(
      "pageHeader",
      "Import and Export",
      ["Global"],
      [dsEnv]
    );
    cy.apiCreateWorkspaceConstant("db_name", "persons", ["Secret"], [dsEnv]);
  };

  const getDataSourceEnvironment = () => {
    const edition = Cypress.env("environment");
    return edition === "Community" ? "production" : "development";
  };

  const verifyAppNameInEditor = (expectedName) => {
    cy.get('[data-cy="editor-app-name-input"]')
      .should("be.visible")
      .verifyVisibleElement("have.text", expectedName);
  };

  const setupCommunityOrEnterpriseDataSource = () => {
    const edition = Cypress.env("environment");
    if (edition === "Community" || edition === "Enterprise") {
      const dsEnv = getDataSourceEnvironment();
      setupDataSourceWithConstants(dsEnv);
      setupWorkspaceConstants(dsEnv);
      return dsEnv;
    }
    return null;
  };

  let data;

  beforeEach(() => {
    cy.viewport(1400, 1400);
    data = generateTestData();

    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then(
      (workspace) => {
        Cypress.env("workspaceId", workspace.body.organization_id);
      }
    );
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

    cy.get(dashboardSelector.importAppButton).should("be.visible").click();
    importAndVerifyApp(
      TEST_DATA.invalidApp,
      "Could not import: SyntaxError: Expected ',' or '}' after property value in JSON at position 246 (line 11 column 13)"
    );
  });

  it("should verify app with multiple version", () => {
    cy.intercept("POST", "/api/v2/resources/import").as("importApp");

    cy.get(importSelectors.importOptionInput)
      .eq(0)
      .selectFile(TEST_DATA.appFiles.multiVersion, { force: true });

    verifyImportModalElements("three-versions");

    cy.get(importSelectors.importAppButton).click();
    cy.get(commonSelectors.toastMessage)
      .should("be.visible")
      .and("have.text", importText.appImportedToastMessage);

    cy.get(commonSelectors.toastCloseButton).click();
    verifyAppNameInEditor("three-versions");
    cy.get(appVersionSelectors.currentVersionField("v3")).should("be.visible");

    renameApp(data.appName);
    verifyAppNameInEditor(data.appName);

    verifyCommonData({
      text2: "",
      textInput1: "",
      textInput2: "Leanne Graham",
    });

    cy.visit(`${data.workspaceSlug}/database`);
    cy.get('[data-cy="student-table"]').verifyVisibleElement(
      "have.text",
      "student"
    );

    cy.visit(`${data.workspaceSlug}/data-sources`);
    cy.get('[data-cy="postgresql-button"]').should("be.visible");
    setupCommunityOrEnterpriseDataSource();

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

    switchVersionAndVerify("v3", "v1");
    verifyCommonData({
      text2: "Import and Export",
      textInput1: "John",
      textInput2: "Leanne Graham",
    });
  });

  it("should verify app with single version", () => {
    cy.get(importSelectors.dropDownMenu).click();

    importAndVerifyApp(TEST_DATA.appFiles.singleVersion);
    verifyAppNameInEditor("one_version");

    const dsEnv = setupCommunityOrEnterpriseDataSource();

    if (dsEnv) {
      setupDataSourceWithConstants(dsEnv);
    }

    cy.reload();
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
