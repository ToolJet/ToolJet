import * as probe from "Support/utils/appBuilder/probe";
import { EVIDENCE_DIR, EVIDENCE_RUN, api, forEachTheme } from "Support/utils/appBuilder/panelAudit";

// Golden rule of the panel QA fixes: ToolJet chrome changes never reach a customer's app. The edit
// canvas renders every widget, and every overlay a widget opens, exactly as the Viewer does.
const STYLE = ["font-family", "font-size", "font-weight", "line-height", "color", "background-color"];
const appName = `canvas-parity-${Date.now()}`;
const ids = {};

const WIDGETS = [
  ["button1", "Button", 10, 40],
  ["text1", "Text", 60, 40],
  ["table1", "Table", 110, 280],
  ["starrating1", "StarRating", 400, 40],
  ["rangeslider1", "RangeSliderV2", 450, 60],
  ["keyvaluepair1", "KeyValuePair", 520, 160],
  ["codeeditor1", "CodeEditor", 690, 100],
];

// Each overlay is opened from inside its widget and read where it renders, on <body>.
const OVERLAYS = [
  { name: "rating tooltip", widget: "starrating1", trigger: "span", root: ".tooltip.show" },
  { name: "range slider tooltip", widget: "rangeslider1", trigger: ".rc-slider-handle", root: ".tooltip.show" },
  { name: "table tooltip", widget: "table1", trigger: "[data-tooltip-id][data-tooltip-content]", root: ".react-tooltip" },
];

const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
const fingerprint = (root) =>
  [root, ...root.querySelectorAll("*")]
    .filter((el) => ownText(el) && probe.isVisible(el))
    .slice(0, 60)
    .map((el) => [el.textContent.trim().slice(0, 30), probe.pick(el, STYLE)]);

const seed = () => {
  cy.apiLogin();
  cy.apiCreateApp(appName);
  cy.then(() => api("GET", `/apps/${Cypress.env("appId")}`)).then((app) => {
    Cypress.env("parityAppId", app.id);
    Cypress.env("parityVersionId", app.editing_version.id);
    const layout = (top, height) => ({ top, left: 2, width: 30, height });
    api("POST", `/v2/apps/${app.id}/versions/${app.editing_version.id}/components`, {
      is_user_switched_version: false,
      pageId: app.editing_version.home_page_id,
      diff: Object.fromEntries(
        WIDGETS.map(([name, type, top, height]) => {
          ids[name] = crypto.randomUUID();
          return [ids[name], { name, type, properties: {}, layouts: { desktop: layout(top, height), mobile: layout(top, height) } }];
        })
      ),
    });
  });
};

const widget = (name) => cy.get(`[id="${ids[name]}"]`, { timeout: 30000 });

const collect = (facts) => {
  // Widgets load their data after mount; read them once the table has rows and fonts are in.
  widget("table1").find("tbody tr").should("have.length.greaterThan", 0);
  cy.document().then((doc) => doc.fonts.ready);
  WIDGETS.forEach(([name]) =>
    widget(name)
      .scrollIntoView()
      .then(($el) => {
        facts[name] = fingerprint($el[0]);
      })
  );
  OVERLAYS.forEach(({ name, widget: owner, trigger, root }) => {
    widget(owner)
      .find(trigger)
      .filter(":visible")
      .first()
      .scrollIntoView()
      .trigger("mouseover", { force: true })
      .trigger("mouseenter", { force: true });
    // Overlays append to <body>, so the newest visible one belongs to this anchor.
    // probe.isVisible, not :visible: react-tooltip renders inside the widget, past an overflow edge
    // Cypress counts as clipping.
    cy.get(root, { timeout: 10000 })
      .should(($els) => expect([...$els].some(probe.isVisible), `${name} open`).to.equal(true))
      .then(($els) => [...$els].filter(probe.isVisible).pop())
      .then((el) => {
        facts[name] = fingerprint(Cypress.$(el)[0]); // Cypress wraps a returned element in jQuery
      });
  });
};

describe("Canvas matches the Viewer", { testIsolation: false }, () => {
  before(seed);
  after(() => cy.apiDeleteApp(Cypress.env("parityAppId")));

  forEachTheme((theme) =>
    it(`[golden-rule] widgets and their overlays render the same in the editor and the Viewer (${theme})`, () => {
      // The canvas and the Viewer both follow the app's own theme; the builder theme matches it here.
      api("PUT", `/v2/apps/${Cypress.env("parityAppId")}/versions/${Cypress.env("parityVersionId")}/global_settings`, {
        globalSettings: { appMode: theme },
      });
      cy.viewport(1440, 960);
      cy.window().then((win) => win.localStorage.setItem("darkMode", String(theme === "dark")));
      const editor = {};
      const viewer = {};
      cy.openApp("", Cypress.env("workspaceId"), Cypress.env("parityAppId"), '[data-cy="draggable-widget-button1"]');
      collect(editor);
      cy.then(() => cy.visit(`/applications/${Cypress.env("parityAppId")}/home?version=v1&env=development`));
      collect(viewer);
      cy.then(() =>
        cy.writeFile(`${EVIDENCE_DIR}/parity/${theme}.json`, `${JSON.stringify({ run: EVIDENCE_RUN, editor, viewer }, null, 2)}\n`)
      );
      cy.then(() => {
        // Styles only: cell text can differ for data reasons (the evidence file keeps it).
        const styles = (rows) => (rows || []).map(([, style]) => style);
        Object.keys(viewer).forEach((key) =>
          expect(styles(editor[key]), `${key} (${theme})`).to.deep.equal(styles(viewer[key]))
        );
      });
    })
  );
});
