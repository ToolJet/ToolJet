import { forEachTheme, openEditor, openPanel, seedPanelApp, settledValue } from "Support/utils/appBuilder/panelAudit";

// After any drag or expand of the runtime drawer, the canvas and the left panel end where the drawer
// starts. QA measured a 65px dead strip after a fast drag (PL-35).
const appName = `drawer-resize-${Date.now()}`;
const DRAWER = ".runtime-panel-content";

const edges = (doc) => ({
  drawer: Math.round(doc.querySelector(DRAWER).getBoundingClientRect().top),
  canvas: Math.round(doc.querySelector("#sidebar-page-navigation > div").getBoundingClientRect().bottom),
  left: Math.round(doc.querySelector(".left-sidebar-panel-content").getBoundingClientRect().bottom),
});

const expectFlush = () =>
  settledValue(edges).then(({ drawer, canvas, left }) => {
    expect(Math.abs(canvas - drawer), `canvas bottom ${canvas} vs drawer top ${drawer}`).to.be.at.most(1);
    expect(Math.abs(left - drawer), `left panel bottom ${left} vs drawer top ${drawer}`).to.be.at.most(1);
  });

// Released on the same frame as the last move, while the drawer is still animating to its new height.
const fastDrag = (by) =>
  cy.get(DRAWER).then(($drawer) => {
    const top = Math.round($drawer[0].getBoundingClientRect().top);
    cy.document().trigger("mousemove", { clientX: 700, clientY: top + 1 });
    cy.get(DRAWER).trigger("mousedown", { clientX: 700, clientY: top + 1 });
    cy.document().trigger("mousemove", { clientX: 700, clientY: top + by });
    cy.document().trigger("mouseup", { clientX: 700, clientY: top + by });
  });

describe("Runtime drawer resize", { testIsolation: false }, () => {
  before(() => {
    cy.clearAllLocalStorage();
    seedPanelApp(appName);
  });
  after(() => cy.apiDeleteApp());

  forEachTheme((theme) =>
    describe(theme, () => {
      beforeEach(() => {
        // Every journey starts from the default drawer height, not the last drag's.
        cy.window().then((win) => win.localStorage.removeItem("runtimePanelPreferences"));
        openEditor(theme);
        openPanel("pages");
        openPanel("inspect");
        settledValue(edges);
      });

      it(`[PL-35] a fast drag up leaves canvas, left panel and drawer flush (${theme})`, () => {
        fastDrag(-150);
        expectFlush();
      });

      it(`[PL-35] a fast drag down leaves canvas, left panel and drawer flush (${theme})`, () => {
        fastDrag(120);
        expectFlush();
      });

      it(`[PL-35] reopening the drawer reserves its full height (${theme})`, () => {
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        cy.get(DRAWER).should("have.class", "collapsed");
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        cy.get(DRAWER).should("have.class", "expanded");
        expectFlush();
      });
    })
  );
});
