// Shared bodies of the data-driven specs, so the viewer and editor variants stay one definition.
import { ui2Widgets, widgetByType } from "./widgets";
import { ui2Login, sweepStaleApps, createUi2App, buildGallery, setTheme, openViewer, openEditor, deleteUi2App, smallHeight } from "./app";
import { measureWidget, geometryFailures } from "./geometry";
import { resetReport, assertNoFailures } from "./report";
import { knownFailure } from "./known";

export const SIZES = ["default", "small"];
export const galleryName = (widget, size) => `${widget.base}${size === "default" ? "d" : "s"}`;

/** Every widget's two gallery names, for waiting on the page. */
export const galleryNames = (widgets) => widgets.flatMap((w) => SIZES.map((s) => galleryName(w, s)));

/** A list narrowed by a comma-separated env value (CYPRESS_ui2_widths=1600, CYPRESS_ui2_themes=dark). */
export const narrowed = (list, envKey) => {
  const want = String(Cypress.env(envKey) || "").split(",").map((s) => s.trim()).filter(Boolean);
  return want.length ? list.filter((v) => want.includes(String(v))) : list;
};

/** `it`, or `it.skip` for a tracked failure when CYPRESS_ui2_skip_known is set. */
export const itFor = (known) => (known && Cypress.env("ui2_skip_known") ? it.skip : it);

/**
 * Fill and containment for every widget, at its default size and at the small fixed size (Dynamic height off), in one
 * mode ('viewer' | 'editor'), at each width and theme. One test per widget per width and theme.
 */
export const geometrySuite = (mode, { widths, themes }) => {
  const widgets = ui2Widgets();
  const names = galleryNames(widgets);
  describe(`UI 2.0 widget fill and containment in the ${mode}`, { testIsolation: false }, () => {
    before(() => {
      resetReport();
      ui2Login();
      sweepStaleApps();
      createUi2App(`geometry ${mode}`);
      buildGallery(widgets, (t) => widgetByType(t));
    });
    after(() => deleteUi2App());

    narrowed(themes, "ui2_themes").forEach((theme) =>
      narrowed(widths, "ui2_widths").forEach((width) => {
        describe(`${theme} theme, ${width}px wide`, () => {
          before(() => {
            setTheme(theme);
            cy.viewport(width, 1000);
            (mode === "editor" ? openEditor : openViewer)(names);
          });
          widgets.forEach((widget) => {
            const known = knownFailure("geometry", widget.type, { mode, width, theme });
            itFor(known)(`${widget.displayName} (${widget.type}) fills its box, paints nothing outside it, scrolls what does not fit${known ? ` [known: ${known}]` : ""}`, () => {
              const failures = [];
              const data = {};
              SIZES.forEach((size) => {
                const name = galleryName(widget, size);
                cy.get(`[data-cy="draggable-widget-${name}"]`).first().scrollIntoView({ offset: { top: -120, left: 0 } });
                cy.wait(150, { log: false });
                cy.window({ log: false }).then((win) => {
                  const m = measureWidget(win, name);
                  data[size] = m;
                  geometryFailures(m).forEach((f) => failures.push(`${size} (${size === "small" ? `${smallHeight(widget)}px` : `${widget.defaultSize.height}px`}): ${f}`));
                });
              });
              cy.then(() =>
                assertNoFailures(
                  { check: "geometry", widget: widget.type, mode, width, theme, failures, data, known },
                  `[data-cy="draggable-widget-${galleryName(widget, failures[0]?.startsWith("small") ? "small" : "default")}"]`
                )
              );
            });
          });
        });
      })
    );
  });
};
