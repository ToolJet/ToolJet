import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { workspaceConstantsSelectors } from "Selectors/workspaceConstants";
import { workspaceConstantsText } from "Texts/workspaceConstants";
import { releaseApp, navigateToAppEditor } from "Support/utils/common";
import { manageWorkspaceConstant, addConstantFormUI, deleteConstant, verifyConstantValueVisibility } from "Support/utils/workspaceConstants";
import {
  importSelectors,
} from "Selectors/exportImport";
import {
  appVersionSelectors,
} from "Selectors/exportImport";

import { createNewVersion } from "Support/utils/exportImport";

import {
  addNewconstants,
} from "Support/utils/workspaceConstants";
import { editAndVerifyWidgetName } from "Support/utils/commonWidget";

import {
  createDataQuery,
  createrestAPIQuery,
} from "Support/utils/dataSource";

import { dataSourceSelector } from "Selectors/dataSource";

const data = {};

describe("Workspace constants", () => {
  const envVar = Cypress.env("environment");
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

  it("Verify workspace constants UI and CRUD operations", () => {
    data.firstName = fake.firstName;
    data.workspaceName = data.firstName;
    data.workspaceSlug = data.firstName.toLowerCase();

    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.visit(`${data.workspaceSlug}`);
    cy.wait(2000);

    addConstantFormUI();

    manageWorkspaceConstant({
      constantType: "Global",
      constName: "Example_Constant1",
      newConstvalue: "UpdatedValue",
      envName: "Production"
    });
    manageWorkspaceConstant({
      constantType: "Secrets",
      constName: "Example_Constant1",
      newConstvalue: "UpdatedValue",
      envName: "Production"
    });
  });

  it("Verify global and secret constants in the editor, inspector, data sources, static queries, query preview, and preview", () => {
    data.workspaceName = fake.firstName;
    data.workspaceSlug = fake.firstName.toLowerCase().replace(/[^A-Za-z]/g, "");
    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.visit(data.workspaceSlug);
    cy.viewport(1440, 960);
    data.appName = `${fake.companyName}-App`;

    // create global constants
    cy.get(commonSelectors.workspaceConstantsIcon).click();
    addNewconstants("url", Cypress.env("constants_host"));
    addNewconstants("restapiHeaderKey", "customHeader");
    addNewconstants("restapiHeaderValue", "key=value");
    addNewconstants("deleteConst", "deleteconst");
    addNewconstants("gconst", "236");
    addNewconstants("gconstUrl", "http://34.66.166.236:4000/");
    addNewconstants("gconstEndpoint", "production");

    // create secret constants
    addNewconstants("url", Cypress.env("constants_host"), "Secrets");
    addNewconstants("restapiHeaderKey", "customHeader", "Secrets");
    addNewconstants("restapiHeaderValue", "key=value", "Secrets");
    addNewconstants("sconst", ":4000", "Secrets");
    addNewconstants("sconstEndpoint", "production");

    //delete one constant to verify deleted const in inspector
    deleteConstant("deleteConst");

    cy.get(commonWidgetSelector.homePageLogo).click();

    //Import constants app
    cy.get(importSelectors.dropDownMenu).should("be.visible").click();
    cy.get(importSelectors.importOptionInput)
      .eq(0)
      .selectFile('cypress/fixtures/templates/workspace_constants.json', { force: true });
    cy.get(importSelectors.importAppButton).click();
    cy.wait(5000);

    //Verify global constant value is resolved in component
    cy.get(commonWidgetSelector.draggableWidget('textinput1'))
      .verifyVisibleElement("have.value", "customHeader");

    //Verify secret constant value is not resolved in component and verify error message
    cy.get(commonWidgetSelector.draggableWidget('textinput2'))
      .verifyVisibleElement("have.value", "").click();
    cy.get(commonWidgetSelector.defaultValueInputField).click();
    cy.get(commonWidgetSelector.alertInfoText).contains(
      "secrets cannot be used in apps"
    );

    //Verify all static and datasource queries output in components
    for (let i = 3; i <= 16; i++) {
      cy.get(commonWidgetSelector.draggableWidget(`textinput${i}`))
        .verifyVisibleElement("have.value", "Production environment testing");
    }

    //verify global constant is resolved in static query url
    cy.get('[data-cy="list-query-restapistaticg"]').click();
    cy.get('.rest-api-methods-select-element-container .codehinter-container').click();
    cy.get('.text-secondary').should('have.text', Cypress.env("constants_host"));

    //Verify global constant is resolved in static query preview
    cy.get('[data-cy="list-query-runjsg"]').click();
    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.get(dataSourceSelector.previewJsonDataContainer).should(
      "contain.text",
      "customHeader"
    );
    //Verify static constant is not resolved and error is displayed in static query response
    cy.get('[data-cy="list-query-runjss"]').click();
    cy.get(dataSourceSelector.queryPreviewButton).click();
    cy.get(dataSourceSelector.previewTabRaw).click();
    cy.get(dataSourceSelector.previewTabRawContainer).contains("secrets is not defined");

    //verify global const should be visible, secrets and deleted const are not in Inspector
    cy.get(commonWidgetSelector.inspectorIcon).click();
    cy.get(commonWidgetSelector.constantInspectorIcon).click();
    cy.get('[data-cy="inspector-node-restapiheaderkey"]').should('exist');
    cy.get('[data-cy="inspector-node-deleteconst"]').should('not.exist');
    cy.get('[data-cy="inspector-node-sconst"]').should('not.exist');

    //Preview app and verify components
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(6000);
    for (let i = 3; i <= 16; i++) {
      cy.get(commonWidgetSelector.draggableWidget(`textinput${i}`))
        .verifyVisibleElement("have.value", "Production environment testing");
    }

    //back to dashboard and open app again
    cy.get(commonSelectors.viewerPageLogo).click();
    cy.wait(2000);
    cy.get(commonSelectors.appEditButton).click({ force: true });

    cy.releaseApp();

    cy.backToApps();

    //Verify global are getting resolved and secrets are hidded in the data source form
    cy.get(commonSelectors.globalDataSourceIcon).click();
    cy.get('[data-cy="restapig-button"]').click();
    verifyConstantValueVisibility(dataSourceSelector.baseUrlTextField, Cypress.env("constants_host"));
    verifyConstantValueVisibility('[value="{{constants.restapiHeaderKey}}"]', "customHeader");
    verifyConstantValueVisibility('[value="{{constants.restapiHeaderValue}}"]', "key=value");
    cy.get('[data-cy="restapis-button"]').click();
    verifyConstantValueVisibility(dataSourceSelector.baseUrlTextField, workspaceConstantsText.secretsHiddenText);
    verifyConstantValueVisibility('[value="{{secrets.restapiHeaderKey}}"]', workspaceConstantsText.secretsHiddenText);
    verifyConstantValueVisibility('[value="{{secrets.restapiHeaderValue}}"]', workspaceConstantsText.secretsHiddenText);
    cy.get('[data-cy="restapiurlgs-button"]').click();
    verifyConstantValueVisibility(dataSourceSelector.baseUrlTextField, workspaceConstantsText.secretsHiddenText);
  })
});
