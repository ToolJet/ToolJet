import { commonWidgetSelector } from "Selectors/common";
import { openAccordion, openEditorSidebar } from "Support/utils/commonWidget";
import { buttonText } from "Texts/button";
import { commonWidgetText } from "Texts/common";

export const verifyControlComponentAction = (widgetName,value)=>{
  cy.forceClickOnCanvas();
  cy.dragAndDropWidget("button", 340, 90);

  openEditorSidebar(widgetName);
  openAccordion(commonWidgetText.accordionEvents);

  cy.get(commonWidgetSelector.addMoreEventHandlerLink).click();
  cy.get(commonWidgetSelector.eventHandlerCard).eq(1).click()
  
  cy.get(commonWidgetSelector.actionSelection).type("Control component{Enter}");
  cy.get(commonWidgetSelector.eventComponentSelection).type("button1{Enter}");
  cy.get(commonWidgetSelector.eventComponentActionSelection).type("Set text{Enter}");
  cy.get(commonWidgetSelector.componentTextInput)
  .find('[data-cy*="-input-field"]')
  .clearAndTypeOnCodeMirror(value);

  cy.clearAndType(commonWidgetSelector.draggableWidget(widgetName), "T");
  cy.get(commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)).should("have.text", value);
}

