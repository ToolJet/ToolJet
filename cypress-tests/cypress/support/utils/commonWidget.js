// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// commonWidget.js
//   openAccordion                    -                    → common
//   verifyAndModifyParameter         code                 → properties
//   openEditorSidebar                -                    → common
//   verifyAndModifyToggleFx          toggle               → properties
//   addDefaultEventHandler           -                    → events
//   addAndVerifyTooltip              -                    → properties
//   editAndVerifyWidgetName          -                    → properties
//   verifyComponentValueFromInspector -                    → inspector
//   verifyMultipleComponentValuesFromInspector -                    → inspector
//   selectColourFromColourPicker     colorSwatches        → styles
//   fillBoxShadowParams              boxShadow            → styles
//   verifyBoxShadowCss               boxShadow            → styles
//   verifyComponentFromInspector     -                    → inspector
//   verifyAndModifyStylePickerFx     -                    → styles
//   verifyWidgetColorCss             colorSwatches        → styles
//   verifyLoaderColor                -                    → styles
//   verifyLayout                     toggle               → properties
//   verifyPropertiesGeneralAccordion -                    → properties
//   verifyStylesGeneralAccordion     -                    → styles
//   addTextWidgetToVerifyValue       -                    → canvas
//   verifyTooltip                    -                    → properties
//   verifyWidgetText                 -                    → properties
//   randomNumber                     -                    → common
//   pushIntoArrayOfObject            -                    → common
//   closeAccordions                  -                    → common
//   verifyAndModifySwitch            switch               → properties
//   selectFromSidebarDropdown        -                    → properties
//   addValueOnInput                  -                    → properties
//   verifyContainerElements          -                    → properties
//   checkPaddingOfContainer          -                    → styles
// └──────────────────────────────────────────────────────────────────┘
import { faker } from "@faker-js/faker";
import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import { codeMirrorInputLabel, commonWidgetText } from "Texts/common";

/**
 * @tjBlock  common
 * @tjUsage  openAccordion('Properties', ['General'], '0')
 * @tjDom    sidebar accordion button — collapses siblings then expands target
 */
export const openAccordion = (
  accordionName,
  acordionToBeClosed,
  index = "0"
) => {
  closeAccordions(acordionToBeClosed);
  cy.get(commonWidgetSelector.accordion(accordionName, index))
    .scrollIntoView()
    .should("be.visible")
    .and("have.text", accordionName)
    .then(($accordion) => {
      if ($accordion.hasClass("collapsed")) {
        cy.get(commonWidgetSelector.accordion(accordionName, index)).click();
      }
    });
};

/**
 * @tjType   code
 * @tjBlock  properties
 * @tjUsage  verifyAndModifyParameter('Text', 'Hello World')
 * @tjDom    CodeMirror input field for a named parameter label
 */
export const verifyAndModifyParameter = (paramName, value) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName))
    .scrollIntoView()
    .should("have.text", paramName);
  // Re-query the field for each clearAndTypeOnCodeMirror instead of chaining
  // them: clearAndTypeOnCodeMirror (commands.js) yields the result of its last
  // realType (often undefined/detached), so chaining a SECOND call onto it
  // passes that as the prevSubject → `cy.wrap(undefined).realClick()` throws
  // "Cannot read properties of undefined (reading 'get')" inside
  // getCypressElementCoordinates.
  cy.get(commonWidgetSelector.parameterInputField(paramName)).clearAndTypeOnCodeMirror(
    " "
  );
  cy.get(commonWidgetSelector.parameterInputField(paramName)).clearAndTypeOnCodeMirror(
    value
  );
};

/**
 * @tjBlock  common
 * @tjUsage  openEditorSidebar('textinput1')
 * @tjDom    config-handle properties-styles button on hovered widget
 */
export const openEditorSidebar = (widgetName = "") => {
  cy.hideTooltip();

  // The canvas config handle no longer exposes a single `<name>-config-handle`
  // button. Hovering the widget reveals ConfigHandle buttons; the one that
  // opens the RIGHT Inspector (Properties/Styles/Events) is
  // `<name>-properties-styles-button` — its onClick sets the CONFIGURATION tab
  // and setRightSidebarOpen(true)
  // (frontend/src/AppBuilder/AppCanvas/ConfigHandle/ConfigHandle.jsx:277-288).
  // The config handle (and its properties-styles button) is `visibility:hidden`
  // unless the widget is hovered, and the CSS :hover state can be lost between
  // the realHover and the click (re-render, tooltip, the 1s wait). Force the
  // click so a momentarily-hidden-but-present button still opens the inspector
  // (its onClick sets CONFIGURATION + setRightSidebarOpen(true)).
  cy.get(`${commonWidgetSelector.draggableWidget(widgetName)}:eq(0)`).realHover().then(() => {
    cy.wait(1000);
    cy.get(commonWidgetSelector.widgetConfigHandle(widgetName)).click({
      force: true,
    });
  })
};

/**
 * @tjType   toggle
 * @tjBlock  properties
 * @tjUsage  verifyAndModifyToggleFx('Loading state', '{{false}}')
 * @tjDom    inspector fx-toggle + code editor
 */
export const verifyAndModifyToggleFx = (
  paramName,
  defaultValue,
  toggleModification = true,
  hiddenFx = true
) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).should(
    "have.text",
    paramName
  );
  if (hiddenFx) {
    cy.get(commonWidgetSelector.parameterTogglebutton(paramName)).realHover();
  }
  cy.get(commonWidgetSelector.parameterFxButton(paramName, " > svg")).click();
  if (defaultValue)
    cy.get(commonWidgetSelector.parameterInputField(paramName))
      // CodeMirror 6 renders lines as `.cm-line` (the old cm5 `pre.CodeMirror-line`
      // no longer exists — clearAndTypeOnCodeMirror already targets `.cm-line`).
      .find(".cm-line")
      .should("have.text", defaultValue);
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  if (toggleModification == true)
    cy.get(commonWidgetSelector.parameterTogglebutton(paramName)).click();
};

/**
 * @tjBlock  events
 * @tjUsage  addDefaultEventHandler('Button clicked!')
 * @tjDom    add-event-handler popover → event-trigger-option → alert-message CodeMirror
 */
export const addDefaultEventHandler = (message) => {
  // New popover-based add flow (EventManager.jsx): the "Add event handler"
  // button is a Popover trigger -> opens `add-event-menu` whose options are
  // `event-trigger-option-<value>`. The default first trigger ("On click") both
  // creates the handler and opens its config `popover-card`, where the default
  // action is already "Show Alert". So we only need to pick the trigger and
  // type the alert message. The old direct `event-handler-card` click is gone.
  cy.intercept(/\/events(\/|\?|$)/).as("events");
  cy.get(commonWidgetSelector.addEventHandlerLink).eq(0).click();
  cy.get('[data-cy="add-event-menu"]').should("be.visible");
  cy.contains('[data-cy^="event-trigger-option-"]', /^on click$/i).click();
  cy.wait("@events");
  cy.get('[data-cy="popover-card"]').should("be.visible");
  cy.wait(1000);
  cy.get(commonWidgetSelector.alertMessageInputField)
    .find('[data-cy*="-input-field"]')
    .eq(0)
    .clearAndTypeOnCodeMirror(message);
  cy.get('[data-cy="run-only-if-input-field"]').click({ force: true });
};

/**
 * @tjBlock  properties
 * @tjUsage  addAndVerifyTooltip(commonWidgetSelector.draggableWidget('textinput1'), 'My tooltip')
 * @tjDom    tooltip-input-field CodeMirror + .tooltip-inner assertion
 */
export const addAndVerifyTooltip = (widgetSelector, message) => {
  cy.get(commonWidgetSelector.tooltipInputField).clearAndTypeOnCodeMirror(
    message
  );
  verifyTooltip(widgetSelector, message);
};

/**
 * @tjBlock  properties
 * @tjUsage  editAndVerifyWidgetName('myButton', ['General', 'Properties', 'Devices'])
 * @tjDom    WidgetNameInputField → config-handle .component-name-btn
 */
export const editAndVerifyWidgetName = (
  name,
  accordion = ["General", "Properties", "Devices"]
) => {
  closeAccordions(accordion);
  cy.clearAndType(commonWidgetSelector.WidgetNameInputField, name);
  cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });

  // The config handle's component-name button is icon/label only and carries
  // no data-cy; the renamed component's name is shown in the `.component-name-btn`
  // span inside the `.config-handle`, a sibling of the rendered widget within
  // the same WidgetWrapper (ConfigHandle.jsx:232-266, WidgetWrapper.jsx:211-225).
  // Verify the rename by hovering the widget and reading that label from the
  // enclosing wrapper.
  cy.get(commonWidgetSelector.draggableWidget(name)).trigger("mouseover");
  cy.get(commonWidgetSelector.draggableWidget(name))
    .closest("[component-type]")
    .find(".config-handle .component-name-btn")
    .should("contain.text", name);
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyComponentValueFromInspector('textinput1', 'hello')
 * @tjDom    sidebar inspector → components node → component value text
 */
export const verifyComponentValueFromInspector = (
  componentName,
  value,
  openStatus = "closed"
) => {
  cy.wait(3000);
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(componentName)).click();
  }
  cy.get(commonWidgetSelector.nodeComponentValue).contains(value);
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyMultipleComponentValuesFromInspector('select1', ['opt1', 'opt2'])
 * @tjDom    sidebar inspector → components node → values list
 */
export const verifyMultipleComponentValuesFromInspector = (
  componentName,
  values = [],
  openStatus = "closed"
) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.wait(100);
    cy.get(commonWidgetSelector.inspectorNodeComponents).realClick();
    cy.get(commonWidgetSelector.nodeComponent(componentName)).click();
    cy.get(commonWidgetSelector.nodeComponentValues).click();
  }
  values.forEach((value, i) =>
    cy
      .get(`[data-cy="inspector-node-${i}"] > .mx-2`)
      .should("have.text", `${value}`)
  );
  cy.forceClickOnCanvas();
};

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
 * @tjBlock  inspector
 * @tjUsage  verifyComponentFromInspector('textinput1')
 * @tjDom    sidebar inspector → components node → component name label
 */
export const verifyComponentFromInspector = (
  componentName,
  openStatus = "closed"
) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(
      commonWidgetSelector.nodeComponent(componentName)
    ).verifyVisibleElement("have.text", componentName);
  }
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
 * @tjType   toggle
 * @tjBlock  properties
 * @tjUsage  verifyLayout('textinput1')
 * @tjDom    Layout accordion → Show on Desktop / Show on Mobile toggles
 */
export const verifyLayout = (
  widgetName,
  layout = commonWidgetText.accordionLayout
) => {
  openEditorSidebar(widgetName);
  openAccordion(layout);
  verifyAndModifyToggleFx(
    commonWidgetText.parameterShowOnDesktop,
    commonWidgetText.codeMirrorLabelTrue
  );
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should("not.exist");

  verifyAndModifyToggleFx(
    commonWidgetText.parameterShowOnMobile,
    commonWidgetText.codeMirrorLabelFalse
  );
  cy.get(commonWidgetSelector.changeLayoutToMobileButton).click();
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should("exist");
};

/**
 * @tjBlock  properties
 * @tjUsage  verifyPropertiesGeneralAccordion('textinput1', 'Enter your name')
 * @tjDom    Properties panel → tooltip-input-field CodeMirror + .tooltip-inner
 */
export const verifyPropertiesGeneralAccordion = (widgetName, tooltipText) => {
  openEditorSidebar(widgetName);
  // The Properties tab no longer has a "General" accordion — the Tooltip field
  // (tooltip-input-field) now sits directly in the Properties panel (verified in
  // the Button inspector). Only open a "General" accordion if one is actually
  // present; otherwise go straight to the tooltip field.
  cy.get("body").then(($b) => {
    if (
      $b.find('[data-cy="widget-accordion-general"]').length > 0
    ) {
      openAccordion(commonWidgetText.accordionGenaral);
    }
  });
  cy.wait(3000);
  addAndVerifyTooltip(
    commonWidgetSelector.draggableWidget(widgetName),
    tooltipText
  );
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
 * @tjBlock  canvas
 * @tjUsage  addTextWidgetToVerifyValue('components.textinput1.value')
 * @tjDom    canvas drag-drop Text widget → textcomponenttextinput CodeMirror
 */
export const addTextWidgetToVerifyValue = (customfunction) => {
  cy.forceClickOnCanvas();
  cy.dragAndDropWidget("Text", 600, 80);
  openEditorSidebar("text1");
  cy.get(
    '[data-cy="textcomponenttextinput-input-field"] '
  ).clearAndTypeOnCodeMirror(codeMirrorInputLabel(customfunction));
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

/**
 * @tjBlock  properties
 * @tjUsage  verifyTooltip(commonWidgetSelector.draggableWidget('textinput1'), 'My tooltip')
 * @tjDom    widget hover → .tooltip-inner text assertion
 */
export const verifyTooltip = (widgetSelector, message) => {
  cy.forceClickOnCanvas();
  cy.get(widgetSelector).click();
  cy.get(widgetSelector)
    .trigger("mouseover", { timeout: 2000 })
    .trigger("mouseover")
    .then(() => {
      cy.get(".tooltip-inner").last().should("have.text", message);
    });
};

/**
 * @tjBlock  properties
 * @tjUsage  verifyWidgetText('textinput1', 'Hello')
 * @tjDom    draggable-widget text content assertion
 */
export const verifyWidgetText = (widgetName, text) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(
    "have.text",
    text
  );
};

/**
 * @tjBlock  common
 * @tjUsage  randomNumber(1, 100)
 */
export const randomNumber = (x, y) => {
  return faker.datatype.number({ min: x, max: y });
};

/**
 * @tjBlock  common
 * @tjUsage  pushIntoArrayOfObject(['Alice','Bob'], [90, 85])
 */
export const pushIntoArrayOfObject = (arrayOne, arrayTwo) => {
  let arrayOfObj = "[";
  arrayOne.forEach((element, index) => {
    arrayOfObj += `{name: "${element}", mark: "${arrayTwo[index]}" },`;
  });
  return arrayOfObj + "]";
};

/**
 * @tjBlock  common
 * @tjUsage  closeAccordions(['General', 'Properties'], '0')
 * @tjDom    sidebar accordion buttons — collapses each named accordion
 */
export const closeAccordions = (accordionNames = [], index = "0") => {
  if (accordionNames) {
    accordionNames.forEach((accordionName) => {
      cy.get(commonWidgetSelector.accordion(accordionName, index))
        .click()
        .scrollIntoView()
        .should("be.visible")
        .and("have.text", accordionName)
        .then(($accordion) => {
          if (!$accordion.hasClass("collapsed")) {
            cy.get(
              commonWidgetSelector.accordion(accordionName, index)
            ).click();
          }
        });
    });
  }
};

// SOURCE-DERIVED selector (not live-confirmed — no browser available to author).
// The `switch` config type (e.g. checkbox.js:23 `Default state` On/Off,
// `Alignment` Left/Right, `Padding` Default/None) maps via CodeEditor/utils.js:376
// `switch: 'Switch'` → CodeBuilder/Elements/Switch.jsx, which renders each option
// as a ToolJetUI ToggleGroupItem: `<div class="toggle-item"
// data-cy="togglr-button-<value>">` with the option displayName as text content
// (ToggleGroupItem.jsx:34 — note upstream "togglr" typo). data-cy is keyed by the
// option *value* (`{{true}}`/`{{false}}` for On/Off), so we match on the rendered
// displayName text — uniform across slug (left/none) and `{{bool}}` switches.
// Runtime-confirmed when the checkbox facets run (Plan 3 Task 4).
/**
 * @tjType   switch
 * @tjBlock  properties
 * @tjUsage  verifyAndModifySwitch('Default state', 'On')
 * @tjDom    inspector switch (segmented ToggleGroup) — togglr-button option by displayName text
 */
export const verifyAndModifySwitch = (displayName, optionDisplayName) => {
  cy.get(commonWidgetSelector.parameterLabel(displayName)).should(
    "have.text",
    displayName
  );
  cy.get('[data-cy^="togglr-button-"]')
    .filter((_i, el) => el.textContent.trim() === optionDisplayName)
    .first()
    .scrollIntoView()
    .click();
};

/**
 * @tjBlock  properties
 * @tjUsage  selectFromSidebarDropdown('Alignment', 'center')
 * @tjDom    sidebar dropdown trigger → type option + enter
 */
export const selectFromSidebarDropdown = (property, option) => {
  cy.get(`[data-cy="dropdown-${property.toLowerCase().replace(/\s+/g, "-")}"]`)
    .click()
    .type(`${option}{enter}`);
};

/**
 * @tjBlock  properties
 * @tjUsage  addValueOnInput('Border radius', '8')
 * @tjDom    sidebar plain input field identified by property name
 */
export const addValueOnInput = (property, value) => {
  cy.get(`[data-cy="${property.toLowerCase().replace(/\s+/g, "-")}-input"]`)
    .clear()
    .click()
    .type(`${value}`);
};

/**
 * @tjBlock  properties
 * @tjUsage  verifyContainerElements()
 * @tjDom    widget-accordion-container + label-padding + togglr-button-default / none
 */
export const verifyContainerElements = () => {
  cy.get('[data-cy="widget-accordion-container"]').verifyVisibleElement(
    "have.text",
    "container"
  );
  cy.get('[data-cy="label-padding"]').verifyVisibleElement(
    "have.text",
    "Padding"
  );
  cy.get('[data-cy="togglr-button-default"]').verifyVisibleElement(
    "have.text",
    "Default"
  );
  cy.get('[data-cy="togglr-button-none"]').verifyVisibleElement(
    "have.text",
    "None"
  );
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
