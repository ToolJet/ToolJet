import { faker } from "@faker-js/faker";
import { commonWidgetSelector } from "Selectors/common";

// ── Inline generic utils (not appbuilder-specific) ────────────────────────────

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

// ── Re-exports from domain modules (barrel — keeps all 148 import sites working) ─

export {
  openAccordion,
  openEditorSidebar,
  closeAccordions,
  selectFromSidebarDropdown,
  verifyAndModifyParameter,
  verifyAndModifyToggleFx,
  verifyAndModifySwitch,
  verifyPropertiesGeneralAccordion,
  addValueOnInput,
  editAndVerifyWidgetName,
  addAndVerifyTooltip,
  verifyTooltip,
  enableFxAndBind,
  clearParameter,
  expectNoFxButton,
  alignmentToggle,
  locateAlignmentToggle,
} from "./appBuilder/properties";

export {
  selectColourFromColourPicker,
  fillBoxShadowParams,
  verifyBoxShadowCss,
  verifyWidgetColorCss,
  verifyLoaderColor,
  verifyAndModifyStylePickerFx,
  verifyStylesGeneralAccordion,
  checkPaddingOfContainer,
  openStyleAccordion,
  selectThemeColour,
  expectThemeColour,
  expectStyleVar,
  expectFontWeight,
} from "./appBuilder/styles";

export {
  verifyWidgetText,
  addTextWidgetToVerifyValue,
  verifyContainerElements,
} from "./appBuilder/components";

export { verifyLayout } from "./appBuilder/layout";

export {
  copyWidget,
  pasteWidget,
  copyPasteWidget,
  cutWidget,
  undo,
  redo,
  selectAllWidgets,
  multiSelectWidgets,
  verifySelectedWidgetCount,
  nudgeWidget,
  duplicateWidgetByKeyboard,
  openComponentInspectorMenu,
  selectComponentInspectorMenuOption,
  duplicateWidgetFromMenu,
  renameWidgetFromMenu,
  deleteWidgetFromMenu,
  getWidgetRect,
  verifyWidgetMoved,
  verifyWidgetResized,
  verifyWidgetCount,
  waitForDropSettle,
  dropWidget,
  clickWidgetInput,
} from "./appBuilder/canvas";

export {
  verifyComponentValueFromInspector,
  verifyMultipleComponentValuesFromInspector,
  verifyComponentFromInspector,
} from "./appBuilder/inspectorTree";
