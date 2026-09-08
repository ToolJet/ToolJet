import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { filePickerSelector } from "Selectors/appBuilder/components/filePicker";
import { filePickerText, filePickerAccordion } from "Texts/appBuilder/components/filePicker";
import {
  openStyleAccordion,
  selectThemeColour,
  expectThemeColour,
  selectColourFromColourPicker,
  fillBoxShadowParams,
  verifyBoxShadowCss,
  waitForDropSettle,
} from "Support/utils/commonWidget";
import { commitChange } from "Support/utils/appBuilder/components/filePicker";

// Styles facet — every entry in config.styles, which is only FOUR on this widget against
// File Input's 17: File Picker has no label alignment/width group and no icon at all.
// Covers: dropzoneTitleColor:297 (File Drop Area) · borderRadius:327 · boxShadow:333 ·
//         padding:345 (Container)                              — source: filepicker.js
// Not here: five styles that are COMMENTED OUT in the config (:303-326, :339-344) —
//           dropzoneActiveColor, dropzoneErrorColor, containerBackgroundColor,
//           containerBorder, containerPadding. They are not on the surface, so the live
//           accordions must expose exactly the four above. Listed in commentedOutStyles.
//           cssClass (the Styles tab's Advanced group) is not in any widget config and is
//           enterprise-gated (PlanTerms BASIC_PLAN_TERMS.customStyling: false), so a test
//           would pass on a licensed box and fail on a basic/CE runner.
describe(
  "File Picker styles",
  { testIsolation: false, retries: { runMode: Number(Cypress.env("TJ_RETRIES") ?? 3), openMode: 0 } },
  () => {
    const widget = filePickerText.defaultWidgetName;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filepicker-App`);
      cy.openApp();
      cy.dragAndDropWidget(filePickerText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
    });

    afterEach(function () {
      if (this.currentTest.state === "passed") cy.apiDeleteApp();
    });

    /* -------------------------------------------------------- drop area ---- */

    it("should verify Title: theme swatch and RGBA picker", () => {
      // dropzoneTitleColor does NOT set a colour on the title. It is written imperatively
      // as a CUSTOM PROPERTY on the widget root — `--file-picker-text-primary`
      // (FilePicker.jsx:104) — which the <h3> then reads via var()
      // (FilePicker.jsx:230, style.scss:56). So the assertion targets the root's variable
      // and the title's COMPUTED colour, never the title's own inline style, which stays
      // the literal string "var(--file-picker-text-primary)".
      openStyleAccordion(widget, filePickerAccordion.styleDropArea);
      selectThemeColour("Title", "SystemStatus/Error"); // source: filepicker.js:297
      expectThemeColour(filePickerSelector.title(widget), "color", "var(--cc-error-systemStatus)");

      // RGBA picker: a literal must win over the token.
      openStyleAccordion(widget, filePickerAccordion.styleDropArea);
      selectColourFromColourPicker("Title", fake.randomRgba);
      cy.get(filePickerSelector.widget(widget))
        .invoke("attr", "style")
        .should("match", /--file-picker-text-primary:\s*(#|rgba?\()/);
    });

    it("should expose only Title in the File Drop Area group", () => {
      // The four commented-out swatches (filepicker.js:303-326) would live in these two
      // groups if they were live. Asserting their absence is what keeps a future
      // uncomment from silently going untested — the coverage audit reads this facet's
      // it-titles, not the config's comment markers.
      openStyleAccordion(widget, filePickerAccordion.styleDropArea);
      cy.get(commonWidgetSelector.parameterLabel("Title")).should("have.text", "Title");
      cy.get(commonWidgetSelector.parameterLabel("Active")).should("not.exist");
      cy.get(commonWidgetSelector.parameterLabel("Error")).should("not.exist");
    });

    /* -------------------------------------------------------- container ---- */

    it("should verify Border radius: direct change", () => {
      // borderRadius lands in TWO places — the root via dynamicDropzoneStyle
      // (FilePicker.jsx:141) and the dropzone via its own inline style
      // (UploadArea.jsx:59). The dropzone is the visible edge, so it is the target here.
      openStyleAccordion(widget, filePickerAccordion.styleContainer);
      // A plain number input (`type: 'numberInput'`, filepicker.js:328), so it is
      // `border-radius-input` driven with type() — NOT the `-input-field` CodeMirror
      // control that `type: 'code'` fields use.
      cy.get('[data-cy="border-radius-input"]').clear().type("24"); // source: filepicker.js:327
      commitChange();

      cy.get(filePickerSelector.dropzone(widget)).should("have.css", "border-radius", "24px");
    });

    it("should verify Box shadow: direct change", () => {
      const shadowParam = ["17", "13", "7", "3"];
      const shadowColour = [59, 130, 246, 0.8];

      openStyleAccordion(widget, filePickerAccordion.styleContainer);
      // x/y/blur/spread live inside a POPOVER behind the swatch — fillBoxShadowParams does
      // not open it, so without this click its inputs are simply not in the DOM.
      cy.get(commonWidgetSelector.stylePicker("Box shadow")).click();
      fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, shadowParam); // source: filepicker.js:333
      selectColourFromColourPicker("Box shadow Color", shadowColour);

      // The shadow is an inline style on the widget ROOT (FilePicker.jsx:215), not on the
      // draggable wrapper that verifyBoxShadowCss defaults to — and the colour argument is
      // an [r,g,b,a] ARRAY, not a css string.
      verifyBoxShadowCss(filePickerSelector.widget(widget), shadowColour, shadowParam, "css");
    });

    it("should verify Padding: None removes the wrapper padding", () => {
      // Applied by the shared canvas wrapper, not the widget: RenderWidget.jsx:320 sets
      // `padding: resolvedStyles?.padding == 'none' ? '0px' : `${BOX_PADDING}px``, and
      // BOX_PADDING is 2 (appCanvasConstants.js:57).
      //
      // Asserted on the PADDING itself rather than on a height difference. The wrapper is
      // border-box with a layout-fixed height (defaultSize 220, filepicker.js:8), so
      // dropping 2px of padding leaves outerHeight unchanged — a height comparison reports
      // "nothing happened" for a feature that works.
      openStyleAccordion(widget, filePickerAccordion.styleContainer);
      cy.get('[data-cy="togglr-button-default"]')
        .closest('[role="radio"]')
        .should("have.attr", "aria-checked", "true");
      cy.get(filePickerSelector.draggableWidget(widget)).should("have.css", "padding", "2px");

      cy.get('[data-cy="togglr-button-none"]').click(); // source: filepicker.js:345
      cy.waitForAutoSave();
      // Precondition, not the coverage: the padding assertion below is the effect.
      cy.get('[data-cy="togglr-button-none"]')
        .closest('[role="radio"]')
        .should("have.attr", "aria-checked", "true");
      cy.get(filePickerSelector.draggableWidget(widget)).should("have.css", "padding", "0px");
    });
  }
);
