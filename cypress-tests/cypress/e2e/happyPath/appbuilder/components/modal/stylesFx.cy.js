import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { modalSelector } from "Selectors/modal";
import {
  launchModal,
  closeModal,
  launchButton,
} from "Support/utils/appBuilder/components/modal";
import {
  verifyAndModifyStylePickerFx,
  openEditorSidebar,
  openAccordion,
} from "Support/utils/commonWidget";

// StylesFx facet — style pickers in fx mode. ModalV2's four "Background" colour
// swatches (header/body/footer/triggerButton) share displayName "Background", so
// they are disambiguated by accordion-order eq() index (header/body/footer =
// 0/1/2); the trigger button "Text" swatch is uniquely labelled. The trigger
// button "Font size" numberInput fx row is driven directly (not a -picker row).
// A negative case confirms the "Hover background" switch exposes no fx button.
// testIsolation:false for cypress-real-dnd; each test re-creates its own app.
describe("Modal — stylesFx facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  const openStyles = () => {
    openEditorSidebar(W);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("trigger button", []);
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-StylesFx`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  // triggerButtonTextColor (colorSwatches, fxCapable) — displayName "Text" is
  // unique within the trigger-button accordion. fx default var(--cc-surface1-
  // surface) → token "Surface/Surface1", resolves to #FFFFFF (surface-cache).
  // source: modalV2.js:293,435
  it("trigger button — Text colour fx-code path", () => {
    openStyles();
    verifyAndModifyStylePickerFx(
      "Text",
      "Surface/Surface1", // swatch token name (surface-cache colorTokenNames)
      "#333333", // fx test literal (CodeMirror echoes verbatim)
      0,
      "",
      false,
      "#FFFFFF" // resolved hex of var(--cc-surface1-surface) (surface-cache)
    );
  });

  // NEGATIVE — triggerButtonHoverBackgroundMode ("Hover background", switch) sets
  // isFxNotRequired:true, so its style row renders the label but NO fx button
  // (SingleLineCodeEditor.jsx:699 returns null when isFxNotRequired !== undefined,
  // mirroring textinput's `padding`). NOTE Font Weight (select) is NOT a valid
  // negative case here: it sets no isFxNotRequired, so it DOES expose an fx button.
  // source: modalV2.js:268-278
  it("trigger button — Hover background (switch, isFxNotRequired) exposes NO fx button", () => {
    openStyles();
    cy.get(commonWidgetSelector.parameterLabel("Hover background")).should(
      "exist"
    );
    cy.get(commonWidgetSelector.parameterFxButton("Hover background")).should(
      "not.exist"
    );
  });

  // The four "Background" colour swatches (header / container / footer / trigger
  // button — modalV2.js:214/232/241/259) all share displayName "Background", so
  // `background-picker` / `background-fx-button` / `background-input-field` are
  // NOT unique. They render in accordion order, so header/body/footer are indices
  // 0/1/2 (trigger button is 3) — the same eq() disambiguation styles.cy.js uses
  // for the direct-apply case. Here we exercise the fx/code path per swatch:
  // reveal the fx button on hover, toggle to code, type a literal hex into the
  // CodeMirror row, then assert the resolved background-color once the modal is
  // open. Typing an explicit hex sidesteps the theme-derived default (var(--cc-*))
  // whose resolved hex is not statically derivable. source: modalV2.js:213-267
  it("Background colours fx-code path (header / body / footer)", () => {
    const SLOTS = [
      {
        eqIndex: 0, // headerBackgroundColor — source: modalV2.js:214,429
        selector: modalSelector.modalHeader,
        hex: "#ff0000",
        css: "rgb(255, 0, 0)",
      },
      {
        eqIndex: 1, // bodyBackgroundColor — source: modalV2.js:232,431
        selector: modalSelector.modalBody,
        hex: "#00ff00",
        css: "rgb(0, 255, 0)",
      },
      {
        eqIndex: 2, // footerBackgroundColor — source: modalV2.js:241,430
        selector: modalSelector.modalFooter,
        hex: "#0000ff",
        css: "rgb(0, 0, 255)",
      },
    ];

    // Set colours while the modal is CLOSED (opening first multiplies the
    // canvases). No accordion is opened: all four Background swatches render on
    // the Styles tab regardless (parity with styles.cy.js).
    openEditorSidebar(W);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    // Toggle in ascending accordion order (header→body→footer). Target the
    // fx BUTTON by index, NOT the swatch: a row's `background-picker` is REPLACED
    // by the code editor once it flips to fx mode, so the picker set shrinks and
    // its indices shift each iteration — whereas every row always renders an
    // fx button in stable accordion order (header 0 / body 1 / footer 2 /
    // trigger 3). The fx button is CSS-hidden until hover, so force-click it. The
    // fx CodeMirror rows accumulate in the same order, so `background-input-field`
    // eq(eqIndex) matches the swatch index when toggling ascending.
    SLOTS.forEach(({ eqIndex, hex }) => {
      cy.log(`**Background swatch #${eqIndex} → fx ${hex}**`);
      cy.get(commonWidgetSelector.parameterFxButton("Background"))
        .eq(eqIndex)
        .scrollIntoView()
        .click({ force: true });
      cy.get(commonWidgetSelector.stylePickerFxInput("Background"))
        .eq(eqIndex)
        .clearAndTypeOnCodeMirror(hex);
      cy.waitForAutoSave();
    });

    launchModal(W);
    SLOTS.forEach(({ selector, css }) => {
      cy.get(selector).should("have.css", "background-color", css);
    });
    closeModal(W);
  });

  // triggerButtonTextSize (numberInput, default 14) fx. This is NOT a colour/
  // -picker row, so verifyAndModifyStylePickerFx (which asserts `<param>-picker`
  // / `-value`) does not apply. The numberInput renders `font-size-input`
  // (NumberInput.jsx:44) with its own fx button `font-size-fx-button` and, in
  // code mode, the CodeMirror row `font-size-input-field`
  // (SingleLineCodeEditor.jsx:567). Drive that fx path directly: reveal the fx
  // button on hover, toggle to code, assert the editor echoes the default (14),
  // type a binding, and confirm it resolves onto the trigger label span (parity
  // with the direct-apply styles.cy.js case). source: modalV2.js:302,436
  it("trigger button — Font size (numberInput) fx-code path", () => {
    openStyles();
    cy.get(commonWidgetSelector.parameterLabel("Font size")).should(
      "have.text",
      "Font size"
    );

    cy.get(modalSelector.fontSizeInput).scrollIntoView().realHover();
    cy.get(commonWidgetSelector.parameterFxButton("Font size")).click();
    // The numberInput's fx editor seeds the default as a binding, `{{14}}`
    // (not a bare `14`). source: modalV2.js:307 (defaultValue 14)
    cy.get(commonWidgetSelector.stylePickerFxInput("Font size")).within(() => {
      cy.get(".cm-line").should("be.visible").and("have.text", "{{14}}");
    });

    cy.get(
      commonWidgetSelector.stylePickerFxInput("Font size")
    ).clearAndTypeOnCodeMirror("{{20}}");
    cy.waitForAutoSave();

    // fx binding resolves → trigger label <span> renders at 20px (ModalV2.jsx:291).
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
    cy.get(launchButton(W))
      .find("span")
      .first()
      .should("have.css", "font-size", "20px");
  });
});
