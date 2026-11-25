import { instanceSettingsSelector } from "Constants/selectors/platform/eeCommon";
import { licenseSelectors } from "Constants/selectors/platform/license";
import { commonSelectors } from "Selectors/common";
import { openEditUserModal } from "Support/utils/platform/allUsers";

const verifySuperAdminModalState = ({
    email,
    headingText,
    infoText,
    upgradeButtonText,
    isToggleEnabled,
    closeModal = false,
}) => {
    openEditUserModal(email);

    if (headingText) {
        cy.get(licenseSelectors.licenseBannerHeading).verifyVisibleElement(
            "have.text",
            headingText
        );
    }

    if (infoText) {
        cy.get(licenseSelectors.licenseBannerInfo).verifyVisibleElement(
            "have.text",
            infoText
        );
    }

    if (upgradeButtonText) {
        cy.get('[data-cy="upgrade-button"]').should(
            "contain.text",
            upgradeButtonText
        );
    }

    if (typeof isToggleEnabled === "boolean") {
        cy.get(instanceSettingsSelector.superAdminToggle).should(
            isToggleEnabled ? "be.enabled" : "be.disabled"
        );
    }

    if (closeModal) {
        cy.get(commonSelectors.cancelButton).click();
    }
};

/**
 * @tjType   allUsersTab.ensure
 * @tjBlock  licensing
 * @tjUsage  ensureAllUsersTab()
 */
const ensureAllUsersTab = () => {
    cy.get(instanceSettingsSelector.allWorkspaceTab).click();
    cy.get(instanceSettingsSelector.allUsersTab).click({ force: true });
};

/**
 * @tjType   allUsersSettings.visit
 * @tjBlock  licensing
 * @tjUsage  visitAllUsersSettings()
 */
const visitAllUsersSettings = () => {
    cy.visit("settings/all-users");
    ensureAllUsersTab();
};

/**
 * @tjType   nearingSuperAdminLimit.verify
 * @tjBlock  licensing
 * @tjUsage  verifyNearingSuperAdminLimit(data.email1)
 */
const verifyNearingSuperAdminLimit = (email) => {
    verifySuperAdminModalState({
        email,
        headingText: "You're reaching your limit for number of super admins - 1/2.",
        infoText:
            "You're nearing your limit for number of super admins. Upgrade for more ",
        upgradeButtonText: "Upgrade",
        closeModal: true,
    });
};

/**
 * @tjType   limitReachedForSuperAdmin.verify
 * @tjBlock  licensing
 * @tjUsage  verifyLimitReachedForSuperAdmin(data.email1)
 */
const verifyLimitReachedForSuperAdmin = (email) => {
    verifySuperAdminModalState({
        email,
        headingText: "You have reached your limit for number of super admins.",
        isToggleEnabled: true,
        closeModal: true,
    });
};

/**
 * @tjType   limitReachedForOtherUser.verify
 * @tjBlock  licensing
 * @tjUsage  verifyLimitReachedForOtherUser(data.email2)
 */
const verifyLimitReachedForOtherUser = (email) => {
    verifySuperAdminModalState({
        email,
        headingText: "You have reached your limit for number of super admins.",
        isToggleEnabled: false,
        closeModal: true,
    });
};

/**
 * @tjType   toggleEnabledAfterDemotion.verify
 * @tjBlock  licensing
 * @tjUsage  verifyToggleEnabledAfterDemotion(data.email2)
 */
const verifyToggleEnabledAfterDemotion = (email) => {
    verifySuperAdminModalState({
        email,
        isToggleEnabled: true,
        closeModal: true,
    });
};

const navigateBackToAllUsers = () => {
    cy.get(instanceSettingsSelector.allWorkspaceTab).click();
    cy.get(instanceSettingsSelector.allUsersTab).click({ force: true });
};

export {
    ensureAllUsersTab,
    navigateBackToAllUsers,
    verifyLimitReachedForOtherUser,
    verifyLimitReachedForSuperAdmin,
    verifyNearingSuperAdminLimit,
    verifySuperAdminModalState,
    verifyToggleEnabledAfterDemotion,
    visitAllUsersSettings,
};
