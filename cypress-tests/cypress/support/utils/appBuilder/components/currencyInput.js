import {
  currencyInputSelector,
  currencyInputInspectorSelector,
} from "Selectors/appBuilder/components/currencyInput";
import { openEditorSidebar } from "Support/utils/appBuilder/properties";

/**
 * MODULE — appBuilder/components/currencyInput: Currency Input currency-picker + keyboard helpers.
 * The currency menu is a react-select portalled into document.body and keyed by the component id
 * (CountrySelect.jsx:134,160), so the helpers resolve the id from the canvas wrapper first.
 */

/**
 * @tjBlock  canvas
 * @tjUsage  getCurrencyComponentId('currencyinput1').then((id) => ...)
 * @tjDom    closest `[component-type]` wrapper of the draggable → its `id`
 */
export const getCurrencyComponentId = (widgetName) =>
  cy
    .get(currencyInputSelector.draggableWidget(widgetName))
    .closest(currencyInputSelector.wrapper)
    .invoke("attr", "id");

/**
 * @tjBlock  canvas
 * @tjUsage  openCurrencyMenu('currencyinput1').then((id) => ...)
 * @tjDom    real click on the currency picker → `.country-<id>__menu` visible; yields the component id
 */
export const openCurrencyMenu = (widgetName) =>
  getCurrencyComponentId(widgetName).then((id) => {
    cy.get(currencyInputSelector.currencySelect(widgetName)).realClick();
    cy.get(currencyInputSelector.menu(id)).should("be.visible");
    cy.get(currencyInputSelector.menuSearch(id)).should("be.visible");
    return cy.wrap(id);
  });

/**
 * @tjBlock  canvas
 * @tjUsage  searchCurrency(id, '£')
 * @tjDom    types into the menu's search box (CustomMenuList.jsx:23-44)
 */
export const searchCurrency = (componentId, text) => {
  cy.get(currencyInputSelector.menuSearch(componentId)).realClick();
  cy.get(currencyInputSelector.menuSearch(componentId)).clear().type(text);
  cy.get(currencyInputSelector.menuSearch(componentId)).should("have.value", text);
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectEveryCurrencyOption(id, (text) => text.includes('£'), 'shows £')
 * @tjDom    every rendered `.country-<id>__option` passes the predicate; at least one is rendered
 */
export const expectEveryCurrencyOption = (componentId, predicate, description) => {
  cy.get(currencyInputSelector.option(componentId)).should(($opts) => {
    expect($opts.length, "filtered options rendered").to.be.gte(1);
    $opts.each((_i, el) => {
      expect(predicate(el.innerText.trim()), `option "${el.innerText.trim()}" ${description}`).to.be.true;
    });
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  selectCurrencyOption(id, '£ (GBP)')
 * @tjDom    real click on the `.country-<id>__option` whose text is the label
 */
export const selectCurrencyOption = (componentId, optionLabel) => {
  cy.contains(currencyInputSelector.option(componentId), optionLabel).scrollIntoView().realClick();
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectCurrencyPrefix('currencyinput1', '£')
 * @tjDom    the currency prefix rendered beside the flag (CustomValueContainer.jsx:30-31)
 */
export const expectCurrencyPrefix = (widgetName, prefix) => {
  cy.get(currencyInputSelector.prefix(widgetName)).should(($s) => {
    expect($s.text().trim(), "currency prefix").to.eq(prefix);
  });
};

/**
 * @tjBlock  properties
 * @tjUsage  selectInspectorSelectOption('Number Format', 'European (eg. 1.234.567,89)')
 * @tjDom    inspector `label.form-label` → its block's _ui/Select control → `.react-select__option` by text
 */
export const selectInspectorSelectOption = (formLabel, optionText) => {
  cy.contains(currencyInputInspectorSelector.formLabel, formLabel)
    .scrollIntoView()
    .parent()
    .parent()
    .as("inspectorSelectBlock");
  cy.get("@inspectorSelectBlock").find(currencyInputInspectorSelector.selectControl).click();
  cy.contains(currencyInputInspectorSelector.selectOption, optionText).click();
  cy.get("@inspectorSelectBlock").should("contain.text", optionText);
  cy.waitForAutoSave();
};

/**
 * @tjBlock  canvas
 * @tjUsage  typeAndExpectDisplay('currencyinput1', '1234.567', '1,234.56')
 * @tjDom    clear the amount field, realType the keystrokes, assert the rendered field text
 */
export const typeAndExpectDisplay = (widgetName, keystrokes, expectedDisplay) => {
  cy.get(currencyInputSelector.input(widgetName)).clear();
  cy.get(currencyInputSelector.input(widgetName)).should("have.value", "");
  cy.get(currencyInputSelector.input(widgetName)).realClick().realType(keystrokes);
  cy.get(currencyInputSelector.input(widgetName)).should("have.value", expectedDisplay);
};

/**
 * @tjBlock  canvas
 * @tjUsage  collectTabStops('[data-cy="textinput1-input"]', '[data-cy="draggable-widget-currencyinput1"]', 4).then((hits) => ...)
 * @tjDom    focus `from`, press real Tab `count` times; yields, per press, whether document.activeElement is inside `within`
 */
export const collectTabStops = (fromSelector, withinSelector, count) => {
  const hits = [];
  cy.get(fromSelector).realClick();
  Cypress._.times(count, () => {
    cy.realPress("Tab");
    cy.document().then((doc) => {
      const scope = doc.querySelector(withinSelector);
      const active = doc.activeElement;
      hits.push({
        inside: !!(scope && active && scope.contains(active)),
        active: active ? active.outerHTML.slice(0, 100) : "none",
      });
    });
  });
  return cy.wrap(hits);
};

/**
 * @tjBlock  canvas
 * @tjUsage  addProbeTextWidget('components.currencyinput1.value')
 * @tjDom    drop a Text widget, bind its Text field (`text-input-field`) to `{{<expression>}}` via the
 *           string tokenizer of clearAndTypeOnCodeMirror (the array form realTypes braces and throws)
 */
export const addProbeTextWidget = (expression, x = 600, y = 80) => {
  cy.forceClickOnCanvas();
  cy.dragAndDropWidget("Text", x, y);
  openEditorSidebar("text1");
  cy.get('[data-cy="text-input-field"]').clearAndTypeOnCodeMirror(`{{${expression}}}`);
  cy.get('[data-cy="text-input-field"]').find(".cm-line").should("have.text", `{{${expression}}}`);
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};
