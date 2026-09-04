import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText } from "Texts/appBuilder/components/fileButton";
import {
  openEditorSidebar,
  openAccordion,
  selectColourFromColourPicker,
  verifyWidgetColorCss,
  fillBoxShadowParams,
  verifyBoxShadowCss,
} from "Support/utils/commonWidget";
import {
  waitForDropSettle,
  commitChange,
  closeQueryPanel,
  expectBgVar,
} from "Support/utils/appBuilder/components/fileButton";

// Direct-control half: each style driven by its own number input, dropdown, theme
// swatch, RGBA picker or toggle group. The fx half lives in stylesFx.cy.js.
//
// Selecting a companion widget re-scrolls the canvas, so every filebutton1 check below
// scrolls it back into view first rather than assuming it's visible.

// labelWeight is a `type: 'select'` react-select, whose menu portals out of the
// wrapper — so the option is matched from the menu, not by descending the field.
const selectLabelWeight = (option) => {
  cy.get('[data-cy="dropdown-label-weight"]').find(".react-select__control").click();
  cy.get(".react-select__menu").contains(option).click();
  cy.waitForAutoSave();
};

// The shared selectColourFromColourPicker clicks past the Theme view to reach
// the RGBA inputs, so the Theme list needs its own step. Its rows have no
// data-cy: they are labelled "Category/Type" and write var(--cc-<type>-<category>).
const selectThemeColour = (paramName, optionLabel) => {
  cy.get(commonWidgetSelector.stylePicker(paramName)).last().click();
  cy.get('[data-cy="togglr-button-swatches"]').click();
  cy.get(".codebuilder-color-swatches-options")
    .filter((_i, el) => el.innerText.trim().startsWith(optionLabel))
    .first()
    .click();
  commitChange();
};

// Resolve a var(--cc-*) token through the app's OWN document, so the assertion
// is exact without hardcoding any theme's hex.
const expectThemeColour = (selector, cssProp, token) => {
  cy.get(selector).should(($el) => {
    const el = $el[0];
    const doc = el.ownerDocument;
    const probe = doc.createElement("div");
    probe.style.color = token;
    doc.body.appendChild(probe);
    const expected = doc.defaultView.getComputedStyle(probe).color;
    probe.remove();
    expect(doc.defaultView.getComputedStyle(el)[cssProp]).to.equal(expected);
  });
};

describe(
  "File Button styles",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    closeQueryPanel();
    cy.dragAndDropWidget(fileButtonText.defaultWidgetText, 500, 100);
    waitForDropSettle(widget);
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  it("should verify Label size: direct change", () => {
    // labelSize sets inline fontSize on the label span; lives in the collapsed
    // "label and icon" accordion of the Styles tab (Properties is the default tab).
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    cy.get(fileButtonSelector.label(widget)).should("have.css", "font-size", "14px");

    // numberInput renders a plain <input type="number"> (data-cy `<param>-input`)
    // until fx is on, so type into it directly, not via verifyAndModifyParameter.
    cy.get('[data-cy="label-size-input"]').clear().type("28");
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.label(widget)).should("have.css", "font-size", "28px");
  });

  it("should verify Label weight: all three options by dropdown", () => {
    // labelWeight maps to a Tailwind CLASS (fontWeightClass, FileButton.jsx:16),
    // not an inline style. Normal 400, Medium 500 (default), Bold 700.
    const weight = (expected) =>
      cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "font-weight", expected);

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    weight("500");

    // Ordered so each pick is a real change rather than re-selecting the value
    // already in effect.
    selectLabelWeight("Bold");
    weight("700");
    selectLabelWeight("Normal");
    weight("400");
    selectLabelWeight("Medium");
    weight("500");
  });

  it("should verify Label color: theme swatch and RGBA picker", () => {
    // labelColor sets inline `color` on the label span.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");

    // Default is the surface1 token, passed straight through by
    // computedLabelColor because buttonType is 'solid'.
    expectThemeColour(fileButtonSelector.label(widget), "color", "var(--cc-surface1-surface)");

    // 1. Theme swatch. Text/Primary is avoided: computedLabelColor
    // (FileButton.jsx:68) already falls back to it on non-solid buttons.
    selectThemeColour("Label color", "SystemStatus/Error");
    // The token itself must be stored, not a resolved literal that happens to
    // match — so check the inline style as well as the rendered colour.
    cy.get(fileButtonSelector.label(widget))
      .should("have.attr", "style")
      .and("include", "var(--cc-error-systemStatus)");
    expectThemeColour(fileButtonSelector.label(widget), "color", "var(--cc-error-systemStatus)");

    // 2. RGBA picker — a literal colour, which must win over the theme token.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    const directColor = fake.randomRgba;
    selectColourFromColourPicker("Label color", directColor);
    verifyWidgetColorCss(fileButtonSelector.label(widget), "color", directColor, true);
  });

  it("should verify Icon: direct change", () => {
    // Config says visibility:false, but the live panel renders a real icon
    // picker — that flag is not honoured here.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    cy.get(fileButtonSelector.icon(widget)).should("have.class", fileButtonText.defaultIconClass);

    // tabler-icons-react derives the rendered class from the icon's kebab name,
    // so the class IS the observable effect.
    cy.get('[data-cy="icon-on-side-panel"]').click({ force: true });
    // 300ms debounce on the popover's search box (SearchBox.jsx) before it filters the icon grid.
    cy.get('.icon-widget-popover input[placeholder="Search"]').type("IconCheck", { delay: 0 });
    cy.wait(400);
    cy.get(".icon-list").first().click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.icon(widget)).should("have.class", "tabler-icon-check");
  });

  it("should verify Icon color: theme swatch and RGBA picker", () => {
    // showLabel:false means no label div renders, so the data-cy falls back to
    // the raw key. Pass "iconColor" to the helpers below, not "Icon color".
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");

    // Default is the surface1 token, passed straight through by
    // computedIconColor because buttonType is 'solid'.
    expectThemeColour(fileButtonSelector.icon(widget), "stroke", "var(--cc-surface1-surface)");

    // 1. Theme swatch. Text/Primary is avoided: computedIconColor
    // (FileButton.jsx:75) already falls back to it on non-solid buttons.
    selectThemeColour("iconColor", "SystemStatus/Error");
    expectThemeColour(fileButtonSelector.icon(widget), "stroke", "var(--cc-error-systemStatus)");

    // 2. RGBA picker — a literal, which must win over the theme token. TablerIcon
    // forwards `color` to the SVG's `stroke`, so `stroke` is the real effect.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    const directColor = fake.randomRgba;
    selectColourFromColourPicker("iconColor", directColor);
    verifyWidgetColorCss(fileButtonSelector.icon(widget), "stroke", directColor, true);
  });

  it("should verify Icon direction: direct toggle only", () => {
    // No displayName/label renders for this field; find it by its own alignleft/alignright toggle buttons.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");

    // contentAlignment lives in the same accordion and reuses the same left/right data-cy
    // values via its own 3-way toggle — scope to the 2-option group with no "center" sibling.
    const iconDirectionToggle = (value) =>
      cy
        .get(`[data-cy="togglr-button-${value}"]`)
        .filter((_i, el) => Cypress.$(el).closest(".ToggleGroup").find('[data-cy="togglr-button-center"]').length === 0);

    // Default "left": icon before the label, so flex-direction stays row.
    cy.get(fileButtonSelector.button(widget)).should("have.css", "flex-direction", "row");

    iconDirectionToggle("right").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "flex-direction", "row-reverse");

    // Flip back to "left" to prove the switch isn't one-directional.
    iconDirectionToggle("left").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "flex-direction", "row");

    // isFxNotRequired — the absent fx button is asserted in stylesFx.cy.js.
  });

  it("should verify Loader color: theme swatch and RGBA picker", () => {
    // computedLoaderColor goes straight into <Loader color={...}>. Unlike
    // Button/PopoverMenu it writes no `--loader-color` var, so verifyLoaderColor
    // doesn't apply — assert the loader svg's computed `color`.
    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(commonWidgetSelector.parameterTogglebutton("Loading state")).click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.loader(widget)).should("be.visible");

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");

    // Default is the surface1 token, passed through because buttonType is 'solid'.
    expectThemeColour(`${fileButtonSelector.loader(widget)} svg`, "color", "var(--cc-surface1-surface)");

    // 1. Theme swatch. Text/Primary avoided for the same reason as Icon color
    // (FileButton.jsx:79 already falls back to it).
    selectThemeColour("Loader color", "SystemStatus/Error");
    expectThemeColour(`${fileButtonSelector.loader(widget)} svg`, "color", "var(--cc-error-systemStatus)");

    // 2. RGBA picker — a literal colour, which must win over the theme token.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    const directColor = fake.randomRgba;
    selectColourFromColourPicker("Loader color", directColor);
    verifyWidgetColorCss(`${fileButtonSelector.loader(widget)} svg`, "color", directColor, true);
  });

  it("should verify Content alignment: direct toggle only", () => {
    // No displayName label div renders for this field; find it by its own left/center/right toggle buttons.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");

    // contentAlignment shares the same left/right data-cy values as Icon direction's own toggle —
    // scope to the 3-option group that DOES have a "center" sibling (Icon direction has none).
    const contentAlignmentToggle = (value) =>
      cy
        .get(`[data-cy="togglr-button-${value}"]`)
        .filter((_i, el) => Cypress.$(el).closest(".ToggleGroup").find('[data-cy="togglr-button-center"]').length > 0);

    // Default "center" -> tw-justify-center -> justify-content: center.
    cy.get(fileButtonSelector.button(widget)).should("have.css", "justify-content", "center");

    contentAlignmentToggle("left").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "justify-content", "flex-start");

    contentAlignmentToggle("right").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "justify-content", "flex-end");

    contentAlignmentToggle("center").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "justify-content", "center");

    // isFxNotRequired — the absent fx button is asserted in stylesFx.cy.js.
  });

  it("should verify Button type: direct toggle only and gates Background/Box shadow", () => {
    // buttonType is a `switch` with isFxNotRequired, and gates backgroundColor
    // and boxShadow on buttonType === 'solid'.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");

    // Default is "solid": Background and Box shadow fields are visible.
    cy.get(commonWidgetSelector.parameterLabel("Background")).should("have.text", "Background");
    cy.get(commonWidgetSelector.parameterLabel("Box shadow")).should("have.text", "Box shadow");

    // Give the Outline->Solid round trip something to preserve. Checks read the
    // inline style, not the rendered colour: the picker is imprecise (quarantined
    // in buttonHappyPath.cy.js) and the render is hover-dependent (see expectBgVar).
    const directColor = fake.randomRgba;
    selectColourFromColourPicker("Background", directColor);
    let pickedVar;
    cy.get(fileButtonSelector.button(widget)).then(($btn) => {
      pickedVar = $btn[0].style.getPropertyValue("--button-primary").trim();
      expect(pickedVar, "picker wrote --button-primary").to.not.equal("");
    });

    // Re-select filebutton1: the picker's dismiss-click deselected it.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");
    cy.get('[data-cy="togglr-button-outline"]').click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should(($btn) => {
      expect($btn[0].style.background).to.equal("transparent");
    });
    cy.get(commonWidgetSelector.parameterLabel("Background")).should("not.exist");
    cy.get(commonWidgetSelector.parameterLabel("Box shadow")).should("not.exist");

    cy.get('[data-cy="togglr-button-solid"]').click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("Background")).should("have.text", "Background");
    cy.get(commonWidgetSelector.parameterLabel("Box shadow")).should("have.text", "Box shadow");
    // .should, not .then: .then asserts once, so a repaint that lags the toggle
    // fails outright instead of being retried.
    cy.get(fileButtonSelector.button(widget)).should(($btn) => {
      expect($btn[0].style.getPropertyValue("--button-primary").trim()).to.equal(pickedVar);
    });

    // isFxNotRequired — the absent fx button is asserted in stylesFx.cy.js.
  });

  it("should verify Background: theme swatch and RGBA picker", () => {
    // backgroundColor is conditionallyRender'd on buttonType==='solid', which is
    // the default, so buttonType is left untouched here.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");

    // The config default is the brand token, so this is assertable exactly.
    expectBgVar(fileButtonSelector.button(widget), "var(--cc-primary-brand)");

    // 1. Theme swatch. Brand/Primary is avoided — that IS the default here.
    selectThemeColour("Background", "SystemStatus/Error");
    expectBgVar(fileButtonSelector.button(widget), "var(--cc-error-systemStatus)");

    // 2. RGBA picker. It doesn't always land on the exact typed RGBA, so assert
    // it replaced the token with a literal rather than pinning the value.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");
    const directColor = fake.randomRgba;
    selectColourFromColourPicker("Background", directColor);
    cy.get(fileButtonSelector.button(widget)).should(($btn) => {
      // The picker writes an 8-digit hex (e.g. #ccb493b0), not an rgba() string.
      const v = $btn[0].style.getPropertyValue("--button-primary").trim();
      expect(v, "theme token replaced by a literal").to.match(/^(#|rgba?\()/);
    });
  });

  it("should verify Border radius: direct change", () => {
    // borderRadius sets inline `${value}px` on the trigger, in the "button" accordion.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");
    cy.get(fileButtonSelector.button(widget)).should("have.css", "border-radius", "6px");

    // numberInput is a plain <input type="number"> until fx is enabled.
    cy.get('[data-cy="border-radius-input"]').clear().type("20");
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "border-radius", "20px");
  });

  it("should verify Box shadow: direct change", () => {
    // boxShadow writes the raw CSS shorthand onto the trigger's inline style, and
    // is conditionallyRender'd on the default buttonType==='solid'.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");

    // Default is '0px 0px 0px 0px #00000040'. The alpha byte 0x40 serialises as
    // 0.25 or 0.251 depending on the browser, so match the shape rather than
    // pinning one rounding.
    cy.get(fileButtonSelector.button(widget))
      .should("have.css", "box-shadow")
      .and("match", /^rgba\(0, 0, 0, 0\.25\d*\) 0px 0px 0px 0px$/);

    // Fill x/y/blur/spread in the popover, then pick a colour.
    const directParam = fake.boxShadowParam;
    const directColor = fake.randomRgba;
    cy.get(commonWidgetSelector.stylePicker("Box shadow")).click();
    fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, directParam);
    selectColourFromColourPicker("Box shadow Color", directColor);
    // verifyBoxShadowCss defaults to the outer draggable-widget wrapper, but
    // FileButton puts boxShadow on its inner <button> — pass that selector.
    verifyBoxShadowCss(fileButtonSelector.button(widget), directColor, directParam, "css");
  });

  it("should verify Padding: direct toggle only", () => {
    // padding is a `switch` with isFxNotRequired. 'none' adds tw-p-0, overriding
    // the Button component's own non-zero default.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");

    // Default keeps the base Button component's own non-zero padding.
    cy.get(fileButtonSelector.button(widget)).should(($btn) => {
      expect($btn.css("padding")).to.not.equal("0px");
    });

    cy.get('[data-cy="togglr-button-none"]').click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "padding", "0px");

    cy.get('[data-cy="togglr-button-default"]').click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should(($btn) => {
      expect($btn.css("padding")).to.not.equal("0px");
    });

    // isFxNotRequired — the absent fx button is asserted in stylesFx.cy.js.
  });
});
