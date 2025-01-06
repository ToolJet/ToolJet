import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import { commonText, commonWidgetText } from "Texts/common";

import { releaseApp, navigateToAppEditor } from "Support/utils/common";

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
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.skipWalkthrough();
  });

  it("Verify workspace constants UI and CRUD operations", () => {
    data.constName = fake.firstName.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.newConstvalue = `New ${data.constName}`;
    data.constantsName = fake.firstName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
    data.constantsValue = "dJ_8Q~BcaMPd";
    data.appName = `${fake.companyName}-App`;
    data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");

    cy.get(commonSelectors.workspaceConstantsIcon).click();

    cy.get(commonSelectors.pageSectionHeader).verifyVisibleElement(
      "have.text",
      "Workspace constants"
    );

    cy.get(
      workspaceConstantsSelectors.workspaceConstantsHelperText
    ).verifyVisibleElement(
      "have.text",
      workspaceConstantsText.workspaceConstantsHelperText
    );

    cy.get(commonSelectors.documentationLink).verifyVisibleElement(
      "have.text",
      "Read documentation"
    );

    cy.get("body").then(($body) => {
      if ($body.find(workspaceConstantsSelectors.emptyStateImage).length > 0) {
        cy.get(workspaceConstantsSelectors.emptyStateImage).should(
          "be.visible"
        );
        cy.get(
          workspaceConstantsSelectors.emptyStateHeader
        ).verifyVisibleElement(
          "have.text",
          workspaceConstantsText.emptyStateHeader
        );
        cy.get(workspaceConstantsSelectors.emptyStateText).verifyVisibleElement(
          "have.text",
          workspaceConstantsText.emptyStateText
        );
        cy.get(
          workspaceConstantsSelectors.addNewConstantButton
        ).verifyVisibleElement(
          "have.text",
          workspaceConstantsText.addNewConstantButton
        );
      }
    });
    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
      "have.text",
      workspaceConstantsText.addConstatntText
    );
    cy.get(commonSelectors.nameLabel).verifyVisibleElement("have.text", "Name");
    cy.get(commonSelectors.workspaceConstantNameInput)
      .invoke("attr", "placeholder")
      .should("eq", "Enter constant name");
    cy.get(commonSelectors.workspaceConstantNameInput).should("be.visible");
    cy.get(commonSelectors.valueLabel).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq("Value");
    });
    cy.get('[data-cy="form-encrypted-label"]').verifyVisibleElement(
      "have.text",
      "Encrypted"
    );
    cy.get(commonSelectors.workspaceConstantValueInput)
      .invoke("attr", "placeholder")
      .should("eq", "Enter value");
    cy.get(commonSelectors.workspaceConstantValueInput).should("be.visible");
    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
      "have.text",
      "Add constant"
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

    contantsNameValidation(" ", commonText.constantsNameError);
    contantsNameValidation("9", commonText.constantsNameError);
    contantsNameValidation("%", commonText.constantsNameError);
    contantsNameValidation(
      "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5wee",
      "Maximum length has been reached"
    );
    contantsNameValidation(
      "Xk4jY2mLn8pQsZ9Rt6vBc7wJaHqOdEfGuVxY3NkMLzPoWX5weetr",
      "Constant name has exceeded 50 characters"
    );

    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(commonSelectors.workspaceConstantValueInput, " ");
    cy.get(commonSelectors.valueErrorText).verifyVisibleElement(
      "have.text",
      commonText.constantsValueError
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");
    cy.get(commonSelectors.cancelButton).click();
    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();

    cy.clearAndType(commonSelectors.workspaceConstantNameInput, data.constName);
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantValueInput,
      data.constName
    );
    cy.get(workspaceConstantsSelectors.constantsType("global")).check();
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
    cy.get(commonSelectors.cancelButton).click();
    cy.get(workspaceConstantsSelectors.constantName(data.constName)).should(
      "not.exist"
    );

    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.clearAndType(commonSelectors.workspaceConstantNameInput, data.constName);
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantValueInput,
      data.constName
    );
    cy.get(workspaceConstantsSelectors.constantsType("Secrets")).check();
    cy.get(workspaceConstantsSelectors.addConstantButton).click();
    cy.reload();
    cy.get(".tabs > :nth-child(2)").click({ force: true });
    cy.contains("button", "Secrets").click({ force: true });
    cy.get(".tabs > :nth-child(1)").click({ force: true });
    cy.contains("button", "Secrets").click({ force: true });
    cy.get(`[data-cy="${data.constName}-edit-button"]`).click();
    cy.get('[data-cy="name-input-field"]').should(
      "have.attr",
      "data-tooltip-content",
      "Cannot edit constant name"
    );
    cy.get('[data-cy="cancel-button"]').click();

    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    cy.clearAndType(commonSelectors.workspaceConstantNameInput, data.constName);
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantValueInput,
      data.constName
    );
    cy.get(workspaceConstantsSelectors.constantsType("global")).check();
    cy.get(workspaceConstantsSelectors.addConstantButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      workspaceConstantsText.constantCreatedToast("Global")
    );

    cy.get(workspaceConstantsSelectors.addNewConstantButton).click();
    existingNameValidation(data.constName, "test");
    cy.get(commonSelectors.cancelButton).click();

    cy.get(workspaceConstantsSelectors.envName).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq("Production");
    });
    cy.get(
      workspaceConstantsSelectors.addNewConstantButton
    ).verifyVisibleElement("have.text", "+ Create new constant");
    cy.get(
      workspaceConstantsSelectors.constantsTableNameHeader
    ).verifyVisibleElement("have.text", "Name");
    cy.get(
      workspaceConstantsSelectors.constantsTableValueHeader
    ).verifyVisibleElement("have.text", "Value");
    cy.get(
      workspaceConstantsSelectors.constantName(data.constName)
    ).verifyVisibleElement("have.text", data.constName);

    cy.get(workspaceConstantsSelectors.constHideButton(data.constName)).click();
    cy.get(
      workspaceConstantsSelectors.constantValue(data.constName)
    ).verifyVisibleElement("have.text", data.constName);
    cy.get(
      workspaceConstantsSelectors.constEditButton(data.constName)
    ).verifyVisibleElement("have.text", "Edit");
    cy.get(
      workspaceConstantsSelectors.constDeleteButton(data.constName)
    ).verifyVisibleElement("have.text", "Delete");
    cy.get(commonSelectors.pagination).should("be.visible");

    cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();

    cy.get(workspaceConstantsSelectors.contantFormTitle).verifyVisibleElement(
      "have.text",
      "Update constant in production "
    );
    cy.get(commonSelectors.nameLabel).verifyVisibleElement("have.text", "Name");
    cy.get(commonSelectors.workspaceConstantNameInput).should(
      "have.value",
      data.constName
    );
    cy.get(commonSelectors.workspaceConstantNameInput)
      .should("be.visible")
      .and("be.disabled");
    cy.get(commonSelectors.valueLabel).should(($el) => {
      expect($el.contents().first().text().trim()).to.eq("Value");
    });
    cy.get(commonSelectors.workspaceConstantValueInput)
      .click()
      .should("be.visible")
      .and("have.value", data.constName);

    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).verifyVisibleElement(
      "have.text",
      "Update"
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.disabled");

    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantValueInput,
      data.newConstvalue
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).should("be.enabled");
    cy.get(commonSelectors.cancelButton).click();
    cy.get(
      workspaceConstantsSelectors.constantValue(data.constName)
    ).verifyVisibleElement("have.text", data.constName);

    cy.get(workspaceConstantsSelectors.constEditButton(data.constName)).click();
    cy.get(commonSelectors.workspaceConstantValueInput).click();
    cy.clearAndType(
      commonSelectors.workspaceConstantValueInput,
      data.newConstvalue
    );
    cy.get(workspaceConstantsSelectors.addConstantButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Constant updated successfully"
    );

    cy.get(workspaceConstantsSelectors.constantValue(data.constName))
      .should("be.visible")
      .and("have.text", data.newConstvalue);
    cy.get(
      workspaceConstantsSelectors.constDeleteButton(data.constName)
    ).click();
    cy.get(commonSelectors.modalMessage).verifyVisibleElement(
      "have.text",
      `Are you sure you want to delete ${data.constName} from production?`
    );
    cy.get(commonSelectors.cancelButton).verifyVisibleElement(
      "have.text",
      "Cancel"
    );
    cy.get(commonSelectors.yesButton).verifyVisibleElement("have.text", "Yes");
    cy.get(commonSelectors.cancelButton).click();
    cy.get(
      workspaceConstantsSelectors.constantValue(data.constName)
    ).verifyVisibleElement("have.text", data.newConstvalue);

    cy.get(
      workspaceConstantsSelectors.constDeleteButton(data.constName)
    ).click();
    cy.get(commonSelectors.yesButton).click();
    cy.get(workspaceConstantsSelectors.constantValue(data.constName)).should(
      "not.exist"
    );

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Constant deleted successfully"
    );
  });

  it("should verify the constants resolving value on components and query", () => {
    cy.viewport(1440, 960);

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
    data.newConstvalue = `New ${data.constName}`;
    data.constantsName = fake.firstName
      .toLowerCase()
      .replaceAll("[^A-Za-z]", "");
    data.constantsValue = "dJ_8Q~BcaMPd";
    data.appName = `${fake.companyName}-App`;
    data.slug = data.appName.toLowerCase().replace(/\s+/g, "-");
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

    // verify global constant in components

    cy.openApp();
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

    // verify secret constant in components

    cy.dragAndDropWidget("Text Input", 550, 250);
    cy.waitForAutoSave();
    cy.get('[data-cy="default-value-input-field"]').clearAndTypeOnCodeMirror(
      `{{secrets.${data.constName1}`
    );
    cy.get('[data-cy="alert-info-text"]').contains(
      "secrets cannot be used in apps"
    );

    // Verify constants in constants in inspector

    cy.get('[data-cy="left-sidebar-inspect-button"]').click();
    cy.wait(1000);
    cy.get('[data-cy="inspector-node-constants"] > .node-key').click();
    cy.get(`[data-cy="inspector-node-${data.constName}"]`).should("be.visible");

    // Verify constants in constants in queries

    cy.get('[data-cy="inspector-node-components"] > .node-key').click();

    cy.get(
      ".group-border > :nth-child(2) > .mx-2 > .json-tree-node-icon > svg"
    ).click();

    cy.get('[data-cy="inspector-node-value"]')
      .invoke("text")
      .should("include", data.constName);

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
        createrestAPIQuery({
          app_id: Cypress.env("appId"),
          app_version_id: appVersionId,
          name: data.ds,
          key: data.restapiHeaderKey,
          value: data.restapiHeaderValue,
        });
      });
    });

    cy.openApp();

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
