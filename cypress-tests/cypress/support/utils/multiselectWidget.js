import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { multiselectSelector } from "Selectors/multiselect";

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
  cy.get(commonSelectors.canvas).click({ force: true });
};

export const verifyMultiselectStatus = (
  widgetName,
  status = ["", "", "not."]
) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .find(multiselectSelector.dropdownArrow)
    .click();
  cy.get(multiselectSelector.dropdownAllItems).each(($option, i) => {
    cy.wrap($option)
      .find(multiselectSelector.dropdownCheckbox)
      .should(`${status[i]}to.be.checked`);
  });
  cy.get(commonSelectors.canvas).click({ force: true });
};

export const selectFromMultiSelect = (widgetName, options) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .find(multiselectSelector.dropdownArrow)
    .click();
  cy.get(multiselectSelector.dropdownAllItems).each(($option, i) => {
    if (options[i] == "true")
      cy.wrap($option).find(multiselectSelector.dropdownCheckbox).click();
  });
  cy.get(commonSelectors.canvas).click({ force: true });
};

export const verifyMultiselectHeader = (widgetName, text) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .find(multiselectSelector.multiselectHeader)
    .should("have.text", text);
};
