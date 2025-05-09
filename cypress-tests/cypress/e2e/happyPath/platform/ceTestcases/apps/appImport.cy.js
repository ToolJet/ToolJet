import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { appVersionSelectors, importSelectors } from "Selectors/exportImport";
import { dashboardSelector } from "Selectors/dashboard";
import { buttonText } from "Texts/button";

import { importText } from "Texts/exportImport";
import { importAndVerifyApp } from "Support/utils/exportImport";
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

  beforeEach(() => {
    cy.viewport(1200, 1300);
    data = {
      workspaceName: fake.firstName,
      workspaceSlug: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
      appName: `${fake.companyName}-IE-App`,
      appReName: `${fake.companyName}-${fake.companyName}-IE-App`,
      dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
    };

    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.apiLogout();
  });

  it("should verify app import functionality", () => {
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
    cy.get(commonWidgetSelector.draggableWidget("button1")).should(
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
