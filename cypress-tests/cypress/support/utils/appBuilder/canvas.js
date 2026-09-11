// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// canvas.js
//   copyWidget                       -                    → canvas
//   pasteWidget                      -                    → canvas
//   copyPasteWidget                  -                    → canvas
//   duplicateWidgetByKeyboard        -                    → canvas
//   openComponentInspectorMenu       -                    → canvas
//   selectComponentInspectorMenuOption -                    → canvas
//   duplicateWidgetFromMenu          -                    → canvas
//   renameWidgetFromMenu             -                    → canvas
//   deleteWidgetFromMenu             -                    → canvas
//   selectAllWidgets                 -                    → canvas
//   multiSelectWidgets               -                    → canvas
//   verifySelectedWidgetCount        -                    → canvas
//   undo                             -                    → canvas
//   redo                             -                    → canvas
//   nudgeWidget                      -                    → canvas
//   cutWidget                        -                    → canvas
//   getWidgetRect                    -                    → canvas
//   verifyWidgetMoved                -                    → canvas
//   verifyWidgetResized              -                    → canvas
//   verifyWidgetCount                -                    → canvas
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/canvas: on-canvas **component lifecycle** helpers
 * (copy · paste · duplicate · menu actions). Complements the canvas COMMANDS
 * cy.dragAndDropWidget / cy.moveComponent / cy.resizeWidget / cy.getPosition.
 * FOR AI: to clone a widget choose the mechanism the case names —
 *   keyboard copy-paste → copyPasteWidget (Cmd/Ctrl+C then +V)
 *   keyboard duplicate  → duplicateWidgetByKeyboard (Cmd/Ctrl+D)
 *   ⋮ inspector menu     → duplicateWidgetFromMenu / selectComponentInspectorMenuOption
 * The clone is always the next auto-name (button1 → button2). Delete via
 * deleteWidgetFromMenu (⋮ menu) or the existing deleteComponentAndVerify
 * (config-handle trash) in basicComponents.js.
 * MODIFIER: the shortcut modifier is platform-aware — Meta (Cmd) on macOS,
 * Control elsewhere (Linux CI) — because ToolJet binds the "mod" combo.
 * CAVEAT (verified): in headless Chrome the pasted/duplicated clone is created
 * with DEFAULT config — clipboard read returns empty for paste, and this build
 * has a clone-persistence gap for Cmd+D / menu Duplicate. These helpers assert
 * the clone is CREATED (+ toast), NOT that live property edits carry over.
 * NOT here: styling → styles.js · properties → properties.js · exposed-value
 * tree / inspector-delete → inspectorTree.js.
 */
import { commonWidgetSelector, commonSelectors } from "Selectors/common";
import { openEditorSidebar } from "./properties";

// Meta (Cmd) on macOS, Control on Linux/Windows CI — ToolJet binds "mod".
const modKey = () => (Cypress.platform === "darwin" ? "Meta" : "Control");

/**
 * @tjBlock  canvas
 * @tjUsage  copyWidget('button1')
 * @tjDom    select widget on canvas → Cmd/Ctrl+C → "Component copied successfully" toast
 */
export const copyWidget = (widgetName) => {
  cy.forceClickOnCanvas();
  // Select the widget ON THE CANVAS so it is the editor's active component when
  // the copy fires (otherwise the copy captures nothing).
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .first()
    .click({ force: true });
  openEditorSidebar(widgetName);
  cy.realPress([modKey(), "c"]);
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "Component copied successfully"
  );
};

/**
 * @tjBlock  canvas
 * @tjUsage  pasteWidget()                                            // onto the root canvas
 *           pasteWidget('[data-cy="draggable-widget-container1"]>')  // into a container
 * @tjDom    focus paste target → Cmd/Ctrl+V → pasted clone appears
 */
export const pasteWidget = (targetSelector = '[data-cy="real-canvas"]') => {
  cy.get(targetSelector).realPress([modKey(), "v"]);
  // The clone lands on top of the original; give the editor a beat to render it.
  cy.wait(1000);
};

/**
 * @tjBlock  canvas
 * @tjUsage  copyPasteWidget('button1')   // clones button1 → button2 via clipboard
 */
export const copyPasteWidget = (widgetName) => {
  copyWidget(widgetName);
  cy.forceClickOnCanvas();
  pasteWidget();
};

/**
 * @tjBlock  canvas
 * @tjUsage  duplicateWidgetByKeyboard('button1')
 * @tjDom    select widget → Cmd/Ctrl+D → "Component cloned successfully" toast
 */
export const duplicateWidgetByKeyboard = (widgetName) => {
  cy.forceClickOnCanvas();
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .first()
    .click({ force: true });
  openEditorSidebar(widgetName);
  cy.realPress([modKey(), "d"]);
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "Component cloned successfully"
  );
};

/**
 * @tjBlock  canvas
 * @tjUsage  openComponentInspectorMenu('button1')
 * @tjDom    openEditorSidebar → component-inspector-options (⋮) button
 */
export const openComponentInspectorMenu = (widgetName) => {
  openEditorSidebar(widgetName);
  cy.get('[data-cy="component-inspector-options"]').click();
};

/**
 * @tjBlock  canvas
 * @tjUsage  selectComponentInspectorMenuOption('button1', 'duplicate')
 *           option ∈ inspect | rename | duplicate | permission | delete
 * @tjDom    ⋮ menu → component-inspector-<option>-button
 */
export const selectComponentInspectorMenuOption = (widgetName, option) => {
  openComponentInspectorMenu(widgetName);
  cy.get(`[data-cy="component-inspector-${option}-button"]`).click();
};

/**
 * @tjBlock  canvas
 * @tjUsage  duplicateWidgetFromMenu('button1')
 * @tjDom    ⋮ menu → Duplicate → "Component cloned successfully" toast
 */
export const duplicateWidgetFromMenu = (widgetName) => {
  selectComponentInspectorMenuOption(widgetName, "duplicate");
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "Component cloned successfully"
  );
};

/**
 * @tjBlock  canvas
 * @tjUsage  renameWidgetFromMenu('button1', 'submitBtn')
 * @tjDom    ⋮ menu → Rename → inline edit-widget-name input → type + Enter
 */
export const renameWidgetFromMenu = (widgetName, newName) => {
  selectComponentInspectorMenuOption(widgetName, "rename");
  cy.get('[data-cy="edit-widget-name"]')
    .should("be.visible")
    .clear()
    .type(newName)
    .blur();
  // The rename commits on BLUR — pressing Enter alone does NOT apply it
  // (verified via probe). Click the canvas to force the blur/commit.
  cy.forceClickOnCanvas();
  cy.wait(500);
  cy.get(commonWidgetSelector.draggableWidget(newName)).should("exist");
};

/**
 * @tjBlock  canvas
 * @tjUsage  deleteWidgetFromMenu('button1')
 * @tjDom    ⋮ menu → Delete → confirm modal-component → Yes
 */
export const deleteWidgetFromMenu = (widgetName) => {
  selectComponentInspectorMenuOption(widgetName, "delete");
  // Deleting from the ⋮ menu raises the same confirmation modal as the
  // config-handle trash (deleteComponentAndVerify) — confirm it.
  cy.get('[data-cy="modal-component"]').should("be.visible");
  cy.get(commonSelectors.yesButton).click();
  cy.wait(1000);
};

/**
 * @tjBlock  canvas
 * @tjUsage  selectAllWidgets()   // Cmd/Ctrl+A — selects every widget on the canvas
 * @tjDom    click empty canvas → Cmd/Ctrl+A → each wrapper gains `.active-target`
 *           + a group `.moveable-area` box appears
 */
export const selectAllWidgets = () => {
  cy.forceClickOnCanvas();
  cy.get('[data-cy="real-canvas"]')
    .click("topLeft", { force: true })
    .realPress([modKey(), "a"]);
  cy.wait(500);
};

/**
 * @tjBlock  canvas
 * @tjUsage  multiSelectWidgets(['button1', 'button2'])
 * @tjDom    click the first widget, shift-click the rest → each selected
 *           wrapper gains `.active-target`
 */
export const multiSelectWidgets = (widgetNames = []) => {
  cy.forceClickOnCanvas();
  widgetNames.forEach((name, i) => {
    cy.get(commonWidgetSelector.draggableWidget(name)).click(
      i === 0 ? { force: true } : { shiftKey: true, force: true }
    );
  });
  cy.wait(300);
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifySelectedWidgetCount(2)   // after selectAll / multiSelect
 * @tjDom    counts `[component-type].active-target` (selected wrappers)
 */
export const verifySelectedWidgetCount = (expectedCount) => {
  cy.get("[component-type].active-target").should("have.length", expectedCount);
};

/**
 * @tjBlock  canvas
 * @tjUsage  undo()   // Cmd/Ctrl+Z — reverts the last canvas action
 * @tjDom    focus canvas → Cmd/Ctrl+Z
 */
export const undo = () => {
  cy.get('[data-cy="real-canvas"]').realPress([modKey(), "z"]);
  cy.wait(500);
};

/**
 * @tjBlock  canvas
 * @tjUsage  redo()   // Cmd/Ctrl+Shift+Z — re-applies the last undone action
 * @tjDom    focus canvas → Cmd/Ctrl+Shift+Z
 */
export const redo = () => {
  cy.get('[data-cy="real-canvas"]').realPress([modKey(), "Shift", "z"]);
  cy.wait(500);
};

/**
 * @tjBlock  canvas
 * @tjUsage  nudgeWidget('button1', 'ArrowRight', 10)   // arrow-key move the selected widget
 *           direction ∈ ArrowUp | ArrowDown | ArrowLeft | ArrowRight
 * @tjDom    select widget → press an arrow key `times` (each press nudges 1px)
 */
export const nudgeWidget = (widgetName, direction = "ArrowRight", times = 1) => {
  cy.forceClickOnCanvas();
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .first()
    .click({ force: true });
  for (let i = 0; i < times; i++) {
    cy.realPress(direction);
  }
  cy.wait(300);
};

/**
 * @tjBlock  canvas
 * @tjUsage  cutWidget('button1')   // removes it from canvas; pasteWidget() restores it
 * @tjDom    select widget → Cmd/Ctrl+X → widget removed (NO toast, unlike copy)
 */
export const cutWidget = (widgetName) => {
  cy.forceClickOnCanvas();
  cy.get(commonWidgetSelector.draggableWidget(widgetName))
    .first()
    .click({ force: true });
  openEditorSidebar(widgetName);
  cy.realPress([modKey(), "x"]);
  // Cut removes the widget from the canvas immediately (no confirmation, no
  // toast) and holds it on the clipboard for a subsequent pasteWidget().
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should("not.exist");
};

/**
 * @tjBlock  canvas
 * @tjUsage  getWidgetRect('button1').as('r0')   // capture BEFORE a move/resize
 * @tjDom    reads a placed widget's bounding rect → {x, y, w, h} (rounded)
 */
export const getWidgetRect = (widgetName) =>
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).then(($w) => {
    const r = $w[0].getBoundingClientRect();
    return {
      x: Math.round(r.x),
      y: Math.round(r.y),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  });

/**
 * @tjBlock  canvas
 * @tjUsage  verifyWidgetMoved('button1', before)   // before = getWidgetRect result
 * @tjDom    asserts the widget's x OR y differs from the captured rect (>2px)
 */
export const verifyWidgetMoved = (widgetName, before) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(($w) => {
    const r = $w[0].getBoundingClientRect();
    const movedX = Math.abs(Math.round(r.x) - before.x) > 2;
    const movedY = Math.abs(Math.round(r.y) - before.y) > 2;
    expect(movedX || movedY, "widget position changed").to.be.true;
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifyWidgetResized('button1', before) // before = getWidgetRect result
 * @tjDom    asserts the widget's width OR height differs from the captured rect (>2px)
 */
export const verifyWidgetResized = (widgetName, before) => {
  cy.get(commonWidgetSelector.draggableWidget(widgetName)).should(($w) => {
    const r = $w[0].getBoundingClientRect();
    const dW = Math.abs(Math.round(r.width) - before.w) > 2;
    const dH = Math.abs(Math.round(r.height) - before.h) > 2;
    expect(dW || dH, "widget size changed").to.be.true;
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  verifyWidgetCount('button', 2)   // button1 + button2 after a clone
 * @tjDom    asserts N placed widgets whose name starts with the given prefix
 */
export const verifyWidgetCount = (namePrefix, expectedCount) => {
  cy.get(`[data-cy^="draggable-widget-${namePrefix}"]`).should(
    "have.length",
    expectedCount
  );
};
