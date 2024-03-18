import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { openAccordion, openEditorSidebar } from "Support/utils/commonWidget";
import { buttonText } from "Texts/button";
import { commonWidgetText } from "Texts/common";
import {
  addDefaultEventHandler,
  selectColourFromColourPicker,
  verifyAndModifyParameter,
  verifyBoxShadowCss,
  verifyLoaderColor,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  verifyTooltip,
  verifyWidgetColorCss,
} from "Support/utils/commonWidget";

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
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
};

export const addBasicData = (data) => {
  openEditorSidebar(buttonText.defaultWidgetName);
  verifyAndModifyParameter(buttonText.buttonTextLabel, data.widgetName);

  openAccordion(commonWidgetText.accordionEvents);
  addDefaultEventHandler(data.alertMessage);

  verifyPropertiesGeneralAccordion(
    buttonText.defaultWidgetName,
    data.tooltipText
  );

  openEditorSidebar(buttonText.defaultWidgetName);
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
  selectColourFromColourPicker(
    buttonText.backgroundColor,
    data.backgroundColor
  );

  cy.forceClickOnCanvas();
  openEditorSidebar(buttonText.defaultWidgetName);
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
  selectColourFromColourPicker(buttonText.textColor, data.textColor, 1);

  cy.forceClickOnCanvas();
  openEditorSidebar(buttonText.defaultWidgetName);
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
  selectColourFromColourPicker(buttonText.loaderColor, data.loaderColor, 2);

  cy.forceClickOnCanvas();
  openEditorSidebar(buttonText.defaultWidgetName);
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

  cy.get(
    commonWidgetSelector.parameterInputField(
      commonWidgetText.parameterBorderRadius
    )
  )
    .first()
    .clear()
    .type(buttonText.borderRadiusInput);

  verifyStylesGeneralAccordion(
    buttonText.defaultWidgetName,
    data.boxShadowParam,
    data.colourHex,
    data.boxShadowColor,
    4
  );

  verifyControlComponentAction(
    buttonText.defaultWidgetName,
    data.customMessage
  );

  cy.waitForAutoSave();
};

export const verifyBasicData = (widgetName, data) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).verifyVisibleElement(
    "have.text",
    data.widgetName
  );
  cy.wait(1500);
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).click({
    force: true,
  });
  cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);
  cy.get(`[data-cy="draggable-widget-textinput1"]`).should(
    "have.value",
    data.customMessage
  );

  verifyTooltip(
    commonWidgetSelector.draggableWidget(widgetName),
    data.tooltipText
  );

  verifyWidgetColorCss(widgetName, "background-color", data.backgroundColor);
  verifyWidgetColorCss(widgetName, "color", data.textColor);
  verifyLoaderColor(widgetName, data.loaderColor);

  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(
    "have.css",
    "border-radius",
    "20px"
  );

  verifyBoxShadowCss(widgetName, data.boxShadowColor, data.boxShadowParam);
};
