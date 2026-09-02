import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/fileButton";
import {
  openEditorSidebar,
  openAccordion,
  verifyAndModifyParameter,
  selectColourFromColourPicker,
  verifyWidgetColorCss,
  fillBoxShadowParams,
  verifyBoxShadowCss,
} from "Support/utils/commonWidget";

// A toggle property needs fx turned on first before it becomes a code field.
const enableFxAndBind = (paramName, expression) => {
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  verifyAndModifyParameter(paramName, expression);
};

const commitChange = () => {
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

// Selecting a companion widget re-scrolls the canvas, so every filebutton1
// check below scrolls it back into view first rather than assuming it's visible.

// Canvas keeps settling after a drop — poll position until it stops before acting.
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

// labelWeight is a `type: 'select'` react-select, whose menu portals out of the
// wrapper — so the option is matched from the menu, not by descending the field.
const selectLabelWeight = (option) => {
  cy.get('[data-cy="dropdown-label-weight"]').find(".react-select__control").click();
  cy.get(".react-select__menu").contains(option).click();
  cy.waitForAutoSave();
};

// The collapsed state persists in localStorage across tests, so check before
// clicking — an unguarded toggle re-OPENS the panel on the second test.
const closeQueryPanel = () => {
  cy.get(".query-pane").then(($panel) => {
    if (!$panel.hasClass("collapsed")) {
      cy.get('[data-cy="query-manager-toggle-button"]').click();
    }
  });
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

// Read the CONFIGURED background from `--button-primary` (FileButton.jsx:157),
// never the rendered background-color: the widget derives a hover shade from it
// (:143), so a cursor over the trigger passes headless and fails in open mode.
const expectBgVar = (selector, expected) => {
  cy.get(selector).should(($btn) => {
    expect($btn[0].style.getPropertyValue("--button-primary").trim()).to.equal(expected);
  });
};

describe(
  "File Button styles",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = "filebutton1";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    closeQueryPanel();
    cy.dragAndDropWidget("File button", 500, 100);
    waitForDropSettle(widget);
  });

  it("should verify Label size: direct change and exposed-variable binding", () => {
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

    // 2. Bind to another component's exposed value — a Number Input's own
    // numeric output, not a boolean ternary, since Label size is itself numeric.
    cy.dragAndDropWidget("Number Input", 500, 300);
    waitForDropSettle("numberinput1");
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "32");
    commitChange();

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    enableFxAndBind("Label size", "{{components.numberinput1.value}}");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "font-size", "32px");

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "50");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "font-size", "50px");
  });

  it("should verify Label weight: all three options by dropdown and by binding", () => {
    // labelWeight maps to a Tailwind CLASS (fontWeightClass, FileButton.jsx:16),
    // not an inline style. Normal 400, Medium 500 (default), Bold 700.
    const weight = (expected) =>
      cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "font-weight", expected);

    // The binding is driven from the source component, which also proves it
    // stays live instead of resolving once.
    const bindWeight = (value, expected) => {
      openEditorSidebar("textinput1");
      verifyAndModifyParameter("Default value", value);
      commitChange();
      weight(expected);
    };

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    weight("500");

    // 1. Every option from the dropdown, ordered so each pick is a real change
    // rather than re-selecting the value already in effect.
    selectLabelWeight("Bold");
    weight("700");
    selectLabelWeight("Normal");
    weight("400");
    selectLabelWeight("Medium");
    weight("500");

    // 2. The same three through a binding, from a Text Input's string output.
    // These are the config's raw option values, not the display names.
    cy.dragAndDropWidget("Text Input", 500, 300);
    waitForDropSettle("textinput1");
    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", "normal");
    commitChange();

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    enableFxAndBind("Label weight", "{{components.textinput1.value}}");
    commitChange();
    weight("400");

    bindWeight("bold", "700");
    bindWeight("medium", "500");
  });

  it("should verify Label color: theme swatch, RGBA picker, and exposed-variable binding", () => {
    // labelColor sets inline `color` on the label span. A picked colour always
    // beats the buttonType fallback, so no baseline assert is needed.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");

    // 1. Theme swatch — writes a var(--cc-*) token, a different path from the
    // RGBA picker. Text/Primary is avoided: computedLabelColor (FileButton.jsx:68)
    // already falls back to it, so picking it would assert an already-true state.
    let defaultColor;
    cy.get(fileButtonSelector.label(widget)).then(($el) => {
      defaultColor = getComputedStyle($el[0]).color;
    });

    selectThemeColour("Label color", "SystemStatus/Error");
    cy.get(fileButtonSelector.label(widget))
      .should("have.attr", "style")
      .and("include", "var(--cc-error-systemStatus)");
    // Each theme resolves its tokens to different hexes, so assert the label
    // actually re-rendered instead of pinning one literal rgb.
    cy.get(fileButtonSelector.label(widget)).then(($el) => {
      expect(getComputedStyle($el[0]).color).to.not.equal(defaultColor);
    });

    // 2. RGBA picker — a literal colour, which must win over the theme token.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    const directColor = fake.randomRgba;
    selectColourFromColourPicker("Label color", directColor);
    verifyWidgetColorCss(fileButtonSelector.label(widget), "color", directColor, true);

    // 3. Bind to another component's exposed value — a Color Picker's own
    // colour output, since Label color is itself a colour.
    // Re-select filebutton1: the picker's dismiss-click deselected it and
    // flipped the sidebar to Components, so the drag would miss.
    openEditorSidebar(widget);
    cy.dragAndDropWidget("Color Picker", 500, 300);
    waitForDropSettle("colorpicker1");
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#ff0000");
    commitChange();

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    enableFxAndBind("Label color", "{{components.colorpicker1.selectedColorHex}}");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "color", "rgb(255, 0, 0)");

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#00ff00");
    commitChange();
    cy.get(fileButtonSelector.label(widget)).scrollIntoView().should("have.css", "color", "rgb(0, 255, 0)");
  });

  it("should verify Icon: direct change and exposed-variable binding", () => {
    // Config says visibility:false, but the live panel renders a real icon
    // picker — that flag is not honoured here.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    cy.get(fileButtonSelector.icon(widget)).should("have.class", "tabler-icon-file-search");

    // tabler-icons-react derives the rendered class from the icon's kebab name,
    // so the class IS the observable effect.
    cy.get('[data-cy="icon-on-side-panel"]').click({ force: true });
    // 300ms debounce on the popover's search box (SearchBox.jsx) before it filters the icon grid.
    cy.get('.icon-widget-popover input[placeholder="Search"]').type("IconCheck", { delay: 0 });
    cy.wait(400);
    cy.get(".icon-list").first().click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.icon(widget)).should("have.class", "tabler-icon-check");

    // 2. Bind to another component's exposed value — a Text Input's own string
    // output, since an icon name is itself a string.
    cy.dragAndDropWidget("Text Input", 500, 300);
    waitForDropSettle("textinput1");
    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", "IconCheck");
    commitChange();

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    enableFxAndBind("Icon", "{{components.textinput1.value}}");
    commitChange();
    cy.get(fileButtonSelector.icon(widget)).scrollIntoView().should("have.class", "tabler-icon-check");

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("textinput1");
    verifyAndModifyParameter("Default value", "IconStar");
    commitChange();
    cy.get(fileButtonSelector.icon(widget)).scrollIntoView().should("have.class", "tabler-icon-star");
  });

  it("should verify Icon color: theme swatch, RGBA picker, and exposed-variable binding", () => {
    // showLabel:false means no label div renders, so the data-cy falls back to
    // the raw key. Pass "iconColor" to the helpers below, not "Icon color".
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");

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

    // 3. Bind to a Color Picker's exposed colour.
    // Re-select filebutton1: the picker's dismiss-click deselected it.
    openEditorSidebar(widget);
    cy.dragAndDropWidget("Color Picker", 500, 300);
    waitForDropSettle("colorpicker1");
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#ff0000");
    commitChange();

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    // No label renders, so enableFxAndBind's label assertion can't be reused —
    // drive the fx button and CodeMirror directly.
    cy.get(commonWidgetSelector.parameterFxButton("iconColor")).click();
    cy.get(commonWidgetSelector.parameterInputField("iconColor")).clearAndTypeOnCodeMirror(" ");
    cy.get(commonWidgetSelector.parameterInputField("iconColor")).clearAndTypeOnCodeMirror(
      "{{components.colorpicker1.selectedColorHex}}"
    );
    commitChange();
    cy.get(fileButtonSelector.icon(widget)).scrollIntoView().should("have.css", "stroke", "rgb(255, 0, 0)");

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#00ff00");
    commitChange();
    cy.get(fileButtonSelector.icon(widget)).scrollIntoView().should("have.css", "stroke", "rgb(0, 255, 0)");
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

    // Default is "left": icon renders before the label (flex-direction row, not reversed).
    cy.get(fileButtonSelector.button(widget)).should("have.css", "flex-direction", "row");

    // 1. Direct change — flip to "right": icon now renders after the label (row-reverse).
    iconDirectionToggle("right").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "flex-direction", "row-reverse");

    // Flip back to "left" to prove the switch isn't one-directional.
    iconDirectionToggle("left").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "flex-direction", "row");

    // isFxNotRequired: true — no fx button exists for this field, so no bind-to-exposed-variable step.
  });

  it("should verify Loader color: theme swatch, RGBA picker, and exposed-variable binding", () => {
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

    // 3. Bind to a Color Picker's exposed colour.
    // Re-select filebutton1: the picker's dismiss-click deselected it.
    openEditorSidebar(widget);
    cy.dragAndDropWidget("Color Picker", 500, 300);
    waitForDropSettle("colorpicker1");
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#ff0000");
    commitChange();

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("label and icon");
    enableFxAndBind("Loader color", "{{components.colorpicker1.selectedColorHex}}");
    commitChange();
    cy.get(`${fileButtonSelector.loader(widget)} svg`).scrollIntoView().should("have.css", "color", "rgb(255, 0, 0)");

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#00ff00");
    commitChange();
    cy.get(`${fileButtonSelector.loader(widget)} svg`).scrollIntoView().should("have.css", "color", "rgb(0, 255, 0)");
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

    // Default is "center": the button centers its content (tw-justify-center -> justify-content: center).
    cy.get(fileButtonSelector.button(widget)).should("have.css", "justify-content", "center");

    // 1. Direct change — flip to "left": justify-content becomes flex-start.
    contentAlignmentToggle("left").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "justify-content", "flex-start");

    // Flip to "right": justify-content becomes flex-end.
    contentAlignmentToggle("right").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "justify-content", "flex-end");

    // Flip back to "center" to prove reversibility.
    contentAlignmentToggle("center").click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "justify-content", "center");

    // isFxNotRequired: true — no fx button exists for this field, so no bind-to-exposed-variable step.
  });

  it("should verify Button type: direct toggle only (isFxNotRequired skips the bind step), and gates Background/Box shadow", () => {
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

    // 1. Flip to Outline: background goes transparent, and both fields hide.
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

    // Flip back to "Solid": Background/Box shadow reappear and the trigger's background returns to the picked colour.
    cy.get('[data-cy="togglr-button-solid"]').click();
    cy.waitForAutoSave();
    cy.get(commonWidgetSelector.parameterLabel("Background")).should("have.text", "Background");
    cy.get(commonWidgetSelector.parameterLabel("Box shadow")).should("have.text", "Box shadow");
    // .should, not .then: .then asserts once, so a repaint that lags the toggle
    // fails outright instead of being retried.
    cy.get(fileButtonSelector.button(widget)).should(($btn) => {
      expect($btn[0].style.getPropertyValue("--button-primary").trim()).to.equal(pickedVar);
    });

    // isFxNotRequired: true — no fx button exists for this field, so no bind-to-exposed-variable step.
  });

  it("should verify Background: theme swatch, RGBA picker, and exposed-variable binding", () => {
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

    // 3. Bind to a Color Picker's exposed colour.
    // Re-select filebutton1: the picker's dismiss-click deselected it.
    openEditorSidebar(widget);
    cy.dragAndDropWidget("Color Picker", 500, 300);
    waitForDropSettle("colorpicker1");
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#ff0000");
    commitChange();

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");
    enableFxAndBind("Background", "{{components.colorpicker1.selectedColorHex}}");
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView();
    expectBgVar(fileButtonSelector.button(widget), "#ff0000");

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#00ff00");
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView();
    expectBgVar(fileButtonSelector.button(widget), "#00ff00");
  });

  it("should verify Border radius: direct change and exposed-variable binding", () => {
    // borderRadius sets inline `${value}px` on the trigger, in the "button" accordion.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");
    cy.get(fileButtonSelector.button(widget)).should("have.css", "border-radius", "6px");

    // numberInput is a plain <input type="number"> until fx is enabled.
    cy.get('[data-cy="border-radius-input"]').clear().type("20");
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "border-radius", "20px");

    // 2. Bind to another component's exposed value — a Number Input's own
    // numeric output, not a boolean ternary, since Border radius is itself numeric.
    cy.dragAndDropWidget("Number Input", 500, 300);
    waitForDropSettle("numberinput1");
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "45");
    commitChange();

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");
    enableFxAndBind("Border radius", "{{components.numberinput1.value}}");
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("have.css", "border-radius", "45px");

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("numberinput1");
    verifyAndModifyParameter("Default value", "60");
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should("have.css", "border-radius", "60px");
  });

  it("should verify Box shadow: direct change and exposed-variable binding", () => {
    // boxShadow writes the raw CSS shorthand onto the trigger's inline style, and
    // is conditionallyRender'd on the default buttonType==='solid'.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");

    // 1. Fill x/y/blur/spread in the popover, then pick a colour.
    const directParam = fake.boxShadowParam;
    const directColor = fake.randomRgba;
    cy.get(commonWidgetSelector.stylePicker("Box shadow")).click();
    fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, directParam);
    selectColourFromColourPicker("Box shadow Color", directColor);
    // verifyBoxShadowCss defaults to the outer draggable-widget wrapper, but
    // FileButton puts boxShadow on its inner <button> — pass that selector.
    verifyBoxShadowCss(fileButtonSelector.button(widget), directColor, directParam, "css");

    // 2. Bind only the colour sub-part, leaving x/y/blur/spread as literals.
    // Re-select filebutton1: the picker's dismiss-click deselected it.
    openEditorSidebar(widget);
    cy.dragAndDropWidget("Color Picker", 500, 300);
    waitForDropSettle("colorpicker1");
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#ff0000");
    commitChange();

    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");
    enableFxAndBind(
      "Box shadow",
      `${directParam[0]}px ${directParam[1]}px ${directParam[2]}px ${directParam[3]}px {{components.colorpicker1.selectedColorHex}}`
    );
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should(
      "have.css",
      "box-shadow",
      `rgb(255, 0, 0) ${directParam[0]}px ${directParam[1]}px ${directParam[2]}px ${directParam[3]}px`
    );

    // Prove the binding is live: change the source, not the target.
    openEditorSidebar("colorpicker1");
    verifyAndModifyParameter("Default value", "#00ff00");
    commitChange();
    cy.get(fileButtonSelector.button(widget)).scrollIntoView().should(
      "have.css",
      "box-shadow",
      `rgb(0, 255, 0) ${directParam[0]}px ${directParam[1]}px ${directParam[2]}px ${directParam[3]}px`
    );
  });

  it("should verify Padding: direct toggle only (isFxNotRequired skips the bind step)", () => {
    // padding is a `switch` with isFxNotRequired. 'none' adds tw-p-0, overriding
    // the Button component's own non-zero default.
    openEditorSidebar(widget);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion("button");

    // Default is "default": the trigger keeps the base Button component's own non-zero padding.
    cy.get(fileButtonSelector.button(widget)).should(($btn) => {
      expect($btn.css("padding")).to.not.equal("0px");
    });

    // 1. Direct change — flip to "None": padding collapses to 0.
    cy.get('[data-cy="togglr-button-none"]').click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should("have.css", "padding", "0px");

    // Flip back to "Default" to prove reversibility.
    cy.get('[data-cy="togglr-button-default"]').click();
    cy.waitForAutoSave();
    cy.get(fileButtonSelector.button(widget)).should(($btn) => {
      expect($btn.css("padding")).to.not.equal("0px");
    });

    // isFxNotRequired: true — no fx button exists for this field, so no bind-to-exposed-variable step.
  });
});
