import { fake } from "Fixtures/fake";
import { commonWidgetText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { numberInputText } from "Texts/numberInput";

import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  verifyComponentValueFromInspector,
  verifyBoxShadowCss,
  verifyLayout,
  verifyTooltip,
  editAndVerifyWidgetName,
  addTextWidgetToVerifyValue,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
  randomNumber,
  fillBoxShadowParams,
  selectColourFromColourPicker,
} from "Support/utils/commonWidget";

describe("Number Input", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget("Number Input");
  });

  it("should verify the properties of the number input widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.widgetName = fake.widgetName;
    data.tooltipText = fake.randomSentence;
    data.randomNumber = randomNumber(10, 99);
    data.minimumvalue = randomNumber(5, 10);
    data.maximumValue = randomNumber(90, 99);

    cy.renameApp(data.appName);

    openEditorSidebar(numberInputText.defaultWidgetName);
    editAndVerifyWidgetName(data.widgetName);
    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", "99");

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties, [
      "Events",
      "Properties",
      "Layout",
    ]);
    verifyAndModifyParameter(
      commonWidgetText.labelDefaultValue,
      data.randomNumber
    );
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", data.randomNumber);

    verifyComponentValueFromInspector(data.widgetName, data.randomNumber);
    cy.forceClickOnCanvas();

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties, [
      "Events",
      "Properties",
      "Layout",
    ]);
    verifyAndModifyParameter(
      commonWidgetText.labelMinimumValue,
      data.minimumvalue
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.clearAndType(
      commonWidgetSelector.draggableWidget(data.widgetName),
      randomNumber(1, 4)
    );
    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", data.minimumvalue);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties, [
      "Events",
      "Properties",
      "Layout",
    ]);
    verifyAndModifyParameter(
      commonWidgetText.labelMaximumValue,
      data.maximumValue
    );
    cy.clearAndType(
      commonWidgetSelector.draggableWidget(data.widgetName),
      randomNumber(100, 110)
    );
    cy.get(
      commonWidgetSelector.draggableWidget(data.widgetName)
    ).verifyVisibleElement("have.value", data.maximumValue);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties, [
      "Events",
      "Properties",
      "Layout",
    ]);
    verifyAndModifyParameter(
      commonWidgetText.labelPlaceHolder,
      data.randomNumber
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
      .invoke("attr", "placeholder")
      .should("contain", data.randomNumber);

    verifyPropertiesGeneralAccordion(data.widgetName, data.tooltipText);

    // verifyLayout(data.widgetName);

    // cy.get(commonWidgetSelector.changeLayoutButton).click();
    // cy.get(
    //   commonWidgetSelector.parameterTogglebutton(
    //     commonWidgetText.parameterShowOnDesktop
    //   )
    // ).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      numberInputText.numberInputDocumentationLink
    );

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });
  it("should verify the styles of the number input widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    cy.renameApp(data.appName);

    openEditorSidebar(numberInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).should("not.be.visible");

    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterVisibility
      )
    ).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.waitForAutoSave();
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).should("have.attr", "disabled");

    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterDisable
      )
    ).click();

    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    verifyStylesGeneralAccordion(
      numberInputText.defaultWidgetName,
      data.boxShadowParam,
      data.colourHex,
      data.boxShadowColor,
      3
    );

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it("should verify the app preview", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.tooltipText = fake.randomSentence;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.randomNumber = randomNumber(10, 99);
    data.minimumvalue = randomNumber(5, 10);
    data.maximumValue = randomNumber(90, 99);

    cy.renameApp(data.appName);

    openEditorSidebar(numberInputText.defaultWidgetName);
    verifyAndModifyParameter(
      commonWidgetText.labelDefaultValue,
      data.randomNumber
    );
    verifyAndModifyParameter(
      commonWidgetText.labelMinimumValue,
      data.minimumvalue
    );
    verifyAndModifyParameter(
      commonWidgetText.labelMaximumValue,
      data.maximumValue
    );
    verifyAndModifyParameter(
      commonWidgetText.labelPlaceHolder,
      data.randomNumber
    );

    verifyPropertiesGeneralAccordion(
      numberInputText.defaultWidgetName,
      data.tooltipText
    );

    openEditorSidebar(numberInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );
    cy.forceClickOnCanvas();

    openEditorSidebar(numberInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion(commonWidgetText.accordionGenaral, []);
    cy.get(commonWidgetSelector.boxShadowColorPicker).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );
    selectColourFromColourPicker(
      commonWidgetText.boxShadowColor,
      data.boxShadowColor,
      3
    );
    addTextWidgetToVerifyValue("components.numberinput1.value");

    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).verifyVisibleElement("have.value", data.randomNumber);

    cy.clearAndType(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName),
      randomNumber(1, 4)
    );
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).verifyVisibleElement("have.value", data.minimumvalue);
    cy.clearAndType(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName),
      randomNumber(100, 110)
    );
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).verifyVisibleElement("have.value", data.maximumValue);
    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    )
      .invoke("attr", "placeholder")
      .should("contain", data.randomNumber);

    verifyTooltip(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName),
      data.tooltipText
    );
    cy.get(
      commonWidgetSelector.draggableWidget(commonWidgetText.text1)
    ).verifyVisibleElement("have.text", data.maximumValue);

    cy.get(
      commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");
    verifyBoxShadowCss(
      numberInputText.defaultWidgetName,
      data.boxShadowColor,
      data.boxShadowParam
    );

    cy.get(commonSelectors.viewerPageLogo).click();
    cy.deleteApp(data.appName);
  });
});
