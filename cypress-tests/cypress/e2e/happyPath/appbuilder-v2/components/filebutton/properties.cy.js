import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/fileButton";
import { openEditorSidebar, openAccordion, verifyAndModifyParameter } from "Support/utils/commonWidget";
import { openNode, openSubNode, backFromDetail, verifyNodeData } from "Support/utils/inspector";

// The Validation section's file-type field is a hand-rolled FxSelect
// (FilePicker.jsx), not the generic renderer, so it has none of the usual
// `parameter*` data-cy attributes. Its name derives from paramName (`fileType`)
// rather than its "File type" label, which the properties panel already uses.
const validationFileTypeWrapper = '[data-cy="filetype-fx-select"]';

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

// Both selects are react-select and portal their menu to document.body, so the
// options can't be reached by descending from the wrapper. `.type()` on the
// wrapper doesn't work either — it's a div, not a typeable element — which is
// why the shared selectFromSidebarDropdown helper is unusable here.
const selectFileType = (option) => {
  cy.get('[data-cy="dropdown-file-type"]').find(".react-select__control").click();
  // Exact match: .contains("XLS") would also hit "XLSX".
  cy.get(".react-select__option").filter((_i, el) => el.innerText.trim() === option).click();
  cy.waitForAutoSave();
};

// The Validation section's own file-type field. FilePicker.jsx replaces the
// generic renderer with a bespoke FxSelect, so it has none of the usual
// parameter data-cy attributes — hence the odd wrapper name below.
const selectValidationFileType = (option) => {
  cy.get(validationFileTypeWrapper).find(".react-select__control").click();
  cy.get(".react-select__option").filter((_i, el) => el.innerText.trim() === option).click();
  cy.waitForAutoSave();
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
  const validFile = "cypress/fixtures/Image/tooljet.png"; // 1934 bytes
  const csvFile = "cypress/fixtures/bulkUser/3_users_upload.csv";
  const secondCsvFile = "cypress/fixtures/bulkUser/missing_name.csv";

  // useFilePicker silently DROPS a re-selected file it already holds (the
  // duplicate guard filters it out before validation runs), so a second
  // selectFile of the same path is a no-op — clear first or the next
  // assertion tests nothing.
  const clearSelectedFile = () => {
    cy.get("body").then(($body) => {
      if ($body.find(fileButtonSelector.clearButton(widget)).length) {
        cy.get(fileButtonSelector.clearButton(widget)).click();
      }
    });
  };

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

    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
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
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
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

  it("should verify File type: dropdown selection, and Delimiter appearing only for CSV", () => {
    // Both are conditionallyRender'd — File type on parseContent, Delimiter on
    // parseContent AND File type === csv. Proves the two-step chain.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();

    // Default is "Autodetect from extension", so Delimiter stays hidden.
    cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("not.exist");

    // CSV is the only option that reveals Delimiter.
    selectFileType("CSV");
    cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("have.text", "Delimiter");
    verifyAndModifyParameter("Delimiter", ";");
    commitChange();

    // Any non-CSV type hides it again.
    selectFileType("JSON");
    cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("not.exist");

    // Turning parsing off hides File type itself, collapsing the whole chain.
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("not.exist");
    cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("not.exist");
  });

  it("should verify Make this field mandatory: direct toggle and exposed-variable binding", () => {
    openEditorSidebar(widget);
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("not.exist");
    verifyExposedValue("isMandatory", "Boolean", "false");

    // 1. Direct toggle — indicator renders and the input advertises it to AT.
    cy.get(commonWidgetSelector.parameterTogglebutton("Make this field mandatory")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("be.visible");
    cy.get(fileButtonSelector.ariaRequired(widget)).should("exist");
    verifyExposedValue("isMandatory", "Boolean", "true");

    cy.get(commonWidgetSelector.parameterTogglebutton("Make this field mandatory")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("not.exist");
    verifyExposedValue("isMandatory", "Boolean", "false");

    // 2. Bind to another component's exposed variable.
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    enableFxAndBind("Make this field mandatory", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("not.exist");
    verifyExposedValue("isMandatory", "Boolean", "false");

    clickWidgetInput("toggleswitch1");
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).scrollIntoView().should("be.visible");
    verifyExposedValue("isMandatory", "Boolean", "true");
  });

  it("should verify Accepted file types: restricting to images rejects a non-image", () => {
    // NOTE: this field's label renders as "File type", not the config's
    // displayName "Accepted file types" — FilePicker.jsx hardcodes it.
    openEditorSidebar(widget);
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");

    // Restrict to images, then a CSV must be refused.
    clearSelectedFile();
    selectValidationFileType("Image files");
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");

    // The image still passes under the same restriction — proves it filters by
    // type rather than rejecting everything.
    clearSelectedFile();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");
  });

  it("should verify Min size and Max size reject files outside the range", () => {
    // tooljet.png is 1934 bytes — thresholds are picked either side of it.
    openEditorSidebar(widget);

    // Min size above the file's size — rejected as too small.
    verifyAndModifyParameter("Min size (bytes)", "{{5000}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");

    // Back under it — accepted.
    openEditorSidebar(widget);
    verifyAndModifyParameter("Min size (bytes)", "{{100}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");

    // Max size below the file's size — rejected as too large.
    clearSelectedFile();
    openEditorSidebar(widget);
    verifyAndModifyParameter("Max size (bytes)", "{{500}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
  });

  it("should verify Min and Max file count: both appear only with multiple files enabled", () => {
    openEditorSidebar(widget);

    // Both are conditionallyRender'd on enableMultiple.
    cy.get(commonWidgetSelector.parameterLabel("Min file count")).should("not.exist");
    cy.get(commonWidgetSelector.parameterLabel("Max file count")).should("not.exist");

    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("Min file count")).should("have.text", "Min file count");
    cy.get(commonWidgetSelector.parameterLabel("Max file count")).should("have.text", "Max file count");

    // Both accept a value and it persists.
    verifyAndModifyParameter("Max file count", "{{2}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "2 files selected");

    // Turning multiple off hides both again.
    clearSelectedFile();
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("Min file count")).should("not.exist");
    cy.get(commonWidgetSelector.parameterLabel("Max file count")).should("not.exist");

    // NOT asserted: exceeding the cap. Going over it currently produces no
    // rejection and no feedback (the batch is silently sliced to maxFileCount,
    // useFilePicker.js:347) — known, dev has a fix in flight. Add the
    // over-cap rejection case here once that lands.
  });
});
