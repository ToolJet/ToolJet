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
import { resizeQueryPanel } from "Support/utils/dataSource";

describe("Basic components", () => {
  const data = {};
  beforeEach(() => {
    data.appName = `${fake.companyName}-${fake.companyName}-App`;
    cy.apiLogin();
    cy.apiCreateApp();
    cy.openApp();
    cy.modifyCanvasSize(900, 900);
    cy.intercept("GET", "/api/comments/*").as("loadComments");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("Should verify Toggle switch", () => {
    cy.dragAndDropWidget("Toggle Switch", 200, 200);
    verifyComponent("toggleswitch1");

    cy.resizeWidget("toggleswitch1", 650, 400, false);

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
    cy.waitForAppLoad();
    deleteComponentAndVerify("toggleswitch2");
  });

  it("Should verify Checkbox", () => {
    cy.dragAndDropWidget("Checkbox", 200, 200);
    // cy.resizeWidget("checkbox1", 50, 200,false);
    cy.forceClickOnCanvas();
    verifyComponent("checkbox1");

    openEditorSidebar("checkbox1");
    editAndVerifyWidgetName("checkbox2");
    cy.resizeWidget("checkbox2", 650, 400, false);

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
  });

  it("Should verify Radio Button", () => {
    cy.dragAndDropWidget("Radio Button", 200, 200);
    // cy.resizeWidget("radiobutton1", 100, 200,false);
    cy.forceClickOnCanvas();
    verifyComponent("radiobutton1");

    cy.resizeWidget("radiobutton1", 650, 400, false);

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
  });
  it("Should verify Dropdown", () => {
    cy.dragAndDropWidget("Dropdown", 200, 200);
    cy.resizeWidget("dropdown1", 400, 500, false);
    cy.forceClickOnCanvas();
    verifyComponent("dropdown1");

    openEditorSidebar("dropdown1");
    editAndVerifyWidgetName("dropdown2");
    cy.resizeWidget("dropdown2", 650, 400, false);

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
  });
  //pending
  it("Should verify Rating", () => {
    cy.dragAndDropWidget("Rating", 200, 200);
    cy.get('[data-cy="draggable-widget-starrating1"]').click({ force: true });
    cy.resizeWidget("starrating1", 400, 500, false);
    cy.forceClickOnCanvas();
    verifyComponent("starrating1");

    openEditorSidebar("starrating1");
    editAndVerifyWidgetName("starrating2");
    cy.resizeWidget("starrating2", 650, 400, false);

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
  });

  it("Should verify Button Group", () => {
    cy.dragAndDropWidget("Button Group", 300, 300);
    cy.forceClickOnCanvas();
    verifyComponent("buttongroup1");

    cy.resizeWidget("buttongroup1", 650, 400, false);

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
  });

  it("Should verify Calendar", () => {
    cy.dragAndDropWidget("Calendar", 200, 200);
    cy.get('[data-cy="draggable-widget-calendar1"]').click({ force: true });
    cy.forceClickOnCanvas();
    verifyComponent("calendar1");

    cy.resizeWidget("calendar1", 650, 400, false);

    openEditorSidebar("calendar1");
    editAndVerifyWidgetName("calendar2");

    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("calendar2");

    cy.go("back");
    deleteComponentAndVerify("calendar2");
  });

  it("Should verify Chart", () => {
    cy.dragAndDropWidget("Chart", 200, 200);
    cy.get('[data-cy="draggable-widget-chart1"]').click({ force: true });
    verifyComponent("chart1");

    openEditorSidebar("chart1");
    editAndVerifyWidgetName("chart2", ["Chart data", "Properties"]);
    // cy.resizeWidget("chart1", 650, 400, false);

    verifyAndModifyParameter("Title", "label");
    cy.forceClickOnCanvas();
    cy.resizeWidget("chart2", 650, 400, false);
    cy.get('[data-cy="draggable-widget-chart2"]').should(
      "contain.text",
      "label"
    );
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("chart2");

    cy.go("back");
    deleteComponentAndVerify("chart2");
  });

  it("Should verify Circular Progress Bar", () => {
    cy.dragAndDropWidget("Circular Progressbar", 300, 300);
    cy.forceClickOnCanvas();
    verifyComponent("circularprogressbar1");

    cy.resizeWidget("circularprogressbar1", 650, 400, false);

    openEditorSidebar("circularprogressbar1");
    editAndVerifyWidgetName("circularprogressbar2");

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("circularprogressbar2");

    cy.go("back");
    deleteComponentAndVerify("circularprogressbar2");
  });

  it("Should verify Code Editor", () => {
    cy.dragAndDropWidget("Code Editor", 300, 300);
    cy.get('[data-cy="draggable-widget-codeeditor1"]').click({ force: true });
    cy.forceClickOnCanvas();
    verifyComponent("codeeditor1");

    cy.resizeWidget("codeeditor1", 650, 400, false);

    openEditorSidebar("codeeditor1");
    editAndVerifyWidgetName("codeeditor2");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("codeeditor2");

    cy.go("back");
    deleteComponentAndVerify("codeeditor2");
  });

  it("Should verify Color Picker", () => {
    cy.dragAndDropWidget("Color Picker", 300, 300);
    cy.get('[data-cy="draggable-widget-colorpicker1"]').click({ force: true });
    cy.forceClickOnCanvas();
    verifyComponent("colorpicker1");

    cy.resizeWidget("colorpicker1", 650, 400, false);

    openEditorSidebar("colorpicker1");
    editAndVerifyWidgetName("colorpicker2");

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("colorpicker2");

    cy.go("back");
    deleteComponentAndVerify("colorpicker2");
  });
  it("Should verify Custom Component", () => {
    cy.dragAndDropWidget("Custom Component", 200, 200);
    // cy.get('[data-cy="draggable-widget-customcomponent1"]').click({
    //   force: true,
    // });
    // cy.forceClickOnCanvas();
    verifyComponent("customcomponent1");
    openEditorSidebar("customcomponent1");

    // editAndVerifyWidgetName("customcomponent2", ["Code"]);
    closeAccordions(["Code"]);
    cy.get(commonWidgetSelector.WidgetNameInputField).type(
      "{selectAll}{backspace}customcomponent2",
      { delay: 30 }
    );
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();
    cy.resizeWidget("customcomponent2", 650, 400, false);
    cy.wait(2000);
    cy.get(
      commonWidgetSelector.draggableWidget("customcomponent2")
    ).realHover();
    cy.get(commonWidgetSelector.widgetConfigHandle("customcomponent2"))
      .click()
      .should("have.text", "customcomponent2");

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("customcomponent2", ["Code"]);

    cy.go("back");
    deleteComponentAndVerify("customcomponent2");
  });

  it("Should verify Container", () => {
    cy.dragAndDropWidget("Container", 200, 200);
    cy.forceClickOnCanvas();
    verifyComponent("container1");

    openEditorSidebar("container1");
    editAndVerifyWidgetName("container2", ["Layout"]);

    cy.forceClickOnCanvas();
    cy.resizeWidget("container2", 650, 400, false);
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("container2", ["Layout"]);

    cy.go("back");
    deleteComponentAndVerify("container2");
  });

  it("Should verify Date-Range Picker", () => {
    cy.dragAndDropWidget("Range Picker", 300, 300);

    cy.forceClickOnCanvas();
    verifyComponent("daterangepicker1");

    cy.resizeWidget("daterangepicker1", 650, 400, false);

    openEditorSidebar("daterangepicker1");
    editAndVerifyWidgetName("daterangepicker2");

    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("daterangepicker2");

    cy.go("back");
    deleteComponentAndVerify("daterangepicker2");
  });
  // visible issue
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
    cy.dragAndDropWidget("Form", 200, 200);
    verifyComponent("form1");

    cy.resizeWidget("form1", 650, 400, false);

    openEditorSidebar("form1");
    editAndVerifyWidgetName("form2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("form2");

    cy.go("back");
    deleteComponentAndVerify("form2");
  });

  it("Should verify HTML", () => {
    cy.dragAndDropWidget("HTML Viewe", 200, 200, "HTML Viewer"); // search logic WIP
    verifyComponent("html1");

    cy.resizeWidget("html1", 650, 400, false);

    openEditorSidebar("html1");
    editAndVerifyWidgetName("html2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("html2");

    cy.go("back");
    deleteComponentAndVerify("html2");
  });

  it("Should verify Icon", () => {
    verifyComponentWithOutLabel("Icon", "icon1", "icon2", data.appName);
  });

  it("Should verify Iframe", () => {
    verifyComponentWithOutLabel("Iframe", "iframe1", "iframe2", data.appName);
  });

  it.skip("Should verify Kanban", () => {
    verifyComponentWithOutLabel("Kanban", "kanban1", "kanban2", data.appName);
  });

  it("Should verify Link", () => {
    verifyComponentWithOutLabel("Link", "link1", "link2", data.appName);
  });

  it("Should verify Map", () => {
    cy.dragAndDropWidget("Map", 200, 200);
    cy.get("body").then(($body) => {
      if ($body.find(".dismissButton").length > 0) {
        cy.get(".dismissButton").click();
      }
    });

    verifyComponent("map1");

    cy.resizeWidget("map1", 650, 400, false);

    openEditorSidebar("map1");
    editAndVerifyWidgetName("map2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("map2");

    cy.go("back");
    deleteComponentAndVerify("map2");
  });

  it("Should verify Modal", () => {
    verifyComponentWithOutLabel("Modal", "modal1", "modal2", data.appName);
  });

  it("Should verify PDF", () => {
    cy.dragAndDropWidget("PDF", 200, 200);
    verifyComponent("pdf1");

    cy.resizeWidget("pdf1", 650, 400, false);

    openEditorSidebar("pdf1");
    editAndVerifyWidgetName("pdf2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("pdf2");

    cy.go("back");
    deleteComponentAndVerify("pdf2");
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

  it("Should verify Range Slider", () => {
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
    cy.viewport(1200, 1300);
    resizeQueryPanel("0");
    cy.dragAndDropWidget("Tabs", 200, 200);
    verifyComponent("tabs1");
    deleteComponentAndVerify("image1");

    cy.resizeWidget("tabs1", 650, 400, false);

    openEditorSidebar("tabs1");
    editAndVerifyWidgetName("tabs2");

    cy.waitForAutoSave();

    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    verifyComponent("tabs2");

    cy.go("back");
    deleteComponentAndVerify("tabs2");
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
