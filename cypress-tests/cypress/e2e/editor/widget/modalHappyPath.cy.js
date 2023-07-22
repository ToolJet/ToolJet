import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";
import { fake } from "Fixtures/fake";
import { commonWidgetText } from "Texts/common";

import { verifyControlComponentAction } from "Support/utils/button";
import {
  launchModal,
  closeModal,
  launchButton,
  verifySize,
  addAndVerifyColor,
  typeOnFx,
} from "Support/utils/modal";

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

describe("Modal", () => {
  beforeEach(() => {
    cy.appUILogin();
    cy.createApp();
    cy.dragAndDropWidget("Modal");
  });

  it("should verify the properties of the modal component", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.customTitle = fake.randomSentence;
    data.tooltipText = fake.randomSentence;
    data.buttonText = fake.companyName;

    cy.renameApp(data.appName);
    launchModal("modal1");
    cy.get('[data-cy="modal-title"]').verifyVisibleElement(
      "have.text",
      "This title can be changed"
    );
    cy.get('[data-cy="modal-body"]').should("be.visible");
    cy.get('[data-cy="modal-close-button"]').click();
    cy.notVisible('[data-cy="modal-title"]');

    openEditorSidebar("modal1", ["Options", "Properties", "Layout"]);
    editAndVerifyWidgetName(data.widgetName, [
      "Options",
      "Properties",
      "Layout",
    ]);
    verifyComponentFromInspector(data.widgetName);

    openAccordion(commonWidgetText.accordionProperties);
    verifyAndModifyParameter("Title", data.customTitle);
    launchModal(data.widgetName);
    cy.get('[data-cy="modal-title"]').verifyVisibleElement(
      "have.text",
      data.customTitle
    );
    cy.get('[data-cy="modal-close-button"]').click();

    verifyAndModifyToggleFx(
      buttonText.loadingState,
      commonWidgetText.codeMirrorLabelFalse
    );
    launchModal(data.widgetName);
    cy.get(".spinner-border").should("be.visible");

    cy.get(
      commonWidgetSelector.parameterTogglebutton(buttonText.loadingState)
    ).click();
    cy.notVisible(".spinner-border");

    verifyAndModifyToggleFx(
      "Hide title bar",
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.notVisible('[data-cy="modal-title"]');
    cy.get('[data-cy="hide-title-bar-toggle-button"]').click();
    cy.get('[data-cy="modal-title"]').verifyVisibleElement(
      "have.text",
      data.customTitle
    );

    cy.realPress("Escape");
    cy.notVisible('[data-cy="modal-title"]');

    verifyAndModifyToggleFx(
      "Close on escape key",
      commonWidgetText.codeMirrorLabelTrue
    );
    launchModal(data.widgetName);

    cy.realPress("Escape");
    cy.get('[data-cy="modal-title"]').verifyVisibleElement(
      "have.text",
      data.customTitle
    );

    closeModal(data.widgetName);
    launchModal(data.widgetName);

    verifySize("Medium");
    verifySize("Large");
    verifySize("Small");

    verifyAndModifyToggleFx(
      "Use default trigger button",
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get('[data-cy="modal-close-button"]').click();
    cy.notVisible(launchButton(data.widgetName));

    cy.get('[data-cy="use-default-trigger-button-toggle-button"]').click();

    cy.get(
      '[data-cy="trigger-button-label-input-field"]'
    ).clearAndTypeOnCodeMirror(data.buttonText);
    cy.forceClickOnCanvas();
    cy.get(launchButton(data.widgetName))
      .verifyVisibleElement("have.text", data.buttonText)
      .click();

    openAccordion(commonWidgetText.accordionEvents);
    selectEvent("On open", "Show Alert");
    cy.get('[data-cy="modal-close-button"]').click();
    launchModal(data.widgetName);
    cy.verifyToastMessage(commonSelectors.toastMessage, "Hello world!");
    cy.get('[data-cy="modal-close-button"]').click();

    verifyLayout(data.widgetName);

    cy.get(commonWidgetSelector.changeLayoutToDesktopButton).click();
    cy.get(
      commonWidgetSelector.parameterTogglebutton(
        commonWidgetText.parameterShowOnDesktop
      )
    ).click();

    cy.get(commonWidgetSelector.widgetDocumentationLink).should(
      "have.text",
      "Modal documentation"
    );

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it("should verify the styles of the modal widget", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.boxShadowColor = fake.randomRgba;
    data.colourHex = fake.randomRgbaHex;
    data.boxShadowParam = fake.boxShadowParam;
    data.backgroundColor = fake.randomRgba;

    cy.renameApp(data.appName);
    launchModal("modal1");
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    addAndVerifyColor(
      "Header background color",
      "#ffffffff",
      data.backgroundColor,
      "[data-cy='modal-header']"
    );

    data.backgroundColor = fake.randomRgba;
    addAndVerifyColor(
      "Header title color",
      "#000000",
      data.backgroundColor,
      "[data-cy='modal-header']",
      "color"
    );

    data.backgroundColor = fake.randomRgba;
    addAndVerifyColor(
      "Body background color",
      "#ffffffff",
      data.backgroundColor,
      "[data-cy='modal-body']"
    );

    data.backgroundColor = fake.randomRgba;
    addAndVerifyColor(
      "Trigger button background color",
      "#4D72FA",
      data.backgroundColor,
      launchButton("modal1"),
      "background-color"
    );

    data.backgroundColor = fake.randomRgba;
    addAndVerifyColor(
      "Trigger button text color",
      "#ffffffff",
      data.backgroundColor,
      launchButton("modal1"),
      "color"
    );
    cy.get("[data-cy='modal-header']").realClick();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterVisibility,
      commonWidgetText.codeMirrorLabelTrue
    );
    cy.get('[data-cy="modal-close-button"]').click();
    cy.get(commonWidgetSelector.draggableWidget("modal1")).should(
      "not.be.visible"
    );
    cy.get(commonWidgetSelector.parameterTogglebutton("Visibility")).click();

    verifyAndModifyToggleFx(
      commonWidgetText.parameterDisable,
      commonWidgetText.codeMirrorLabelFalse
    );
    cy.waitForAutoSave();
    cy.get(launchButton("modal1")).should("have.attr", "disabled");

    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
    launchModal("modal1");
    cy.get('[data-cy="modal-title"]').verifyVisibleElement(
      "have.text",
      "This title can be changed"
    );

    cy.get(commonSelectors.editorPageLogo).click();
    cy.deleteApp(data.appName);
  });

  it("should verify the app preview", () => {
    const data = {};
    data.appName = `${fake.companyName}-App`;
    data.bgColor = fake.randomRgba;
    data.titleColor = fake.randomRgba;
    data.bodyColor = fake.randomRgba;
    data.buttonColor = fake.randomRgba;
    data.buttonTextColor = fake.randomRgba;
    data.customTitle = fake.randomSentence;

    cy.get(".close-svg > path").click();
    cy.dragAndDropWidget(commonWidgetText.toggleSwitch, 600, 50);
    cy.get(".close-svg > path").click();
    cy.dragAndDropWidget(commonWidgetText.toggleSwitch, 600, 100);
    cy.get(".close-svg > path").click();
    cy.dragAndDropWidget(commonWidgetText.toggleSwitch, 600, 150);
    cy.get(".close-svg > path").click();
    cy.dragAndDropWidget(commonWidgetText.toggleSwitch, 600, 200);
    cy.get(".close-svg > path").click();
    cy.dragAndDropWidget(commonWidgetText.toggleSwitch, 600, 250);
    cy.get(".close-svg > path").click();

    cy.renameApp(data.appName);
    launchModal("modal1");
    verifyAndModifyParameter("Title", data.customTitle);
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    addAndVerifyColor(
      "Header background color",
      "#ffffffff",
      data.bgColor,
      "[data-cy='modal-header']"
    );

    addAndVerifyColor(
      "Header title color",
      "#000000",
      data.titleColor,
      "[data-cy='modal-header']",
      "color"
    );

    addAndVerifyColor(
      "Body background color",
      "#ffffffff",
      data.bodyColor,
      "[data-cy='modal-body']"
    );

    addAndVerifyColor(
      "Trigger button background color",
      "#4D72FA",
      data.buttonColor,
      launchButton("modal1"),
      "background-color"
    );

    addAndVerifyColor(
      "Trigger button text color",
      "#ffffffff",
      data.buttonTextColor,
      launchButton("modal1"),
      "color"
    );

    closeModal("modal1");
    launchModal("modal1");
    typeOnFx(
      commonWidgetText.parameterVisibility,
      "{{components.toggleswitch1.value"
    );
    cy.get("[data-cy='modal-header']").realClick();
    cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();

    typeOnFx(
      commonWidgetText.parameterDisable,
      "{{components.toggleswitch2.value"
    );
    cy.get('[data-cy="sidebar-option-properties"]').click();

    typeOnFx("Loading State", "{{components.toggleswitch3.value");
    cy.get("[data-cy='modal-header']").realClick();

    typeOnFx("Hide title bar", "{{components.toggleswitch4.value");
    cy.get("[data-cy='modal-header']").realClick();

    typeOnFx("Hide close button", "{{components.toggleswitch5.value");
    cy.get("[data-cy='modal-header']").realClick();
    cy.waitForAutoSave();
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.wait(2000);

    cy.notVisible(launchButton("modal1"));
    cy.get(commonWidgetSelector.draggableWidget("toggleswitch1"))
      .find(".form-check-input")
      .click();
    cy.get(launchButton("modal1")).should("be.visible");

    cy.get(commonWidgetSelector.draggableWidget("toggleswitch2"))
      .find(".form-check-input")
      .click();
    cy.get(launchButton("modal1")).should("have.attr", "disabled");
    cy.get(commonWidgetSelector.draggableWidget("toggleswitch2"))
      .find(".form-check-input")
      .click();
    cy.get(commonWidgetSelector.draggableWidget("toggleswitch3"))
      .find(".form-check-input")
      .click();
    launchModal("modal1");
    cy.get(".spinner-border").should("be.visible");
    cy.realPress("Escape");

    cy.get(commonWidgetSelector.draggableWidget("toggleswitch3"))
      .find(".form-check-input")
      .click();

    cy.get(commonWidgetSelector.draggableWidget("toggleswitch4"))
      .find(".form-check-input")
      .click();
    launchModal("modal1");
    cy.notVisible('[data-cy="modal-title"]');
    cy.realPress("Escape");

    cy.get(commonWidgetSelector.draggableWidget("toggleswitch4"))
      .find(".form-check-input")
      .click();
    launchModal("modal1");
    verifyWidgetColorCss(
      "[data-cy='modal-header']",
      "background-color",
      data.bgColor,
      true
    );
    verifyWidgetColorCss(
      "[data-cy='modal-header']",
      "color",
      data.titleColor,
      true
    );
    verifyWidgetColorCss(
      "[data-cy='modal-body']",
      "background-color",
      data.bodyColor,
      true
    );

    cy.realPress("Escape");
    verifyWidgetColorCss(
      launchButton("modal1"),
      "color",
      data.buttonTextColor,
      true
    );
    verifyWidgetColorCss(
      launchButton("modal1"),
      "background-color",
      data.buttonColor,
      true
    );
    launchModal("modal1");

    cy.get('[data-cy="modal-title"]').verifyVisibleElement(
      "have.text",
      data.customTitle
    );
    cy.realPress("Escape");
    cy.get(commonWidgetSelector.draggableWidget("toggleswitch5"))
      .find(".form-check-input")
      .click();
    launchModal("modal1");
    cy.wait(1000);
    cy.notVisible('[data-cy="modal-close-button"]');
  });

  it("should verify csa", () => {
    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 200);
    selectEvent("On click", "Control Component");
    selectCSA("modal1", "open");

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get('[data-cy="modal-title"]').verifyVisibleElement(
      "have.text",
      "This title can be changed"
    );

    cy.get(".close-svg > path").click();
    cy.dragAndDropWidget("Button", 500, 300, "Button", "[id*=canvas]:eq(2)");
    selectEvent("On click", "Control Component");
    selectCSA("modal1", "close");
    // cy.realPress("Escape");
    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.notVisible('[data-cy="modal-close-button"]');
  });
});
