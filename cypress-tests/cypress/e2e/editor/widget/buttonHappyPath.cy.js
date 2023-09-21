import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import { fake } from "Fixtures/fake";
import { commonWidgetText } from "Texts/common";

import { verifyControlComponentAction } from "Support/utils/button";

import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  verifyComponentFromInspector,
  verifyAndModifyStylePickerFx,
  verifyWidgetColorCss,
  selectColourFromColourPicker,
  verifyLoaderColor,
  fillBoxShadowParams,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
} from "Support/utils/commonWidget";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";

describe("Editor- Test Button widget", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp();
    cy.openApp();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 500);
  });

  it("should verify position of component after dragging", () => {
    const data = {};
    data.widgetName = buttonText.defaultWidgetName;

    cy.getPosition(data.widgetName).then((position) => {
      const [clientX, clientY] = position;
      expect(clientX).not.to.be.closeTo(100, 10);
      expect(clientY).not.to.be.closeTo(100, 10);
    });

    cy.moveComponent(data.widgetName, 100, 100);
    cy.waitForAutoSave();
    cy.getPosition(data.widgetName).then((position) => {
      const [clientX, clientY] = position;
      expect(clientX).to.be.closeTo(100, 20);
      expect(clientY).to.be.closeTo(100, 10);
    });
    cy.reload();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "be.visible"
    );
    cy.getPosition(data.widgetName).then((position) => {
      const [clientX, clientY] = position;
      expect(clientX).to.be.closeTo(100, 20);
      expect(clientY).to.be.closeTo(100, 10);
    });

    cy.moveComponent(data.widgetName, 750, 750);
    cy.getPosition(data.widgetName).then((position) => {
      const [clientX, clientY] = position;
      expect(clientX).to.be.closeTo(750, 20);
      expect(clientY).to.be.closeTo(750, 10);
    });

    cy.apiDeleteApp(data.appName);
  });
  it("should verify the properties of the button widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.customMessage = fake.randomSentence;
    data.tooltipText = fake.randomSentence;

    cy.renameApp(data.appName);

    openEditorSidebar(buttonText.defaultWidgetName);
    editAndVerifyWidgetName(data.widgetName);

    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(buttonText.buttonTextLabel, data.widgetName);
    verifyComponentFromInspector(data.widgetName);

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "have.class",
      "btn-loading"
    );

    cy.get(
      commonWidgetSelector.parameterTogglebutton(buttonText.loadingState)
    ).click();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "not.have.class",
      "btn-loading"
    );

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(data.alertMessage);
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    verifyPropertiesGeneralAccordion(data.widgetName, data.tooltipText);

    verifyLayout(data.widgetName);

    cy.get(commonWidgetSelector.changeLayoutToDesktopButton).click();
    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterShowOnDesktop
      )
    ).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      buttonText.buttonDocumentationLink
    );

    verifyControlComponentAction(data.widgetName, data.customMessage);
    cy.apiDeleteApp(data.appName);
  });

  it("should verify the styles of the button component", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.backgroundColor = fake.randomRgba;
    data.textColor = fake.randomRgba;
    data.loaderColor = fake.randomRgba;
    data.boxShadowColor = fake.randomRgba;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowParam = fake.boxShadowParam;

    cy.renameApp(data.appName);

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyStylePickerFx(
      buttonText.backgroundColor,
      buttonText.defaultBackgroundColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.backgroundColor)
    ).click();

    selectColourFromColourPicker(
      buttonText.backgroundColor,
      data.backgroundColor
    );

    verifyWidgetColorCss(
      buttonText.defaultWidgetName,
      "background-color",
      data.backgroundColor
    );

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    data.colourHex = fake.randomRgbaHex;
    verifyAndModifyStylePickerFx(
      buttonText.textColor,
      buttonText.defaultTextColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.textColor)
    ).click();

    selectColourFromColourPicker(buttonText.textColor, data.textColor, 1);

    verifyWidgetColorCss(buttonText.defaultWidgetName, "color", data.textColor);

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    data.colourHex = fake.randomRgbaHex;
    verifyAndModifyStylePickerFx(
      buttonText.loaderColor,
      buttonText.defaultLoaderColor,
      data.colourHex
    );

    cy.get(
      commonWidgetSelector.parameterFxButton(buttonText.loaderColor)
    ).click();

    selectColourFromColourPicker(buttonText.loaderColor, data.loaderColor, 2);

    verifyLoaderColor(buttonText.defaultWidgetName, data.loaderColor);

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("not.be.visible");
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.waitForAutoSave();
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("have.attr", "disabled");

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();

    cy.get(
      commonWidgetSelector.parameterFxButton(
        commonWidgetText.parameterBorderRadius
      )
    )
      .last()
      .click();

    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      buttonText.borderRadiusInput
    );

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    openEditorSidebar(buttonText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    data.colourHex = fake.randomRgbaHex;
    verifyStylesGeneralAccordion(
      buttonText.defaultWidgetName,
      data.boxShadowParam,
      data.colourHex,
      data.boxShadowColor,
      4
    );
    cy.apiDeleteApp(data.appName);
  });

  it("should verify the app preview", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.customMessage = fake.randomSentence;
    data.backgroundColor = fake.randomRgba;
    data.textColor = fake.randomRgba;
    data.loaderColor = fake.randomRgba;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.tooltipText = fake.randomSentence;

    cy.renameApp(data.appName);

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
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(4000);

    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).verifyVisibleElement("have.text", data.widgetName);

    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).click();
    cy.wait(500);

    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);
    cy.get(commonWidgetSelector.draggableWidget("textinput1")).should(
      "have.value",
      data.customMessage
    );

    verifyTooltip(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName),
      data.tooltipText
    );

    verifyWidgetColorCss(
      buttonText.defaultWidgetName,
      "background-color",
      data.backgroundColor
    );
    verifyWidgetColorCss(buttonText.defaultWidgetName, "color", data.textColor);
    verifyLoaderColor(buttonText.defaultWidgetName, data.loaderColor);

    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    verifyBoxShadowCss(
      buttonText.defaultWidgetName,
      data.boxShadowColor,
      data.boxShadowParam
    );

    cy.apiDeleteApp(data.appName);
  });

  it("Should verify csa", () => {
    // cy.dragAndDropWidget(buttonText.defaultWidgetText);
    selectEvent("On click", "Show alert");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Text input", 500, 50);
    selectEvent("On change", "Control Component");
    selectCSA("button1", "Set text", "500");
    addSupportCSAData("Text", "{{components.textinput1.value");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 100);
    selectEvent("On click", "Control Component");
    selectCSA("button1", "Click");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 150);
    selectEvent("On click", "Control Component");
    selectCSA("button1", "Disable");
    cy.get('[data-cy="Value-toggle-button"]').click();

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 200);
    selectEvent("On click", "Control Component");
    selectCSA("button1", "Visibility");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 250);
    selectEvent("On click", "Control Component");
    selectCSA("button1", "Loading");
    cy.get('[data-cy="Value-toggle-button"]').click();

    cy.get(commonWidgetSelector.draggableWidget("textinput1")).type("testBtn");
    cy.wait(500);
    cy.get(commonWidgetSelector.draggableWidget("button1")).should(
      "have.text",
      "testBtn"
    );

    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");

    cy.get(commonWidgetSelector.draggableWidget("button5")).click();
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("have.class", "btn-loading");

    cy.get(commonWidgetSelector.draggableWidget("button3")).click();
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("have.attr", "disabled");

    cy.get(commonWidgetSelector.draggableWidget("button4")).click();
    cy.get(
      commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)
    ).should("not.be.visible");
    cy.apiDeleteApp();
  });
});
