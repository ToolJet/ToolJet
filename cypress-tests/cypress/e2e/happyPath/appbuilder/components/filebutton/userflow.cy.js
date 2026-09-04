import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText, fileButtonFixtures } from "Texts/appBuilder/components/fileButton";
import { openEditorSidebar, verifyAndModifyParameter } from "Support/utils/commonWidget";
import {
  dropWidget,
  commitChange,
  closeQueryPanel,
  verifyExposedValue,
  clearSelectedFile,
  selectFileType,
  selectValidationFileType,
  expectRejectionToast,
  openParsedValue,
  closeParsedValue,
} from "Support/utils/appBuilder/components/fileButton";

// Userflow facet — end-to-end builder journeys. No config items of its own; it covers
// COMBINATIONS that properties.cy.js only exercises in isolation.
//   mandatory CSV upload — buttonText:15 + fileType:110 + parseContent:27 + enableValidation:105
//   multi-file parsing   — enableMultiple:21 + parseContent:27, plus isParsing:289 settling
// The failures worth catching here are interactions between settings that each pass
// on their own.

describe(
  "File Button userflow",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;
  const { validFile, csvFile, secondCsvFile, csvFileName } = fileButtonFixtures;

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

  // The canonical File Button app: button text + accepted types + parsing + mandatory,
  // driven through reject, accept and clear.
  it("should build a mandatory CSV upload field and drive it through reject, accept and clear", () => {
    // The "*" renders INSIDE the label span (FileButton.jsx:236), so the label's text
    // carries it — for a filename as much as for the placeholder.
    const mandatoryLabel = (text) => `${text}*`;

    openEditorSidebar(widget);
    verifyAndModifyParameter("Button text", "Upload CSV");
    commitChange();

    // Restrict to spreadsheets, so a PNG is now the wrong kind of file.
    openEditorSidebar(widget);
    selectValidationFileType("Spreadsheet files");

    // Parse what arrives, as CSV.
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    selectFileType("CSV");

    // Required, so an empty field is invalid before anything is picked.
    cy.get(commonWidgetSelector.parameterTogglebutton("Make this field mandatory")).click();
    cy.waitForAutoSave();

    cy.get(fileButtonSelector.label(widget)).should("have.text", mandatoryLabel("Upload CSV"));
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("be.visible");
    verifyExposedValue("isValid", "Boolean", "false");

    // 1. The wrong kind of file is refused, and the field stays invalid.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
    expectRejectionToast(".xls,.xlsx,.csv,.ods");
    cy.get(fileButtonSelector.label(widget)).should("have.text", mandatoryLabel("Upload CSV"));
    verifyExposedValue("isValid", "Boolean", "false");

    // 2. The right kind is accepted, parsed, and satisfies the requirement.
    clearSelectedFile();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", mandatoryLabel(csvFileName));
    verifyExposedValue("isValid", "Boolean", "true");
    verifyExposedValue("files", "Array", "[1]");

    // Parsing ran: sample-a.csv has 3 data rows, one object each.
    openParsedValue();
    cy.get('[data-cy="inspector-parsedvalue-value"]').first().should("have.text", "[3]");
    closeParsedValue();

    // 3. Clearing returns the field to its empty, invalid, requirement-unmet state.
    clearSelectedFile();
    cy.get(fileButtonSelector.label(widget)).should("have.text", mandatoryLabel("Upload CSV"));
    verifyExposedValue("files", "Array", "[0]");
    verifyExposedValue("isValid", "Boolean", "false");
  });

  // Parsing applied to a MULTI-file selection — every other parse case holds exactly
  // one file. (Count bounds are covered in properties.cy.js, not repeated here.)
  it("should build a multi-file parsing upload and settle after parsing both files", () => {
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();

    // Parse whatever arrives, as CSV.
    cy.get(commonWidgetSelector.parameterTogglebutton("Parse file content")).click();
    cy.waitForAutoSave();
    selectFileType("CSV");

    // Two CSVs at once: the label switches from a filename to the count form.
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", fileButtonText.multiFileLabel(2));
    verifyExposedValue("files", "Array", "[2]");

    // Parsing ran across the batch rather than only the first entry: sample-a.csv has
    // 3 data rows, one row object each.
    openParsedValue();
    cy.get('[data-cy="inspector-parsedvalue-value"]').first().should("have.text", "[3]");
    closeParsedValue();

    // isParsing is transient; inspector.cy.js only sees its initial false. Asserting it
    // again after a real parse shows it resets rather than latching on.
    verifyExposedValue("isParsing", "Boolean", "false");
  });
});
