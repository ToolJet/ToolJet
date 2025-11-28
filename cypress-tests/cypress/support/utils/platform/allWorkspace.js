import { commonSelectors } from "Selectors/common";
import { commonEeSelectors } from "Selectors/eeCommon";
import { instanceSettingsText } from "Texts/eeCommon";

import {
    instanceWorkspaceSelectors,
} from "Selectors/superAdminSelectors";

import {
    instanceWorkspaceText,
} from "Texts/superAdminText";

import {
    openInstanceSettings,
} from "Support/utils/platform/eeCommon";
``

const defaultWorkspaceName = "My workspace";
const defaultWsArchiveTooltip = "Default workspace cannot be archived. Set another workspace as default to proceed with archiving.";
const toastUnarchived = (name) => `${name} \n was successfully unarchived`;

export const openAllWorkspaces = () => {
    openInstanceSettings();
    cy.get(instanceWorkspaceSelectors.navAllWorkspaces).click();
};

export const verifyWorkspacePageHeader = () => {
    cy.get(commonEeSelectors.pageTitle).verifyVisibleElement("have.text", instanceSettingsText.pageTitle);
    cy.get(instanceWorkspaceSelectors.breadcrumbPageTitle).verifyVisibleElement("have.text", instanceWorkspaceText.breadcrumbTitle);
};

export const verifyWorkspaceTableControls = () => {
    cy.get(instanceWorkspaceSelectors.tabActive).should("be.visible");
    cy.get(instanceWorkspaceSelectors.tabArchived).should("be.visible");
    cy.get(instanceWorkspaceSelectors.searchBar).should("be.visible");
    cy.get(instanceWorkspaceSelectors.nameHeader).verifyVisibleElement("have.text", instanceWorkspaceText.nameHeader);
};

export const verifyWorkspaceRow = (workspaceName, isDefault = false) => {
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
        .contains(workspaceName)
        .should("be.visible")
        .within(() => {
            cy.contains(workspaceName).should("be.visible");
            if (isDefault) {
                cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should("be.visible");
            }
        });
};

export const verifyWorkspaceSelectDropdown = (testWorkspace) => {
    cy.get(instanceWorkspaceSelectors.selectControl).should("be.visible");
    cy.get(instanceWorkspaceSelectors.selectControl).click();
    cy.get(instanceWorkspaceSelectors.selectMenu).within(() => {
        cy.contains(instanceWorkspaceSelectors.selectOption, "My workspace").scrollIntoView().should("be.visible");
        cy.contains(instanceWorkspaceSelectors.selectOption, testWorkspace).scrollIntoView().should("be.visible");
    });
    cy.get(instanceWorkspaceSelectors.selectControl).click();
};

export const verifyWorkspaceTabs = () => {
    cy.get(instanceWorkspaceSelectors.tabActive).should("be.visible").and("contain", instanceWorkspaceText.activeTab);
    cy.get(instanceWorkspaceSelectors.tabArchived).should("be.visible").and("contain", instanceWorkspaceText.archivedTab);
};

export const verifyWorkspaceRowTags = (workspaceName) => {
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
        .contains(defaultWorkspaceName)
        .parent()
        .within(() => {
            cy.contains("Default workspace").should("be.visible");
        });
    cy.contains("Current workspace").should("be.visible");
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
        .contains(workspaceName)
        .should("be.visible");
};

export const openArchiveWorkspaceModal = (workspaceName) => {
    searchWorkspace(workspaceName);
    cy.get(instanceWorkspaceSelectors.statusChangeButton).click({ force: true });
};

export const verifyArchiveWorkspaceModalUI = (workspaceName) => {
    cy.get(commonEeSelectors.modalTitle).contains("Archive workspace");
    cy.contains(workspaceName).should("be.visible");
    cy.contains(
        "Archiving the workspace will revoke user access and all associate content. Are you sure you want to continue?"
    ).should("be.visible");
    cy.get(commonSelectors.cancelButton).should("be.visible");
    cy.contains("button", "Archive").should("be.visible");
    cy.get(commonSelectors.cancelButton).click();
};

export const verifyUnarchiveWorkspaceModalUI = (workspaceName) => {
    openArchiveWorkspaceModal(workspaceName);
    cy.get(instanceWorkspaceSelectors.confirmButton).click();
    cy.get(instanceWorkspaceSelectors.tabArchived).click();
    searchWorkspace(workspaceName);
    cy.get(instanceWorkspaceSelectors.statusChangeButton).click({ force: true });
    cy.get(instanceWorkspaceSelectors.confirmButton).click();
    cy.get(commonSelectors.toastMessage).should(
        "contain.text",
        toastUnarchived(workspaceName)
    );
};

export const verifyOpenWorkspaceTooltip = (workspaceName) => {
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
        .contains(workspaceName)
        .parents("tr")
        .within(() => {
            cy.get(instanceWorkspaceSelectors.openWorkspaceTooltip).trigger("mouseover");
        });
    cy.contains("Open workspace in new tab").should("be.visible");
};

export const searchWorkspace = (name) => {
    cy.get(instanceWorkspaceSelectors.searchBar).should("be.visible").clear().type(name);
};

export const verifyDefaultWorkspaceTooltip = () => {
    cy.get(instanceWorkspaceSelectors.workspaceTableRow).each(($row) => {
        cy.wrap($row)
            .find(instanceWorkspaceSelectors.workspaceNameCellSuffix)
            .invoke("text")
            .then((name) => {
                if (name.trim() === defaultWorkspaceName) {
                    cy.wrap($row)
                        .find(instanceWorkspaceSelectors.statusChangeButton)
                        .trigger("mouseover");

                    cy.get(instanceWorkspaceSelectors.tooltipDefaultWorkspace)
                        .should("be.visible")
                        .and("have.attr", "data-tooltip-content", defaultWsArchiveTooltip);
                }
            });
    });
};