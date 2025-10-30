import { fake } from "Fixtures/fake";
import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import { dataSourceSelector } from "Selectors/dataSource";
import { setupGlobalConstant, setupSecretConstant, setupDatabaseConstant, setupTableConstant, setupPostgreSQLDataSource, createAppWithComponents, verifyEnvironmentData, selectEnvironment, verifyQueryEditorDisabled, verifyGlobalSettingsDisabled, verifyInspectorMenuNoDelete, verifyComponentsManagerDisabled, verifyPageSettingsDisabled, verifyComponentInspectorDisabled, appPromote, releaseAppFromProdAndVisitTheApp } from "Support/utils/platform/multiEnv";

const waitTimes = {
    promotion: 2000,
    queryExecution: 1000,
};

const environments = {
    development: "development",
    staging: "staging",
    production: "production",
};

const environmentValues = {
    development: "dev",
    staging: "stage",
    production: "prod",
};

const dbValues = {
    development: "multi_env_development_db",
    staging: "multi_env_staging_db",
    production: "multi_env_production_db",
};

const tableValues = {
    development: "multi_env_development_table",
    staging: "multi_env_staging_table",
    production: "multi_env_production_table",
};

const widgetPositions = {
    queryData: {
        desktop: { top: 100, left: 20 },
        mobile: { width: 8, height: 50 },
    },
    constantData: {
        desktop: { top: 70, left: 25 },
        mobile: { width: 8, height: 50 },
    },
    textInput: {
        x: 550,
        y: 650,
    },
};

describe("Multi env", () => {
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

        setupGlobalConstant(names.globalConstantName, environmentValues);
        setupSecretConstant(names.secretConstantName, Cypress.env("pg_host"));
        setupDatabaseConstant(names.dbNameConstant, dbValues);
        setupTableConstant(names.tableNameConstant, tableValues);
        setupPostgreSQLDataSource(names.dsName, names.secretConstantName, names.dbNameConstant);

        createAppWithComponents(names.appName, names.dsName, names.dbNameConstant, names.tableNameConstant, names.globalConstantName).then(() => {
            cy.openApp(
                "",
                Cypress.env("workspaceId"),
                Cypress.env("appId"),
                commonWidgetSelector.draggableWidget("query_data")
            );
        });
    });

    it("should verify multi-environment behavior across dev, staging, and production in editor and in released app", () => {
        cy.forceClickOnCanvas();
        cy.dragAndDropWidget("Button", 400, 400);
        cy.get(commonWidgetSelector.draggableWidget("button1")).should("be.visible");

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.wait(waitTimes.queryExecution)
        verifyEnvironmentData(dbValues.development, environmentValues.development);
        appPromote(environments.development, environments.staging);
        verifyEnvironmentData(dbValues.staging, environmentValues.staging);

        verifyQueryEditorDisabled();
        verifyGlobalSettingsDisabled();
        verifyInspectorMenuNoDelete()
        verifyComponentsManagerDisabled();
        verifyPageSettingsDisabled()
        verifyComponentInspectorDisabled()

        appPromote(environments.staging, environments.production);
        verifyEnvironmentData(dbValues.production, environmentValues.production);
        releaseAppFromProdAndVisitTheApp(testData.appSlug)
        verifyEnvironmentData(dbValues.production, environmentValues.production);
    });

    it("should verify multi-environment behavior across dev, staging, and production in preview", () => {
        cy.forceClickOnCanvas();
        cy.dragAndDropWidget("Button", 400, 400);

        cy.apiPromoteAppVersion().then(() => {
            const stagingId = Cypress.env("stagingEnvId");
            cy.apiPromoteAppVersion(stagingId);
        });
        cy.openInCurrentTab('[data-cy="preview-link-button"]');
        selectEnvironment('Development');
        verifyEnvironmentData(dbValues.development, environmentValues.development);

        selectEnvironment('Staging')

        verifyEnvironmentData(dbValues.staging, environmentValues.staging);

        selectEnvironment('Production');
        verifyEnvironmentData(dbValues.production, environmentValues.production);
    });
});
