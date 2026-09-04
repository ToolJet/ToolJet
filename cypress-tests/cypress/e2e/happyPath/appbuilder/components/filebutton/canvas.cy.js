import { fake } from "Fixtures/fake";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";
import { fileButtonSelector } from "Selectors/appBuilder/components/fileButton";
import { fileButtonText } from "Texts/appBuilder/components/fileButton";
import {
  getWidgetRect,
  verifyWidgetMoved,
  verifyWidgetResized,
  verifyWidgetCount,
  duplicateWidgetByKeyboard,
  duplicateWidgetFromMenu,
  copyPasteWidget,
  cutWidget,
  pasteWidget,
  nudgeWidget,
  selectAllWidgets,
  multiSelectWidgets,
  verifySelectedWidgetCount,
  renameWidgetFromMenu,
  deleteWidgetFromMenu,
  undo,
  redo,
  waitForDropSettle,
} from "Support/utils/commonWidget";

// Canvas facet — component lifecycle. Config-independent: no config.properties or
// config.styles item is exercised here, so there is nothing to cite.
// Covers: drop placement · move · resize · nudge · duplicate (keyboard + menu) ·
//         copy-paste · cut/paste · multi-select + select-all · rename · delete+undo/redo
// KNOWN RED: the two clipboard cases — see the block above them.
// Only the widget name and the drop-placement assertion are File-Button-specific.
describe(
  "File Button canvas",
  { testIsolation: false, retries: { runMode: 3, openMode: 0 } },
  () => {
  const widget = fileButtonText.defaultWidgetName;
  const namePrefix = "filebutton"; // duplicates land as filebutton2, filebutton3, ...
  const dropX = 500;
  const dropY = 100;

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-${Date.now()}-Filebutton-App`);
    cy.openApp();
    cy.dragAndDropWidget(fileButtonText.defaultWidgetText, dropX, dropY);
    waitForDropSettle(widget);
    closeQueryPanel();
  });

  afterEach(function () {
    if (this.currentTest.state === "passed") cy.apiDeleteApp();
  });

  it("drag-and-drop places the widget where it was dropped", () => {
    cy.get(fileButtonSelector.draggableWidget(widget)).should("exist");
    verifyWidgetCount(namePrefix, 1);

    // dropX/dropY are canvas-relative top-left; getBoundingClientRect() is
    // viewport-absolute — measure both sides canvas-relative instead. Tolerance
    // is the snap-grid half-cell (appCanvasUtils.js snapToGrid): X's grid width
    // depends on canvas width (read live), Y's is fixed at 10 so drift is <=5.
    cy.get("#real-canvas").then(($canvas) => {
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

  it("move repositions the widget", () => {
    getWidgetRect(widget).as("r0");
    cy.get("@r0").then((before) => {
      cy.moveComponent(widget, 650, 450);
      verifyWidgetMoved(widget, before);
    });
  });

  it("resize changes the widget dimensions", () => {
    getWidgetRect(widget).as("r0");
    cy.get("@r0").then((before) => {
      cy.resizeWidget(widget, before.x + before.w + 160, before.y + before.h + 90);
      verifyWidgetResized(widget, before);
    });
  });

  it("nudge (arrow keys) moves the widget", () => {
    getWidgetRect(widget).as("r0");
    cy.get("@r0").then((before) => {
      nudgeWidget(widget, "ArrowRight", 12);
      verifyWidgetMoved(widget, before);
    });
  });

  it("duplicate via keyboard (Cmd/Ctrl+D)", () => {
    duplicateWidgetByKeyboard(widget);
    verifyWidgetCount(namePrefix, 2);
  });

  it("duplicate via the component menu", () => {
    duplicateWidgetFromMenu(widget);
    verifyWidgetCount(namePrefix, 2);
  });

  // ── HEADLESS-ONLY failures — the shared helpers are CORRECT ─────────────────
  // These two fail under `cypress run` (headless) and PASS under `--headed` — measured
  // 2026-09-04: 11/11 headed vs 9/11 headless. pasteWidget() drives
  // realPress([mod,'v']), which needs a real browser window to reach the SYSTEM
  // clipboard; headless has none. Note cutWidget's own internal assertion still passes
  // either way, because Cmd+X removes the widget whether or not the clipboard write
  // landed — so the failure only ever surfaces at the paste.
  //
  // Not a File Button issue and not a helper bug: checkbox, numberInput, passwordInput
  // and textInput canvas specs all fail the same two tests in CI, because CI is
  // headless. Do not "fix" them here. The open decision belongs to the shared
  // canvas.js owner: tag these headed-only, or reimplement via the clipboard API
  // instead of real key events.
  it("copy-paste (Cmd/Ctrl+C then +V)", () => {
    copyPasteWidget(widget);
    verifyWidgetCount(namePrefix, 2);
  });

  it("cut removes the widget, paste restores it", () => {
    cutWidget(widget); // asserts removal internally
    cy.forceClickOnCanvas();
    pasteWidget();
    cy.get(fileButtonSelector.draggableWidget(widget)).should("exist");
  });

  it("multi-select then select-all", () => {
    // The Components panel button is a TOGGLE — click it shut before dragAndDropWidget
    // re-opens it.
    cy.get('[data-cy="right-sidebar-components-button"]').click();
    cy.dragAndDropWidget(fileButtonText.defaultWidgetText, 650, 300);
    waitForDropSettle("filebutton2");
    closeQueryPanel();

    multiSelectWidgets([widget, "filebutton2"]);
    verifySelectedWidgetCount(2);

    selectAllWidgets();
    verifySelectedWidgetCount(2);
    cy.get(".moveable-area").should("exist");
  });

  it("rename via the component menu", () => {
    renameWidgetFromMenu(widget, "uploadcsv"); // asserts the new name internally
    cy.get(fileButtonSelector.draggableWidget(widget)).should("not.exist");
  });

  it("delete via the component menu, undo restores, redo removes", () => {
    deleteWidgetFromMenu(widget);
    cy.get(fileButtonSelector.draggableWidget(widget)).should("not.exist");
    undo();
    cy.get(fileButtonSelector.draggableWidget(widget)).should("exist");
    redo();
    cy.get(fileButtonSelector.draggableWidget(widget)).should("not.exist");
  });
});
