// UI 2.0 browser QA: a widget's parts sit where they belong: a Switch thumb inside its track (on and off), Slider
// thumbs on the track, every date picker day column the same width (Saturday and Sunday included) under its heading,
// a straight Tabs underline, centred chips, and a few cheap neighbours (checkbox, radio dots, rating stars, progress
// indicator). In the viewer in both themes and in the editor. See ./README.md.
import { widgetByType } from "Support/utils/appBuilder/ui2/widgets";
import { ui2Login, sweepStaleApps, createUi2App, componentEntry, postComponents, setTheme, openViewer, openEditor, deleteUi2App } from "Support/utils/appBuilder/ui2/app";
import * as parts from "Support/utils/appBuilder/ui2/parts";
import { findWidget, measureWidget, geometryFailures } from "Support/utils/appBuilder/ui2/geometry";
import { resetReport, assertNoFailures } from "Support/utils/appBuilder/ui2/report";
import { knownFailure } from "Support/utils/appBuilder/ui2/known";
import { itFor, narrowed } from "Support/utils/appBuilder/ui2/suites";

// name, widget type, property overrides, the check, and how to open the part first (if it lives in a popover).
const CASES = [
  { name: "switchoff", type: "ShadSwitch", what: "Switch thumb inside its track while off", check: parts.switchThumb },
  { name: "switchon", type: "ShadSwitch", props: { defaultChecked: "{{true}}" }, what: "Switch thumb inside its track while on", check: parts.switchThumb },
  { name: "slider", type: "ShadSlider", what: "Slider thumb on its track", check: parts.sliderThumbs },
  { name: "sliderrange", type: "ShadSlider", props: { range: "{{true}}", defaultValue: "{{[20, 80]}}" }, what: "Range slider thumbs on their track", check: parts.sliderThumbs },
  { name: "calendar", type: "ShadCalendar", what: "Calendar day columns all one width, under their headings", check: (win, n) => parts.dayColumns(findWidget(win.document, n)?.el) },
  { name: "datepicker", type: "ShadDatePicker", what: "Date picker day columns all one width, under their headings", open: true, check: (win) => parts.popoverDayColumns(win) },
  { name: "datetimepicker", type: "ShadDateTimePicker", what: "Date and time picker day columns all one width, under their headings", open: true, check: (win) => parts.popoverDayColumns(win) },
  { name: "tabsunderline", type: "ShadTabs", props: { variant: "underline" }, what: "Tabs underline straight and on the tab list's line", check: parts.tabsUnderline },
  { name: "tags", type: "ShadTags", what: "Tags chips centred", check: parts.chipsCentred },
  { name: "tagsinput", type: "ShadTagsInput", props: { defaultValue: "{{['react', 'node']}}" }, what: "Tags input chips centred in the field", check: parts.chipsCentred },
  { name: "multiselect", type: "ShadMultiselect", what: "Multiselect chips centred in the field", check: parts.chipsCentred },
  { name: "checkbox", type: "ShadCheckbox", what: "Checkbox box on its label's line", check: parts.checkboxAligned },
  { name: "radiogroup", type: "ShadRadioGroup", what: "Radio dots centred, radios on their labels' line", check: parts.radioDots },
  { name: "rating", type: "ShadRating", what: "Rating stars in one line inside the box", check: parts.ratingStars },
  { name: "progress", type: "ShadProgress", what: "Progress indicator lined up with its track", check: parts.progressIndicator },
].filter((c) => widgetByType(c.type));

const MODES = [
  { mode: "viewer", theme: "light" },
  { mode: "viewer", theme: "dark" },
  { mode: "editor", theme: "light" },
];

/** Opens a popover part (date pickers) by pressing the widget's trigger, the way a user does. */
const openPart = (name) => {
  cy.get(`[data-cy="draggable-widget-${name}"]`).first().scrollIntoView({ offset: { top: -200, left: 0 } });
  cy.get(`[data-cy="draggable-widget-${name}"]`).first().find("button, input").first().realClick();
  cy.get("[data-radix-popper-content-wrapper] table[role='grid']", { timeout: 10000 }).should("be.visible");
};
/** Closes a popover a test left open (also after a failed assertion), so the next case starts clean. */
const closeParts = () =>
  cy.get("body").then(($b) => {
    if ($b.find("[data-radix-popper-content-wrapper]").length) {
      cy.realPress("Escape");
      cy.get("[data-radix-popper-content-wrapper] table[role='grid']").should("not.exist");
    }
  });

// Each check against a part broken on purpose (a style injected into the app): a check that cannot fail would pass
// forever, so these keep the checks honest. Every case must report a failure.
const sel = (n) => `[data-cy="draggable-widget-${n}"]`;
const BROKEN = [
  { name: "switchon", css: `${sel("switchon")} [role=switch] > span { transform: translateX(30px) !important; }`, check: parts.switchThumb },
  { name: "slider", css: `${sel("slider")} [role=slider] { margin-top: 14px !important; }`, check: parts.sliderThumbs },
  { name: "calendar", css: `${sel("calendar")} th:last-child, ${sel("calendar")} td:last-child { width: 105px !important; }`, check: (win, n) => parts.dayColumns(findWidget(win.document, n)?.el) },
  { name: "tabsunderline", css: `${sel("tabsunderline")} [role=tab][aria-selected=true] { border-radius: 6px !important; }`, check: parts.tabsUnderline },
  { name: "tagsinput", css: `${sel("tagsinput")} [data-picker-field] div.tw-inline-flex { margin-top: 10px !important; }`, check: parts.chipsCentred },
  { name: "checkbox", css: `${sel("checkbox")} [role=checkbox] { margin-top: 8px !important; }`, check: parts.checkboxAligned },
  { name: "radiogroup", css: `${sel("radiogroup")} [role=radio] svg { transform: translate(3px, 3px) !important; }`, check: parts.radioDots },
  { name: "rating", css: `${sel("rating")} [role=radio]:nth-child(3) { margin-top: 6px !important; }`, check: parts.ratingStars },
  { name: "progress", css: `${sel("progress")} [role=progressbar] > * { height: 50% !important; }`, check: parts.progressIndicator },
  // A transform moves paint without moving layout, so a fitted (Dynamic height) box does not follow it.
  { name: "tags", css: `${sel("tags")} .tj-shadcn { transform: translateY(30px) !important; }`, check: (win, n) => geometryFailures(measureWidget(win, n)) },
];

describe("UI 2.0 part checks fail on a broken part", { testIsolation: false }, () => {
  before(() => {
    ui2Login();
    createUi2App("parts self-test");
    cy.then(() => {
      const diff = {};
      let top = 20;
      CASES.forEach((c) => {
        const w = widgetByType(c.type);
        diff[crypto.randomUUID()] = componentEntry(w, { name: c.name, top, left: 1, properties: c.props || {} });
        top += w.defaultSize.height + 40;
      });
      postComponents(diff);
    });
    cy.viewport(1600, 1000);
    openViewer(CASES.map((c) => c.name));
  });
  after(() => deleteUi2App());

  BROKEN.filter((b) => CASES.some((c) => c.name === b.name)).forEach((b) => {
    it(`the ${b.name} check reports a part broken on purpose`, () => {
      cy.document({ log: false }).then((doc) => {
        const style = doc.createElement("style");
        style.id = "ui2-broken-part";
        style.textContent = b.css;
        doc.head.appendChild(style);
      });
      cy.wait(100, { log: false });
      cy.window({ log: false }).then((win) => {
        const failures = b.check(win, b.name);
        win.document.getElementById("ui2-broken-part")?.remove();
        expect(failures, `${b.name} check on a broken part`).to.not.be.empty;
      });
    });
  });
});

describe("UI 2.0 widget parts sit in place", { testIsolation: false }, () => {
  before(() => {
    resetReport();
    ui2Login();
    sweepStaleApps();
    createUi2App("parts");
    cy.then(() => {
      const diff = {};
      let top = 20;
      CASES.forEach((c) => {
        const w = widgetByType(c.type);
        diff[crypto.randomUUID()] = componentEntry(w, { name: c.name, top, left: 1, properties: c.props || {} });
        top += w.defaultSize.height + 40;
      });
      postComponents(diff);
    });
  });
  after(() => deleteUi2App());
  afterEach(() => closeParts());

  // CYPRESS_ui2_modes=viewer-dark,editor-light narrows the runs.
  const modes = narrowed(MODES.map((m) => `${m.mode}-${m.theme}`), "ui2_modes").map((k) => MODES.find((m) => `${m.mode}-${m.theme}` === k));
  modes.forEach(({ mode, theme }) => {
    describe(`${mode}, ${theme} theme, 1600px wide`, () => {
      before(() => {
        setTheme(theme);
        cy.viewport(1600, 1000);
        (mode === "editor" ? openEditor : openViewer)(CASES.map((c) => c.name));
      });
      CASES.forEach((c) => {
        const known = knownFailure("parts", c.name, { mode, theme });
        itFor(known)(`${c.what}${known ? ` [known: ${known}]` : ""}`, () => {
          if (c.open) openPart(c.name);
          cy.get(`[data-cy="draggable-widget-${c.name}"]`).first().scrollIntoView({ offset: { top: -200, left: 0 } });
          cy.window({ log: false }).then((win) => {
            const failures = c.check(win, c.name);
            assertNoFailures(
              { check: "parts", widget: c.type, size: c.name, mode, width: 1600, theme, failures, known },
              c.open ? "[data-radix-popper-content-wrapper]" : `[data-cy="draggable-widget-${c.name}"]`
            );
          });
        });
      });
    });
  });
});
