import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
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
} from "Support/utils/commonWidget";

// Canvas facet — the Modal's lifecycle on the canvas: drop, move, resize, nudge,
// duplicate (keyboard + menu), copy-paste, cut, multi-select, rename, delete +
// undo/redo. Uses the generic canvas helpers (proven across components).
// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec
// run); each test re-creates its own app in beforeEach.
describe("Modal — canvas facet", { testIsolation: false, retries: { runMode: 2, openMode: 0 } }, () => {
  const W = "modal1";

  beforeEach(() => {
    cy.apiLogin();
    cy.apiCreateApp(`${fake.companyName}-Modal-Canvas`);
    cy.openApp();
    cy.dragAndDropWidget("Modal");
  });
  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("drag-and-drop places the widget", () => {
    cy.get(commonWidgetSelector.draggableWidget(W)).should("exist");
    verifyWidgetCount("modal", 1);
  });

  it("move repositions the widget", () => {
    getWidgetRect(W).as("r0");
    cy.get("@r0").then((before) => {
      cy.moveComponent(W, 650, 450);
      verifyWidgetMoved(W, before);
    });
  });

  it("resize changes the widget dimensions", () => {
    getWidgetRect(W).as("r0");
    cy.get("@r0").then((before) => {
      cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 90);
      verifyWidgetResized(W, before);
    });
  });

  it("nudge (arrow keys) moves the widget", () => {
    getWidgetRect(W).as("r0");
    cy.get("@r0").then((before) => {
      nudgeWidget(W, "ArrowRight", 12);
      verifyWidgetMoved(W, before);
    });
  });

  it("duplicate via keyboard (Cmd/Ctrl+D)", () => {
    duplicateWidgetByKeyboard(W);
    verifyWidgetCount("modal", 2);
  });

  it("duplicate via ⋮ menu", () => {
    duplicateWidgetFromMenu(W);
    verifyWidgetCount("modal", 2);
  });

  it.skip("copy-paste (Cmd/Ctrl+C then +V)", () => {
    copyPasteWidget(W);
    verifyWidgetCount("modal", 2);
  });

  it.skip("cut removes the widget, paste restores it", () => {
    cutWidget(W); // asserts removal internally
    cy.forceClickOnCanvas();
    pasteWidget();
    cy.get(commonWidgetSelector.draggableWidget(W)).should("exist");
  });

  it("multi-select then select-all", () => {
    cy.get('[data-cy="right-sidebar-components-button"]').click();
    cy.dragAndDropWidget("Modal", 650, 300);

    multiSelectWidgets(["modal1", "modal2"]);
    verifySelectedWidgetCount(2);

    selectAllWidgets();
    verifySelectedWidgetCount(2);
    cy.get(".moveable-area").should("exist");
  });

  it("rename via ⋮ menu", () => {
    renameWidgetFromMenu(W, "dialogbox"); // asserts new name internally
    cy.get(commonWidgetSelector.draggableWidget(W)).should("not.exist");
  });

  it("delete via ⋮ menu, undo restores, redo removes", () => {
    deleteWidgetFromMenu(W);
    cy.get(commonWidgetSelector.draggableWidget(W)).should("not.exist");
    undo();
    cy.get(commonWidgetSelector.draggableWidget(W)).should("exist");
    redo();
    cy.get(commonWidgetSelector.draggableWidget(W)).should("not.exist");
  });
});
