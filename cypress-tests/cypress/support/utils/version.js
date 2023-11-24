import { appVersionText } from "Texts/exportImport";
import { appVersionSelectors } from "Selectors/exportImport";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonText } from "Texts/common";
import { verifyModal, closeModal } from "Support/utils/common";
import {
  confirmVersionModalSelectors,
  editVersionSelectors,
} from "Selectors/version";
import {
  deleteVersionText,
  editVersionText,
  releasedVersionText,
} from "Texts/version";
import { verifyComponent } from "Support/utils/basicComponents";

export const navigateToCreateNewVersionModal = (value) => {
  cy.get(appVersionSelectors.currentVersionField(value))
    .should("be.visible")
    .click();
  cy.contains(appVersionText.createNewVersion).should("be.visible");
  cy.contains(appVersionText.createNewVersion).click();
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
  cy.get(
    commonSelectors.buttonSelector(appVersionText.createNewVersion)
  ).verifyVisibleElement("have.text", appVersionText.createNewVersion);
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
  cy.reload();
  cy.get(appVersionSelectors.currentVersionField(currentVersion)).then(
    ($ele) => {
      if ($ele.hasClass("color-light-green")) {
        cy.contains(releasedVersionText.releasedModalText).should("be.visible");
        closeModal(commonText.closeButton);
      }
    }
  );
  navigateToEditVersionModal(currentVersion);
  cy.get(editVersionSelectors.versionNameInputField).verifyVisibleElement(
    "have.value",
    currentVersion
  );

  cy.clearAndType(editVersionSelectors.versionNameInputField, newVersion[0]);
  cy.get(editVersionSelectors.saveButton).click();
  cy.wait(500);
  cy.verifyToastMessage(commonSelectors.toastMessage, toastMessageText);
};
export const deleteVersionAndVerify = (value, toastMessageText) => {
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
  cy.get(confirmVersionModalSelectors.modalMessage).verifyVisibleElement(
    "have.text",
    deleteVersionText.deleteModalText(value)
  );
  cy.get(confirmVersionModalSelectors.yesButton).click();
  cy.verifyToastMessage(commonSelectors.toastMessage, toastMessageText, false);
};

export const verifyDuplicateVersion = (newVersion = [], version) => {
  cy.contains(appVersionText.createNewVersion).should("be.visible").click();
  verifyModal(
    appVersionText.createNewVersion,
    appVersionText.createNewVersion,
    appVersionSelectors.createVersionInputField
  );
  cy.get(appVersionSelectors.createVersionInputField).click();
  cy.contains(`[id*="react-select-"]`, version).click();
  cy.get(appVersionSelectors.versionNameInputField).click().type(newVersion[0]);
  cy.get(appVersionSelectors.createNewVersionButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    appVersionText.versionNameAlreadyExists
  );
};
export const releasedVersionAndVerify = (currentVersion) => {
  cy.get(commonSelectors.releaseButton).click();
  cy.get('[data-cy="confirm-dialogue-box-text"]').verifyVisibleElement(
    "have.text",
    releasedVersionText.releasedVersionConfirmText
  );
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
  verifyComponent("button1");
  cy.contains(currentVersion);
};
