import { fake } from "Fixtures/fake";
import { textInputText } from "Texts/textInput";
import { commonWidgetText } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import { verifyControlComponentAction } from "Support/utils/textInput";
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
  verifyStylesGeneralAccordion
} from "Support/utils/commonWidget";

describe('Text Input', ()=>{

  beforeEach(()=>{
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget('Text Input');
  });

  it("should verify the properties of the text input widget", ()=>{
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.widgetName = fake.widgetName;
    data.customText = fake.firstName;
    data.alertMessage = fake.randomSentence;
    data.tooltipText = fake.randomSentence;

    cy.renameApp(data.appName);

    openEditorSidebar(textInputText.defaultWidgetName);
    editAndVerifyWidgetName(data.widgetName)
    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(commonWidgetText.labelDefaultValue, data.customText);
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).verifyVisibleElement("have.value", data.customText);

    verifyComponentValueFromInspector(data.widgetName, data.customText)
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear()

    data.customText = fake.randomSentence;
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter(commonWidgetText.labelPlaceHolder, data.customText);
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
    .invoke('attr', 'placeholder').
    should('contain', data.customText)

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(data.alertMessage);
    cy.get(commonWidgetSelector.eventSelection).type("On Enter Pressed{Enter}");

    cy.clearAndType(commonWidgetSelector.draggableWidget(data.widgetName), `${data.customText}{Enter}`);
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);
    cy.forceClickOnCanvas();

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear()
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionValidation);
    verifyAndModifyParameter(commonWidgetText.labelRegex, textInputText.textInputRegex);
    cy.clearAndType(commonWidgetSelector.draggableWidget(data.widgetName), data.customText);
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.validationFeedbackMessage(data.widgetName)).verifyVisibleElement("have.text", commonWidgetText.regexValidationError);
    
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
    cy.get(commonWidgetSelector.parameterInputField(commonWidgetText.labelRegex)).clearCodeMirror()
    verifyAndModifyParameter(commonWidgetText.labelMinLength, textInputText.textMinimumLength);
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.validationFeedbackMessage(data.widgetName)).verifyVisibleElement("have.text", commonWidgetText.minLengthValidationError);

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
    cy.get(commonWidgetSelector.parameterInputField(commonWidgetText.labelMinLength)).clearCodeMirror()
    verifyAndModifyParameter(commonWidgetText.labelMaxLength, textInputText.textMaximumLength);
    cy.forceClickOnCanvas();
    cy.clearAndType(commonWidgetSelector.draggableWidget(data.widgetName), data.customText);
    cy.get(commonWidgetSelector.validationFeedbackMessage(data.widgetName)).verifyVisibleElement("have.text", commonWidgetText.maxLengthValidationError);

    verifyAndModifyParameter(commonWidgetText.labelcustomValidadtion, textInputText.customValidation(data.widgetName, data.alertMessage));
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
    cy.get(commonWidgetSelector.validationFeedbackMessage(data.widgetName)).verifyVisibleElement("have.text", data.alertMessage);


    cy.get(commonWidgetSelector.accordion(commonWidgetText.accordionProperties)).click();
    cy.get(commonWidgetSelector.accordion(commonWidgetText.accordionValidation)).click()
    verifyPropertiesGeneralAccordion(data.widgetName, data.tooltipText);

    openEditorSidebar(data.widgetName);
    cy.get(commonWidgetSelector.accordion(commonWidgetText.accordionProperties)).click();
    cy.get(commonWidgetSelector.accordion(commonWidgetText.accordionValidation)).click()
    verifyLayout(data.widgetName);

    cy.get(commonWidgetSelector.changeLayoutButton).click();
    cy.get(commonWidgetSelector.parameterTogglebutton(commonWidgetText.parameterShowOnDesktop)).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      textInputText.textInputDocumentationLink
    );
    data.customText = fake.firstName;
    verifyControlComponentAction(data.widgetName, data.customText)

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);

  });
  it("should verify the styles of the text input widget", ()=>{
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    cy.renameApp(data.appName);

    openEditorSidebar(textInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelTrue);
    cy.get( commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)).should("not.be.visible");

    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();

    verifyAndModifyToggleFx(commonWidgetText.parameterDisable, commonWidgetText.codeMirrorLabelFalse);
    cy.waitForAutoSave();
    cy.get( commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)).should("have.attr", "disabled");

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();

    verifyAndModifyParameter(commonWidgetText.parameterBorderRadius, commonWidgetText.borderRadiusInput);
   
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get( commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)).should("have.css", "border-radius", "20px");

    verifyStylesGeneralAccordion(textInputText.defaultWidgetName, data.boxShadowParam, data.colourHex, data.boxShadowColor);

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it("should verify the app preview", ()=>{
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.widgetName = fake.widgetName;
    data.customText = fake.firstName;
    data.alertMessage = fake.randomSentence;
    data.tooltipText = fake.randomSentence;
    data.maxLengthErrText = fake.randomSentence;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    cy.renameApp(data.appName);

    openEditorSidebar(textInputText.defaultWidgetName);
    verifyAndModifyParameter(commonWidgetText.labelDefaultValue, data.customText);
    
    verifyAndModifyParameter(commonWidgetText.labelPlaceHolder, data.customText);
    
    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(data.alertMessage);
    cy.get(commonWidgetSelector.eventSelection).type("On Enter Pressed{Enter}");

    openAccordion(commonWidgetText.accordionValidation);
    verifyAndModifyParameter(commonWidgetText.labelRegex, textInputText.textInputRegex);
    verifyAndModifyParameter(commonWidgetText.labelMinLength, textInputText.textMinimumLength);
    verifyAndModifyParameter(commonWidgetText.labelMaxLength, textInputText.textMaximumLength);
    verifyAndModifyParameter(commonWidgetText.labelcustomValidadtion, textInputText.customValidation(textInputText.defaultWidgetName, data.alertMessage));
    verifyPropertiesGeneralAccordion(textInputText.defaultWidgetName, data.tooltipText);

    verifyControlComponentAction(textInputText.defaultWidgetName, data.customText);

    openEditorSidebar(textInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyParameter(commonWidgetText.parameterBorderRadius, commonWidgetText.borderRadiusInput);
    verifyStylesGeneralAccordion(textInputText.defaultWidgetName, data.boxShadowParam, data.colourHex, data.boxShadowColor);
   
    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)).verifyVisibleElement("have.value", data.customText);
    cy.get(commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName))
    .invoke('attr', 'placeholder').should('contain', data.customText);

    cy.clearAndType(commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName),"t");
    cy.get(commonWidgetSelector.validationFeedbackMessage(textInputText.defaultWidgetName)).verifyVisibleElement("have.text", commonWidgetText.regexValidationError);
    cy.get(commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)).clear();
    cy.get(commonWidgetSelector.validationFeedbackMessage(textInputText.defaultWidgetName)).verifyVisibleElement("have.text", commonWidgetText.minLengthValidationError);
    
    cy.clearAndType(commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName), (data.maxLengthErrText).toUpperCase().replace(/[^A-Z]/g, ''));
    cy.get(commonWidgetSelector.validationFeedbackMessage(textInputText.defaultWidgetName)).verifyVisibleElement("have.text", commonWidgetText.maxLengthValidationError);

    cy.clearAndType(commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName),"USETOOLJET{Enter}");
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);
    cy.get(commonWidgetSelector.draggableWidget(buttonText.defaultWidgetName)).should("have.text", data.customText);

    cy.get(commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName)).should("have.css", "border-radius", "20px");

    verifyBoxShadowCss(textInputText.defaultWidgetName, data.boxShadowColor, data.boxShadowParam);

    verifyTooltip(commonWidgetSelector.draggableWidget(textInputText.defaultWidgetName), data.tooltipText);
  });
});