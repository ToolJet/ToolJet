// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// basicComponents.js
//   verifyComponent                  -                    → canvas
//   verifyComponentinrightpannel     -                    → canvas
//   deleteComponentAndVerify         -                    → canvas
//   verifyComponentWithOutLabel      -                    → canvas
// └──────────────────────────────────────────────────────────────────┘
import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  editAndVerifyWidgetName,
} from "Support/utils/commonWidget";
import { resizeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

/**
 * MODULE — appBuilder/components/basicComponents: generic component lifecycle helpers.
 * FOR AI: reusable, widget-agnostic checks — assert a component is on canvas
 * (verifyComponent), visible in the right components panel (verifyComponentinrightpannel),
 * delete it with the confirm modal (deleteComponentAndVerify), or run the full
 * drop→rename→preview→delete smoke flow for a label-less component
 * (verifyComponentWithOutLabel).
 * NOT here: property/style/event editing → appBuilder/{properties,styles,events}.js.
 */

/**
 * @tjBlock  canvas
 * @tjUsage  verifyComponent('button1')
 * @tjDom    asserts draggable-widget-<name> is visible on canvas
 */
export const verifyComponent = (widgetName) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName), {
    timeout: 10000,
  }).should("be.visible");
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifyComponentinrightpannel('button')
 * @tjDom    ensures right-sidebar-components-button open, asserts widgetBox(<name>) visible
 */
export const verifyComponentinrightpannel = (widgetName) => {
  cy.get("body")
    .then(($body) => {
      const isSearchVisible = $body
        .find(commonSelectors.searchField)
        .is(":visible");

      if (!isSearchVisible) {
        cy.get('[data-cy="right-sidebar-components-button"]').click();
        cy.wait(500);
      }
    })
    .then(() => {
      cy.get(commonWidgetSelector.widgetBox(widgetName), {
        timeout: 10000,
      }).should("be.visible");
    });
};

/**
 * @tjBlock  canvas
 * @tjUsage  deleteComponentAndVerify('button1')
 * @tjDom    hover widget → <name>-delete-component-button → confirm modal yesButton
 */
export const deleteComponentAndVerify = (widgetName) => {
  cy.waitForElement(commonWidgetSelector.draggableWidget(widgetName));
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .realHover()
    .realHover();

  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .realHover()
    .then(() => {
      cy.get(`[data-cy="${widgetName}-delete-component-button"]`)
        .realHover({ position: "topRight" })
        .last()
        .realClick();
    });
  cy.get('[data-cy="modal-component"]').should("be.visible");
  cy.get(commonSelectors.yesButton).click();
  cy.wait(1000);
  cy.notVisible(commonWidgetSelector.draggableWidget(widgetName));
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifyComponentWithOutLabel('Button', 'button1', 'myBtn', 'myApp')
 * @tjDom    drop → resize → rename → preview verify → back → delete smoke flow
 */
export const verifyComponentWithOutLabel = (
  component,
  defaultName,
  fakeName,
  appName,
  properties = []
) => {
  cy.dragAndDropWidget(component, 300, 300);
  cy.get(`[data-cy="draggable-widget-${defaultName}"]`).click({ force: true });
  verifyComponent(defaultName);

  cy.resizeWidget(defaultName, 650, 600, false);

  openEditorSidebar(defaultName);
  editAndVerifyWidgetName(fakeName, properties);

  cy.forceClickOnCanvas();
  cy.waitForAutoSave();

  cy.openInCurrentTab(commonWidgetSelector.previewButton);
  verifyComponent(fakeName);

  cy.go("back");
  resizeQueryPanel(0);
  deleteComponentAndVerify(fakeName);
};
