import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { groupsSelector } from "Selectors/manageGroups";
import { navigateToManageGroups } from "Support/utils/common";
import { apiUpdateProfile } from "Support/utils/platform/apiUtils/commonApi";
import {
    commonGroupVerification,
    toggleAllPermissions,
    verifyAdminHelperText,
    verifyCheckPermissionStates,
    verifyEditUserRoleModal,
    verifyEmptyStates,
    verifyEnduserHelperText,
    verifyGranularAccessByRole,
    verifyGranularAddModal,
    verifyGranularEditModal,
    verifyPermissionCheckBoxLabelsAndHelperTexts,
    verifyUserRow,
} from "Support/utils/platform/groupsUI";
import { groupsText } from "Texts/manageGroups";

describe("User Role UI and Functionality verification", () => {
    const data = {};

    beforeEach(() => {
        data.workspaceName = fake.firstName;
        data.workspaceSlug = fake.firstName
            .toLowerCase()
            .replaceAll("[^A-Za-z]", "");

        cy.apiLogin();
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
        apiUpdateProfile("The", "Developer");

        cy.visit(`${data.workspaceSlug}`);
        navigateToManageGroups();
        cy.viewport(2000, 1900);
    });

    it("should verify admin role UI elements and interactions", () => {
        // Verify page headers
        cy.get(commonSelectors.breadcrumbTitle).should(($el) => {
            expect($el.contents().first().text().trim()).to.eq("Workspace settings");
        });
        cy.get(commonSelectors.breadcrumbPageTitle).verifyVisibleElement(
            "have.text",
            "Groups"
        );

        cy.get('[data-cy="page-title"]').should(($el) => {
            expect($el.contents().last().text().trim()).to.eq("Groups");
        });

        cy.verifyElement(
            groupsSelector.createNewGroupButton,
            groupsText.createNewGroupButton
        );

        cy.get('[data-cy="user-role-title"]').verifyVisibleElement(
            "have.text",
            "USER ROLE"
        );
        cy.verifyElement('[data-cy="custom-groups-title"]', "CUSTOM GROUPS");
        cy.get('[data-cy="create-new-group-button-icon"]').should("be.visible");
        cy.get('[data-cy="search-icon"]').should("be.visible");

        // Admin List Item Verification
        cy.verifyElement(groupsSelector.adminListItem, "Admin");
        cy.verifyElement(groupsSelector.adminTitle, "Admin (1)");
        cy.verifyElement(
            groupsSelector.textDefaultGroup,
            groupsText.textDefaultGroup
        );

        // Verify tabs visibility
        cy.get(groupsSelector.usersLink).should("be.visible");
        cy.get(groupsSelector.permissionsLink).should("be.visible");
        cy.get(groupsSelector.granularLink).should("be.visible");

        commonGroupVerification();

        // Users Tab Verification
        cy.get(groupsSelector.usersLink).click();
        cy.get('[data-cy="user-group-search-btn"]').should("be.visible");
        cy.verifyElement(
            groupsSelector.nameTableHeader,
            groupsText.userNameTableHeader
        );
        cy.verifyElement(
            groupsSelector.emailTableHeader,
            groupsText.emailTableHeader
        );

        verifyUserRow("The Developer", " dev@tooljet.io");

        cy.get('[data-cy="edit-role-button"]')
            .should("be.visible")
            .and("be.enabled");
        cy.get('[data-cy="edit-role-button"]').click();
        verifyEditUserRoleModal("dev@tooljet.io");
        cy.get(groupsSelector.cancelButton).click();

        // Permissions Tab Verification
        cy.get(groupsSelector.permissionsLink).click();
        verifyAdminHelperText(0);

        verifyCheckPermissionStates("admin");
        verifyPermissionCheckBoxLabelsAndHelperTexts();

        // Granular Access Tab Verification
        verifyGranularAccessByRole("admin");
        verifyAdminHelperText(1);
    });

    it("should verify builder role UI elements and interactions", () => {
        // Builder Group Navigation and Title Verification
        cy.get(groupsSelector.groupLink("Builder")).click();
        cy.verifyElement(groupsSelector.builderListItem, "Builder");
        cy.verifyElement(groupsSelector.builderTitle, "Builder (0)");
        cy.verifyElement(
            groupsSelector.textDefaultGroup,
            groupsText.textDefaultGroup
        );

        // Verify tabs visibility
        cy.get(groupsSelector.usersLink).should("be.visible");
        cy.get(groupsSelector.permissionsLink).should("be.visible");
        cy.get(groupsSelector.granularLink).should("be.visible");

        // Users Tab Verification - Empty State
        verifyEmptyStates();

        // Permissions Tab Verification
        cy.get(groupsSelector.permissionsLink).click();
        verifyCheckPermissionStates("builder");
        verifyPermissionCheckBoxLabelsAndHelperTexts();
        toggleAllPermissions();

        // Granular Access Tab Verification
        verifyGranularAccessByRole("builder");
        cy.verifyElement(
            groupsSelector.appHideLabel,
            groupsText.appHideLabelPermissionModal
        );

        // Edit Modal Verification
        verifyGranularEditModal("builder");

        // Add Modal Verification
        verifyGranularAddModal("builder");
    });

    it("should verify enduser role UI and interaction", () => {
        // End-user Group Navigation and Title Verification
        cy.get(groupsSelector.groupLink("End-user")).click();
        cy.get(groupsSelector.groupLink("End-user")).verifyVisibleElement(
            "have.text",
            "End-user"
        );
        cy.get(groupsSelector.enduserTitle).verifyVisibleElement(
            "have.text",
            "End-user (0)"
        );
        cy.verifyElement(
            groupsSelector.textDefaultGroup,
            groupsText.textDefaultGroup
        );

        // Verify tabs visibility
        cy.get(groupsSelector.usersLink).should("be.visible");
        cy.get(groupsSelector.permissionsLink).should("be.visible");
        cy.get(groupsSelector.granularLink).should("be.visible");

        // Users Tab Verification - Empty State
        verifyEmptyStates();

        // Permissions Tab Verification
        cy.get(groupsSelector.permissionsLink).click();
        verifyEnduserHelperText(0);
        verifyCheckPermissionStates("enduser");
        verifyPermissionCheckBoxLabelsAndHelperTexts();

        // Granular Access Tab Verification
        cy.reload();
        cy.wait(3000);
        cy.get(groupsSelector.groupLink("End-user")).click();

        verifyGranularAccessByRole("enduser");
        verifyEnduserHelperText(1);
        cy.verifyElement(
            groupsSelector.appHideLabel,
            groupsText.appHideLabelPermissionModal
        );

        // Edit Modal Verification
        verifyGranularEditModal("enduser");

        // Add Modal Verification
        verifyGranularAddModal("enduser");
    });
});
