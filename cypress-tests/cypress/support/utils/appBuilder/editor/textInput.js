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
} from "Support/utils/appBuilder/events";

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
  // The component-under-test drop (in the caller's beforeEach) may leave the
  // components panel OPEN; addCSA's first button drag would then toggle it shut
  // (its own components-button click closes an already-open panel → the widget
  // search box goes missing). Close it once up front so each drag re-opens it.
  cy.get("body").then(($b) => {
    if ($b.find('[data-cy="widget-search-box-search-bar"]:visible').length) {
      cy.get('[data-cy="right-sidebar-components-button"]').click();
    }
  });

  actions.forEach((action, index) => {
    cy.forceClickOnCanvas();
    cy.wait(200);
    const xOffset = 100 + (index % 6) * 150;
    const yOffset = 300 + Math.floor(index / 6) * 100;
    cy.dragAndDropWidget(buttonText.defaultWidgetText, xOffset, yOffset);
    // `add-event-handler` only renders once the dropped button's inspector is
    // open (a bare drop no longer auto-opens it). Buttons auto-name button1..N
    // in drop order, so index+1 is the one just dropped.
    openEditorSidebar(`button${index + 1}`);
    selectEvent(action.event, "Control Component");
    selectCSA(componentName, action.action);
    cy.waitForAutoSave();

    // Route the value by the param's RENDERED field type — boolean params render
    // as a TOGGLE (`event-<Label>-toggle-button`), text/code params as a
    // CodeHinter (`action-options-text-input-field`). action.value and
    // action.valueToggle are unified; the rendered field (not the key) decides.
    // Setting the toggle directly avoids the fx→code CodeHinter remount that
    // detaches the typed subject (probe-confirmed).
    const rawValue = action.value ?? action.valueToggle;
    if (rawValue !== undefined) {
      cy.wait(600);
      const toggleSel = '[data-cy^="event-"][data-cy$="-toggle-button"]:visible';
      cy.get("body").then(($b) => {
        if ($b.find(toggleSel).length) {
          const desired = rawValue !== "{{false}}" && rawValue !== false;
          // Read state, then click via a FRESH cy.get (requeryable) — NOT
          // cy.wrap($t) (a snapshot that detaches if the toggle re-renders,
          // making the click a silent no-op → the assertion never flips).
          cy.get(toggleSel)
            .invoke("prop", "checked")
            .then((checked) => {
              if (checked !== desired) {
                cy.get(toggleSel).click({ force: true });
              }
            });
          cy.get(toggleSel).should(desired ? "be.checked" : "not.be.checked");
        } else {
          // Plain get (no `.last()`) so Cypress can auto-requery on re-render.
          cy.get('[data-cy="action-options-text-input-field"]:visible')
            .clearAndTypeOnCodeMirror(rawValue);
        }
      });
    }
  });
};
