import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { tableText } from "Texts/table";
import { tableSelector } from "Selectors/table";
import {
  verifyComponent,
  deleteComponentAndVerify,
  verifyComponentWithOutLabel,
} from "Support/utils/basicComponents";
import {
  openAccordion,
  verifyAndModifyParameter,
  openEditorSidebar,
  verifyAndModifyToggleFx,
  addDefaultEventHandler,
  addAndVerifyTooltip,
  editAndVerifyWidgetName,
  verifyComponentValueFromInspector,
  fillBoxShadowParams,
  selectColourFromColourPicker,
  addTextWidgetToVerifyValue,
  verifyBoxShadowCss,
  verifyTooltip,
  verifyWidgetText,
  closeAccordions,
} from "Support/utils/commonWidget";
import {
  commonText,
  commonWidgetText,
  codeMirrorInputLabel,
} from "Texts/common";

describe("Basic components", () => {
  const data = {};
  beforeEach(() => {
    data.appName = `${fake.companyName}-${fake.companyName}-App`;
    cy.appUILogin();
    cy.createApp();
    cy.modifyCanvasSize(900, 900);
    cy.get('[data-tooltip-id="tooltip-for-hide-query-editor"]').click();
    cy.renameApp(data.appName);
    cy.intercept("GET", "/api/comments/*").as("loadComments");
  });

  it("Should verify Toggle switch", () => {
    cy.intercept("GET", "/api/v2/data_sources").as("appDs");
    cy.dragAndDropWidget("Toggle Switch", 50, 50);
    verifyComponent("toggleswitch1");

    cy.resizeWidget("toggleswitch1", 650, 400);

    openEditorSidebar("toggleswitch1");
    editAndVerifyWidgetName("toggleswitch2");

    verifyAndModifyParameter(commonWidgetText.parameterLabel, "label");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get(
      '[data-cy="draggable-widget-toggleswitch2"] > .form-check-label'
    ).should("have.text", "label");

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("toggleswitch2");
    cy.get(
      '[data-cy="draggable-widget-toggleswitch2"] > .form-check-label'
    ).should("have.text", "label");

    cy.go("back");
    cy.wait("@appDs");
    deleteComponentAndVerify("toggleswitch2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Checkbox", () => {
    cy.dragAndDropWidget("Checkbox", 50, 50);
    // cy.resizeWidget("checkbox1", 50, 200);
    cy.forceClickOnCanvas();
    verifyComponent("checkbox1");

    cy.resizeWidget("checkbox1", 650, 400);

    openEditorSidebar("checkbox1");
    editAndVerifyWidgetName("checkbox2");

    verifyAndModifyParameter(commonWidgetText.parameterLabel, "label");
    cy.forceClickOnCanvas();
    cy.get('[data-cy="draggable-widget-checkbox2"] .form-check-label').should(
      "have.text",
      "label"
    );
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("checkbox2");

    cy.go("back");
    deleteComponentAndVerify("checkbox2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Radio Button", () => {
    cy.dragAndDropWidget("Radio Button", 50, 50);
    // cy.resizeWidget("radiobutton1", 100, 200);
    cy.forceClickOnCanvas();
    verifyComponent("radiobutton1");

    cy.resizeWidget("radiobutton1", 650, 400);

    openEditorSidebar("radiobutton1");
    editAndVerifyWidgetName("radiobutton2");

    verifyAndModifyParameter(commonWidgetText.parameterLabel, "label");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get('[data-cy="draggable-widget-radiobutton2"] > .col-auto').should(
      "have.text",
      "label"
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("radiobutton2");

    cy.go("back");
    deleteComponentAndVerify("radiobutton2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });
  it("Should verify Dropdown", () => {
    cy.dragAndDropWidget("Dropdown", 50, 50);
    // cy.resizeWidget("radiobutton1", 100, 200);
    cy.forceClickOnCanvas();
    verifyComponent("dropdown1");

    cy.resizeWidget("dropdown1", 650, 400);

    openEditorSidebar("dropdown1");
    editAndVerifyWidgetName("dropdown2");

    verifyAndModifyParameter(commonWidgetText.parameterLabel, "label");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get('[data-cy="draggable-widget-dropdown2"] > .col-auto').should(
      "have.text",
      "label"
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("dropdown2");

    cy.go("back");
    deleteComponentAndVerify("dropdown2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });
  //pending
  it.skip("Should verify Rating", () => {
    cy.dragAndDropWidget("Rating", 200, 200);
    cy.get('[data-cy="draggable-widget-starrating1"]').click({ force: true });
    cy.resizeWidget("starrating1", 200, 500);
    cy.forceClickOnCanvas();
    verifyComponent("starrating1");

    cy.resizeWidget("starrating1", 650, 400);

    openEditorSidebar("starrating1");
    editAndVerifyWidgetName("starrating2");

    verifyAndModifyParameter(commonWidgetText.parameterLabel, "label");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get('[data-cy="draggable-widget-starrating2"] > .col-auto').should(
      "have.text",
      "label"
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("starrating2");

    cy.go("back");
    deleteComponentAndVerify("starrating2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Button Group", () => {
    cy.dragAndDropWidget("Button Group", 300, 300);
    cy.forceClickOnCanvas();
    verifyComponent("buttongroup1");

    cy.resizeWidget("buttongroup1", 650, 400);

    openEditorSidebar("buttongroup1");
    editAndVerifyWidgetName("buttongroup2");

    verifyAndModifyParameter(commonWidgetText.parameterLabel, "label");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get(
      '[data-cy="draggable-widget-buttongroup2"] > .widget-buttongroup-label'
    ).should("have.text", "label");

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("buttongroup2");

    cy.go("back");
    deleteComponentAndVerify("buttongroup2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Calendar", () => {
    cy.dragAndDropWidget("Calendar", 50, 50);
    cy.get('[data-cy="draggable-widget-calendar1"]').click({ force: true });
    cy.forceClickOnCanvas();
    verifyComponent("calendar1");

    cy.resizeWidget("calendar1", 650, 400);

    openEditorSidebar("calendar1");
    editAndVerifyWidgetName("calendar2");

    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("calendar2");

    cy.go("back");
    deleteComponentAndVerify("calendar2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Chart", () => {
    cy.dragAndDropWidget("Chart", 50, 50);
    cy.get('[data-cy="draggable-widget-chart1"]').click({ force: true });
    cy.forceClickOnCanvas();
    verifyComponent("chart1");

    cy.resizeWidget("chart1", 650, 400);

    openEditorSidebar("chart1");
    editAndVerifyWidgetName("chart2", ["Chart data", "Properties"]);

    verifyAndModifyParameter("Title", "label");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.get('[data-cy="draggable-widget-chart2"]').should(
      "contain.text",
      "label"
    );

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("chart2");

    cy.go("back");
    deleteComponentAndVerify("chart2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Circular Progress Bar", () => {
    cy.dragAndDropWidget("Circular Progressbar", 300, 300);
    cy.forceClickOnCanvas();
    verifyComponent("circularprogressbar1");

    cy.resizeWidget("circularprogressbar1", 650, 400);

    openEditorSidebar("circularprogressbar1");
    editAndVerifyWidgetName("circularprogressbar2");

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("circularprogressbar2");

    cy.go("back");
    deleteComponentAndVerify("circularprogressbar2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Code Editor", () => {
    cy.dragAndDropWidget("Code Editor", 300, 300);
    cy.get('[data-cy="draggable-widget-codeeditor1"]').click({ force: true });
    cy.forceClickOnCanvas();
    verifyComponent("codeeditor1");

    cy.resizeWidget("codeeditor1", 650, 400);

    openEditorSidebar("codeeditor1");
    editAndVerifyWidgetName("codeeditor2");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("codeeditor2");

    cy.go("back");
    deleteComponentAndVerify("codeeditor2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Color Picker", () => {
    cy.dragAndDropWidget("Color Picker", 300, 300);
    cy.get('[data-cy="draggable-widget-colorpicker1"]').click({ force: true });
    cy.forceClickOnCanvas();
    verifyComponent("colorpicker1");

    cy.resizeWidget("colorpicker1", 650, 400);

    openEditorSidebar("colorpicker1");
    editAndVerifyWidgetName("colorpicker2");

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("colorpicker2");

    cy.go("back");
    deleteComponentAndVerify("colorpicker2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });
  //needed fix
  it.skip("Should verify Custom Component", () => {
    cy.dragAndDropWidget("Custom Component", 50, 50);
    cy.get('[data-cy="draggable-widget-customcomponent1"]').click({
      force: true,
    });
    cy.forceClickOnCanvas();
    verifyComponent("customcomponent1");
    openEditorSidebar("customcomponent1");

    // editAndVerifyWidgetName("customcomponent2", ["Code"]);
    closeAccordions(["Code"]);
    cy.get(commonWidgetSelector.WidgetNameInputField).type(
      "{selectAll}{backspace}customcomponent2",
      { delay: 30 }
    );
    cy.forceClickOnCanvas();

    cy.get(commonWidgetSelector.draggableWidget(name)).trigger("mouseover");
    cy.get(commonWidgetSelector.widgetConfigHandle(name))
      .click()
      .should("have.text", name);

    cy.resizeWidget("customcomponent1", 650, 400);

    openEditorSidebar("customcomponent1");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("customcomponent2", ["Code"]);

    cy.go("back");
    deleteComponentAndVerify("customcomponent2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Container", () => {
    cy.dragAndDropWidget("Container", 50, 50);
    cy.forceClickOnCanvas();
    verifyComponent("container1");

    cy.resizeWidget("container1", 650, 400);

    openEditorSidebar("container1");
    editAndVerifyWidgetName("container2", ["Layout"]);

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("container2", ["Layout"]);

    cy.go("back");
    deleteComponentAndVerify("container2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Date-Range Picker", () => {
    cy.dragAndDropWidget("Range Picker", 300, 300);

    cy.forceClickOnCanvas();
    verifyComponent("daterangepicker1");

    cy.resizeWidget("daterangepicker1", 650, 400);

    openEditorSidebar("daterangepicker1");
    editAndVerifyWidgetName("daterangepicker2");

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("daterangepicker2");

    cy.go("back");
    deleteComponentAndVerify("daterangepicker2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });
  //visible issue
  it.skip("Should verify Divider", () => {
    verifyComponentWithOutLabel(
      "Divider",
      "divider1",
      "divider2",
      data.appName
    );
  });

  it("Should verify File Picker", () => {
    verifyComponentWithOutLabel(
      "File Picker",
      "filepicker1",
      "filepicker2",
      data.appName
    );
  });

  it("Should verify Form", () => {
    cy.dragAndDropWidget("Form", 50, 50);
    verifyComponent("form1");

    cy.resizeWidget("form1", 650, 400);

    openEditorSidebar("form1");
    editAndVerifyWidgetName("form2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("form2");

    cy.go("back");
    deleteComponentAndVerify("form2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify HTML", () => {
    cy.dragAndDropWidget("HTML Viewe", 50, 50, "HTML Viewer"); // search logic WIP
    verifyComponent("html1");

    cy.resizeWidget("html1", 650, 400);

    openEditorSidebar("html1");
    editAndVerifyWidgetName("html2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("html2");

    cy.go("back");
    deleteComponentAndVerify("html2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Icon", () => {
    verifyComponentWithOutLabel("Icon", "icon1", "icon2", data.appName);
  });

  it("Should verify Iframe", () => {
    verifyComponentWithOutLabel("Iframe", "iframe1", "iframe2", data.appName);
  });

  it.skip("Should verify Kamban", () => {
    verifyComponentWithOutLabel("Kanban", "kanban1", "kanban2", data.appName);
  });

  it("Should verify Link", () => {
    verifyComponentWithOutLabel("Link", "link1", "link2", data.appName);
  });

  it("Should verify Map", () => {
    cy.dragAndDropWidget("Map", 50, 50);
    cy.get("body").then(($body) => {
      if ($body.find(".dismissButton").length > 0) {
        cy.get(".dismissButton").click();
      }
    });

    verifyComponent("map1");

    cy.resizeWidget("map1", 650, 400);

    openEditorSidebar("map1");
    editAndVerifyWidgetName("map2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("map2");

    cy.go("back");
    deleteComponentAndVerify("map2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Modal", () => {
    verifyComponentWithOutLabel("Modal", "modal1", "modal2", data.appName);
  });

  it("Should verify PDF", () => {
    cy.dragAndDropWidget("PDF", 50, 50);
    verifyComponent("pdf1");

    cy.resizeWidget("pdf1", 650, 400);

    openEditorSidebar("pdf1");
    editAndVerifyWidgetName("pdf2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("pdf2");

    cy.go("back");
    deleteComponentAndVerify("pdf2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Pagination", () => {
    verifyComponentWithOutLabel(
      "Pagination",
      "pagination1",
      "pagination2",
      data.appName
    );
  });

  it("Should verify QR Scanner", () => {
    verifyComponentWithOutLabel(
      "QR Scanner",
      "qrscanner1",
      "qrscanner2",
      data.appName
    );
  });

  it.skip("Should verify Range Slider", () => {
    verifyComponentWithOutLabel(
      "Range Slider",
      "rangeslider1",
      "rangeslider2",
      data.appName
    );
  });

  it("Should verify Rich Text Editor", () => {
    verifyComponentWithOutLabel(
      "Text Editor",
      "richtexteditor1",
      "richtexteditor2",
      data.appName
    );
  });

  it("Should verify Spinner", () => {
    verifyComponentWithOutLabel(
      "Spinner",
      "spinner1",
      "spinner2",
      data.appName
    );
  });

  it("Should verify Statistics", () => {
    verifyComponentWithOutLabel(
      "Statistics",
      "statistics1",
      "statistics2",
      data.appName
    );
  });

  it("Should verify Steps", () => {
    verifyComponentWithOutLabel("Steps", "steps1", "steps2", data.appName);
  });

  it("Should verify SVG Image", () => {
    verifyComponentWithOutLabel(
      "SVG Image",
      "svgimage1",
      "svgimage2",
      data.appName
    );
  });

  it("Should verify Tabs", () => {
    cy.dragAndDropWidget("Tabs", 50, 50);
    verifyComponent("tabs1");
    deleteComponentAndVerify("image1");

    cy.resizeWidget("tabs1", 650, 400);

    openEditorSidebar("tabs1");
    editAndVerifyWidgetName("tabs2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("tabs2");

    cy.go("back");
    deleteComponentAndVerify("tabs2");
    cy.get(commonSelectors.editorPageLogo).click();

    cy.deleteApp(data.appName);
  });

  it("Should verify Tags", () => {
    verifyComponentWithOutLabel("Tags", "tags1", "tags2", data.appName);
  });

  it("Should verify Textarea", () => {
    verifyComponentWithOutLabel(
      "Textarea",
      "textarea1",
      "textarea2",
      data.appName
    );
  });

  it("Should verify Timeline", () => {
    verifyComponentWithOutLabel(
      "Timeline",
      "timeline1",
      "timeline2",
      data.appName
    );
  });
  it("Should verify Timer", () => {
    verifyComponentWithOutLabel("Timer", "timer1", "timer2", data.appName);
  });

  it("Should verify Tree Select", () => {
    verifyComponentWithOutLabel(
      "Tree Select",
      "treeselect1",
      "treeselect2",
      data.appName
    );
  });

  it("Should verify Vertical Divider", () => {
    verifyComponentWithOutLabel(
      "Vertical Divider",
      "verticaldivider1",
      "verticaldivider2",
      data.appName
    );
  });
});
