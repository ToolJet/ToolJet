// UI 2.0 browser QA: every widget dropped from the components panel lands a whole number of grid rows tall. Each
// widget is dragged onto the canvas with the suite's real HTML5 drag (cy.dragAndDropWidget), measured, then deleted
// before the next one. See ./README.md.
import { ui2Widgets, GRID_ROW } from "Support/utils/appBuilder/ui2/widgets";
import { ui2Login, sweepStaleApps, createUi2App, deleteUi2App } from "Support/utils/appBuilder/ui2/app";
import { findWidget } from "Support/utils/appBuilder/ui2/geometry";
import { resetReport, assertNoFailures } from "Support/utils/appBuilder/ui2/report";
import { knownFailure } from "Support/utils/appBuilder/ui2/known";
import { itFor } from "Support/utils/appBuilder/ui2/suites";

// One real drop per widget, all in one app: cypress-real-dnd keeps its CDP client for the spec run, so the tests
// share the page (see datePickerHappyPath.cy.js and CYPRESS_REAL_DND_FIX.md).
describe("UI 2.0 widgets drop on the grid", { testIsolation: false }, () => {
  const widgets = ui2Widgets();

  before(() => {
    resetReport();
    ui2Login();
    sweepStaleApps();
    createUi2App("grid");
    // The empty-canvas label the default selector waits for is not drawn in a UI 2.0 app, and openApp waits only 10s:
    // open with a selector that is there at once, then wait for the canvas.
    cy.then(() => cy.openApp("", Cypress.env("workspaceId"), Cypress.env("ui2App").appId, "body"));
    cy.get("#real-canvas", { timeout: 60000 }).should("exist");
  });
  after(() => deleteUi2App());

  widgets.forEach((widget) => {
    const known = knownFailure("grid", widget.type);
    itFor(known)(
      `${widget.displayName} (${widget.type}) is dropped a multiple of ${GRID_ROW}px tall${known ? ` [known: ${known}]` : ""}`,
      () => {
        const name = `${widget.base}1`;
        const sel = `[data-cy="draggable-widget-${name}"]`;
        cy.dragAndDropWidget(widget.displayName, 80, 80);
        cy.get(sel, { timeout: 20000 }).should("exist");
        cy.wait(800, { log: false }); // dynamic-height widgets settle their box after the first paint
        const failures = [];
        const data = { configHeight: widget.defaultSize.height };
        cy.window({ log: false }).then((win) => {
          const found = findWidget(win.document, name);
          data.boxHeight = Math.round(found.box.getBoundingClientRect().height * 10) / 10;
        });
        // The saved layout: what the drop wrote for the canvas to render on reload.
        cy.apiGetAppData().then((app) => {
          const page = app.pages.find((p) => p.id === Cypress.env("ui2App").pageId) || app.pages[0];
          const saved = Object.values(page.components).find((c) => c.component.name === name);
          data.savedHeight = saved?.layouts?.desktop?.height;
          const dyn = saved?.component?.definition?.properties?.dynamicHeight?.value;
          data.dynamicHeightAtDrop = /true/.test(String(dyn));
        });
        cy.then(() => {
          if (data.savedHeight % GRID_ROW !== 0)
            failures.push(`saved layout height ${data.savedHeight}px is not a multiple of ${GRID_ROW}px (config defaultSize ${data.configHeight}px)`);
          // With Dynamic height on, the box follows its content; only the saved height is on the grid then.
          if (!data.dynamicHeightAtDrop && Math.abs(data.boxHeight - Math.round(data.boxHeight / GRID_ROW) * GRID_ROW) > 0.5)
            failures.push(`rendered box is ${data.boxHeight}px tall, not a multiple of ${GRID_ROW}px`);
          if (!data.dynamicHeightAtDrop && Math.abs(data.boxHeight - data.savedHeight) > 0.5)
            failures.push(`rendered box is ${data.boxHeight}px tall but the saved layout says ${data.savedHeight}px`);
          assertNoFailures({ check: "grid", widget: widget.type, mode: "editor", width: 1440, failures, data, known }, sel);
        });
      }
    );
  });

  // dragAndDropWidget clicks the components button, which toggles the panel; after a delete the editor already shows
  // the panel, so close it first or the click would hide it.
  beforeEach(() => {
    cy.get("body").then(($b) => {
      if ($b.find("[data-cy='widget-search-box-search-bar']:visible").length) cy.get('[data-cy="right-sidebar-components-button"]').click();
    });
    cy.get("[data-cy='widget-search-box-search-bar']:visible").should("not.exist");
  });

  // Each widget is removed again (children with it) so the next drop lands on an empty canvas and gets the name
  // `<base>1`.
  afterEach(() => {
    cy.get("body").then(($body) => {
      const box = $body.find('[data-cy^="draggable-widget-"]').filter((_, e) => !e.closest('[id^="canvas-"]'));
      if (!box.length) return;
      const name = box.first().attr("data-cy").replace("draggable-widget-", "");
      cy.get(`[data-cy="draggable-widget-${name}"]`).first().click({ force: true });
      cy.get(`[data-cy="${name}-delete-component-button"]`).first().click({ force: true });
      // "Are you sure you want to delete this component?"
      cy.contains(".modal.show button, [role='dialog'] button", /^Yes$/).click();
      cy.get(`[data-cy="draggable-widget-${name}"]`, { timeout: 10000 }).should("not.exist");
      cy.waitForAutoSave();
    });
  });
});
