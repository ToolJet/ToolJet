import { commonSelectors } from "Selectors/common";
import { onboardingSelectors } from "Selectors/onboarding";
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeSelectors, workspaceSelector } from "Selectors/eeCommon";
import { instanceWorkspaceSelectors } from "Selectors/instanceWorkspaceSelectors";
import { instanceWorkspaceText } from "Texts/instanceWorkspaceText";

const defaultWorkspace = "My workspace";

const slug = (name) => name.toLowerCase().replace(/\s+/g, "-");
const toastUnarchived = (name) => `${name} \n was successfully unarchived`;

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
