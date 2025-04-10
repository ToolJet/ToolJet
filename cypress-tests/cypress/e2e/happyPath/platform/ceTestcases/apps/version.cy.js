import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { commonText } from "Texts/common";

import {
  editVersionAndVerify,
  deleteVersionAndVerify,
  releasedVersionAndVerify,
  verifyDuplicateVersion,
  verifyVersionAfterPreview,
  navigateToCreateNewVersionModal,
  verifyElementsOfCreateNewVersionModal,
  navigateToEditVersionModal,
  switchVersionAndVerify,
} from "Support/utils/version";

import { appVersionSelectors } from "Selectors/exportImport";
import { editVersionSelectors } from "Selectors/version";
import { editVersionText } from "Texts/version";
import { createNewVersion } from "Support/utils/exportImport";

import { verifyModal, closeModal } from "Support/utils/common";

import {
  verifyComponent,
  verifyComponentinrightpannel,
  deleteComponentAndVerify,
} from "Support/utils/basicComponents";

import { deleteVersionText, onlydeleteVersionText } from "Texts/version";

import { createRestAPIQuery } from "Support/utils/dataSource";
import { deleteQuery } from "Support/utils/queries";

describe("App Version", () => {
  let data;

  let currentVersion = "";
  let newVersion = [];
  let versionFrom = "";

  beforeEach(() => {
    data = {
      appName: `${fake.companyName}-Version-App`,
      datasourceName: fake.firstName.toLowerCase(),
      query1: fake.firstName.toLowerCase(),
      query2: fake.firstName.toLowerCase(),
    };

    cy.defaultWorkspaceLogin();
    cy.apiCreateApp(data.appName);
    cy.openApp();
  });

  it("should verify basic version management operations", () => {
    // Version modal verification
    cy.get(appVersionSelectors.appVersionLabel).should("be.visible");
    navigateToCreateNewVersionModal("v1");
    verifyElementsOfCreateNewVersionModal(["v1"]);

    // Empty version name validation
    navigateToCreateNewVersionModal("v1");
    cy.get('[data-cy="create-new-version-button"]').click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Version name should not be empty"
    );

    cy.wait(2000);

    // Duplicate version name check
    verifyDuplicateVersion(["v1"], "v1");
    closeModal(commonText.closeButton);

    // Version edit modal verification
    navigateToEditVersionModal("v1");
    verifyModal(
      editVersionText.editVersionTitle,
      editVersionText.saveButton,
      editVersionSelectors.versionNameInputField
    );
    closeModal(commonText.closeButton);
    cy.wait(1000);

    // Version editing
    editVersionAndVerify(
      "v1",
      ["v2"],
      editVersionText.VersionNameUpdatedToastMessage
    );

    // Component operations in version
    verifyComponentinrightpannel("table");
    cy.dragAndDropWidget("text");
    cy.waitForAutoSave();

    // New version creation
    navigateToCreateNewVersionModal("v2");
    createNewVersion(["v3"], "v2");
    cy.waitForAutoSave();
    verifyComponentinrightpannel("table");

    // Component deletion
    deleteComponentAndVerify("text1");
    cy.waitForAutoSave();
    cy.wait(2000);

    // Version deletion
    deleteVersionAndVerify(
      "v3",
      onlydeleteVersionText.deleteToastMessage("v3")
    );
    cy.get(appVersionSelectors.currentVersionField("v2")).should("be.visible");
    cy.wait(3000);

    // cy.reload();
    // cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible", { timeout: 10000 });

    // Preview and release verification
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.url().should("include", "/home?version=v2");
    cy.openApp("", Cypress.env("workspaceId"), Cypress.env("appId"), commonWidgetSelector.draggableWidget("text1"));
    releasedVersionAndVerify("v2");
  });

  it.only("should verify version management with components and queries", () => {
    // Initial setup with component and datasource
    cy.apiAddComponentToApp(
      data.appName,
      "text1",
      {},
      "Text",
      `{{queries.${data.query1}.data.name}}`
    );
    cy.waitForAutoSave();

    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/data-sources`,
      data.datasourceName,
      "restapi",
      [{ key: "url", value: "https://jsonplaceholder.typicode.com/users" }]
    );
    createRestAPIQuery(data.query1, data.datasourceName, "", "", "/1", true);

    // Version v2 creation and verification
    navigateToCreateNewVersionModal("v1");
    createNewVersion(["v2"], "v1");
    cy.get(commonWidgetSelector.draggableWidget("text1"))
      .verifyVisibleElement("have.text", "Leanne Graham");
    cy.get(`[data-cy="list-query-${data.query1}"]`).should("be.visible");

    // Modify v2 with new components and queries
    deleteComponentAndVerify("text1");
    cy.waitForAutoSave();
    deleteQuery(data.query1);
    cy.get('[data-cy="modal-confirm-button"]').click();
    createRestAPIQuery(data.query2, data.datasourceName, "", "", "/2", true);
    cy.apiAddComponentToApp(
      data.appName,
      "textinput",
      {},
      "TextInput",
      `{{queries.${data.query2}.data.name}}`
    );
    cy.waitForAutoSave();

    // Version creation and state verification
    const versionChecks = [
      {
        create: { version: "v3", from: "v2" },
        verify: {
          component: { selector: "textInput", value: "Ervin Howell" },
          query: data.query2
        }
      },
      {
        create: { version: "v4", from: "v1" },
        verify: {
          component: { selector: "text1", text: "Leanne Graham" },
          query: data.query1
        }
      },
      {
        create: { version: "v5", from: "v3" },
        verify: {
          component: { selector: "textInput", value: "Ervin Howell" },
          query: data.query2
        }
      }
    ];

    versionChecks.forEach(check => {
      navigateToCreateNewVersionModal(check.create.from);
      createNewVersion([check.create.version], check.create.from);

      if (check.verify.component.value) {
        cy.get(commonWidgetSelector.draggableWidget(check.verify.component.selector))
          .verifyVisibleElement("have.value", check.verify.component.value);
      } else {
        cy.get(commonWidgetSelector.draggableWidget(check.verify.component.selector))
          .verifyVisibleElement("have.text", check.verify.component.text);
      }
      cy.get(`[data-cy="list-query-${check.verify.query}"]`).should("be.visible");
    });

    // Release and version state verification
    releasedVersionAndVerify("v5");
    cy.get(appVersionSelectors.currentVersionField("v5"))
      .should("have.class", "color-light-green");

    // Version switching and component verification
    cy.get(appVersionSelectors.currentVersionField("v5")).click();
    cy.contains(`[id*="react-select-"]`, "v4").click();
    cy.get(appVersionSelectors.currentVersionField("v4"))
      .should("not.have.class", "color-light-green");
    cy.get(commonWidgetSelector.draggableWidget("text1"))
      .verifyVisibleElement("have.text", "Leanne Graham");
    cy.get(`[data-cy="list-query-${data.query1}"]`).should("be.visible");

    // Preview and version switching verification
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.url().should("include", "/home?version=v4");
    cy.get(commonWidgetSelector.draggableWidget("text1"))
      .verifyVisibleElement("have.text", "Leanne Graham");

    cy.get('[data-cy="preview-settings"]').click();
    switchVersionAndVerify("v4", "v5");

    cy.get(commonWidgetSelector.draggableWidget("textInput"))
      .verifyVisibleElement("have.value", "Ervin Howell");
    //url validation should be added after bug fix

    //  cy.url().should("include", "/home?version=v5");

  });
});
