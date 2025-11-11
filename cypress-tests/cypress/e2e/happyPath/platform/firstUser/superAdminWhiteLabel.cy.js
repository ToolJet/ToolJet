import {
  openWhiteLabelingSettings,
  verifyWhiteLabelingUI,
  fillWhiteLabelingForm,
  saveWhiteLabelingChanges,
  verifyWhiteLabelInputs,
  verifyLogoOnLoginPage,
} from "Support/utils/SuperAdminWhiteLabel";

describe("Instance Settings - Super Admin UI", () => {

beforeEach(() => {
  cy.defaultWorkspaceLogin();
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
});
