import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import {
    navigateToManageGroups,
    sanitize,
    selectAppCardOption,
    releaseApp
} from "Support/utils/common";
import {
    createGroupsAndAddUserInGroup,
    setupWorkspaceAndInviteUser,
    updateRole,
} from "Support/utils/manageGroups";
import {
    uiAppCRUDWorkflow,
    uiDataSourceCRUDWorkflow,
    uiFolderCRUDWorkflow,
    uiVerifyAdminPrivileges,
    uiVerifyBuilderPrivileges,
    uiWorkflowCRUDWorkflow,
    uiWorkspaceConstantCRUDWorkflow,
} from "Support/utils/uiPermissions";
import {
    verifyBasicPermissions,
    verifySettingsAccess,
} from "Support/utils/userPermissions";
import { commonText } from "Texts/common";
import { dashboardText } from "Texts/dashboard";
import { groupsText } from "Texts/manageGroups";

describe("Basic Permissions", () => {
    let data = {};

    beforeEach(() => {
        data = {
            firstName: fake.firstName,
            appName: fake.companyName,
            email: fake.email.toLowerCase().replaceAll("[^A-Za-z]", ""),
            workspaceName: `${sanitize(fake.lastName)}-basic`,
            workspaceSlug: `${sanitize(fake.lastName)}-basic`,
            folderName: fake.companyName,
        };

        cy.apiLogin();
        cy.intercept("DELETE", "/api/folders/*").as("folderDeleted");
        cy.skipWalkthrough();
        cy.viewport(2000, 1900);
    });

    it("should verify end-user privileges", () => {
        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email
        );

        verifyBasicPermissions(false);
        verifySettingsAccess(false);
    });

    it("should verify builder privileges", () => {
        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email,
            "builder"
        );

        // UI-based privilege verification for Builder
        uiVerifyBuilderPrivileges();

        // UI CRUD workflows validation
        cy.get(commonSelectors.dashboardIcon).click();
        const uiTestAppName = `${data.appName}_ui`;
        const uiTestFolderName = `${data.folderName}-ui`;
        const uiTestConstName = `${data.firstName}_const`;
        const uiTestConstValue = "test_value";

        // Perform UI-based CRUD operations
        uiAppCRUDWorkflow(uiTestAppName);
        uiFolderCRUDWorkflow(uiTestFolderName);
        uiWorkspaceConstantCRUDWorkflow(uiTestConstName, uiTestConstValue);

        // Enterprise-specific UI workflows
        cy.ifEnv("Enterprise", () => {
            const uiTestDsName = `${data.appName}_ds`;
            const uiTestWorkflowName = `${data.appName}_wf`;
            uiDataSourceCRUDWorkflow(uiTestDsName, "restapi");
            uiWorkflowCRUDWorkflow(uiTestWorkflowName);
        });

        cy.get(commonSelectors.dashboardIcon).click();
        cy.apiCreateApp(data.appName);
        cy.openApp();

        releaseApp();

        //verify clone access
        cy.visit(data.workspaceSlug);
        selectAppCardOption(
            data.appName,
            commonSelectors.appCardOptions(commonText.cloneAppOption)
        );
        cy.get(commonSelectors.cloneAppButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            dashboardText.appClonedToast,
            false
        );
    });

    it("should verify admin privileges", () => {
        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email,
            "admin"
        );

        // API-based verification
        verifyBasicPermissions(true);

        // UI-based privilege verification for Admin (includes settings access)
        uiVerifyAdminPrivileges();

        // UI CRUD workflows for validation
        cy.get(commonSelectors.dashboardIcon).click();
        const uiTestAppName = `${data.appName}_admin_ui`;
        const uiTestFolderName = `${data.folderName}-admin-ui`;
        const uiTestConstName = `${data.firstName}_admin_const`;
        const uiTestConstValue = "admin_test_value";

        // Perform UI-based CRUD operations
        uiAppCRUDWorkflow(uiTestAppName);
        uiFolderCRUDWorkflow(uiTestFolderName);
        uiWorkspaceConstantCRUDWorkflow(uiTestConstName, uiTestConstValue);

        // Enterprise-specific UI workflows
        cy.ifEnv("Enterprise", () => {
            const uiTestDsName = `${data.appName}_admin_ds`;
            const uiTestWorkflowName = `${data.appName}_admin_wf`;
            uiDataSourceCRUDWorkflow(uiTestDsName, "restapi");
            uiWorkflowCRUDWorkflow(uiTestWorkflowName);
        });
    });

    it("should verify role updates in custom groups", () => {
        const builderGroup = fake.firstName.replace(/[^A-Za-z]/g, "");
        const endUserGroup = fake.firstName.replace(/[^A-Za-z]/g, "");

        setupWorkspaceAndInviteUser(
            data.workspaceName,
            data.workspaceSlug,
            data.firstName,
            data.email,
            "builder"
        );

        cy.apiLogout();
        cy.apiLogin();
        cy.visit(data.workspaceSlug);
        cy.apiCreateApp(`${data.appName}_builder`);
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
        cy.get(commonSelectors.appCard(`${data.appName}_builder`))
            .trigger("mouseover")
            .trigger("mouseenter")
            .find(commonSelectors.editButton)
            .should("not.exist");
    });
});
