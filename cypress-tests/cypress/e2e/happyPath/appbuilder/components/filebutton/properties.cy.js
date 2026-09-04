import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText, fileButtonFixtures, acceptedTypeCases } from "Texts/appBuilder/components/fileButton";
import { openEditorSidebar, openAccordion, verifyAndModifyParameter } from "Support/utils/commonWidget";
import {
  dropWidget,
  commitChange,
  closeQueryPanel,
  verifyExposedValue,
  clearSelectedFile,
  clearParameter,
  selectFileType,
  selectValidationFileType,
  expectRejectionToast,
  openParsedValue,
  closeParsedValue,
  widgetTooltip,
  hoverTriggerInPreview,
} from "Support/utils/appBuilder/components/fileButton";

// Direct-control half: each property driven by its own toggle/dropdown/code field.
// The fx/dynamic-binding half lives in propertiesFx.cy.js.

// One node per format (WidgetTooltip.jsx): plainText -> plain <span>,
// markdown -> .widget-tooltip-markdown, html -> .widget-tooltip-html.
// Raw HTML can't be typed: the tokenizer drops `<`, `>` and `/`, so "<b>x</b>"
// arrives as "bxb". Pass it as {{"..."}}, which is preserved whole.
const setTooltip = (format, content) => {
  cy.get(`[data-cy="togglr-button-${format}"]`).click();
  cy.waitForAutoSave();
  cy.get(commonWidgetSelector.tooltipInputField).clearAndTypeOnCodeMirror(content);
  // Confirm it landed: an empty tooltip renders no node at all, which looks
  // the same as a hover that failed.
  cy.get(commonWidgetSelector.tooltipInputField).should("contain.text", content.replace(/[{}"]/g, "").trim());
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

// Configure in the editor, then verify on the preview — where the tooltip can
// actually open (see hoverTriggerInPreview).
const showTooltipInPreview = (name, format, content) => {
  openEditorSidebar(name);
  openAccordion("Additional Actions");
  setTooltip(format, content);
  hoverTriggerInPreview(name);
};

describe(
  "File Button properties",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;
  const { validFile, csvFile, secondCsvFile, jsonFile, semicolonCsvFile } = fileButtonFixtures;

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

  it("should verify Button text: direct change", () => {
    openEditorSidebar(widget);
    verifyAndModifyParameter("Button text", "Direct Button Text");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).should("have.text", "Direct Button Text");
  });

  it("should verify Enable multiple files: direct toggle", () => {
    // Maps to the input's `multiple` attr. React omits false booleans, so
    // absence means off.
    openEditorSidebar(widget);
    cy.get(fileButtonSelector.inputField(widget)).should("not.have.attr", "multiple");

    // NOT tested: two files while this is off. `multiple` gates the OS chooser
    // (useFilePicker.js:415), so a user can only ever pick one. Forcing it via
    // the hidden input tests a path no user can reach.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonFixtures.csvFileName);

    // Toggle ON: two files are accepted together.
    clearSelectedFile();
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.inputField(widget)).should("have.attr", "multiple");
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.multiFileLabel(2));

    // Toggle back OFF: one file still accepted, attribute gone.
    clearSelectedFile();
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.inputField(widget)).should("not.have.attr", "multiple");
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonFixtures.csvFileName);
  });

  it("should verify Parse file content: direct toggle reveals and hides File type", () => {
    // File type is conditionallyRender'd on parseContent, so whether its label
    // exists is what proves the toggle worked.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("not.exist");

    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("have.text", "File type");

    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("not.exist");
  });

  it("should verify File type: the panel chain reveals Delimiter only for CSV", () => {
    // Panel visibility only; the next test covers whether it changes parsing.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();

    // Default is "Autodetect from extension", so Delimiter stays hidden.
    cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("not.exist");

    // CSV is the only option that reveals Delimiter.
    selectFileType("CSV");
    cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("have.text", "Delimiter");

    // Any non-CSV type hides it again.
    selectFileType("JSON");
    cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("not.exist");

    // Turning parsing off hides File type itself, collapsing the whole chain.
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("not.exist");
    cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("not.exist");
  });

  it("should verify File type actually drives parsing, by dropdown", () => {
    // Parsed output is read from the Inspector (files[0].parsedValue) rather
    // than bound into a second widget. CSV goes through PapaParse with
    // header:true, JSON through JSON5.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();

    // CSV yields an ARRAY of row objects, one per data row (sample-a.csv has 3).
    selectFileType("CSV");
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    openParsedValue();
    cy.get('[data-cy="inspector-parsedvalue-value"]').first().should("have.text", "[3]");
    closeParsedValue();

    // JSON yields an OBJECT of 2 keys instead: same upload path, different
    // structure purely because of File type.
    clearSelectedFile();
    openEditorSidebar(widget);
    selectFileType("JSON");
    cy.get(fileButtonSelector.inputField(widget)).selectFile(jsonFile, { force: true });
    openParsedValue();
    cy.get('[data-cy="inspector-parsedvalue-value"]').first().should("have.text", "{2}");
    closeParsedValue();
  });

  it("should verify Delimiter changes how a CSV splits into columns", () => {
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    selectFileType("CSV");

    // Row count is identical either way, so only the key count per row shows
    // the split. Default "," on a semicolon file gives one column: {1}.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(semicolonCsvFile, { force: true });
    openParsedValue();
    cy.get('[data-cy="inspector-parsedvalue-label"]').first().click();
    cy.get('[data-cy="inspector-1-value"]').first().should("have.text", "{1}");
    closeParsedValue();

    // Matching the delimiter splits the same file into its 3 real columns.
    clearSelectedFile();
    openEditorSidebar(widget);
    verifyAndModifyParameter("Delimiter", ";");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(semicolonCsvFile, { force: true });
    openParsedValue();
    cy.get('[data-cy="inspector-parsedvalue-label"]').first().click();
    cy.get('[data-cy="inspector-1-value"]').first().should("have.text", "{3}");
    closeParsedValue();
  });

  it("should verify Make this field mandatory: direct toggle", () => {
    openEditorSidebar(widget);
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("not.exist");
    verifyExposedValue("isMandatory", "Boolean", "false");
    // isValid starts as !isMandatory (useFilePicker.js:77): nothing is
    // required yet, so an empty field is already valid.
    verifyExposedValue("isValid", "Boolean", "true");

    cy.get(commonWidgetSelector.parameterTogglebutton("Make this field mandatory")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("be.visible");
    cy.get(fileButtonSelector.ariaRequired(widget)).should("exist");
    verifyExposedValue("isMandatory", "Boolean", "true");

    // Required with nothing selected, so invalid until a file satisfies it.
    verifyExposedValue("isValid", "Boolean", "false");
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    verifyExposedValue("isValid", "Boolean", "true");
    clearSelectedFile();
    verifyExposedValue("isValid", "Boolean", "false");

    cy.get(commonWidgetSelector.parameterTogglebutton("Make this field mandatory")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("not.exist");
    verifyExposedValue("isMandatory", "Boolean", "false");
  });

  it("should verify Accepted file types: every option accepts its own kind and rejects others", () => {
    // This field's label renders as "File type", not its config displayName
    // "Accepted file types": FilePicker.jsx hardcodes it.
    openEditorSidebar(widget);

    // Default is Any Files, so anything goes.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonFixtures.validFileName);

    // Per option: a different kind is refused, then its own kind accepted. The
    // pair is what proves it filters by type rather than blocking everything.
    acceptedTypeCases.forEach(({ option, value, accept, acceptName, reject }) => {
      clearSelectedFile();
      openEditorSidebar(widget);
      selectValidationFileType(option);

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

  it("should verify Min size and Max size: literal thresholds reject out-of-range files, and clearing a field lifts that restriction", () => {
    // tooljet.png is 1934 bytes; every threshold below sits either side of it,
    // so each phase is a real transition rather than a repeat.
    openEditorSidebar(widget);

    // 1. Min size above the file's size, so it's rejected as too small.
    verifyAndModifyParameter("Min size (bytes)", "{{5000}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");

    // 2. Clearing Min size lifts the floor. Empty really is unrestricted here:
    // minSize falls back to 0 for any non-number (useFilePicker.js:46).
    openEditorSidebar(widget);
    clearParameter("Min size (bytes)");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonFixtures.validFileName);

    // 3. Min back in range, Max below the file's size, so rejected as too large.
    clearSelectedFile();
    openEditorSidebar(widget);
    verifyAndModifyParameter("Min size (bytes)", "{{100}}");
    verifyAndModifyParameter("Max size (bytes)", "{{500}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");

    // 4. Clearing Max size lifts the 500-byte cap. This proves the cap is GONE,
    // not that it's unlimited: empty falls back to 51200000
    // (useFilePicker.js:45), so >51MB is still rejected. Telling that apart
    // from the declared 1048576 default needs a >1MB fixture, not worth adding.
    openEditorSidebar(widget);
    clearParameter("Max size (bytes)");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonFixtures.validFileName);

    // 5. Max size above the file's size, so accepted.
    clearSelectedFile();
    openEditorSidebar(widget);
    verifyAndModifyParameter("Max size (bytes)", "{{5000}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonFixtures.validFileName);
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

    verifyAndModifyParameter("Max file count", "{{2}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.multiFileLabel(2));

    clearSelectedFile();
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("Min file count")).should("not.exist");
    cy.get(commonWidgetSelector.parameterLabel("Max file count")).should("not.exist");

    // NOT asserted: exceeding the cap. Going over produces no rejection and no
    // feedback (the batch is sliced to maxFileCount, useFilePicker.js:347).
    // Issue raised, fix in flight; add the rejection case once it lands.
  });

  it("should verify Min file count: below the floor is rejected, at or above it is accepted", () => {
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();

    // A floor of 2 makes a single file an under-count rather than a valid pick,
    // which is the only way this field is observable at all.
    verifyAndModifyParameter("Min file count", "{{2}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");

    // Two files clears the same floor, so the identical control now accepts.
    clearSelectedFile();
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.multiFileLabel(2));
  });

  it("should verify Enable clear selection: direct toggle", () => {
    // Lives in the collapsed "Additional Actions" accordion.
    openEditorSidebar(widget);
    openAccordion("Additional Actions");

    // Default is true, so with a file held the clear button should exist.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.clearButton(widget)).should("exist");

    // Toggle off with the file still held.
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable clear selection")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.clearButton(widget)).should("not.exist");

    cy.get(commonWidgetSelector.parameterTogglebutton("Enable clear selection")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.clearButton(widget)).should("exist");
  });

  it("should verify Loading state: direct toggle", () => {
    // Loader and label/icon/clear are mutually exclusive (isLoading branch).
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(fileButtonSelector.loader(widget)).should("not.exist");
    cy.get(fileButtonSelector.label(widget)).should("be.visible");
    verifyExposedValue("isLoading", "Boolean", "false");

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
  });

  it("should verify Visibility: direct toggle", () => {
    // Turning visibility off unmounts the widget entirely (returns null).
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(fileButtonSelector.widget(widget)).should("exist");
    verifyExposedValue("isVisible", "Boolean", "true");

    // The panel stays open even once the widget unmounts.
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");
    verifyExposedValue("isVisible", "Boolean", "false");

    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.widget(widget)).should("exist");
    verifyExposedValue("isVisible", "Boolean", "true");
  });

  it("should verify Disable: direct toggle", () => {
    // Disable sets a real native :disabled on the trigger, not just aria.
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(fileButtonSelector.button(widget)).should("not.be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "false");

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "true");

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("not.be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "false");
  });

  // Plain text and Markdown share this string, so only the format switch can
  // explain their different output.
  const markup = "**Bold** tip";
  // Radix renders the content TWICE (once visibly, once in a VisuallyHidden
  // copy), so every match below needs .first(); unscoped `have.text` sees
  // "BoldBold".

  it("should verify Tooltip in Plain text format: content stays literal", () => {
    showTooltipInPreview(widget, "plainText", markup);
    cy.get(widgetTooltip).find("span.tw-whitespace-pre-wrap").first().should("have.text", markup);
    cy.get(".widget-tooltip-markdown").should("not.exist");
    cy.get(".widget-tooltip-html").should("not.exist");
  });

  it("should verify Tooltip in Markdown format: asterisks become emphasis", () => {
    showTooltipInPreview(widget, "markdown", markup);
    cy.get(".widget-tooltip-markdown").should("exist");
    cy.get(".widget-tooltip-markdown").find("strong").first().should("have.text", "Bold");
  });

  it("should verify Tooltip in HTML format: tags are parsed, not escaped", () => {
    showTooltipInPreview(widget, "html", '{{"<b>HTML</b> tip"}}');
    cy.get(".widget-tooltip-html").should("exist");
    cy.get(".widget-tooltip-html").find("b").first().should("have.text", "HTML");
  });
});
