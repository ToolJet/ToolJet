import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText, fileButtonFixtures, acceptedTypeCases } from "Texts/appBuilder/components/fileButton";
import { openEditorSidebar, openAccordion, verifyAndModifyParameter } from "Support/utils/commonWidget";
import {
  dropWidget,
  dropCompanionToggle,
  enableFxAndBind,
  commitChange,
  closeQueryPanel,
  verifyExposedValue,
  clearSelectedFile,
  clearParameter,
  clickWidgetInput,
  selectFileType,
  validationFileTypeWrapper,
  expectRejectionToast,
  openParsedValue,
  closeParsedValue,
  expectNoFxButton,
  widgetTooltip,
  hoverTriggerInPreview,
} from "Support/utils/appBuilder/components/fileButton";

// The fx / dynamic-binding half of the properties facet; the direct-control half lives
// in properties.cy.js. Every test binds the field to a COMPANION widget then drives the
// companion — changing the source is what proves the binding stays live rather than
// having resolved once at bind time. Each test sets up its own pre-state.

describe(
  "File Button properties fx",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;
  const { validFile, csvFile, secondCsvFile, semicolonCsvFile } = fileButtonFixtures;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    dropWidget(fileButtonText.defaultWidgetText, widget, 500, 100);
    cy.waitForElement(fileButtonSelector.button(widget));
    closeQueryPanel();
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  it("should verify Button text resolves and re-resolves a binding", () => {
    dropWidget("Text Input", "textinput1");
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

  it("should verify Enable multiple files follows a bound boolean", () => {
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    enableFxAndBind("Enable multiple files", "{{components.toggleswitch1.value}}");
    commitChange();
    // Toggle Switch defaults to false, so the bound field starts off.
    cy.get(fileButtonSelector.inputField(widget)).scrollIntoView().should("not.have.attr", "multiple");

    clickWidgetInput("toggleswitch1");
    cy.get(fileButtonSelector.inputField(widget)).scrollIntoView().should("have.attr", "multiple");
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.multiFileLabel(2));
  });

  it("should verify Parse file content follows a bound boolean, revealing File type", () => {
    // File type is conditionallyRender'd on parseContent, so whether its label
    // exists is what proves the bound value reached the widget.
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    enableFxAndBind("Parse file content", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("not.exist");

    clickWidgetInput("toggleswitch1");
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("have.text", "File type");
  });

  it("should verify File type drives parsing when bound", () => {
    // Parsing must be on before File type renders at all.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();

    // An fx-bound File type must drive parsing exactly as the dropdown does:
    // CSV through PapaParse with header:true yields one row object per data row
    // (sample-a.csv has 3).
    enableFxAndBind("File type", '{{"csv"}}');
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    openParsedValue();
    cy.get('[data-cy="inspector-parsedvalue-value"]').first().should("have.text", "[3]");
    closeParsedValue();
  });

  it("should verify Delimiter resolves a binding, changing how a CSV splits", () => {
    // Delimiter only renders under Parse file content + CSV, so both come first.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    selectFileType("CSV");

    // The delimiter character comes from a Text Input, so the source is a string.
    dropWidget("Text Input", "textinput1");
    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", ";");
    commitChange();

    openEditorSidebar(widget);
    verifyAndModifyParameter("Delimiter", "{{components.textinput1.value}}");
    commitChange();

    // Row count is identical either way, so only the key count per row shows the
    // split: the bound ";" finds this file's 3 real columns.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(semicolonCsvFile, { force: true });
    openParsedValue();
    cy.get('[data-cy="inspector-parsedvalue-label"]').first().click();
    cy.get('[data-cy="inspector-1-value"]').first().should("have.text", "{3}");
    closeParsedValue();
  });

  it("should verify Tooltip content resolves a binding", () => {
    dropWidget("Text Input", "textinput1");
    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", "Bound tooltip text");
    commitChange();

    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(commonWidgetSelector.tooltipInputField).clearAndTypeOnCodeMirror(
      "{{components.textinput1.value}}"
    );
    commitChange();

    // Only observable on the preview — the editor canvas swallows the pointer
    // events Radix needs to open it.
    hoverTriggerInPreview(widget);
    cy.get(widgetTooltip).should("contain.text", "Bound tooltip text");
  });

  it("should verify Min file count resolves a binding to a numeric source", () => {
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();

    dropWidget("Number Input", "numberinput1");
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "2");
    commitChange();

    openEditorSidebar(widget);
    verifyAndModifyParameter("Min file count", "{{components.numberinput1.value}}");
    commitChange();

    // A bound floor of 2 makes one file an under-count.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");

    // Two files clear the same bound floor.
    clearSelectedFile();
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.multiFileLabel(2));
  });

  it("should verify Max file count resolves a binding to a numeric source", () => {
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();

    dropWidget("Number Input", "numberinput1");
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "2");
    commitChange();

    openEditorSidebar(widget);
    verifyAndModifyParameter("Max file count", "{{components.numberinput1.value}}");
    commitChange();

    // A batch AT the bound cap is accepted.
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.multiFileLabel(2));

    // NOT asserted: exceeding the bound cap — the batch is silently sliced
    // (useFilePicker.js:347). That open bug has its own guard in customerIssues.cy.js.
  });

  it("should verify Make this field mandatory follows a bound boolean", () => {
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

  it("should verify Accepted file types via fx: bound values gate the same way", () => {
    openEditorSidebar(widget);
    // Its fx button and CodeHinter live under the FxSelect's own wrapper, not
    // behind the usual parameter* data-cy attributes.
    cy.get('[data-cy="filetype-fx-button"]').click();

    acceptedTypeCases.forEach(({ value, accept, acceptName, reject }) => {
      clearSelectedFile();
      openEditorSidebar(widget);
      cy.get(validationFileTypeWrapper).find(".cm-content").clearAndTypeOnCodeMirror(`{{"${value}"}}`);
      commitChange();

      cy.get(fileButtonSelector.inputField(widget)).selectFile(reject, { force: true });
      // Indicator FIRST: each rejection schedules an uncancelled
      // clearErrorStates() 10s later (useFilePicker.js:253), so an earlier
      // iteration's timer can wipe this message mid-check.
      cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
      expectRejectionToast(value);
      cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.defaultLabel);

      clearSelectedFile();
      cy.get(fileButtonSelector.inputField(widget)).selectFile(accept, { force: true });
      cy.get(fileButtonSelector.label(widget)).should("have.text", acceptName);
    });
  });

  it("should verify Min size and Max size resolve a binding to another component's value", () => {
    // Both are `type:'code'`, so they take an expression with no fx toggle.
    dropWidget("Number Input", "numberinput1");
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "5000");
    commitChange();

    // Min size = 5000 via the binding, so the 1934-byte file is too small.
    openEditorSidebar(widget);
    verifyAndModifyParameter("Min size (bytes)", "{{components.numberinput1.value}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");

    // Change the SOURCE, not the field: proves the threshold re-resolves live.
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "100");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonFixtures.validFileName);

    // The same source now drives Max size: at 100 bytes it's a cap the file
    // exceeds, so the identical binding rejects where it just accepted.
    clearSelectedFile();
    openEditorSidebar(widget);
    clearParameter("Min size (bytes)");
    verifyAndModifyParameter("Max size (bytes)", "{{components.numberinput1.value}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");

    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "5000");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonFixtures.validFileName);
  });

  it("should verify Enable clear selection follows a bound boolean", () => {
    // The clear button only renders while a file is held, so the file IS the
    // precondition for this field being observable at all.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.clearButton(widget)).should("exist");

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

  it("should verify Loading state follows a bound boolean", () => {
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

  it("should verify Visibility follows a bound boolean", () => {
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    enableFxAndBind("Visibility", "{{components.toggleswitch1.value}}");
    commitChange();
    // Turning visibility off unmounts the widget entirely (returns null).
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");
    verifyExposedValue("isVisible", "Boolean", "false");

    clickWidgetInput("toggleswitch1");
    cy.get(fileButtonSelector.widget(widget)).scrollIntoView().should("exist");
    verifyExposedValue("isVisible", "Boolean", "true");
  });

  it("should verify Disable follows a bound boolean", () => {
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

  // ── NEGATIVE: the one property field declaring isFxNotRequired ──────────────
  it("should verify Tooltip format exposes no fx button, while the Tooltip code field does", () => {
    // tooltipFormat (fileButton.js:89) is the only fx-exempt property field. It cannot
    // be asserted by name: it shares the displayName "Tooltip" with the fx-CAPABLE
    // `tooltip` code field (fileButton.js:97), so `tooltip-fx-button` genuinely exists.
    // Locate it by its own option button instead.
    openEditorSidebar(widget);
    openAccordion("Additional Actions");

    // data-cy comes from the option VALUE ('plainText'), not its displayName — camelCase,
    // not kebab.
    expectNoFxButton(() => cy.get('[data-cy="togglr-button-plainText"]').scrollIntoView(), "Tooltip");
  });
});
