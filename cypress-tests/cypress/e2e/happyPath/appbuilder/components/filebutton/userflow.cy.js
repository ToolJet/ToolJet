import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText, fileButtonFixtures } from "Texts/appBuilder/components/fileButton";
import {
  verifyExposedValue,
  commitChange,
  openEditorSidebar,
  verifyAndModifyParameter,
  dropWidget,
} from "Support/utils/commonWidget";
import {
  clearSelectedFile,
  selectFileType,
  selectValidationFileType,
  expectRejectionToast,
} from "Support/utils/appBuilder/components/fileButton";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import {
  interceptFileChooser,
  trackFileInputActivation,
  fileInputActivations,
} from "Support/utils/appBuilder/components/fileInput";

// Userflow facet — end-to-end builder journeys. No config items of its own; it covers
// COMBINATIONS that properties.cy.js only exercises in isolation.
//   mandatory CSV upload — buttonText:15 + fileType:110 + parseContent:27 + enableValidation:105
//   multi-file parsing   — enableMultiple:21 + parseContent:27, plus isParsing:289 settling
// The failures worth catching here are interactions between settings that each pass
// on their own.

describe(
  "File Button userflow",
  { testIsolation: false },
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

  afterEach(() => {
    cy.apiDeleteApp();
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
    verifyExposedValue("isValid", "Boolean", "false", widget);

    // 1. The wrong kind of file is refused, and the field stays invalid.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("be.visible");
    expectRejectionToast(".xls,.xlsx,.csv,.ods");
    cy.get(fileButtonSelector.label(widget)).should("have.text", mandatoryLabel("Upload CSV"));
    verifyExposedValue("isValid", "Boolean", "false", widget);

    // 2. The right kind is accepted, parsed, and satisfies the requirement.
    clearSelectedFile();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", mandatoryLabel(csvFileName));
    verifyExposedValue("isValid", "Boolean", "true", widget);
    verifyExposedValue("files", "Array", "[1]", widget);

    // Parsing ran: sample-a.csv has 3 data rows, one object each.
    verifyExposedValue(["files", "0", "parsedValue"], "Array", "[3]", widget);

    // 3. Clearing returns the field to its empty, invalid, requirement-unmet state.
    clearSelectedFile();
    cy.get(fileButtonSelector.label(widget)).should("have.text", mandatoryLabel("Upload CSV"));
    verifyExposedValue("files", "Array", "[0]", widget);
    verifyExposedValue("isValid", "Boolean", "false", widget);
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
    verifyExposedValue("files", "Array", "[2]", widget);

    // Parsing ran across the batch rather than only the first entry: sample-a.csv has
    // 3 data rows, one row object each.
    verifyExposedValue(["files", "0", "parsedValue"], "Array", "[3]", widget);

    // isParsing is transient; inspector.cy.js only sees its initial false. Asserting it
    // again after a real parse shows it resets rather than latching on.
    verifyExposedValue("isParsing", "Boolean", "false", widget);
  });
});

// ── FileButton-BRW-001: Browse opens the native file dialog ─────────────────
// Mechanism (react-dropzone, picker forced on / dropzone forced off — FileButton.jsx mergedProperties): the
// Browse button's onClick is the dropzone root's onClick (FileButton.jsx `openFilePicker`), which calls
// inputRef.click() on the hidden <input type="file">. Chromium shows the OS chooser for that activation only when
// the page holds transient user activation and nothing cancels the click's default action. The OS window itself is
// outside the page and cannot be observed: CDP file-chooser interception keeps it from blocking the run, and the
// spec asserts the browser-level contract that makes it appear — a REAL click on Browse reaches the file input with
// user activation, un-cancelled — then hands the input the file a user would pick.
// Controls: a script-dispatched click lacks user activation; a disabled button never activates its input.
describe("File Button — native file dialog (viewer)", { testIsolation: false }, () => {
  const W = "fbpicker"; // dynamic: seeded widget names
  const DISABLED = "fbdisabled";
  const PROBE = "fbpicked";
  const { validFile, validFileName } = fileButtonFixtures;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-FileButton-userflow`);
    addIconsViaApi([
      { type: "FileButton", name: W, layout: { top: 40, left: 2, width: 10, height: 40 } },
      {
        type: "FileButton",
        name: DISABLED,
        layout: { top: 120, left: 2, width: 10, height: 40 },
        properties: { disabledState: { value: "{{true}}" } }, // source: fileButton.js:75
      },
      {
        type: "Text",
        name: PROBE,
        layout: { top: 200, left: 2, width: 14, height: 40 },
        properties: { text: { value: `{{components.${W}.files.map((f) => f.name).join(',') || 'none'}}` } },
      },
    ]);
    interceptFileChooser();
    openIconAppInViewer(fileButtonSelector.button(W));
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("[FileButton-BRW-001] Clicking Browse opens the native file picker on the real file input, and the picked file lands in the widget", () => {
    const input = fileButtonSelector.inputField(W);
    cy.get(input).should("have.attr", "type", "file").and("not.be.disabled");
    cy.get(fileButtonSelector.label(W)).should("have.text", fileButtonText.defaultLabel);
    cy.get(commonWidgetSelector.draggableWidget(PROBE)).should("contain.text", "none");

    // Control first (transient user activation outlives a real click by seconds, so this must precede it): a
    // script-dispatched click reaches the input too, but WITHOUT user activation — the browser refuses to show a
    // chooser for it. Proves the userActivation check below discriminates.
    trackFileInputActivation(input);
    cy.get(fileButtonSelector.button(W)).click();
    fileInputActivations(input).then((activations) => {
      expect(activations, "synthetic click → one activation").to.have.length(1);
      expect(activations[0].userActivation, "synthetic click carries no user activation").to.eq(false);
    });

    // 1. A real click on Browse activates the hidden file input exactly once, with user activation, un-cancelled.
    trackFileInputActivation(input);
    cy.get(fileButtonSelector.button(W)).realClick({ scrollBehavior: false });
    fileInputActivations(input).then((activations) => {
      expect(activations, "Browse click → one activation of the file input").to.have.length(1);
      expect(activations[0], "activation that opens the native chooser").to.deep.eq({
        type: "file",
        disabled: false,
        connected: true,
        userActivation: true,
        trusted: false, // inputRef.click() — a programmatic click inside the trusted click's handler
        prevented: false,
      });
    });

    // 2. The chooser's result: the file the user picks lands in the widget and its exposed value.
    cy.get(input).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(W)).should("have.text", validFileName);
    cy.get(commonWidgetSelector.draggableWidget(PROBE)).should("contain.text", validFileName);

    // Control: a disabled File Button never activates its input (native disabled <button>; react-dropzone
    // `disabled` drops the root click handler).
    const disabledInput = fileButtonSelector.inputField(DISABLED);
    trackFileInputActivation(disabledInput);
    cy.get(fileButtonSelector.button(DISABLED)).should("be.disabled").realClick({ scrollBehavior: false });
    fileInputActivations(disabledInput).should("have.length", 0);
    cy.get(fileButtonSelector.label(DISABLED)).should("have.text", fileButtonText.defaultLabel);
  });
});
