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
import { addAppToGroup, addUserToGroup } from "Support/utils/manageGroups";

const data = {};
data.userName1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.userEmail1 = fake.email.toLowerCase();
data.userName2 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.userEmail2 = fake.email.toLowerCase();
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
        cy.appUILogin();
        navigateToManageGroups();
        createGroup(data.userName1);
        cy.wait(1000);
        addUserToGroup(data.userName1, data.userEmail1);
        addAppToGroup(data.appName);
        addNewUserMW(data.userName2, data.userEmail2);
        logout();
        cy.appUILogin();
        navigateToManageGroups();
        createGroup(data.userName2);
        cy.wait(1000);
        addAppToGroup(data.appName);
        addUserToGroup(data.userName2, data.userEmail2);
        logout();
    });

    it("Connect Data source and assign to user groups", () => {
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

        selectDataSource("REST Api");
        cy.clearAndType(
            '[data-cy="data-source-name-input-filed"]',
            `cypress-${data.ds2}-restapi`
        );

        cy.intercept("POST", "/api/v2/data_sources").as("ds");

        cy.clearAndType(
            '[data-cy="base-url-text-field"]',
            "https://reqres.in/api/users?page=2"
        );
        cy.get(".tj-base-btn").click();
        cy.wait("@ds");
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            dataSourceText.toastDSAdded
        );

        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get(
            `[data-cy="cypress-${data.ds2}-restapi-button"]`
        ).verifyVisibleElement("have.text", `cypress-${data.ds2}-restapi`);

        cy.get('[data-cy="icon-dashboard"]').click();
        navigateToAppEditor(data.appName);
        addQuery(
            "table_preview",
            `SELECT * FROM Persons;`,
            `cypress-${data.ds1}-postgresql`
        );
        cy.wait(500);
        cy.get(dataSourceSelector.buttonAddNewQueries).click();
        cy.get(`[data-cy="cypress-${data.ds2}-restapi-add-query-card"]`).click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(commonSelectors.editorPageLogo).click();

        AddDataSourceToGroup(data.userName1, `cypress-${data.ds1}-postgresql`);
        AddDataSourceToGroup(data.userName2, `cypress-${data.ds2}-restapi`);
    });

    it("verify the first user permissions on assigned and unassigned datasource", () => {
        logout();
        cy.login(data.userEmail1, "password");

        navigateToAppEditor(data.appName);
        cy.get('[data-cy="list-query-restapi1"]').verifyVisibleElement(
            "have.text",
            "restapi1"
        );
        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview"
        );

        pinInspector();

        cy.get('[data-cy="list-query-table_preview"]').click();
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

        cy.get('[data-cy="list-query-restapi1"]').click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-restapi1"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "6 entries "
        );

        addQuery(
            "user_query",
            `SELECT * FROM Persons;`,
            `cypress-${data.ds1}-postgresql`
        );

        cy.get('[data-cy="list-query-user_query"]').verifyVisibleElement(
            "have.text",
            "user_query"
        );

        cy.get('[data-cy="list-query-user_query"]').click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-user_query"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "7 items "
        );

        cy.get(dataSourceSelector.buttonAddNewQueries).click();
        cy.get(`[data-cy="cypress-${data.ds2}-restapi-add-query-card"]`).click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "You do not have permissions to perform this action"
        );
        //Need to add edit and query preview
    });

    it("verify the second user permissions on assigned ansd unassigned datasource", () => {
        logout();
        cy.login(data.userEmail2, "password");

        navigateToAppEditor(data.appName);
        cy.get('[data-cy="list-query-restapi1"]').verifyVisibleElement(
            "have.text",
            "restapi1"
        );
        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview"
        );

        pinInspector();

        cy.get('[data-cy="list-query-table_preview"]').click();
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

        cy.get('[data-cy="list-query-restapi1"]').click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-restapi1"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "6 entries "
        );

        cy.get(dataSourceSelector.buttonAddNewQueries).click();
        cy.get(`[data-cy="cypress-${data.ds2}-restapi-add-query-card"]`).click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();

        cy.get('[data-cy="list-query-restapi2"]').verifyVisibleElement(
            "have.text",
            "restapi2"
        );

        cy.get('[data-cy="list-query-restapi2"]').click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get('[data-cy="inspector-node-queries"]')
            .parent()
            .within(() => {
                cy.get("span").first().scrollIntoView().contains("queries").dblclick();
            });
        cy.get('[data-cy="inspector-node-restapi2"] > .node-key').click();
        cy.get('[data-cy="inspector-node-data"] > .fs-9').verifyVisibleElement(
            "have.text",
            "6 entries "
        );

        addQuery(
            "user_query",
            `SELECT * FROM Persons;`,
            `cypress-${data.ds1}-postgresql`
        );

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "You do not have permissions to perform this action"
        );
    });
});
