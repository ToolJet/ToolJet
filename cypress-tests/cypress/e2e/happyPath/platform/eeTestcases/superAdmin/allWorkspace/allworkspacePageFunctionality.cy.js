import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { onboardingSelectors } from "Selectors/onboarding";
import { visitWorkspaceInvitation } from "Support/utils/onboarding";
import { commonEeSelectors, workspaceSelector } from "Selectors/eeCommon";
import { instanceWorkspaceSelectors } from "Selectors/instanceWorkspaceSelectors";
import { instanceWorkspaceText } from "Texts/instanceWorkspaceText";
import {
  openAllWorkspaces,
  findAndArchiveWorkspace,
  handleArchiveWorkspaceModal,
  loginAsUser,
  setupWorkspaceWithApp,
  changeDefaultWorkspace,
  verifyDefaultWorkspaceTag,
  searchWorkspace,
  clearWorkspaceSearch,
  findAndUnarchiveWorkspace,
  verifyDefaultWorkspaceTooltip,
} from "Support/utils/platform/allWorkspace";

describe("Instance settings - All workspaces management", () => {
  const defaultWorkspace = "My workspace";
  const toastUnarchived = (name) => `${name} \n was successfully unarchived`;

  beforeEach(() => {
    cy.apiLogin();
    cy.visitTheWorkspace(defaultWorkspace);
  });

  // Need to run after bug fixes
  it.skip("should archive current workspace, show workspace switcher modal when archiving current workspace, and verify login restriction for archived workspace", () => {
    const workspace1 = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
    cy.apiCreateWorkspace(workspace1, workspace1);
    cy.visit(`/${workspace1}`);
    cy.get(commonSelectors.mainWrapper, { timeout: 10000 }).should("be.visible");

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

  it("should allow login to active workspace when another is archived and restrict access to archived workspace app", () => {
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
    cy.visitTheWorkspace(defaultWorkspace);
    cy.apiLogin();
    cy.visit("/");
    openAllWorkspaces();
    findAndArchiveWorkspace(workspace1);

    cy.get(commonSelectors.toastMessage).should(
      "contain.text",
      `${workspace1} \n was successfully archived`
    );

    // STEP 4: Login as user — should allow user to login to active workspace
    cy.apiLogout();
    cy.visit(`/${workspace2}`);
    cy.clearAndType(onboardingSelectors.loginEmailInput, userEmail);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
    cy.get(onboardingSelectors.signInButton).click();

    cy.get(commonSelectors.mainWrapper, { timeout: 10000 }).should(
      "be.visible"
    );
    cy.url().should("include", `/${workspace2}`);

    // STEP 5: Verify access for public app from archived workspace
    cy.visit(`/applications/${appName}`);

    cy.get(workspaceSelector.switchWsModalTitle).verifyVisibleElement(
      "have.text",
      instanceWorkspaceText.archivedWorkspaceTitle
    );

    cy.get(workspaceSelector.switchWsModalMessage).verifyVisibleElement(
      "have.text",
      instanceWorkspaceText.archivedWorkspaceMessage
    );

    // STEP 6: Unarchive first workspace and verify login and app access
    cy.visitTheWorkspace(defaultWorkspace);
    cy.apiLogin();
    cy.visit("/");
    openAllWorkspaces();
    findAndUnarchiveWorkspace(workspace1);

    cy.get(commonSelectors.toastMessage).should(
      "contain.text",
      toastUnarchived(workspace1)
    );

    cy.visit(`/${workspace1}`);
    cy.apiLogin();
    cy.visit(`/applications/${appName}`);
  });

  it("should change default workspace to a new one, archive previous default, then restore and set it back as default", () => {
    const newDefault = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
    cy.apiCreateWorkspace(newDefault, newDefault);
    cy.apiLogin();
    cy.visit("/");

    openAllWorkspaces();
    changeDefaultWorkspace(newDefault);

    verifyDefaultWorkspaceTag(newDefault, true);
    verifyDefaultWorkspaceTag(defaultWorkspace, false);

    searchWorkspace(defaultWorkspace);
    cy.get(instanceWorkspaceSelectors.statusChangeButton).click({
      force: true,
    });
    cy.get(commonEeSelectors.confirmButton).should("be.visible").click();

    findAndUnarchiveWorkspace(defaultWorkspace);

    cy.get(instanceWorkspaceSelectors.tabActive).click();
    clearWorkspaceSearch();
    changeDefaultWorkspace(defaultWorkspace);

    verifyDefaultWorkspaceTag(defaultWorkspace, true);
  });
});
