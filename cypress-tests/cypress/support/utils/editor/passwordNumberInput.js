import { faker } from "@faker-js/faker";
import { commonWidgetSelector } from "Selectors/common";
import { openAccordion, openEditorSidebar } from "Support/utils/commonWidget";
import { buttonText } from "Texts/button";
import { commonWidgetText } from "Texts/common";

import {
  addSupportCSAData,
  selectCSA,
  selectEvent,
} from "Support/utils/events";

export const verifyControlComponentAction = (widgetName, value) => {
  cy.forceClickOnCanvas();
  cy.dragAndDropWidget("button", 340, 90);

  openEditorSidebar(widgetName);
  openAccordion(commonWidgetText.accordionEvents, ["Validation", "Devices"]);

  cy.get(commonWidgetSelector.addMoreEventHandlerLink).click();
  cy.get(commonWidgetSelector.eventHandlerCard).eq(1).click();

  cy.get(commonWidgetSelector.actionSelection).type("Control component{Enter}");
  cy.get(commonWidgetSelector.eventComponentSelection).type("button1{Enter}");
  cy.get(commonWidgetSelector.eventComponentActionSelection).type(
    "Set text{Enter}"
  );
  cy.get(commonWidgetSelector.componentTextInput)
    .find('[data-cy*="-input-field"]')
    .clearAndTypeOnCodeMirror(["{{", `components.${widgetName}.value}}`]);

  cy.clearAndType(commonWidgetSelector.draggableWidget(widgetName), value);
  cy.get(
    commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
  ).should("have.text", value);
};

export const randomString = (length) => {
  let str = faker.lorem.words();
  return str.replace(/\s/g, "").substr(0, length);
};

export const verifyCSA = (data) => {
  cy.get(commonWidgetSelector.draggableWidget("textinput1")).click({
    force: true,
  });
  cy.get(commonWidgetSelector.draggableWidget("textinput1"))
    .clear()
    .type(data.customText);
  cy.get(
    commonWidgetSelector.draggableWidget(data.widgetName)
  ).verifyVisibleElement("have.value", data.customText);

  cy.get(commonWidgetSelector.draggableWidget("button2")).click();
  cy.get(
    commonWidgetSelector.draggableWidget(data.widgetName)
  ).verifyVisibleElement("have.value", "");

  cy.get(commonWidgetSelector.draggableWidget("button5")).click();
  cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
    .should("have.focus")
    .realType(String(data.customText));
  cy.get(
    commonWidgetSelector.draggableWidget(data.widgetName)
  ).verifyVisibleElement("have.value", data.customText);
  cy.get(commonWidgetSelector.draggableWidget("button4")).click();
  cy.realType("not working123");
  cy.get(
    commonWidgetSelector.draggableWidget(data.widgetName)
  ).verifyVisibleElement("have.value", data.customText);

  cy.get(commonWidgetSelector.draggableWidget("button6")).click();
  cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
    .parent()
    .within(() => {
      cy.get(".tj-widget-loader").should("be.visible");
    });

  cy.get(commonWidgetSelector.draggableWidget("button3")).click();
  cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
    .parent()
    .should("have.attr", "data-disabled", "true");

  cy.get(commonWidgetSelector.draggableWidget("button1")).click();
  cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
    "not.be.visible"
  );
};

export const addCSA = (data) => {
  cy.forceClickOnCanvas();
  cy.dragAndDropWidget(buttonText.defaultWidgetText, 50, 500);
  selectEvent("On click", "Control Component");
  selectCSA(data.widgetName, "Set visibility");

  cy.forceClickOnCanvas();
  cy.dragAndDropWidget("Text input", 50, 50);
  selectEvent("On change", "Control Component");
  cy.wait(500);
  selectCSA(data.widgetName, "Set text", "500");
  cy.wait(500);
  addSupportCSAData("text", `{{components.textinput1.value`);

  cy.forceClickOnCanvas();
  cy.dragAndDropWidget(buttonText.defaultWidgetText, 150, 400);
  selectEvent("On click", "Control Component");
  selectCSA(data.widgetName, "Clear", "500");

  cy.forceClickOnCanvas();
  cy.dragAndDropWidget(buttonText.defaultWidgetText, 250, 400);
  selectEvent("On click", "Control Component");
  selectCSA(data.widgetName, "Set disable", "500");
  cy.wait(500);
  cy.get('[data-cy="event-Value-fx-button"]').click();
  cy.get('[data-cy="event-Value-input-field"]').clearAndTypeOnCodeMirror(
    "{{true"
  );

  cy.forceClickOnCanvas();
  cy.dragAndDropWidget(buttonText.defaultWidgetText, 350, 400);
  selectEvent("On click", "Control Component");
  selectCSA(data.widgetName, "Set blur", "500");

  cy.forceClickOnCanvas();
  cy.dragAndDropWidget(buttonText.defaultWidgetText, 450, 400);
  selectEvent("On click", "Control Component");
  selectCSA(data.widgetName, "Set focus");

  cy.forceClickOnCanvas();
  cy.dragAndDropWidget(buttonText.defaultWidgetText, 300, 300);
  selectEvent("On click", "Control Component");
  selectCSA(data.widgetName, "Set loading", "500");
  cy.wait(500);
  cy.get('[data-cy="event-Value-fx-button"]').click();
  cy.get('[data-cy="event-Value-input-field"]').clearAndTypeOnCodeMirror(
    "{{true"
  );
};
