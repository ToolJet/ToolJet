import { buttonText } from "Texts/button";
import { commonWidgetSelector } from "Selectors/common";

export const verifyButtonBoxShadowCss = (color, shadowParam) => {
  cy.forceClickOnCanvas();
  cy.get(commonWidgetSelector.buttonWidget)
    .parent()
    .should(
      "have.css",
      "box-shadow",
      `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] / 100}) ${
        shadowParam[0]
      }px ${shadowParam[1]}px ${shadowParam[2]}px ${shadowParam[3]}px`
    );
};

export const openButtonStylesEditorSideBar = () => {
  cy.get(commonWidgetSelector.draggableWidget(buttonText.widgetName)).click();
  cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
};
