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
import { eeGroupsSelector } from "Selectors/eeCommon";
import {
    logout,
    navigateToAppEditor,
    navigateToManageGroups,
    pinInspector,
    createGroup,
} from "Support/utils/common";

import { AddDataSourceToGroup } from "Support/utils/eeCommon";

const data = {};
data.userName1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.userEmail1 = fake.email.toLowerCase();
data.ds1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.ds2 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
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
        addNewUserMW(data.userName1, data.userEmail1);
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
            `cypress-${data.ds1}-postgresql`
        );

        cy.intercept("POST", "/api/v2/data_sources").as("ds");
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
        cy.wait("@ds");

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
            `[data-cy="cypress-${data.ds1}-postgresql-button"]`
        ).verifyVisibleElement("have.text", `cypress-${data.ds1}-postgresql`);
        cy.get(commonSelectors.dashboardIcon).click();
        navigateToAppEditor(data.appName);

        cy.get(`[data-cy="cypress-${data.ds1}-postgresql-add-query-card"]`).should(
            "be.visible"
        );

        addQuery(
            "table_preview",
            `SELECT * FROM Persons;`,
            `cypress-${data.ds1}-postgresql`
        );

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview"
        );

        pinInspector();

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-table_preview"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "7 items "
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
            `cypress-${data.ds2}-postgresql`
        );

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
        cy.waitForAppLoad();
    });
    it("Should validate the user's global data source permissions on apps created by admin", () => {
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

        AddDataSourceToGroup("All users", `cypress-${data.ds1}-postgresql`)
        AddDataSourceToGroup("All users", `cypress-${data.ds2}-postgresql`)

        logout();
        cy.login(data.userEmail1, "password");

        navigateToAppEditor(data.appName);
        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview"
        );

        pinInspector();

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-table_preview"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "7 items "
        );

        addQuery(
            "student_data",
            `SELECT * FROM student_data;`,
            `cypress-${data.ds2}-postgresql`
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
        ).should("not.exist")
    });
    it("Should verify the query creation and scope changing functionality.", () => {
        navigateToManageGroups();
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).then(($el) => {
            if (!$el.is(":checked")) {
                cy.get(groupsSelector.appsCreateCheck).check();
            }
        });
        logout();
        cy.login(data.userEmail1, "password");
        cy.createApp();
        cy.renameApp(data.userName1);
        cy.dragAndDropWidget("Button", 50, 50);

        addQuery(
            "table_preview",
            `SELECT * FROM Persons;`,
            `cypress-${data.ds1}-postgresql`
        );

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview"
        );

        pinInspector();

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-table_preview"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "7 items "
        );

        cy.get(commonSelectors.editorPageLogo).click();
        logout();
        cy.appUILogin()
        deleteDatasource(`cypress-${data.ds1}-postgresql`);
        deleteDatasource(`cypress-${data.ds2}-postgresql`);
    });

    // it("", () => {
    //     cy.appUILogin();
    //     navigateToManageGroups();
    //     cy.get(groupsSelector.appSearchBox).click();
    //     cy.get(groupsSelector.searchBoxOptions).contains(data.appName).click();
    //     cy.get(groupsSelector.selectAddButton).click();
    //     cy.contains("tr", data.appName)
    //         .parent()
    //         .within(() => {
    //             cy.get("td input").eq(1).check();
    //         });
    //     cy.verifyToastMessage(
    //         commonSelectors.toastMessage,
    //         "App permissions updated"
    //     );

    //     createGroup();
    // });
});
