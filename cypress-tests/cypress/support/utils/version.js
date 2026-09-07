// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// version.js
//   navigateToCreateNewVersionModal  appVersion.openCreateModal → apps
//   navigateToEditVersionModal       appVersion.openEditModal → apps
//   verifyElementsOfCreateNewVersionModal appVersion.verifyCreateModal → apps
//   editVersionAndVerify             appVersion.edit      → apps
//   deleteVersionAndVerify           appVersion.delete    → apps
//   verifyDuplicateVersion           appVersion.verifyDuplicate → apps
//   releasedVersionAndVerify         appVersion.release   → apps
//   verifyVersionAfterPreview        appVersion.verifyAfterPreview → apps
//   switchVersionAndVerify           appVersion.switch    → apps
//   openPreviewSettings              app.openPreviewSettings → apps
//   createDraftVersion               appVersion.createDraft → apps
//   openVersionSwitcher              appVersion.openSwitcher → apps
//   openCreateDraftVersionModal      appVersion.openCreateDraftModal → apps
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { versionModalSelector } from "Selectors/platform/eeCommon";
import { appVersionSelectors } from "Selectors/platform/exportImport";
import {
  confirmVersionModalSelectors,
  editVersionSelectors,
  versionSwitcherSelectors,
} from "Selectors/platform/version";
import { closeModal } from "Support/utils/common";
import { appPromote } from "Support/utils/platform/multiEnv";
import { commonText } from "Texts/common";
import { appVersionText } from "Texts/platform/exportImport";
import { deleteVersionText, releasedVersionText } from "Texts/platform/version";

/**
 * @tjType   appVersion.openCreateModal
 * @tjBlock  apps
 * @tjUsage  navigateToCreateNewVersionModal('v1')
 * @tjDom    version switcher -> create version
 */
export const navigateToCreateNewVersionModal = (value) => {
  cy.get(versionSwitcherSelectors.versionName).click();
  cy.contains(appVersionText.createNewVersion).first().should("be.visible");
  cy.contains(appVersionText.createNewVersion).first().click();
};

/**
 * @tjType   appVersion.openEditModal
 * @tjBlock  apps
 * @tjUsage  navigateToEditVersionModal('v1')
 * @tjDom    version switcher -> edit version
 */
export const navigateToEditVersionModal = (value) => {
  cy.get(appVersionSelectors.currentVersionField(value))
    .should("be.visible")
    .click();
  cy.get('[style="padding: 8px 12px;"] .row')
    .should("be.visible")
    .within(() => {
      cy.get(".icon").trigger("mouseover").click();
    });
};

/**
 * @tjType   appVersion.verifyCreateModal
 * @tjBlock  apps
 * @tjUsage  verifyElementsOfCreateNewVersionModal([])
 * @tjDom    create-version modal contents
 */
export const verifyElementsOfCreateNewVersionModal = (version = []) => {
  cy.get(appVersionSelectors.createNewVersion).verifyVisibleElement(
    "have.text",
    appVersionText.createNewVersion
  );
  cy.get(appVersionSelectors.versionNamelabel).verifyVisibleElement(
    "have.text",
    appVersionText.versionNameLabel
  );
  cy.get(appVersionSelectors.createVersionFromLabel).verifyVisibleElement(
    "have.text",
    appVersionText.createVersionFromLabel
  );
  cy.get(appVersionSelectors.versionNameInputField).should("be.visible");
  cy.get(appVersionSelectors.createVersionInputField).verifyVisibleElement(
    "have.text",
    version[0]
  );
  cy.get(commonSelectors.buttonSelector(appVersionText.createNewVersion))
    .first()
    .verifyVisibleElement("have.text", appVersionText.createNewVersion);
  cy.get(commonSelectors.buttonSelector(commonText.cancelButton))
    .should("be.visible")
    .and("have.text", commonText.cancelButton);
  cy.get(commonSelectors.buttonSelector(commonText.closeButton))
    .should("be.visible")
    .click();
};

/**
 * @tjType   appVersion.edit
 * @tjBlock  apps
 * @tjUsage  editVersionAndVerify(...)
 * @tjDom    rename a version and assert
 */
export const editVersionAndVerify = (
  currentVersion,
  newVersion = [],
  toastMessageText
) => {
  cy.get(appVersionSelectors.currentVersionField(currentVersion)).then(
    ($ele) => {
      if ($ele.hasClass("color-light-green")) {
        cy.contains(releasedVersionText.releasedModalText).should("be.visible");
        closeModal(commonText.closeButton);
      }
    }
  );
  cy.wait(500);
  navigateToEditVersionModal(currentVersion);
  cy.waitForElement(editVersionSelectors.versionNameInputField);
  cy.get(editVersionSelectors.versionNameInputField).verifyVisibleElement(
    "have.value",
    currentVersion
  );

  cy.clearAndType(editVersionSelectors.versionNameInputField, newVersion[0]);
  cy.get(editVersionSelectors.saveButton).click();
  cy.wait(1000);
  cy.verifyToastMessage(commonSelectors.toastMessage, toastMessageText);
};

/**
 * @tjType   appVersion.delete
 * @tjBlock  apps
 * @tjUsage  deleteVersionAndVerify('v2')
 * @tjDom    delete a version and assert
 */
export const deleteVersionAndVerify = (value) => {
  cy.get(appVersionSelectors.currentVersionField(value))
    .should("be.visible")
    .click();
  cy.contains(`[id*="react-select-"]`, value)
    .should("be.visible")
    .within(() => {
      cy.get(" .app-version-list-item")
        .trigger("mouseover")
        .trigger("mouseenter")
        .find(".app-version-delete")
        .click({ force: true });
    });

  cy.get(commonSelectors.modalMessage).verifyVisibleElement(
    "have.text",
    deleteVersionText.deleteModalText(value)
  );
  cy.get(confirmVersionModalSelectors.yesButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    deleteVersionText.deleteToastMessage(value),
    false
  );
};

/**
 * @tjType   appVersion.verifyDuplicate
 * @tjBlock  apps
 * @tjUsage  verifyDuplicateVersion([], 'v1')
 * @tjDom    duplicate-name validation
 */
export const verifyDuplicateVersion = (newVersion = [], version) => {
  cy.contains(appVersionText.createNewVersion).should("be.visible").click();
  cy.get(appVersionSelectors.createVersionInputField).click();
  cy.contains(`[id*="react-select-"]`, version).click();
  cy.clearAndType(appVersionSelectors.versionNameInputField, newVersion[0]);
  cy.get(appVersionSelectors.createNewVersionButton).first().click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    appVersionText.versionNameAlreadyExists
    // "Already exists!"
  );
};

/**
 * @tjType   appVersion.release
 * @tjBlock  apps
 * @tjUsage  releasedVersionAndVerify('v1')
 * @tjDom    release a version and assert the badge
 */
export const releasedVersionAndVerify = (currentVersion) => {
  cy.ifEnv("Enterprise", () => {
    appPromote("development", "production");
  });
  cy.contains("Release").click();

  cy.get(confirmVersionModalSelectors.yesButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    releasedVersionText.releasedToastMessage(currentVersion)
  );
  cy.forceClickOnCanvas();
  cy.get(".released-version-popup-cover").verifyVisibleElement(
    "have.text",
    releasedVersionText.releasedAppText
  );
};

/**
 * @tjType   appVersion.verifyAfterPreview
 * @tjBlock  apps
 * @tjUsage  verifyVersionAfterPreview('v1')
 * @tjDom    version persists through preview. [UNREFERENCED 2026-09-06]
 */
export const verifyVersionAfterPreview = (currentVersion) => {
  cy.get(appVersionSelectors.currentVersionField(currentVersion)).should(
    "be.visible"
  );
  cy.get(commonWidgetSelector.previewButton)
    .invoke("removeAttr", "target")
    .click();
  cy.url().should("include", "/home");
  cy.wait(2000);
  cy.get('[data-cy^="draggable-widget-table"]').should("be.visible");
  cy.url().should("include", `version=${currentVersion}`);
  // cy.get('[data-cy="viewer-page-logo"]').click();
  cy.go("back");
  cy.wait(8000);
};

/**
 * @tjType   appVersion.switch
 * @tjBlock  apps
 * @tjUsage  switchVersionAndVerify('v1', 'v2')
 * @tjDom    version switcher -> pick -> assert
 */
export const switchVersionAndVerify = (currentVersion, newVersion) => {
  cy.waitForElement(versionSwitcherSelectors.versionName);
  cy.get(versionSwitcherSelectors.versionName).should("be.visible").click();
  cy.get(versionModalSelector.versionName(newVersion)).click();
  cy.wait(1000);
  //Note: add assertion to verify version switched
  //cy.wait('@appDs')
};

/**
 * @tjType   app.openPreviewSettings
 * @tjBlock  apps
 * @tjUsage  openPreviewSettings()
 * @tjDom    preview settings panel
 */
export const openPreviewSettings = () => {
  cy.get(commonSelectors.previewSettings).should("be.visible").click();
  cy.wait(1000);
  // Note: add alias wait for version and env load
};

/**
 * @tjType   appVersion.createDraft
 * @tjBlock  apps
 * @tjUsage  createDraftVersion('v2-draft', 'v1')
 * @tjDom    create a draft from an existing version
 */
export const createDraftVersion = (versionName, fromVersion) => {
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

/**
 * @tjType   appVersion.openSwitcher
 * @tjBlock  apps
 * @tjUsage  openVersionSwitcher()
 * @tjDom    editor header -> version switcher
 */
export const openVersionSwitcher = () => {
  cy.get(versionSwitcherSelectors.versionName)
    .eq(0)
    .should("be.visible")
    .click();
  cy.wait(300);
};
/**
 * @tjType   appVersion.openCreateDraftModal
 * @tjBlock  apps
 * @tjUsage  openCreateDraftVersionModal()
 * @tjDom    version switcher -> create draft
 */
export const openCreateDraftVersionModal = () => {
  cy.get('[data-cy="create-draft-version-button"]').should("be.visible").click();
  cy.wait(300);
};