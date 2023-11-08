import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import {
  fillDataSourceTextField,
  selectAndAddDataSource,
  fillConnectionForm,
} from "Support/utils/postgreSql";
import { commonText } from "Texts/common";
import {
    closeDSModal,
    deleteDatasource,
    addQuery,
    addQueryN,
    verifyValueOnInspector,
    resizeQueryPanel,
} from "Support/utils/dataSource";
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
import {
    verifyAndModifyParameter,
    editAndVerifyWidgetName,
} from "Support/utils/commonWidget";

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
data.text1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.text2 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.text3 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
data.text4 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Global Datasource Manager", () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.visit('/my-workspace')
    });

    before(() => {
        cy.apiLogin();
        cy.apiCreateApp(data.appName);
        cy.visit('/my-workspace')
        cy.wait(1000);
        addNewUserMW(data.userName1, data.userEmail1);
        cy.logoutApi();
        cy.apiLogin();
        cy.visit('/my-workspace')
        navigateToManageGroups();
        createGroup(data.userName1);
        cy.wait(1000);
        addUserToGroup(data.userName1, data.userEmail1);
        addAppToGroup(data.appName);
        addNewUserMW(data.userName2, data.userEmail2);
        cy.logoutApi();
        cy.apiLogin();
        cy.visit('/my-workspace')
        navigateToManageGroups();
        createGroup(data.userName2);
        cy.wait(1000);
        addAppToGroup(data.appName);
        addUserToGroup(data.userName2, data.userEmail2);
        cy.logoutApi();
    });

    it("Connect Data source and assign to user groups", () => {
        selectAndAddDataSource("databases", dataSourceText.postgreSQL, data.ds1);

        cy.clearAndType(
            dataSourceSelector.dsNameInputField,
            `cypress-${data.ds1}-postgresql`
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

        cy.apiCreateGDS(
            "http://localhost:3000/api/v2/data_sources",
            `cypress-${data.ds2}-rest-api`,
            "restapi",
            [
                { key: "url", value: "https://reqres.in/api/users?page=1" },
                { key: "auth_type", value: "none" },
                { key: "grant_type", value: "authorization_code" },
                { key: "add_token_to", value: "header" },
                { key: "header_prefix", value: "Bearer " },
                { key: "access_token_url", value: "" },
                { key: "client_ide", value: "" },
                { key: "client_secret", value: "", encrypted: true },
                { key: "scopes", value: "read, write" },
                { key: "username", value: "", encrypted: false },
                { key: "password", value: "", encrypted: true },
                { key: "bearer_token", value: "", encrypted: true },
                { key: "auth_url", value: "" },
                { key: "client_auth", value: "header" },
                { key: "headers", value: [["", ""]] },
                { key: "custom_query_params", value: [["", ""]], encrypted: false },
                { key: "custom_auth_params", value: [["", ""]] },
                {
                    key: "access_token_custom_headers",
                    value: [["", ""]],
                    encrypted: false,
                },
                { key: "multiple_auth_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
            ]
        );

        cy.visit('/my-workspace')
        cy.get(commonSelectors.dashboardIcon).click();
        navigateToAppEditor(data.appName);

        resizeQueryPanel('50');
        addQuery(
            "table_preview",
            `SELECT * FROM Persons;`,
            `cypress-${data.ds1}-postgresql`
        );
        cy.wait(500);

        cy.dragAndDropWidget("Text", 100, 150);
        editAndVerifyWidgetName(data.text1);
        cy.waitForAutoSave();

        verifyAndModifyParameter("Text", `{{queries.table_preview.data[1].firstname`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text1)
        ).verifyVisibleElement("have.text", "four");


        cy.intercept("POST", "/api/data_queries/**").as("run");
        cy.get('[data-cy="show-ds-popover-button"]').click();
        cy.get(".css-1rrkggf-Input").type(data.ds2);
        cy.contains(`[id*="react-select-"]`, data.ds2).click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.wait("@run");


        cy.dragAndDropWidget("Text", 200, 150);
        editAndVerifyWidgetName(data.text2);
        cy.waitForAutoSave();

        verifyAndModifyParameter("Text", `{{queries.restapi1.data.data[0].email`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text2)
        ).verifyVisibleElement("have.text", "george.bluth@reqres.in");

        cy.get(commonSelectors.editorPageLogo).click();

        AddDataSourceToGroup(data.userName1, `cypress-${data.ds1}-postgresql`);
        AddDataSourceToGroup(data.userName2, `cypress-${data.ds2}-rest-api`);
    });
    it("verify the first user permissions on assigned and unassigned datasource", () => {
        cy.logoutApi();
        cy.apiLogin(data.userEmail1, "password");
        cy.visit('/my-workspace')

        navigateToAppEditor(data.appName);
        cy.wait(2000);

        cy.get('[data-cy="list-query-restapi1"]')
            .verifyVisibleElement("have.text", "restapi1 ")
            .click();
        cy.get(".query-details").should("have.class", "disabled");

        cy.get(".query-row-query-name")
            .contains("restapi1 ")
            .parent()
            .within(() => {
                cy.get(".query-rename-delete-btn").should("not.exist");
            });

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview "
        );

        resizeQueryPanel("50");
        cy.get('[data-cy="show-ds-popover-button"]').click();
        cy.wait(2000);
        addQueryN(
            "user_query",
            `SELECT * FROM Persons;`,
            `cypress-${data.ds1}-postgresql`
        );

        cy.get('[data-cy="list-query-user_query"]').verifyVisibleElement(
            "have.text",
            "user_query "
        );

        cy.wait(1000)
        cy.dragAndDropWidget("Text", 450, 150);
        editAndVerifyWidgetName(data.text3);
        cy.waitForAutoSave();
        verifyAndModifyParameter("Text", `{{queries.user_query.data[1].firstname`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get('[data-cy="list-query-user_query"]').click();
        cy.wait(500)
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text3)
        ).verifyVisibleElement("have.text", "four");

        cy.get('[data-cy="list-query-table_preview"]').click();
        cy.wait(500)
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text1)
        ).verifyVisibleElement("have.text", "four");

        cy.get('[data-cy="list-query-restapi1"]').click();
        cy.wait(500)
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text2)
        ).verifyVisibleElement("have.text", "george.bluth@reqres.in");

        cy.intercept("POST", "/api/data_queries/**").as("run");
        cy.get('[data-cy="show-ds-popover-button"]').click();
        cy.get(".css-1rrkggf-Input").type(data.ds2);
        cy.contains(`[id*="react-select-"]`, data.ds2).click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "You do not have permissions to perform this action"
        );
    });
    it("verify the second user permissions on assigned ansd unassigned datasource", () => {
        cy.logoutApi();
        cy.apiLogin(data.userEmail2, "password");
        cy.visit('/my-workspace')

        navigateToAppEditor(data.appName);
        cy.wait(2000);
        cy.get('[data-cy="list-query-restapi1"]').verifyVisibleElement(
            "have.text",
            "restapi1 "
        );
        cy.get('[data-cy="list-query-table_preview"]')
            .verifyVisibleElement("have.text", "table_preview ")
            .click();
        cy.get(".query-details").should("have.class", "disabled");

        cy.get(".query-row-query-name")
            .contains("table_preview ")
            .parent()
            .within(() => {
                cy.get(".query-rename-delete-btn").should("not.exist");
            });

        cy.intercept("POST", "/api/data_queries/**").as("run");
        cy.get('[data-cy="show-ds-popover-button"]').click();
        cy.get(".css-1rrkggf-Input").type(data.ds2);
        cy.contains(`[id*="react-select-"]`, data.ds2).click();
        cy.wait(1000);
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.wait("@run");

        cy.dragAndDropWidget("Text", 550, 150);
        editAndVerifyWidgetName(data.text4);
        cy.waitForAutoSave();
        verifyAndModifyParameter("Text", `{{queries.restapi2.data.data[1].email`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get('[data-cy="list-query-restapi2"]').click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text4)
        ).verifyVisibleElement("have.text", "janet.weaver@reqres.in");


        cy.get('[data-cy="list-query-table_preview"]').click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text1)
        ).verifyVisibleElement("have.text", "four");

        cy.get('[data-cy="list-query-restapi1"]').click();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text2)
        ).verifyVisibleElement("have.text", "george.bluth@reqres.in");

        cy.get('[data-cy="show-ds-popover-button"]').click();
        cy.get(".css-1rrkggf-Input").type(data.ds1);
        cy.contains(`[id*="react-select-"]`, data.ds1).click();

        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "You do not have permissions to perform this action"
        );
    });
});

