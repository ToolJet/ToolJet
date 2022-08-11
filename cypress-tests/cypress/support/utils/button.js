import { buttonText } from "Texts/button";
import { commonWidgetSelector } from "Selectors/common";

export const openButtonStylesEditorSideBar = () => {
  cy.get(commonWidgetSelector.draggableWidget(buttonText.widgetName)).trigger(
    "mouseover"
  );
  cy.get(
    commonWidgetSelector.widgetConfigHandle(buttonText.defaultWidgetName)
  ).click();
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
};
