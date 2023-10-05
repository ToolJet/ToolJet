import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonEeText, ssoEeText } from "Texts/eeCommon";
import { commonEeSelectors } from "Selectors/eeCommon";
import { verifyPromoteModalUI } from "Support/utils/eeCommon";
import { dataSourceSelector } from "Selectors/dataSource";
import { multiEnvSelector } from "Selectors/eeCommon";
import {
  logout,
  navigateToAppEditor,
  navigateToManageGroups,
  pinInspector,
  verifyTooltip,
  createGroup,
} from "Support/utils/common";
import {
  closeDSModal,
  deleteDatasource,
  addQuery,
  addQueryN,
  verifyValueOnInspector,
  selectDatasource
} from "Support/utils/dataSource";

import { buttonText } from "Texts/button";
import {
  verifyAndModifyParameter,
  editAndVerifyWidgetName,
} from "Support/utils/commonWidget";
import { verifypreview } from "Support/utils/dataSource";

import {
  selectQueryFromLandingPage,
  query,
  addInputOnQueryField,
} from "Support/utils/queries";

describe("Multi env", () => {
  const data = {};
  data.appName = `${fake.companyName} App`;
  data.ds = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");
  data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
  const slug = data.appName.toLowerCase().replace(/\s+/g, "-");


  beforeEach(() => {
    cy.appUILogin();
    cy.viewport(1200, 1300);
    cy.createApp();
    cy.renameApp(data.appName);
    cy.dragAndDropWidget("Text", 350, 350);
  });
  it("Verify the datasource configuration and data on each env", () => {
    cy.apiLogin();
    cy.apiCreateGDS(
      "http://localhost:3000/api/v2/data_sources",
      data.ds,
      "restapi",
      [
        { key: "url", value: "" },
        { key: "auth_type", value: "none" },
        { key: "grant_type", value: "authorization_code" },
        { key: "add_token_to", value: "header" },
        { key: "header_prefix", value: "Bearer " },
        { key: "access_token_url", value: "" },
        { key: "client_ide", value: "" },
        { key: "client_secret", value: "", encrypted: true },
        { key: "scopes", value: "read, write" },
        { key: "username", value: "", encrypted: false },
        { key: "password", value: "", encrypted: true },
        { key: "bearer_token", value: "", encrypted: true },
        { key: "auth_url", value: "" },
        { key: "client_auth", value: "header" },
        { key: "headers", value: [["", ""]] },
        { key: "custom_query_params", value: [["", ""]], encrypted: false },
        { key: "custom_auth_params", value: [["", ""]] },
        {
          key: "access_token_custom_headers",
          value: [["", ""]],
          encrypted: false,
        },
        { key: "multiple_auth_enabled", value: false, encrypted: false },
        { key: "ssl_certificate", value: "none", encrypted: false },
      ]
    );
    cy.visit("/");
    cy.get(commonSelectors.globalDataSourceIcon).click();
    selectDatasource(data.ds);
    cy.get('[data-cy="development-label"]').click()
    cy.clearAndType('[data-cy="base-url-text-field"]', "https://reqres.in/api/users?page=1")
    cy.get(dataSourceSelector.buttonSave).click()
    cy.get(commonSelectors.dashboardIcon).click();

    navigateToAppEditor(data.appName);
    cy.get(`[data-cy="${data.ds}-add-query-card"] > .text-truncate`).click();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    cy.get(".custom-toggle-switch>.switch>").eq(3).click();
    cy.waitForAutoSave();

    cy.dragAndDropWidget("Text", 550, 650);
    editAndVerifyWidgetName(data.constName);
    cy.waitForAutoSave();

    verifyAndModifyParameter("Text", `{{queries.restapi1.data.data[0].email`);
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    cy.get(
      commonWidgetSelector.draggableWidget(data.constName)
    ).verifyVisibleElement("have.text", "george.bluth@reqres.in");

    pinInspector();
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(data.constName)).click();
    cy.get('[data-cy="inspector-node-text"] > .mx-2').verifyVisibleElement(
      "have.text",
      `"george.bluth@reqres.in"`
    );
    cy.get('[style="height: 13px; width: 13px;"] > img').should("exist");
    cy.get('[data-cy="inspector-node-globals"] > .node-key').click();
    cy.get('[data-cy="inspector-node-environment"] > .node-key').click();
    cy.get('[data-cy="inspector-node-name"] > .mx-2').verifyVisibleElement(
      "have.text",
      `"development"`
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(4000);

    cy.get(
      commonWidgetSelector.draggableWidget(data.constName)
    ).verifyVisibleElement("have.text", "george.bluth@reqres.in");

    cy.go('back');
    cy.waitForAppLoad();
    cy.wait(3000);
    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();
    cy.waitForAppLoad();
    cy.wait(3000);

    cy.get(dataSourceSelector.queryCreateAndRunButton, { timeout: 20000 }).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query could not be completed")

    cy.get(commonSelectors.editorPageLogo).click();
    cy.get(commonSelectors.globalDataSourceIcon).click();
    selectDatasource(data.ds);
    cy.get('[data-cy="staging-label"]').click()
    cy.clearAndType('[data-cy="base-url-text-field"]', "https://reqres.in/api/users?page=2")
    cy.get(dataSourceSelector.buttonSave).click()

    cy.get(commonSelectors.dashboardIcon).click();
    navigateToAppEditor(data.appName);
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    cy.get(
      commonWidgetSelector.draggableWidget(data.constName)
    ).verifyVisibleElement("have.text", "michael.lawson@reqres.in");

    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(data.constName)).click();
    cy.get('[data-cy="inspector-node-text"] > .mx-2').verifyVisibleElement(
      "have.text",
      `"michael.lawson@reqres.in"`
    );
    cy.get('[style="height: 13px; width: 13px;"] > img').should("not.exist");
    cy.get('[data-cy="inspector-node-globals"] > .node-key').click();
    cy.get('[data-cy="inspector-node-environment"] > .node-key').click();
    cy.get('[data-cy="inspector-node-name"] > .mx-2').verifyVisibleElement(
      "have.text",
      `"staging"`
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(4000);

    cy.get(
      commonWidgetSelector.draggableWidget(data.constName)
    ).verifyVisibleElement("have.text", "michael.lawson@reqres.in");

    // cy.get('[data-cy="viewer-page-logo"]').click();
    // navigateToAppEditor(data.appName);
    cy.go('back');
    cy.waitForAppLoad();
    cy.wait(3000);
    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();
    cy.waitForAppLoad();
    cy.wait(3000);

    cy.get(dataSourceSelector.queryCreateAndRunButton, { timeout: 20000 }).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Query could not be completed")

    cy.get(commonSelectors.editorPageLogo).click();
    cy.get(commonSelectors.globalDataSourceIcon).click();
    selectDatasource(data.ds);
    cy.get('[data-cy="production-label"]').click()
    cy.clearAndType('[data-cy="base-url-text-field"]', "https://reqres.in/api/users?page=1")
    cy.get(dataSourceSelector.buttonSave).click()

    cy.get(commonSelectors.dashboardIcon).click();
    navigateToAppEditor(data.appName);
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    cy.get(
      commonWidgetSelector.draggableWidget(data.constName)
    ).verifyVisibleElement("have.text", "george.bluth@reqres.in");

    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(data.constName)).click();
    cy.get('[data-cy="inspector-node-text"] > .mx-2').verifyVisibleElement(
      "have.text",
      `"george.bluth@reqres.in"`
    );
    cy.get('[style="height: 13px; width: 13px;"] > img').should("not.exist");
    cy.get('[data-cy="inspector-node-globals"] > .node-key').click();
    cy.get('[data-cy="inspector-node-environment"] > .node-key').click();
    cy.get('[data-cy="inspector-node-name"] > .mx-2').verifyVisibleElement(
      "have.text",
      `"production"`
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(4000);

    cy.get(
      commonWidgetSelector.draggableWidget(data.constName)
    ).verifyVisibleElement("have.text", "george.bluth@reqres.in");

    cy.go('back');
    cy.waitForAppLoad();
    cy.wait(3000);
    cy.get(commonSelectors.releaseButton).click();
    cy.get(commonSelectors.yesButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");
    cy.wait(500);

    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${slug}`);
    cy.get(commonWidgetSelector.modalCloseButton).click();
    cy.get(commonSelectors.editorPageLogo).click();
    cy.wait(500)

    cy.visit(`/applications/${slug}`);
    cy.get(
      commonWidgetSelector.draggableWidget(data.constName)
    ).verifyVisibleElement("have.text", "george.bluth@reqres.in");

  });

  it("Verify the multi env components UI", () => {
    cy.get(multiEnvSelector.envContainer).should("be.visible");
    cy.get(multiEnvSelector.currentEnvName)
      .verifyVisibleElement("have.text", "Development")
      .click();
    cy.get(multiEnvSelector.envArrow).should("be.visible");
    cy.get(multiEnvSelector.selectedEnvName).verifyVisibleElement(
      "have.text",
      " Development"
    );
    cy.get(multiEnvSelector.envNameList)
      .eq(0)
      .verifyVisibleElement("have.text", "Development");
    cy.get(multiEnvSelector.envNameList)
      .eq(1)
      .verifyVisibleElement("have.text", "Staging");
    cy.get(multiEnvSelector.envNameList)
      .eq(2)
      .verifyVisibleElement("have.text", "Production");

    verifyTooltip(
      '[data-cy="env-name-list"]:eq(1)',
      "There are no versions in this environment"
    );
    verifyTooltip(
      '[data-cy="env-name-list"]:eq(2)',
      "There are no versions in this environment"
    );

    cy.get(multiEnvSelector.appVersionLabel).should("be.visible");
    cy.get('[data-cy="v1-current-version-text"]')
      .verifyVisibleElement("have.text", "v1")
      .click();
    cy.get(multiEnvSelector.currentVersion).verifyVisibleElement(
      "have.text",
      "v1"
    );
    cy.get(".col-10 > .app-version-name").verifyVisibleElement(
      "have.text",
      "v1"
    );
    cy.get(multiEnvSelector.createNewVersionButton).verifyVisibleElement(
      "have.text",
      "Create new version"
    );

    verifyPromoteModalUI("v1", "Development", "Staging");
    cy.get('[data-cy="env-change-info-text"]').verifyVisibleElement(
      "have.text",
      "You won’t be able to edit this version after promotion. Are you sure you want to continue?"
    );
    cy.get(commonSelectors.closeButton).click();
    cy.get(multiEnvSelector.currentEnvName).verifyVisibleElement(
      "have.text",
      "Development"
    );

    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonSelectors.cancelButton).click();
    cy.get(multiEnvSelector.currentEnvName).verifyVisibleElement(
      "have.text",
      "Development"
    );

    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();

    cy.waitForAppLoad();
    cy.wait(3000);

    cy.get(commonSelectors.warningText).verifyVisibleElement(
      "have.text",
      "App cannot be edited after promotion. Please create a new version from Development to make any changes."
    );
    cy.get(multiEnvSelector.envContainer).should("be.visible");
    cy.get(multiEnvSelector.currentEnvName)
      .verifyVisibleElement("have.text", "Staging")
      .click();
    cy.get(multiEnvSelector.envArrow).should("be.visible");
    cy.get(multiEnvSelector.currentEnvName).verifyVisibleElement(
      "have.text",
      "Staging"
    );
    cy.get(multiEnvSelector.envNameList)
      .eq(0)
      .verifyVisibleElement("have.text", "Development");
    cy.get(multiEnvSelector.envNameList)
      .eq(1)
      .verifyVisibleElement("have.text", "Staging");
    cy.get(multiEnvSelector.envNameList)
      .eq(2)
      .verifyVisibleElement("have.text", "Production");
    verifyTooltip(
      '[data-cy="env-name-list"]:eq(2)',
      "There are no versions in this environment"
    );

    cy.get(multiEnvSelector.appVersionLabel).should("be.visible");
    cy.get('[data-cy="v1-current-version-text"]')
      .verifyVisibleElement("have.text", "v1")
      .click();
    cy.get(multiEnvSelector.currentVersion).verifyVisibleElement(
      "have.text",
      "v1"
    );
    cy.get(".col-10 > .app-version-name").verifyVisibleElement(
      "have.text",
      "v1"
    );
    cy.get(multiEnvSelector.createNewVersionButton).verifyVisibleElement(
      "have.text",
      "Create new version"
    );

    verifyTooltip(multiEnvSelector.createNewVersionButton, "New versions can only be created in development")
    cy.get(".datasource-picker").should("have.class", "disabled");
    cy.get(commonEeSelectors.AddQueryButton).should("be.disabled");
    cy.get(".components-container").should("have.class", "disabled");

    verifyPromoteModalUI("v1", "Staging", "Production");
    cy.get(commonSelectors.closeButton).click();
    cy.get(multiEnvSelector.currentEnvName).verifyVisibleElement(
      "have.text",
      "Staging"
    );

    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonSelectors.cancelButton).click();
    cy.get(multiEnvSelector.currentEnvName).verifyVisibleElement(
      "have.text",
      "Staging"
    );

    cy.get(commonEeSelectors.promoteButton).click();
    cy.get(commonEeSelectors.promoteButton).eq(1).click();
    cy.waitForAppLoad();
    cy.wait(3000);

    cy.get(commonSelectors.warningText).verifyVisibleElement(
      "have.text",
      "App cannot be edited after promotion. Please create a new version from Development to make any changes."
    );
    cy.get(multiEnvSelector.envContainer).should("be.visible");
    cy.get(multiEnvSelector.currentEnvName)
      .verifyVisibleElement("have.text", "Production")
      .click();
    cy.get(multiEnvSelector.envArrow).should("be.visible");
    cy.get(multiEnvSelector.currentEnvName).verifyVisibleElement(
      "have.text",
      "Production"
    );
    cy.get(multiEnvSelector.envNameList)
      .eq(0)
      .verifyVisibleElement("have.text", "Development");
    cy.get(multiEnvSelector.envNameList)
      .eq(1)
      .verifyVisibleElement("have.text", "Staging");
    cy.get(multiEnvSelector.envNameList)
      .eq(2)
      .verifyVisibleElement("have.text", "Production");

    cy.get(multiEnvSelector.appVersionLabel).should("be.visible");
    cy.get('[data-cy="v1-current-version-text"]')
      .verifyVisibleElement("have.text", "v1")
      .click();
    cy.get(multiEnvSelector.currentVersion).verifyVisibleElement(
      "have.text",
      "v1"
    );
    cy.get(".col-10 > .app-version-name").verifyVisibleElement(
      "have.text",
      "v1"
    );
    cy.get(multiEnvSelector.createNewVersionButton).verifyVisibleElement(
      "have.text",
      "Create new version"
    );

    cy.get(commonSelectors.releaseButton)
      .verifyVisibleElement("have.text", "Release")
      .click();
    cy.get('[data-cy="modal-title"]').verifyVisibleElement(
      "have.text",
      "Release Version"
    );
    cy.get(commonSelectors.closeButton).should("be.visible");
    cy.get('[data-cy="confirm-dialogue-box-text"]').verifyVisibleElement(
      "have.text",
      "Are you sure you want to release this version?"
    );
    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get(commonSelectors.yesButton).verifyVisibleElement("have.text", "Yes");

    cy.get(commonSelectors.closeButton).click();
    cy.get(multiEnvSelector.currentEnvName).verifyVisibleElement(
      "have.text",
      "Production"
    );

    cy.get(commonSelectors.releaseButton).click();
    cy.get(commonSelectors.cancelButton).click();
    cy.get(multiEnvSelector.currentEnvName).verifyVisibleElement(
      "have.text",
      "Production"
    );

    cy.get(commonSelectors.releaseButton).click();
    cy.get(commonSelectors.yesButton).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Version v1 released");
    cy.wait(500);
    cy.get(commonSelectors.warningText).verifyVisibleElement(
      "have.text",
      "This version of the app is released. Please create a new version in development to make any changes."
    );
    cy.get('[data-cy="v1-current-version-text"]').click()
    verifyTooltip(multiEnvSelector.createNewVersionButton, "New versions can only be created in development")
    cy.get(".datasource-picker").should("have.class", "disabled");
    cy.get(commonEeSelectors.AddQueryButton).should("be.disabled");
    cy.get(".components-container").should("have.class", "disabled");
    cy.get(commonSelectors.releaseButton).should("be.disabled");
  });



});
