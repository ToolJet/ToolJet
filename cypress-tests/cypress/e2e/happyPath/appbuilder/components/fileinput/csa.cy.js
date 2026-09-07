import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputFixtures } from "Texts/appBuilder/components/fileInput";
import { openEditorSidebar, waitForDropSettle } from "Support/utils/commonWidget";
import { selectEvent, configureCSA, selectQueryForEvent } from "Support/utils/appBuilder/events";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { verifyExposedValue, attachFile } from "Support/utils/appBuilder/components/fileInput";

// CSA facet — every handle driven by TWO triggers (a Control Component event and a RunJS
// query) in TWO environments (editor and preview).
// Covers all 6 config.actions handles — source: fileinput.js:435-484
//   clear:437 (no params) · setFocus:441 · setBlur:445
//   setVisibility:449 · setDisable:461 · setLoading:473  (each takes a `Value` toggle)
//
// NOTE setVisibility's param handle is `disable` (fileinput.js:453), copy-pasted from
// setDisable — File Button correctly uses `value`. The param's DISPLAY name is still
// "Value", so configureCSA addresses it the same way; the divergence is recorded in
// Findings rather than worked around here.
describe(
  "File Input CSA",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { validFile, validFileName } = fileInputFixtures;
    const panelHeight = 50;
    // Fixed name (fresh app per test) — QueryCard.jsx lowercases it for data-cy.
    const queryName = "csarunjs";

    // Every test runs the same arc — editor: pre → Control Component → RunJS, then
    // preview: pre → Control Component → RunJS. The editor alone is not enough: the canvas
    // runs its own selection/focus machinery, so Set focus / Set blur can pass or fail
    // there for reasons unrelated to the CSA.
    //
    // No reset between phases is needed — CSA state (files, isVisible, isDisabled,
    // isLoading) is never persisted, so navigating to preview restores the pre-state.
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
    const wireCSA = (csaDisplayName, value) => {
      // No deselect before this drag — right-sidebar-components-button is a tab toggle,
      // and deselecting first would close the catalog instead of opening it.
      openEditorSidebar(widget);
      cy.dragAndDropWidget("Button", 500, 300);
      waitForDropSettle("button1");
      openEditorSidebar("button1");
      selectEvent("On click", "Control Component");
      configureCSA(
        widget,
        csaDisplayName,
        value === undefined ? [] : [{ label: "Value", type: "toggle", value }]
      );
    };

    // Button 2 — the RunJS trigger. Preview has no query panel, so the query is run the
    // way a real app runs one: from an event. Same mechanism works in both phases.
    const wireRunQueryButton = () => {
      openEditorSidebar(widget);
      cy.dragAndDropWidget("Button", 700, 300);
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

    // Both triggers, in whichever environment is current.
    const runBothTriggers = (afterControlComponent, afterRunJS, opts = {}) => {
      clickButton("button1", opts);
      afterControlComponent();
      clickButton("button2", opts);
      afterRunJS();
    };

    // Every click after openPreview() must carry this.
    const PREVIEW = { editor: false };

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      cy.dragAndDropWidget(fileInputText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    it("should clear the selected file via the Clear CSA", () => {
      createRunJSQuery(`await components.${widget}.clear(); return true;`);
      wireCSA("Clear"); // source: fileinput.js:437
      wireRunQueryButton();

      // Re-established at each stage: useFilePicker's duplicate guard silently drops a
      // file the widget already holds.
      const holdFile = () => {
        attachFile(validFile);
        cy.get(fileInputSelector.summary(widget)).should("have.text", validFileName);
      };
      const expectCleared = () =>
        cy.get(fileInputSelector.summary(widget)).scrollIntoView().should("have.text", fileInputText.defaultPlaceholder);

      // ── editor ──
      holdFile();
      verifyExposedValue("files", "Array", "[1]");
      clickButton("button1");
      expectCleared();
      verifyExposedValue("files", "Array", "[0]");

      holdFile();
      clickButton("button2");
      expectCleared();
      verifyExposedValue("files", "Array", "[0]");

      // ── preview ── (reload drops `files`, so preview starts empty)
      cy.openPreview(fileInputSelector.field(widget));
      holdFile();
      clickButton("button1", PREVIEW);
      expectCleared();

      holdFile();
      clickButton("button2", PREVIEW);
      expectCleared();
    });

    it("should focus the trigger via the Set focus CSA", () => {
      createRunJSQuery(`await components.${widget}.setFocus(); return true;`);
      wireCSA("Set focus"); // source: fileinput.js:441
      wireRunQueryButton();

      // focusFn targets the Browse button specifically (FileInput.jsx:94-98), not the
      // wrapper — so the assertion has to name the same element the CSA acts on.
      const expectFocused = () => cy.get(fileInputSelector.browseButton(widget)).scrollIntoView().should("have.focus");
      // Clicking button2 moves focus off the trigger, so this is a real transition.
      const expectNotFocused = () =>
        cy.get(fileInputSelector.browseButton(widget)).scrollIntoView().should("not.have.focus");

      // ── editor ──
      expectNotFocused();
      runBothTriggers(expectFocused, expectFocused);

      // ── preview ──
      cy.openPreview(fileInputSelector.field(widget));
      expectNotFocused();
      runBothTriggers(expectFocused, expectFocused, PREVIEW);
    });

    it("should blur the trigger via the Set blur CSA", () => {
      createRunJSQuery(`await components.${widget}.setBlur(); return true;`);
      wireCSA("Set blur"); // source: fileinput.js:445
      wireRunQueryButton();

      // blurFn only acts when the trigger is ALREADY the active element
      // (FileInput.jsx:100-104), so focus has to be established or the CSA is a no-op and
      // the assertion would pass without the CSA doing anything.
      const focusTrigger = () => cy.get(fileInputSelector.browseButton(widget)).scrollIntoView().focus();
      const expectNotFocused = () =>
        cy.get(fileInputSelector.browseButton(widget)).scrollIntoView().should("not.have.focus");

      // ── editor ──
      focusTrigger();
      cy.get(fileInputSelector.browseButton(widget)).should("have.focus");
      clickButton("button1");
      expectNotFocused();

      focusTrigger();
      clickButton("button2");
      expectNotFocused();

      // ── preview ──
      cy.openPreview(fileInputSelector.field(widget));
      focusTrigger();
      clickButton("button1", PREVIEW);
      expectNotFocused();

      focusTrigger();
      clickButton("button2", PREVIEW);
      expectNotFocused();
    });

    it("should hide and show the widget via the Set visibility CSA", () => {
      createRunJSQuery(`await components.${widget}.setVisibility(true); return true;`);
      // The Control Component action sets FALSE and the RunJS query sets TRUE, so the two
      // triggers move the widget in opposite directions rather than repeating each other.
      wireCSA("Set visibility", false); // source: fileinput.js:449
      wireRunQueryButton();

      // FileInput.jsx:236 returns null, so the widget root leaves the DOM entirely.
      // `exist` + scrollIntoView rather than `be.visible`: clicking either companion
      // button re-centres the canvas, so a freshly re-shown widget can be off-screen and
      // fail a visibility assertion for a reason that has nothing to do with the CSA.
      const expectHidden = () => cy.get(fileInputSelector.widget(widget)).should("not.exist");
      const expectShown = () => cy.get(fileInputSelector.widget(widget)).scrollIntoView().should("exist");

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
      cy.openPreview(fileInputSelector.field(widget));
      expectShown();
      runBothTriggers(expectHidden, expectShown, PREVIEW);
    });

    it("should disable and enable the trigger via the Set disable CSA", () => {
      createRunJSQuery(`await components.${widget}.setDisable(false); return true;`);
      wireCSA("Set disable", true); // source: fileinput.js:461
      wireRunQueryButton();

      const expectDisabled = () => {
        cy.get(fileInputSelector.browseButton(widget)).scrollIntoView().should("be.disabled");
        cy.get(fileInputSelector.fieldDisabled(widget)).should("exist");
      };
      const expectEnabled = () =>
        cy.get(fileInputSelector.browseButton(widget)).scrollIntoView().should("not.be.disabled");

      // ── editor ──
      expectEnabled();
      runBothTriggers(expectDisabled, expectEnabled);
      verifyExposedValue("isDisabled", "Boolean", "false");

      // ── preview ──
      cy.openPreview(fileInputSelector.field(widget));
      expectEnabled();
      runBothTriggers(expectDisabled, expectEnabled, PREVIEW);
    });

    it("should toggle the loader via the Set loading CSA", () => {
      createRunJSQuery(`await components.${widget}.setLoading(false); return true;`);
      wireCSA("Set loading", true); // source: fileinput.js:473
      wireRunQueryButton();

      // Loader and Browse are the two branches of one ternary (FileInput.jsx:287-318), so
      // both are asserted — presence alone would not prove the swap.
      // scrollIntoView for the same reason as Set visibility: the companion clicks move
      // the canvas, so `exist` is the assertion that reflects the CSA rather than the
      // viewport.
      const expectLoading = () => {
        cy.get(fileInputSelector.loader(widget)).scrollIntoView().should("exist");
        cy.get(fileInputSelector.browseButton(widget)).should("not.exist");
      };
      const expectNotLoading = () => {
        cy.get(fileInputSelector.loader(widget)).should("not.exist");
        cy.get(fileInputSelector.browseButton(widget)).scrollIntoView().should("exist");
      };

      // ── editor ──
      expectNotLoading();
      runBothTriggers(expectLoading, expectNotLoading);
      verifyExposedValue("isLoading", "Boolean", "false");

      // ── preview ──
      cy.openPreview(fileInputSelector.field(widget));
      expectNotLoading();
      runBothTriggers(expectLoading, expectNotLoading, PREVIEW);
    });
  }
);
