import { commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import { openAccordion, openEditorSidebar } from "Support/utils/commonWidget";

export const openButtonStylesEditorSideBar = (widgetText, widgetName) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetText)).trigger("mouseover");
  cy.get(commonWidgetSelector.widgetConfigHandle(widgetName)).click();
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
};

export const openButtonPropertiesEditorSideBar = (widgetText, widgetName) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetText)).trigger("mouseover");
  cy.get(commonWidgetSelector.widgetConfigHandle(widgetName)).click();
};

export const verifyControlComponentAction = (widgetName, value) => {
  cy.forceClickOnCanvas();
  cy.dragAndDropWidget("Text input", 280, 90);

  openEditorSidebar(widgetName);
  openAccordion(buttonText.eventsAccordion);

  cy.get(commonWidgetSelector.addMoreEventHandlerLink).click();
  cy.get(commonWidgetSelector.eventHandlerCard).eq(1).click();

  cy.get(commonWidgetSelector.actionSelection).type("Control component{Enter}");
  cy.get(commonWidgetSelector.eventComponentSelection).type(
    "textinput1{Enter}"
  );
  cy.get(commonWidgetSelector.eventComponentActionSelection).type(
    "Set text{Enter}"
  );
  cy.get(commonWidgetSelector.componentTextInput)
    .find('[data-cy*="-input-field"]')
    .clearAndTypeOnCodeMirror(value);
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).click();

  cy.get(commonWidgetSelector.textInputWidget).should("have.value", value);
};
