// UI 2.0 browser QA: state transitions. A loading cycle (loadingState on, then off) keeps what was typed in a List
// view's rows and in a Dialog, and no widget's height jumps through it (sampled every frame, not just before and
// after). In the editor, switching tabs keeps the Tabs selected and the inspector never falls back to "Add new
// component". See ./README.md.
import { ui2Widgets, widgetByType } from "Support/utils/appBuilder/ui2/widgets";
import { ui2Login, sweepStaleApps, createUi2App, componentEntry, defaultChildren, postComponents, openViewer, openEditor, deleteUi2App } from "Support/utils/appBuilder/ui2/app";
import { findWidget, TOL } from "Support/utils/appBuilder/ui2/geometry";
import { resetReport, assertNoFailures } from "Support/utils/appBuilder/ui2/report";
import { knownFailure } from "Support/utils/appBuilder/ui2/known";
import { itFor } from "Support/utils/appBuilder/ui2/suites";

const LOADING = "{{components.loading.value}}";
const SWITCH = '[data-cy="draggable-widget-loading"] [role="switch"]';
const uuid = () => crypto.randomUUID();
const loadingWidgets = ui2Widgets().filter((w) => w.hasLoading);
const heightName = (w) => `${w.base}h`;

/**
 * Samples every named box's height on each animation frame for `ms`, in the app's window, so a jump that lasts a few
 * frames is seen too. Resolves { min, max, gone } per name.
 */
const startSampling = (win, names, ms) => {
  const min = {};
  const max = {};
  const gone = {};
  const t0 = win.performance.now();
  win.__ui2Sampling = new Promise((resolve) => {
    const tick = () => {
      names.forEach((n) => {
        const f = findWidget(win.document, n);
        if (!f) {
          gone[n] = true;
          return;
        }
        const h = Math.round(f.box.getBoundingClientRect().height * 10) / 10;
        min[n] = Math.min(min[n] ?? h, h);
        max[n] = Math.max(max[n] ?? h, h);
      });
      if (win.performance.now() - t0 < ms) win.requestAnimationFrame(tick);
      else resolve({ min, max, gone });
    };
    tick();
  });
};

/** Turns the loading switch on or off (force: an open Dialog's backdrop covers it, and a real click would land there). */
const setLoading = (on) => {
  cy.get(SWITCH).then(($s) => {
    if (($s.attr("aria-checked") === "true") !== on) cy.wrap($s).click({ force: true });
  });
  cy.get(SWITCH).should("have.attr", "aria-checked", String(on));
};

describe("UI 2.0 state transitions", { testIsolation: false }, () => {
  const ids = {};

  before(() => {
    resetReport();
    ui2Login();
    sweepStaleApps();
    createUi2App("transitions");
    cy.then(() => {
      const diff = {};
      const add = (type, opts) => {
        const id = uuid();
        diff[id] = componentEntry(widgetByType(type), opts);
        ids[opts.name] = id;
        return id;
      };
      add("ShadSwitch", { name: "loading", top: 10, properties: { label: "Loading" } });
      // A List view whose rows each hold an input, loading bound to the switch.
      const list = widgetByType("ShadListView");
      const listId = add("ShadListView", { name: "list", top: 50, properties: { loadingState: LOADING, rowHeight: "{{130}}" } });
      defaultChildren(list, listId, "list", widgetByType).forEach(([cid, c]) => (diff[cid] = c));
      // Below the default row content (avatar, name, email, badge), so nothing covers it.
      add("ShadInput", { name: "rowinput", top: 76, left: 5, width: 20, height: 40, parent: listId, properties: { label: "", placeholder: "Row draft" } });
      // A Dialog with an input in its body, loading bound to the switch.
      const dialog = widgetByType("ShadDialog");
      const dlgId = add("ShadDialog", { name: "dlg", top: 520, properties: { loadingState: LOADING } });
      defaultChildren(dialog, dlgId, "dlg", widgetByType).forEach(([cid, c]) => (diff[cid] = c));
      add("ShadInput", { name: "dlginput", top: 20, left: 1, width: 30, height: 70, parent: dlgId, properties: { label: "Draft" } });
      // Every widget with a loading state, at its default size, loading bound to the switch.
      let top = 600;
      loadingWidgets.forEach((w) => {
        add(w.type, { name: heightName(w), top, properties: { loadingState: LOADING } });
        top += w.defaultSize.height + 20;
      });
      postComponents(diff);
    });
  });
  after(() => deleteUi2App());

  describe("loading cycle in the viewer, 1600px wide", () => {
    before(() => {
      cy.viewport(1600, 1000);
      openViewer(["loading", "list", "dlg", ...loadingWidgets.map(heightName)]);
    });

    it("List view rows keep typed drafts through a loading cycle", () => {
      const failures = [];
      const data = {};
      cy.get('[data-cy="draggable-widget-rowinput"] input').should("have.length.gte", 2);
      cy.get('[data-cy="draggable-widget-rowinput"] input').eq(0).clear().type("first row draft");
      cy.get('[data-cy="draggable-widget-rowinput"] input').eq(1).clear().type("second row draft");
      cy.get('[data-cy="draggable-widget-rowinput"] input').then(($i) => (data.rowsBefore = $i.length));
      setLoading(true);
      // The rows are hidden under the loading look (still mounted).
      cy.get('[data-cy="draggable-widget-list"] [aria-hidden="true"], [data-cy="draggable-widget-list"] [aria-busy="true"]', { timeout: 5000 }).should("exist");
      cy.wait(600);
      setLoading(false);
      cy.wait(600);
      cy.get("body").then(($b) => {
        const inputs = $b.find('[data-cy="draggable-widget-rowinput"] input');
        data.rowsAfter = inputs.length;
        data.values = inputs.toArray().map((i) => i.value);
        if (data.rowsAfter !== data.rowsBefore) failures.push(`${data.rowsBefore} row inputs before the loading cycle, ${data.rowsAfter} after`);
        if (data.values[0] !== "first row draft") failures.push(`first row's draft is "${data.values[0] ?? "(gone)"}" after the loading cycle`);
        if (data.values[1] !== "second row draft") failures.push(`second row's draft is "${data.values[1] ?? "(gone)"}" after the loading cycle`);
        assertNoFailures({ check: "transitions", widget: "ShadListView", size: "drafts", mode: "viewer", width: 1600, theme: "light", failures, data }, '[data-cy="draggable-widget-list"]');
      });
    });

    it("Dialog keeps a typed draft, stays open and keeps its height through a loading cycle", () => {
      const failures = [];
      const data = {};
      const dialogOf = ($b) => $b.find('[data-cy="draggable-widget-dlginput"]').closest(".modal-content, [role='dialog']")[0];
      cy.get('[data-cy="draggable-widget-dlg"]').find("button").first().click();
      cy.get('[data-cy="draggable-widget-dlginput"] input', { timeout: 10000 }).should("be.visible").clear().type("dialog draft");
      cy.get("body").then(($b) => (data.heightBefore = Math.round(dialogOf($b).getBoundingClientRect().height)));
      setLoading(true);
      cy.wait(800);
      cy.get("body").then(($b) => {
        const d = dialogOf($b);
        data.openWhileLoading = Boolean(d);
        data.heightWhileLoading = d ? Math.round(d.getBoundingClientRect().height) : null;
      });
      setLoading(false);
      cy.wait(800);
      cy.get("body").then(($b) => {
        const input = $b.find('[data-cy="draggable-widget-dlginput"] input')[0];
        const d = input && input.closest(".modal-content, [role='dialog']");
        data.value = input?.value;
        data.heightAfter = d ? Math.round(d.getBoundingClientRect().height) : null;
        if (!data.openWhileLoading) failures.push("the dialog closed (or lost its body) when loading started");
        if (!input) failures.push("the dialog's input is gone after the loading cycle");
        else if (data.value !== "dialog draft") failures.push(`the dialog's draft is "${data.value}" after the loading cycle`);
        [data.heightWhileLoading, data.heightAfter].forEach((h, i) => {
          if (h !== null && Math.abs(h - data.heightBefore) > TOL.parity)
            failures.push(`dialog height ${data.heightBefore}px before, ${h}px ${i ? "after" : "while loading"}`);
        });
        assertNoFailures({ check: "transitions", widget: "ShadDialog", size: "drafts", mode: "viewer", width: 1600, theme: "light", failures, data }, '[data-cy="draggable-widget-dlginput"]');
      });
    });
    // Closes the Dialog (also after a failed case) so the next cases see the page.
    afterEach(() => {
      cy.get("body").then(($b) => {
        if ($b.find('[data-cy="draggable-widget-dlginput"]:visible').length) cy.realPress("Escape");
      });
    });

    describe("no height jump through a loading cycle", () => {
      let samples;
      before(() => {
        cy.get('[data-cy="draggable-widget-dlginput"]:visible').should("not.exist");
        cy.scrollTo("top", { ensureScrollable: false });
        cy.window().then((win) => startSampling(win, loadingWidgets.map(heightName), 4000));
        setLoading(true);
        cy.wait(1500);
        setLoading(false);
        cy.window().then((win) => cy.wrap(win.__ui2Sampling, { timeout: 15000 }).then((s) => (samples = s)));
      });
      loadingWidgets.forEach((w) => {
        const known = knownFailure("loadingHeight", w.type);
        itFor(known)(`${w.displayName} (${w.type}) keeps its height through a loading cycle${known ? ` [known: ${known}]` : ""}`, () => {
          const n = heightName(w);
          const failures = [];
          if (samples.gone[n]) failures.push("the widget left the page during the loading cycle");
          if (samples.max[n] - samples.min[n] > TOL.parity) failures.push(`height moved between ${samples.min[n]}px and ${samples.max[n]}px during the loading cycle`);
          assertNoFailures({ check: "loadingHeight", widget: w.type, mode: "viewer", width: 1600, theme: "light", failures, data: { min: samples.min[n], max: samples.max[n] }, known }, `[data-cy="draggable-widget-${n}"]`);
        });
      });
    });
  });

  describe("Tabs in the editor, 1600px wide", () => {
    const HEADER = ".panel-header-title";
    // Watches the inspector for every frame of a tab switch: did it ever show "Add new component"?
    const watchInspector = (win, ms) => {
      win.__ui2Flicker = new Promise((resolve) => {
        let seen = 0;
        const t0 = win.performance.now();
        const tick = () => {
          const shown = [...win.document.querySelectorAll(HEADER)].some((e) => /Add new component/.test(e.textContent) && e.getClientRects().length);
          if (shown) seen += 1;
          if (win.performance.now() - t0 < ms) win.requestAnimationFrame(tick);
          else resolve(seen);
        };
        tick();
      });
    };
    const selectedName = () =>
      cy.get("body").then(($b) => {
        const input = $b.find('[data-cy="edit-widget-name"], .inspector-edit-widget-name input, input.inspector-edit-widget-name').filter(":visible")[0];
        return input ? input.value : null;
      });

    // Its own small app: an editor page that also holds the loading gallery makes every command slow.
    before(() => {
      deleteUi2App();
      createUi2App("tabs editor");
      cy.then(() => {
        const tabsId = uuid();
        postComponents({
          [tabsId]: componentEntry(widgetByType("ShadTabs"), { name: "tabs", top: 20 }),
          [uuid()]: componentEntry(widgetByType("ShadInput"), { name: "tabinput", top: 20, left: 1, width: 20, height: 70, parent: `${tabsId}-t1`, properties: { label: "In tab 2" } }),
        });
      });
      cy.viewport(1600, 1000);
      openEditor(["tabs"]);
    });

    it("switching tabs keeps the Tabs selected and never shows Add new component", () => {
      const failures = [];
      const data = { selected: [] };
      cy.get('[data-cy="draggable-widget-tabs"] [role="tab"]').eq(0).realClick();
      selectedName().then((n) => data.selected.push(n));
      cy.window().then((win) => watchInspector(win, 3000));
      [1, 2, 0].forEach((i) => {
        cy.get('[data-cy="draggable-widget-tabs"] [role="tab"]').eq(i).realClick();
        cy.get('[data-cy="draggable-widget-tabs"] [role="tab"]').eq(i).should("have.attr", "aria-selected", "true");
        cy.wait(400);
        selectedName().then((n) => data.selected.push(n));
      });
      cy.window().then((win) => cy.wrap(win.__ui2Flicker, { timeout: 10000 }).then((frames) => (data.addNewComponentFrames = frames)));
      cy.then(() => {
        if (data.addNewComponentFrames) failures.push(`the inspector showed "Add new component" for ${data.addNewComponentFrames} frame(s) while switching tabs`);
        data.selected.forEach((n, i) => n !== "tabs" && failures.push(`after switch ${i}, the inspector shows "${n ?? "nothing"}" instead of the Tabs`));
        assertNoFailures({ check: "transitions", widget: "ShadTabs", size: "editor-selection", mode: "editor", width: 1600, theme: "light", failures, data }, '[data-cy="draggable-widget-tabs"]');
      });
    });

    it("switching away from a tab whose child is selected selects the Tabs, not nothing", () => {
      const failures = [];
      const data = {};
      cy.get('[data-cy="draggable-widget-tabs"] [role="tab"]').eq(1).realClick();
      cy.get('[data-cy="draggable-widget-tabinput"]').should("be.visible").realClick({ position: "topLeft" });
      selectedName().then((n) => (data.childSelected = n));
      cy.get('[data-cy="draggable-widget-tabs"] [role="tab"]').eq(0).realClick();
      cy.wait(500);
      selectedName().then((n) => (data.afterSwitch = n));
      cy.get("body").then(($b) => {
        data.addNewComponent = $b.find(HEADER).filter(":visible").toArray().some((e) => /Add new component/.test(e.textContent));
        if (data.childSelected !== "tabinput") failures.push(`clicking the input in tab 2 selected "${data.childSelected}" (setup)`);
        if (data.afterSwitch !== "tabs") failures.push(`after switching tabs the inspector shows "${data.afterSwitch ?? "nothing"}" instead of the Tabs`);
        if (data.addNewComponent) failures.push('the inspector shows "Add new component"');
        assertNoFailures({ check: "transitions", widget: "ShadTabs", size: "child-selection", mode: "editor", width: 1600, theme: "light", failures, data }, '[data-cy="draggable-widget-tabs"]');
      });
    });
  });
});
