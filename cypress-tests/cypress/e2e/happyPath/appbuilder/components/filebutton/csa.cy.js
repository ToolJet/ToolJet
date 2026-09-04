import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText, fileButtonFixtures } from "Texts/appBuilder/components/fileButton";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { selectEvent, configureCSA } from "Support/utils/appBuilder/events";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import {
  waitForDropSettle,
  verifyExposedValue,
  selectQueryForEvent,
} from "Support/utils/appBuilder/components/fileButton";

// CSA facet — every handle driven by TWO triggers (a Control Component event and a
// RunJS query) in TWO environments (editor and preview).
// Covers all 6 config.actions handles — source: fileButton.js:296-323
//   clear:298 (no params) · setFocus:302 · setBlur:306
//   setVisibility:310 · setDisable:315 · setLoading:320  (each takes a `value` toggle)
describe(
  "File Button CSA",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;
  const { validFile, validFileName } = fileButtonFixtures;
  const panelHeight = 50;
  // Fixed name (fresh app per test) — QueryCard.jsx lowercases it for data-cy.
  const queryName = "csarunjs";

  // Every test runs the same arc — editor: pre → Control Component → RunJS, then
  // preview: pre → Control Component → RunJS. The editor alone is not enough: the
  // canvas runs its own selection/focus machinery, so Set focus / Set blur can pass or
  // fail there for reasons unrelated to the CSA.
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
    // No deselect before this drag — right-sidebar-components-button is a tab
    // toggle, and deselecting first would close the catalog instead of opening it.
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
    // useCallbackActions.js, spells it "Run Query"; that one is the left Inspector's,
    // not the EventManager's.
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

  // Widget data-cy attributes are identical in preview — RenderWidget emits them
  // unconditionally (RenderWidget.jsx:323). Same tab, because the Preview control is a
  // target="_blank" link and the test must stay in one Cypress context.
  const openPreview = () => {
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.waitForElement(fileButtonSelector.button(widget));
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
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget(fileButtonText.defaultWidgetText, 500, 100);
    waitForDropSettle(widget);
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  it("should clear the selected file via the Clear CSA", () => {
    createRunJSQuery(`await components.${widget}.clear(); return true;`);
    wireCSA("Clear");
    wireRunQueryButton();

    // Re-established at each stage: useFilePicker's duplicate guard silently drops a
    // file the widget already holds.
    const holdFile = () => {
      cy.get(fileButtonSelector.inputField(widget)).scrollIntoView().selectFile(validFile, { force: true });
      cy.get(fileButtonSelector.label(widget)).should("have.text", validFileName);
    };
    const expectCleared = () => {
      cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.text", fileButtonText.defaultLabel);
      cy.get(fileButtonSelector.clearButton(widget)).should("not.exist");
    };

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
    openPreview();
    holdFile();
    clickButton("button1", PREVIEW);
    expectCleared();

    holdFile();
    clickButton("button2", PREVIEW);
    expectCleared();
  });

  it("should focus the trigger via the Set focus CSA", () => {
    createRunJSQuery(`await components.${widget}.setFocus(); return true;`);
    wireCSA("Set focus");
    wireRunQueryButton();

    const expectFocused = () =>
      cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("have.focus");
    // Clicking button2 moves focus off the trigger, so this is a real transition.
    const expectNotFocused = () =>
      cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("not.have.focus");

    // ── editor ──
    expectNotFocused();
    runBothTriggers(expectFocused, expectFocused);

    // ── preview ──
    openPreview();
    expectNotFocused();
    runBothTriggers(expectFocused, expectFocused, PREVIEW);
  });

  it("should blur the trigger via the Set blur CSA", () => {
    createRunJSQuery(`await components.${widget}.setBlur(); return true;`);
    wireCSA("Set blur");
    wireRunQueryButton();

    const focusTrigger = () =>
      cy.get(fileButtonSelector.button(widget)).scrollIntoView().focus().should("have.focus");
    const expectBlurred = () =>
      cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("not.have.focus");

    // ── editor ──
    focusTrigger();
    clickButton("button1");
    expectBlurred();
    focusTrigger();
    clickButton("button2");
    expectBlurred();

    // ── preview ──
    openPreview();
    focusTrigger();
    clickButton("button1", PREVIEW);
    expectBlurred();
    focusTrigger();
    clickButton("button2", PREVIEW);
    expectBlurred();
  });

  it("should hide the widget via the Set visibility CSA", () => {
    createRunJSQuery(`await components.${widget}.setVisibility(true); return true;`);
    wireCSA("Set visibility", false);
    wireRunQueryButton();

    // isVisible:false returns null (FileButton.jsx:173) — the root leaves the DOM.
    const expectHidden = () => cy.get(fileButtonSelector.widget(widget)).should("not.exist");
    const expectShown = () => cy.get(fileButtonSelector.widget(widget)).scrollIntoView().should("exist");

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
    openPreview();
    expectShown();
    runBothTriggers(expectHidden, expectShown, PREVIEW);
  });

  it("should disable the trigger via the Set disable CSA", () => {
    createRunJSQuery(`await components.${widget}.setDisable(false); return true;`);
    wireCSA("Set disable", true);
    wireRunQueryButton();

    const expectDisabled = () => {
      cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("be.disabled");
      cy.get(fileButtonSelector.ariaDisabled(widget)).should("exist");
    };
    const expectEnabled = () => {
      cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("not.be.disabled");
      cy.get(fileButtonSelector.ariaDisabled(widget)).should("not.exist");
    };

    // ── editor ──
    expectEnabled();
    verifyExposedValue("isDisabled", "Boolean", "false");
    clickButton("button1");
    expectDisabled();
    verifyExposedValue("isDisabled", "Boolean", "true");
    clickButton("button2");
    expectEnabled();
    verifyExposedValue("isDisabled", "Boolean", "false");

    // ── preview ──
    openPreview();
    expectEnabled();
    runBothTriggers(expectDisabled, expectEnabled, PREVIEW);
  });

  it("should show the loader via the Set loading CSA", () => {
    createRunJSQuery(`await components.${widget}.setLoading(false); return true;`);
    wireCSA("Set loading", true);
    wireRunQueryButton();

    // Loader and label are mutually exclusive (the isLoading branch).
    const expectLoading = () => {
      cy.get(fileButtonSelector.loader(widget)).scrollIntoView().should("be.visible");
      cy.get(fileButtonSelector.label(widget)).should("not.exist");
      cy.get(fileButtonSelector.ariaBusy(widget)).should("exist");
    };
    const expectIdle = () => {
      cy.get(fileButtonSelector.loader(widget)).should("not.exist");
      cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("be.visible");
    };

    // ── editor ──
    expectIdle();
    verifyExposedValue("isLoading", "Boolean", "false");
    clickButton("button1");
    expectLoading();
    verifyExposedValue("isLoading", "Boolean", "true");
    clickButton("button2");
    expectIdle();
    verifyExposedValue("isLoading", "Boolean", "false");

    // ── preview ──
    openPreview();
    expectIdle();
    runBothTriggers(expectLoading, expectIdle, PREVIEW);
  });
});
