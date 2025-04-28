import { fake } from "Fixtures/fake";
import { postgreSqlSelector } from "Selectors/postgreSql";
import { postgreSqlText } from "Texts/postgreSql";
import { twilioText } from "Texts/twilio";
import { twilioSelectors } from "Selectors/Plugins";
import { commonSelectors } from "Selectors/common";
import { commonText } from "Texts/common";

import {
  fillDataSourceTextField,
  selectAndAddDataSource,
} from "Support/utils/postgreSql";

import {
  deleteDatasource,
  closeDSModal,
  deleteAppandDatasourceAfterExecution,
} from "Support/utils/dataSource";

import { dataSourceSelector } from "../../../../../constants/selectors/dataSource";
import { pluginSelectors } from "Selectors/plugins";

const data = {};
data.dsName = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

describe("Data source Twilio", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("Should verify elements on Twilio connection form", () => {
    const AuthToken = Cypress.env("twilio_auth_token");
    const AccountSID = Cypress.env("twilio_account_SID");
    const MessageSID = Cypress.env("twilio_messaging_service_SID");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    cy.get(postgreSqlSelector.allDatasourceLabelAndCount).should(
      "have.text",
      postgreSqlText.allDataSources()
    );
    cy.get(postgreSqlSelector.commonlyUsedLabelAndCount).should(
      "have.text",
      postgreSqlText.commonlyUsed
    );
    cy.get(postgreSqlSelector.databaseLabelAndCount).should(
      "have.text",
      postgreSqlText.allDatabase()
    );
    cy.get(postgreSqlSelector.apiLabelAndCount).should(
      "have.text",
      postgreSqlText.allApis
    );
    cy.get(postgreSqlSelector.cloudStorageLabelAndCount).should(
      "have.text",
      postgreSqlText.allCloudStorage
    );

    selectAndAddDataSource("databases", twilioText.twilio, data.dsName);

    fillDataSourceTextField(
      twilioText.authTokenLabel,
      twilioText.authTokenPlaceholder,
      AuthToken
    );

    fillDataSourceTextField(
      twilioText.accountSidLabel,
      twilioText.accountSidPlaceholder,
      AccountSID
    );

    fillDataSourceTextField(
      twilioText.messagingSIDLabel,
      twilioText.messagingSIDPalceholder,
      MessageSID
    );

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-twilio`);
  });

  it("Should verify functionality of Twilio connection form", () => {
    const AuthToken = Cypress.env("twilio_auth_token");
    const AccountSID = Cypress.env("twilio_account_SID");
    const MessageSID = Cypress.env("twilio_messaging_service_SID");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    selectAndAddDataSource("databases", twilioText.twilio, data.dsName);

    fillDataSourceTextField(
      twilioText.authTokenLabel,
      twilioText.authTokenPlaceholder,
      AuthToken
    );

    fillDataSourceTextField(
      twilioText.accountSidLabel,
      twilioText.accountSidPlaceholder,
      AccountSID
    );

    fillDataSourceTextField(
      twilioText.messagingSIDLabel,
      twilioText.messagingSIDPalceholder,
      MessageSID
    );

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    deleteDatasource(`cypress-${data.dsName}-twilio`);
  });

  it("Should be able to run the query with a valid connection", () => {
    const AuthToken = Cypress.env("twilio_auth_token");
    const AccountSID = Cypress.env("twilio_account_SID");
    const MessageSID = Cypress.env("twilio_messaging_service_SID");
    const MessageNumber = Cypress.env("twilio_message_number");

    cy.get(commonSelectors.globalDataSourceIcon).click();
    closeDSModal();

    selectAndAddDataSource("databases", twilioText.twilio, data.dsName);

    fillDataSourceTextField(
      twilioText.authTokenLabel,
      twilioText.authTokenPlaceholder,
      AuthToken
    );

    fillDataSourceTextField(
      twilioText.accountSidLabel,
      twilioText.accountSidPlaceholder,
      AccountSID
    );

    fillDataSourceTextField(
      twilioText.messagingSIDLabel,
      twilioText.messagingSIDPalceholder,
      MessageSID
    );

    cy.get(postgreSqlSelector.buttonSave)
      .verifyVisibleElement("have.text", postgreSqlText.buttonTextSave)
      .click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      postgreSqlText.toastDSSaved
    );

    cy.get(commonSelectors.dashboardIcon).click();
    cy.get(commonSelectors.appCreateButton).click();
    cy.get(commonSelectors.appNameInput).click().type(data.dsName);
    cy.get(commonSelectors.createAppButton).click();
    cy.skipWalkthrough();

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get(".css-4e90k9").type(`${data.dsName}`);
    cy.contains(`[id*="react-select-"]`, data.dsName).click();
    cy.get('[data-cy="query-rename-input"]').clear().type(data.dsName);

    cy.get(pluginSelectors.operationDropdown).click().type("Send SMS{enter}");

    cy.get(twilioSelectors.toNumberInputField).clearAndTypeOnCodeMirror(
      MessageNumber
    );
    cy.get(twilioSelectors.bodyInput).clearAndTypeOnCodeMirror(
      twilioText.messageText
    );
    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      `Query (${data.dsName}) completed.`
    );
    deleteAppandDatasourceAfterExecution(
      data.dsName,
      `cypress-${data.dsName}-twilio`
    );
  });
});
