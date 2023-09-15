import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { openEditorSidebar } from "Support/utils/commonWidget";
import {
  selectCSA,
  selectEvent,
  addSupportCSAData,
} from "Support/utils/events";
import {
  openAccordion,
  addDefaultEventHandler,
  verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";
import { verifyComponent } from "Support/utils/basicComponents";
import { commonWidgetText } from "Texts/common";

describe("Editor- CSA", () => {
  const toolJetImage = "cypress/fixtures/Image/tooljet.png";
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp();
    cy.openApp();
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("Should verify Tabs CSA", () => {
    cy.dragAndDropWidget("Tabs", 100, 5);
    cy.get(".nav-link").eq(0).verifyVisibleElement("have.class", "active");
    cy.get(".nav-link").eq(1).verifyVisibleElement("not.have.class", "active");
    cy.get(".nav-link").eq(2).verifyVisibleElement("not.have.class", "active");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 870, 200);
    selectEvent("On click", "Control Component");
    selectCSA("tabs1", "Set current tab");
    addSupportCSAData("Id", "2");

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(".nav-link").eq(0).verifyVisibleElement("not.have.class", "active");
    cy.get(".nav-link").eq(1).verifyVisibleElement("not.have.class", "active");
    cy.get(".nav-link").eq(2).verifyVisibleElement("have.class", "active");
  });

  it("Should verify Form CSA", () => {
    cy.dragAndDropWidget("Form", 200, 100);
    verifyComponent("form1");
    addDefaultEventHandler("Form submitted successfully");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 600, 100);
    selectEvent("On click", "Control Component");
    selectCSA("form1", "Submit Form");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 700, 100);
    selectEvent("On click", "Control Component");
    selectCSA("form1", "Reset Form");

    openEditorSidebar("form1");
    cy.get('[data-cy="button-to-submit-form-fx-button"] > svg').click();
    cy.get(
      '[data-cy="button-to-submit-form-input-field"]'
    ).clearAndTypeOnCodeMirror(`{{components.button2`);
    cy.get('[data-cy="draggable-widget-textinput1"]').click().type("Nick");
    cy.get('[data-cy="draggable-widget-numberinput1"]')
      .click()
      .type(`{selectAll}{backspace}30{enter}`);
    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Form submitted successfully"
    );

    cy.get('[data-cy="draggable-widget-textinput1"]').click().type("Mike");
    cy.get('[data-cy="draggable-widget-numberinput1"]')
      .click()
      .type(`{selectAll}{backspace}20{enter}`);
    cy.get(commonWidgetSelector.draggableWidget("button3")).click();
    cy.get('[data-cy="draggable-widget-numberinput1"]').should(
      "have.value",
      "24"
    );
  });

  it("Should verify Dropdown CSA", () => {
    cy.dragAndDropWidget("Dropdown", 200, 100);
    verifyComponent("dropdown1");
    cy.get(
      '[data-cy="draggable-widget-dropdown1"] .css-1qrxvr1-singleValue'
    ).should("have.text", "two");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 870, 200);
    selectEvent("On click", "Control Component");
    selectCSA("dropdown1", "Select option");
    addSupportCSAData("Select", "{{3");

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(
      '[data-cy="draggable-widget-dropdown1"] .css-1qrxvr1-singleValue'
    ).should("have.text", "three");
  });

  it("Should verify Textarea CSA", () => {
    cy.dragAndDropWidget("Textarea", 200, 100);
    verifyComponent("textarea1");
    cy.get(commonWidgetSelector.draggableWidget("textarea1"))
      .should("be.visible")
      .and(
        "have.text",
        "ToolJet is an open-source low-code platform for building and deploying internal tools with minimal engineering efforts 🚀"
      );

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 500, 100);
    selectEvent("On click", "Control Component");
    selectCSA("textarea1", "Set Text");
    addSupportCSAData("text", "New Text");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 700, 100);
    selectEvent("On click", "Control Component");
    selectCSA("textarea1", "Clear");

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(commonWidgetSelector.draggableWidget("textarea1"))
      .should("be.visible")
      .and("have.text", "New Text");

    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.get(commonWidgetSelector.draggableWidget("textarea1"))
      .should("be.visible")
      .and("have.text", "");
  });

  it("Should verify Filepicker CSA", () => {
    cy.dragAndDropWidget("File Picker", 200, 100);
    verifyComponent("filepicker1");
    cy.get(
      `${commonWidgetSelector.draggableWidget("filepicker1")} input`
    ).selectFile(toolJetImage, {
      force: true,
    });

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 700, 100);
    selectEvent("On click", "Control Component");
    selectCSA("filepicker1", "Clear Files");

    cy.forceClickOnCanvas();
    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.get(`${commonWidgetSelector.draggableWidget("filepicker1")} p`).should(
      "have.text",
      "Drag and Drop some files here, or click to select files"
    );
  });

  it("Should verify Icon CSA", () => {
    cy.dragAndDropWidget("Icon", 200, 250);
    verifyComponent("icon1");
    openAccordion(commonWidgetText.accordionEvents);
    addDefaultEventHandler("Clicked on icon successfully");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 500, 100);
    selectEvent("On click", "Control Component");
    selectCSA("icon1", "Click");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 500, 200);
    selectEvent("On click", "Control Component");
    selectCSA("icon1", "Set Visibility");
    cy.get('[data-cy="Value-toggle-button"]')
      .should("be.visible")
      .and("be.checked");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 500, 300);
    selectEvent("On click", "Control Component");
    selectCSA("icon1", "Set Visibility");
    cy.get('[data-cy="Value-toggle-button"]').click();
    cy.get('[data-cy="Value-toggle-button"]')
      .should("be.visible")
      .and("not.be.checked");

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Clicked on icon successfully"
    );

    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.get('[data-cy="draggable-widget-icon1"]').should("be.visible");

    cy.get(commonWidgetSelector.draggableWidget("button3")).click();
    cy.get('[data-cy="draggable-widget-icon1"]').should("not.be.visible");
  });

  it("Should verify Kanban CSA", () => {
    cy.viewport(1400, 1900);

    cy.dragAndDropWidget("Kanban", 50, 400);
    addDefaultEventHandler("Card updated successfully");
    selectEvent(
      "Card added",
      "Show Alert",
      0,
      commonWidgetSelector.addMoreEventHandlerLink,
      1
    );
    cy.get(commonWidgetSelector.alertMessageInputField)
      .find('[data-cy*="-input-field"]')
      .eq(0)
      .clearAndTypeOnCodeMirror("Card added successfully");
    selectEvent(
      "Card removed",
      "Show Alert",
      0,
      commonWidgetSelector.addMoreEventHandlerLink,
      2
    );
    cy.get(commonWidgetSelector.alertMessageInputField)
      .find('[data-cy*="-input-field"]')
      .eq(0)
      .clearAndTypeOnCodeMirror("Card removed successfully");
    selectEvent(
      "Card moved",
      "Show Alert",
      0,
      commonWidgetSelector.addMoreEventHandlerLink,
      3
    );
    cy.get(commonWidgetSelector.alertMessageInputField)
      .find('[data-cy*="-input-field"]')
      .eq(0)
      .clearAndTypeOnCodeMirror("Card moved successfully");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 100, 200);
    selectEvent("On click", "Control Component");
    selectCSA("kanban1", "Add Card");
    addSupportCSAData(
      "Card Details",
      `{{{ id: "c11", title: "New Card", description: "Add new card", columnId: "r1" }`
    );

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 250, 200);
    selectEvent("On click", "Control Component");
    selectCSA("kanban1", "Delete Card");
    addSupportCSAData("Card Id", "c11");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 350, 200);
    selectEvent("On click", "Control Component");
    selectCSA("kanban1", "Move Card");
    addSupportCSAData("Card Id", "c1");
    addSupportCSAData("Destination Column Id", "r2");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 450, 200);
    selectEvent("On click", "Control Component");
    selectCSA("kanban1", "Update Card Data");
    addSupportCSAData("Card Id", "c1");
    addSupportCSAData(
      "Value",
      '{{{ id: "c1", title: "New Title", description: "Updated Title", columnId: "r1" }'
    );

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Card added successfully"
    );
    cy.get('[label="To Do"] .kanban-item [data-cy="draggable-widget-text1"]')
      .last()
      .verifyVisibleElement("have.text", "New Card");

    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Card removed successfully"
    );
    cy.contains(
      '[label="To Do"] .kanban-item [data-cy="draggable-widget-text1"]',
      "New Card"
    ).should("not.exist");

    cy.get('[label="To Do"] .kanban-item [data-cy="draggable-widget-text1"]')
      .first()
      .verifyVisibleElement("have.text", "Title 1");

    cy.get(commonWidgetSelector.draggableWidget("button3")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Card moved successfully"
    );
    cy.get(
      '[label="In Progress"] .kanban-item [data-cy="draggable-widget-text1"]'
    )
      .first()
      .verifyVisibleElement("have.text", "Title 1");

    cy.get(commonWidgetSelector.draggableWidget("button4")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Card updated successfully"
    );
    cy.get(
      '[label="In Progress"] .kanban-item [data-cy="draggable-widget-text1"]'
    )
      .first()
      .verifyVisibleElement("have.text", "New Title");
  });

  it("Should verify Radio Button CSA", () => {
    cy.dragAndDropWidget("Radio Button", 200, 100);
    verifyComponent("radiobutton1");
    addDefaultEventHandler("Radio button clicked successfully");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 500, 100);
    selectEvent("On click", "Control Component");
    selectCSA("radiobutton1", "Select Option");
    addSupportCSAData("Option", "{{false");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 700, 100);
    selectEvent("On click", "Control Component");
    selectCSA("radiobutton1", "Select Option");
    addSupportCSAData("Option", "{{true");

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Radio button clicked successfully"
    );

    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Radio button clicked successfully"
    );
  });

  it("Should verify Checkbox CSA", () => {
    cy.dragAndDropWidget("Checkbox", 200, 100);
    verifyComponent("checkbox1");
    addDefaultEventHandler("Checked successfully");
    cy.forceClickOnCanvas();
    openEditorSidebar("checkbox1");
    selectEvent(
      "On uncheck",
      "Show Alert",
      0,
      commonWidgetSelector.addMoreEventHandlerLink,
      1
    );
    cy.get(commonWidgetSelector.alertMessageInputField)
      .find('[data-cy*="-input-field"]')
      .eq(0)
      .clearAndTypeOnCodeMirror("Unchecked successfully");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 500, 100);
    selectEvent("On click", "Control Component");
    selectCSA("checkbox1", "Set checked");
    addSupportCSAData("status", "{{true");

    cy.get('[data-cy="real-canvas"]').click("topRight", { force: true });
    cy.dragAndDropWidget("Button", 700, 100);
    selectEvent("On click", "Control Component");
    selectCSA("checkbox1", "Set checked");
    addSupportCSAData("status", "{{false");

    cy.get(commonWidgetSelector.draggableWidget("button1")).click();
    cy.verifyToastMessage(commonSelectors.toastMessage, "Checked successfully");

    cy.get(commonWidgetSelector.draggableWidget("button2")).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Unchecked successfully"
    );
  });
});
