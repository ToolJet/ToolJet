import { fake } from "Fixtures/fake";
import { commonWidgetText, customValidation } from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
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
  closeAccordions,
} from "Support/utils/commonWidget";
import { passwordInputText } from "Texts/passwordInput";
import { randomString } from "Support/utils/textInput";

describe("Password Input", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp();
    cy.openApp();
    cy.modifyCanvasSize(1200, 780);
    cy.dragAndDropWidget("Password Input", 350, 300);
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("should verify the properties of the password input widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.widgetName = fake.widgetName;
    data.customText = fake.firstName;
    data.tooltipText = fake.randomSentence;
    data.minimumLength = randomNumber(1, 4);
    data.maximumLength = randomNumber(8, 10);
    data.customText = randomString(12);

    openEditorSidebar(passwordInputText.defaultWidgetName);
    closeAccordions(["Events", "Validation", "Properties", "Layout"]);
    editAndVerifyWidgetName(data.widgetName);
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
      .invoke("attr", "placeholder")
      .should("contain", "password");

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionProperties, [
      "Events",
      "Validation",
      "Properties",
      "Layout",
    ]);

    verifyAndModifyParameter("Placeholder", data.customText);
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName))
      .invoke("attr", "placeholder")
      .should("contain", data.customText);

    cy.clearAndType(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customText
    );
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "have.value",
      data.customText
    );
    verifyComponentValueFromInspector(data.widgetName, data.customText);
    cy.forceClickOnCanvas();

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionValidation);
    verifyAndModifyParameter(
      commonWidgetText.labelRegex,
      commonWidgetText.regularExpression
    );
    cy.clearAndType(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customText
    );
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.widgetName)
    ).verifyVisibleElement("have.text", commonWidgetText.regexValidationError);

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionValidation);
    cy.get(
      commonWidgetSelector.parameterInputField(commonWidgetText.labelRegex)
    ).clearCodeMirror();
    verifyAndModifyParameter(
      commonWidgetText.labelMinLength,
      data.minimumLength
    );
    cy.forceClickOnCanvas();
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.widgetName)
    ).verifyVisibleElement(
      "have.text",
      commonWidgetText.minLengthValidationError(data.minimumLength)
    );

    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
    cy.get(
      commonWidgetSelector.parameterInputField(commonWidgetText.labelMinLength)
    ).clearCodeMirror();

    verifyAndModifyParameter(
      commonWidgetText.labelMaxLength,
      data.maximumLength
    );
    cy.forceClickOnCanvas();
    cy.clearAndType(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customText
    );
    cy.get('[data-cy="real-canvas"]').click("topLeft", { force: true });
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.widgetName)
    ).verifyVisibleElement(
      "have.text",
      commonWidgetText.maxLengthValidationError(data.maximumLength)
    );
    openEditorSidebar(data.widgetName);

    verifyAndModifyParameter(
      commonWidgetText.labelcustomValidadtion,
      customValidation(data.widgetName, data.customText)
    );
    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).clear();
    cy.get('[data-cy="real-canvas"]').click("topLeft", { force: true });
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.widgetName)
    ).verifyVisibleElement("have.text", data.customText);
    openEditorSidebar(data.widgetName);

    cy.get(
      commonWidgetSelector.accordion(commonWidgetText.accordionProperties)
    ).click();
    cy.get(
      commonWidgetSelector.accordion(commonWidgetText.accordionValidation)
    ).click();
    verifyPropertiesGeneralAccordion(data.widgetName, data.tooltipText);

    openEditorSidebar(data.widgetName);
    cy.get(
      commonWidgetSelector.accordion(commonWidgetText.accordionProperties)
    ).click();
    cy.get(
      commonWidgetSelector.accordion(commonWidgetText.accordionValidation)
    ).click();
    // verifyLayout(data.widgetName);

    // cy.get(commonWidgetSelector.changeLayoutButton).click();
    // cy.get(
    //   commonWidgetSelector.parameterTogglebutton(
    //     commonWidgetText.parameterShowOnDesktop
    //   )
    // ).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      "Read documentation for PasswordInput"
    );
  });
  it("should verify the styles of the password input widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    openEditorSidebar(passwordInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName)
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
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName)
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
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    verifyStylesGeneralAccordion(
      passwordInputText.defaultWidgetName,
      data.boxShadowParam,
      data.colourHex,
      data.boxShadowColor,
      1
    );
  });

  it("should verify the app preview", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.widgetName = fake.widgetName;
    data.tooltipText = fake.randomSentence;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.minimumLength = randomNumber(1, 4);
    data.maximumLength = randomNumber(8, 10);
    data.customText = randomString(12);
    data.maxLengthText = randomString(data.maximumLength);

    openEditorSidebar(passwordInputText.defaultWidgetName);
    verifyAndModifyParameter("Placeholder", data.customText);

    openAccordion(commonWidgetText.accordionValidation);
    verifyAndModifyParameter(
      commonWidgetText.labelRegex,
      commonWidgetText.regularExpression
    );
    verifyAndModifyParameter(
      commonWidgetText.labelMinLength,
      data.minimumLength
    );
    verifyAndModifyParameter(
      commonWidgetText.labelMaxLength,
      data.maximumLength
    );
    verifyAndModifyParameter(
      commonWidgetText.labelcustomValidadtion,
      customValidation(passwordInputText.defaultWidgetName, data.customText)
    );
    verifyPropertiesGeneralAccordion(
      passwordInputText.defaultWidgetName,
      data.tooltipText
    );

    openEditorSidebar(passwordInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );

    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterVisibility
      )
    )
      .click()
      .click();

    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    cy.waitForAutoSave();
    cy.reload();

    openEditorSidebar(passwordInputText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion(commonWidgetText.accordionGenaral, [], 1);
    cy.get(commonWidgetSelector.boxShadowColorPicker).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );
    selectColourFromColourPicker(
      commonWidgetText.boxShadowColor,
      data.boxShadowColor,
      1
    );
    addTextWidgetToVerifyValue("components.passwordinput1.value");
    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName)
    )
      .invoke("attr", "placeholder")
      .should("contain", data.customText);

    cy.get('[data-cy="real-canvas"]').click("topLeft", { force: true });
    cy.get(
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName)
    )
      .type(" ")
      .type("{selectAll}{backspace}");
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(
        passwordInputText.defaultWidgetName
      )
    ).verifyVisibleElement(
      "have.text",
      commonWidgetText.minLengthValidationError(data.minimumLength)
    );
    cy.clearAndType(
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName),
      "t"
    );
    cy.get(
      commonWidgetSelector.draggableWidget(commonWidgetText.text1)
    ).verifyVisibleElement("have.text", "t");
    cy.forceClickOnCanvas();
    cy.get('[data-cy="real-canvas"]').click("topLeft", { force: true });
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(
        passwordInputText.defaultWidgetName
      )
    ).verifyVisibleElement("have.text", commonWidgetText.regexValidationError);

    cy.clearAndType(
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName),
      data.customText.toUpperCase()
    );
    cy.get('[data-cy="real-canvas"]').click("topLeft", { force: true });

    // cy.get(
    //   commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName)
    // )
    //   .type("1")
    //   .type("{selectAll}{backspace}");

    cy.get(
      commonWidgetSelector.validationFeedbackMessage(
        passwordInputText.defaultWidgetName
      )
    ).verifyVisibleElement(
      "have.text",
      commonWidgetText.maxLengthValidationError(data.maximumLength)
    );

    cy.clearAndType(
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName),
      data.maxLengthText.toUpperCase()
    );

    cy.get(
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    verifyBoxShadowCss(
      passwordInputText.defaultWidgetName,
      data.boxShadowColor,
      data.boxShadowParam
    );

    verifyTooltip(
      commonWidgetSelector.draggableWidget(passwordInputText.defaultWidgetName),
      data.tooltipText
    );
  });
});
