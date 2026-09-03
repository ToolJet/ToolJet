import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { openEditorSidebar, openAccordion, verifyAndModifyParameter } from "Support/utils/commonWidget";
import { openNode, openSubNode, backFromDetail, verifyNodeData } from "Support/utils/appBuilder/inspectorTree";

// FilePicker.jsx hand-rolls this field, so it has no `parameter*` data-cy.
// Its name comes from paramName (`fileType`), not its "File type" label.
const validationFileTypeWrapper = '[data-cy="filetype-fx-select"]';

// Only exists while the Components panel is expanded, so it doubles as a
// probe for whether that panel is open.
const widgetSearchBar = '[data-cy="widget-search-box-search-bar"]';

const enableFxAndBind = (paramName, expression) => {
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  verifyAndModifyParameter(paramName, expression);
};

// Leaves a `type:'code'` field truly empty. verifyAndModifyParameter can't:
// it types " " before the value, and a space is a non-empty string, which the
// widget reads differently from nothing. Passing "" types nothing after the
// backspaces, since the tokenizer matches nothing (commands.js:206).
const clearParameter = (paramName) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).scrollIntoView().should("have.text", paramName);
  cy.get(commonWidgetSelector.parameterInputField(paramName)).clearAndTypeOnCodeMirror("");
  // No digits left, rather than have.text "": an empty CodeMirror can render a
  // .cm-placeholder whose text would count. Any leftover value has a digit.
  cy.get(commonWidgetSelector.parameterInputField(paramName))
    .find(".cm-content")
    .invoke("text")
    .should("not.match", /\d/);
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

// Drag, then let the drop settle before anything reads its position. The
// instance name is passed, not derived, because the test body references it in
// its binding expression.
const dropWidget = (widgetName, instanceName, x = 500, y = 300) => {
  // cy.dragAndDropWidget opens the Components panel by clicking a button that
  // TOGGLES it (commands.js:101), so it only works from a closed panel. A drop
  // right after another drop would click it shut and then time out on the
  // search box. Collapse it first so a drop works from either state.
  cy.get("body").then(($body) => {
    if ($body.find(`${widgetSearchBar}:visible`).length) {
      cy.get('[data-cy="right-sidebar-components-button"]').click();
    }
  });
  cy.dragAndDropWidget(widgetName, x, y);
  waitForDropSettle(instanceName);
};

// Toggle Switch is the common companion here, so it keeps a named shortcut.
const dropCompanionToggle = (x, y) => dropWidget("Toggle Switch", "toggleswitch1", x, y);

// Both selects are react-select and portal their menu to document.body, so
// options can't be found under the wrapper. The shared selectFromSidebarDropdown
// is unusable too: it calls .type() on what is a div.
const selectFileType = (option) => {
  cy.get('[data-cy="dropdown-file-type"]').find(".react-select__control").click();
  // Exact match: .contains("XLS") would also hit "XLSX".
  cy.get(".react-select__option").filter((_i, el) => el.innerText.trim() === option).click();
  cy.waitForAutoSave();
};

// The Validation section's own file-type field (see validationFileTypeWrapper).
const selectValidationFileType = (option) => {
  cy.get(validationFileTypeWrapper).find(".react-select__control").click();
  cy.get(".react-select__option").filter((_i, el) => el.innerText.trim() === option).click();
  cy.waitForAutoSave();
};

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

// Radix, not bootstrap: renders [data-cy="widget-tooltip"], never
// `.tooltip-inner`, and needs real pointer events. A synthetic `mouseover`
// never opens it.
const widgetTooltip = '[data-cy="widget-tooltip"]';

// Only opens in PREVIEW: on the editor canvas the drag/resize overlays swallow
// the pointer events Radix needs. Configure in the editor, verify in preview.
const showTooltipInPreview = (name, format, content) => {
  openEditorSidebar(name);
  openAccordion("Additional Actions");
  setTooltip(format, content);
  cy.openInCurrentTab(commonWidgetSelector.previewButton);
  cy.get(fileButtonSelector.button(name)).should("be.visible").realHover();
  // Radix mounts the content only after 500ms of sustained hover.
  cy.wait(900);
};

// Desktop/mobile canvas switch in the editor header. A widget hidden by the
// Devices toggles unmounts, so anything needing its Inspector must be done
// from the layout where it is still visible.
const switchLayout = (target) => {
  cy.get(`[data-cy="button-change-layout-to-${target}"]`).click();
  cy.waitForAutoSave();
};

// The panel's open state persists across tests, so check before clicking.
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
  const csvFile = "cypress/fixtures/files/sample-a.csv";
  const secondCsvFile = "cypress/fixtures/files/sample-b.csv";
  const jsonFile = "cypress/fixtures/files/sample.json";
  const semicolonCsvFile = "cypress/fixtures/files/sample-semicolon.csv";
  const pdfFile = "cypress/fixtures/files/sample.pdf";
  const mp3File = "cypress/fixtures/files/sample.mp3";
  const mp4File = "cypress/fixtures/files/sample.mp4";
  const zipFile = "cypress/fixtures/files/sample.zip";

  // One row per option (FILE_TYPE_OPTIONS, FilePicker.jsx): `option` is the
  // dropdown label, `value` the pattern the fx path sets. "Any Files" is
  // excluded, having no negative case.
  const acceptedTypeCases = [
    { option: "Image files", value: "image/*", accept: validFile, acceptName: "tooljet.png", reject: csvFile },
    { option: "Document files", value: ".pdf,.doc,.docx,.ppt,.pptx", accept: pdfFile, acceptName: "sample.pdf", reject: validFile },
    { option: "Spreadsheet files", value: ".xls,.xlsx,.csv,.ods", accept: csvFile, acceptName: "sample-a.csv", reject: validFile },
    { option: "Text files", value: "text/*,.md,.json,.xml,.yaml", accept: jsonFile, acceptName: "sample.json", reject: validFile },
    { option: "Audio files", value: "audio/*", accept: mp3File, acceptName: "sample.mp3", reject: validFile },
    { option: "Video files", value: "video/*", accept: mp4File, acceptName: "sample.mp4", reject: validFile },
    { option: "Archive/Compressed files", value: ".zip,.rar,.7z,.tar,.gz", accept: zipFile, acceptName: "sample.zip", reject: validFile },
  ];

  // useFilePicker's duplicate guard silently drops a file it already holds,
  // before validation runs. Clear first or the next selectFile is a no-op.
  const clearSelectedFile = () => {
    cy.get("body").then(($body) => {
      if ($body.find(fileButtonSelector.clearButton(widget)).length) {
        cy.get(fileButtonSelector.clearButton(widget)).click();
      }
    });
  };

  // The toast names the accepted patterns, a stronger signal than "nothing was
  // selected". Dismiss it: left alone, toasts stack over the clear button.
  const expectRejectionToast = (types) => {
    cy.get(commonSelectors.toastMessage).should("contain.text", types);
    cy.get("body").then(($b) => {
      if ($b.find(commonSelectors.toastCloseButton).length) {
        cy.closeToastMessage();
      }
    });
  };

  // Drill components > filebutton1 > files > [0] to reach parsedValue. Nested
  // rows have no expand-button data-cy (only -label/-value), so the LABEL is
  // what toggles them.
  const openParsedValue = () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.hideTooltip();
    openNode("components");
    openSubNode(widget);
    cy.get('[data-cy="inspector-files-label"]').first().click();
    cy.get('[data-cy="inspector-0-label"]').first().click();
  };

  // Undo both toggles so the next call starts from a known state.
  const closeParsedValue = () => {
    backFromDetail();
    openNode("components");
    cy.get(commonWidgetSelector.sidebarinspector).click();
  };

  // Checks the EXPOSED state (components.filebutton1.<key>), not just the DOM.
  // The Inspector tab and Components node are toggles whose state persists, so
  // each is undone in reverse order.
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
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    dropWidget("File button", widget, 500, 100);
    cy.waitForElement(fileButtonSelector.button(widget));
    closeQueryPanel();
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  it("should verify Button text: direct change and exposed-variable binding", () => {
    openEditorSidebar(widget);
    verifyAndModifyParameter("Button text", "Direct Button Text");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).should("have.text", "Direct Button Text");

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

  it("should verify Enable multiple files: direct toggle and exposed-variable binding", () => {
    // Maps to the input's `multiple` attr. React omits false booleans, so
    // absence means off.
    openEditorSidebar(widget);
    cy.get(fileButtonSelector.inputField(widget)).should("not.have.attr", "multiple");

    // NOT tested: two files while this is off. `multiple` gates the OS chooser
    // (useFilePicker.js:415), so a user can only ever pick one. Forcing it via
    // the hidden input tests a path no user can reach.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "sample-a.csv");

    // Toggle ON: two files are accepted together.
    clearSelectedFile();
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.inputField(widget)).should("have.attr", "multiple");
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "2 files selected");

    // Toggle back OFF: one file still accepted, attribute gone.
    clearSelectedFile();
    cy.get(commonWidgetSelector.parameterTogglebutton("Enable multiple files")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.inputField(widget)).should("not.have.attr", "multiple");
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "sample-a.csv");

    clearSelectedFile();
    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    enableFxAndBind("Enable multiple files", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).scrollIntoView().should("not.have.attr", "multiple");

    clickWidgetInput("toggleswitch1");
    cy.get(fileButtonSelector.inputField(widget)).scrollIntoView().should("have.attr", "multiple");
    cy.get(fileButtonSelector.inputField(widget)).selectFile([csvFile, secondCsvFile], { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "2 files selected");
  });

  it("should verify Parse file content: direct toggle and fx bind reveals File type)", () => {
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

    dropCompanionToggle(500, 300);
    openEditorSidebar(widget);
    enableFxAndBind("Parse file content", "{{components.toggleswitch1.value}}");
    commitChange();
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("not.exist");

    clickWidgetInput("toggleswitch1");
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterLabel("File type")).should("have.text", "File type");
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

  it("should verify File type actually drives parsing, by dropdown and by fx", () => {
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

    // fx-bound File type drives parsing exactly as the dropdown does.
    clearSelectedFile();
    openEditorSidebar(widget);
    enableFxAndBind("File type", '{{"csv"}}');
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(csvFile, { force: true });
    openParsedValue();
    cy.get('[data-cy="inspector-parsedvalue-value"]').first().should("have.text", "[3]");
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

  it("should verify Make this field mandatory: direct toggle and exposed-variable binding", () => {
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

  it("should verify Accepted file types: every option accepts its own kind and rejects others", () => {
    // This field's label renders as "File type", not its config displayName
    // "Accepted file types": FilePicker.jsx hardcodes it.
    openEditorSidebar(widget);

    // Default is Any Files, so anything goes.
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");

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
      cy.get(fileButtonSelector.label(widget)).should("have.text", "Upload file");

      clearSelectedFile();
      cy.get(fileButtonSelector.inputField(widget)).selectFile(accept, { force: true });
      cy.get(fileButtonSelector.label(widget)).should("have.text", acceptName);
    });
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
      cy.get(fileButtonSelector.label(widget)).should("have.text", "Upload file");

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
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");

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
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");

    // 5. Max size above the file's size, so accepted.
    clearSelectedFile();
    openEditorSidebar(widget);
    verifyAndModifyParameter("Max size (bytes)", "{{5000}}");
    commitChange();
    cy.get(fileButtonSelector.inputField(widget)).selectFile(validFile, { force: true });
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");
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
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");

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
    cy.get(fileButtonSelector.label(widget)).should("have.text", "tooljet.png");
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
    cy.get(fileButtonSelector.label(widget)).should("have.text", "2 files selected");

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

  it("should verify Enable clear selection: direct toggle and exposed-variable binding", () => {
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

    // The panel stays open even once the widget unmounts.
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");
    verifyExposedValue("isVisible", "Boolean", "false");

    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.widget(widget)).should("exist");
    verifyExposedValue("isVisible", "Boolean", "true");

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

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "true");

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("not.be.disabled");
    verifyExposedValue("isDisabled", "Boolean", "false");

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

  it("should verify Show on desktop and Show on mobile gate the widget per layout", () => {
    // Defaults: showOnDesktop true, showOnMobile false.
    cy.get(fileButtonSelector.widget(widget)).should("exist");

    switchLayout("mobile");
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");

    // Enable mobile from the desktop layout: once hidden, the widget can't be
    // selected to reach its Inspector.
    switchLayout("desktop");
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Show on mobile")).click();
    cy.waitForAutoSave();

    switchLayout("mobile");
    cy.get(fileButtonSelector.widget(widget)).should("exist");

    switchLayout("desktop");
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.parameterTogglebutton("Show on desktop")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.widget(widget)).should("not.exist");

    switchLayout("mobile");
    cy.get(fileButtonSelector.widget(widget)).should("exist");
    switchLayout("desktop");
  });
});
