import {
  openWhiteLabelingSettings,
  verifyWhiteLabelingUI,
  fillWhiteLabelingForm,
  saveWhiteLabelingChanges,
  verifyWhiteLabelInputs,
  verifyLogoOnLoginPage,
  openSMTPSettings,
  verifySmtpSettingsUI,
  openAllWorkspaces,
  verifyWorkspacePageHeader,
  verifyWorkspaceTableControls,
  verifyWorkspaceSelectDropdown,
  verifyWorkspaceRow,
  verifyWorkspaceTabs,
  verifyWorkspaceRowTags,
  verifyDefaultWorkspaceTooltip,
  openArchiveWorkspaceModal,
  verifyArchiveWorkspaceModalUI,
  verifyOpenWorkspaceTooltip,
  verifyAllUsersHeaderUI,
  verifyTableControls,
  verifyUsersFilterOptions,
  verifyUserRow,
  verifyUserActionMenu,
  openResetPasswordModal,
  verifyResetPasswordModalUI,
  verifyEditUserModal,
  verifyWorkspacesViewModal,
  verifyArchiveUserModalUI,
} from "Support/utils/superAdminUI";

import {
  instanceWorkspaceSelectors,
} from "Selectors/superAdminUISelectors"; 

import {
  openInstanceSettings,
  openUserActionMenu,
} from "Support/utils/platform/eeCommon";

import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";

describe("Instance Settings - Super Admin UI", () => {

beforeEach(() => {
  cy.defaultWorkspaceLogin();
});

const userName = () => fake.firstName.toLowerCase().replace(/[^a-z]/g, "");
const userEmail = () => fake.email.toLowerCase().replace(/[^a-z0-9@.]/g, "");
const DEFAULT_WORKSPACE = "My workspace";
    
it("should verify all users page UI", () => {
      const user = { name: userName(), email: userEmail() };
      
      cy.apiFullUserOnboarding(user.name, user.email);
      cy.apiLogin();
      openInstanceSettings();
      
      verifyAllUsersHeaderUI();
      verifyTableControls();
      verifyUsersFilterOptions();
      cy.get(commonSelectors.avatarImage).should("be.visible");
      cy.clearAndType(instanceWorkspaceSelectors.userSearchBar, user.email);

      verifyUserRow(user.name, user.email, "workspace", "active");
      openUserActionMenu(user.email);
      verifyUserActionMenu(user.name);
      openResetPasswordModal();
      verifyResetPasswordModalUI(user.email);
      verifyArchiveUserModalUI(user.email);
      verifyEditUserModal(user.name, user.email);
      verifyWorkspacesViewModal(user.name);
});

it("should verify all workspaces page UI", () => {
      const testWorkspace = userName();
      
      cy.apiCreateWorkspace(testWorkspace, testWorkspace);
      cy.apiLogin();

      openAllWorkspaces();
      verifyWorkspacePageHeader();
      verifyWorkspaceTableControls();
      verifyWorkspaceSelectDropdown(testWorkspace);
      verifyWorkspaceRow(DEFAULT_WORKSPACE, true);
      verifyWorkspaceRow(testWorkspace, false);
      verifyWorkspaceTabs();
      verifyWorkspaceRowTags(testWorkspace);
      verifyDefaultWorkspaceTooltip(); 
      openArchiveWorkspaceModal(testWorkspace);
      verifyArchiveWorkspaceModalUI(testWorkspace);
      verifyOpenWorkspaceTooltip(testWorkspace);
});

it("should verify all white labelling UI elements", () => {
      openWhiteLabelingSettings();
      verifyWhiteLabelingUI();
});

it("should update white labelling and verify changes", () => {
      openWhiteLabelingSettings();
      fillWhiteLabelingForm();
      saveWhiteLabelingChanges();
      verifyWhiteLabelInputs();
      verifyLogoOnLoginPage();
});
    
it.only("should verify SMTP settings UI elements", () => {
      openSMTPSettings();
      verifySmtpSettingsUI();
});
});
