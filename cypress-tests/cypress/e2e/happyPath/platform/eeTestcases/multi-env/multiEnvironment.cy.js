import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import {
    ENVIRONMENTS,
    ENVIRONMENT_VALUES,
    DB_VALUES,
    WAIT_TIMES,
    TABLE_VALUES,
} from "Constants/constants/multiEnv";
import {
    setupWorkspaceConstant,
    setupPostgreSQLDataSource,
    createAppWithComponents,
    verifyEnvironmentData,
    selectEnvironment,
    verifyQueryEditorDisabled,
    verifyGlobalSettingsDisabled,
    verifyInspectorMenuNoDelete,
    verifyComponentsManagerDisabled,
    verifyPageSettingsDisabled,
    verifyComponentInspectorDisabled,
    appPromote,
    releaseAppFromProdAndVisitTheApp,
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

        setupWorkspaceConstant(names.globalConstantName, ENVIRONMENT_VALUES, "Global");
        setupWorkspaceConstant(names.secretConstantName, Cypress.env("pg_host"), "Secret");
        setupWorkspaceConstant(names.dbNameConstant, DB_VALUES, "Global");
        setupWorkspaceConstant(names.tableNameConstant, TABLE_VALUES, "Global");
        setupPostgreSQLDataSource(names.dsName, names.secretConstantName, names.dbNameConstant);

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
        cy.dragAndDropWidget("Button", 400, 400);
        cy.get(commonWidgetSelector.draggableWidget("button1")).should("be.visible");

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.wait(WAIT_TIMES.queryExecution);

        verifyEnvironmentData(DB_VALUES.development, ENVIRONMENT_VALUES.development);
        cy.get(commonWidgetSelector.draggableWidget("button1")).should("be.visible");

        appPromote(ENVIRONMENTS.development, ENVIRONMENTS.staging);
        verifyEnvironmentData(DB_VALUES.staging, ENVIRONMENT_VALUES.staging);
        cy.get(commonWidgetSelector.draggableWidget("button1")).should("be.visible");

        verifyQueryEditorDisabled();
        verifyGlobalSettingsDisabled();
        verifyInspectorMenuNoDelete();
        verifyComponentsManagerDisabled();
        verifyPageSettingsDisabled();
        verifyComponentInspectorDisabled();

        appPromote(ENVIRONMENTS.staging, ENVIRONMENTS.production);
        verifyEnvironmentData(DB_VALUES.production, ENVIRONMENT_VALUES.production);
        cy.get(commonWidgetSelector.draggableWidget("button1")).should("be.visible");

        releaseAppFromProdAndVisitTheApp(testData.appSlug);
        verifyEnvironmentData(DB_VALUES.production, ENVIRONMENT_VALUES.production);
        cy.get(commonWidgetSelector.draggableWidget("button1")).should("be.visible");
    });

    it("should verify multi-environment behavior across dev, staging, and production in preview", () => {
        cy.apiPromoteAppVersion().then(() => {
            const stagingId = Cypress.env("stagingEnvId");
            cy.apiPromoteAppVersion(stagingId);
        });
        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        selectEnvironment("Development");
        verifyEnvironmentData(DB_VALUES.development, ENVIRONMENT_VALUES.development);

        selectEnvironment("Staging");
        verifyEnvironmentData(DB_VALUES.staging, ENVIRONMENT_VALUES.staging);

        selectEnvironment("Production");
        verifyEnvironmentData(DB_VALUES.production, ENVIRONMENT_VALUES.production);
    });
});