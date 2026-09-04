// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// properties.js
//   closeAccordions                  -                    → common
//   openAccordion                    -                    → common
//   openEditorSidebar                -                    → common
//   verifyAndModifyParameter         code                 → properties
//   verifyAndModifyToggleFx          toggle               → properties
//   verifyAndModifySwitch            switch               → properties
//   verifyTooltip                    -                    → properties
//   addAndVerifyTooltip              -                    → properties
//   editAndVerifyWidgetName          -                    → properties
//   verifyPropertiesGeneralAccordion -                    → properties
//   selectFromSidebarDropdown        -                    → properties
//   addValueOnInput                  -                    → properties
//   enableFxAndBind                  fx                   → properties
//   clearParameter                   code                 → properties
//   expectNoFxButton                 fx                   → properties
//   alignmentToggle                  -                    → styles
//   locateAlignmentToggle            -                    → styles
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/properties: right-Inspector **Properties tab** helpers.
 * FOR AI: set/verify a component's config PROPERTIES (label, toggles, switches,
 * tooltip, widget name). Route by the config field `type`:
 *   code → verifyAndModifyParameter · toggle → verifyAndModifyToggleFx · switch → verifyAndModifySwitch.
 * PRECONDITION: call openEditorSidebar(W) first to open the panel; open/closeAccordion
 * are shared panel navigation.
 * NOT here: styles → styles.js · events & CSA → events.js · component-state tree → inspectorTree.js.
 */
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";

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
 * @tjType   fx
 * @tjBlock  properties
 * @tjUsage  enableFxAndBind('Loading state', '{{components.toggleswitch1.value}}')
 * @tjDom    parameter fx toggle button, then the CodeMirror field it swaps in
 */
// A toggle property must have fx turned ON before it becomes a code field at all.
// Distinct from verifyAndModifyToggleFx, which verifies a braced DEFAULT then flips it —
// this one binds an arbitrary expression.
export const enableFxAndBind = (paramName, expression) => {
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  verifyAndModifyParameter(paramName, expression);
};

/**
 * @tjType   code
 * @tjBlock  properties
 * @tjUsage  clearParameter('Min size (bytes)')
 * @tjDom    parameter-<name> CodeMirror content, asserted digit-free
 */
// Leaves a `type:'code'` field truly EMPTY. verifyAndModifyParameter cannot: it types a
// space before the value, and a space is a non-empty string, which a widget reads
// differently from nothing.
export const clearParameter = (paramName) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).scrollIntoView().should("have.text", paramName);
  cy.get(commonWidgetSelector.parameterInputField(paramName)).clearAndTypeOnCodeMirror("");
  // No digits left, rather than have.text "": an empty CodeMirror can render a
  // .cm-placeholder whose text would count. Any leftover value has a digit.
  cy.get(commonWidgetSelector.parameterInputField(paramName))
    .find(".cm-content")
    .invoke("text")
    .should("not.match", /\d/);
};

// One field's whole row. SingleLineCodeEditor wraps every parameter in this, with the
// label div (`.field`), the fx button and the control as siblings INSIDE it — so
// `.field` is the label alone, never the row.
const fieldRow = ".wrapper-div-code-editor";

// The negative case for isFxNotRequired fields — 58 widget configs declare at least one.
// renderFx() returns null outright when isFxNotRequired is defined
// (SingleLineCodeEditor.jsx:699), so the button is ABSENT FROM THE DOM, not merely
// hidden; the .fx-button-container opacity rule only dims buttons that do render.
//
// Located by a CALLBACK returning the field's own control, not by param name, because
// name is unusable for common cases: a field with displayName:'' has no label at all,
// and a switch can SHARE a displayName with an fx-capable code field (checkbox and File
// Button both hit this with 'Tooltip'), so `<name>-fx-button` genuinely exists.
//
// controlParamName is not decoration: a bare "not.exist" also passes when the selector
// is wrong or the accordion is shut, which asserts nothing at all. The control is an
// fx-CAPABLE field in the same open accordion and MUST resolve.
/**
 * @tjType   fx
 * @tjBlock  properties
 * @tjUsage  expectNoFxButton(() => cy.get('[data-cy="togglr-button-none"]'), 'Border radius')
 * @tjDom    the located field's row, asserted to contain no .fx-button
 */
export const expectNoFxButton = (locateField, controlParamName) => {
  cy.get(commonWidgetSelector.parameterFxButton(controlParamName)).should("exist");
  locateField().closest(fieldRow).should("have.length", 1).find(".fx-button").should("not.exist");
};

/**
 * @tjBlock  styles
 * @tjUsage  alignmentToggle('right', false).click()   // a 2-option icon-direction group
 * @tjDom    togglr-button-<value>, disambiguated by whether the group has `center`
 */
// Icon-direction and content-alignment groups render the SAME togglr-button-left/right
// data-cy values, so a bare selector hits whichever comes first in document order. They
// differ only in the third option: content-alignment has a `center`, icon-direction has
// just left/right. Pass hasCenter to say which you mean.
export const alignmentToggle = (value, hasCenter) =>
  cy
    .get(`[data-cy="togglr-button-${value}"]`)
    .filter(
      (_i, el) =>
        (Cypress.$(el).closest(".ToggleGroup").find('[data-cy="togglr-button-center"]').length > 0) === hasCenter
    );

// expectNoFxButton takes a locator callback, so bind the value it should probe.
/**
 * @tjBlock  styles
 * @tjUsage  expectNoFxButton(locateAlignmentToggle(false), 'Label size')
 * @tjDom    curries alignmentToggle('left', hasCenter) into a locator callback
 */
export const locateAlignmentToggle = (hasCenter) => () => alignmentToggle("left", hasCenter);
