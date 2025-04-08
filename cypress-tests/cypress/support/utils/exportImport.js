import {
  appVersionSelectors,
  exportAppModalSelectors,
  importSelectors,
} from "Selectors/exportImport";
import { exportAppModalText, appVersionText } from "Texts/exportImport";
import { commonSelectors } from "Selectors/common";
import { verifyModal, commonWidgetSelector } from "Support/utils/common";
import { importText } from "Texts/exportImport";

export const verifyElementsOfExportModal = (
  currentVersionName,
  otherVersionName = []
) => {
  cy.get(
    commonSelectors.modalTitle(exportAppModalText.selectVersionTitle)
  ).verifyVisibleElement("have.text", exportAppModalText.selectVersionTitle);
  cy.get(exportAppModalSelectors.currentVersionLabel).verifyVisibleElement(
    "have.text",
    exportAppModalText.currentVersionLabel
  );
  cy.get(
    exportAppModalSelectors.versionText(currentVersionName)
  ).verifyVisibleElement("have.text", currentVersionName);
  cy.get(exportAppModalSelectors.otherVersionSection).then(($ele) => {
    if ($ele.text().includes(exportAppModalText.noOtherVersionText)) {
      cy.get(exportAppModalSelectors.noOtherVersionText).verifyVisibleElement(
        "have.text",
        exportAppModalText.noOtherVersionText
      );
    } else {
      cy.get('[data-cy="other-version-label"]').verifyVisibleElement(
        "have.text",
        "Other Versions"
      );
      otherVersionName.forEach((elements) => {
        cy.get(exportAppModalSelectors.versionText(elements))
          .verifyVisibleElement("have.text", elements);
        cy.get(
          exportAppModalSelectors.versionRadioButton(elements)
        ).verifyVisibleElement("not.be.checked");
        cy.get(exportAppModalSelectors.versionCreatedTime(elements)).should("be.visible");

      });
    }
  });
  cy.get(
    commonSelectors.buttonSelector(exportAppModalText.exportAll)
  ).verifyVisibleElement("have.text", exportAppModalText.exportAll);
  cy.get(
    commonSelectors.buttonSelector(exportAppModalText.exportSelectedVersion)
  ).verifyVisibleElement("have.text", exportAppModalText.exportSelectedVersion);
  cy.get(exportAppModalSelectors.modalCloseButton).should("be.visible");
  cy.get('input[type="checkbox"]')
    .parent()
    .contains("Export ToolJet table schema")
    .should("be.visible");
};

export const createNewVersion = (newVersion = [], version) => {
  cy.contains(appVersionText.createNewVersion).should("be.visible").click();
  verifyModal(
    appVersionText.createNewVersion,
    appVersionText.createNewVersion,
    appVersionSelectors.createVersionInputField
  );
  cy.get(appVersionSelectors.createNewVersionButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    appVersionText.emptyToastMessage
  );
  cy.get(appVersionSelectors.createVersionInputField).click();
  cy.contains(`[id*="react-select-"]`, version).click();
  cy.get(appVersionSelectors.versionNameInputField).click().type(newVersion[0]);
  cy.get(appVersionSelectors.createNewVersionButton).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    appVersionText.createdToastMessage
  );
  cy.get(appVersionSelectors.currentVersionField(newVersion[0])).should(
    "be.visible"
  );
};

export const clickOnExportButtonAndVerify = (buttonText, appName) => {
  cy.get(commonSelectors.buttonSelector(buttonText)).click();
  cy.wait(1000);
  cy.exec("ls ./cypress/downloads/").then((result) => {
    const downloadedAppExportFileName = result.stdout.split("\n")[0];
    expect(downloadedAppExportFileName).to.contain.string(
      appName.toLowerCase()
    );
  });
};

export const exportAllVersionsAndVerify = (
  appName,
  currentVersionName,
  otherVersionName = [],
  isChecked = []
) => {
  cy.get(exportAppModalSelectors.currentVersionSection).should("be.visible");
  cy.get(
    exportAppModalSelectors.versionRadioButton(currentVersionName)
  ).verifyVisibleElement("be.checked");
  cy.get(exportAppModalSelectors.otherVersionSection).then(($ele) => {
    if ($ele.text().includes(exportAppModalText.noOtherVersionText)) {
      cy.get(exportAppModalSelectors.noOtherVersionText).verifyVisibleElement(
        "have.text",
        exportAppModalText.noOtherVersionText
      );
    } else {
      otherVersionName.forEach((elements) => {
        cy.get(exportAppModalSelectors.versionText(elements)).verifyVisibleElement("have.text", elements);
        cy.get(
          exportAppModalSelectors.versionRadioButton(elements)
        ).should("be.visible").and(isChecked ? "be.checked" : "not.be.checked");
      });
    }
    clickOnExportButtonAndVerify(exportAppModalText.exportAll, appName);
  });
};

export const importAndVerifyApp = (filePath, expectedToast) => {
  cy.get(importSelectors.importOptionInput)
    .eq(0)
    .selectFile(filePath, { force: true });
  cy.wait(2000);

  if (expectedToast) {
    cy.verifyToastMessage(commonSelectors.toastMessage, expectedToast);
  } else {
    cy.get(importSelectors.importAppButton).click();
    cy.get(".go3958317564")
      .should("be.visible")
      .and("have.text", importText.appImportedToastMessage);
  }
};

