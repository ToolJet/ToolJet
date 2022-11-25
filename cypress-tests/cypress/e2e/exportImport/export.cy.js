import { commonSelectors } from "Selectors/common";
import { appVersionSelectors } from "Selectors/exportImport";
import { verifyElementsOfExportModal } from "Support/utils/exportImport";
import { fake } from "Fixtures/fake";

describe("Exportand Import Functionality", () => {
  var data = {};
  data.appName1 = `${fake.companyName}-App`;
  data.version = "";

  beforeEach(() => {
    cy.appUILogin();
  });

  it("Verify the elements of export dialog box", () => {
    cy.createApp(data.appName1);
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    cy.get(appVersionSelectors.currentVersionField("v1"))
      .should("be.visible")
      .invoke("text")
      .then((versionText) => {
        cy.log(versionText);
        data.version = versionText;
        cy.log(data.version);
        cy.clearAndType(commonSelectors.appNameInput, data.appName1);
        cy.get(commonSelectors.appNameInput).verifyVisibleElement(
          "have.value",
          data.appName1
        );
        cy.waitForAutoSave();
        cy.get('[data-cy="editor-page-logo"]').click();

        cy.get(commonSelectors.folderPageTitle).should("be.visible");
        cy.get(
          `${commonSelectors.appCard(
            data.appName1
          )} [data-cy="app-card-menu-icon"]`
        )
          .should("be.visible")
          .click();
        cy.get('[data-cy="export-app-card-option"]')
          .should("be.visible")
          .click();
        verifyElementsOfExportModal(data.version);
      });
  });
});
