import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { modalSelector } from "Selectors/modal";
import {
  launchModal,
  closeModal,
  launchButton,
} from "Support/utils/appBuilder/components/modal";
import {
  openEditorSidebar,
  selectFromSidebarDropdown,
} from "Support/utils/commonWidget";

// Styles facet — the Modal's Styles-tab controls. The trigger-button font size
// is asserted live (proven). The colour swatches and the font-weight / content-
// alignment controls are QUARANTINED / RESOLVE-LIVE below with rationale.
// testIsolation:false for cypress-real-dnd; each test re-creates its own app.
describe("Modal — styles facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-Styles`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  // Trigger-button font size — triggerButtonTextSize (numberInput, default 14).
  // source: modalV2.js:302,436. The trigger label span carries the inline size.
  it("trigger-button font size applies to the label", () => {
    openEditorSidebar(W);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    cy.get(modalSelector.fontSizeInput)
      .scrollIntoView()
      .clear()
      .type("20")
      .blur();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });

    cy.get(launchButton(W))
      .find("span")
      .first()
      .should("have.css", "font-size", "20px");
  });

  // Header / body / footer background colours. All four modal colour swatches
  // share displayName "Background" (header / container / footer / trigger
  // button — modalV2.js:214/232/241/259), so `background-picker` is NOT unique.
  // They render in accordion order (header, container, footer, trigger button),
  // so the header/body/footer Background swatches are indices 0/1/2 — target
  // each by index via selectColourFromColourPicker's `hasIndex` (eq) arg,
  // skipping the trigger-button Background at index 3. A fully-opaque rgba is
  // set so the computed background-color is a deterministic rgb() to assert.
  it("header / body / footer background colours", () => {
    const SLOTS = [
      {
        eqIndex: 0, // headerBackgroundColor — source: modalV2.js:214,429
        selector: modalSelector.modalHeader,
        rgba: ["255", "0", "0", "100"],
        css: "rgb(255, 0, 0)",
      },
      {
        eqIndex: 1, // bodyBackgroundColor — source: modalV2.js:232,431
        selector: modalSelector.modalBody,
        rgba: ["0", "255", "0", "100"],
        css: "rgb(0, 255, 0)",
      },
      {
        eqIndex: 2, // footerBackgroundColor — source: modalV2.js:241,430
        selector: modalSelector.modalFooter,
        rgba: ["0", "0", "255", "100"],
        css: "rgb(0, 0, 255)",
      },
    ];

    // Set a "Background" swatch by its index, then dismiss the colour popover
    // by clicking the Styles tab — a SINGLE element OUTSIDE the popover (its
    // mousedown triggers the OverlayTrigger's rootClose). The usual canvas-click
    // dismiss (selectColourFromColourPicker / forceClickOnCanvas) can't be used:
    // a Modal on the canvas creates multiple `[data-cy=real-canvas]` nodes, so
    // that click throws "N elements".
    const setBackground = (eqIndex, rgba) => {
      // eq(eqIndex) scopes to the header(0)/body(1)/footer(2) "Background"
      // swatch, avoiding the trigger-button Background collision (index 3).
      cy.get(commonWidgetSelector.stylePicker("Background"))
        .eq(eqIndex)
        .scrollIntoView()
        .click();
      // The popover can default to the "Theme" view (no rgba inputs) — switch to
      // the Color picker so the editable fields are present.
      cy.get("body").then(($b) => {
        if ($b.find('[data-cy="togglr-button-color"]:visible').length > 0) {
          cy.get('[data-cy="togglr-button-color"]:visible').first().click();
        }
      });
      // rc-editable-input eq(1..4) = R,G,B,A (eq(0) is the Hex field).
      rgba.forEach((value, i) =>
        cy
          .get(commonWidgetSelector.colourPickerInput(i + 1))
          .click()
          .clear()
          .type(value)
      );
      cy.waitForAutoSave();
      cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click({ force: true }); // dismiss popover
    };

    // Set colours while the modal is CLOSED (styles still apply to the
    // definition; opening first would multiply the canvases). Then open the
    // modal and assert each slot rendered with its colour.
    openEditorSidebar(W);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    SLOTS.forEach(({ eqIndex, rgba, css }) => {
      cy.log(`**Background swatch #${eqIndex} → ${css}**`);
      setBackground(eqIndex, rgba);
    });

    launchModal(W);
    SLOTS.forEach(({ selector, css }) => {
      cy.get(selector).should("have.css", "background-color", css);
    });

    closeModal(W);
  });

  // Trigger-button Font Weight (select) + Content alignment (alignButtons).
  // Both live in the "trigger button" Styles accordion and apply to the trigger
  // button on the canvas (modal stays closed → single canvas, no popover here).
  it("trigger-button font weight + content alignment", () => {
    openEditorSidebar(W);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    // Font Weight — triggerButtonFontWeight (select, default 'normal'). Renders
    // as `dropdown-font-weight` (CodeBuilder/Elements/Select.jsx:85) and applies
    // to the trigger label <span> (ModalV2.jsx:291). 'bold' → computed 700.
    // source: modalV2.js:311,437
    selectFromSidebarDropdown("Font Weight", "bold");
    cy.waitForAutoSave();
    cy.get(launchButton(W))
      .find("span")
      .first()
      .should("have.css", "font-weight", "700");

    // Content alignment — triggerButtonContentAlignment (alignButtons → radix
    // ToggleGroup with class `inspector-align-buttons`; each item is
    // `[data-cy="togglr-button-<value>"]` — AlignButtons.jsx:13 +
    // ToggleGroupItem.jsx:33). It is NOT a `name="alignment"` radio group. The
    // `direction` Switch in the SAME accordion also renders togglr-button-left/
    // right (Switch.jsx:14), so the alignment items MUST be scoped by
    // `.inspector-align-buttons`.
    // Maps to justify-content on the trigger <button> (stylesFactory.js:28-33,60).
    // direction defaults to 'left' (modalV2.js:428) → isReverseDirection === true,
    // so the mapping is REVERSED: right → flex-start, left → flex-end.
    // source: modalV2.js:323,438
    const alignItem = (value) =>
      `.inspector-align-buttons [data-cy="togglr-button-${value}"]`;

    cy.get(alignItem("right")).click({ force: true });
    cy.waitForAutoSave();
    cy.get(launchButton(W)).should("have.css", "justify-content", "flex-start");

    cy.get(alignItem("left")).click({ force: true });
    cy.waitForAutoSave();
    cy.get(launchButton(W)).should("have.css", "justify-content", "flex-end");
  });
});
