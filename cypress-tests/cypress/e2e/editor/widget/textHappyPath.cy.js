import { fake } from "Fixtures/fake";
import { textInputText } from "Texts/textInput";
import { commonWidgetText, widgetValue, customValidation } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import {
  verifyControlComponentAction,
  randomString,
} from "Support/utils/textInput";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  verifyComponentValueFromInspector,
  selectColourFromColourPicker,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  randomNumber,
  closeAccordions,
} from "Support/utils/commonWidget";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";

describe("Text Input", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget("Text");
  });

  it("should verify CSA", () => {
    const data = {};
    data.customText = randomString(12);

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 200);
    selectEvent("On click", "Control Component");
    selectCSA("text1", "Visibility");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Text input", 500, 50);
    selectEvent("On change", "Control Component");
    selectCSA("text1", "Set text", "500");
    addSupportCSAData("Text", "{{components.textinput1.value");

    cy.get('[data-cy="real-canvas"]').click("topLeft", { force: true });
    cy.clearAndType(
      commonWidgetSelector.draggableWidget("textinput1"),
      data.customText
    );
    cy.get(commonWidgetSelector.draggableWidget("text1")).verifyVisibleElement(
      "have.text",
      data.customText
    );

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(commonWidgetSelector.draggableWidget("textinput1")).should(
      "not.be.visible"
    );
  });
});
