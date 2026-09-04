// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// styles.js
//   selectColourFromColourPicker     colorSwatches        → styles
//   fillBoxShadowParams              boxShadow            → styles
//   verifyBoxShadowCss               boxShadow            → styles
//   verifyAndModifyStylePickerFx     -                    → styles
//   verifyWidgetColorCss             colorSwatches        → styles
//   verifyLoaderColor                -                    → styles
//   verifyStylesGeneralAccordion     -                    → styles
//   checkPaddingOfContainer          -                    → styles
//   openStyleAccordion               -                    → styles
//   selectThemeColour                -                    → styles
//   expectThemeColour                -                    → styles
//   expectStyleVar                   -                    → styles
//   expectFontWeight                 -                    → styles
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/styles: right-Inspector **Styles tab** helpers.
 * FOR AI: set/verify a component's STYLE values. Route by the style config `type`:
 *   colorSwatches → selectColourFromColourPicker (set) + verifyWidgetColorCss (verify)
 *   boxShadow     → fillBoxShadowParams + verifyBoxShadowCss
 *   style fx      → verifyAndModifyStylePickerFx
 * PRECONDITION: open the Styles tab (buttonStylesEditorSideBar) after openEditorSidebar(W).
 * NOTE: color pickers display design-token names (e.g. 'Brand/Primary'), not raw CSS vars —
 *   see surface-cache `colorTokenNames`.
 * NOT here: properties → properties.js · events & CSA → events.js.
 */
import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { openEditorSidebar, openAccordion } from "./properties";

/**
 * @tjType   colorSwatches
 * @tjBlock  styles
 * @tjUsage  selectColourFromColourPicker('Background', ['255','0','0','100'])
 * @tjDom    style accordion color swatch → rgba picker inputs
 */
export const selectColourFromColourPicker = (
  paramName,
  colour,
  index = 0,
  parent = commonWidgetSelector.colourPickerParent,
  hasIndex = false
) => {
  if (hasIndex === false) {
    cy.get(commonWidgetSelector.stylePicker(paramName)).last().click();
  } else {
    cy.get(commonWidgetSelector.stylePicker(paramName)).eq(hasIndex).click();
  }
  // The style colour popover now opens on a Theme/Color-picker ToggleGroup
  // (ee/modules/Appbuilder/components/ColorSwatches/ColorSwatches.jsx:99-118).
  // It can default to the "Theme" swatches view, which renders no
  // react-color SketchPicker (no rc-editable-input fields). Click the
  // "Color picker" toggle (`togglr-button-color`, ToggleGroupItem.jsx:13) so
  // the editable hex/rgba inputs are present before we type into them.
  cy.get("body").then(($b) => {
    if ($b.find('[data-cy="togglr-button-color"]:visible').length > 0) {
      cy.get('[data-cy="togglr-button-color"]').click();
    }
  });
  cy.get(parent)
    .eq(index)
    .then(() => {
      colour.forEach((value, i) =>
        cy
          .get(commonWidgetSelector.colourPickerInput(i + 1))
          .click()
          .clear()
          .type(value)
          .then(($input) => {
            if (!$input.val(value)) {
              cy.get(commonWidgetSelector.colourPickerInput(i + 1))
                .click()
                .clear()
                .type(value);
            }
          })
      );
    });
  cy.waitForAutoSave();
  // The colour popover (react-bootstrap OverlayTrigger, rootCloseEvent
  // "mousedown") now contains a large SketchPicker that overlaps the NEXT
  // colour swatch in the styles list, so leaving it open makes the following
  // selectColourFromColourPicker's swatch click fail ("covered by another
  // element"). Dismiss it by clicking the canvas (a real mousedown OUTSIDE the
  // popover, which the OverlayTrigger's rootClose listens for) before returning.
  cy.get(commonSelectors.canvas).click("topRight", { force: true });
};

/**
 * @tjType   boxShadow
 * @tjBlock  styles
 * @tjUsage  fillBoxShadowParams(['X', 'Y', 'Blur', 'Spread'], [2, 4, 6, 0])
 * @tjDom    box-shadow param inputs in style accordion
 */
export const fillBoxShadowParams = (paramLabels, values) => {
  paramLabels.forEach((label, i) =>
    cy
      .get(commonWidgetSelector.boxShadowParamInput(label))
      .click()
      .clear()
      .type(values[i])
      .then(($input) => {
        if (!$input.val(values[i])) {
          cy.get(commonWidgetSelector.boxShadowParamInput(label))
            .click()
            .clear()
            .type(values[i]);
        }
      })
  );
};

/**
 * @tjType   boxShadow
 * @tjBlock  styles
 * @tjUsage  verifyBoxShadowCss('textinput1', [0,0,0,1], [2,4,6,0])
 * @tjDom    draggable-widget CSS box-shadow computed value
 */
export const verifyBoxShadowCss = (
  widgetName,
  color,
  shadowParam,
  type = "component"
) => {
  cy.forceClickOnCanvas();
  cy.get(
    type == "component"
      ? commonWidgetSelector.draggableWidget(widgetName)
      : widgetName
  ).should(
    "have.css",
    "box-shadow",
    `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 100}) ${shadowParam[0]
    }px ${shadowParam[1]}px ${shadowParam[2]}px ${shadowParam[3]}px`
  );
};

/**
 * @tjBlock  styles
 * @tjUsage  verifyAndModifyStylePickerFx('Border radius', '0', '4px')
 *           verifyAndModifyStylePickerFx('Text color', 'Text/Primary', '#111', 0, '', false, '#1B1F24')
 * @tjDom    style picker label + fx button + CodeMirror input
 * NOTE: color swatches display a design-TOKEN name in the value row (e.g.
 *   'Text/Primary') but the fx CODE editor shows the RESOLVED hex (e.g.
 *   '#1B1F24'). Pass `fxDefaultValue` when they differ; it defaults to
 *   `defaultValue` for non-color pickers where the two match.
 */
export const verifyAndModifyStylePickerFx = (
  paramName,
  defaultValue,
  value,
  index = 0,
  boxShadow = "",
  hasIndex = false,
  fxDefaultValue = defaultValue
) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).should(
    "have.text",
    paramName
  );
  cy.get(commonWidgetSelector.stylePicker(paramName)).should("be.visible");
  cy.get('body').then(($b) => {
    if ($b.find(commonWidgetSelector.stylePickerValueIcon(paramName)).length) {
      cy.get(commonWidgetSelector.stylePickerValueIcon(paramName)).should("be.visible");
    }
  });

  cy.get(commonWidgetSelector.stylePickerValue(paramName))
    .should("be.visible")
    .verifyVisibleElement("have.text", defaultValue);

  if (hasIndex === false) {
    cy.get(commonWidgetSelector.stylePicker(paramName)).last().realHover();
  } else {
    cy.get(commonWidgetSelector.stylePicker(paramName))
      .eq(hasIndex)
      .realHover();
  }

  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  cy.get(commonWidgetSelector.stylePickerFxInput(paramName)).within(() => {
    cy.get(".cm-line")
      .should("be.visible")
      .and("have.text", `${boxShadow}${fxDefaultValue}`);
  });

  cy.get(
    commonWidgetSelector.stylePickerFxInput(paramName)
  ).clearAndTypeOnCodeMirror(value);

  cy.get(commonWidgetSelector.stylePickerFxInput(paramName))
    .eq(index)
    .within(() => {
      cy.get(".cm-line").should("be.visible").and("have.text", value);
    });
};

/**
 * @tjType   colorSwatches
 * @tjBlock  styles
 * @tjUsage  verifyWidgetColorCss('textinput1', 'background-color', ['255','0','0','100'])
 * @tjDom    draggable-widget inline style or computed CSS colour property
 */
export const verifyWidgetColorCss = (
  widgetName,
  cssProperty,
  color,
  innerProp = false
) => {
  cy.forceClickOnCanvas();
  const alpha = color[3] / 100;
  const rgb = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  const rgba = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
  cy.get(
    innerProp ? widgetName : commonWidgetSelector.draggableWidget(widgetName)
  ).should(($el) => {
    // Assert the color ToolJet WROTE (inline style) rather than the computed
    // value. Some widgets (e.g. Button) deliberately render a picked color at a
    // transformed shade (255 → 214), so `have.css` (computed) != the picked
    // color. Inline style is the faithful "did this style setting take effect"
    // check. Fall back to the computed value for widgets that don't write the
    // colour inline (so existing direct-apply assertions keep working).
    const inline = $el[0].style.getPropertyValue(cssProperty);
    const actual = inline || getComputedStyle($el[0]).getPropertyValue(cssProperty);
    expect([rgb, rgba]).to.include(actual);
  });
};

/**
 * @tjBlock  styles
 * @tjUsage  verifyLoaderColor('button1', ['255','0','0','100'])
 * @tjDom    draggable-widget inline --loader-color CSS variable assertion
 */
export const verifyLoaderColor = (widgetName, color) => {
  //using only for button
  cy.forceClickOnCanvas();
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .invoke("attr", "style")
    .then((style) => {
      const loaderColor = style.split(" ").join("");
      expect(loaderColor).to.include(
        `--loader-color:rgba(${color[0]},${color[1]},${color[2]},${color[3] / 100
        })`
      );
    });
};

/**
 * @tjBlock  styles
 * @tjUsage  verifyStylesGeneralAccordion('textinput1', [2,4,6,0], '#ff0000', [255,0,0,100])
 * @tjDom    Styles panel → box-shadow fx picker + colour picker + CSS assertion
 */
export const verifyStylesGeneralAccordion = (
  widgetName,
  boxShadowParameter,
  hexColor,
  boxShadowColor,
  index = 0,
  boxShadowDefaultValue = commonWidgetText.boxShadowDefaultValue
) => {
  openEditorSidebar(widgetName);
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
  // openAccordion(commonWidgetText.accordionGenaral, []);
  verifyAndModifyStylePickerFx(
    commonWidgetText.parameterBoxShadow,
    boxShadowDefaultValue,
    `${boxShadowParameter[0]}px ${boxShadowParameter[1]}px ${boxShadowParameter[2]}px ${boxShadowParameter[3]}px ${hexColor}`,
    0,
    "0px 0px 0px 0px "
  );
  cy.get(
    commonWidgetSelector.parameterFxButton(commonWidgetText.parameterBoxShadow)
  )
    .realHover()
    .click();

  cy.get(
    commonWidgetSelector.stylePicker(commonWidgetText.parameterBoxShadow)
  ).click();

  fillBoxShadowParams(
    commonWidgetSelector.boxShadowDefaultParam,
    boxShadowParameter
  );
  selectColourFromColourPicker(
    commonWidgetText.boxShadowColor,
    boxShadowColor,
    index
  );

  verifyBoxShadowCss(widgetName, boxShadowColor, boxShadowParameter);
};

/**
 * @tjBlock  styles
 * @tjUsage  checkPaddingOfContainer('container1', '16', 'Box')
 * @tjDom    draggable-widget parent role=Box CSS padding assertion
 */
export const checkPaddingOfContainer = (widgetName, value, mode = "Box") => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .parents(`[role=${mode}]`)
    .should("have.css", "padding", `${value}px`);
};

/**
 * @tjBlock  styles
 * @tjUsage  openStyleAccordion('checkbox1', 'label and icon')
 * @tjDom    widget → Styles tab → the named accordion
 */
// Every style field sits behind the Styles tab AND its own accordion, and selecting any
// companion widget flips the sidebar away — so each phase of a test has to re-open both.
export const openStyleAccordion = (widgetName, accordion) => {
  openEditorSidebar(widgetName);
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
  openAccordion(accordion);
};

/**
 * @tjType   colorSwatches
 * @tjBlock  styles
 * @tjUsage  selectThemeColour('Label color', 'SystemStatus/Error')
 * @tjDom    stylePicker → togglr-button-swatches → .codebuilder-color-swatches-options
 */
// The THEME path, which selectColourFromColourPicker deliberately skips: it clicks past
// the swatches to reach the RGBA inputs, so the theme branch — a separate code path that
// writes a `var(--cc-*)` token instead of a literal — goes untested everywhere it is
// used. Theme rows carry no data-cy: they are labelled "Category/Type" and write
// var(--cc-<type>-<category>), note the inverted order.
//
// Pick a swatch that is neither the field's default nor its computed fallback, or the
// assertion is already true before you start.
export const selectThemeColour = (paramName, optionLabel) => {
  cy.get(commonWidgetSelector.stylePicker(paramName)).last().click();
  cy.get('[data-cy="togglr-button-swatches"]').click();
  cy.get(".codebuilder-color-swatches-options")
    .filter((_i, el) => el.innerText.trim().startsWith(optionLabel))
    .first()
    .click();
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  styles
 * @tjUsage  expectThemeColour(sel, 'color', 'var(--cc-error-systemStatus)')
 * @tjDom    resolves the token through the APP's document, then compares computed style
 */
// Asserts a theme token exactly without hardcoding any theme's hex: append a probe div to
// the app's OWN document, set the property to the token, read the computed value back.
// Must use doc.defaultView.getComputedStyle, not the runner's global.
export const expectThemeColour = (selector, cssProp, token) => {
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

/**
 * @tjBlock  styles
 * @tjUsage  expectStyleVar(sel, '--button-primary', '#ff0000')
 * @tjDom    an inline CSS custom property on the given element
 */
// Reads the CONFIGURED value from a custom property, never the rendered colour: widgets
// derive hover/pressed/disabled shades from the configured one, so a cursor resting over
// the element makes a rendered-colour assertion read the hover shade — passing headless
// and failing in `cypress open`, which is the worst failure mode.
//
// Takes the property NAME so it works for any widget's var, not one family's.
export const expectStyleVar = (selector, prop, expected) => {
  cy.get(selector).should(($el) => {
    expect($el[0].style.getPropertyValue(prop).trim()).to.equal(expected);
  });
};

/**
 * @tjBlock  styles
 * @tjUsage  expectFontWeight(sel, '700')
 * @tjDom    computed font-weight on the given element
 */
// A label-weight property maps to a Tailwind CLASS, not an inline style — Normal 400,
// Medium 500, Bold 700 — so the COMPUTED weight is the only observable. scrollIntoView
// first: selecting any companion widget re-centres the canvas away from the target.
export const expectFontWeight = (selector, expected) =>
  cy.get(selector).scrollIntoView().should("have.css", "font-weight", expected);
