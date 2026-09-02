// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// listView.js
//   renameListView                   -                    → properties
//   addRecordClickedAlertHandler     -                    → events
//   clickListViewRow                 -                    → canvas
//   deleteInnerWidget                -                    → canvas
//   dropWidgetToListview             -                    → canvas
//   verifyMultipleComponentValuesFromInspector -                    → inspector
//   addDataToListViewInputs          -                    → canvas
//   verifyValuesOnList               -                    → canvas
//   verifyExposedValueByToast        -                    → canvas
//   textArrayOfLength                -                    → common
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";

/**
 * MODULE — appBuilder/components/listView: List View widget helpers.
 * FOR AI: drive the List View container — rename it, wire its record/row events,
 * click rows, drop child widgets into a row, and read/verify per-row child values
 * (both on-canvas and via the inspector component tree).
 * NOTE: List View has NO "On click"; its events are "Record clicked"
 * (onRecordClicked) and "Row clicked (Deprecated)" (onRowClicked) — use
 * addRecordClickedAlertHandler, not the shared addDefaultEventHandler.
 * NOT here: generic properties → appBuilder/properties.js · styles → appBuilder/styles.js.
 */

/**
 * @tjBlock  properties
 * @tjUsage  renameListView('myList')
 * @tjDom    inspector header edit-widget-name input; asserts draggable-widget-<name>
 */
// Rename the List View via the always-visible inspector header input
// (`edit-widget-name`, Inspector.jsx:585). Avoids the legacy
// editAndVerifyWidgetName→closeAccordions(["General","Properties","Devices"])
// path whose accordions no longer exist in the current 2-tab inspector.
export const renameListView = (newName) => {
  cy.clearAndType(commonWidgetSelector.WidgetNameInputField, newName);
  cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click({ force: true });
  // The renamed widget's canvas data-cy is draggable-widget-<name>
  // (RenderWidget.jsx, lowercased via cyParamName).
  cy.get(commonWidgetSelector.draggableWidget(newName)).should("exist");
};

/**
 * @tjBlock  events
 * @tjUsage  addRecordClickedAlertHandler('clicked!')
 * @tjDom    add-event-menu → event-trigger-option-onRecordClicked → alert message CodeMirror
 */
// Add a "Record clicked" → Show Alert event handler for the List View.
// The shared addDefaultEventHandler hard-codes the "On click" trigger, which the
// List View does not have — its events are "Row clicked (Deprecated)"
// (onRowClicked) and "Record clicked" (onRecordClicked) (listview.js:208-211;
// EventManager.jsx:179-186,1306 build event-trigger-option-<eventId>). A new
// handler defaults to actionId 'show-alert' (EventManager.jsx:441), so we only
// pick the trigger then type the alert message.
export const addRecordClickedAlertHandler = (message) => {
  cy.intercept(/\/events(\/|\?|$)/).as("events");
  cy.get(commonWidgetSelector.addEventHandlerLink).eq(0).click();
  cy.get('[data-cy="add-event-menu"]').should("be.visible");
  cy.get('[data-cy="event-trigger-option-onRecordClicked"]').click();
  cy.wait("@events");
  cy.get('[data-cy="popover-card"]').should("be.visible");
  cy.wait(1000);
  cy.get(commonWidgetSelector.alertMessageInputField)
    .find('[data-cy*="-input-field"]')
    .eq(0)
    .clearAndTypeOnCodeMirror(message);
  cy.get('[data-cy="run-only-if-input-field"]').click({ force: true });
};

/**
 * @tjBlock  canvas
 * @tjUsage  clickListViewRow('myList', 0)
 * @tjDom    canvas row <name>-row-<index>
 */
// Click a List View row by index. Row data-cy is `<name>-row-<index>`
// (ListviewSubcontainer.jsx:72, name lowercased).
export const clickListViewRow = (listviewName, index) => {
  cy.get(`[data-cy="${listviewName.toLowerCase()}-row-${index}"]`).click(
    "left",
    { force: true }
  );
};

/**
 * @tjBlock  canvas
 * @tjUsage  deleteInnerWidget('myList', 'text1')
 * @tjDom    within draggable-widget-<list>, clicks inner widget then <inner>-delete-button
 */
export const deleteInnerWidget = (widgetName, innerWidgetName) => {
  cy.get(commonSelectors.canvas).click({ force: true });
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).within(() => {
    cy.get(commonWidgetSelector.draggableWidget(innerWidgetName)).as(
      "innerWidget"
    );
    cy.get("@innerWidget").first().click();
    cy.get(`[data-cy="${innerWidgetName}-delete-button"]`)
      .realClick()
      .should("not.exist");
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  dropWidgetToListview('Text', 250, 45, 'myList')
 * @tjDom    drags widgetBox onto <list>-row-0 .real-canvas via HTML5 DataTransfer
 */
export const dropWidgetToListview = (
  widgetName,
  positionX = 250,
  positionY = 45,
  listviewName
) => {
  const dataTransfer = new DataTransfer();

  cy.forceClickOnCanvas();
  cy.clearAndType(commonSelectors.searchField, widgetName);
  cy.get(commonWidgetSelector.widgetBox(widgetName)).trigger(
    "dragstart",
    { dataTransfer },
    { force: true }
  );
  cy.get(commonWidgetSelector.draggableWidget(listviewName)).within(() => {
    cy.get(`[data-cy="${listviewName.toLowerCase()}-row-0"]`)
      .children(".real-canvas")
      .click()
      .trigger("mouseover")
      .trigger("mouseenter")
      .trigger("drop", positionX, positionY, {
        dataTransfer,
        force: true,
        scrollBehavior: top,
        delay: 2000,
      });
  });
  cy.get(`[data-cy="${listviewName.toLowerCase()}-row-0"]`).trigger("dragend");
  cy.waitForAutoSave();
};

/**
 * @tjBlock  inspector
 * @tjUsage  verifyMultipleComponentValuesFromInspector('myList', 'text1', ['a','b'])
 * @tjDom    sidebar inspector component tree → list → data → per-index node values
 */
export const verifyMultipleComponentValuesFromInspector = (
  listviewName,
  componentName,
  values = [],
  openStatus = "closed"
) => {
  cy.get(commonWidgetSelector.sidebarinspector).click();
  if (openStatus == "closed") {
    cy.get(commonWidgetSelector.inspectorNodeComponents).click();
    cy.get(commonWidgetSelector.nodeComponent(listviewName)).click();
    cy.get(commonWidgetSelector.nodeComponent("data")).click();
  }
  values.forEach((value, i) => {
    if (openStatus == "closed") {
      cy.get(commonWidgetSelector.nodeComponent(`${i}`)).click();
      cy.get(
        `${commonWidgetSelector.nodeComponent(componentName)}:eq(${i})`
      ).click();
    }
    cy.get(`${commonWidgetSelector.nodeComponentValue}:eq(${i})`).should(
      "contain.text",
      `${value}`
    );
  });
  cy.forceClickOnCanvas();
};

/**
 * @tjBlock  canvas
 * @tjUsage  addDataToListViewInputs('myList', 'input1', ['a','b'])
 * @tjDom    types data[i] into each draggable-widget-<child> inside the list
 */
export const addDataToListViewInputs = (listviewName, childName, data) => {
  cy.get(commonWidgetSelector.draggableWidget(listviewName)).within(() => {
    cy.get(commonWidgetSelector.draggableWidget(childName)).each(
      ($element, i) => {
        cy.wrap($element).type(`{selectAll}${data[i]}`);
      }
    );
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifyValuesOnList('myList', 'text1', 'text', ['a','b'])
 * @tjDom    asserts have.<type> value[i] on each draggable-widget-<child> in the list
 */
export const verifyValuesOnList = (
  listviewName,
  childName,
  type,
  value,
  isChild = false
) => {
  cy.get(commonWidgetSelector.draggableWidget(listviewName)).within(() => {
    cy.get(commonWidgetSelector.draggableWidget(childName)).each(
      ($element, i) => {
        if (isChild) {
          cy.wrap($element).should(`have.${type}`, value[i]);
        } else {
          cy.wrap($element).should(`have.${type}`, value[i]);
        }
      }
    );
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifyExposedValueByToast('myList', ['a','b'])
 * @tjDom    clicks each <name>-row-<i> and asserts the resulting toast text
 */
export const verifyExposedValueByToast = (widgetName, datas) => {
  datas.forEach((data, i) => {
    cy.get(`[data-cy=${widgetName.toLowerCase()}-row-${i}]`).click();
    cy.verifyToastMessage(`${commonSelectors.toastMessage}:eq(0)`, data);
  });
};

/**
 * @tjBlock  common
 * @tjUsage  const labels = textArrayOfLength(3)
 * @tjDom    none — returns an array of N fake first-name strings (test data helper)
 */
export const textArrayOfLength = (index) => {
  const labels = [];
  for (let i = 0; i < index; i++) {
    labels.push(`${fake.firstName}`);
  }
  return labels;
};
