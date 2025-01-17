import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import { commonText, commonWidgetText } from "Texts/common";

import { releaseApp, navigateToAppEditor } from "Support/utils/common";
import { manageWorkspaceConstant } from "Support/utils/workspaceConstants";

import * as common from "Support/utils/common";

import {
  appVersionSelectors,
  exportAppModalSelectors,
} from "Selectors/exportImport";

import { createNewVersion } from "Support/utils/exportImport";

import {
  contantsNameValidation,
  addNewconstants,
  existingNameValidation,
} from "Support/utils/workspaceConstants";

import { buttonText } from "Texts/button";
import { editAndVerifyWidgetName } from "Support/utils/commonWidget";

import {
  verifypreview,
  createDataQuery,
  createrestAPIQuery,
} from "Support/utils/dataSource";

import { dataSourceSelector } from "Selectors/dataSource";

import {
  selectQueryFromLandingPage,
  query,
  addInputOnQueryField,
} from "Support/utils/queries";

const data = {};

describe("Workspace constants", () => {
  const envVar = Cypress.env("environment");
  let currentVersion = "";
  let otherVersions = [];
  data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
  data.newConstvalue = `New ${data.constName}`;
  data.constantsName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
  data.constantsValue = "dJ_8Q~BcaMPd";
  data.appName = `${fake.companyName}-App`;
  data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.skipWalkthrough();
  });

  it("Verify workspace constants UI and CRUD operations only", () => {
    data.firstName = fake.firstName;
    data.workspaceName = data.firstName;
    data.workspaceSlug = data.firstName.toLowerCase();
    let workspaceName = data.workspaceName.replaceAll("[^A-Za-z]", "");
    data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.newConstvalue = `New ${data.constName}`;

    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.visit(`${data.workspaceSlug}`);
    cy.wait(2000);

    manageWorkspaceConstant({
      constantType: "Global",
      constName: "ExampleConstant",
      newConstvalue: "UpdatedValue",
    });

    manageWorkspaceConstant({
      constantType: "Secrets",
      constName: "ExampleConstant",
      newConstvalue: "UpdatedValue",
    });
  });

  it("should verify the constants resolving value on components and query", () => {
    cy.viewport(1440, 960);
    cy.defaultWorkspaceLogin();
    data.widgetName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.appName = `${fake.companyName}-App`;
    data.restapilink = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.restapiHeaderKey = fake.firstName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
    data.restapiHeaderValue = fake.firstName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");

    cy.get(commonSelectors.workspaceConstantsIcon).click();
    addNewconstants(data.restapilink, Cypress.env("constants_host"));
    addNewconstants(data.restapiHeaderKey, "customHeader");
    addNewconstants(data.restapiHeaderValue, "key=value");

    cy.apiCreateApp(data.appName);

    cy.wait(1000);
    createDataQuery(
      data.appName,
      data.restapilink,
      data.restapiHeaderKey,
      data.restapiHeaderValue
    );
    cy.openApp();

    cy.waitForAutoSave();
    cy.dragAndDropWidget("Text Input", 550, 650);
    editAndVerifyWidgetName(data.widgetName, []);
    cy.waitForAutoSave();

    cy.get('[data-cy="default-value-input-field"]').clearAndTypeOnCodeMirror(
      `{{queries.restapi1.data.message`
    );
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", "Production environment testing");

    cy.contains("p", "Settings").click();
    cy.get('[data-cy="run-on-app-load-toggle-switch"]').click({ force: true });

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(4000);

    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", "Production environment testing");
  });

  it("should verify the acess of global and secrets constants in app editor and inspector", () => {
    data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.constName1 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.constName2 = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.newConstvalue = `New ${data.constName}`;
    data.constantsName = fake.firstName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
    data.constantsValue = "dJ_8Q~BcaMPd";
    data.appName = `${fake.companyName}-App`;
    data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
    cy.defaultWorkspaceLogin();
    cy.apiCreateApp(data.appName);

    // Create Global constants

    cy.get(commonSelectors.workspaceConstantsIcon).click();
    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.clearAndType(commonSelectors.workspaceConstantNameInput, data.constName);
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantValueInput,
      data.constName
    );
    cy.get(workspaceConstantsSelectors.constantsType("Global")).check();
    cy.get(workspaceConstantsSelectors.addConstantButton).click();

    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantNameInput,
      data.constName2
    );
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantValueInput,
      data.constName2
    );
    cy.get(workspaceConstantsSelectors.constantsType("Global")).check();
    cy.get(workspaceConstantsSelectors.addConstantButton).click();

    // Create Secret constants

    cy.get(commonSelectors.workspaceConstantsIcon).click();
    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantNameInput,
      data.constName1
    );
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantValueInput,
      data.constName1
    );
    cy.get(workspaceConstantsSelectors.constantsType("Secrets")).check();
    cy.get(workspaceConstantsSelectors.addConstantButton).click();

    // // Verify constants in inspector

    cy.openApp();
    cy.get('[data-cy="left-sidebar-inspect-button"]').click();
    cy.wait(1000);
    cy.get('[data-cy="inspector-node-constants"] > .node-key').click();
    cy.get(`[data-cy="inspector-node-${data.constName}"]`).should("be.visible");

    // Verify constants in deleted constants in inspector
    cy.backToApps();
    cy.get(commonSelectors.workspaceConstantsIcon).click();
    cy.get(
      workspaceConstantsSelectors.constDeleteButton(data.constName2)
    ).click();
    cy.get(commonSelectors.yesButton).click();
    cy.get(workspaceConstantsSelectors.constantValue(data.constName2)).should(
      "not.exist"
    );
    cy.openApp();
    cy.get('[data-cy="left-sidebar-inspect-button"]').click();
    cy.wait(1000);
    cy.get('[data-cy="inspector-node-constants"] > .node-key').click();
    cy.get(`[data-cy="inspector-node-${data.constName2}"]`).should("not.exist");

    // verify global constant in components

    cy.dragAndDropWidget("Text Input", 550, 150);
    cy.waitForAutoSave();
    cy.get('[data-cy="default-value-input-field"]').clearAndTypeOnCodeMirror(
      `{{constants.${data.constName}`
    );

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get('[data-cy="draggable-widget-textinput1"]').should(
      "have.value",
      data.constName
    );

    // // verify secret constant in components

    cy.dragAndDropWidget("Text Input", 550, 250);
    cy.waitForAutoSave();
    cy.get('[data-cy="default-value-input-field"]').clearAndTypeOnCodeMirror(
      `{{secrets.${data.constName1}`
    );
    cy.get('[data-cy="alert-info-text"]').contains(
      "secrets cannot be used in apps"
    );

    // // Verify  constants in queries
    cy.get('[data-cy="left-sidebar-inspect-button"]').click();
    cy.get('[data-cy="inspector-node-components"] > .node-key').click();

    cy.get(
      ".group-border > :nth-child(2) > .mx-2 > .json-tree-node-icon > svg"
    ).click();

    cy.get('[data-cy="inspector-node-value"]')
      .invoke("text")
      .should("include", data.constName);

    // Verifying constant in preview

    cy.get('[data-cy="show-ds-popover-button"]').click();
    cy.get('[data-cy="ds-run javascript code"]').click();
    cy.reload();
    cy.get('[data-cy="runjs-input-field"]').clearAndTypeOnCodeMirror(
      `return constants.${data.constName}`
    );
    cy.get('[data-cy="query-preview-button"]').click();
    cy.wait(500);
    cy.get('[data-cy="preview-json-data-container"]').should(
      "contain.text",
      data.constName
    );
    cy.backToApps();

    // Verify success and error message on ds connection

    cy.get('[data-cy="icon-global-datasources"]').click();
    cy.get('[data-cy="data-source-rest api"]').realHover();
    cy.wait(100);
    cy.get('[data-cy="rest-api-add-button"]').eq(0).click({ force: true });
    cy.wait(500);
    cy.get('[data-cy="base-url-text-field"]').type(
      `{{secrets.${data.constName1}`,
      { force: true }
    );
    cy.get('[data-cy="variable-preview"]').should(
      "have.text",
      "Values of secret constants are hidden"
    );

    cy.get('[data-cy="base-url-text-field"]').clear();
    cy.get('[data-cy="base-url-text-field"]')
      .type("{{", { force: true })
      .type("secrets.abc", { force: true })
      .type("}}", { force: true });
    cy.get('[data-cy="variable-preview"]').should(
      "have.text",
      "ErrorUndefined constants: abc"
    );
  });

  it("should verify the constants resolving in datasource connection form", () => {
    data.ds = fake.lastName.toLowerCase().replaceAll("[^A-Za-z]", "");

    data.widgetName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.appName = `${fake.companyName}-App`;
    data.restapilink = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
    data.restapiHeaderKey = fake.firstName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
    data.restapiHeaderValue = fake.firstName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
    cy.defaultWorkspaceLogin();
    cy.get(commonSelectors.workspaceConstantsIcon).click();
    addNewconstants(data.restapilink, Cypress.env("constants_host"));
    addNewconstants(data.restapiHeaderKey, "customHeader");
    addNewconstants(data.restapiHeaderValue, "key=value");
    cy.apiCreateGDS(
      `${Cypress.env("server_host")}/api/v2/data_sources`,
      data.ds,
      "restapi",
      [
        { key: "url", value: `{{constants.${data.restapilink}}}` },
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
    cy.apiCreateApp(data.appName);
    cy.getCookie("tj_auth_token", { log: false }).then((cookie) => {
      const authToken = `tj_auth_token=${cookie.value}`;
      const workspaceId = Cypress.env("workspaceId");
      const appId = Cypress.env("appId");

      cy.request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/apps/${appId}`,
        headers: {
          "Tj-Workspace-Id": workspaceId,
          Cookie: `${authToken}; app_id=${appId}`,
        },
        body: {},
      }).then((appResponse) => {
        const editingVersionId = appResponse.body.editing_version.id;
        Cypress.env("version-id", editingVersionId);
        const appVersionId = editingVersionId;

        // Create the REST API query
        // Need to check for revers proxy
        createrestAPIQuery({
          app_id: Cypress.env("appId"),
          app_version_id: appVersionId,
          name: data.ds,
          key: data.restapiHeaderKey,
          value: data.restapiHeaderValue,
        });
      });
    });

    cy.openApp(data.appName);

    cy.waitForAutoSave();
    cy.dragAndDropWidget("Text Input", 550, 650);
    editAndVerifyWidgetName(data.widgetName, []);
    cy.waitForAutoSave();
    cy.get('[data-cy="default-value-input-field"]').clearAndTypeOnCodeMirror(
      `{{queries.${data.ds}.data.message`
    );
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get(dataSourceSelector.queryCreateAndRunButton).click();
    cy.wait(500);
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "have.value",
      "Production environment testing"
    );
    cy.contains("p", "Settings").click();
    cy.get('[data-cy="run-on-app-load-toggle-switch"]').click({ force: true });

    // verify queries in inspector

    cy.get('[data-cy="left-sidebar-inspect-button"]').click();
    cy.get('[data-cy="inspector-node-constants"] > .node-key').click();
    cy.wait(1000);
    cy.get('[data-cy="inspector-node-queries"] > .node-key').click();
    cy.get(`[data-cy="inspector-node-${data.ds}"] > .node-key`).click();
    cy.get('[data-cy="inspector-node-data"] > .node-key').click();
    cy.get('[data-cy="inspector-node-message"] > .mx-2')
      .click()
      .contains("Production environment testing");

    // verify constants in preview

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(4000);
    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", "Production environment testing");

    // verify constants on released app

    cy.get('[data-cy="viewer-page-logo"]').click();
    cy.wait(2000);
    navigateToAppEditor(data.appName);
    releaseApp();
    cy.wait(1000);
    cy.get(commonWidgetSelector.shareAppButton).click();
    cy.clearAndType(commonWidgetSelector.appNameSlugInput, `${data.slug}`);
    cy.wait(2000);
    cy.get(commonWidgetSelector.modalCloseButton).click();

    cy.backToApps();
    cy.wait(1000);
    cy.visitSlug({ actualUrl: `/applications/${data.slug}` });

    cy.wait(4000);
    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", "Production environment testing");

    // verify constants on different versions
    cy.get('[data-cy="viewer-page-logo"]').click();
    navigateToAppEditor(data.appName);
    cy.get(appVersionSelectors.appVersionMenuField)
      .should("be.visible")
      .click();
    createNewVersion((otherVersions = ["v2"]), (currentVersion = "v1"));
    cy.wait(500);
    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", "Production environment testing");
  });
});
