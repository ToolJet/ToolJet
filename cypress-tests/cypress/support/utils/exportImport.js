import { exportAppModalSelectors } from "Selectors/exportImport";
import { exportAppModalText } from "Texts/exportImport";
import { commonSelectors } from "Selectors/common";

export const verifyElementsOfExportModal = (versionName) => {
  cy.get(
    commonSelectors.modalTitle(exportAppModalText.selectVersionTitle)
  ).verifyVisibleElement("have.text", exportAppModalText.selectVersionTitle);
  cy.get(exportAppModalSelectors.currentVersionLabel).verifyVisibleElement(
    "have.text",
    exportAppModalText.currentVersionLabel
  );
  cy.get(
    exportAppModalSelectors.currentVersionText(versionName)
  ).verifyVisibleElement("have.text", versionName);
  cy.get(exportAppModalSelectors.noOtherVersionText).verifyVisibleElement(
    "have.text",
    exportAppModalText.noOtherVersionText
  );
  cy.get('[data-cy="export-all-button"]').verifyVisibleElement(
    "have.text",
    exportAppModalText.exportAll
  );
  cy.get('[data-cy="export-selected-version-button"]').verifyVisibleElement(
    "have.text",
    exportAppModalText.exportSelectedVersion
  );
};
