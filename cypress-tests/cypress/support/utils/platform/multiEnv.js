import { multiEnvSelector, commonEeSelectors } from "Selectors/eeCommon";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { appVersionSelectors } from "Selectors/exportImport";
import { appVersionText } from "Texts/exportImport";
import { multiEnvText } from "Texts/eeCommon";

const environments = {
    development: "development",
    staging: "staging",
    production: "production",
};

export const setupTableConstant = (tableNameConstant, values) => {
    cy.apiCreateWorkspaceConstant(
        tableNameConstant,
        values.development,
        ["Global"],
        [environments.development]
    ).then((res) => {
        const constantId = res.body.constant.id;
        cy.apiUpdateWsConstant(constantId, values.staging, environments.staging);
        cy.apiUpdateWsConstant(constantId, values.production, environments.production);
    });
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

export const promoteApp = () => {
    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();
    cy.waitForAppLoad();
    cy.wait(3000);
};

export const releaseApp = () => {
    cy.get(commonSelectors.releaseButton).click();
    cy.get(commonSelectors.yesButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");
    cy.wait(500);
};

export const launchApp = () => {
    cy.url().then((url) => {
        const parts = url.split("/");
        const value = parts[parts.length - 1];
        cy.log(`Extracted value: ${value}`);
        cy.visit(`/applications/${value}`);
        cy.wait(3000);
    });
};

export const appPromote = (fromEnv, toEnv) => {
    const commonActions = () => {
        cy.get(commonEeSelectors.promoteButton).click();
        cy.get(commonEeSelectors.promoteButton).eq(1).click();
        cy.waitForAppLoad();
        cy.wait(2000);
    };

    const transitions = {
        development: {
            staging: commonActions,
            production: () => {
                commonActions();
                appPromote("staging", "production");
            },
            release: () => {
                commonActions();
                commonActions();
                cy.get(commonSelectors.releaseButton).click();
                cy.get(commonSelectors.yesButton).click();
                cy.wait(500);
            },
        },
        staging: {
            production: commonActions,
            release: () => {
                commonActions();
                cy.get(commonSelectors.releaseButton).click();
                cy.get(commonSelectors.yesButton).click();
                cy.wait(500);
            },
        },
    };

    const transition = transitions[fromEnv]?.[toEnv];

    transition();
};

export const createNewVersion = (value, newVersion = [], version) => {
    cy.get('[data-cy="list-current-env-name"]').click();
    cy.get(multiEnvSelector.envNameList).eq(0).click();
    cy.get(appVersionSelectors.currentVersionField(value)).click();
    cy.get(appVersionSelectors.createNewVersionButton).click();
    cy.get(appVersionSelectors.createVersionInputField).click();
    cy.contains(`[id*="react-select-"]`, version).click();
    cy.get(appVersionSelectors.versionNameInputField).click().type(newVersion[0]);
    cy.get(appVersionSelectors.createNewVersionButton).click();
    cy.waitForAppLoad();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        appVersionText.createdToastMessage
    );
    cy.get(appVersionSelectors.currentVersionField(newVersion[0])).should(
        "be.visible"
    );
};

export const selectVersion = (value, newVersion = []) => {
    cy.get(appVersionSelectors.currentVersionField(value)).click();
    cy.get(".react-select__menu-list .app-version-name")
        .contains(newVersion[0])
        .click();
    cy.waitForAppLoad();
};

export const selectEnv = (envName) => {
    const envIndex = {
        development: 0,
        staging: 1,
        production: 2,
    }[envName];

    const isValidEnvName = (envName) => {
        return (
            envName === "development" ||
            envName === "staging" ||
            envName === "production"
        );
    };

    if (isValidEnvName(envName)) {
        cy.wait(1000)
        cy.get('[data-cy="list-current-env-name"]').click();
        cy.wait(500)
        const envSelector = `${multiEnvSelector.envNameList}:eq(${envIndex})`;
        cy.get(envSelector).click();
        cy.waitForAppLoad();
    }
};

export const setupGlobalConstant = (globalConstantName, envValues) => {
    cy.apiCreateWorkspaceConstant(
        globalConstantName,
        envValues.development,
        ["Global"],
        [environments.development]
    ).then((res) => {
        const constantId = res.body.constant.id;
        cy.apiUpdateWsConstant(constantId, envValues.staging, environments.staging);
        cy.apiUpdateWsConstant(constantId, envValues.production, environments.production);
    });
};

export const setupSecretConstant = (secretConstantName, hostValue) => {
    cy.apiCreateWorkspaceConstant(
        secretConstantName,
        hostValue,
        ["Secret"],
        [environments.development]
    ).then((res) => {
        const constantId = res.body.constant.id;
        cy.apiUpdateWsConstant(constantId, hostValue, environments.staging);
        cy.apiUpdateWsConstant(constantId, hostValue, environments.production);
    });
};

export const setupDatabaseConstant = (dbNameConstant, values) => {
    cy.apiCreateWorkspaceConstant(
        dbNameConstant,
        values.development,
        ["Global"],
        [environments.development]
    ).then((res) => {
        const constantId = res.body.constant.id;
        cy.apiUpdateWsConstant(constantId, values.staging, environments.staging);
        cy.apiUpdateWsConstant(constantId, values.production, environments.production);
    });
};

export const setupPostgreSQLDataSource = (dsName, secretConstantName, dbNameConstant) => {
    cy.apiCreateGDS(
        `${Cypress.env("server_host")}/api/data-sources`,
        dsName,
        "postgresql",
        [
            { key: "connection_type", value: "manual", encrypted: false },
            { key: "host", value: `{{secrets.${secretConstantName}}}`, encrypted: false },
            { key: "port", value: 5432, encrypted: false },
            { key: "ssl_enabled", value: false, encrypted: false },
            { key: "database", value: `{{constants.${dbNameConstant}}}`, encrypted: false },
            { key: "ssl_certificate", value: "none", encrypted: false },
            { key: "username", value: Cypress.env("pg_user"), encrypted: false },
            { key: "password", value: Cypress.env("pg_password"), encrypted: false },
            { key: "ca_cert", value: null, encrypted: true },
            { key: "client_key", value: null, encrypted: true },
            { key: "client_cert", value: null, encrypted: true },
            { key: "root_cert", value: null, encrypted: true },
            { key: "connection_string", value: null, encrypted: true },
        ]
    );
};

export const createAppWithComponents = (appName, dsName, dbNameConstant, tableNameConstant, globalConstantName) => {
    return cy.apiCreateApp(appName).then(() => {
        cy.apiAddQueryToApp({
            queryName: "psql",
            options: {
                mode: "sql",
                transformationLanguage: "javascript",
                enableTransformation: false,
                query: `SELECT * FROM {{constants.${tableNameConstant}}} WHERE constant = '{{constants.${globalConstantName}}}';`,
                runOnPageLoad: true,
            },
            dataSourceName: dsName,
            dsKind: "postgresql",
        });
        cy.apiAddComponentToApp(
            appName,
            "constant_data",
            widgetPositions.constantData,
            "Text",
            `{{constants.${dbNameConstant}}}`
        );

        cy.apiAddComponentToApp(
            appName,
            "query_data",
            widgetPositions.queryData,
            "Text",
            `{{JSON.stringify(queries.psql.data)}}`
        );
    });
};

export const verifyEnvironmentData = (expectedDbValue, expectedQueryValue) => {
    cy.get(commonWidgetSelector.draggableWidget('constant_data'))
        .should("be.visible")
        .should('contain.text', expectedDbValue);;
    cy.get(commonWidgetSelector.draggableWidget('query_data'))
        .should('contain.text', expectedQueryValue);
    cy.get(commonWidgetSelector.draggableWidget("button1")).should("be.visible");
};

export const selectEnvironment = (envName) => {
    cy.get(multiEnvSelector.previewSettings).click({ timeout: 10000 });
    cy.get(multiEnvSelector.envContainer).click({ timeout: 10000 });
    cy.get(multiEnvSelector.envNameList).contains(envName).click({ timeout: 10000 });
};

export const releaseAppFromProdAndVisitTheApp = (appSlug) => {
    cy.get(commonSelectors.releaseButton).click();
    cy.get(commonSelectors.yesButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");

    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.get(commonWidgetSelector.makePublicAppToggle).check();
    cy.clearAndType(commonWidgetSelector.appNameSlugInput, appSlug);

    cy.get(commonSelectors.appSlugAccept)
        .should("be.visible")
        .and("have.text", "Slug accepted!");
    cy.apiLogout();

    cy.visitSlug({
        actualUrl: `${Cypress.config("baseUrl")}/applications/${appSlug}`,
    });
};

export const verifyQueryEditorDisabled = () => {
    cy.get(multiEnvSelector.queryDetailsContainer)
        .should('have.class', 'disabled');
};

export const verifyGlobalSettingsDisabled = () => {
    cy.contains(multiEnvText.releasedAppText).should('be.visible');
    cy.get(multiEnvSelector.settingsSidebarIcon).click({ force: true });
    cy.get('[data-cy="toggle-maintenance-mode"]')
        .closest('.disabled')
        .should('exist');
    cy.get('[data-cy="maximum-canvas-width-input-field"]')
        .closest('.disabled')
        .should('exist');
    cy.get(multiEnvSelector.appSlugInput).should('not.be.disabled');
};

export const verifyInspectorMenuNoDelete = () => {
    cy.get(multiEnvSelector.inspectorButtonAria).click({ timeout: 1000 });
    cy.get(multiEnvSelector.inspectorComponentsNode).should('be.visible').click({ timeout: 1000 });
    cy.get(multiEnvSelector.inspectorComponentsNode).eq(2).should('be.visible').click({ timeout: 1000 });
    cy.get(multiEnvSelector.inspectorMenuIcon).click({ force: true });
    cy.get(multiEnvSelector.popoverBody).should('be.visible');
    cy.get(multiEnvSelector.anyDeleteInPopover).should('not.exist');
    cy.get(multiEnvSelector.popoverBody).should('not.contain.text', 'Delete');
    cy.forceClickOnCanvas();
};

export const verifyComponentsManagerDisabled = () => {
    cy.get('.widgets-list').should('have.css', 'pointer-events', 'none');
    cy.get(multiEnvSelector.componentsPlusButton).click();
};

export const verifyPageSettingsDisabled = () => {
    cy.get(multiEnvSelector.pagesTabButton).click();
    cy.contains(multiEnvText.releasedAppText, { timeout: 8000 }).should('be.visible');
    cy.get('#page-settings-tabpane-properties .disabled').should('exist');
    cy.get('#page-settings-tabpane-styles .disabled').should('exist');
    cy.forceClickOnCanvas();
};

export const verifyComponentInspectorDisabled = () => {
    cy.get(commonWidgetSelector.draggableWidget('button1')).click();
    cy.wait(500);
    cy.contains(multiEnvText.releasedAppText, { timeout: 5000 }).should('be.visible');
    cy.get('#inspector-tabpane-properties .disabled').should('exist');
    cy.get('#inspector-tabpane-styles .disabled').should('exist');
    cy.forceClickOnCanvas();
};

