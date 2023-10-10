import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import { commonText, commonWidgetText } from "Texts/common";
import * as common from "Support/utils/common";
import { commonEeSelectors } from "Selectors/eeCommon";
import { promoteApp, releaseApp, launchApp } from "Support/utils/multiEnv";
import { dataSourceSelector } from "Selectors/dataSource";
import { AddNewconstants } from "Support/utils/workspaceConstants";
import { buttonText } from "Texts/button";
import {
    verifyAndModifyParameter,
    editAndVerifyWidgetName,
} from "Support/utils/commonWidget";

import {

    addQuery,
    selectDatasource,
} from "Support/utils/dataSource";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";

const data = {};
data.constantsName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.appName = `${fake.companyName}-App`;
data.dsName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.widgetName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Workspace constants", () => {
    beforeEach(() => {
        cy.apiLogin();
    });
    it("Should verify the workspace constants on gds connection form", () => {
        cy.apiLogin();
        cy.apiCreateGDS(
            "http://localhost:3000/api/v2/data_sources",
            data.dsName,
            "postgresql",
            [
                { key: "host", value: Cypress.env("pg_host") },
                { key: "port", value: 5432 },
                { key: "database", value: "" },
                { key: "username", value: "postgres" },
                { key: "password", value: Cypress.env("pg_password"), encrypted: true },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
            ]
        );
        cy.visit("/");
        common.navigateToworkspaceConstants();
        AddNewconstants(data.constantsName, "development_multi_env");
        AddNewconstants(
            `${data.constantsName}_password`,
            Cypress.env("pg_password")
        );
        cy.wait(500);
        cy.get('[data-cy="left-menu-items tj-text-xsm"] > :nth-child(2)').click();
        AddNewconstants(
            `${data.constantsName}_password`,
            Cypress.env("pg_password")
        );
        AddNewconstants(data.constantsName, "staging_multi_env");
        cy.wait(500);
        cy.get('[data-cy="left-menu-items tj-text-xsm"] > :nth-child(3)').click();
        AddNewconstants(
            `${data.constantsName}_password`,
            Cypress.env("pg_password")
        );
        AddNewconstants(data.constantsName, "production_multi_env");

        cy.get(commonSelectors.globalDataSourceIcon).click();
        selectDatasource(data.dsName);
        cy.get('[data-cy="development-label"]').click();
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type("{{constants.}}", { parseSpecialCharSequences: false });
        cy.get('[data-cy="alert-banner-type-text"]').verifyVisibleElement(
            "have.text",
            "Error"
        );
        cy.get('[data-cy="variable-preview"]').should("contain", "{{constants.}}");
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get('[data-cy="alert-banner-type-text"]').verifyVisibleElement(
            "have.text",
            " Workspace Constant - string"
        );
        cy.get('[data-cy="variable-preview"]').should(
            "contain",
            "development_multi_env"
        );
        cy.get(".tj-btn").click();
        cy.wait(500);
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type("{{constants.}}", { parseSpecialCharSequences: false });
        cy.get('[data-cy="alert-banner-type-text"]')
            .eq(1)
            .verifyVisibleElement("have.text", "Error");
        cy.get('[data-cy="variable-preview"]')
            .eq(1)
            .should("contain", "{{constants.}}");
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}_password}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get('[data-cy="alert-banner-type-text"]')
            .eq(1)
            .verifyVisibleElement("have.text", " Workspace Constant - string");
        cy.get('[data-cy="variable-preview"]')
            .eq(1)
            .should("contain", Cypress.env("pg_password"));

        cy.get(postgreSqlSelector.buttonTestConnection).click();
        cy.get(postgreSqlSelector.textConnectionVerified, {
            timeout: 7000,
        }).should("have.text", postgreSqlText.labelConnectionVerified);
        cy.get(dataSourceSelector.buttonSave).click();
        cy.wait(500);

        cy.get('[data-cy="staging-label"]').click();
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type("{{constants.}}", { parseSpecialCharSequences: false });
        cy.get('[data-cy="alert-banner-type-text"]').verifyVisibleElement(
            "have.text",
            "Error"
        );
        cy.get('[data-cy="variable-preview"]').should("contain", "{{constants.}}");
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get('[data-cy="alert-banner-type-text"]').verifyVisibleElement(
            "have.text",
            " Workspace Constant - string"
        );
        cy.get('[data-cy="variable-preview"]').should(
            "contain",
            "staging_multi_env"
        );

        cy.get(".tj-btn").click();
        cy.wait(500);
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type("{{constants.}}", { parseSpecialCharSequences: false });
        cy.get('[data-cy="alert-banner-type-text"]')
            .eq(1)
            .verifyVisibleElement("have.text", "Error");
        cy.get('[data-cy="variable-preview"]')
            .eq(1)
            .should("contain", "{{constants.}}");
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}_password}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get('[data-cy="alert-banner-type-text"]')
            .eq(1)
            .verifyVisibleElement("have.text", " Workspace Constant - string");
        cy.get('[data-cy="variable-preview"]')
            .eq(1)
            .should("contain", Cypress.env("pg_password"));

        cy.get(postgreSqlSelector.buttonTestConnection).click();
        cy.get(postgreSqlSelector.textConnectionVerified, {
            timeout: 7000,
        }).should("have.text", postgreSqlText.labelConnectionVerified);
        cy.get(dataSourceSelector.buttonSave).click();
        cy.wait(500);

        cy.get('[data-cy="production-label"]').click();
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type("{{constants.}}", { parseSpecialCharSequences: false });
        cy.get('[data-cy="alert-banner-type-text"]').verifyVisibleElement(
            "have.text",
            "Error"
        );
        cy.get('[data-cy="variable-preview"]').should("contain", "{{constants.}}");
        cy.get('[data-cy="database-name-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get('[data-cy="alert-banner-type-text"]').verifyVisibleElement(
            "have.text",
            " Workspace Constant - string"
        );
        cy.get('[data-cy="variable-preview"]').should(
            "contain",
            "production_multi_env"
        );
        cy.get(".tj-btn").click();
        cy.wait(500);
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type("{{constants.}}", { parseSpecialCharSequences: false });
        cy.get('[data-cy="alert-banner-type-text"]')
            .eq(1)
            .verifyVisibleElement("have.text", "Error");
        cy.get('[data-cy="variable-preview"]')
            .eq(1)
            .should("contain", "{{constants.}}");
        cy.get('[data-cy="password-text-field"]')
            .clear()
            .type(`{{constants.${data.constantsName}_password}}`, {
                parseSpecialCharSequences: false,
            });
        cy.get('[data-cy="alert-banner-type-text"]')
            .eq(1)
            .verifyVisibleElement("have.text", " Workspace Constant - string");
        cy.get('[data-cy="variable-preview"]')
            .eq(1)
            .should("contain", Cypress.env("pg_password"));

        cy.get(postgreSqlSelector.buttonTestConnection).click();
        cy.get(postgreSqlSelector.textConnectionVerified, {
            timeout: 7000,
        }).should("have.text", postgreSqlText.labelConnectionVerified);
        cy.get(dataSourceSelector.buttonSave).click();
        cy.wait(1000);

        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.renameApp(data.appName);
        cy.dragAndDropWidget("Text", 550, 650);

        addQuery("table_preview", `SELECT * FROM tooljet;`, data.dsName);
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(".custom-toggle-switch>.switch>").eq(3).click();
        cy.waitForAutoSave();
        editAndVerifyWidgetName(data.widgetName);
        cy.waitForAutoSave();

        verifyAndModifyParameter("Text", `{{queries.table_preview.data[0].env`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "Development");

        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(4000);

        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "Development");

        cy.go("back");
        cy.waitForAppLoad();
        cy.wait(3000);
        promoteApp()

        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "Staging");

        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(4000);
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "Staging");

        cy.go("back");
        cy.waitForAppLoad();
        cy.wait(3000);
        promoteApp()

        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "Production");

        cy.openInCurrentTab(commonWidgetSelector.previewButton);
        cy.wait(4000);

        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "Production");

        cy.go("back");
        cy.waitForAppLoad();
        cy.wait(3000);
        releaseApp()

        launchApp()
        cy.get(
            commonWidgetSelector.draggableWidget(data.widgetName)
        ).verifyVisibleElement("have.text", "Production");
    });
});
