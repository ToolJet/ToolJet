import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import { filePickerText, filePickerFixtures } from "Texts/appBuilder/components/filePicker";
import { openEditorSidebar, waitForDropSettle } from "Support/utils/commonWidget";
import { selectEvent, configureCSA, selectQueryForEvent } from "Support/utils/appBuilder/events";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import {
  verifyExposedValue,
  acceptAnyFileType,
  attachFile,
  expectFileInList,
} from "Support/utils/appBuilder/components/filePicker";

// CSA facet — every handle driven by TWO triggers (a Control Component event and a RunJS
// query) in TWO environments (editor and preview).
// Covers all 5 config.actions handles — source: filepicker.js:14-42
//   clearFiles:16 (no params) · setFileName:20 (Index + New File Name)
//   setVisibility:28 · setLoading:33 · setDisable:38  (each takes a `Value` toggle)
//
// This widget has NO setFocus / setBlur, which both siblings declare — useFilePicker only
// exposes them when a focusFn/blurFn is passed in (useFilePicker.js:592-593) and File
// Picker passes neither. So there is nothing to test there rather than a gap here.
//
// NOTE setVisibility's param handle is `disable` (filepicker.js:30), identical to
// setDisable's (:40). This is a NAMING inconsistency only, NOT a functional bug:
// eventsSlice.js:958 invokes a CSA with its params POSITIONALLY
// (`action(...args.map(a => a.value))`), so the handle string is never read at call time
// and the param's display name is "Value" either way. The same quirk was investigated and
// withdrawn on File Input. Do not re-raise it.
describe(
  "File Picker CSA",
  { testIsolation: false, retries: { runMode: Number(Cypress.env("TJ_RETRIES") ?? 3), openMode: 0 } },
  () => {
    const widget = filePickerText.defaultWidgetName;
    const { validFile, validFileName, csvFile, csvFileName } = filePickerFixtures;
    const panelHeight = 50;
    // Fixed name (fresh app per test) — QueryCard.jsx lowercases it for data-cy.
    const queryName = "csarunjs";

    // Every test runs the same arc — editor: pre → Control Component → RunJS, then
    // preview: pre → Control Component → RunJS. The editor alone is not enough: the canvas
    // runs its own selection machinery, so a CSA can pass or fail there for reasons
    // unrelated to the action.
    //
    // Each RunJS query sets the OPPOSITE value to its Control Component action, so the
    // second trigger is a real transition rather than a repeat.

    // Created FIRST: the query is added via API and needs a reload to appear in the
    // editor — which would also wipe any pre-state (a selected file) set before it.
    const createRunJSQuery = (code) => {
      cy.apiAddQueryToApp({
        queryName,
        options: { code, hasParamSupport: true, parameters: [] },
        dataSourceName: "runjsdefault",
        dsKind: "runjs",
      });
      cy.reload();
      resizeQueryPanel(panelHeight);
    };

    // Button 1 — the Control Component trigger.
    const wireCSA = (csaDisplayName, params = []) => {
      // No deselect before this drag — right-sidebar-components-button is a tab toggle,
      // and deselecting first would close the catalog instead of opening it.
      openEditorSidebar(widget);
      cy.dragAndDropWidget("Button", 500, 400);
      waitForDropSettle("button1");
      openEditorSidebar("button1");
      selectEvent("On click", "Control Component");
      configureCSA(widget, csaDisplayName, params);
    };

    // Button 2 — the RunJS trigger. Preview has no query panel, so the query is run the
    // way a real app runs one: from an event.
    const wireRunQueryButton = () => {
      openEditorSidebar(widget);
      cy.dragAndDropWidget("Button", 700, 400);
      waitForDropSettle("button2");
      openEditorSidebar("button2");
      // "Run query" — exact label from ActionTypes.js:3 (lowercase q). A different list,
      // useCallbackActions.js, spells it "Run Query"; that one is the left Inspector's.
      selectEvent("On click", "Run query");
      selectQueryForEvent(queryName);
    };

    // `editor: false` is required in preview: waitForAutoSave polls the editor's save
    // indicator (appbuilderCommands.js:120), which preview has no equivalent of, so it
    // times out for 20s on every click.
    const clickButton = (name, { editor = true } = {}) => {
      cy.get(commonWidgetSelector.draggableWidget(name)).scrollIntoView().click();
      if (editor) cy.waitForAutoSave();
    };

    const runBothTriggers = (afterControlComponent, afterRunJS, opts = {}) => {
      clickButton("button1", opts);
      afterControlComponent();
      clickButton("button2", opts);
      afterRunJS();
    };

    const PREVIEW = { editor: false };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      cy.dragAndDropWidget(filePickerText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      // File Picker ships fileType: 'image/*' (filepicker.js:234, :405), so a fresh widget
      // refuses every non-image — a CSV or TXT never reaches the size, count or parsing
      // logic under test. Neutralised once per test here; the shipped default is asserted
      // in basics.cy.js, and the tests that are ABOUT file types set their own value after
      // this runs.
      acceptAnyFileType(widget);
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("should empty the file list via the Clear Files CSA", () => {
      createRunJSQuery(`await components.${widget}.clearFiles(); return true;`);
      wireCSA("Clear Files"); // source: filepicker.js:16
      wireRunQueryButton();

      // Re-established at each stage: File Picker refuses a file it already holds with a
      // duplicate message (useFilePicker.js:229), so a second attach of the same file
      // would not restore the pre-state.
      const holdFile = () => {
        attachFile(validFile);
        expectFileInList(validFileName);
      };
      const expectCleared = () =>
        cy.get(filePickerSelector.filePane(widget)).should("not.exist");

      // ── editor ──
      holdFile();
      verifyExposedValue("file", "Array", "[1]");
      clickButton("button1");
      expectCleared();
      verifyExposedValue("file", "Array", "[0]");

      holdFile();
      clickButton("button2");
      expectCleared();
      verifyExposedValue("file", "Array", "[0]");

      // ── preview ── (reload drops the selection, so preview starts empty)
      cy.openPreview(filePickerSelector.widget(widget));
      holdFile();
      clickButton("button1", PREVIEW);
      expectCleared();

      holdFile();
      clickButton("button2", PREVIEW);
      expectCleared();
    });

    it("should rename a held file while keeping its extension via the Set File Name CSA", () => {
      // The only CSA on this widget taking more than one param, and the params pass
      // POSITIONALLY — (index, newName) — so the order here is what matters, not the
      // handle names (`indexOrUpdates`, `newNameIfSingle`).
      //
      // setFileName re-attaches the ORIGINAL extension to the new base
      // (useFilePicker.js:500-502), so "renamed" against sample-a.csv becomes renamed.csv.
      // The list then strips the extension for display (FileListItem.jsx:23) while the
      // data-cy keeps it (FP-2) — hence a rendered text of "renamed" behind an id of
      // `renamed-csv-file-name`.
      createRunJSQuery(`await components.${widget}.setFileName(0, "viarunjs"); return true;`);
      wireCSA("Set File Name", [
        { label: "Index", value: "{{0}}" },
        { label: "New File Name", value: '{{"viacsa"}}' },
      ]); // source: filepicker.js:20
      wireRunQueryButton();

      attachFile(csvFile);
      expectFileInList(csvFileName);

      // ── editor ──
      clickButton("button1");
      expectFileInList("viacsa.csv");
      cy.get(filePickerSelector.fileName(widget, csvFileName)).should("not.exist");

      clickButton("button2");
      expectFileInList("viarunjs.csv");

      // ── preview ──
      cy.openPreview(filePickerSelector.widget(widget));
      attachFile(csvFile);
      expectFileInList(csvFileName);
      clickButton("button1", PREVIEW);
      expectFileInList("viacsa.csv");
      clickButton("button2", PREVIEW);
      expectFileInList("viarunjs.csv");
    });

    it("should hide and show the widget via the Set Visibility CSA", () => {
      createRunJSQuery(`await components.${widget}.setVisibility(true); return true;`);
      // The Control Component action sets FALSE and the RunJS query sets TRUE, so the two
      // triggers move the widget in opposite directions rather than repeating each other.
      wireCSA("Set Visibility", [{ label: "Value", type: "toggle", value: false }]); // source: filepicker.js:28
      wireRunQueryButton();

      // `exist` + scrollIntoView rather than `be.visible`: clicking either companion
      // button re-centres the canvas, so a freshly re-shown widget can be off-screen and
      // fail a visibility assertion for a reason unrelated to the CSA.
      const expectHidden = () =>
        // File Picker stays in the DOM and hides via CSS (`display: none`,
        // FilePicker.jsx:143) — it does NOT return null the way File Input does
        // (FileInput.jsx:240), so "not.exist" is the wrong assertion for this family.
        cy.get(filePickerSelector.widget(widget)).should("not.be.visible");
      const expectShown = () =>
        cy.get(filePickerSelector.widget(widget)).scrollIntoView().should("exist");

      // ── editor ──
      expectShown();
      verifyExposedValue("isVisible", "Boolean", "true");
      clickButton("button1");
      expectHidden();
      verifyExposedValue("isVisible", "Boolean", "false");
      clickButton("button2");
      expectShown();
      verifyExposedValue("isVisible", "Boolean", "true");

      // ── preview ──
      cy.openPreview(filePickerSelector.widget(widget));
      expectShown();
      runBothTriggers(expectHidden, expectShown, PREVIEW);
    });

    it("should block and unblock the picker via the Set Disable CSA", () => {
      createRunJSQuery(`await components.${widget}.setDisable(false); return true;`);
      wireCSA("Set Disable", [{ label: "Value", type: "toggle", value: true }]); // source: filepicker.js:38
      wireRunQueryButton();

      // The dropzone is a div with no `disabled` attribute, so the signals are its state
      // class and its tab stop — the latter being what a keyboard user experiences.
      const expectDisabled = () => {
        cy.get(filePickerSelector.dropzoneDisabled(widget)).scrollIntoView().should("exist");
        cy.get(filePickerSelector.dropzone(widget)).should("have.attr", "tabindex", "-1");
      };
      const expectEnabled = () =>
        cy.get(filePickerSelector.dropzone(widget)).scrollIntoView().should("have.attr", "tabindex", "0");

      // ── editor ──
      expectEnabled();
      runBothTriggers(expectDisabled, expectEnabled);
      verifyExposedValue("isDisabled", "Boolean", "false");

      // ── preview ──
      cy.openPreview(filePickerSelector.widget(widget));
      expectEnabled();
      runBothTriggers(expectDisabled, expectEnabled, PREVIEW);
    });

    it("should toggle the loader via the Set Loading CSA", () => {
      createRunJSQuery(`await components.${widget}.setLoading(false); return true;`);
      wireCSA("Set Loading", [{ label: "Value", type: "toggle", value: true }]); // source: filepicker.js:33
      wireRunQueryButton();

      // The loader replaces the ENTIRE top section (FilePicker.jsx:218), so the title and
      // dropzone leave the DOM — asserting both branches is what proves the swap rather
      // than an overlay.
      const expectLoading = () => {
        cy.get(filePickerSelector.loader(widget)).scrollIntoView().should("exist");
        cy.get(filePickerSelector.dropzone(widget)).should("not.exist");
      };
      const expectNotLoading = () => {
        cy.get(filePickerSelector.loader(widget)).should("not.exist");
        cy.get(filePickerSelector.dropzone(widget)).scrollIntoView().should("exist");
      };

      // ── editor ──
      expectNotLoading();
      runBothTriggers(expectLoading, expectNotLoading);
      verifyExposedValue("isLoading", "Boolean", "false");

      // ── preview ──
      cy.openPreview(filePickerSelector.widget(widget));
      expectNotLoading();
      runBothTriggers(expectLoading, expectNotLoading, PREVIEW);
    });
  }
);
