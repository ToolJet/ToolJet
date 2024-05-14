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
    addQueryAndOpenEditor,
    verifyValueOnInspector,
    resizeQueryPanel,
} from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { dataSourceText } from "Texts/dataSource";
import { groupsSelector } from "Selectors/manageGroups";
import { eeGroupsSelector } from "Selectors/eeCommon";
import {
    logout,
    navigateToAppEditor,
    navigateToManageGroups,
    pinInspector,
    createGroup,
} from "Support/utils/common";

import { AddDataSourceToGroup, addNewUserEE } from "Support/utils/eeCommon";

import { editAndVerifyWidgetName } from "Support/utils/commonWidget";

import {
    addDsToGroup,
    createGroupAddAppAndUserToGroup,
} from "Support/utils/manageGroups";

const data = {};

describe("Global Datasource Manager", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.viewport(1200, 1300);
        cy.wait(1000);
        cy.skipWalkthrough();
    });

    it("Should verify the global data source manager UI", () => {
        data.ds1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get(commonSelectors.pageSectionHeader).verifyVisibleElement(
            "have.text",
            "Data sources"
        );
        cy.get(dataSourceSelector.allDatasourceLabelAndCount).verifyVisibleElement(
            "have.text",
            dataSourceText.allDataSources
        );
        cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Data sources");
        });

        cy.get(dataSourceSelector.databaseLabelAndCount).verifyVisibleElement(
            "have.text",
            dataSourceText.allDatabase
        );
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Databases"
        );
        cy.get(dataSourceSelector.querySearchBar)
            .invoke("attr", "placeholder")
            .should("eq", "Search  data sources");

        cy.get(dataSourceSelector.apiLabelAndCount)
            .verifyVisibleElement("have.text", dataSourceText.allApis)
            .click();
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " APIs"
        );

        cy.get(dataSourceSelector.cloudStorageLabelAndCount)
            .verifyVisibleElement("have.text", dataSourceText.allCloudStorage)
            .click();
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Cloud Storages"
        );

        cy.get(dataSourceSelector.pluginsLabelAndCount)
            .verifyVisibleElement("have.text", dataSourceText.pluginsLabelAndCount)
            .click();
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Plugins"
        );

        cy.get('[data-cy="added-ds-label"]').should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Data sources added");
        });
        cy.get(dataSourceSelector.addedDsSearchIcon).should("be.visible").click();
        cy.get(dataSourceSelector.AddedDsSearchBar)
            .invoke("attr", "placeholder")
            .should("eq", "Search for Data sources");

        selectAndAddDataSource("databases", dataSourceText.postgreSQL, data.ds1);
        cy.clearAndType(
            dataSourceSelector.dsNameInputField,
            `cypress-${data.ds1}-postgresql1`
        );

        cy.get(dataSourceSelector.databaseLabelAndCount).click();

        cy.get(commonSelectors.modalComponent).should("be.visible");
        cy.get(dataSourceSelector.unSavedModalTitle).verifyVisibleElement(
            "have.text",
            dataSourceText.unSavedModalTitle
        );
        cy.get(commonWidgetSelector.modalCloseButton).should("be.visible");
        cy.get(commonSelectors.cancelButton)
            .should("be.visible")
            .and("have.text", commonText.saveChangesButton);
        cy.get(commonSelectors.yesButton).verifyVisibleElement(
            "have.text",
            "Discard"
        );

        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.get(dataSourceSelector.buttonSave).should("be.enabled");

        cy.get(dataSourceSelector.databaseLabelAndCount).click();
        cy.get(commonSelectors.yesButton).click();
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            " Databases"
        );
        cy.wait(200);
        cy.get(`[data-cy="cypress-${data.ds1}-postgresql-button"]`).realClick();
        cy.clearAndType(
            dataSourceSelector.dsNameInputField,
            `cypress-${data.ds1}-postgresql1`
        );
        cy.get(commonSelectors.dashboardIcon).click();
        cy.get(commonSelectors.yesButton).click();

        cy.get(commonSelectors.appCreateButton).should("be.visible");
        cy.get(commonSelectors.globalDataSourceIcon).click();
        cy.get(dataSourceSelector.databaseLabelAndCount).click();
        cy.wait(500);
        cy.get(`[data-cy="cypress-${data.ds1}-postgresql-button"]`).realClick();
        cy.clearAndType(
            dataSourceSelector.dsNameInputField,
            `cypress-${data.ds1}-postgresql1`
        );
        cy.get(commonSelectors.dashboardIcon).click();
        cy.get(commonSelectors.cancelButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            dataSourceText.toastDSSaved
        );

        cy.get(
            `[data-cy="cypress-${data.ds1}-postgresql1-button"]`
        ).verifyVisibleElement("have.text", `cypress-${data.ds1}-postgresql1`);

        deleteDatasource(`cypress-${data.ds1}-postgresql1`);
    });
    it("Should verify the Datasource connection and query creation using global data source", () => {
        data.userName1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.userEmail1 = fake.email.toLowerCase();
        data.appName = `${fake.companyName}-App`;
        data.ds1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.text1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");

        addNewUserEE(data.userName1, data.userEmail1);
        cy.logoutApi();

        cy.defaultWorkspaceLogin();
        cy.apiCreateApp(data.appName);
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
        cy.wait(1000);

        cy.openApp();
        cy.waitForAppLoad();

        addQuery(
            "table_preview",
            `SELECT * FROM persons;`,
            `cypress-${data.ds1}-postgresql`
        );

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview "
        );

        cy.dragAndDropWidget("Text", 100, 250);
        editAndVerifyWidgetName(data.text1, []);
        cy.waitForAutoSave();

        cy.get(
            '[data-cy="textcomponenttextinput-input-field"]'
        ).clearAndTypeOnCodeMirror(`{{queries.table_preview.data[1].firstname`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text1)
        ).verifyVisibleElement("have.text", "Jane");

        cy.get('[data-cy="show-ds-popover-button"]').click();
        cy.get(".p-2 > .tj-base-btn")
            .should("be.visible")
            .and("have.text", "+ Add new Data source");
        cy.get(".p-2 > .tj-base-btn").click();

        cy.get('[data-cy="databases-datasource-button"]').should("be.visible");
    });
    it("Should validate the user's global data source permissions on apps created by admin", () => {
        data.userName1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.userEmail1 = fake.email.toLowerCase();
        data.appName = `${fake.companyName}-App`;
        data.ds1 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.ds2 = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.text1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.text2 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.groupName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

        addNewUserEE(data.userName1, data.userEmail1);
        cy.logoutApi();

        cy.defaultWorkspaceLogin();

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
        cy.wait(1000);

        selectAndAddDataSource("databases", dataSourceText.postgreSQL, data.ds2);
        cy.clearAndType(
            dataSourceSelector.dsNameInputField,
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
        cy.wait(1000);

        cy.apiCreateApp(data.appName);
        navigateToManageGroups();
        createGroupAddAppAndUserToGroup(data.groupName, data.userEmail1);
        addDsToGroup(data.groupName, `cypress-${data.ds1}-postgresql`);
        addDsToGroup(data.groupName, `cypress-${data.ds2}-postgresql`);

        cy.openApp();
        cy.waitForAppLoad();

        addQuery(
            "table_preview",
            `SELECT * FROM persons;`,
            `cypress-${data.ds1}-postgresql`
        );
        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview "
        );

        cy.dragAndDropWidget("Text", 100, 250);
        editAndVerifyWidgetName(data.text1, []);
        cy.waitForAutoSave();
        cy.get(
            '[data-cy="textcomponenttextinput-input-field"]'
        ).clearAndTypeOnCodeMirror(`{{queries.table_preview.data[1].firstname`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        cy.logoutApi();
        cy.apiLogin(data.userEmail1, "password");
        cy.visit("/my-workspace");

        navigateToAppEditor(data.appName);
        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview "
        );

        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text1)
        ).verifyVisibleElement("have.text", "Jane");

        addQueryAndOpenEditor(
            "student_data",
            `SELECT * FROM student_data;`,
            `cypress-${data.ds2}-postgresql`,
            data.appName
        );

        cy.get('[data-cy="list-query-student_data"]').verifyVisibleElement(
            "have.text",
            "student_data "
        );
        cy.wait(500);

        cy.dragAndDropWidget("Text", 300, 250);
        editAndVerifyWidgetName(data.text2, []);
        cy.waitForAutoSave();

        cy.get(
            '[data-cy="textcomponenttextinput-input-field"]'
        ).clearAndTypeOnCodeMirror(`{{queries.student_data.data[3].firstname`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.wait(1000);
        cy.get(
            commonWidgetSelector.draggableWidget(data.text2)
        ).verifyVisibleElement("have.text", "David");

        cy.get(".p-2 > .tj-base-btn").should("not.exist");
    });
    it("Should verify the query creation and scope changing functionality.", () => {
        data.userName1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.userEmail1 = fake.email.toLowerCase();
        data.appName = `${fake.companyName}-App`;
        data.ds1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.text1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.groupName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");

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

        cy.wait(1000);
        navigateToManageGroups();
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).then(($el) => {
            if (!$el.is(":checked")) {
                cy.get(groupsSelector.appsCreateCheck).check();
            }
        });

        AddDataSourceToGroup("All users", `cypress-${data.ds1}-postgresql`);

        cy.logoutApi();
        cy.apiLogin("test@tooljet.com", "password");
        cy.apiCreateApp(data.appName);
        cy.openApp();
        cy.waitForAppLoad();

        addQueryAndOpenEditor(
            "table_preview",
            `SELECT * FROM persons;`,
            `cypress-${data.ds1}-postgresql`,
            data.appName
        );

        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
            "have.text",
            "table_preview "
        );

        cy.dragAndDropWidget("Text", 100, 250);
        editAndVerifyWidgetName(data.text1, []);
        cy.waitForAutoSave();

        cy.get(
            '[data-cy="textcomponenttextinput-input-field"]'
        ).clearAndTypeOnCodeMirror(`{{queries.table_preview.data[1].firstname`);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
        cy.get(
            commonWidgetSelector.draggableWidget(data.text1)
        ).verifyVisibleElement("have.text", "Jane");
    });
});
