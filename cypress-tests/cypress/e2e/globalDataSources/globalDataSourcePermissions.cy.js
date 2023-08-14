import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
    fillDataSourceTextField,
    selectDataSource,
    fillConnectionForm,
    addQuery,
} from "Support/utils/postgreSql";
import { commonText } from "Texts/common";
import { closeDSModal, deleteDatasource } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { dataSourceText } from "Texts/dataSource";
import { addNewUserMW } from "Support/utils/userPermissions";
import { groupsSelector } from "Selectors/manageGroups";
import {
    logout,
    navigateToAppEditor,
    navigateToManageGroups,
    pinInspector
} from "Support/utils/common";

const data = {};
data.firstName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.email = fake.email.toLowerCase();
data.lastName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.appName = `${fake.companyName}-App`;

describe("Global Datasource Manager", () => {
    beforeEach(() => {
        cy.appUILogin();
        cy.viewport(1200, 1300);
    });
    before(() => {
        cy.appUILogin();
        cy.createApp();
        cy.renameApp(data.appName);
        cy.dragAndDropWidget("Button", 50, 50);
        cy.get(commonSelectors.editorPageLogo).click();
        cy.reloadAppForTheElement(data.appName);
        addNewUserMW(data.firstName, data.email);
        logout();
    });

    it("Should verify the global data source manager UI", () => {
        cy.get(commonSelectors.globalDataSourceIcon).click();
        closeDSModal();
        cy.get(commonSelectors.addNewDataSourceButton)
            .verifyVisibleElement("have.text", commonText.addNewDataSourceButton)
            .click();

        cy.get(dataSourceSelector.allDatasourceLabelAndCount).should(
            "have.text",
            dataSourceText.allDataSources
        );
        cy.get(dataSourceSelector.databaseLabelAndCount).should(
            "have.text",
            dataSourceText.allDatabase
        );
        cy.get(dataSourceSelector.apiLabelAndCount).should(
            "have.text",
            dataSourceText.allApis
        );
        cy.get(dataSourceSelector.cloudStorageLabelAndCount).should(
            "have.text",
            dataSourceText.allCloudStorage
        );
    });
    it("Should verify the Datasource connection and query creation using global data source", () => {
        selectDataSource(dataSourceText.postgreSQL);

        cy.clearAndType(
            '[data-cy="data-source-name-input-filed"]',
            `cypress-${data.lastName}-postgresql`
        );

        cy.intercept("GET", "api/v2/data_sources").as("datasource");
        fillConnectionForm(
            {
                Host: Cypress.env("gds_pg_host"),
                Port: "5432",
                "Database Name": Cypress.env("gds_pg_user"),
                Username: Cypress.env("gds_pg_user"),
                Password: Cypress.env("gds_pg_password"),
            },
            ".form-switch"
        );
        cy.wait("@datasource");

        cy.get(dataSourceSelector.buttonTestConnection).click();
        cy.get(dataSourceSelector.textConnectionVerified, {
            timeout: 10000,
        }).should("have.text", dataSourceText.labelConnectionVerified);
        cy.get(dataSourceSelector.buttonSave).click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            dataSourceText.toastDSAdded
        );

        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get(
            `[data-cy="cypress-${data.lastName}-postgresql-button"]`
        ).verifyVisibleElement("have.text", `cypress-${data.lastName}-postgresql`);
        cy.get(commonSelectors.dashboardIcon).click();
        navigateToAppEditor(data.appName);

        cy.get(
            `[data-cy="cypress-${data.lastName}-postgresql-add-query-card"]`
        ).should("be.visible");

        addQuery(
            "table_preview",
            `SELECT * FROM persons;`,
            `cypress-${data.lastName}-postgresql`
        );

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview"
        );

        pinInspector()

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-table_preview"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "4 items "
        );
        cy.get(dataSourceSelector.buttonAddNewQueries).click();

        cy.get(
            ".query-datasource-card-container > .col-auto > .query-manager-btn-name"
        )
            .should("be.visible")
            .and("have.text", "Add new global datasource");
        cy.get(
            ".query-datasource-card-container > .col-auto > .query-manager-btn-name"
        ).click();

        selectDataSource(dataSourceText.postgreSQL);
        cy.clearAndType(
            '[data-cy="data-source-name-input-filed"]',
            `cypress-${data.firstName}-postgresql`
        );

        cy.intercept("GET", "api/v2/data_sources").as("datasource");
        fillConnectionForm(
            {
                Host: Cypress.env("pg_host"),
                Port: "5432",
                "Database Name": Cypress.env("pg_user"),
                Username: Cypress.env("pg_user"),
                Password: Cypress.env("pg_password"),
            },
            ".form-switch"
        );
        cy.wait("@datasource");

        navigateToManageGroups();
        cy.get(groupsSelector.appSearchBox).click();
        cy.get(groupsSelector.searchBoxOptions).contains(data.appName).click();
        cy.get(groupsSelector.selectAddButton).click();
        cy.contains("tr", data.appName)
            .parent()
            .within(() => {
                cy.get("td input").eq(1).check();
            });
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "App permissions updated"
        );
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).then(($el) => {
            if (!$el.is(":checked")) {
                cy.get(groupsSelector.appsCreateCheck).check();
            }
        });
    });
    it("Should validate the user's global data source permissions on apps created by admin", () => {
        logout();
        cy.login(data.email, "password");

        cy.get(commonSelectors.globalDataSourceIcon).should("not.exist");

        navigateToAppEditor(data.appName);

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview"
        );

        pinInspector()

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-table_preview"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "4 items "
        );

        addQuery(
            "student_data",
            `SELECT * FROM student_data;`,
            `cypress-${data.firstName}-postgresql`
        );

        cy.get('[data-cy="list-query-student_data"]').verifyVisibleElement(
            "have.text",
            "student_data"
        );
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-student_data"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "8 items "
        );
        cy.get(dataSourceSelector.buttonAddNewQueries).click();
        cy.get(
            ".query-datasource-card-container > .col-auto > .query-manager-btn-name"
        ).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "You don't have access to GDS, contact your workspace admin to add datasources"
        );
    });
    it("Should verify the query creation and scope changing functionality.", () => {
        logout();
        cy.login(data.email, "password");
        cy.createApp();
        cy.renameApp(data.appName);
        cy.dragAndDropWidget("Button", 50, 50);

        addQuery(
            "table_preview",
            `SELECT * FROM persons;`,
            `cypress-${data.lastName}-postgresql`
        );

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview"
        );

        pinInspector()

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-table_preview"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "4 items "
        );
    })
});