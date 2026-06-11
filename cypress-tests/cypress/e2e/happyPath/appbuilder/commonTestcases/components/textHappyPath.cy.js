import { fake } from "Fixtures/fake";
import {
  verifyNodeData,
  openNode,
  verifyValue,
  deleteComponentFromInspector,
  verifyfunctions,
} from "Support/utils/inspector";
import { commonWidgetSelector } from "Selectors/common";
import {
  editAndVerifyWidgetName,
  selectFromSidebarDropdown,
  addValueOnInput,
  selectColourFromColourPicker,
  verifyStylesGeneralAccordion,
} from "Support/utils/commonWidget";
import {
  addSupportCSAData,
  selectCSA,
  selectEvent,
} from "Support/utils/events";
import { randomString } from "Support/utils/editor/textInput";
import { buttonText } from "Texts/button";

describe("Text Input", () => {
  const data = {};
  beforeEach(() => {
    cy.viewport(1200, 1200);
    data.appName = `${fake.companyName}-text-App`;
    cy.apiLogin();
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.dragAndDropWidget("Text");
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("should verify properties of text component", () => {
    data.componentName = fake.widgetName;
    cy.get(commonWidgetSelector.draggableWidget("text1")).should("be.visible");

    editAndVerifyWidgetName(data.componentName, [
      "Data",
      "Events",
      "Additional Actions",
      "Devices",
    ]);
    cy.get(
      '[data-cy="textcomponenttextinput-input-field"]'
    ).clearAndTypeOnCodeMirror("Cypress testing text component");
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.draggableWidget(data.componentName)
    ).verifyVisibleElement("have.text", "Cypress testing text component");
  });

  it("should verify styles of text component", () => {
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    selectFromSidebarDropdown("Weight", "bolder");
    selectFromSidebarDropdown("Font variant", "initial");
    addValueOnInput("Size", 25);
    addValueOnInput("Line Height", 3);
    addValueOnInput("Text Indent", 2);
    addValueOnInput("Letter Spacing", 2);
    addValueOnInput("Word Spacing", 2);
    addValueOnInput("Border radius", 2);

    data.textColor = fake.randomRgba;
    data.backgroundColor = fake.randomRgba;
    data.borderColor = fake.randomRgba;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    selectColourFromColourPicker("color", data.textColor);
    selectColourFromColourPicker("background", data.backgroundColor);
    selectColourFromColourPicker("border", data.borderColor);

    data.colourHex = fake.randomRgbaHex;
    verifyStylesGeneralAccordion(
      "text1",
      data.boxShadowParam,
      data.colourHex,
      data.boxShadowColor,
      4,
      "#00000090"
    );
  });

  it("should verify preview of text component", () => {});

  it.only("should verify CSA", () => {
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
  it.only("should verify expossed values", () => {
    cy.get(commonWidgetSelector.sidebarinspector).click();
    verifyNodeData("components", "Object", "1 entry ");
    openNode("components");
    openNode("text1");

    verifyValue("text", "String", `"Hello The👋"`);
    verifyValue("isVisible", "Boolean", "true");
    verifyValue("isLoading", "Boolean", "false");
    verifyValue("isDisabled", "Boolean", "false");

    verifyfunctions("clear", "Function");
    verifyfunctions("setText", "Function");
    verifyfunctions("visibility", "Function");
    verifyfunctions("setDisable", "Function");
    verifyfunctions("setVisibility", "Function");
    verifyfunctions("setLoading", "Function");
  });
});
