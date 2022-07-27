import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";

export const openAccordion = (accordionName) => {
  cy.get(commonWidgetSelector.accordion(accordionName))
    .should("have.text", accordionName)
    .then(($accordion) => {
      if ($accordion.hasClass("collapsed")) {
        cy.get(commonWidgetSelector.accordion(accordionName)).click();
      }
    });
};

export const verifyAndModifyParameter = (paramName, value) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).should(
    "have.text",
    paramName
  );
  cy.get(
    commonWidgetSelector.parameterInputField(paramName)
  ).clearAndTypeOnCodeMirror(value);
};

export const openEditorSidebar = (draggableSelector, widgetName) => {
  cy.get(draggableSelector).trigger("mouseover");
  cy.get(commonWidgetSelector.widgetConfigHandle(widgetName)).click();
};

export const verifyAndModifyToggleFx = (paramName, defaultValue) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).should(
    "have.text",
    paramName
  );
  cy.get(
    commonWidgetSelector.parameterFxButton(
      paramName,
      "[class*='fx-button  unselectable']"
    )
  )
    .should("have.text", "Fx")
    .click();
  cy.get(commonWidgetSelector.parameterInputField(paramName))
    .find("pre.CodeMirror-line")
    .should("have.text", defaultValue);
  cy.get(commonWidgetSelector.parameterFxButton(paramName)).click();
  cy.get(commonWidgetSelector.parameterTogglebutton(paramName)).click();
};

export const addDefaultEventHandler = (message) => {
  cy.get(commonWidgetSelector.addEventHandlerLink)
    .should("have.text", commonWidgetText.addEventHandlerLink)
    .click();
  cy.get(commonWidgetSelector.eventHandlerCard).click();
  cy.get(commonWidgetSelector.alertMessageInputField).clearAndTypeOnCodeMirror(
    message
  );
};

export const addAndVerifyTooltip = (widgetSelector, message) => {
  cy.get(commonWidgetSelector.tooltipInputField).clearAndTypeOnCodeMirror(
    message
  );
  cy.get(commonSelectors.canvas).click({ force: true });
  cy.get(widgetSelector)
    .trigger("mouseover")
    .then(() => {
      cy.get(commonWidgetSelector.tooltipLabel).should("have.text", message);
    });
};

export const editAndVerifyWidgetName = (widgetSelector, name) => {
  cy.get(commonWidgetSelector.WidgetNameInputField).clear().type(name);
  cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();

  cy.get(widgetSelector).trigger("mouseover");
  cy.get(commonWidgetSelector.widgetConfigHandle(name))
    .click()
    .should("have.text", name);
};

export const verifyComponentValueFromInspector = (
  componentName,
  value,
  openStatus = "closed"
) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.log(openStatus);

    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(componentName)).click();
  }
  cy.get(commonWidgetSelector.nodeComponentValue).contains(value);
};
