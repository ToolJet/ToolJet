import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { onboardingSelectors } from "Selectors/onboarding";
import { visitWorkspaceInvitation } from "Support/utils/onboarding";
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeSelectors, workspaceSelector } from "Selectors/eeCommon";
import { instanceWorkspaceSelectors } from "Selectors/instanceWorkspaceSelectors";
import { instanceWorkspaceText } from "Texts/instanceWorkspaceText";

describe("Instance settings - All workspaces management", () => {
  const DEFAULT_WORKSPACE = "My workspace";
  const DEFAULT_WS_ARCHIVE_TOOLTIP =
    "Default workspace cannot be archived. Set another workspace as default to proceed with archiving.";
  const confirmButton = commonEeSelectors.confirmButton;

  const slugify = (name) => name.toLowerCase().replace(/\s+/g, "-");
  const toastArchived = (name) => `${name} \n was successfully archived`;
  const toastUnarchived = (name) => `${name} \n was successfully unarchived`;

  beforeEach(() => {
    cy.defaultWorkspaceLogin();
  });

  const openAllWorkspaces = () => {
    openInstanceSettings();
    cy.get(instanceWorkspaceSelectors.navAllWorkspaces).click();
  };

  const findAndArchiveWorkspace = (workspaceName) => {
    cy.get(instanceWorkspaceSelectors.searchBar)
      .should("be.visible")
      .clear()
      .type(workspaceName);
    cy.wait(2000);
    cy.get(instanceWorkspaceSelectors.statusChangeButton, {
      timeout: 30000,
    }).click({ force: true });
    cy.get(confirmButton, { timeout: 10000 }).should("be.visible").click();
  };

  const findAndUnarchiveWorkspace = (workspaceName) => {
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

  const verifyDefaultWorkspaceTooltip = () => {
    cy.get(instanceWorkspaceSelectors.workspaceTableRow).each(($row) => {
      cy.wrap($row)
        .find(instanceWorkspaceSelectors.workspaceNameCellSuffix)
        .invoke("text")
        .then((name) => {
          if (name.trim() === DEFAULT_WORKSPACE) {
            cy.wrap($row)
              .find(instanceWorkspaceSelectors.statusChangeButton)
              .trigger("mouseover");

            cy.get(instanceWorkspaceSelectors.tooltipDefaultWorkspace)
              .should("be.visible")
              .and(
                "have.attr",
                "data-tooltip-content",
                DEFAULT_WS_ARCHIVE_TOOLTIP
              );
          }
        });
    });
  };

  const handleArchiveWorkspaceModal = () => {
    cy.get(workspaceSelector.switchWsModalTitle).verifyVisibleElement(
      "have.text",
      instanceWorkspaceText.archiveCurrentWorkspaceTitle
    );

    cy.get(workspaceSelector.switchWsModalMessage).should(
      "contain.text",
      instanceWorkspaceText.archiveCurrentWorkspaceMessage
    );
    cy.get(`[data-cy="${slugify(DEFAULT_WORKSPACE)}-workspace-input"]`).check();
    cy.get(instanceWorkspaceSelectors.continueButton).click();

    cy.url().should("include", `/${slugify(DEFAULT_WORKSPACE)}`);
  };

  const loginAsUser = (userEmail, workspaceName = null) => {
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

  const setupWorkspaceWithApp = (workspaceName, appName) => {
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
    cy.apiMakeAppPublic(Cypress.env("appId"));
  };

  // Need to run after bug fixes
  it.skip("should archive current workspace, show workspace switcher modal when archiving current workspace, and verify login restriction for archived workspace", () => {
    const workspace1 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
    cy.apiCreateWorkspace(workspace1, workspace1);
    cy.visit(`/${workspace1}`);
    cy.wait(2000);

    openAllWorkspaces();
    findAndArchiveWorkspace(workspace1);
    handleArchiveWorkspaceModal();
    openAllWorkspaces();
    cy.get(instanceWorkspaceSelectors.tabArchived).click();
    cy.get(instanceWorkspaceSelectors.workspaceTableRow, {
      timeout: 10000,
    }).should("contain.text", workspace1);
    cy.get(instanceWorkspaceSelectors.tabActive).click();
    verifyDefaultWorkspaceTooltip();

    // Currently archived workspace login url is faling need to run after bug fixes

    loginAsUser("dev@tooljet.io", "password", workspace1);

    cy.get(commonSelectors.toastMessage).should(
      "contain.text",
      "This workspace has been archived. Contact superadmin to know more."
    );
  });

  it.only("should allow login to active workspace when another is archived and restrict access to archived workspace app", () => {
    const workspace1 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
    const workspace2 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
    const userName = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
    const userEmail = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");
    const appName = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
    const appName2 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");

    // STEP 1: Setup first workspace and onboard user
    setupWorkspaceWithApp(workspace1, appName);
    cy.apiFullUserOnboarding(
      userName,
      userEmail,
      "end-user",
      "password",
      workspace1
    );

    // STEP 2: Setup second workspace and invite user
    cy.apiLogin();
    setupWorkspaceWithApp(workspace2, appName2);
    cy.apiUserInvite(userName, userEmail);
    visitWorkspaceInvitation(userEmail, workspace2);

    // STEP 3: Archive first workspace
    cy.apiLogin();
    cy.visit(workspace2);
    openAllWorkspaces();
    findAndArchiveWorkspace(workspace1);

    cy.get(commonSelectors.toastMessage).should(
      "contain.text",
      `${workspace1} \n was successfully archived`
    );

    // STEP 4: Login as user — should work only for active workspace
    cy.apiLogout();
    cy.visit(`/${workspace2}`);
    cy.clearAndType(onboardingSelectors.loginEmailInput, userEmail);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(onboardingSelectors.signInButton).click();

    cy.get(commonSelectors.mainWrapper, { timeout: 10000 }).should(
      "be.visible"
    );
    cy.url().should("include", `/${workspace2}`);

    // STEP 5: Access public app from archived workspace → should be blocked
    cy.visit(`/applications/${appName}`);

    cy.get(workspaceSelector.switchWsModalTitle).verifyVisibleElement(
      "have.text",
      instanceWorkspaceText.archivedWorkspaceTitle
    );

    cy.get(workspaceSelector.switchWsModalMessage).verifyVisibleElement(
      "have.text",
      instanceWorkspaceText.archivedWorkspaceMessage
    );

    // STEP 6: Unarchive first workspace and verify access restored
    cy.visitTheWorkspace(DEFAULT_WORKSPACE);
    cy.apiLogin();
    cy.reload();
    openAllWorkspaces();
    findAndUnarchiveWorkspace(workspace1);

    cy.get(commonSelectors.toastMessage).should(
      "contain.text",
      toastUnarchived(workspace1)
    );

    cy.visit(workspace1);
    cy.apiLogin();
    cy.visit(`/applications/${appName}`);
  });

  it("should change default workspace, archive previous default, and restore it back as default", () => {
    const newDefault = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");

    // STEP 1: Create new workspace
    cy.apiCreateWorkspace(newDefault, newDefault);
    cy.apiLogin();
    cy.visit("/");
    openAllWorkspaces();

    // STEP 2: Change default workspace
    cy.get(instanceWorkspaceSelectors.selectControl).click();
    cy.get(instanceWorkspaceSelectors.selectMenu)
      .contains(instanceWorkspaceSelectors.selectOption, newDefault)
      .scrollIntoView()
      .click();
    cy.get(confirmButton).should("be.visible").click();

    // Verify default workspace switched
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
      .contains(newDefault)
      .parent()
      .within(() => {
        cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should(
          "be.visible"
        );
      });

    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
      .contains(DEFAULT_WORKSPACE)
      .parent()
      .within(() => {
        cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should(
          "not.exist"
        );
      });

    // STEP 3: Archive previous default workspace
    cy.get(instanceWorkspaceSelectors.searchBar)
      .clear()
      .type(DEFAULT_WORKSPACE);
    cy.get(instanceWorkspaceSelectors.statusChangeButton).click({
      force: true,
    });
    cy.get(confirmButton).should("be.visible").click();

    // STEP 4: Unarchive it and restore as default again
    findAndUnarchiveWorkspace(DEFAULT_WORKSPACE);

    cy.get(instanceWorkspaceSelectors.tabActive).click();
    cy.get(instanceWorkspaceSelectors.searchBar).clear();

    cy.get(instanceWorkspaceSelectors.selectControl).click();
    cy.get(instanceWorkspaceSelectors.selectMenu)
      .contains(instanceWorkspaceSelectors.selectOption, DEFAULT_WORKSPACE)
      .scrollIntoView()
      .click();

    cy.get(confirmButton).should("be.visible").click();

    // STEP 5: Validate restored default workspace
    cy.get(instanceWorkspaceSelectors.workspaceRowContainer)
      .contains(DEFAULT_WORKSPACE)
      .parent()
      .within(() => {
        cy.get(instanceWorkspaceSelectors.defaultWorkspaceTag).should(
          "be.visible"
        );
      });
  });
});
