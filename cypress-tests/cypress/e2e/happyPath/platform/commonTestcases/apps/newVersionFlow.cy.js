import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { commonEeSelectors, versionModalSelector } from "Selectors/eeCommon";
import { versionSwitcherSelectors } from "Selectors/version";

describe("New Version Creation Flow", () => {
  const generateTestData = () => ({
    appName: `${fake.companyName}-New-Version-Flow`,
    firstVersionDescription: "First Version",
    secondVersionDescription: "Second Version",
    thirdVersionDescription: "Third Version",
  });

  let data;

  beforeEach(() => {
    data = generateTestData();
    cy.defaultWorkspaceLogin();
    cy.apiDeleteAllApps();
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.viewport(1400, 1400);
  });
  // Test Cases

  it("should verify complete draft and save version lifecycle", () => {
    // Step 1: Verify initial draft state (v1 as draft)
    cy.get('[data-cy="query-manager-toggle-button"]').click();

    openVersionSwitcher();
    cy.get(versionModalSelector.versionName("v1")).should("be.visible");
    cy.get(versionModalSelector.draftTag("v1"))
      .should("be.visible")
      .and("have.text", "Draft");
    cy.get(versionModalSelector.saveVersionButton("v1")).should("be.visible");

    // Step 2: Open save version modal and verify all modal content
    openSaveVersionModal("v1");
    verifySaveVersionModal("v1");
    cy.get(versionModalSelector.createVersionModal.cancelButton).click();

    // Step 3: Save v1 with description
    openVersionSwitcher();
    saveVersionWithDescription("v1", data.firstVersionDescription);
    cy.verifyToastMessage(".go3958317564", "Version Created successfully");

    // Step 4: Verify v1 saved state (no draft tag, has promote button, description visible)
    openVersionSwitcher();
    verifySavedVersionState("v1", data.firstVersionDescription);

    // Step 5: Open create draft modal and verify all modal content
    openCreateDraftVersionModal();
    verifyCreateDraftVersionModal(["v1"]);
    cy.get(
      versionModalSelector.createDraftVersionModal.createDraftVersionFromInput
    ).should("contain.text", "v1");
    cy.get(versionModalSelector.createDraftVersionModal.cancelButton).click();

    // Step 6: Create v2 draft from v1
    openVersionSwitcher();
    createDraftVersion("v2", "v1");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version Created");

    // Step 7: Verify v2 draft state
    openVersionSwitcher();
    cy.get(versionModalSelector.versionName("v2")).should("be.visible");
    verifyDraftVersionState("v2");

    // Step 8: Save v2 with description
    saveVersionWithDescription("v2", data.secondVersionDescription);

    // Step 9: Verify v2 saved state
    openVersionSwitcher();
    verifySavedVersionState("v2", data.secondVersionDescription);

    // Step 10: Verify both v1 and v2 available in "create from" dropdown
    openCreateDraftVersionModal();
    cy.get(
      versionModalSelector.createDraftVersionModal.createDraftVersionFromInput
    ).click();
    cy.contains(`[id*="react-select-"]`, "v1").should("be.visible");
    cy.contains(`[id*="react-select-"]`, "v2").should("be.visible");
    cy.get(versionModalSelector.createDraftVersionModal.cancelButton).click();

    // Step 11: Create v3 draft from v2
    openVersionSwitcher();
    createDraftVersion("v3", "v2");
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version Created");

    // Step 12: Verify v3 draft state and all versions exist
    openVersionSwitcher();
    cy.get(versionModalSelector.versionOptionsButton("v3")).click();
    cy.get(versionModalSelector.deleteVersionButton("v3")).click();
    cy.get('[data-cy="yes-button"]').click();

    openVersionSwitcher();

    cy.get(versionModalSelector.versionName("v1")).should("be.visible");
    cy.get(versionModalSelector.versionName("v2")).should("be.visible");
    cy.get(versionModalSelector.versionName("v3")).should("not.exist");


  });

  it("should validate version name requirements and constraints", () => {
    // Validate empty version name when saving
    openVersionSwitcher();
    openSaveVersionModal("v1");
    cy.get(versionModalSelector.versionNameInput).clear();
    cy.get(versionModalSelector.createVersionModal.saveButton).click();
    cy.verifyToastMessage(
      '.go3958317564',
      "Version name should not be empty"
    );
    cy.get('[data-cy="save-version-title"]').should("be.visible");
    cy.get(commonEeSelectors.modalCloseButton).click();

    // Save v1 first for subsequent tests
    openVersionSwitcher();
    saveVersionWithDescription("v1", data.firstVersionDescription);

    // Validate duplicate version names
    openVersionSwitcher();
    createDraftVersion("v2", "v1");

    openVersionSwitcher();
    openCreateDraftVersionModal();
    cy.get(
      versionModalSelector.createDraftVersionModal.createDraftVersionFromInput
    ).click();
    cy.contains(`[id*="react-select-"]`, "v1").click();
    cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
    cy.verifyToastMessage(
      '.go3958317564',
      "Version name already exists."
    );
    cy.get('[data-cy="create-draft-version-title"]').should("be.visible");
    cy.get(commonEeSelectors.modalCloseButton).click();

    // Verify can create draft after saving the existing draft
    openVersionSwitcher();
    saveVersionWithDescription("v2", data.secondVersionDescription);

    openVersionSwitcher();
    cy.get('[data-cy="create-draft-version-button"]').should("be.visible");
  });

});

// Helper Methods
const openVersionSwitcher = () => {
  cy.get(versionSwitcherSelectors.versionName)
    .eq(0)
    .should("be.visible")
    .click();
  cy.wait(300);
};

const verifySaveVersionModal = (expectedVersionName) => {
  cy.get('[data-cy="save-version-title"]').verifyVisibleElement(
    "have.text",
    "Save version"
  );

  cy.get(versionModalSelector.versionNameLabel).verifyVisibleElement(
    "have.text",
    "Version name"
  );

  cy.get(versionModalSelector.versionNameInput).verifyVisibleElement(
    "have.value",
    expectedVersionName
  );

  cy.get(versionModalSelector.versionNameHelperText).verifyVisibleElement(
    "have.text",
    "Version name must be unique and max 25 characters"
  );

  cy.get(versionModalSelector.versionDescriptionLabel).verifyVisibleElement(
    "have.text",
    "Version description"
  );

  cy.get(
    versionModalSelector.createVersionModal.versionDescriptionInput
  ).verifyVisibleElement("be.visible");

  cy.get(
    versionModalSelector.versionDescriptionHelperText
  ).verifyVisibleElement("have.text", "Description must be max 500 characters");

  cy.get(
    versionModalSelector.createVersionModal.createVersionHelperText
  ).verifyVisibleElement(
    "contain.text",
    "Saving the version will lock it. To make any edits afterwards, you'll need to create a draft version."
  );

  cy.get(versionModalSelector.createVersionModal.cancelButton).should(
    "be.visible"
  );

  cy.get(versionModalSelector.createVersionModal.saveButton).should(
    "be.visible"
  );
};

const openSaveVersionModal = (versionName) => {
  cy.get(versionModalSelector.saveVersionButton(versionName))
    .should("be.visible")
    .click();
  cy.wait(300);
};

const saveVersionWithDescription = (versionName, description) => {
  openSaveVersionModal(versionName);

  cy.get(versionModalSelector.versionNameInput).should(
    "have.value",
    versionName
  );

  if (description) {
    cy.get(
      versionModalSelector.createVersionModal.versionDescriptionInput
    ).type(description);
  }

  cy.get(versionModalSelector.createVersionModal.saveButton).click();
};

const verifyCreateDraftVersionModal = (availableVersions = []) => {
  cy.get('[data-cy="create-draft-version-title"]').verifyVisibleElement(
    "have.text",
    "Create draft version"
  );

  cy.get(versionModalSelector.versionNameLabel).verifyVisibleElement(
    "have.text",
    "Version name"
  );

  cy.get(versionModalSelector.versionNameInput).verifyVisibleElement(
    "be.visible"
  );

  cy.get(versionModalSelector.versionNameHelperText).verifyVisibleElement(
    "have.text",
    "Version name must be unique and max 25 characters"
  );

  cy.get(
    versionModalSelector.createDraftVersionModal.createDraftVersionFromLabel
  ).verifyVisibleElement("have.text", "Create from version");

  cy.get(
    versionModalSelector.createDraftVersionModal.createDraftVersionFromInput
  ).should("be.visible");

  cy.get(
    versionModalSelector.createDraftVersionModal.createDraftVersionHelperText
  ).verifyVisibleElement(
    "have.text",
    'Draft version can only be created from saved versions. '
  );

  cy.get(versionModalSelector.createDraftVersionModal.cancelButton).should(
    "be.visible"
  );

  cy.get(versionModalSelector.createDraftVersionModal.createButton).should(
    "be.visible"
  );
};

const openCreateDraftVersionModal = () => {
  cy.get('[data-cy="create-draft-version-button"]').should("be.visible").click();
  cy.wait(300);
};

const createDraftVersion = (versionName, fromVersion) => {
  openCreateDraftVersionModal();
  cy.wait(500);

  cy.get(
    versionModalSelector.createDraftVersionModal.createDraftVersionFromInput
  ).click();
  cy.waitForElement(`[id*="react-select-"]`);
  cy.contains(`[id*="react-select-"]`, fromVersion).click();

  cy.waitForElement(versionModalSelector.versionNameInput);
  cy.get(versionModalSelector.versionNameInput).clear().type(versionName);

  cy.get(versionModalSelector.createDraftVersionModal.createButton).click();
};

const verifyDraftVersionState = (versionName) => {
  cy.get(versionModalSelector.draftTag(versionName))
    .should("be.visible")
    .and("have.text", "Draft");

  cy.get(versionModalSelector.saveVersionButton(versionName)).should(
    "be.visible"
  );
};

const verifySavedVersionState = (versionName, description = null) => {
  cy.get(versionModalSelector.versionName(versionName)).should("be.visible");

  cy.get(versionModalSelector.draftTag(versionName)).should("not.exist");

  cy.get(versionModalSelector.saveVersionButton(versionName)).should(
    "not.exist"
  );

  cy.get(commonEeSelectors.promoteVersionButton).should("be.visible");

  cy.get('[data-cy="create-draft-version-button"]').should("be.visible");

  if (description) {
    cy.contains(description).should("be.visible");
  }
};

const verifyTooltipOnCreateDraftButton = () => {
  cy.get('[data-cy="create-draft-version-button"]')
    .should("be.visible")
    .trigger("mouseover");

  cy.wait(300);

  cy.get("body").then(($body) => {
    if ($body.find('[role="tooltip"]').length > 0) {
      cy.get('[role="tooltip"]')
        .should("be.visible")
        .and(
          "contain.text",
          "Draft version can only be created from saved versions."
        );
    }
  });
};
