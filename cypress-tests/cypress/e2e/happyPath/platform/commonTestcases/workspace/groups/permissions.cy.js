import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
    exportAppModalSelectors,
    importSelectors,
} from "Selectors/exportImport";
import { groupsSelector } from "Selectors/manageGroups";
import {
    logout,
    navigateToManageGroups,
    navigateToManageUsers,
    selectAppCardOption,
} from "Support/utils/common";
import {
    inviteUserBasedOnRole,
    setupAndUpdateRole,
    setupWorkspaceAndInviteUser,
    updateRole,
    verifyUserPrivileges
} from "Support/utils/manageGroups";
import { commonText } from "Texts/common";
import { exportAppModalText, importText } from "Texts/exportImport";
import { groupsText } from "Texts/manageGroups";

describe("Manage Groups", () => {
    let data = {};
    const isEnterprise = Cypress.env("environment") === "Enterprise";

    before(() => {
        cy.exec("mkdir -p ./cypress/downloads/");
        cy.wait(3000);
    });

    beforeEach(() => {
        data = {
            firstName: fake.firstName,
            appName: fake.companyName,
            email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
            workspaceName: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
            workspaceSlug: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
            folderName: fake.companyName,
            dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
        };

        cy.defaultWorkspaceLogin();
        cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
        cy.skipWalkthrough();
        cy.viewport(2400, 2000);

    });

    it("should verify the last active admin role update protection", () => {
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName.toLowerCase().replace(/[^A-Za-z]/g, "");

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.visit(data.workspaceSlug);

        navigateToManageGroups();

        // Attempt to change last admin role
        cy.get(groupsSelector.groupLink("Admin")).click();
        cy.get(`[data-cy="dev@tooljet.io-user-row"] > :nth-child(3)`).click();

        cy.get(
            ".css-nwhe5y-container > .react-select__control > .react-select__value-container"
        )
            .click()
            .type(`Builder{enter}`);

        cy.get(groupsSelector.confimButton).click();
        cy.get(groupsSelector.confimButton).click();

        // Verify protection modal
        cy.get(groupsSelector.modalMessage).should("be.visible");
        cy.get(groupsSelector.modalHeader).should(
            "have.text",
            groupsText.modalHeader
        );
        cy.get(groupsSelector.modalMessage).should(
            "have.text",
            groupsText.modalMessage
        );
        cy.get(commonSelectors.closeButton).click();
    });

    it("should verify user role updating sequence", () => {
        const roleUpdateSequence = [
            {
                from: "End-user",
                to: "Builder",
                message: groupsText.endUserToBuilderMessage,
            },
            {
                from: "Builder",
                to: "Admin",
                message: groupsText.builderToAdminMessage,
            },
            {
                from: "Admin",
                to: "Builder",
                message: groupsText.adminToBuilderMessage,
            },
            {
                from: "Builder",
                to: "End-user",
                message: groupsText.builderToEnduserMessage,
            },
            {
                from: "End-user",
                to: "Admin",
                message: groupsText.endUserToAdminMessage,
            },
            {
                from: "Admin",
                to: "End-user",
                message: groupsText.adminToEnduserMessage,
            },
        ];

        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email
        );
        cy.apiLogout();

        cy.apiLogin();
        cy.visit(data.workspaceSlug);
        navigateToManageGroups();

        roleUpdateSequence.forEach(({ from, to, message }) => {
            updateRole(from, to, data.email, message);
        });
    });

    it("should verify privileges after role updates", () => {
        const roleTransitions = [
            {
                startRole: "Admin",
                transitions: [
                    {
                        from: "Admin",
                        to: "Builder",
                        buttonEnabled: true,
                        hasSettings: false,
                    },
                    {
                        from: "Builder",
                        to: "Admin",
                        buttonEnabled: true,
                        hasSettings: true,
                    },
                    {
                        from: "Admin",
                        to: "End-user",
                        buttonEnabled: false,
                        hasSettings: false,
                    },
                    {
                        from: "End-user",
                        to: "Admin",
                        buttonEnabled: true,
                        hasSettings: true,
                    },
                ],
            },
        ];

        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        cy.visit(data.workspaceSlug);

        roleTransitions.forEach(({ startRole, transitions }) => {
            navigateToManageUsers();
            inviteUserBasedOnRole(data.firstName, data.email, startRole);
            cy.wait(1000);
            cy.apiLogout();

            transitions.forEach(({ from, to, buttonEnabled, hasSettings }) => {
                cy.apiLogin();
                cy.visit(data.workspaceSlug);
                setupAndUpdateRole(from, to, data.email);

                cy.apiLogin(data.email);
                cy.visit(data.workspaceSlug);
                verifyUserPrivileges(
                    buttonEnabled ? "be.enabled" : "be.disabled",
                    hasSettings
                );
                cy.apiLogout();
            });
        });
    });

    it.skip("should verify query creation and import access for Builders and Admin", () => {
        const firstName2 = fake.firstName;
        const email2 = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        const workspaceName2 = fake.firstName
            .toLowerCase()
            .replace(/[^A-Za-z]/g, "");
        const workspaceSlug2 = fake.firstName
            .toLowerCase()
            .replace(/[^A-Za-z]/g, "");

        createQueryAndImportApp(
            data.firstName,
            data.email,
            data.workspaceName,
            data.workspaceSlug,
            "Builder"
        );

        cy.backToApps();
        logout();

        cy.defaultWorkspaceLogin();

        createQueryAndImportApp(
            firstName2,
            email2,
            workspaceName2,
            workspaceSlug2,
            "Admin"
        );
    });

    const createQueryAndImportApp = (
        firstName,
        email,
        workspaceName,
        workspaceSlug,
        role
    ) => {
        let currentVersion = "";
        let exportedFilePath;

        cy.apiCreateWorkspace(workspaceName, workspaceSlug);
        cy.visit(workspaceSlug);
        cy.wait(500);

        cy.apiCreateGDS(
            `${Cypress.env("server_host")}/api/data-sources`,
            `cypress-${data.dsName}-qc-postgresql`,
            "postgresql",
            [
                { key: "host", value: Cypress.env("pg_host") },
                { key: "port", value: 5432 },
                { key: "database", value: Cypress.env("pg_user") },
                { key: "username", value: Cypress.env("pg_user") },
                { key: "password", value: Cypress.env("pg_password"), encrypted: true },
                { key: "ssl_enabled", value: false, encrypted: false },
                { key: "ssl_certificate", value: "none", encrypted: false },
            ]
        );

        //Onboard user
        navigateToManageUsers();
        inviteUserBasedOnRole(firstName, email, role);

        cy.wait(1000);

        cy.createApp(data.appName);

        //Create and run postgres query in the app
        // Need to enable once bug is fixed
        /*
                        
                
                        addQuery(
                            "table_preview",
                            `SELECT * FROM persons;`,
                            `cypress-${data.dsName1}-postgresql`
                        );
                
                        cy.get('[data-cy="list-query-table_preview"]').verifyVisibleElement(
                            "have.text",
                            "table_preview "
                        );
                        cy.get(dataSourceSelector.queryCreateAndRunButton).click();
                        verifyValueOnInspector("table_preview", "7 items ");
                        */

        cy.backToApps();

        //Export and Import app
        selectAppCardOption(
            data.appName,
            commonSelectors.appCardOptions(commonText.exportAppOption)
        );
        cy.get(exportAppModalSelectors.currentVersionSection).should("be.visible");
        cy.get(
            exportAppModalSelectors.versionRadioButton((currentVersion = "v1"))
        ).verifyVisibleElement("be.checked");
        cy.get(
            commonSelectors.buttonSelector(exportAppModalText.exportSelectedVersion)
        ).click();
        cy.exec("ls ./cypress/downloads/").then((result) => {
            const downloadedAppExportFileName = result.stdout.split("\n")[0];
            exportedFilePath = `cypress/downloads/${downloadedAppExportFileName}`;
            cy.get(importSelectors.dropDownMenu).should("be.visible").click();
            cy.get(importSelectors.importOptionInput).selectFile(exportedFilePath, {
                force: true,
            });
            cy.get(importSelectors.importAppButton).click();
            cy.get(".go3958317564")
                .should("be.visible")
                .and("have.text", importText.appImportedToastMessage);
        });
        cy.exec("cd ./cypress/downloads/ && rm -rf *");
    };
});
