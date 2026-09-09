import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import {
  filePickerText,
  filePickerAccordion,
  filePickerFixtures,
  filePickerValidationBar,
  filePickerErrors,
  acceptedTypeCases,
  parseFileTypeOptions,
} from "Texts/appBuilder/components/filePicker";
import {
  commitChange,
  verifyExposedValue,
  hoverInPreview,
  setTooltip,
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  waitForDropSettle,
  dropWidget,
  enableFxAndBind,
} from "Support/utils/commonWidget";
import {
  acceptAnyFileType,
  attachFile,
  attachGeneratedFile,
  expectInlineAndToastError,
  expectPickerBlocked,
  expectDropzoneOpensPicker,
  dragFilesOver,
  endDrag,
  expectFileInList,
  deleteFileFromList,
  selectParseFileType,
  selectValidationFileType,
} from "Support/utils/appBuilder/components/filePicker";

// Properties facet — every field in config.properties AND config.validation, which are two
// SEPARATE top-level blocks (filepicker.js:43 and :216) with `events` sitting BETWEEN them
// (:211). Enumerating properties alone silently drops six validators.
// Covers: 15 config.properties — label:44 · instructionText:53 · enableDropzone:62 ·
//         enablePicker:71 · enableMultiple:80 · parseContent:89 · parseFileType:100 ·
//         delimiter:125 · dynamicHeight:144 · loadingState:150 · visibility:159 ·
//         collapseWhenHidden:168 · disabledState:174 · tooltipFormat:186 (3 formats) ·
//         tooltip:200
//         6 config.validation — enableValidation:217 · fileType:227 · minSize:237 ·
//         maxSize:248 · minFileCount:259 · maxFileCount:277     — source: filepicker.js
// Not here: config.others (showOnDesktop/showOnMobile) → contexts.cy.js, which owns the
//           device-layout surface. fx binding of these same fields → propertiesFx.cy.js
//
// The five COMMENTED-OUT styles (filepicker.js:303-326, 339-344) are not on the surface
// and are deliberately untested — see commentedOutStyles in the texts module.

const showTooltipInPreview = (name, format, content) => {
  openEditorSidebar(name);
  openAccordion(filePickerAccordion.additionalActions);
  setTooltip(format, content);
  hoverInPreview(filePickerSelector.title(name));
};

describe(
  "File Picker properties",
  { testIsolation: false },
  () => {
    const widget = filePickerText.defaultWidgetName;
    const {
      validFile,
      validFileName,
      csvFile,
      csvFileName,
      secondCsvFile,
      secondCsvFileName,
      jsonFile,
      pdfFile,
      zipFile,
    } = filePickerFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      cy.dragAndDropWidget(filePickerText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
      // Neutralises the shipped 'image/*' filter — see acceptAnyFileType. The default
      // itself is asserted in basics.cy.js.
      acceptAnyFileType(widget);
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    /* --------------------------------------------------------------- data ---- */

    it("should verify Label and Placeholder: direct change", () => {
      const label = fake.companyName;
      openEditorSidebar(widget);
      verifyAndModifyParameter("Label", label); // source: filepicker.js:44
      commitChange();
      cy.get(filePickerSelector.title(widget)).should("have.text", label);

      openEditorSidebar(widget);
      verifyAndModifyParameter("Placeholder", "Drop a document here"); // source: filepicker.js:53
      commitChange();
      cy.get(filePickerSelector.instructionText(widget)).should(
        "have.text",
        "Drop a document here"
      );
    });

    it("should verify Use drop zone: turning it off stops the dropzone reacting to a drag", () => {
      // enableDropzone maps to react-dropzone's `noDrag` (useFilePicker.js:411), which
      // removes handlers rather than changing an attribute — the only observable is
      // whether a real drag flips the state class.
      //
      // The ON case runs FIRST and is the positive control: without it, a drag that
      // silently failed to register would make the OFF case pass for the wrong reason.
      dragFilesOver(widget, [{ name: "dragged.png", type: "image/png" }]);
      cy.get(filePickerSelector.dropzone(widget)).should("have.class", "is-dragging");
      endDrag(widget);
      cy.get(filePickerSelector.dropzone(widget)).should("not.have.class", "is-dragging");

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Use drop zone")).click(); // source: filepicker.js:62
      cy.waitForAutoSave();

      dragFilesOver(widget, [{ name: "dragged.png", type: "image/png" }]);
      cy.get(filePickerSelector.dropzone(widget)).should("not.have.class", "is-dragging");
      endDrag(widget);
    });

    it("should verify Use file picker: turning it off stops a dropzone click opening the picker", () => {
      // enablePicker maps to `noClick` (useFilePicker.js:410). Same shape as drop zone
      // above: nothing in the DOM changes, so the observable is whether the root forwards
      // its click to the hidden input. Both polarities are asserted in one test so a
      // broken spy cannot read as "no click".
      // Configured in the editor, asserted in PREVIEW, one way — no round trip.
      // Two constraints force this shape: on the canvas the selection/resize overlays
      // intercept the click before react-dropzone's root handler sees it, so an editor-side
      // read is meaningless; and there is no supported way back to the editor mid-test, so
      // the two polarities cannot both be driven from here.
      // The ON polarity lives in propertiesFx, where the flag is bound to a Toggle Switch
      // and both states are exercised inside a single preview session.
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Use file picker")).click(); // source: filepicker.js:71
      cy.waitForAutoSave();

      cy.openPreview(filePickerSelector.widget(widget));
      expectDropzoneOpensPicker(widget, false);
    });

    it("should verify Allow picking multiple files: direct toggle adds the multiple attribute and the count readout", () => {
      cy.get(filePickerSelector.inputField(widget)).should("not.have.attr", "multiple");
      cy.get(filePickerSelector.countInfo(widget)).should("not.exist");

      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click(); // source: filepicker.js:80
      cy.waitForAutoSave();

      cy.get(filePickerSelector.inputField(widget)).should("have.attr", "multiple");
      // Turning it on flips ValidationBar's count gate (ValidationBar.jsx:16), so the
      // readout appears — "0/2" from the shipped maxFileCount of 2 (filepicker.js:409).
      cy.get(filePickerSelector.countInfo(widget)).should(
        "have.text",
        filePickerValidationBar.countMax(0, 2)
      );

      attachFile([csvFile, secondCsvFile]);
      expectFileInList(csvFileName);
      expectFileInList(secondCsvFileName);
      cy.get(filePickerSelector.countInfo(widget)).should(
        "have.text",
        filePickerValidationBar.countMax(2, 2)
      );
      verifyExposedValue("file", "Array", "[2]", widget);
    });

    it("should verify Enable parsing: direct toggle reveals File type and parses content", () => {
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable parsing")).click(); // source: filepicker.js:89
      cy.waitForAutoSave();

      // parseFileType renders only once parsing is on (filepicker.js:119-122).
      cy.get('[data-cy="dropdown-file-type"]').should("be.visible");
      selectParseFileType("CSV"); // source: filepicker.js:105

      attachFile(csvFile);
      expectFileInList(csvFileName);

      // sample-a.csv is id,name,role, so every parsed row must report 3 keys.
      verifyExposedValue(["files", "0", "parsedValue", "1"], "Object", "{3}", widget);
    });

    it("should verify File type: the dropdown offers exactly the five configured options", () => {
      // parseFileType's options are config-declared (filepicker.js:103-112), unlike the
      // VALIDATION file-type dropdown whose options live in the Inspector component. So a
      // config change that adds or drops one should fail here — the list is the contract.
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Enable parsing")).click();
      cy.waitForAutoSave();

      cy.get('[data-cy="dropdown-file-type"]').find(".react-select__control").click();
      cy.get(".react-select__option").should("have.length", parseFileTypeOptions.length);
      parseFileTypeOptions.forEach(({ label }) => {
        cy.get(".react-select__option")
          .filter((_i, el) => el.innerText.trim() === label)
          .should("have.length", 1);
      });
      // Close the menu so the open portal does not swallow the next test's clicks.
      cy.get('[data-cy="dropdown-file-type"]').find(".react-select__control").click();
    });

    it("should verify Delimiter: hidden until parsing is on AND the type is CSV", () => {
      // Two ANDed conditions (filepicker.js:132-141) — the only field in this config with
      // more than one, so each has to be shown to matter on its own.
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("not.exist");

      cy.get(commonWidgetSelector.parameterTogglebutton("Enable parsing")).click();
      cy.waitForAutoSave();
      // Parsing on, but parseFileType still defaults to auto-detect (:117), so the second
      // condition is unmet and Delimiter stays hidden.
      cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("not.exist");

      selectParseFileType("CSV");
      cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("have.text", "Delimiter");

      // And it disappears again when the type moves off CSV.
      selectParseFileType("TSV");
      cy.get(commonWidgetSelector.parameterLabel("Delimiter")).should("not.exist");
    });

    it("should verify Dynamic height: an overflowing file list expands instead of scrolling", () => {
      // The contract is about OVERFLOW, so the widget has to be overflowed first. The root
      // carries `files-pane-scrollable` (FilePicker.jsx:214) and the widget ships 220px
      // tall (filepicker.js:8), so six 32px rows plus the title, validation bar and
      // dropzone comfortably exceed it.
      //
      // Asserting that a min-height style appears would only prove the property is wired.
      // Comparing scrollHeight against clientHeight proves what a user actually gets.
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Max file count", "{{6}}");
      commitChange();

      const sixFiles = [validFile, csvFile, secondCsvFile, jsonFile, pdfFile, zipFile];
      attachFile(sixFiles);
      cy.get(filePickerSelector.fileListItem(widget)).should("have.length", 6);

      // ── control: with dynamic height OFF the content overflows and scrolls ──
      // Without this the "no overflow" assertion below would pass on a widget that simply
      // never overflowed, proving nothing.
      cy.get(filePickerSelector.widget(widget)).then(($el) => {
        expect(
          $el[0].scrollHeight,
          "content overflows the fixed height before dynamic height is on"
        ).to.be.greaterThan($el[0].clientHeight);
      });

      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Dynamic height")).click(); // source: filepicker.js:144
      cy.waitForAutoSave();

      // ── effect, asserted in PREVIEW ──
      // Dynamic height applies in PREVIEW ONLY, by design: the editor pins a widget to its
      // layout height so it stays draggable and resizable, so the content still overflows
      // on the canvas with the property on (measured: scrollHeight 332 vs clientHeight
      // 217). That canvas reading is expected, NOT a defect — do not file it. Preview is
      // the only surface where this feature is observable.
      // The selection does not survive the navigation, so the files are re-attached.
      cy.openPreview(filePickerSelector.widget(widget));
      attachFile(sixFiles);
      cy.get(filePickerSelector.fileListItem(widget)).should("have.length", 6);
      cy.get(filePickerSelector.widget(widget)).should(($el) => {
        expect($el[0].scrollHeight, "widget expanded to fit its content").to.be.at.most(
          $el[0].clientHeight + 1 // sub-pixel rounding
        );
      });
    });

    it("should verify Show loading state: direct toggle replaces the whole top section with a loader", () => {
      cy.get(filePickerSelector.loader(widget)).should("not.exist");

      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Show loading state")).click(); // source: filepicker.js:150
      cy.waitForAutoSave();

      // The loader is the other branch of a ternary over the entire top section
      // (FilePicker.jsx:218), so the title and dropzone LEAVE the DOM — they are not
      // merely covered. Asserting their absence is what proves the swap.
      cy.get(filePickerSelector.loader(widget)).should("be.visible");
      cy.get(filePickerSelector.title(widget)).should("not.exist");
      cy.get(filePickerSelector.dropzone(widget)).should("not.exist");
      verifyExposedValue("isLoading", "Boolean", "true", widget);
    });

    it("should verify Visibility: direct toggle hides the widget", () => {
      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click(); // source: filepicker.js:159
      cy.waitForAutoSave();

      // Hidden via CSS, not unmounted: FilePicker.jsx:143 sets `display: none` where
      // File Input returns null (FileInput.jsx:240). A hidden picker therefore keeps its
      // hooks and its held files, which a hidden File Input loses.
      cy.get(filePickerSelector.widget(widget)).should("not.be.visible");
      verifyExposedValue("isVisible", "Boolean", "false", widget);
    });

    // Both collapse tests build the same app: a Text widget sitting directly BELOW the
    // picker, and a Toggle Switch bound to Visibility so the picker can be hidden and shown
    // at RUNTIME. Collapsing is about the space a hidden widget leaves behind, so the
    // observable is the NEIGHBOUR's position, not the picker's own height — the picker
    // unmounts either way, so measuring it proves nothing about reclaimed space.
    const buildCollapseHarness = () => {
      dropWidget("Text", "text1", 500, 380);
      dropWidget("Toggle Switch", "toggleswitch1", 500, 520);

      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      // Bound rather than toggled in the Inspector: the flip has to happen in preview,
      // where there is no Inspector to reach.
      enableFxAndBind("Visibility", "{{components.toggleswitch1.value}}"); // source: filepicker.js:159
      commitChange();
    };

    // The Toggle Switch ships false, so binding it hides the picker immediately; one click
    // shows it. Returns the neighbour's viewport top in each state.
    const neighbourTopWhile = (visible) => {
      cy.get(commonWidgetSelector.draggableWidget("toggleswitch1"))
        .find('input[type="checkbox"]')
        .then(($cb) => {
          if ($cb.prop("checked") !== visible) cy.wrap($cb).click({ force: true });
        });
      cy.get(filePickerSelector.widget(widget)).should(visible ? "be.visible" : "not.be.visible");
      return cy
        .get(commonWidgetSelector.draggableWidget("text1"))
        .then(($t) => $t[0].getBoundingClientRect().top);
    };

    it("should verify Collapse when hidden: the component below pulls up while the picker is hidden", () => {
      buildCollapseHarness();

      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Collapse when hidden")).click(); // source: filepicker.js:168
      cy.waitForAutoSave();

      cy.openPreview(commonWidgetSelector.draggableWidget("text1"));

      neighbourTopWhile(true).then((topWhileVisible) => {
        neighbourTopWhile(false).then((topWhileHidden) => {
          // Directional and measured on the SAME element across two runtime states, so a
          // broken probe reads as "no movement" and fails rather than passing quietly.
          expect(
            topWhileHidden,
            "the Text below moves up into the space the hidden picker gave back"
          ).to.be.lessThan(topWhileVisible);
        });
      });
    });

    it("should verify Collapse when hidden off: hiding the picker leaves the gap behind", () => {
      // The control for the test above. Without it, a pull-up could be explained by the
      // widget simply unmounting rather than by collapseWhenHidden doing anything — this
      // pins the default, where the space is held open.
      buildCollapseHarness();

      cy.openPreview(commonWidgetSelector.draggableWidget("text1"));

      neighbourTopWhile(true).then((topWhileVisible) => {
        neighbourTopWhile(false).then((topWhileHidden) => {
          expect(
            topWhileHidden,
            "with collapse off the neighbour stays put"
          ).to.be.closeTo(topWhileVisible, 2);
        });
      });
    });

    it("should verify Disable: direct toggle blocks the picker and drops the tab stop", () => {
      cy.get(filePickerSelector.dropzone(widget)).should("have.attr", "tabindex", "0");

      openEditorSidebar(widget);
      openAccordion(filePickerAccordion.additionalActions);
      cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click(); // source: filepicker.js:174
      cy.waitForAutoSave();

      expectPickerBlocked(widget);
      verifyExposedValue("isDisabled", "Boolean", "true", widget);
    });

    /* ------------------------------------------------------------ tooltip ---- */

    // Plain text and Markdown share this string, so only the format switch can explain
    // their different output. source: filepicker.js:186 (tooltipFormat), :200 (tooltip)
    const markup = "**Bold** tip";
    // Radix renders the content TWICE (once visibly, once in a VisuallyHidden copy), so
    // every match below needs .first(); unscoped `have.text` sees "BoldBold".

    it("should verify Tooltip in Plain text format: content stays literal", () => {
      showTooltipInPreview(widget, "plainText", markup);
      cy.get(commonWidgetSelector.widgetTooltip).find("span.tw-whitespace-pre-wrap").first().should("have.text", markup);
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

    /* --------------------------------------------------------- validation ---- */

    it("should verify Make this field mandatory: direct toggle marks the title and the input", () => {
      cy.get(filePickerSelector.mandatoryIndicator(widget)).should("not.exist");

      openEditorSidebar(widget);
      openAccordion("Validation");
      cy.get(commonWidgetSelector.parameterTogglebutton("Make this field mandatory")).click(); // source: filepicker.js:217
      cy.waitForAutoSave();

      cy.get(filePickerSelector.mandatoryIndicator(widget)).should("be.visible").and("have.text", "*");
      cy.get(filePickerSelector.ariaRequired(widget)).should("exist");
      verifyExposedValue("isMandatory", "Boolean", "true", widget);
      verifyExposedValue("isValid", "Boolean", "false", widget);
    });

    it("should verify Accept file types: every option accepts its own kind and rejects others", () => {
      // The config declares this as `type: 'code'` (filepicker.js:227) but the custom
      // Inspector panel renders a react-select from FILE_TYPE_OPTIONS
      // (Inspector/Components/FilePicker.jsx:174) — hence the dropdown helper.
      //
      // minSize is zeroed first: it ships at 50 bytes (:406) and the audio/video fixtures
      // are 27 and 35 bytes, so without this those two rows are rejected on SIZE and the
      // type rule goes untested while the test still passes.
      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min size limit (Bytes)", "{{0}}");
      commitChange();

      acceptedTypeCases.forEach(({ label, value, accept, acceptName, reject }) => {
        openEditorSidebar(widget);
        openAccordion("Validation");
        selectValidationFileType(label);

        // Reject FIRST, on an empty widget: accepting then rejecting would leave the
        // accepted file in the list, so the rejection assertion could not tell "kept the
        // old file" from "accepted the new one".
        attachFile(reject);
        cy.get(filePickerSelector.filePane(widget)).should("not.exist");

        attachFile(accept);
        expectFileInList(acceptName);
        deleteFileFromList(acceptName);
        cy.log(`accepted ${acceptName} and rejected the other under ${label} (${value})`);
      });
    });

    it("should verify Min size limit: a file under the floor is rejected with the exact reason", () => {
      // Generated buffers rather than fixtures, so the boundary itself is the subject:
      // 49 bytes fails and 50 passes against the shipped minSize of 50 (filepicker.js:406).
      attachGeneratedFile({ sizeBytes: 49, name: "under.txt" }, widget);
      expectInlineAndToastError(filePickerErrors.tooSmall("under.txt", 49, 50), widget);
      cy.get(filePickerSelector.filePane(widget)).should("not.exist");

      attachGeneratedFile({ sizeBytes: 50, name: "atfloor.txt" }, widget);
      expectFileInList("atfloor.txt");
    });

    it("should verify Max size limit: a file over the cap is rejected with the exact reason", () => {
      // maxSize ships at 51200000 (~48.8MB, filepicker.js:407), so it is lowered to a
      // testable figure first — the alternative is allocating a 49MB buffer.
      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Max size limit (Bytes)", "{{1024}}");
      commitChange();

      attachGeneratedFile({ sizeBytes: 2048, name: "over.txt" }, widget);
      expectInlineAndToastError(filePickerErrors.tooLarge("over.txt", 2048, 1024), widget);
      cy.get(filePickerSelector.filePane(widget)).should("not.exist");

      attachGeneratedFile({ sizeBytes: 1024, name: "atcap.txt" }, widget);
      expectFileInList("atcap.txt");
    });

    it("should verify Min and Max file count: both appear only with multiple files enabled", () => {
      // Both validators carry parentObjectKey 'properties' (filepicker.js:269-275,
      // :287-293) and reach ACROSS blocks to properties.enableMultiple, which ships false
      // (:380) — so they are unreachable in the default state.
      openEditorSidebar(widget);
      openAccordion("Validation");
      cy.get(commonWidgetSelector.parameterLabel("Min file count")).should("not.exist");
      cy.get(commonWidgetSelector.parameterLabel("Max file count")).should("not.exist");

      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      openAccordion("Validation");
      cy.get(commonWidgetSelector.parameterLabel("Min file count")).should(
        "have.text",
        "Min file count"
      );
      cy.get(commonWidgetSelector.parameterLabel("Max file count")).should(
        "have.text",
        "Max file count"
      );
    });

    it("should verify Min file count: a shortfall keeps the widget invalid with the exact reason", () => {
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min file count", "{{2}}"); // source: filepicker.js:259
      commitChange();

      attachFile(csvFile);
      // Asserted FIRST, before anything slow. Not a rejection — the file is kept and the
      // widget reports itself invalid (useFilePicker.js:421-424) — and unlike every
      // rejection message this one is TRANSIENT: onDropAccepted schedules
      // clearErrorStates() 5s later (:425). Asserting it after expectFileInList, which
      // hovers and takes seconds, races that timer and fails intermittently (FP-9).
      cy.get(filePickerSelector.errorMessage(widget)).should(
        "have.text",
        filePickerErrors.minCountShortfall(2)
      );
      expectFileInList(csvFileName);
      verifyExposedValue("isValid", "Boolean", "false", widget);

      attachFile(secondCsvFile);
      expectFileInList(secondCsvFileName);
      cy.get(filePickerSelector.errorMessage(widget)).should("not.exist");
      verifyExposedValue("isValid", "Boolean", "true", widget);
    });

    it("should verify Max file count: selecting past the cap is refused with the exact reason", () => {
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click();
      cy.waitForAutoSave();

      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Max file count", "{{1}}"); // source: filepicker.js:277
      commitChange();

      // A BATCH of two against a cap of one: this is the only way the cap message is
      // reachable. Once the picker is full it disables ITSELF
      // (useFilePicker.js:656-660 sets disablePicker, which becomes the input's `disabled`
      // at :416), so a later second selection is a silent no-op — react-dropzone never runs
      // the validator and no message is produced.
      // Refusal asserted by STATE, not by a message. Every cap-related string in the
      // source is unreachable in practice — see FP-11 (react-dropzone's `too-many-files`
      // is dead because maxFiles is never configured) and FP-13 (a refusal past the cap
      // produces no inline error and no toast at all).
      // Asserting a message here would be asserting something the widget never shows.
      attachFile([csvFile, secondCsvFile]);
      cy.get(filePickerSelector.fileListItem(widget)).should("have.length", 1);
      cy.get(filePickerSelector.errorMessage(widget)).should("not.exist");

      // And now that it is full, the picker is blocked rather than merely refusing.
      expectPickerBlocked(widget);
    });

    it("should verify a second file is refused while multiple files is off", () => {
      // enableMultiple ships false (filepicker.js:380), so this is the DEFAULT path. The
      // widget REFUSES the second file rather than replacing the held one
      // (useFilePicker.js:273-276). The commit branch further down
      // does contain a single-mode replacement (`[...successfullyProcessedFiles]`,
      // useFilePicker.js:346) that reads as though the file would be swapped. The validator
      // runs first, so it never gets there.
      cy.get(filePickerSelector.inputField(widget)).should("not.have.attr", "multiple");

      attachFile(validFile);
      expectFileInList(validFileName);

      // Holding one file with multiple OFF disables the picker outright
      // (useFilePicker.js:659), so there is no second selection to refuse — the widget is
      // simply closed for input. The validator's "Only one file can be uploaded." message
      // (:273-276) is therefore only reachable from a BATCH, asserted below.
      expectPickerBlocked(widget);
      cy.get(filePickerSelector.fileListItem(widget)).should("have.length", 1);
      expectFileInList(validFileName);
    });

    it("should verify re-selecting a held file is refused as a duplicate", () => {
      // File Picker SURFACES its duplicate guard (useFilePicker.js:229) where File Input
      // drops the file silently — so this widget can assert the message rather than having
      // to work around the guard.
      // Multiple ON with room to spare, so the picker stays ENABLED and the duplicate
      // guard is actually reachable — with it off, a held file disables the picker and the
      // second selection never runs the validator at all (useFilePicker.js:659).
      openEditorSidebar(widget);
      cy.get(commonWidgetSelector.parameterTogglebutton("Allow picking multiple files")).click();
      cy.waitForAutoSave();

      attachFile(validFile);
      expectFileInList(validFileName);

      // Same as the cap: the duplicate guard drops the file without surfacing its message
      // (FP-13). The observable contract is that the selection does not grow and the held
      // file is untouched.
      attachFile(validFile);
      cy.get(filePickerSelector.fileListItem(widget)).should("have.length", 1);
      expectFileInList(validFileName);
      cy.get(filePickerSelector.errorMessage(widget)).should("not.exist");
    });
  }
);
