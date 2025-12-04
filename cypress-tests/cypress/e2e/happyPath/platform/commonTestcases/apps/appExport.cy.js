import { fake } from "Fixtures/fake";

import { commonSelectors } from "Selectors/common";
import {
  importSelectors,
  exportAppModalSelectors,
} from "Selectors/exportImport";
import { commonText } from "Texts/common";
import { exportAppModalText } from "Texts/exportImport";

import {
  clickOnExportButtonAndVerify,
  exportAllVersionsAndVerify,
  verifyElementsOfExportModal,
  validateExportedAppStructure,
} from "Support/utils/exportImport";
import {
  selectAppCardOption,
  closeModal,
  deleteDownloadsFolder,
} from "Support/utils/common";

describe("App Export", () => {
  const TEST_DATA = {
    appFiles: {
      multiVersion: "cypress/fixtures/templates/three-versions.json",
      singleVersion: "cypress/fixtures/templates/one_version.json",
    },
  };

  const generateTestData = () => ({
    workspaceName: fake.firstName,
    workspaceSlug: fake.firstName.toLowerCase().replace(/\s+/g, "-"),
    appName: `${fake.companyName}-IE-App`,
    appReName: `${fake.companyName}-${fake.companyName}-IE-App`,
    dsName: fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", ""),
  });

  let data;

  beforeEach(() => {
    data = generateTestData();

    deleteDownloadsFolder();
    cy.exec("mkdir -p ./cypress/downloads/");

    cy.apiLogin();
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
  });

  it("should verify elements of export dialog box", () => {
    cy.intercept("POST", "**/api/v2/resources/import").as("importApp");
    cy.intercept("POST", "**/api/v2/resources/export").as("exportApp");
    cy.intercept("GET", "/api/license/organizations/limits").as("getOrgLimits");

    cy.skipWalkthrough();

    cy.apiLogin();
    cy.visit(`${data.workspaceSlug}`);
    cy.get(importSelectors.importOptionInput, { timeout: 20000 })
      .eq(0)
      .selectFile(TEST_DATA.appFiles.multiVersion, { force: true });
    cy.clearAndType(commonSelectors.appNameInput, data.appName);
    cy.get(importSelectors.importAppButton).click();
    cy.wait("@importApp");
    cy.backToApps();

    cy.wait("@getOrgLimits");
    cy.wait(500);

    selectAppCardOption(
      data.appName,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );

    verifyElementsOfExportModal("v3", ["v2", "v1"], [true, false, false]);

    closeModal(exportAppModalText.modalCloseButton);

    cy.get(
      commonSelectors.modalTitle(exportAppModalText.selectVersionTitle)
    ).should("not.exist");

    selectAppCardOption(
      data.appName,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );
    clickOnExportButtonAndVerify(exportAppModalText.exportAll, data.appName);

    cy.exec("ls ./cypress/downloads/").then((result) => {
      const downloadedAppExportFileName = result.stdout.split("\n")[0];
      const filePath = `./cypress/downloads/${downloadedAppExportFileName}`;

      expect(downloadedAppExportFileName).to.contain(
        data.appName.toLowerCase()
      );

      cy.readFile(filePath).then((appData) => {
        validateExportedAppStructure(appData, data.appName, {
          expectedVersions: ["v1", "v2", "v3"],
        });
      });
    });

    deleteDownloadsFolder();

    selectAppCardOption(
      data.appName,
      commonSelectors.appCardOptions(commonText.exportAppOption)
    );
    cy.get(exportAppModalSelectors.versionRadioButton("v3")).check();
    cy.get(
      commonSelectors.buttonSelector(exportAppModalText.exportSelectedVersion)
    ).click();

    cy.exec("ls ./cypress/downloads/").then((result) => {
      const downloadedAppExportFileName = result.stdout.split("\n")[0];
      const filePath = `./cypress/downloads/${downloadedAppExportFileName}`;

      expect(downloadedAppExportFileName).to.contain(
        data.appName.toLowerCase()
      );

      cy.readFile(filePath).then((appData) => {
        validateExportedAppStructure(appData, data.appName, {
          validateVersions: false,
        });
      });
    });
  });

  it("should verify export app functionality inside app editor", () => {
    cy.intercept("POST", "**/api/v2/resources/export").as("exportApp");

    data.appName2 = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName2);
    cy.openApp(data.appName2);

    cy.dragAndDropWidget("Text Input", 200, 200);

    cy.get(commonSelectors.leftSideBarSettingsButton).click();
    cy.get(commonSelectors.buttonSelector("Export app")).click();

    verifyElementsOfExportModal("v1");

    exportAllVersionsAndVerify(data.appName2, "v1");
  });
});
