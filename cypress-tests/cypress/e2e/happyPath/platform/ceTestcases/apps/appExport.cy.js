import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { importSelectors } from "Selectors/exportImport";
import { commonText } from "Texts/common";

import { exportAppModalText } from "Texts/exportImport";
import {
    clickOnExportButtonAndVerify,
    exportAllVersionsAndVerify,
    verifyElementsOfExportModal,
} from "Support/utils/exportImport";
import { selectAppCardOption, closeModal } from "Support/utils/common";

describe("App Export", () => {
    const TEST_DATA = {
        appFiles: {
            multiVersion: "cypress/fixtures/templates/three-versions.json",
            singleVersion: "cypress/fixtures/templates/one_version.json",
        },
    };

    let data;

    data = {
        workspaceName: fake.firstName,
        workspaceSlug: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
        appName: `${fake.companyName}-IE-App`,
        appReName: `${fake.companyName}-${fake.companyName}-IE-App`,
        dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
    };

    beforeEach(() => {
        data = {
            workspaceName: fake.firstName,
            workspaceSlug: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
            appName: `${fake.companyName}-IE-App`,
            appReName: `${fake.companyName}-${fake.companyName}-IE-App`,
            dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
        };
        cy.exec("mkdir -p ./cypress/downloads/");
        cy.wait(3000);

        cy.apiLogin();
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.apiLogout();
    });

    it("Verify the elements of export dialog box", () => {
        cy.window({ log: false }).then((win) => {
            win.localStorage.setItem("walkthroughCompleted", "true");
        });

        cy.apiLogin();
        cy.visit(`${data.workspaceSlug}`);
        cy.get(importSelectors.importOptionInput)
            .eq(0)
            .selectFile(TEST_DATA.appFiles.multiVersion, {
                force: true,
            });
        cy.wait(1500);
        cy.clearAndType(commonSelectors.appNameInput, data.appName);
        cy.get(importSelectors.importAppButton).click();
        cy.wait(3000);
        cy.backToApps();

        // Select the app card option to export the app
        selectAppCardOption(
            data.appName,
            commonSelectors.appCardOptions(commonText.exportAppOption)
        );

        // Verify the elements of the export modal
        verifyElementsOfExportModal("v3", ["v2", "v1"], [true, false, false]);

        // Close the modal
        closeModal(exportAppModalText.modalCloseButton);

        // Ensure the modal title is no longer visible
        cy.get(
            commonSelectors.modalTitle(exportAppModalText.selectVersionTitle)
        ).should("not.exist");

        // Re-open the export modal and click the export button
        selectAppCardOption(
            data.appName,
            commonSelectors.appCardOptions(commonText.exportAppOption)
        );
        clickOnExportButtonAndVerify(exportAppModalText.exportAll, data.appName);

        cy.exec("ls ./cypress/downloads/").then((result) => {
            const downloadedAppExportFileName = result.stdout.split("\n")[0];
            const filePath = `./cypress/downloads/${downloadedAppExportFileName}`;

            // Ensure the file name contains the expected app export name
            expect(downloadedAppExportFileName).to.contain(
                data.appName.toLowerCase()
            );

            // Read and validate the exported JSON file
            cy.readFile(filePath).then((appData) => {
                // Validate the app name
                const appNameFromFile = appData.app[0].definition.appV2.name;
                expect(appNameFromFile).to.equal(data.appName);

                // Validate the schema for the student table in tooljetdb
                const tooljetDatabase = appData.tooljet_database.find(
                    (db) => db.table_name === "student"
                );
                expect(tooljetDatabase).to.exist;
                expect(tooljetDatabase.schema).to.exist;

                // Validate components and queries
                const components = appData.app[0].definition.appV2.components;

                const text2Component = components.find(
                    (component) => component.name === "text2"
                );
                expect(text2Component).to.exist;
                expect(text2Component.properties.text.value).to.equal(
                    "{{constants.pageHeader}}"
                );

                const textinput1 = components.find(
                    (component) => component.name === "textinput1"
                );
                expect(textinput1).to.exist;
                expect(textinput1.properties.value.value).to.include("queries");

                const textinput2 = components.find(
                    (component) => component.name === "textinput2"
                );
                expect(textinput2).to.exist;
                expect(textinput2.properties.value.value).to.include("queries");

                const textinput3 = components.find(
                    (component) => component.name === "textinput3"
                );
                expect(textinput3).to.exist;
                expect(textinput3.properties.value.value).to.include("queries");

                // Validate the data queries
                const dataQueries = appData.app[0].definition.appV2.dataQueries;

                const postgresqlQuery = dataQueries.find(
                    (query) => query.name === "postgresql1"
                );
                expect(postgresqlQuery).to.exist;
                expect(postgresqlQuery.options.query).to.include(
                    "Select * from {{secrets.db_name}}"
                );

                const restapiQuery = dataQueries.find(
                    (query) => query.name === "restapi1"
                );
                expect(restapiQuery).to.exist;
                expect(restapiQuery.options.url).to.equal(
                    "https://jsonplaceholder.typicode.com/users/1"
                );

                const tooljetdbQuery = dataQueries.find(
                    (query) => query.name === "tooljetdb1"
                );
                expect(tooljetdbQuery).to.exist;
                expect(tooljetdbQuery.options.operation).to.equal("list_rows");

                // Ensure appVersions exists
                const appVersions = appData.app[0].definition.appV2.appVersions;
                expect(appVersions).to.exist;

                // Map and verify app version names
                const versionNames = appVersions.map((version) => version.name);
                expect(versionNames).to.include.members(["v1", "v2", "v3"]);
            });
        });

        cy.exec("cd ./cypress/downloads/ && rm -rf *");

        selectAppCardOption(
            data.appName,
            commonSelectors.appCardOptions(commonText.exportAppOption)
        );
        cy.get(`[data-cy="v1-radio-button"]`).check();
        cy.get(
            commonSelectors.buttonSelector(exportAppModalText.exportSelectedVersion)
        ).click();

        cy.exec("ls ./cypress/downloads/").then((result) => {
            const downloadedAppExportFileName = result.stdout.split("\n")[0];
            const filePath = `./cypress/downloads/${downloadedAppExportFileName}`;

            // Ensure the file name contains the expected app export name
            expect(downloadedAppExportFileName).to.contain(
                data.appName.toLowerCase()
            );

            // Read and validate the exported JSON file
            cy.readFile(filePath).then((appData) => {
                // Validate the app name
                const appNameFromFile = appData.app[0].definition.appV2.name;
                expect(appNameFromFile).to.equal(data.appName);
            });
        });
    });

    it.skip("Verify 'Export app' functionality of an application inside app editor", () => {
        data.appName2 = `${fake.companyName}-App`;
        cy.apiCreateApp(data.appName2);
        cy.openApp(data.appName2);

        cy.dragAndDropWidget("Text Input", 50, 50);

        cy.get('[data-cy="left-sidebar-settings-button"]').click();
        cy.get('[data-cy="button-user-status-change"]').click();

        verifyElementsOfExportModal("v1");

        exportAllVersionsAndVerify(data.appName1, "v1");
    });
});
