import { commonSelectors, cyParamName } from "Selectors/common";
import { commonEeSelectors } from "Selectors/eeCommon";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";

export const createGroupViaUI = (groupName) => {
    cy.get(groupsSelector.createNewGroupButton).click();
    cy.get(groupsSelector.addNewGroupModalTitle).verifyVisibleElement(
        "have.text",
        groupsText.cardTitle
    );
    cy.clearAndType(groupsSelector.groupNameInput, groupName);
    cy.get(groupsSelector.createGroupButton).should("be.enabled").click();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        groupsText.groupCreatedToast
    );
};

export const verifyGroupCreatedInSidebar = (groupName) => {
    cy.get(groupsSelector.groupLink(groupName))
        .should("be.visible")
        .and("contain.text", groupName);
};

export const renameGroupViaUI = (oldName, newName) => {
    cy.get(groupsSelector.groupLink(oldName)).click();
    cy.get(groupsSelector.groupNameUpdateLink).should("be.visible").click();
    cy.clearAndType(groupsSelector.groupNameInput, newName);
    cy.get(groupsSelector.createGroupButton).click();
    cy.verifyToastMessage(
        commonSelectors.toastMessage,
        groupsText.groupNameUpdateSucessToast
    );
};

export const deleteGroupViaUI = (groupName) => {
    cy.get(groupsSelector.groupLink(groupName)).click();
    cy.get(groupsSelector.groupLink(groupName)).realHover();
    cy.wait(2000).then(() => {
        cy.get(
            `[data-cy="${cyParamName(groupName)}-list-item"] > :nth-child(2) > .tj-base-btn`
        ).click({ force: true });
    });
    cy.get(groupsSelector.deleteGroupOption).click();
    cy.get(commonSelectors.buttonSelector("Yes")).click();
};

export const verifyGroupRemovedFromSidebar = (groupName) => {
    cy.get(groupsSelector.groupLink(groupName)).should("not.exist");
};

export const addGranularPermissionViaUI = (permissionName, options = {}) => {
    const {
        resourceType = "app",
        permission = "edit",
        scope = "all",
        resources = [],
    } = options;

    cy.ifEnv("Community", () => {
        cy.get(groupsSelector.addAppsButton).click();
    });
    cy.ifEnv("Enterprise", () => {
        cy.get(groupsSelector.addPermissionButton).click();
        if (resourceType === "app") {
            cy.get(groupsSelector.addAppButton).click();
        } else if (resourceType === "workflow") {
            cy.get(groupsSelector.addWorkflowButton).click();
        } else if (resourceType === "datasource") {
            cy.get(groupsSelector.addDatasourceButton).click();
        }
    });

    cy.clearAndType(groupsSelector.permissionNameInput, permissionName);

    if (resourceType === "app") {
        if (permission === "view") {
            cy.get(groupsSelector.viewPermissionRadio).check();
        } else if (permission === "edit") {
            cy.get(groupsSelector.editPermissionRadio).check();
        }
    } else if (resourceType === "workflow") {
        if (permission === "execute") {
            cy.get(groupsSelector.executeWorkflowradio).check();
        } else if (permission === "build") {
            cy.get(groupsSelector.buildWorkflowradio).check();
        }
    } else if (resourceType === "datasource") {
        if (permission === "buildWith") {
            cy.get(groupsSelector.buildWithDatasourceRadio).check();
        } else if (permission === "configure") {
            cy.get(groupsSelector.configureDatasourceradio).check();
        }
    }

    if (scope === "custom") {
        cy.get(groupsSelector.customRadio).check();
        if (resources.length > 0) {
            resources.forEach((resource) => {
                cy.get(groupsSelector.resourceSelector).click();
                cy.get(groupsSelector.searchBoxOptions).contains(resource).click();
            });
        }
    } else {
        cy.get(groupsSelector.allAppsRadio).check();
    }

    cy.get(groupsSelector.confimButton).click();
};

export const switchBetweenAllAndCustom = (targetScope) => {
    if (targetScope === "all") {
        cy.get(groupsSelector.allAppsRadio).check();
        cy.get(groupsSelector.allAppsRadio).should("be.checked");
        cy.get(groupsSelector.customRadio).should("not.be.checked");
    } else if (targetScope === "custom") {
        cy.get(groupsSelector.customRadio).check();
        cy.get(groupsSelector.customRadio).should("be.checked");
        cy.get(groupsSelector.allAppsRadio).should("not.be.checked");
        cy.get(".css-b62m3t-container").should("be.visible");
    }
};

export const openGroupThreeDotMenu = (groupName) => {
    cy.get(groupsSelector.groupLink(groupName)).realHover()
    cy.get(groupsSelector.groupLink(groupName)).then(() => {
        cy.get('[datacy="groups-list-option-button"]').click();
    });
};

export const verifyDuplicateModal = (originalGroupName) => {
    cy.get('[data-cy="modal-title"]')
        .should("be.visible")
        .and("contain.text", "Duplicate group");

    cy.verifyElement(
        '[data-cy="modal-message"]',
        "Duplicate the following parts of the group"
    );
    cy.verifyElement('[data-cy="users-label"]', "Users");
    cy.get('[data-cy="users-check-input"]')
        .should("be.visible")
        .and("be.checked");

    cy.verifyElement('[data-cy="permissions-label"]', "Permissions");
    cy.get('[data-cy="permissions-check-input"]')
        .should("be.visible")
        .and("be.checked");

    cy.verifyElement('[data-cy="apps-label"]', "Apps");
    cy.get('[data-cy="apps-check-input"]').should("be.visible").and("be.checked");

    cy.ifEnv("Enterprise", () => {
        cy.verifyElement('[data-cy="workflows-label"]', "Workflows");
        cy.get('[data-cy="workflows-check-input"]')
            .should("be.visible")
            .and("be.checked");

        cy.verifyElement('[data-cy="datasources-label"]', "Datasources");
        cy.get('[data-cy="datasources-check-input"]')
            .should("be.visible")
            .and("be.checked");
    });

    cy.verifyElement(groupsSelector.cancelButton, "Cancel");
    cy.get(groupsSelector.cancelButton).should("be.visible").and("be.enabled");

    cy.verifyElement(commonEeSelectors.confirmButton, "Duplicate");
    cy.get(commonEeSelectors.confirmButton)
        .should("be.visible")
        .and("be.enabled");
};
