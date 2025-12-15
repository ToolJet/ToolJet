import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { dataSourceSelector } from "Selectors/dataSource";
import { importSelectors } from "Selectors/exportImport";
import { groupsSelector } from "Selectors/manageGroups";
import {
    navigateToAppEditor,
    navigateToManageGroups,
    navigateToManageUsers
} from "Support/utils/common";
import {
    apiCreateGroup,
    inviteUserBasedOnRole,
    setupAndUpdateRole,
    setupWorkspaceAndInviteUser,
    updateRole,
    verifyUserPrivileges,
} from "Support/utils/manageGroups";
import { getGroupPermissionInput } from "Support/utils/userPermissions";
import { importText } from "Texts/exportImport";
import { groupsText } from "Texts/manageGroups";

describe("Manage Groups", () => {
    let data = {};
    const isEnterprise = Cypress.env("environment") === "Enterprise";

    beforeEach(() => {
        data = {
            firstName: fake.firstName,
            appName: fake.companyName,
            email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
            workspaceName: fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, ""),
            workspaceSlug: `${fake.lastName.toLowerCase().replace(/[^A-Za-z]/g, "")}-permissions`,
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

        cy.get(groupsSelector.groupLink("Admin")).click();
        cy.get(`[data-cy="dev@tooljet.io-user-row"] > :nth-child(3)`).click();

        cy.get(
            ".css-nwhe5y-container > .react-select__control > .react-select__value-container"
        )
            .click()
            .type(`Builder{enter}`);

        cy.get(groupsSelector.confimButton).click();
        cy.get(groupsSelector.confimButton).click();

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

    it("should verify datasource granular access in app builder", () => {
        const groupName = fake.firstName.replace(/[^A-Za-z]/g, "");
        const appImportFile = "cypress/fixtures/templates/permission-export.json";
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug).then((workspace) => {
            Cypress.env("workspaceId", workspace.body.organization_id);

            cy.visit(data.workspaceSlug);

            cy.ifEnv("Enterprise", () => {
                cy.apiUpdateGroupPermission(
                    "builder",
                    getGroupPermissionInput(isEnterprise, false)
                );
                cy.apiDeleteGranularPermission("builder", []);

                cy.intercept("GET", "/api/apps/*").as("getApp");

                cy.get(dashboardSelector.importAppButton).click();
                cy.get(importSelectors.importOptionInput)
                    .eq(0)
                    .selectFile(appImportFile, { force: true });
                cy.wait(2000);

                cy.get(importSelectors.importAppButton).click();
                cy.verifyToastMessage(
                    commonSelectors.toastMessage,
                    importText.appImportedToastMessage
                );
                cy.wait(2000);

                cy.wait("@getApp").then((interception) => {
                    const { id, editing_version, editorEnvironment, name } =
                        interception.response.body;
                    Cypress.env("appId", id);
                    Cypress.env("editingVersionId", editing_version.id);
                    Cypress.env("environmentId", editorEnvironment.id);
                    data.importedAppName = name;
                });

                cy.go("back");
                cy.wait(1000);

                apiCreateGroup(groupName).then((groupId) => {
                    cy.apiCreateGranularPermission(
                        groupName,
                        `${data.importedAppName}_permission`,
                        "app",
                        { canEdit: true, canView: false },
                        Cypress.env("appId"),
                        false
                    );

                    cy.apiCreateGranularPermission(
                        groupName,
                        "datasource1_permission",
                        "datasource",
                        { canUse: true, canConfigure: false },
                        ["datasource 1"],
                        false
                    );
                });

                cy.apiFullUserOnboarding(
                    data.firstName,
                    data.email,
                    "builder",
                    "password",
                    data.workspaceName,
                    {},
                    [groupName]
                );

                cy.wait(1000);

                cy.apiLogout();
                cy.apiLogin(data.email, "password");
                cy.visit(data.workspaceSlug);
                cy.wait(1000);

                navigateToAppEditor("permission-export");
                cy.wait(3000);

                cy.get(dataSourceSelector.listQuery("user1-datasource"))
                    .should("be.visible")
                    .click();
                cy.get(dataSourceSelector.runjsAddParamButton).eq(0).should("be.enabled");
                cy.get(dataSourceSelector.queryCreateAndRunButton)
                    .eq(0)
                    .should("be.enabled");
                cy.get(dataSourceSelector.queryPreviewButton).eq(0).should("be.enabled");
                cy.get(dataSourceSelector.queryHandlerMenu("user1-datasource")).click();
                cy.get(dataSourceSelector.queryCardDeleteButton).click();
                cy.get(dataSourceSelector.deleteModalConfirmButton).click();

                cy.get(dataSourceSelector.listQuery("user2-datasource"))
                    .should("be.visible")
                    .click();
                cy.get(dataSourceSelector.runjsAddParamButton).eq(0).should("be.enabled");
                cy.get(dataSourceSelector.queryCreateAndRunButton)
                    .eq(0)
                    .should("be.enabled");
                cy.get(dataSourceSelector.queryPreviewButton).eq(0).should("be.disabled");

                cy.get(dataSourceSelector.editorDSPopover).click();
                cy.wait(500);

                cy.get('[data-cy="ds-datasource 2"]').click();
                cy.verifyToastMessage(
                    commonSelectors.toastMessage,
                    "Failed to create query: You do not have permission to access this resource"
                );
            });
        });
    });
});
