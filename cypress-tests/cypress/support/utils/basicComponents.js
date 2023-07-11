import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  editAndVerifyWidgetName,
} from "Support/utils/commonWidget";

export const verifyComponent = (widgetName) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should("be.visible");
};

export const deleteComponentAndVerify = (widgetName) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).click().realHover();

  cy.get(commonWidgetSelector.draggableWidget(widgetName)).realHover();

  cy.get(`[data-cy="${widgetName}-delete-button"]`).last().realClick();
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
  cy.dragAndDropWidget(component, 50, 50);
  cy.get(`[data-cy="draggable-widget-${defaultName}"]`).click({ force: true });
  verifyComponent(defaultName);

  cy.resizeWidget(defaultName, 650, 400);

  openEditorSidebar(defaultName);
  editAndVerifyWidgetName(fakeName, properties);

  cy.forceClickOnCanvas();
  cy.waitForAutoSave();

  cy.openInCurrentTab(commonWidgetSelector.previewButton);
  verifyComponent(fakeName);

  cy.go("back");
  deleteComponentAndVerify(fakeName);
  cy.get(commonSelectors.editorPageLogo).click();

  cy.deleteApp(appName);
};
