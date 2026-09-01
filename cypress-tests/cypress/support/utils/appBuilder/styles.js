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
import { openEditorSidebar } from "./properties";

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
 * @tjDom    style picker label + fx button + CodeMirror input
 */
export const verifyAndModifyStylePickerFx = (
  paramName,
  defaultValue,
  value,
  index = 0,
  boxShadow = "",
  hasIndex = false
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
      .and("have.text", `${boxShadow}${defaultValue}`);
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
