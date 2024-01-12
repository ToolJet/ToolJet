import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  editAndVerifyWidgetName,
} from "Support/utils/commonWidget";
import { resizeQueryPanel } from "Support/utils/dataSource";

export const verifyComponent = (widgetName) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName), {
    timeout: 10000,
  }).should("be.visible");
};

export const deleteComponentAndVerify = (widgetName) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .realHover()
    .realHover();

  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .realHover()
    .then(() => {
      cy.get(`[data-cy="${widgetName}-delete-button"]`)
        .realHover({ position: "topRight" })
        .last()
        .realClick();
    });
  cy.verifyToastMessage(
    `[class=go3958317564]`,
    "Component deleted! (ctrl + Z to undo)"
  );
  cy.notVisible(commonWidgetSelector.draggableWidget(widgetName));
};

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
