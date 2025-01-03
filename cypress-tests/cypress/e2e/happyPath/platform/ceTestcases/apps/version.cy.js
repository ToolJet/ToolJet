import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { logout, releaseApp } from "Support/utils/common";
import { commonText } from "Texts/common";
import { appVersionSelectors } from "Selectors/exportImport";
import { editVersionSelectors } from "Selectors/version";

import { editVersionText } from "Texts/version";

import { createNewVersion } from "Support/utils/exportImport";

import {
  navigateToCreateNewVersionModal,
  verifyElementsOfCreateNewVersionModal,
  navigateToEditVersionModal,
} from "Support/utils/version";

import {
  verifyModal,
  closeModal,
  navigateToAppEditor,
} from "Support/utils/common";

import {
  verifyComponent,
  deleteComponentAndVerify,
} from "Support/utils/basicComponents";

describe("App Editor", () => {
  const data = {};
  data.appName = `${fake.companyName} App`;
  data.slug = `${fake.companyName.toLowerCase()}-app`;
  const workspaceId = Cypress.env("workspaceId");
  let currentVersion = "";
  let newVersion = [];
  let versionFrom = "";

  beforeEach(() => {
    cy.defaultWorkspaceLogin();
  });

  before(() => {
    cy.apiLogin();
    cy.apiCreateApp(data.appName);
    cy.wait(1000);
    cy.logoutApi();
  });

  it("Verify the elements of the version module", () => {
    data.appName = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName);

    cy.openApp();

    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "have.value",
      data.appName
    );

    cy.waitForAutoSave();
    navigateToCreateNewVersionModal((currentVersion = "v1"));
    verifyElementsOfCreateNewVersionModal((currentVersion = ["v1"]));

    navigateToEditVersionModal((currentVersion = "v1"));
    verifyModal(
      editVersionText.editVersionTitle,
      editVersionText.saveButton,
      editVersionSelectors.versionNameInputField
    );

    closeModal(commonText.closeButton);

    verifyComponent("table");
    cy.dragAndDropWidget("table");
    cy.wait(2000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });

    navigateToCreateNewVersionModal((currentVersion = "v1"));
    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
    cy.wait(2000);
    
    cy.get(commonWidgetSelector.previewButton)
      .invoke("removeAttr", "target")
      .click();

    cy.url().should("include", "/home");
    cy.wait(2000);
    cy.get('span[style="margin-left: 12px; cursor: pointer;"]').click();
    cy.get("div.react-select__indicator").click();
    cy.contains("v1").click();
  });

  it("Verify components and queries in the apps on different versions", () => {
    data.appName = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName);

    cy.openApp();
    cy.get('[data-cy="widget-list-box-table"]').should("be.visible");

    verifyComponent("text");
    navigateToCreateNewVersionModal((currentVersion = "v1"));

    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
    verifyComponent("table");
    cy.dragAndDropWidget("table");
    cy.wait(2000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });
    cy.wait(4000);
    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get('[data-cy="ds-run javascript code"]').click();

    navigateToCreateNewVersionModal((currentVersion = "v2"));
    createNewVersion((newVersion = ["v3"]), (versionFrom = "v2"));

    cy.apiAddQueryToApp(
      "runjs1", 
      { code: 'alert("Text")', parameters: [] }, 
      null,
      "runjs" 
    );
    cy.reload();
    cy.get('[data-cy="query-preview-button"]').click();
   
    cy.get(commonSelectors.toastMessage).verifyVisibleElement(
      "have.text",
      "Query (runjs1) completed."
    );
   cy.reload();
    navigateToCreateNewVersionModal((currentVersion = "v3"));
    createNewVersion((newVersion = ["v4"]), (versionFrom = "v3"));
    cy.wait(2000);

    cy.get('[data-cy="query-preview-button"]').click();
    cy.get(commonSelectors.toastMessage).verifyVisibleElement(
      "have.text",
      "Query (runjs1) completed."
    );
  });

});
