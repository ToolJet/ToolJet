import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { fake } from "Fixtures/fake";
import { addNewconstants } from "Support/utils/workspaceConstants";
import { commonText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import {
    setupWorkspaceAndInviteUser,
    verifyBasicPermissions,
    createGroupsAndAddUserInGroup,
    updateRole,
    verifySettingsAccess,
    inviteUserBasedOnRole,
    verifyUserPrivileges,
    setupAndUpdateRole,
} from "Support/utils/manageGroups";
import {
    selectAndAddDataSource,
    fillConnectionForm,
    addQuery,
} from "Support/utils/postgreSql";
import { verifyValueOnInspector } from "Support/utils/dataSource";
import { dataSourceSelector } from "Selectors/dataSource";
import { dataSourceText } from "Texts/dataSource";
import {
    createFolder,
    deleteFolder,
    logout,
    releaseApp,
    navigateToManageGroups,
    navigateToManageUsers,
    selectAppCardOption,
} from "Support/utils/common";
import {
    exportAppModalSelectors,
    importSelectors,
} from "Selectors/exportImport";
import { exportAppModalText, importText } from "Texts/exportImport";
import { clickOnExportButtonAndVerify } from "Support/utils/exportImport";

describe("Manage Groups", () => {
    let data = {};

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
    });

    it("should verify end-user privileges", () => {
        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email
        );
        verifyBasicPermissions(false);
    });

    it("should verify builder privileges and role updates in custom groups", () => {
        const builderGroup = fake.firstName.replace(/[^A-Za-z]/g, "");
        const endUserGroup = fake.firstName.replace(/[^A-Za-z]/g, "");

        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email,
            "Builder"
        );

        // Verify builder permissions
        verifyBasicPermissions(true);

        // App operations
        cy.createApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appCreatedToast
        );
        cy.backToApps();

        cy.deleteApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appDeletedToast
        );

        // Folder operations
        createFolder(data.folderName);
        deleteFolder(data.folderName);

        // Constants management
        cy.get(commonSelectors.workspaceConstantsIcon).click();
        addNewconstants(data.firstName, data.appName);
        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.firstName)
        ).click();
        cy.get(commonSelectors.yesButton).click();

        verifySettingsAccess(false);

        cy.get(commonSelectors.homePageLogo).click();
        cy.createApp(data.appName);
        cy.backToApps();
        cy.wait(1000);

        //verify clone access
        selectAppCardOption(
            data.appName,
            commonSelectors.appCardOptions(commonText.cloneAppOption)
        );
        cy.get(commonSelectors.cloneAppButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.cloneAppErrorToast
        );
        cy.get(commonSelectors.cancelButton).click();
        cy.apiLogout();

        cy.apiLogin();
        cy.visit(data.workspaceSlug);
        navigateToManageGroups();

        [builderGroup, endUserGroup].forEach((group) => {
            createGroupsAndAddUserInGroup(group, data.email);
        });

        cy.get(groupsSelector.groupLink(builderGroup)).click();
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).check();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            groupsText.permissionUpdatedToast
        );

        // Role update and verification
        updateRole("Builder", "End-user", data.email);

        // Verify group memberships
        cy.get(groupsSelector.groupLink("builder")).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should("not.exist");

        cy.get(groupsSelector.groupLink(builderGroup)).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should("not.exist");

        cy.get(groupsSelector.groupLink(endUserGroup)).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should("exist");

        cy.apiLogout();
        cy.apiLogin(data.email, "password");
        cy.visit(data.workspaceSlug);
        cy.get(commonSelectors.appCard(data.appName))
            .trigger("mouseover")
            .trigger("mouseenter")
            .find(commonSelectors.editButton)
            .should("not.exist");
    });

    it("should verify admin privileges", () => {
        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email,
            "admin"
        );

        verifyBasicPermissions(true);

        // App operations
        cy.createApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appCreatedToast
        );
        cy.backToApps();

        cy.deleteApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appDeletedToast
        );

        // Folder operations
        createFolder(data.folderName);
        deleteFolder(data.folderName);

        // Constants management
        cy.get(commonSelectors.workspaceConstantsIcon).click();
        addNewconstants(data.firstName, data.appName);
        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.firstName)
        ).click();
        cy.get(commonSelectors.yesButton).click();

        // Settings access check - explicitly verify workspace settings
        cy.get(commonSelectors.settingsIcon).click();
        cy.get(commonSelectors.workspaceSettings).should("exist");
        cy.wait(1000);
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

    it("should verify user privileges in custom groups", () => {
        const groupName = fake.firstName.replace(/[^A-Za-z]/g, "");
        const appName2 = fake.companyName;
        const appName3 = fake.companyName;
        const appSlug = appName3.toLowerCase().replace(/\s+/g, "-");
        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email
        );
        cy.apiLogout();

        // Setup custom group
        cy.apiLogin();
        cy.visit(data.workspaceSlug);
        navigateToManageGroups();
        cy.get(groupsSelector.groupLink("Builder")).click();
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).uncheck();
        cy.get(groupsSelector.appsDeleteCheck).uncheck();
        cy.get(groupsSelector.foldersCreateCheck).uncheck();
        cy.get(groupsSelector.workspaceVarCheckbox).uncheck();

        createGroupsAndAddUserInGroup(groupName, data.email);

        // Permission configuration and verification
        cy.get(groupsSelector.permissionsLink).click();

        // App creation permission
        cy.get(groupsSelector.appsCreateCheck).check();
        cy.get(commonSelectors.defaultModalTitle).contains(
            groupsText.changeUserRoleHeader
        );
        cy.get(groupsSelector.changeRoleModalMessage).contains(
            groupsText.changeUserRoleMessage
        );
        cy.get(".item-list").contains(data.email);
        cy.get(groupsSelector.confimButton).should(
            "have.text",
            groupsText.continueButtonText
        );
        cy.get(commonSelectors.cancelButton).click();

        // Other permissions
        const permissions = [
            groupsSelector.appsDeleteCheck,
            groupsSelector.foldersCreateCheck,
            groupsSelector.workspaceVarCheckbox,
        ];

        permissions.forEach((permission) => {
            cy.get(permission).check();
            cy.get(".modal-content").should("be.visible");
            cy.get(commonSelectors.cancelButton).click();
        });

        // Granular permissions
        cy.get(groupsSelector.granularLink).click();
        cy.get(groupsSelector.addAppButton).click();
        cy.clearAndType(groupsSelector.permissionNameInput, data.firstName);
        cy.get(groupsSelector.editPermissionRadio).click();
        cy.get(groupsSelector.confimButton).click();

        // Verify modal
        cy.get(".modal-content").should("be.visible");
        cy.get(groupsSelector.modalHeader).should(
            "have.text",
            groupsText.cantCreatePermissionModalHeader
        );
        cy.get(groupsSelector.modalMessage).should(
            "have.text",
            groupsText.cantCreatePermissionModalMessage
        );

        cy.get(".item-list").contains(data.email);
        cy.get(commonSelectors.closeButton).click();

        // Role transition
        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).check();
        cy.get(groupsSelector.confimButton).click();
        permissions.forEach((permission) => {
            cy.get(permission).check();
        });
        cy.get(groupsSelector.groupLink("Builder")).click();
        cy.get(groupsSelector.usersLink).click();
        cy.get(`[data-cy="${data.email}-user-row"]`).should("be.visible");
        cy.apiLogout();
        cy.apiLogin(data.email);
        cy.visit(data.workspaceSlug);

        // Verify builder permissions
        verifyBasicPermissions(true);

        // App operations
        cy.createApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appCreatedToast
        );
        cy.backToApps();

        cy.wait(2500);
        cy.deleteApp(data.appName);
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            commonText.appDeletedToast
        );

        // Folder operations
        createFolder(data.folderName);
        deleteFolder(data.folderName);

        // Constants management
        cy.get(commonSelectors.workspaceConstantsIcon).click();
        addNewconstants(data.firstName, data.appName);
        cy.get(
            workspaceConstantsSelectors.constDeleteButton(data.firstName)
        ).click();
        cy.get(commonSelectors.yesButton).click();

        verifySettingsAccess(false);
        cy.get(commonSelectors.settingsIcon).click();
        cy.wait(500);
        cy.apiLogout();

        cy.apiLogin();
        cy.visit(data.workspaceSlug);
        navigateToManageGroups();
        cy.get(groupsSelector.groupLink(groupName)).click();

        cy.get(groupsSelector.permissionsLink).click();
        cy.get(groupsSelector.appsCreateCheck).uncheck();
        permissions.forEach((permission) => {
            cy.get(permission).uncheck();
        });

        cy.get(groupsSelector.groupLink("Builder")).click();
        cy.get(groupsSelector.granularLink).click();
        cy.wait(1000);
        cy.get(groupsSelector.granularAccessPermission)
            .trigger("mouseenter")
            .click({ force: true });
        cy.get(groupsSelector.deletePermissionIcon).click();
        cy.get(groupsSelector.yesButton).click();

        // Create test apps
        cy.get(commonSelectors.homePageLogo).click();
        cy.apiCreateApp(data.appName);
        cy.apiCreateApp(appName2);

        // App Hide from dashboard
        cy.apiCreateApp(appName3);
        cy.openApp();
        cy.apiAddComponentToApp(appName3, "text1");
        releaseApp();
        cy.get(commonWidgetSelector.shareAppButton).click();
        cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${appSlug}`);
        cy.wait(500);
        cy.get(commonWidgetSelector.modalCloseButton).click();
        cy.backToApps();

        // Configure app permissions
        navigateToManageGroups();
        cy.get(groupsSelector.groupLink(groupName)).click();
        cy.get(groupsSelector.granularLink).click();

        // Setup permissions for both apps
        [data.appName, appName2, appName3].forEach((app) => {
            cy.get(groupsSelector.addAppButton).click();
            cy.clearAndType(groupsSelector.permissionNameInput, app);
            cy.get(groupsSelector.customradio).check();
            cy.get(".css-1gfides").click({ force: true }).type(`${app}{enter}`);
            cy.get(groupsSelector.confimButton).click({ force: true });
            cy.verifyToastMessage(
                commonSelectors.toastMessage,
                groupsText.createPermissionToast
            );
        });
        cy.get(groupsSelector.groupChip).contains(data.appName).click();
        cy.get(groupsSelector.editPermissionRadio).click();
        cy.get(groupsSelector.confimButton).click();

        //To hide app
        cy.get(groupsSelector.groupChip).contains(appName3).click();
        cy.get(groupsSelector.hidePermissionInput).check();
        cy.get(groupsSelector.confimButton).click();

        // Verify as end user
        cy.wait(1000);
        cy.apiLogout()
        cy.apiLogin(data.email);
        cy.visit(data.workspaceSlug);

        cy.get('.appcard-buttons-wrap [data-cy="edit-button"]').should(
            "have.lengthOf",
            1
        );
        cy.get('.appcard-buttons-wrap [data-cy="launch-button"]').should(
            "have.lengthOf",
            2
        );

        //Visit hidden app url
        cy.visitSlug({
            actualUrl: `${Cypress.config("baseUrl")}/applications/${appSlug}`,
        });
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

    it("should verify query creation and import access for Builders and Admin", () => {
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
            `${Cypress.env('server_host')}/api/v2/data_sources`,
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
            cy.log(result);
            const downloadedAppExportFileName = result.stdout.split("\n")[0];
            exportedFilePath = `cypress/downloads/${downloadedAppExportFileName}`;
            cy.log(exportedFilePath);
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
