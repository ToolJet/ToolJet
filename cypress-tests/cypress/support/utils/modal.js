import { commonWidgetSelector } from "Selectors/common";
import {
  verifyAndModifyStylePickerFx,
  selectColourFromColourPicker,
  verifyWidgetColorCss,
} from "Support/utils/commonWidget";

export const launchModal = (componentName) => {
  cy.get(launchButton(componentName)).click();
};

export const launchButton = (componentName) => {
  return `[data-cy="draggable-widget-${componentName
    .toLowerCase()
    .replace(" ", "-")}-launch-button"]`;
};

export const verifySize = (size) => {
  const className = {
    Small: "sm",
    Medium: "lg",
    Large: "xl",
  };
  cy.get('[data-cy="dropdown-modal-size"]')
    .click()
    .find("input")
    .type(`{selectAll}{backspace}${size}{enter}`);
  cy.get(
    `[class="modal-dialog modal-${className[size]} modal-dialog-scrollable"]`
  ).should("exist");
};

export const closeModal = (componentName) => {
  cy.get('[data-cy="modal-close-button"]').realClick();
};

export const addAndVerifyColor = (
  section,
  defaultColor,
  color,
  dataCy,
  type = "background-color"
) => {
  verifyAndModifyStylePickerFx(section, defaultColor, "data.colourHex");
  cy.get(commonWidgetSelector.parameterFxButton(section)).click();

  selectColourFromColourPicker(section, color);
  verifyWidgetColorCss(dataCy, type, color, true);
  cy.get(dataCy).realClick();
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
};

export const typeOnFx = (fx, data) => {
  cy.get(commonWidgetSelector.parameterFxButton(fx)).eq(1).realClick();
  cy.get(commonWidgetSelector.parameterInputField(fx)).clearAndTypeOnCodeMirror(
    data
  );
};
