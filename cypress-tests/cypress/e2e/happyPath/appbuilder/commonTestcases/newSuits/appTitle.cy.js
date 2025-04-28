import { fake } from "Fixtures/fake";
import { textInputText } from "Texts/textInput";
import { commonWidgetText, widgetValue, customValidation } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import {
  verifyControlComponentAction,
  randomString,
} from "Support/utils/editor/textInput";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  verifyComponentValueFromInspector,
  selectColourFromColourPicker,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  randomNumber,
  closeAccordions,
} from "Support/utils/commonWidget";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";

describe("Editor title", () => {
  const data = {};
  beforeEach(() => {
    data.appName = fake.companyName;
    cy.apiLogin();
    cy.apiCreateApp(data.appName);
    cy.visit("/");
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });
  it("should verify titles", () => {
    cy.url().should("include", "/tooljets-workspace");
    // cy.title().should("eq", "Dashboard | ToolJet");
    cy.title().should("eq", "ToolJet");

    cy.log(data.appName);

    cy.openApp();
    cy.url().should("include", Cypress.env("appId"));
    cy.title().should("eq", `${data.appName} | ToolJet`);

    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.url().should("include", `/applications/${Cypress.env("appId")}`);
    cy.title().should("eq", `${data.appName} | ToolJet`);
    // cy.title().should("eq", `Preview - ${data.appName} | ToolJet`);

    cy.go("back");
    cy.releaseApp();
    cy.url().then((url) => {
      const appId = url.split("/").filter(Boolean).pop();
      cy.log(appId);
      cy.visit(`/applications/${appId}`);
    });

    cy.url().should("include", `/applications/${Cypress.env("appId")}`);
    cy.title().should("eq", `${data.appName} | ToolJet`);
    // cy.title().should("eq", `${data.appName}`);
  });
});

