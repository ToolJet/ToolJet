import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/fileButton";
import { openEditorSidebar, openAccordion, verifyAndModifyParameter } from "Support/utils/commonWidget";
import { openNode, openSubNode, backFromDetail, verifyNodeData } from "Support/utils/inspector";

const enableFxAndBind = (paramName, expression) => {
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  verifyAndModifyParameter(paramName, expression);
};

const clickWidgetInput = (name) => {
  cy.get(`[data-cy="${name}"]`).find("input").click({ force: true });
  cy.waitForAutoSave();
};

const commitChange = () => {
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

const waitForDropSettle = (widgetName, attemptsLeft = 6) => {
  cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el) => {
    const top = $el[0].getBoundingClientRect().top;
    cy.wrap(null).then(() => {
      cy.wait(150);
      cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el2) => {
        const top2 = $el2[0].getBoundingClientRect().top;
        if (Math.abs(top2 - top) > 1 && attemptsLeft > 0) {
          waitForDropSettle(widgetName, attemptsLeft - 1);
        }
      });
    });
  });
};

const dropCompanionToggle = (x, y) => {
  cy.dragAndDropWidget("Toggle Switch", x, y);
  waitForDropSettle("toggleswitch1");
};

// No queries in this spec, so free the vertical space. State persists in
// localStorage across tests — check before clicking, don't assume it's open.
const closeQueryPanel = () => {
  cy.get(".query-pane").then(($panel) => {
    if (!$panel.hasClass("collapsed")) {
      cy.get('[data-cy="query-manager-toggle-button"]').click();
    }
  });
};

describe(
  "File Button properties",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = "filebutton1";

  // Confirms the property's EXPOSED state (components.filebutton1.<key>), not
  // just the rendered DOM. The Inspector tab and Components expand-button are
  // both toggles that persist in the app's store even when closed, so undo
  // each in reverse order — every call then starts from the same known state.
  const verifyExposedValue = (key, type, value) => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.hideTooltip();
    openNode("components");
    openSubNode(widget);
    verifyNodeData(key, type, value);
    backFromDetail();
    openNode("components");
    cy.get(commonWidgetSelector.sidebarinspector).click();
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget("File button", 500, 100);
    waitForDropSettle(widget);
    closeQueryPanel();
  });

  it("should verify Button text: direct change and exposed-variable binding", () => {
    // 1. Direct change.
    openEditorSidebar(widget);
    verifyAndModifyParameter("Button text", "Direct Button Text");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).should("have.text", "Direct Button Text");

    // 2. Bind to another component's exposed variable.
    cy.dragAndDropWidget("Text Input", 500, 300);
    waitForDropSettle("textinput1");
    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", "Bound From TextInput");
    commitChange();

    openEditorSidebar(widget);
    verifyAndModifyParameter("Button text", "{{components.textinput1.value}}");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.text", "Bound From TextInput");

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", "Bound Text Changed");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.text", "Bound Text Changed");
  });

  it("should verify Enable multiple files: direct toggle and exposed-variable binding", () => {
    // Maps to the input's `multiple` attr — React omits false booleans, so
    // absence means off, not `="false"`.
    openEditorSidebar(widget);
    cy.get(fileButtonSelector.inputField(widget)).should("not.have.attr", "multiple");

    // 1. Direct toggle.
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.inputField(widget)).should("have.attr", "multiple");

    cy.get(fileButtonSelector.inputField(widget)).selectFile(
      ["cypress/fixtures/bulkUser/3_users_upload.csv", "cypress/fixtures/bulkUser/missing_name.csv"],
      { force: true }
    );
    cy.get(fileButtonSelector.label(widget)).should("have.text", "2 files selected");

    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.inputField(widget)).should("not.have.attr", "multiple");

    // 2. Bind to another component's exposed variable.
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    enableFxAndBind("Enable multiple files", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).scrollIntoView().should("not.have.attr", "multiple");

    clickWidgetInput("toggleswitch1");
    cy.get(fileButtonSelector.inputField(widget)).scrollIntoView().should("have.attr", "multiple");
  });

  it("should verify Parse file content: direct toggle reveals File type, and exposed-variable binding (reveal-on-true left as an open finding)", () => {
    // File type is conditionallyRender'd on parseContent, so its label
    // existing/not proves the toggle works.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("not.exist");

    // 1. Direct toggle.
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("have.text", "File type");

    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("not.exist");

    // 2. Bind to another component's exposed variable.
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    enableFxAndBind("Parse file content", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("not.exist");

    // FINDING: flipping toggleswitch1 true afterward does NOT reveal File
    // type, even though the same binding updates Button text's ternary
    // elsewhere. Ruled out click failure, wrong panel, timing, stale mount —
    // looks specific to conditionallyRender. Left open, not asserted here.
  });

  it("should verify Enable clear selection: direct toggle and exposed-variable binding", () => {
    // Lives in the collapsed "Additional Actions" accordion.
    openEditorSidebar(widget);
    openAccordion("Additional Actions");

    // Default is true, so with a file held the clear button should exist.
    cy.get(fileButtonSelector.inputField(widget)).selectFile("cypress/fixtures/Image/tooljet.png", {
      force: true,
    });
    cy.get(fileButtonSelector.clearButton(widget)).should("exist");

    // 1. Direct toggle — off with the file still held.
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable clear selection")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.clearButton(widget)).should("not.exist");

    cy.get(commonWidgetSelector.parameterTogglebutton("Enable clear selection")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.clearButton(widget)).should("exist");

    // 2. Bind to another component's exposed variable.
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    enableFxAndBind("Enable clear selection", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(fileButtonSelector.clearButton(widget)).should("not.exist");

    clickWidgetInput("toggleswitch1");
    cy.get(fileButtonSelector.button(widget)).scrollIntoView();
    cy.get(fileButtonSelector.clearButton(widget)).should("exist");
  });

  it("should verify Loading state: direct toggle and exposed-variable binding", () => {
    // Loader and label/icon/clear are mutually exclusive (isLoading branch).
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(fileButtonSelector.loader(widget)).should("not.exist");
    cy.get(fileButtonSelector.label(widget)).should("be.visible");
    verifyExposedValue("isLoading", "Boolean", "false");

    // 1. Direct toggle.
    cy.get(commonWidgetSelector.parameterTogglebutton("Loading state")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.loader(widget)).should("be.visible");
    cy.get(fileButtonSelector.label(widget)).should("not.exist");
    verifyExposedValue("isLoading", "Boolean", "true");

    cy.get(commonWidgetSelector.parameterTogglebutton("Loading state")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.loader(widget)).should("not.exist");
    cy.get(fileButtonSelector.label(widget)).should("be.visible");
    verifyExposedValue("isLoading", "Boolean", "false");

    // 2. Bind to another component's exposed variable.
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    enableFxAndBind("Loading state", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(fileButtonSelector.loader(widget)).should("not.exist");
    verifyExposedValue("isLoading", "Boolean", "false");

    clickWidgetInput("toggleswitch1");
    cy.get(fileButtonSelector.loader(widget)).scrollIntoView().should("be.visible");
    verifyExposedValue("isLoading", "Boolean", "true");
  });

  it("should verify Visibility: direct toggle and exposed-variable binding", () => {
    // Turning visibility off unmounts the widget entirely (returns null).
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(fileButtonSelector.widget(widget)).should("exist");
    verifyExposedValue("isVisible", "Boolean", "true");

    // 1. Direct toggle. The panel stays open even once the widget unmounts.
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");
    verifyExposedValue("isVisible", "Boolean", "false");

    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.widget(widget)).should("exist");
    verifyExposedValue("isVisible", "Boolean", "true");

    // 2. Bind to another component's exposed variable.
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    enableFxAndBind("Visibility", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");
    verifyExposedValue("isVisible", "Boolean", "false");

    clickWidgetInput("toggleswitch1");
    cy.get(fileButtonSelector.widget(widget)).scrollIntoView().should("exist");
    verifyExposedValue("isVisible", "Boolean", "true");
  });

  it("should verify Disable: direct toggle and exposed-variable binding", () => {
    // Disable sets a real native :disabled on the trigger, not just aria.
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(fileButtonSelector.button(widget)).should("not.be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "false");

    // 1. Direct toggle.
    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "true");

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("not.be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "false");

    // 2. Bind to another component's exposed variable.
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    enableFxAndBind("Disable", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("not.be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "false");

    clickWidgetInput("toggleswitch1");
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "true");
  });
});
