import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import {
  Environments,
  EnvironmentValues,
  DBValues,
  WaitTimes,
  TableValues,
} from "Constants/constants/multiEnv";
import {
  setupWorkspaceConstant,
  setupPostgreSQLDataSource,
  createAppWithComponents,
  verifyEnvironmentData,
  selectEnvironment,
  verifyQueryEditorDisabled,
  verifyGlobalSettingsDisabled,
  verifyInspectorMenuHasNoDeleteOption,
  verifyComponentsManagerDisabled,
  verifyPageSettingsDisabled,
  verifyComponentInspectorDisabled,
  appPromote,
  releaseAndVisitApp,
} from "Support/utils/platform/multiEnv";

describe("Multi-Environment Behavior", () => {
  let testData = {};

  beforeEach(() => {
    const uniqueId = `${fake.firstName.toLowerCase().replace(/[^a-z]/g, "")}_${Date.now()}`;
    testData = {
      appName: `${fake.companyName} App ${Date.now()}`,
      baseId: uniqueId,
      appSlug: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
    };

    cy.apiLogin();
    cy.skipWalkthrough();

    const names = {
      appName: testData.appName,
      globalConstantName: `${testData.baseId}_global`,
      secretConstantName: `${testData.baseId}_host`,
      dbNameConstant: `${testData.baseId}_db`,
      tableNameConstant: `${testData.baseId}_table`,
      dsName: `pg-multi-env-${testData.baseId}`,
    };

    setupWorkspaceConstant(
      names.globalConstantName,
      EnvironmentValues,
      "Global"
    );
    setupWorkspaceConstant(
      names.secretConstantName,
      Cypress.env("pg_host"),
      "Secret"
    );
    setupWorkspaceConstant(names.dbNameConstant, DBValues, "Global");
    setupWorkspaceConstant(names.tableNameConstant, TableValues, "Global");
    setupPostgreSQLDataSource(
      names.dsName,
      names.secretConstantName,
      names.dbNameConstant
    );

    createAppWithComponents(
      names.appName,
      names.dsName,
      names.dbNameConstant,
      names.tableNameConstant,
      names.globalConstantName
    ).then(() => {
      cy.openApp(
        "",
        Cypress.env("workspaceId"),
        Cypress.env("appId"),
        commonWidgetSelector.draggableWidget("query_data")
      );
    });
  });

  it("should verify multi-environment behavior across dev, staging, and production in editor and in released app", () => {
    // cy.get('[data-cy="query-manager-toggle-button"]').click();

    cy.dragAndDropWidget("Button", 350, 100);
    cy.wait(200)
    cy.get(commonWidgetSelector.draggableWidget("button1")).should(
      "be.visible"
    );

    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    cy.wait(WaitTimes.queryExecution);

    verifyEnvironmentData(DBValues.development, EnvironmentValues.development);
    cy.get(commonWidgetSelector.draggableWidget("button1")).should(
      "be.visible"
    );

    appPromote(Environments.development, Environments.staging);
    verifyEnvironmentData(DBValues.staging, EnvironmentValues.staging);
    cy.get(commonWidgetSelector.draggableWidget("button1")).should(
      "be.visible"
    );

    verifyQueryEditorDisabled();
    verifyGlobalSettingsDisabled();
    verifyInspectorMenuHasNoDeleteOption();
    verifyComponentsManagerDisabled();
    verifyPageSettingsDisabled();
    verifyComponentInspectorDisabled();

    appPromote(Environments.staging, Environments.production);
    verifyEnvironmentData(DBValues.production, EnvironmentValues.production);
    cy.get(commonWidgetSelector.draggableWidget("button1")).should(
      "be.visible"
    );

    verifyQueryEditorDisabled();
    verifyGlobalSettingsDisabled();
    verifyComponentsManagerDisabled();
    verifyPageSettingsDisabled();
    verifyComponentInspectorDisabled();

    releaseAndVisitApp(testData.appSlug);
    verifyEnvironmentData(DBValues.production, EnvironmentValues.production);
    cy.get(commonWidgetSelector.draggableWidget("button1")).should(
      "be.visible"
    );
  });

  it("should verify multi-environment behavior across dev, staging, and production in preview", () => {
    cy.apiPromoteAppVersion().then(() => {
      const stagingId = Cypress.env("stagingEnvId");
      cy.apiPromoteAppVersion(stagingId);
    });
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.get('[data-cy="draggable-widget-constant_data"]', { timeout: 40000 }).should('be.visible');
    cy.wait(200);
    selectEnvironment("Development");
    verifyEnvironmentData(DBValues.development, EnvironmentValues.development);
    cy.wait(1000);
    selectEnvironment("Staging");
    verifyEnvironmentData(DBValues.staging, EnvironmentValues.staging);
    cy.wait(1000);
    selectEnvironment("Production");
    verifyEnvironmentData(DBValues.production, EnvironmentValues.production);
  });
});
