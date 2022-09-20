import { listviewSelector } from "Selectors/listview";
import { listviewText } from "Texts/listview";
import {
  commonText,
  commonWidgetText,
  codeMirrorInputLabel,
} from "Texts/common";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { fake } from "Fixtures/fake";

import {
  deleteInnerWidget,
  dropWidgetToListview,
  verifyMultipleComponentValuesFromInspector,
  addDataToListViewInputs,
} from "Support/utils/listviewWidget";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  editAndVerifyWidgetName,
  // verifyMultipleComponentValuesFromInspector,
  selectColourFromColourPicker,
  fillBoxShadowParams,
  verifyBoxShadowCss,
} from "Support/utils/commonWidget";

describe("List view widget", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget("List View");
    cy.modifyCanvasSize(1800, 780);
  });

  it("should verify the properties of the list view widget", () => {
    const data = {};
    data.widgetName = fake.widgetName;
    // data.label = fake.widgetName;
    // data.customMessage = fake.randomSentence;
    data.alertMessage = fake.randomSentence;
    // data.randomLabels = multiselectSelector.textArrayOfLength(3);

    openEditorSidebar("listview1");
    editAndVerifyWidgetName(data.widgetName);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents);
    deleteInnerWidget(data.widgetName, "text1");
    deleteInnerWidget(data.widgetName, "button1");
    deleteInnerWidget(data.widgetName, "image1");

    dropWidgetToListview("Text", 50, 50, data.widgetName);

    dropWidgetToListview("Text Input", 250, 50, data.widgetName);
    addDataToListViewInputs(data.widgetName, "textinput1", [
      "one",
      "two",
      "three",
    ]);
    verifyMultipleComponentValuesFromInspector(data.widgetName, "textinput1", [
      "one",
      "two",
      "three",
    ]);

    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter(
      "List data",
      codeMirrorInputLabel(
        `[{name:"name1",mark:10}, {name:"name2", mark: 20},{name:"name3", mark:30}]`
      )
    );

    cy.get(`${commonWidgetSelector.draggableWidget("text1")}:eq(0)`).click();
    verifyAndModifyParameter("Text", codeMirrorInputLabel("listItem.name"));
    cy.forceClickOnCanvas();
    cy.get(
      `${commonWidgetSelector.draggableWidget("textinput1")}:eq(0)`
    ).click();
    verifyAndModifyParameter(
      "Default Value",
      codeMirrorInputLabel("listItem.mark")
    );

    verifyMultipleComponentValuesFromInspector(
      data.widgetName,
      "textinput1",
      ["10", "20", "30"],
      "open"
    );
    cy.forceClickOnCanvas();
    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter("Row height", "99");

    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter(
      "Show bottom border",
      codeMirrorInputLabel("false")
    );

    cy.forceClickOnCanvas();
    cy.get(`[data-cy=${data.widgetName.toLowerCase()}-row-1]`)
      .should("have.css", "height", "99px")
      .invoke("attr", "class")
      .and("not.contain", "border-bottom");

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents);
    cy.get(commonWidgetSelector.noEventHandlerMessage).should(
      "have.text",
      "This listview doesn't have any event handlers"
    );
    addDefaultEventHandler(data.alertMessage);
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();

    // cy.verifyToastMessage(commonSelectors.toastMessage, data.alertMessage); //do something else.

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      fake.randomSentence
    );

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionLayout);
    verifyAndModifyToggleFx(
      commonWidgetText.parameterShowOnDesktop,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "not.exist"
    );

    verifyAndModifyToggleFx(
      commonWidgetText.parameterShowOnMobile,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.get(commonWidgetSelector.changeLayoutButton).click();
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "exist"
    );
  });

  it("should verify the styles of the list view widget", () => {
    const data = {};
    data.colour = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    openEditorSidebar(listviewText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(
      commonWidgetSelector.draggableWidget(listviewText.defaultWidgetName)
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
    cy.get(commonSelectors.autoSave, { timeout: 9000 }).should(
      "have.text",
      commonText.autoSave
    );
    cy.get(
      commonWidgetSelector.draggableWidget(listviewText.defaultWidgetName)
    ).should("have.attr", "data-disabled", "true");
    cy.get("[data-cy='disable-toggle-button']").click();

    cy.get("[data-cy='border-radius-fx-button']:eq(1)").click();
    verifyAndModifyParameter(
      commonWidgetText.parameterBorderRadius,
      commonWidgetText.borderRadiusInput
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(
      commonWidgetSelector.draggableWidget(listviewText.defaultWidgetName)
    ).should("have.css", "border-radius", "20px");

    openEditorSidebar(listviewText.defaultWidgetName);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    openAccordion(commonWidgetText.accordionGenaral, "1");

    verifyAndModifyToggleFx(
      commonWidgetText.parameterBoxShadow,
      commonWidgetText.boxShadowDefaultValue,
      false
    );

    cy.get('[data-cy="border-radius-fx-button"]').click();
    cy.get(commonWidgetSelector.boxShadowColorPicker).click();

    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );

    selectColourFromColourPicker(commonWidgetText.boxShadowColor, data.colour);
    verifyBoxShadowCss(
      listviewText.defaultWidgetName,
      data.colour,
      data.boxShadowParam
    );
  });
});
