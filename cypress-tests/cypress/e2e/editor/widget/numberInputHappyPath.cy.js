import { fake } from "Fixtures/fake";
import { commonWidgetText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { numberInputText } from "Texts/numberInput";

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
  addTextWidgetToVerifyValue,
  verifyPropertiesGeneralAccordion,
  verifyStylesGeneralAccordion,
} from "Support/utils/commonWidget";

describe('Number Input', ()=>{

  beforeEach(()=>{
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget('Number Input');
  });

  it("should verify the properties of the number input widget", ()=>{
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.widgetName = fake.widgetName;
    data.alertMessage = fake.randomSentence;
    data.tooltipText = fake.randomSentence;
    data.randomNumber = fake.randomNumber;

    cy.renameApp(data.appName);

    openEditorSidebar(numberInputText.defaultWidgetName);
    editAndVerifyWidgetName(data.widgetName)
    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(commonWidgetText.labelDefaultValue, data.randomNumber);
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).verifyVisibleElement("have.value", data.randomNumber);

    verifyComponentValueFromInspector(data.widgetName, data.randomNumber)
    cy.forceClickOnCanvas();

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(commonWidgetText.labelMinimumValue, "10");
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.clearAndType(commonWidgetSelector.draggableWidget(data.widgetName), "1")
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).verifyVisibleElement("have.value","10");


    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(commonWidgetText.labelMaximumValue, "99");
    cy.clearAndType(commonWidgetSelector.draggableWidget(data.widgetName), "100")
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).verifyVisibleElement("have.value", "99");
    
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(commonWidgetText.labelPlaceHolder, data.randomNumber);
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
    .invoke('attr', 'placeholder').should('contain', data.randomNumber);

    verifyPropertiesGeneralAccordion(data.widgetName,data.tooltipText);

    verifyLayout(data.widgetName);

    cy.get(commonWidgetSelector.changeLayoutButton).click();
    cy.get(commonWidgetSelector.parameterTogglebutton(commonWidgetText.parameterShowOnDesktop)).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      numberInputText.numberInputDocumentationLink
    );

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);

  });
  it("should verify the styles of the number input widget", ()=>{
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    cy.renameApp(data.appName);

    openEditorSidebar(numberInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelTrue);
    cy.get( commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)).should("not.be.visible");

    cy.get(commonWidgetSelector.parameterTogglebutton(commonWidgetText.parameterVisibility)).click();

    verifyAndModifyToggleFx(commonWidgetText.parameterDisable, commonWidgetText.codeMirrorLabelFalse);
    cy.waitForAutoSave();
    cy.get( commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)).should("have.attr", "disabled");

    cy.get(commonWidgetSelector.parameterTogglebutton(commonWidgetText.parameterDisable)).click();

    verifyAndModifyParameter(commonWidgetText.parameterBorderRadius, commonWidgetText.borderRadiusInput);
   
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get( commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)).should("have.css", "border-radius", "20px");

    verifyStylesGeneralAccordion(numberInputText.defaultWidgetName, data.boxShadowParam, data.colourHex, data.boxShadowColor);

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it("should verify the app preview", ()=>{
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.tooltipText = fake.randomSentence;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.randomNumber = fake.randomNumber;

    cy.renameApp(data.appName);

    openEditorSidebar(numberInputText.defaultWidgetName);
    verifyAndModifyParameter(commonWidgetText.labelDefaultValue, data.randomNumber);
    verifyAndModifyParameter(commonWidgetText.labelMinimumValue, "10");
    verifyAndModifyParameter(commonWidgetText.labelMaximumValue, "99");
    verifyAndModifyParameter(commonWidgetText.labelPlaceHolder, data.randomNumber);

    verifyPropertiesGeneralAccordion(numberInputText.defaultWidgetName, data.tooltipText);

    openEditorSidebar(numberInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    verifyAndModifyParameter(commonWidgetText.parameterBorderRadius, commonWidgetText.borderRadiusInput);
    verifyStylesGeneralAccordion(numberInputText.defaultWidgetName, data.boxShadowParam, data.colourHex, data.boxShadowColor);

    addTextWidgetToVerifyValue("components.numberinput1.value")
   
    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)).verifyVisibleElement("have.value", data.randomNumber);
   
    cy.clearAndType(commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName), "1")
    cy.get(commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)).verifyVisibleElement("have.value","10");
    cy.clearAndType(commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName), "100")
    cy.get(commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)).verifyVisibleElement("have.value", "99");
    cy.get(commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName))
    .invoke('attr', 'placeholder').should('contain', data.randomNumber);
    
    cy.get(commonWidgetSelector.draggableWidget(commonWidgetText.text1)).verifyVisibleElement("have.text", "99");

    cy.get( commonWidgetSelector.draggableWidget(numberInputText.defaultWidgetName)).should("have.css", "border-radius", "20px");
    verifyBoxShadowCss(numberInputText.defaultWidgetName,data.boxShadowColor,data.boxShadowParam);

    cy.get(commonSelectors.viewerPageLogo).click();
    cy.deleteApp(data.appName);
  });
});