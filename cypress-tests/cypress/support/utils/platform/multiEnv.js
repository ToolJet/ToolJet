import { commonEeSelectors } from "Selectors/eeCommon";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { appVersionSelectors } from "Selectors/exportImport";
import { appVersionText } from "Texts/exportImport";
import { multiEnvText } from "Texts/eeCommon";
import { appEditorSelector } from "Selectors/multiEnv";
import { Environments, WidgetPositions } from "Constants/constants/multiEnv";
import { multiEnvSelector } from "Selectors/eeCommon";

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
        [Environments.development]: {
            [Environments.staging]: commonActions,
            [Environments.production]: () => {
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
    cy.get(appEditorSelector.editor.pages.envNameList).eq(0).click();
    cy.get(appVersionSelectors.currentVersionField(value)).click();
    cy.get(appVersionSelectors.createNewVersionButton).click();
    cy.get(appVersionSelectors.createVersionInputField).click();
    cy.contains(`[id*="react-select-"]`, version).click();
    cy.get(appVersionSelectors.versionNameInputField).click().type(newVersion[0]);
    cy.get(appVersionSelectors.createNewVersionButton).click();
    cy.waitForAppLoad();
    cy.verifyToastMessage(commonSelectors.toastMessage, appVersionText.createdToastMessage);
    cy.get(appVersionSelectors.currentVersionField(newVersion[0])).should("be.visible");
};

export const selectVersion = (value, newVersion = []) => {
    cy.get(appVersionSelectors.currentVersionField(value)).click();
    cy.get(".react-select__menu-list .app-version-name").contains(newVersion[0]).click();
    cy.waitForAppLoad();
};

export const selectEnv = (envName) => {
    const envIndex = {
        development: 0,
        staging: 1,
        production: 2,
    }[envName];

    const isValidEnvName = (envName) =>
        envName === "development" || envName === "staging" || envName === "production";

    if (isValidEnvName(envName)) {
        cy.wait(1000);
        cy.get('[data-cy="list-current-env-name"]').click();
        cy.wait(500);
        const envSelector = `${appEditorSelector.editor.pages.envNameList}:eq(${envIndex})`;
        cy.get(envSelector).click();
        cy.waitForAppLoad();
    }
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
            WidgetPositions.constantData,
            "Text",
            `{{constants.${dbNameConstant}}}`
        );

        cy.apiAddComponentToApp(
            appName,
            "query_data",
            WidgetPositions.queryData,
            "Text",
            `{{JSON.stringify(queries.psql.data)}}`
        );
    });
};

export const verifyEnvironmentData = (expectedDbValue, expectedQueryValue) => {
    cy.get(commonWidgetSelector.draggableWidget("constant_data"))
        .should("be.visible")
        .should("contain.text", expectedDbValue);
    cy.get(commonWidgetSelector.draggableWidget("query_data"))
        .should("contain.text", expectedQueryValue);
};

export const selectEnvironment = (envName) => {
    cy.get(multiEnvSelector.previewSettings).click({ timeout: 10000 });
    cy.get(multiEnvSelector.envContainer).click({ timeout: 10000 });
    cy.get(multiEnvSelector.envNameList).contains(envName).click({ timeout: 10000 });
};

export const releaseAndVisitApp = (appSlug) => {
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
    cy.get(appEditorSelector.editor.queryDetailsContainer).should("have.class", "disabled");
};

export const verifyGlobalSettingsDisabled = () => {
    cy.contains(multiEnvText.releasedAppText).should("be.visible");
    cy.get(appEditorSelector.settings.settingsSidebarIcon).click({ force: true });
    cy.get(appEditorSelector.settings.maintenanceToggle).parents(".disabled").should("exist");
    cy.get(appEditorSelector.settings.maxCanvasWidthInput).parents(".disabled").should("exist");
    cy.get(appEditorSelector.settings.appSlugInput).should("not.be.disabled");
};

export const verifyInspectorMenuHasNoDeleteOption = () => {
    cy.get(appEditorSelector.editor.inspector.buttonAria).click({ timeout: 1000 });
    cy.get(appEditorSelector.editor.inspector.componentsNode).should("be.visible").click({ timeout: 1000 });
    cy.get(appEditorSelector.editor.inspector.componentsNode).eq(2).should("be.visible").click({ timeout: 1000 });
    cy.get(appEditorSelector.editor.inspector.menuIcon).click({ force: true });
    cy.get(appEditorSelector.editor.inspector.popoverBody).should("be.visible");
    cy.get(appEditorSelector.editor.inspector.anyDeleteInPopover).should("not.exist");
    cy.get(appEditorSelector.editor.inspector.popoverBody).should("not.contain.text", "Delete");
    cy.forceClickOnCanvas();
};

export const verifyComponentsManagerDisabled = () => {
    cy.get(".widgets-list").should("have.css", "pointer-events", "none");
    cy.get(appEditorSelector.editor.components.componentsPlusButton).click();
};

export const verifyPageSettingsDisabled = () => {
    cy.get(appEditorSelector.editor.pages.pagesTabButton).click();
    cy.contains(multiEnvText.releasedAppText, { timeout: 8000 }).should("be.visible");
    cy.get("#page-settings-tabpane-properties .disabled").should("exist");
    cy.get("#page-settings-tabpane-styles .disabled").should("exist");
    cy.forceClickOnCanvas();
};

export const verifyComponentInspectorDisabled = () => {
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.wait(500);
    cy.contains(multiEnvText.releasedAppText, { timeout: 5000 }).should("be.visible");
    cy.get("#inspector-tabpane-properties .disabled").should("exist");
    cy.get("#inspector-tabpane-styles .disabled").should("exist");
    cy.forceClickOnCanvas();
};

export const setupWorkspaceConstant = (constantName, values, tag = "Global") => {
    const getValue = (env) => values[env] || values;
    cy.apiCreateWorkspaceConstant(constantName, getValue(Environments.development), [tag], [Environments.development]).then((res) => {
        const constantId = res.body.constant.id;
        cy.apiUpdateWsConstant(constantId, getValue(Environments.staging), Environments.staging);
        cy.apiUpdateWsConstant(constantId, getValue(Environments.production), Environments.production);
    });
};
