// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// textInput.js
//   verifyControlComponentAction     -                    → csa
//   randomString                     -                    → common
//   verifyCSA                        csa                  → csa
//   addCSA                           csa                  → csa
// └──────────────────────────────────────────────────────────────────┘
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

/**
 * @tjBlock  csa
 * @tjUsage  verifyControlComponentAction('textinput1', 'hello')
 * @tjDom    canvas → button widget → Control Component event → Set text action
 */
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

/**
 * @tjBlock  common
 * @tjUsage  randomString(8)
 */
export const randomString = (length) => {
  let str = faker.lorem.words();
  return str.replace(/\s/g, "").substr(0, length);
};

/**
 * @tjType   csa
 * @tjBlock  csa
 * @tjUsage  verifyCSA('textinput1')
 * @tjDom    button1-9 clicks → draggable-widget visibility / disabled / value assertions
 */
export const verifyCSA = (component) => {
  cy.get(commonWidgetSelector.draggableWidget("button1")).click();
  cy.get(commonWidgetSelector.draggableWidget(component)).should("not.be.visible");

  cy.get(commonWidgetSelector.draggableWidget("button2")).click();
  cy.get(commonWidgetSelector.draggableWidget(component)).should("be.visible");

  cy.get(commonWidgetSelector.draggableWidget("button3")).click();
  cy.get(commonWidgetSelector.draggableWidget(component)).should("be.disabled");

  cy.get(commonWidgetSelector.draggableWidget("button4")).click();
  cy.get(commonWidgetSelector.draggableWidget(component)).should("not.be.disabled");

  cy.get(commonWidgetSelector.draggableWidget("button5")).click();
  cy.get(commonWidgetSelector.draggableWidget(component)).should("have.value", "1199999");

  cy.get(commonWidgetSelector.draggableWidget("button6")).click();
  cy.get(commonWidgetSelector.draggableWidget(component)).should("have.value", "");

  cy.forceClickOnCanvas();
  cy.get(commonWidgetSelector.draggableWidget("button7")).click();
  cy.realType('999999');
  cy.get(commonWidgetSelector.draggableWidget(component)).should("have.value", "999999");

  cy.get(commonWidgetSelector.draggableWidget("button8")).click();
  cy.wait(1000)

  cy.realType('123');
  cy.get(commonWidgetSelector.draggableWidget(component)).should("not.have.value", "999999123").and("have.value", "999999");

  cy.get(commonWidgetSelector.draggableWidget("button9")).click();
  cy.get(commonWidgetSelector.draggableWidget(component))
    .parent()
    .within(() => {
      cy.get(".tj-widget-loader").should("be.visible");
    });
};

/**
 * @tjType   csa
 * @tjBlock  csa
 * @tjUsage  addCSA('textinput1', [{ event: 'On click', action: 'Set text', value: 'hello' }])
 * @tjDom    canvas drag-drop buttons → Control Component events + CSA action values
 */
export const addCSA = (componentName, actions) => {
  actions.forEach((action, index) => {
    cy.forceClickOnCanvas();
    cy.wait(200);
    const xOffset = 100 + (index % 6) * 150;
    const yOffset = 300 + Math.floor(index / 6) * 100;
    cy.dragAndDropWidget(buttonText.defaultWidgetText, xOffset, yOffset);
    selectEvent(action.event, "Control Component");
    selectCSA(componentName, action.action);
    // The CSA action's value renders as a fxEditor CodeHinter wrapped in a
    // constant `action-options-text-input-field` (EventManager.jsx:1042). The
    // inner fx/input data-cy is `event-<param.displayName>-*` (varies per action:
    // Text, Value, …), so target the constant wrapper instead. String params
    // default to code (fx active → `.cm-line` present); boolean params default to
    // a toggle, so click the fx button first to reveal the code editor.
    if (action.value) {
      cy.wait(500);
      cy.get('[data-cy="action-options-text-input-field"]:visible')
        .last()
        .clearAndTypeOnCodeMirror(action.value);
    } if (action.valueToggle) {
      cy.wait(500);
      cy.get('[data-cy="action-options-text-input-field"]:visible')
        .last()
        .find(".fx-button")
        .click({ force: true });
      cy.get('[data-cy="action-options-text-input-field"]:visible')
        .last()
        .clearAndTypeOnCodeMirror(action.valueToggle);
    }

  });
};
