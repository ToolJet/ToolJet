import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonText } from "Texts/common";

import {
  editVersionAndVerify,
  deleteVersionAndVerify,
  releasedVersionAndVerify,
  verifyDuplicateVersion,
  verifyVersionAfterPreview,
} from "Support/utils/version";

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
  verifyComponentinrightpannel,
  deleteComponentAndVerify,
} from "Support/utils/basicComponents";

import { logout, releaseApp } from "Support/utils/common";

import {
  releasedVersionText,
  deleteVersionText,
  onlydeleteVersionText,
} from "Texts/version";

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

    verifyComponentinrightpannel("table");
    cy.dragAndDropWidget("table");
    cy.wait(2000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });

    navigateToCreateNewVersionModal((currentVersion = "v1"));
    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));

    cy.wait(4000);
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

    verifyComponentinrightpannel("text");
    navigateToCreateNewVersionModal((currentVersion = "v1"));

    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
    verifyComponentinrightpannel("table");

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

  it("Verify all functionality for the app version", () => {
    data.appName = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName);

    cy.openApp();

    deleteVersionAndVerify(
      "v1",
      onlydeleteVersionText.deleteToastMessage("v1")
    );
    cy.wait(5000);
    cy.get('[data-cy="widget-list-box-table"]').should("be.visible");

    navigateToCreateNewVersionModal((currentVersion = "v1"));
    cy.get('[data-cy="create-new-version-button"]').click();
    cy.get(commonSelectors.toastMessage).verifyVisibleElement(
      "have.text",
      "Version name should not be empty"
    );

    cy.get('[data-cy="modal-close-button"]').click();
    verifyComponentinrightpannel("text");
    navigateToCreateNewVersionModal((currentVersion = "v1"));

    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));
    verifyComponentinrightpannel("table");

    cy.dragAndDropWidget("table");
    cy.wait(1000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });
    cy.wait(2000);

    deleteComponentAndVerify("table1");
    cy.dragAndDropWidget("table");
    cy.wait(1000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });
    cy.wait(2000);
    navigateToCreateNewVersionModal((currentVersion = "v2"));

    createNewVersion((newVersion = ["v3"]), (versionFrom = "v2"));
    verifyComponentinrightpannel("table");

    navigateToCreateNewVersionModal((currentVersion = "v3"));
    createNewVersion((newVersion = ["v4"]), (versionFrom = "v1"));

    verifyComponentinrightpannel("table");

    editVersionAndVerify(
      (currentVersion = "v4"),
      (newVersion = ["v5"]),
      editVersionText.VersionNameUpdatedToastMessage
    );

    navigateToCreateNewVersionModal((currentVersion = "v5"));
    verifyDuplicateVersion((newVersion = ["v5"]), (versionFrom = "v5"));

    closeModal(commonText.closeButton);

    deleteVersionAndVerify(
      (currentVersion = "v5"),
      deleteVersionText.deleteToastMessage((currentVersion = "v5"))
    );

    releasedVersionAndVerify((currentVersion = "v3"));
    navigateToCreateNewVersionModal((currentVersion = "v3"));

    createNewVersion((newVersion = ["v6"]), (versionFrom = "v3"));

    verifyVersionAfterPreview((currentVersion = "v6"));
  });

  it("Verify all functionality for the app release", () => {
    data.appName = `${fake.companyName}-App`;
    cy.apiCreateApp(data.appName);

    cy.openApp();

    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    cy.get(commonSelectors.appNameInput).verifyVisibleElement(
      "have.value",
      data.appName
    );
    cy.waitForAutoSave();

    verifyComponentinrightpannel("table");
    cy.dragAndDropWidget("table");
    cy.wait(100);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });

    releaseApp();
    cy.get('[data-cy="delete-button"]').should("not.exist");
    cy.get('[data-cy="warning-text"]').should(
      "contain",
      "App cannot be edited after promotion. Please create a new version from Development to make any changes."
    );

    navigateToCreateNewVersionModal((currentVersion = "v1"));
    createNewVersion((newVersion = ["v2"]), (versionFrom = "v1"));

    verifyComponentinrightpannel("table");
    cy.dragAndDropWidget("table");
    cy.wait(1000);
    cy.get('[data-cy="inspector-close-icon"]').click({ force: true });
    cy.get('[data-cy="button-release"]').click();
    cy.get('[data-cy="yes-button"]').click();
    cy.get('[data-cy="warning-text"]').should(
      "contain",
      "App cannot be edited after promotion. Please create a new version from Development to make any changes."
    );
  });
});
