import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputAccordion, fileInputFixtures } from "Texts/appBuilder/components/fileInput";
import {
  commitChange,
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  waitForDropSettle,
  openStyleAccordion,
  selectThemeColour,
  expectThemeColour,
  selectColourFromColourPicker,
  fillBoxShadowParams,
  verifyBoxShadowCss,
} from "Support/utils/commonWidget";
import {
  attachFile,
  unlockLabelWidth,
  toggleIconVisibility,
  getWidgetHeight,
} from "Support/utils/appBuilder/components/fileInput";

// Styles facet — organised by the accordion each entry declares in its `accordian` key.
// Covers all 17 config.styles plus the orphan iconVisibility, 18 items in total:
//   label (7)      labelColor:234 · labelFontSize:240 · alignment:246 · direction:256 ·
//                  auto:269 · labelWidth:280 · widthType:296
//   field (10)     icon:320 · iconVisibility:513 (orphan, see below) · iconColor:327 ·
//                  backgroundColor:337 · borderColor:346 · accentColor:355 · textColor:364 ·
//                  errTextColor:373 · borderRadius:382 · boxShadow:394
//   container (1)  padding:406
// source: fileinput.js
//
// iconVisibility has NO schema entry — only a stored default in definition.styles
// (fileinput.js:513) — but it IS a user-reachable eye toggle and it gates whether the
// icon renders at all, so it is covered here rather than treated as config noise.
//
// Every colour field is driven through BOTH paths, theme swatch then RGBA picker, because
// they are separate branches and the literal must override the token.
// The theme half also sidesteps a trap: the widget guards every colour against a sentinel
// literal — backgroundColor against '#fff' (FileInput.jsx:176), borderColor against
// '#CCD1D5' (:168), textColor against '#1B1F24'/'#000'/'#000000ff' (:183), labelColor
// against a similar list (Label.jsx:52) — and silently substitutes a theme fallback on a
// match, so a test picking one of those hexes would assert the fallback and pass for the
// wrong reason. Theme tokens never equal those literals.
describe(
  "File Input styles",
  { testIsolation: false },
  () => {
    const widget = fileInputText.defaultWidgetName;
    const { csvFile } = fileInputFixtures;

    beforeEach(() => {
      cy.apiLogin();
      cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Fileinput-App`);
      cy.openApp();
      cy.dragAndDropWidget(fileInputText.defaultWidgetText, 500, 100);
      waitForDropSettle(widget);
      closeQueryPanel();
    });

    afterEach(() => {
      cy.apiDeleteApp();
    });

    // The picker does not always land on the exact value typed, so assert the theme token
    // was replaced by a literal rather than pinning an rgba()
    const expectLiteralColour = (selector, cssProp) =>
      cy.get(selector).should(($el) => {
        const v = ($el[0].style[cssProp] || "").trim();
        expect(v, "theme token replaced by a literal").to.not.match(/var\(/);
        expect(v, "is a colour literal").to.match(/^(#|rgba?\()/);
      });

    /* ---------------------------------------------------------------- label ---- */

    it("should verify Color: theme swatch and RGBA picker", () => {
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      selectThemeColour("Color", "SystemStatus/Error"); // source: fileinput.js:234
      // The colour lands on the inner <p>, not the <label> wrapper (Label.jsx:52).
      expectThemeColour(fileInputSelector.labelText(widget), "color", "var(--cc-error-systemStatus)");

      // RGBA picker: a literal must win over the token
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      selectColourFromColourPicker("Color", fake.randomRgba);
      expectLiteralColour(fileInputSelector.labelText(widget), "color");
    });

    it("should verify Size: direct change", () => {
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      cy.get('[data-cy="size-input"]').clear().type("20"); // source: fileinput.js:240
      commitChange();
      cy.get(fileInputSelector.label(widget)).should("have.css", "font-size", "20px");
    });

    it("should verify Alignment: direct toggle between top and side", () => {
      // Ships `top` (fileinput.js:510), which renders as tw-flex-col on the widget root.
      // Asserting the layout CLASS rather than mere visibility is what proves the label
      // actually moved — a be.visible check passes in both alignments.
      cy.get(fileInputSelector.widget(widget)).should("have.class", "tw-flex-col");

      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      cy.get(commonWidgetSelector.togglrButton("side")).click(); // source: fileinput.js:246
      cy.waitForAutoSave();

      cy.get(fileInputSelector.widget(widget)).should("have.class", "tw-flex-row");
      cy.get(fileInputSelector.widget(widget)).should("not.have.class", "tw-flex-col");
    });

    it("should verify Direction: direct toggle only", () => {
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      cy.get(commonWidgetSelector.togglrButton("right")).click(); // source: fileinput.js:256
      cy.waitForAutoSave();

      // With the shipped `top` alignment, direction right adds tw-text-right
      // (FileInput.jsx:246) and pushes the label content to the end (Label.jsx:39).
      cy.get(fileInputSelector.widget(widget)).should("have.class", "tw-text-right");
      cy.get(fileInputSelector.label(widget)).should("have.css", "justify-content", "flex-end");
    });

    it("should verify Width: unchecking auto reveals the width controls", () => {
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      // auto ships ON and is itself gated on alignment=side (fileinput.js:274-277), so
      // the checkbox does not even render until alignment flips.
      cy.get('[data-cy="auto-width-checkbox"]').should("not.exist");

      unlockLabelWidth(); // alignment=side, then uncheck auto — the two-level gate
      // source: fileinput.js:269 (auto) · :280 (labelWidth) · :296 (widthType)
      cy.get('[data-cy="width-input-field"]').should("be.visible");
      cy.get('[data-cy="dropdown-common"]').should("be.visible");

      // auto off swaps the label's width from `auto` to the stored percentage.
      cy.get(fileInputSelector.label(widget)).should("not.have.css", "width", "auto");
    });

    it("should verify Width type: Of the Field caps the label width", () => {
      openStyleAccordion(widget, fileInputAccordion.styleLabel);
      unlockLabelWidth();

      // widthType is a react-select with no per-option data-cy, picked by visible text.
      // source: fileinput.js:296-302
      cy.get('[data-cy="dropdown-common"]').click();
      cy.get(".react-select__option").filter((_i, el) => el.innerText.trim() === "Of the Field").click();
      cy.waitForAutoSave();

      // ofField + side is the only combination that caps maxWidth at 70% (Label.jsx:36).
      cy.get(fileInputSelector.label(widget)).should("have.css", "max-width").and("not.equal", "100%");
    });

    /* ----------------------------------------------------------------- field ---- */

    it("should verify Icon: renders only once icon visibility is on", () => {
      // The configured IconFileSearch (fileinput.js:512) is inert while iconVisibility is
      // false (fileinput.js:513), so absence-then-presence is the real assertion here.
      cy.get(fileInputSelector.icon(widget)).should("not.exist");

      openStyleAccordion(widget, fileInputAccordion.styleField);
      toggleIconVisibility();
      cy.get(fileInputSelector.icon(widget)).should("be.visible");
    });

    it("should verify Icon color: theme swatch and RGBA picker", () => {
      openStyleAccordion(widget, fileInputAccordion.styleField);
      toggleIconVisibility();
      // displayName is an empty string, so the control's data-cy falls back to the config
      // key: iconColor → `iconcolor-picker`. source: fileinput.js:327-333
      selectThemeColour("iconColor", "SystemStatus/Error");
      // TablerIcon forwards `color` to the SVG's STROKE, not to its `color` property —
      // asserting `color` reads an inherited value that never changes, which passes or
      // fails for reasons unrelated to this control.
      expectThemeColour(fileInputSelector.icon(widget), "stroke", "var(--cc-error-systemStatus)");

      // tabler puts the colour on the svg's stroke PRESENTATION ATTRIBUTE, so both
      // style.stroke and style.color read empty — assert the computed effect instead
      cy.get(fileInputSelector.icon(widget))
        .then(($el) => getComputedStyle($el[0]).stroke)
        .then((themeStroke) => {
          openStyleAccordion(widget, fileInputAccordion.styleField);
          selectColourFromColourPicker("iconColor", fake.randomRgba);
          cy.get(fileInputSelector.icon(widget)).should(($el) => {
            expect(getComputedStyle($el[0]).stroke, "literal replaced the theme token").to.not.equal(themeStroke);
          });
        });
    });

    it("should verify Background: theme swatch and RGBA picker", () => {
      openStyleAccordion(widget, fileInputAccordion.styleField);
      selectThemeColour("Background", "SystemStatus/Error"); // source: fileinput.js:337
      expectThemeColour(fileInputSelector.field(widget), "backgroundColor", "var(--cc-error-systemStatus)");

      // RGBA picker: a literal must win over the token
      openStyleAccordion(widget, fileInputAccordion.styleField);
      selectColourFromColourPicker("Background", fake.randomRgba);
      expectLiteralColour(fileInputSelector.field(widget), "backgroundColor");
    });

    it("should verify Border: theme swatch and RGBA picker", () => {
      openStyleAccordion(widget, fileInputAccordion.styleField);
      selectThemeColour("Border", "SystemStatus/Error"); // source: fileinput.js:346
      expectThemeColour(fileInputSelector.field(widget), "borderColor", "var(--cc-error-systemStatus)");

      // RGBA picker: a literal must win over the token
      openStyleAccordion(widget, fileInputAccordion.styleField);
      selectColourFromColourPicker("Border", fake.randomRgba);
      expectLiteralColour(fileInputSelector.field(widget), "borderColor");
    });

    it("should verify Text: theme swatch and RGBA picker", () => {
      openStyleAccordion(widget, fileInputAccordion.styleField);
      selectThemeColour("Text", "SystemStatus/Error"); // source: fileinput.js:364
      expectThemeColour(fileInputSelector.field(widget), "color", "var(--cc-error-systemStatus)");

      // RGBA picker: a literal must win over the token
      openStyleAccordion(widget, fileInputAccordion.styleField);
      selectColourFromColourPicker("Text", fake.randomRgba);
      expectLiteralColour(fileInputSelector.field(widget), "color");
    });

    // FAILS — open bug, left red on purpose. accentColor is declared (fileinput.js:355)
    // and destructured (FileInput.jsx:55), then never referenced again — not in
    // computedStyles, the JSX, or useFilePicker. Asserts what SHOULD hold.
    it("should verify Accent: theme swatch changes the rendered widget", () => {
      openStyleAccordion(widget, fileInputAccordion.styleField);
      cy.get(commonWidgetSelector.stylePicker("Accent")).last().should("be.visible");

      cy.get(fileInputSelector.field(widget))
        .invoke("attr", "style")
        .then((before) => {
          selectThemeColour("Accent", "SystemStatus/Error");
          // Any observable difference would satisfy this — the bug is that there is none.
          cy.get(fileInputSelector.field(widget)).invoke("attr", "style").should("not.equal", before);
        });
    });

    it("should verify Error text: theme swatch and RGBA picker", () => {
      openEditorSidebar(widget);
      openAccordion("Validation");
      verifyAndModifyParameter("Min files", "{{2}}");
      commitChange();

      openStyleAccordion(widget, fileInputAccordion.styleField);
      selectThemeColour("Error text", "SystemStatus/Error"); // source: fileinput.js:373

      // errTextColor only has a target once an error is actually showing
      // (FileInput.jsx:350-362), so the error state has to be provoked first.
      attachFile(csvFile);
      expectThemeColour(fileInputSelector.errorMessage(widget), "color", "var(--cc-error-systemStatus)");

      // RGBA picker: a literal must win over the token
      openStyleAccordion(widget, fileInputAccordion.styleField);
      selectColourFromColourPicker("Error text", fake.randomRgba);
      expectLiteralColour(fileInputSelector.errorMessage(widget), "color");
    });

    it("should verify Border radius: direct change", () => {
      openStyleAccordion(widget, fileInputAccordion.styleField);
      cy.get('[data-cy="border-radius-input"]').clear().type("20"); // source: fileinput.js:382
      commitChange();
      cy.get(fileInputSelector.field(widget)).should("have.css", "border-radius", "20px");
    });

    it("should verify Box shadow: direct change", () => {
      openStyleAccordion(widget, fileInputAccordion.styleField);

      // Default is '0px 0px 0px 0px #00000040' (fileinput.js:402). The alpha byte 0x40
      // serialises as 0.25 or 0.251 depending on the browser, so match the shape rather
      // than pinning one rounding.
      cy.get(fileInputSelector.field(widget))
        .should("have.css", "box-shadow")
        .and("match", /^rgba\(0, 0, 0, 0\.25\d*\) 0px 0px 0px 0px$/);

      // Fill x/y/blur/spread in the popover, then pick a colour.
      const directParam = fake.boxShadowParam;
      const directColor = fake.randomRgba;
      cy.get(commonWidgetSelector.stylePicker("Box shadow")).click();
      fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, directParam); // source: fileinput.js:394
      selectColourFromColourPicker("Box shadow Color", directColor);
      // verifyBoxShadowCss defaults to the outer draggable-widget wrapper, but File Input
      // puts boxShadow on its inner field box — pass that selector, and note the colour
      // argument is an [r,g,b,a] ARRAY, not a css string.
      verifyBoxShadowCss(fileInputSelector.field(widget), directColor, directParam, "css");
    });

    /* ------------------------------------------------------------- container ---- */

    // Applied by the shared canvas wrapper, not the widget: RenderWidget.jsx:320 sets
    // `padding: none ? '0px' : BOX_PADDING`. FileInput's own `_height` (:79) and
    // `inputElementHeight` (:85) memos are dead code — the feature still works.
    it("should verify Padding: None changes the field height", () => {
      openStyleAccordion(widget, fileInputAccordion.styleContainer);
      cy.get(commonWidgetSelector.togglrButton("default"))
        .closest('[role="radio"]')
        .should("have.attr", "aria-checked", "true");

      getWidgetHeight(widget).then((before) => {
        cy.get(commonWidgetSelector.togglrButton("none")).click();
        cy.waitForAutoSave();
        // Precondition, not the coverage: the height assertion below is the effect.
        cy.get(commonWidgetSelector.togglrButton("none")).closest('[role="radio"]').should("have.attr", "aria-checked", "true");
        getWidgetHeight(widget).should("not.equal", before);
      });
    });

    // NOT COVERED, deliberately: the Styles tab's "Advanced" group holds `cssClass`, which
    // is not in config.styles (the Inspector injects it universally, Inspector.jsx:828-834)
    // and is enterprise-gated (PlanTerms BASIC_PLAN_TERMS.customStyling: false) — a test
    // would pass on a licensed instance and fail on a basic/CE CI runner.
  }
);
