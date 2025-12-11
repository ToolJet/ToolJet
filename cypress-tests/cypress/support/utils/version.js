import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { versionModalSelector } from "Selectors/eeCommon";
import { appVersionSelectors } from "Selectors/exportImport";
import {
  confirmVersionModalSelectors,
  editVersionSelectors,
  versionSwitcherSelectors,
} from "Selectors/version";
import { closeModal } from "Support/utils/common";
import { appPromote } from "Support/utils/platform/multiEnv";
import { commonText } from "Texts/common";
import { appVersionText } from "Texts/exportImport";
import { deleteVersionText, releasedVersionText } from "Texts/version";

export const navigateToCreateNewVersionModal = (value) => {
  cy.get(versionSwitcherSelectors.versionName).click();
  cy.contains(appVersionText.createNewVersion).first().should("be.visible");
  cy.contains(appVersionText.createNewVersion).first().click();
};

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

export const switchVersionAndVerify = (currentVersion, newVersion) => {
  cy.waitForElement(versionSwitcherSelectors.versionName);
  cy.get(versionSwitcherSelectors.versionName).should("be.visible").click();
  cy.get(versionModalSelector.versionName(newVersion)).click();
  cy.wait(1000);
  //Note: add assertion to verify version switched
  //cy.wait('@appDs')
};

export const openPreviewSettings = () => {
  cy.get(commonSelectors.previewSettings).should("be.visible").click();
  cy.wait(1000);
  // Note: add alias wait for version and env load
};
