// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// allWorkspace.js
//   openAllWorkspaces                instanceWorkspace.list → superAdmin
//   verifyWorkspacePageHeader        instanceWorkspace.verifyHeader → superAdmin
//   verifyWorkspaceTableControls     instanceWorkspace.verifyControls → superAdmin
//   verifyWorkspaceRow               instanceWorkspace.verifyRow → superAdmin
//   verifyWorkspaceSelectDropdown    instanceWorkspace.verifyDropdown → superAdmin
//   verifyWorkspaceTabs              instanceWorkspace.verifyTabs → superAdmin
//   verifyWorkspaceRowTags           instanceWorkspace.verifyRowTags → superAdmin
//   openArchiveWorkspaceModal        instanceWorkspace.openArchiveModal → superAdmin
//   verifyArchiveWorkspaceModalUI    instanceWorkspace.verifyArchiveModal → superAdmin
//   verifyUnarchiveWorkspaceModalUI  instanceWorkspace.unarchive → superAdmin
//   verifyOpenWorkspaceTooltip       instanceWorkspace.verifyOpenTooltip → superAdmin
//   searchWorkspace                  instanceWorkspace.search → superAdmin
//   verifyDefaultWorkspaceTooltip    instanceWorkspace.verifyDefaultTooltip → superAdmin
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors } from "Selectors/common";
import { commonEeSelectors } from "Selectors/platform/eeCommon";
import { instanceSettingsText } from "Texts/platform/eeCommon";

import {
    instanceWorkspaceSelectors,
} from "Selectors/platform/superAdminSelectors";

import {
    instanceWorkspaceText,
} from "Texts/platform/superAdminText";

import {
    openInstanceSettings,
} from "Support/utils/platform/eeCommon";
``

const defaultWorkspaceName = "My workspace";
const defaultWsArchiveTooltip = "Default workspace cannot be archived. Set another workspace as default to proceed with archiving.";
const toastUnarchived = (name) => `${name} \n was successfully unarchived`;

/**
* @tjType   instanceWorkspace.list
* @tjBlock  superAdmin
* @tjUsage  openAllWorkspaces()
* @tjDom    instance settings -> All workspaces nav
*/
export const openAllWorkspaces = () => {
    openInstanceSettings();
    cy.get(instanceWorkspaceSelectors.navAllWorkspaces).click();
};

/**
* @tjType   instanceWorkspace.verifyHeader
* @tjBlock  superAdmin
* @tjUsage  verifyWorkspacePageHeader()
* @tjDom    page title + breadcrumb
*/
export const verifyWorkspacePageHeader = () => {
    cy.get(commonEeSelectors.pageTitle).verifyVisibleElement("have.text", instanceSettingsText.pageTitle);
    cy.get(instanceWorkspaceSelectors.breadcrumbPageTitle).verifyVisibleElement("have.text", instanceWorkspaceText.breadcrumbTitle);
};

/**
* @tjType   instanceWorkspace.verifyControls
* @tjBlock  superAdmin
* @tjUsage  verifyWorkspaceTableControls()
* @tjDom    active/archived tabs, search bar, name header
*/
export const verifyWorkspaceTableControls = () => {
    cy.get(instanceWorkspaceSelectors.tabActive).should("be.visible");
    cy.get(instanceWorkspaceSelectors.tabArchived).should("be.visible");
    cy.get(instanceWorkspaceSelectors.searchBar).should("be.visible");
    cy.get(instanceWorkspaceSelectors.nameHeader).verifyVisibleElement("have.text", instanceWorkspaceText.nameHeader);
};

/**
* @tjType   instanceWorkspace.verifyRow
* @tjBlock  superAdmin
* @tjUsage  verifyWorkspaceRow('QA workspace', true)
* @tjDom    row by name; asserts the default tag when isDefault
*/
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

/**
* @tjType   instanceWorkspace.verifyDropdown
* @tjBlock  superAdmin
* @tjUsage  verifyWorkspaceSelectDropdown('QA workspace')
* @tjDom    opens the select, asserts both options, closes it
*/
export const verifyWorkspaceSelectDropdown = (testWorkspace) => {
    cy.get(instanceWorkspaceSelectors.selectControl).should("be.visible");
    cy.get(instanceWorkspaceSelectors.selectControl).click();
    cy.get(instanceWorkspaceSelectors.selectMenu).within(() => {
        cy.contains(instanceWorkspaceSelectors.selectOption, "My workspace").scrollIntoView().should("be.visible");
        cy.contains(instanceWorkspaceSelectors.selectOption, testWorkspace).scrollIntoView().should("be.visible");
    });
    cy.get(instanceWorkspaceSelectors.selectControl).click();
};

/**
* @tjType   instanceWorkspace.verifyTabs
* @tjBlock  superAdmin
* @tjUsage  verifyWorkspaceTabs()
* @tjDom    Active / Archived tab labels
*/
export const verifyWorkspaceTabs = () => {
    cy.get(instanceWorkspaceSelectors.tabActive).should("be.visible").and("contain", instanceWorkspaceText.activeTab);
    cy.get(instanceWorkspaceSelectors.tabArchived).should("be.visible").and("contain", instanceWorkspaceText.archivedTab);
};

/**
* @tjType   instanceWorkspace.verifyRowTags
* @tjBlock  superAdmin
* @tjUsage  verifyWorkspaceRowTags('QA workspace')
* @tjDom    searches twice: 'Default workspace' then 'Current workspace' tag
*/
export const verifyWorkspaceRowTags = (workspaceName) => {
    searchWorkspace(defaultWorkspaceName);
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
        .contains(defaultWorkspaceName)
        .parent()
        .within(() => {
            cy.contains("Default workspace").should("be.visible");
        });
    searchWorkspace(workspaceName);
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
        .contains(workspaceName)
        .parent()
        .within(() => {
            cy.contains("Current workspace").should("be.visible");
        });
};

/**
* @tjType   instanceWorkspace.openArchiveModal
* @tjBlock  superAdmin
* @tjUsage  openArchiveWorkspaceModal('QA workspace')
* @tjDom    search -> status-change button
*/
export const openArchiveWorkspaceModal = (workspaceName) => {
    searchWorkspace(workspaceName);
    cy.get(instanceWorkspaceSelectors.statusChangeButton).click({ force: true });
};

/**
* @tjType   instanceWorkspace.verifyArchiveModal
* @tjBlock  superAdmin
* @tjUsage  verifyArchiveWorkspaceModalUI('QA workspace')
* @tjDom    modal title, copy, buttons; closes via Cancel
*/
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

/**
* @tjType   instanceWorkspace.unarchive
* @tjBlock  superAdmin
* @tjUsage  verifyUnarchiveWorkspaceModalUI('QA workspace')
* @tjDom    archives, switches to Archived tab, unarchives, asserts toast
*/
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

/**
* @tjType   instanceWorkspace.verifyOpenTooltip
* @tjBlock  superAdmin
* @tjUsage  verifyOpenWorkspaceTooltip('QA workspace')
* @tjDom    hovers the open-in-new-tab icon
*/
export const verifyOpenWorkspaceTooltip = (workspaceName) => {
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
        .contains(workspaceName)
        .parents("tr")
        .within(() => {
            cy.get(instanceWorkspaceSelectors.openWorkspaceTooltip).trigger("mouseover");
        });
    cy.contains("Open workspace in new tab").should("be.visible");
};

/**
* @tjType   instanceWorkspace.search
* @tjBlock  superAdmin
* @tjUsage  searchWorkspace('QA workspace')
* @tjDom    clears + types into the search bar
*/
export const searchWorkspace = (name) => {
    cy.get(instanceWorkspaceSelectors.searchBar).should("be.visible").clear().type(name);
};

/**
* @tjType   instanceWorkspace.verifyDefaultTooltip
* @tjBlock  superAdmin
* @tjUsage  verifyDefaultWorkspaceTooltip()
* @tjDom    hovers status-change on the default row; asserts the cannot-archive tooltip
*/
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