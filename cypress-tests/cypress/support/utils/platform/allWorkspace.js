import { commonSelectors } from "Selectors/common";
import { instanceSettingsText } from "Texts/eeCommon";
import { onboardingSelectors } from "Selectors/onboarding";
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeSelectors, workspaceSelector } from "Selectors/eeCommon";
import { instanceWorkspaceSelectors } from "Selectors/superAdminSelectors";
import { instanceWorkspaceText } from "Texts/instanceWorkspaceText";

const defaultWorkspace = "My workspace";

const slug = (name) => name.toLowerCase().replace(/\s+/g, "-");
const toastUnarchived = (name) => `${name} \n was successfully unarchived`;

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
  searchWorkspace(workspaceName);
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
  clearWorkspaceSearch();
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
        .contains(defaultWorkspace)
        .parent()
        .within(() => {
            cy.contains("Default workspace").should("be.visible");
        });
    searchWorkspace(workspaceName);
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

export const openAllWorkspaces = () => {
  openInstanceSettings();
  cy.get(instanceWorkspaceSelectors.navAllWorkspaces).click();
};

export const findAndArchiveWorkspace = (workspaceName) => {
  cy.get(instanceWorkspaceSelectors.searchBar)
    .should("be.visible")
    .clear()
    .type(workspaceName);
  cy.get(instanceWorkspaceSelectors.statusChangeButton, {
    timeout: 30000,
  })
    .should("be.visible")
    .click({ force: true });
  cy.get(commonEeSelectors.confirmButton, { timeout: 10000 })
    .should("be.visible")
    .click();
};

export const findAndUnarchiveWorkspace = (workspaceName) => {
  cy.get(instanceWorkspaceSelectors.tabArchived).click();
  cy.get(instanceWorkspaceSelectors.searchBar, { timeout: 10000 })
    .should("be.visible")
    .clear()
    .type(workspaceName);
  cy.get(instanceWorkspaceSelectors.statusChangeButton, {
    timeout: 10000,
  }).click({ force: true });

  cy.get(commonSelectors.toastMessage).should(
    "contain.text",
    toastUnarchived(workspaceName)
  );
};

export const verifyDefaultWorkspaceTooltip = () => {
  cy.get(instanceWorkspaceSelectors.workspaceTableRow).each(($row) => {
    cy.wrap($row)
      .find(instanceWorkspaceSelectors.workspaceNameCellSuffix)
      .invoke("text")
      .then((name) => {
        if (name.trim() === defaultWorkspace) {
          cy.wrap($row)
            .find(instanceWorkspaceSelectors.statusChangeButton)
            .trigger("mouseover");
          cy.get(instanceWorkspaceSelectors.tooltipDefaultWorkspace)
            .should("be.visible")
            .and(
              "have.attr",
              "data-tooltip-content",
              instanceWorkspaceText.deaultWorkspaceArchiveTooltip
            );
        }
      });
  });
};

export const handleArchiveWorkspaceModal = () => {
  cy.get(workspaceSelector.switchWsModalTitle).verifyVisibleElement(
    "have.text",
    instanceWorkspaceText.archiveCurrentWorkspaceTitle
  );
  cy.get(workspaceSelector.switchWsModalMessage).should(
    "contain.text",
    instanceWorkspaceText.archiveCurrentWorkspaceMessage
  );
  cy.get(`[data-cy="${slug(defaultWorkspace)}-workspace-input"]`).check();
  cy.get(instanceWorkspaceSelectors.continueButton).click();
  cy.url().should("include", `/${slug(defaultWorkspace)}`);
};

export const loginAsUser = (userEmail, workspaceName = null) => {
  cy.apiLogout();
  cy.clearCookies();
  cy.clearLocalStorage();
  if (workspaceName) {
    cy.visit(`/${workspaceName}`);
  }
  cy.clearAndType(onboardingSelectors.loginEmailInput, userEmail);
  cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
  cy.get(onboardingSelectors.signInButton).click();
};

export const setupWorkspaceWithApp = (workspaceName, appName) => {
  cy.apiCreateWorkspace(workspaceName, workspaceName).then((ws) => {
    Cypress.env("workspaceId", ws.body.organization_id);
  });
  cy.apiCreateApp(appName).then((res) => {
    Cypress.env("appId", res.body.id);
  });
  cy.openApp();
  cy.apiAddComponentToApp(appName, "text1");
  cy.apiPromoteAppVersion().then(() => {
    cy.apiPromoteAppVersion(Cypress.env("stagingEnvId"));
  });
  cy.apiReleaseApp(appName);
  cy.apiAddAppSlug(appName, appName);
  cy.go("back");
  cy.apiMakeAppPublic(Cypress.env("appId"));
};

export const changeDefaultWorkspace = (newWorkspaceName) => {
  cy.get(instanceWorkspaceSelectors.selectControl).should("be.visible").click();
  cy.get(instanceWorkspaceSelectors.selectMenu)
    .contains(instanceWorkspaceSelectors.selectOption, newWorkspaceName)
    .scrollIntoView()
    .click();
  cy.get(commonEeSelectors.confirmButton).should("be.visible").click();
};

export const verifyDefaultWorkspaceTag = (
  workspaceName,
  shouldExist = true
) => {
  searchWorkspace(workspaceName);
  cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
    .contains(workspaceName)
    .should("be.visible")
    .parent()
    .within(() => {
      if (shouldExist) {
        cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should(
          "be.visible"
        );
      } else {
        cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should(
          "not.exist"
        );
      }
    });
};

export const searchWorkspace = (workspaceName) => {
  cy.get(instanceWorkspaceSelectors.searchBar)
    .should("be.visible")
    .clear()
    .type(workspaceName);
};

export const clearWorkspaceSearch = () => {
  cy.get(instanceWorkspaceSelectors.searchBar).clear();
};
