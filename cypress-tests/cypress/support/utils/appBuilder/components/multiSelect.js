// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// multiSelect.js
//   verifyMultiselectOptions         -                    → canvas
//   verifyMultiselectStatus          -                    → canvas
//   selectFromMultiSelect            -                    → canvas
//   verifyMultiselectHeader          -                    → canvas
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { multiselectSelector } from "Selectors/appBuilder/components/multiselect";

/**
 * MODULE — appBuilder/components/multiSelect: Multiselect widget canvas helpers.
 * FOR AI: open the multiselect dropdown and verify its option labels, checked
 * state, and header text, or select options by a per-option "true" flag list.
 * All helpers operate on the rendered widget on canvas (draggable-widget-<name> →
 * multiselectHeader → dropdownAllItems), not the inspector.
 * NOT here: properties → appBuilder/properties.js · styles → appBuilder/styles.js.
 */

/**
 * @tjBlock  canvas
 * @tjUsage  verifyMultiselectOptions('multiselect1', ['one','two','three'])
 * @tjDom    opens multiselectHeader; asserts each dropdownAllItems text vs label[i]
 */
export const verifyMultiselectOptions = (
  widgetName,
  label = ["one", "two", "three"]
) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .find(multiselectSelector.multiselectHeader)
    .click();
  cy.get(multiselectSelector.dropdownAllItems).each(($option, i) => {
    cy.wrap($option).should("have.text", label[i].replaceAll('"', ""));
  });
  cy.forceClickOnCanvas();
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifyMultiselectStatus('multiselect1', ['', '', 'not.'])
 * @tjDom    opens header (retries if empty); asserts dropdownCheckbox <status[i]>to.be.checked
 */
export const verifyMultiselectStatus = (
  widgetName,
  status = ["", "", "not."]
) => {
  const click = () => {
    cy.get(commonWidgetSelector.draggableWidget(widgetName))
      .find(multiselectSelector.multiselectHeader)
      .click();
    cy.wait(500);
    cy.get("body").then(($body) => {
      if ($body.find(multiselectSelector.dropdownAllItems).length == 0) {
        click();
      }
    });
  };
  click();

  cy.get(multiselectSelector.dropdownAllItems).each(($option, i) => {
    cy.wrap($option)
      .find(multiselectSelector.dropdownCheckbox)
      .should(`${status[i]}to.be.checked`);
  });
  cy.forceClickOnCanvas();
};

/**
 * @tjBlock  canvas
 * @tjUsage  selectFromMultiSelect('multiselect1', ['true','false','true'])
 * @tjDom    opens header; clicks dropdownCheckbox where options[i] === 'true'
 */
export const selectFromMultiSelect = (widgetName, options) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .find(multiselectSelector.multiselectHeader)
    .click();
  cy.get(multiselectSelector.dropdownAllItems, { timeout: 2000 }).each(
    ($option, i) => {
      if (options[i] == "true")
        cy.wrap($option).find(multiselectSelector.dropdownCheckbox).click();
    }
  );
  cy.forceClickOnCanvas();
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifyMultiselectHeader('multiselect1', 'Select...')
 * @tjDom    asserts multiselectHeader have.text within draggable-widget-<name>
 */
export const verifyMultiselectHeader = (widgetName, text) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .find(multiselectSelector.multiselectHeader)
    .should("have.text", text);
};
