import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileButtonSelector } from "Selectors/fileButton";
import {
  openAndVerifyNode,
  openNode,
  verifyNodes,
  verifyNodeData,
} from "Support/utils/inspector";
import { openEditorSidebar, openAccordion, verifyAndModifyParameter } from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd's drag intercept goes stale on AUT
// reset; each test still creates its own fresh app in beforeEach.
describe(
  "File Button component specific",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = "filebutton1";
  const dropX = 500;
  const dropY = 100;

  // Canvas keeps settling after a drop — poll position until it stops before acting.
  const waitForDropSettle = (widgetName, attemptsLeft = 6) => {
    cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el) => {
      const top = $el[0].getBoundingClientRect().top;
      cy.wrap(null).then(() => {
        cy.wait(150);
        cy.get(`[data-cy="draggable-widget-${widgetName}"]`).then(($el2) => {
          const top2 = $el2[0].getBoundingClientRect().top;
          if (Math.abs(top2 - top) > 1 && attemptsLeft > 0) {
            waitForDropSettle(widgetName, attemptsLeft - 1);
          }
        });
      });
    });
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget("File button", dropX, dropY);
    waitForDropSettle(widget);
  });

  it("should file button render properly", () => {
    cy.get(fileButtonSelector.draggableWidget(widget)).should("exist");
    cy.get(fileButtonSelector.button(widget)).should("be.visible");
    // targetX/targetY are canvas-relative top-left; getBoundingClientRect() is
    // viewport-absolute — measure both sides canvas-relative instead. Tolerance
    // is the snap-grid half-cell (appCanvasUtils.js snapToGrid): X's grid width
    // depends on canvas width (read live), Y's is fixed at 10 so drift is ≤5.
    cy.get('#real-canvas').then(($canvas) => {
      const canvasRect = $canvas[0].getBoundingClientRect();
      const gridX = canvasRect.width / 43;
      const maxDriftX = gridX / 2;
      const maxDriftY = 5; // half of the fixed 10px Y-grid

      cy.get(fileButtonSelector.draggableWidget(widget)).then(($widget) => {
        const widgetRect = $widget[0].getBoundingClientRect();
        expect(widgetRect.left - canvasRect.left).to.be.closeTo(dropX, maxDriftX);
        expect(widgetRect.top - canvasRect.top).to.be.closeTo(dropY, maxDriftY);
      });
    });
  });

  it("should verify the initial exposed values and functions on inspector", () => {
    const functions = [
      { key: "clear", type: "Function" },
      { key: "setFocus", type: "Function" },
      { key: "setBlur", type: "Function" },
      { key: "setVisibility", type: "Function" },
      { key: "setDisable", type: "Function" },
      { key: "setLoading", type: "Function" },
    ];
    const exposedValues = [
      { key: "files", type: "Array", value: "[0]" },
      { key: "isParsing", type: "Boolean", value: "false" },
      { key: "isValid", type: "Boolean", value: "true" },
      { key: "isMandatory", type: "Boolean", value: "false" },
      { key: "isLoading", type: "Boolean", value: "false" },
      { key: "isVisible", type: "Boolean", value: "true" },
      { key: "isDisabled", type: "Boolean", value: "false" },
    ];

    cy.get(commonWidgetSelector.sidebarinspector).click();
    cy.hideTooltip();
    openNode("components");
    openAndVerifyNode(widget, exposedValues, verifyNodeData);
    verifyNodes(functions, verifyNodeData);
  });

  it("should render the default label and icon, with no optional elements", () => {
    cy.get(fileButtonSelector.label(widget)).should("have.text", "Upload file");
    cy.get(fileButtonSelector.icon(widget)).should("be.visible");
    cy.get(fileButtonSelector.clearButton(widget)).should("not.exist");
    cy.get(fileButtonSelector.invalidFeedback(widget)).should("not.exist");
    cy.get(fileButtonSelector.loader(widget)).should("not.exist");
    cy.get(fileButtonSelector.mandatoryIndicator(widget)).should("not.exist");
  });

  it("should keep a property edit after a reload", () => {
    openEditorSidebar(widget);
    verifyAndModifyParameter("Button text", "Survives Reload");
    cy.forceClickOnCanvas();
    cy.waitForAutoSave();

    openEditorSidebar(widget);
    openAccordion("Additional Actions");
    cy.get(commonWidgetSelector.parameterTogglebutton("Disable")).click();
    cy.waitForAutoSave();

    cy.get(fileButtonSelector.label(widget)).should("have.text", "Survives Reload");
    cy.get(fileButtonSelector.button(widget)).should("be.disabled");

    cy.reload();

    cy.get(fileButtonSelector.label(widget)).should("have.text", "Survives Reload");
    cy.get(fileButtonSelector.button(widget)).should("be.disabled");
  });
});
