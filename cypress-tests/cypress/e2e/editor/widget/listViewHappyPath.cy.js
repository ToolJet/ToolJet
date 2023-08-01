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
  verifyValuesOnList,
  verifyExposedValueByToast,
  textArrayOfLength,
} from "Support/utils/listviewWidget";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  verifyTooltip,
  editAndVerifyWidgetName,
  pushIntoArrayOfObject,
  selectColourFromColourPicker,
  fillBoxShadowParams,
  verifyBoxShadowCss,
} from "Support/utils/commonWidget";

describe("List view widget", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.viewport(1200, 1200);
    cy.dragAndDropWidget("List View", 50, 500);
    cy.modifyCanvasSize(1200, 700);
    cy.intercept("PUT", "/api/apps/**").as("apps");
  });

  it("should verify the properties of the list view widget", () => {
    const data = {};
    data.marks = textArrayOfLength(3);
    data.names = textArrayOfLength(3);
    data.widgetName = fake.widgetName;
    data.customMessage = fake.randomSentence;

    openEditorSidebar(listviewText.defaultWidgetName);
    editAndVerifyWidgetName(data.widgetName);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents);
    deleteInnerWidget(data.widgetName, commonWidgetText.text1);
    deleteInnerWidget(data.widgetName, commonWidgetText.button1);
    deleteInnerWidget(data.widgetName, commonWidgetText.image1);

    dropWidgetToListview("Text", 50, 50, data.widgetName);

    dropWidgetToListview("Text Input", 250, 50, data.widgetName);
    addDataToListViewInputs(
      data.widgetName,
      commonWidgetText.textinput1,
      data.names
    );
    verifyMultipleComponentValuesFromInspector(
      data.widgetName,
      commonWidgetText.textinput1,
      data.names
    );

    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter(
      "List data",
      codeMirrorInputLabel(pushIntoArrayOfObject(data.names, data.marks))
    );

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.reload();
    cy.wait(2500);

    cy.get(
      `${commonWidgetSelector.draggableWidget(commonWidgetText.text1)}:eq(0)`
    )
      .realHover()
      .realClick();
    verifyAndModifyParameter("Text", codeMirrorInputLabel("listItem.name"));
    cy.forceClickOnCanvas();
    cy.get(
      `${commonWidgetSelector.draggableWidget(
        commonWidgetText.textinput1
      )}:eq(0)`
    ).click();
    verifyAndModifyParameter(
      commonWidgetText.labelDefaultValue,
      codeMirrorInputLabel("listItem.mark")
    );
    cy.forceClickOnCanvas();
    verifyValuesOnList(
      data.widgetName,
      commonWidgetText.text1,
      "text",
      data.names
    );
    verifyValuesOnList(
      data.widgetName,
      commonWidgetText.textinput1,
      "value",
      data.marks
    );

    verifyMultipleComponentValuesFromInspector(
      data.widgetName,
      commonWidgetText.textinput1,
      data.marks
    );

    cy.forceClickOnCanvas();
    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter(listviewText.rowHeight, "99");

    openEditorSidebar(data.widgetName);
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.reload();
    cy.wait(2500);

    cy.get(`${commonWidgetSelector.draggableWidget(data.widgetName)}:eq(0)`)
      .realHover()
      .click("topRight", { force: true });

    verifyAndModifyParameter(
      listviewText.showBottomBorder,
      codeMirrorInputLabel("false")
    );

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get(`[data-cy=${data.widgetName.toLowerCase()}-row-1]`)
      .invoke("height")
      .should("be.gte", 98)
      .and("be.lte", 99);
    cy.get(`[data-cy=${data.widgetName.toLowerCase()}-row-1]`)
      .invoke("attr", "class")
      .and("not.contain", "border-bottom");

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents);
    cy.get(commonWidgetSelector.noEventHandlerMessage).should(
      "have.text",
      listviewText.noEventHandlerMessage
    );
    addDefaultEventHandler(
      codeMirrorInputLabel(
        `components.${data.widgetName}.selectedRow.${commonWidgetText.textinput1}.value`
      )
    );
    cy.get(commonWidgetSelector.buttonCloseEditorSideBar).click();
    cy.get(`[data-cy=${data.widgetName.toLowerCase()}-row-1]`).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.marks[1]);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionGenaral);
    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customMessage
    );

    cy.forceClickOnCanvas();
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionLayout);
    verifyAndModifyToggleFx(
      commonWidgetText.parameterShowOnDesktop,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
      "not.exist"
    );

    // verifyAndModifyToggleFx(
    //   commonWidgetText.parameterShowOnMobile,
    //   commonWidgetText.codeMirrorLabelFalse
    // );
    // cy.get(commonWidgetSelector.changeLayoutButton).click();
    // cy.get(commonWidgetSelector.draggableWidget(data.widgetName)).should(
    //   "exist"
    // );
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
    openAccordion(commonWidgetText.accordionGenaral, []);

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

    selectColourFromColourPicker(
      commonWidgetText.boxShadowColor,
      data.colour,
      2
    );
    verifyBoxShadowCss(
      listviewText.defaultWidgetName,
      data.colour,
      data.boxShadowParam
    );
  });

  it("should verify listview widget in preview", () => {
    const data = {};
    data.marks = textArrayOfLength(3);
    data.names = textArrayOfLength(3);
    data.widgetName = listviewText.defaultWidgetName;
    data.customMessage = fake.randomSentence;
    data.colour = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;

    openEditorSidebar(data.widgetName);
    editAndVerifyWidgetName(data.widgetName);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents);
    deleteInnerWidget(data.widgetName, "button1");
    deleteInnerWidget(data.widgetName, "image1");

    dropWidgetToListview("Text Input", 250, 20, data.widgetName);

    cy.forceClickOnCanvas();
    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter(
      "List data",
      codeMirrorInputLabel(pushIntoArrayOfObject(data.names, data.marks))
    );

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.reload();
    cy.wait(3500);

    cy.get(
      `${commonWidgetSelector.draggableWidget(commonWidgetText.text1)}:eq(0)`
    ).click();

    verifyAndModifyParameter("Text", codeMirrorInputLabel("listItem.name"));
    cy.forceClickOnCanvas();
    cy.get(
      `${commonWidgetSelector.draggableWidget(
        commonWidgetText.textinput1
      )}:eq(0)`
    ).click();
    verifyAndModifyParameter(
      commonWidgetText.labelDefaultValue,
      codeMirrorInputLabel("listItem.mark")
    );

    cy.forceClickOnCanvas();
    openEditorSidebar(data.widgetName);
    verifyAndModifyParameter("Row height", "99");
    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });

    openEditorSidebar(data.widgetName);
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.reload();
    cy.wait(2500);

    cy.get(
      `${commonWidgetSelector.draggableWidget(data.widgetName)}:eq(0)`
    ).click();

    verifyAndModifyParameter(
      "Show bottom border",
      codeMirrorInputLabel("false")
    );
    cy.waitForAutoSave();
    cy.forceClickOnCanvas();
    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler(
      codeMirrorInputLabel(
        `components.${data.widgetName}.selectedRow.${commonWidgetText.textinput1}.value`
      )
    );

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.reload();
    cy.wait(2500);

    openEditorSidebar(data.widgetName);
    openAccordion(commonWidgetText.accordionGenaral);

    addAndVerifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customMessage
    );

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
    openAccordion(commonWidgetText.accordionGenaral, []);

    verifyAndModifyToggleFx(
      commonWidgetText.parameterBoxShadow,
      commonWidgetText.boxShadowDefaultValue,
      false
    );

    cy.get(commonWidgetSelector.boxShadowColorPicker).click();
    fillBoxShadowParams(
      commonWidgetSelector.boxShadowDefaultParam,
      data.boxShadowParam
    );
    selectColourFromColourPicker(
      commonWidgetText.boxShadowColor,
      data.colour,
      2
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);

    verifyTooltip(
      commonWidgetSelector.draggableWidget(data.widgetName),
      data.customMessage
    );

    cy.get(`[data-cy=${data.widgetName.toLowerCase()}-row-1]`).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, data.marks[1]);

    verifyBoxShadowCss(
      listviewText.defaultWidgetName,
      data.colour,
      data.boxShadowParam
    );

    cy.get(`[data-cy=${data.widgetName.toLowerCase()}-row-1]`)
      .invoke("height")
      .should("equal", 99);
    cy.get(`[data-cy=${data.widgetName.toLowerCase()}-row-1]`)
      .invoke("attr", "class")
      .and("not.contain", "border-bottom");

    data.names = textArrayOfLength(3);
    addDataToListViewInputs(
      data.widgetName,
      commonWidgetText.textinput1,
      data.names
    );
    verifyExposedValueByToast(data.widgetName, data.names);
  });
});
