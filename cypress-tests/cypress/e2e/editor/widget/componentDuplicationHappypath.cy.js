import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { buttonText } from "Texts/button";

import { addBasicData, verifyBasicData } from "Support/utils/button";

import { openEditorSidebar } from "Support/utils/commonWidget";

describe("Editor- component duplication", () => {
  const data = {};
  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-App`);
    cy.openApp();
    cy.dragAndDropWidget(buttonText.defaultWidgetText, 500, 500);

    data.appName = `${fake.companyName}-App`;
    data.alertMessage = fake.randomSentence;
    data.widgetName = fake.widgetName;
    data.customMessage = fake.randomSentence;
    data.backgroundColor = fake.randomRgba;
    data.textColor = fake.randomRgba;
    data.loaderColor = fake.randomRgba;
    data.boxShadowColor = fake.randomRgba;
    data.boxShadowParam = fake.boxShadowParam;
    data.tooltipText = fake.randomSentence;
  });
  afterEach(() => {
    cy.apiDeleteApp(`${fake.companyName}-App`);
  });
  it("should verify duplication using copy and paste", () => {
    addBasicData(data);
    cy.forceClickOnCanvas();
    openEditorSidebar("button1");
    cy.realPress(["Control", "c"]);
    cy.moveComponent("button1", 200, 200);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Component copied successfully"
    );
    cy.forceClickOnCanvas();

    cy.get('[data-cy="real-canvas"]').realPress(["Control", "v"]);

    verifyBasicData("button2", data);

    cy.reload();
    cy.wait(2500);
    verifyBasicData("button2", data);
  });
  it("should verify componen paste to container", () => {
    addBasicData(data);
    cy.forceClickOnCanvas();
    openEditorSidebar("button1");
    cy.realPress(["Control", "c"]);
    cy.moveComponent("button1", 200, 90);
    cy.dragAndDropWidget("Container", 300, 200);
    cy.resizeWidget("container1", 800, 500);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Component copied successfully",
      false
    );
    cy.forceClickOnCanvas();
    openEditorSidebar("container1");
    cy.get(`${commonWidgetSelector.draggableWidget("container1")}>`)
      .click({ force: true })
      .within(() => {
        cy.realPress(["Control", "v"]);
        cy.wait(1000);
        cy.get(commonWidgetSelector.draggableWidget("button2")).should(
          "be.visible"
        );
      });
    verifyBasicData("button2", data);
  });

  it("should verify duplication using right side panel", () => {
    addBasicData(data);
    cy.forceClickOnCanvas();
    openEditorSidebar("button1");
    cy.get('[data-cy="component-inspector-options"]>').click();
    cy.get('[data-cy="component-inspector-duplicate-button"]').click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Component cloned succesfully"
    );
    cy.moveComponent("button1", 200, 200);
    cy.forceClickOnCanvas();
    cy.wait(1000);
    verifyBasicData("button2", data);
  });

  it("should verify duplication using keyboard", () => {
    addBasicData(data);
    cy.forceClickOnCanvas();
    openEditorSidebar("button1");
    cy.realPress(["Control", "d"]);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      "Component cloned succesfully"
    );
    cy.moveComponent("button1", 200, 200);
    cy.forceClickOnCanvas();
    cy.wait(1000);
    verifyBasicData("button2", data);

    cy.reload();
    cy.wait(2500);
    verifyBasicData("button2", data);
  });
});
