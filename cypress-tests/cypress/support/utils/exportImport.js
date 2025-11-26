import { commonSelectors } from "Selectors/common";
import {
  appVersionSelectors,
  exportAppModalSelectors,
  importSelectors,
} from "Selectors/exportImport";
import { verifyModal } from "Support/utils/common";
import {
  appVersionText,
  exportAppModalText,
  importText,
} from "Texts/exportImport";

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
        cy.get(
          exportAppModalSelectors.versionText(elements)
        ).verifyVisibleElement("have.text", elements);
        cy.get(
          exportAppModalSelectors.versionRadioButton(elements)
        ).verifyVisibleElement("not.be.checked");
        cy.get(exportAppModalSelectors.versionCreatedTime(elements)).should(
          "be.visible"
        );
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
  cy.waitForElement(appVersionSelectors.currentVersionField(newVersion[0]));
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
        cy.get(
          exportAppModalSelectors.versionText(elements)
        ).verifyVisibleElement("have.text", elements);
        cy.get(exportAppModalSelectors.versionRadioButton(elements))
          .should("be.visible")
          .and(isChecked ? "be.checked" : "not.be.checked");
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

export const verifyImportModalElements = (expectedAppName) => {
  cy.get(importSelectors.importAppTitle).verifyVisibleElement(
    "have.text",
    "Import app"
  );
  cy.get(commonSelectors.appNameLabel).verifyVisibleElement(
    "have.text",
    "App name"
  );
  cy.get(commonSelectors.appNameInput)
    .should("be.visible")
    .and("have.value", expectedAppName);
  cy.get(commonSelectors.appNameInfoLabel).verifyVisibleElement(
    "have.text",
    "App name must be unique and max 50 characters"
  );
  cy.get(commonSelectors.cancelButton)
    .should("be.visible")
    .and("have.text", "Cancel");
  cy.get(commonSelectors.importAppButton).verifyVisibleElement(
    "have.text",
    "Import app"
  );
};

export const setupDataSourceWithConstants = (
  dsEnv,
  password = Cypress.env("pg_password")
) => {
  cy.apiUpdateDataSource("postgresql", dsEnv, {
    options: [
      {
        key: "password",
        value: password,
        encrypted: true,
      },
    ],
  });
};

export const validateExportedAppStructure = (
  appData,
  expectedAppName,
  options = {}
) => {
  const {
    validateComponents = true,
    validateQueries = true,
    validateVersions = true,
    validateTooljetDB = true,
    expectedVersions = ["v1", "v2", "v3"],
  } = options;

  // Validate the app name
  const appNameFromFile = appData.app[0].definition.appV2.name;
  expect(appNameFromFile).to.equal(expectedAppName);

  // Validate the schema for the student table in tooljetdb
  if (validateTooljetDB) {
    const tooljetDatabase = appData.tooljet_database.find(
      (db) => db.table_name === "student"
    );
    expect(tooljetDatabase).to.exist;
    expect(tooljetDatabase.schema).to.exist;
  }

  // Validate components
  if (validateComponents) {
    const components = appData.app[0].definition.appV2.components;

    const text2Component = components.find(
      (component) => component.name === "text2"
    );
    expect(text2Component).to.exist;
    expect(text2Component.properties.text.value).to.equal(
      "{{constants.pageHeader}}"
    );

    const textinput1 = components.find(
      (component) => component.name === "textinput1"
    );
    expect(textinput1).to.exist;
    expect(textinput1.properties.value.value).to.include("queries");

    const textinput2 = components.find(
      (component) => component.name === "textinput2"
    );
    expect(textinput2).to.exist;
    expect(textinput2.properties.value.value).to.include("queries");

    const textinput3 = components.find(
      (component) => component.name === "textinput3"
    );
    cy.log(JSON.stringify(appData.app[0].definition.appV2.appVersions));
    expect(textinput3).to.exist;
    expect(textinput3.properties.value.value).to.include("queries");
  }

  // Validate the data queries
  if (validateQueries) {
    const dataQueries = appData.app[0].definition.appV2.dataQueries;

    const postgresqlQuery = dataQueries.find(
      (query) => query.name === "postgresql1"
    );
    expect(postgresqlQuery).to.exist;
    expect(postgresqlQuery.options.query).to.include(
      "Select * from {{secrets.db_name}}"
    );

    const restapiQuery = dataQueries.find((query) => query.name === "restapi1");
    expect(restapiQuery).to.exist;
    expect(restapiQuery.options.url).to.equal(
      "https://jsonplaceholder.typicode.com/users/1"
    );

    const tooljetdbQuery = dataQueries.find(
      (query) => query.name === "tooljetdb1"
    );
    expect(tooljetdbQuery).to.exist;
    expect(tooljetdbQuery.options.operation).to.equal("list_rows");
  }

  // Validate app versions
  if (validateVersions) {
    const appVersions = appData.app[0].definition.appV2.appVersions;
    expect(appVersions).to.exist;

    const versionNames = appVersions.map((version) => version.name);
    expect(versionNames).to.include.members(expectedVersions);
  }
};
