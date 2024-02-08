import { multiselectSelector } from "Selectors/multiselect";
import { multiselectText } from "Texts/multiselect";
import {
  commonText,
  commonWidgetText,
  codeMirrorInputLabel,
} from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";

import {
  verifyMultiselectHeader,
  selectFromMultiSelect,
  verifyMultiselectStatus,
  verifyMultiselectOptions,
} from "Support/utils/multiselectWidget";
import {
  selectFromDropDown,
  clearSelection,
  verifySelectedOptionOnDropdown,
  verifyOptionOnSidePanel,
  deleteOption,
  updateOptionLabelAndValue,
  verifyOptionOnDropdown,
  verifyOptionMenuElements,
  addNewOption,
} from "Support/utils/dropdown";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  editAndVerifyWidgetName,
  verifyMultipleComponentValuesFromInspector,
  selectColourFromColourPicker,
  fillBoxShadowParams,
  verifyBoxShadowCss,
  verifyAndModifyStylePickerFx,
  addTextWidgetToVerifyValue,
  verifyTooltip,
  verifyWidgetText,
} from "Support/utils/commonWidget";

import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
  changeEventType,
} from "Support/utils/events";

describe("Dropdown component", () => {
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-dropdown-App`);
    cy.openApp();
    cy.dragAndDropWidget("Dropdown", 500, 300);
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it.only("should verify the properties of the component", () => {
    const data = {};
    data.componentName = fake.widgetName;
    data.label = fake.widgetName;
    data.placeholder = fake.widgetName;
    data.customMessage = fake.randomSentence;
    data.alertMessage = fake.randomSentence;
    data.randomLabels = multiselectSelector.textArrayOfLength(3);

    openEditorSidebar("dropdown1");
    verifySelectedOptionOnDropdown("dropdown1", "Option 2");
    editAndVerifyWidgetName(data.componentName, [
      "Data",
      "Validation",
      "Additional Actions",
      "Devices",
      "Events",
    ]);

    openAccordion("Data", [
      "Data",
      "Validation",
      "Additional Actions",
      "Devices",
      "Events",
    ]);
    verifyAndModifyParameter(commonWidgetText.parameterLabel, data.label);
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(
      `[data-cy=dropdown-label-${data.componentName.toLowerCase()}]`
    ).should("have.text", data.label);

    openEditorSidebar(data.componentName);
    verifyAndModifyParameter("Placeholder", data.placeholder);
    cy.forceClickOnCanvas();
    clearSelection(data.componentName);
    verifySelectedOptionOnDropdown(data.componentName, data.placeholder);
    selectFromDropDown(data.componentName, "Option 3");
    verifySelectedOptionOnDropdown(data.componentName, "Option 3");
    //events
    cy.intercept("PUT", "events").as("events");
    cy.get(commonWidgetSelector.noEventHandlerMessage).should(
      "have.text",
      multiselectText.noEventsMessage
    );
    addDefaultEventHandler(data.alertMessage);
    cy.forceClickOnCanvas();
    cy.wait("@events");
    selectFromDropDown(data.componentName, "Option 2");
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);
    changeEventType("On focus");
    cy.forceClickOnCanvas();
    cy.wait("@events");
    cy.get(
      `[data-cy="dropdown-input-${data.componentName.toLowerCase()}"]`
    ).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    changeEventType("On blur");
    cy.forceClickOnCanvas();
    cy.wait("@events");
    cy.get(
      `[data-cy="dropdown-input-${data.componentName.toLowerCase()}"]`
    ).click();
    cy.forceClickOnCanvas();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    openEditorSidebar(data.componentName);
    changeEventType("On search text changed");
    cy.get('[data-cy="-input-field"]').eq(4).clearAndTypeOnCodeMirror(`500`);
    cy.forceClickOnCanvas();
    cy.wait("@events");
    cy.get(
      `[data-cy="dropdown-input-${data.componentName.toLowerCase()}"]`
    ).click();
    cy.get(".table-select-column-type-search-box").type("QA Tooljet");
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    //validations
    verifyAndModifyToggleFx("Make this field mandatory", false);
    cy.get(
      `[data-cy="dropdown-input-${data.componentName.toLowerCase()}"]>>>>:eq(1)`
    ).click();
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.componentName)
    ).verifyVisibleElement("have.text", "Field cannot be empty");

    verifyAndModifyParameter(
      //{{components.Kacie.value}}
      "Custom validation",
      `{{components.${data.componentName}.value===3?true:"Red feedback"`
    );
    selectFromDropDown(data.componentName, "Option 2");
    cy.get(
      commonWidgetSelector.validationFeedbackMessage(data.componentName)
    ).verifyVisibleElement("have.text", "Red feedback");

    // cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    // verifyMultiselectHeader(
    //   data.componentName,
    //   multiselectText.labelAllItemsSelected
    // );
    // verifyMultipleComponentValuesFromInspector(data.componentName, [1, 2, 3]);

    // openEditorSidebar(data.componentName);
    // verifyAndModifyParameter(
    //   commonWidgetText.labelDefaultValue,
    //   codeMirrorInputLabel("[1,2]")
    // );
    // verifyMultipleComponentValuesFromInspector(data.componentName, [1, 2]);

    // verifyMultiselectHeader(data.componentName, "one, two");
    // verifyMultiselectStatus(data.componentName);
    // verifyMultiselectOptions(data.componentName);

    // selectFromMultiSelect(data.componentName, ["", "", "true"]);
    // verifyMultiselectStatus(data.componentName, ["", "", ""]);
    // verifyMultiselectHeader(
    //   data.componentName,
    //   multiselectText.labelAllItemsSelected
    // );

    // verifyMultipleComponentValuesFromInspector(data.componentName, [1, 2, 3]);

    // openEditorSidebar(data.componentName);
    // verifyAndModifyParameter(
    //   commonWidgetText.parameterOptionvalues,
    //   codeMirrorInputLabel(`[${data.randomLabels}]`)
    // );
    // selectFromMultiSelect(data.componentName, ["true", "true", "true"]);

    // verifyMultipleComponentValuesFromInspector(
    //   data.componentName,
    //   data.randomLabels
    // );

    // openEditorSidebar(data.componentName);
    // data.randomLabels = multiselectSelector.textArrayOfLength(3);
    // verifyAndModifyParameter(
    //   commonWidgetText.parameterOptionLabels,
    //   codeMirrorInputLabel(`[${data.randomLabels}]`)
    // );
    // verifyMultiselectOptions(data.componentName, data.randomLabels);

    // openEditorSidebar(data.componentName);
    // verifyAndModifyToggleFx(multiselectText.enableSelectAllOptions);

    // cy.get(commonWidgetSelector.draggableWidget(data.componentName))
    //   .find(multiselectSelector.multiselectHeader)
    //   .click();
    // cy.get(multiselectSelector.dropdownAllItems)
    //   .first()
    //   .should("have.text", multiselectText.dropdwonOptionSelectAll)
    //   .realClick();

    // verifyMultiselectHeader(
    //   data.componentName,
    //   multiselectText.labelAllItemsSelected
    // );

    // openEditorSidebar(data.componentName);
    // openAccordion(commonWidgetText.accordionEvents, [
    //   "Data",
    //   "Validation",
    //   "Additional Actions",
    //   "Devices",
    //   "Events",
    // ]);
    // cy.get(commonWidgetSelector.noEventHandlerMessage).should(
    //   "have.text",
    //   multiselectText.noEventsMessage
    // );
    // addDefaultEventHandler(data.alertMessage);
    // cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();

    // selectFromMultiSelect(data.componentName, ["", "", "true"]);
    // cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);

    // openEditorSidebar(data.componentName);
    // openAccordion("Devices", [
    //   "Data",
    //   "Validation",
    //   "Additional Actions",
    //   "Devices",
    //   "Events",
    // ]);
    // addAndVerifyTooltip(
    //   commonWidgetSelector.draggableWidget(data.componentName),
    //   fake.randomSentence
    // );

    // openEditorSidebar(data.componentName);
    // openAccordion(commonWidgetText.accordionLayout, [
    //   "Data",
    //   "Validation",
    //   "Additional Actions",
    //   "Devices",
    //   "Events",
    // ]);
    // verifyAndModifyToggleFx(
    //   commonWidgetText.parameterShowOnDesktop,
    //   commonWidgetText.codeMirrorLabelTrue
    // );
    // cy.get(commonWidgetSelector.draggableWidget(data.componentName)).should(
    //   "not.exist"
    // );

    // // verifyAndModifyToggleFx(
    // //   commonWidgetText.parameterShowOnMobile,
    // //   commonWidgetText.codeMirrorLabelFalse
    // // );
    // // cy.get(commonWidgetSelector.changeLayoutButton).click();
    // // cy.get(commonWidgetSelector.draggableWidget(data.componentName)).should(
    // //   "exist"
    // // );
  });

  it("should verify the styles of the component", () => {
    const data = {};
    data.colour = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    openEditorSidebar("dropdown1");
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(commonWidgetSelector.draggableWidget("dropdown1")).should(
      "not.be.visible"
    );
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
    cy.get(commonWidgetSelector.draggableWidget("dropdown1"))
      .find(multiselectSelector.dropdownContainer)
      .should("have.attr", "aria-disabled", "true");

    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(commonWidgetSelector.draggableWidget("dropdown1"))
      .children(".h-100")
      .should("have.css", "border-radius", "20px");

    openEditorSidebar("dropdown1");
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion(commonWidgetText.accordionGenaral, [], 1);

    verifyAndModifyStylePickerFx(
      commonWidgetText.parameterBoxShadow,
      commonWidgetText.boxShadowDefaultValue,
      commonWidgetText.boxShadowFxValue,
      0,
      "0px 0px 0px 0px "
    );
    cy.get(
      commonWidgetSelector.parameterFxButton(
        commonWidgetText.parameterBoxShadow
      )
    ).click();

    cy.get(
      commonWidgetSelector.stylePicker(commonWidgetText.parameterBoxShadow)
    ).click();
    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );

    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.colour);
    verifyBoxShadowCss(
      `${commonWidgetSelector.draggableWidget("dropdown1")}>.col`,
      data.colour,
      data.boxShadowParam,
      "child"
    );
  });

  it("should verify component in preview", () => {
    const data = {};
    data.componentName = fake.componentName;
    data.label = fake.componentName;
    data.customMessage = fake.randomSentence;
    data.alertMessage = fake.randomSentence;
    data.colour = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.randomLabels = multiselectSelector.textArrayOfLength(3);
    data.randomValues = multiselectSelector.textArrayOfLength(3);

    openEditorSidebar("dropdown1");
    editAndVerifyWidgetName(data.componentName);
    verifyAndModifyParameter(commonWidgetText.parameterLabel, data.label);
    verifyAndModifyParameter(
      commonWidgetText.labelDefaultValue,
      codeMirrorInputLabel(`[${data.randomValues[0]}]`)
    );

    verifyAndModifyToggleFx(multiselectText.enableSelectAllOptions);
    verifyAndModifyParameter(
      commonWidgetText.parameterOptionvalues,
      codeMirrorInputLabel(`[${data.randomValues}]`)
    );

    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(data.alertMessage);

    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(data.componentName),
      data.customMessage
    );

    openEditorSidebar(data.componentName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion(commonWidgetText.accordionGenaral, [], 1);

    cy.get(
      commonWidgetSelector.stylePicker(commonWidgetText.parameterBoxShadow)
    ).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );
    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.colour);
    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );

    addTextWidgetToVerifyValue(`components.${data.componentName}.values`);

    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    cy.get(multiselectSelector.multiselectLabel(data.componentName)).should(
      "have.text",
      `${data.label}`
    );

    verifyMultiselectOptions(data.componentName, [
      "Select All",
      "one",
      "two",
      "three",
    ]);
    verifyWidgetText(
      commonWidgetText.text1,
      `${data.randomValues[0].replaceAll('"', "")}`
    );

    selectFromMultiSelect(data.componentName, ["", "", "true"]);
    cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage);
    verifyWidgetText(
      commonWidgetText.text1,
      `${data.randomValues.slice(0, 2)}`.replaceAll('"', "")
    );

    selectFromMultiSelect(data.componentName, ["true"]);
    verifyWidgetText(
      commonWidgetText.text1,
      `${data.randomValues}`.replaceAll('"', "")
    );

    verifyMultiselectHeader(
      data.componentName,
      multiselectText.labelAllItemsSelected
    );

    verifyTooltip(
      commonWidgetSelector.draggableWidget(data.componentName),
      data.customMessage
    );
    cy.get(commonWidgetSelector.draggableWidget(data.componentName))
      .children(".h-100")
      .should("have.css", "border-radius", "20px");

    verifyBoxShadowCss(
      `${commonWidgetSelector.draggableWidget(data.componentName)}>.col`,
      data.colour,
      data.boxShadowParam,
      "child"
    );
  });

  it("should verify CSA", () => {
    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Number input", 600, 50);
    selectEvent("On change", "Control Component");
    selectCSA("multiselect1", "Select Option", "1000");
    addSupportCSAData("Option", "{{components.numberinput1.value");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Number input", 600, 150);
    selectEvent("On change", "Control Component");
    selectCSA("multiselect1", "Deselect Option", "1000");
    addSupportCSAData("Option", "{{components.numberinput2.value");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 600, 250);
    selectEvent("On click", "Control Component");
    selectCSA("Multiselect1", "Clear selections");
    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.waitForAutoSave();

    cy.reload();
    cy.wait(3000);

    verifyMultipleComponentValuesFromInspector("multiselect1", [2, 3]);
    cy.get(commonWidgetSelector.draggableWidget("numberinput1"))
      .clear()
      .type("1");
    verifyMultiselectHeader(
      "multiselect1",
      multiselectText.labelAllItemsSelected
    );
    cy.get(commonWidgetSelector.draggableWidget("numberinput2"))
      .clear()
      .type("3");
    verifyMultipleComponentValuesFromInspector("multiselect1", [2, 1]);

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();

    verifyMultiselectHeader("multiselect1", "Select...");
  });
  it("should verify options", () => {
    openEditorSidebar("dropdown1");
    cy.get('[data-cy="label-dynamic-options"]').verifyVisibleElement(
      "have.text",
      "Dynamic options"
    );
    cy.get('[data-cy="label-dynamic-options"]').verifyVisibleElement(
      "have.text",
      "Dynamic options"
    );
    verifyOptionOnSidePanel("Option 1");
    verifyOptionOnSidePanel("Option 2");
    verifyOptionOnSidePanel("Option 3");
    deleteOption("Option 1");
    addNewOption();
    verifyOptionOnSidePanel("Option 4");

    updateOptionLabelAndValue("option 3", "Option label", "Option value");
    verifyOptionOnSidePanel("Option label");
    verifyOptionOnDropdown("dropdown1", ["Option 2", "Option label"]);
    verifyOptionMenuElements("Option 4");
    cy.get('[data-cy="mark-this-as-default-option-toggle-button"]').click();
    cy.waitForAutoSave();
    cy.reload();
    verifySelectedOptionOnDropdown("dropdown1", "Option 4");
    openEditorSidebar("dropdown1");
    verifyOptionMenuElements("Option 2");
    cy.get('[data-cy="visibility-toggle-button"]').eq(1).click();
    verifyOptionOnDropdown("dropdown1", ["Option label", "Option 4"]);
    verifyOptionMenuElements("Option label");

    cy.get('[data-cy="disable-toggle-button"]').eq(1).click();
    cy.get(`[data-cy="dropdown-input-dropdown1"]`).click("center");
    cy.get(`#react-select-3-option-0`)
      .verifyVisibleElement("have.text", `Option label`)
      .invoke("attr", "aria-disabled")
      .should("equal", "true");

    verifyAndModifyToggleFx("Dynamic options", false);
    verifyAndModifyParameter(
      "Schema",
      `{{[	{label: 'one',value: 'a',disable: true,visible: true,},{label: 'two',value: 'b',disable: false,visible: false},{label: 'three',value: 'c',disable: false,visible: true,default: true}	]`
    );
    verifyOptionOnDropdown("dropdown1", ["one", "three"]);
    cy.get(`#react-select-3-option-0`)
      .invoke("attr", "aria-disabled")
      .should("equal", "true");

    verifyAndModifyParameter(
      "Schema",
      `{{[	{label: 'one',value: 'a',disable: false,visible: true,},{label: 'two',value: 'b',disable: false,visible: true},{label: 'three',value: 'c',disable: false,visible: true,default: true}	]`
    );
    verifyOptionOnDropdown("dropdown1", ["one", "two", "three"]);
  });
});
