import { commonWidgetSelector } from "Selectors/common";
import { openAccordion, openEditorSidebar } from "Support/utils/commonWidget";
import { commonWidgetText } from "Texts/common";

export const verifyControlComponentAction = (widgetName, value) => {
  cy.forceClickOnCanvas();
  cy.dragAndDropWidget("Text input", 280, 90);

  openEditorSidebar(widgetName);
  openAccordion(commonWidgetText.accordionEvents);

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

  cy.get(commonWidgetSelector.draggableWidget('textinput1')).should("have.value", value);
};
