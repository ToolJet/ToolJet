// UI 2.0 browser QA: the same app lays out the same in the editor and in the preview (each widget's top and height
// within 1px), and the same in the light and dark themes. The canvas is capped at 1100px so the editor canvas and the
// preview canvas have the same width at 1600 and 1280; otherwise fitted widgets would wrap differently for a
// legitimate reason. See ./README.md.
import { ui2Widgets, widgetByType } from "Support/utils/appBuilder/ui2/widgets";
import { ui2Login, sweepStaleApps, createUi2App, buildGallery, setTheme, openViewer, openEditor, deleteUi2App } from "Support/utils/appBuilder/ui2/app";
import { measureBoxes, TOL } from "Support/utils/appBuilder/ui2/geometry";
import { resetReport, assertNoFailures } from "Support/utils/appBuilder/ui2/report";
import { knownFailure } from "Support/utils/appBuilder/ui2/known";
import { SIZES, galleryName, galleryNames, itFor, narrowed } from "Support/utils/appBuilder/ui2/suites";

const CANVAS_WIDTH = 1100;

/**
 * Compares one widget's two gallery instances between measurement a and b. A top that moved only because a widget
 * above changed height is not this widget's fault: tops are compared after removing the shift of the placement just
 * above, and skipped when that one already differs in height.
 */
const compare = (placements, a, b, widget, labels) => {
  const failures = [];
  const ordered = [...placements].sort((x, y) => x.layout.top - y.layout.top || x.layout.left - y.layout.left);
  SIZES.forEach((size) => {
    const name = galleryName(widget, size);
    const ma = a[name];
    const mb = b[name];
    if (!ma || !mb) {
      failures.push(`${size}: not rendered in ${!ma ? labels[0] : labels[1]}`);
      return;
    }
    if (Math.abs(ma.height - mb.height) > TOL.parity)
      failures.push(`${size}: height ${ma.height}px in the ${labels[0]}, ${mb.height}px in the ${labels[1]}`);
    if (Math.abs(ma.width - mb.width) > TOL.parity)
      failures.push(`${size}: width ${ma.width}px in the ${labels[0]}, ${mb.width}px in the ${labels[1]} (canvas widths differ?)`);
    const i = ordered.findIndex((p) => p.name === name);
    const above = ordered.slice(0, i).reverse().find((p) => a[p.name] && b[p.name] && p.layout.left === ordered[i].layout.left);
    const shift = (m) => (above ? m.canvasTop - m.aboveTop : m.canvasTop);
    const aboveA = above && a[above.name];
    const aboveB = above && b[above.name];
    const aboveDiffers = above && Math.abs(aboveA.height - aboveB.height) > TOL.parity;
    if (!aboveDiffers) {
      const ta = shift({ canvasTop: ma.canvasTop, aboveTop: aboveA?.canvasTop });
      const tb = shift({ canvasTop: mb.canvasTop, aboveTop: aboveB?.canvasTop });
      if (Math.abs(ta - tb) > TOL.parity)
        failures.push(`${size}: top ${ma.canvasTop}px in the ${labels[0]}, ${mb.canvasTop}px in the ${labels[1]} (${Math.round((tb - ta) * 10) / 10}px apart${above ? ` relative to ${above.name} above` : ""})`);
    }
  });
  return failures;
};

describe("UI 2.0 editor and preview lay a widget out the same", { testIsolation: false }, () => {
  const widgets = ui2Widgets();
  const names = galleryNames(widgets);
  let placements = [];
  const m = {};

  before(() => {
    resetReport();
    ui2Login();
    sweepStaleApps();
    createUi2App("parity");
    buildGallery(widgets, (t) => widgetByType(t)).then((p) => (placements = p));
    cy.apiUpdateGlobalSettings({ canvasMaxWidth: CANVAS_WIDTH, canvasMaxWidthType: "px" });
  });
  after(() => deleteUi2App());

  narrowed([1600, 1280], "ui2_widths").forEach((width) => {
    describe(`editor vs preview, light theme, ${width}px wide`, () => {
      before(() => {
        setTheme("light");
        cy.viewport(width, 1000);
        openViewer(names);
        cy.window().then((win) => (m[`viewer${width}`] = measureBoxes(win, names)));
        openEditor(names);
        cy.window().then((win) => (m[`editor${width}`] = measureBoxes(win, names)));
      });
      widgets.forEach((widget) => {
        const known = knownFailure("parity", widget.type, { width });
        itFor(known)(`${widget.displayName} (${widget.type}) has the same top and height in the editor and the preview${known ? ` [known: ${known}]` : ""}`, () => {
          const failures = compare(placements, m[`editor${width}`], m[`viewer${width}`], widget, ["editor", "preview"]);
          const data = Object.fromEntries(SIZES.map((s) => [s, { editor: m[`editor${width}`][galleryName(widget, s)], preview: m[`viewer${width}`][galleryName(widget, s)] }]));
          assertNoFailures({ check: "parity", widget: widget.type, mode: "editor-vs-preview", width, theme: "light", failures, data, known }, `[data-cy="draggable-widget-${galleryName(widget, "default")}"]`);
        });
      });
    });
  });

  describe("light vs dark preview, 1600px wide", () => {
    before(() => {
      cy.viewport(1600, 1000);
      setTheme("light");
      openViewer(names);
      cy.window().then((win) => (m.light = measureBoxes(win, names)));
      setTheme("dark");
      openViewer(names);
      cy.window().then((win) => (m.dark = measureBoxes(win, names)));
    });
    widgets.forEach((widget) => {
      const known = knownFailure("themeParity", widget.type);
      itFor(known)(`${widget.displayName} (${widget.type}) has the same top and height in the light and dark themes${known ? ` [known: ${known}]` : ""}`, () => {
        const failures = compare(placements, m.light, m.dark, widget, ["light theme", "dark theme"]);
        const data = Object.fromEntries(SIZES.map((s) => [s, { light: m.light[galleryName(widget, s)], dark: m.dark[galleryName(widget, s)] }]));
        assertNoFailures({ check: "themeParity", widget: widget.type, mode: "viewer", width: 1600, theme: "light-vs-dark", failures, data, known }, `[data-cy="draggable-widget-${galleryName(widget, "default")}"]`);
      });
    });
  });
});
