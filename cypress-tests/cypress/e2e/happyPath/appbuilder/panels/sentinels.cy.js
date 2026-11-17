import * as probe from "Support/utils/appBuilder/probe";
import { EVIDENCE_DIR, EVIDENCE_RUN, api, forEachTheme, guardBaseline } from "Support/utils/appBuilder/panelAudit";

// Surfaces outside the App Builder editor that the panel QA fixes must leave alone: any run other
// than the baseline must match the baseline recorded at 4bdaed6682 exactly.
const STYLE = [
  "color",
  "background-color",
  "border-top-color",
  "border-top-width",
  "border-radius",
  "box-shadow",
  "outline-style",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
];
const dataCy = (name) => `[data-cy="${name}"]`;
const appName = `sentinel-viewer-${Date.now()}`;
const dataSourceName = `sentinel-restapi-${Date.now()}`;
const ws = () => Cypress.env("workspaceId");
// Box keys that follow workspace data: audit logs pagination is centred and reads "/ <total pages>",
// and the right-aligned TJDB environment switcher shows the last migration's name.
const DATA_SIZED = {
  [dataCy("pagination-section")]: ["x", "width"],
  [dataCy("tjdb-environment-switcher-button")]: ["x", "width"],
};

const fingerprint = (doc, selectors) =>
  Object.fromEntries(
    selectors.map((selector) => {
      const el = [...doc.querySelectorAll(selector)].find(probe.isVisible);
      if (!el) return [selector, "missing"];
      return [selector, { ...probe.pick(el, STYLE), ...Cypress._.omit(probe.box(el), DATA_SIZED[selector] || []) }];
    })
  );

// Fingerprints are taken once every fingerprinted element is on screen and the fingerprint has held
// for half a second, so a page still loading its lists or settings is never recorded.
const settled = (selectors) => {
  selectors.forEach((selector) =>
    cy.get(selector, { timeout: 30000 }).should(($els) => expect([...$els].some(probe.isVisible), `${selector} on screen`).to.equal(true))
  );
  cy.document().then((doc) => doc.fonts.ready);
  let last;
  let since;
  return cy.document().should((doc) => {
    const now = JSON.stringify(fingerprint(doc, selectors));
    if (now !== last) [last, since] = [now, Date.now()];
    expect(Date.now() - since, "ms the fingerprint has held").to.be.at.least(500);
  });
};

const SURFACES = {
  viewer: {
    // The Viewer follows the app's own theme setting, not the builder's darkMode.
    prepare: (theme) =>
      api("PUT", `/v2/apps/${Cypress.env("sentinelAppId")}/versions/${Cypress.env("sentinelVersionId")}/global_settings`, {
        globalSettings: { appMode: theme },
      }),
    path: () => `/applications/${Cypress.env("sentinelAppId")}/home?version=v1&env=development`,
    selectors: [
      dataCy("button1-button"),
      dataCy("textinput1-label"),
      dataCy("textinput1-input"),
      dataCy("toggleswitch1"),
      dataCy("dropdown1-actionable-section"),
      dataCy("modal1-launch-button"),
      `${dataCy("codeeditor1")} .cm-editor`,
      `${dataCy("codeeditor1")} .cm-gutters`,
      ".tj-list-item-selected",
      "button.left-sidebar-item",
    ],
    steps: [
      { open: () => cy.get(dataCy("dropdown1-actionable-section")).click(), selectors: ['[role="listbox"]', '[role="option"]'] },
      { open: () => cy.get(dataCy("modal1-launch-button")).click(), selectors: [".modal-content", ".modal-header", ".modal-body"] },
    ],
  },
  dashboard: {
    path: () => `/${ws()}`,
    selectors: [
      "dashboard-section-header",
      "breadcrumb-page-title",
      "create-new-apps-button",
      "import-dropdown-menu",
      "create-new-folder-button",
      "all-applications-link",
      "home-page-search-bar",
      "mode-switch-button",
      "settings-icon",
    ].map(dataCy),
  },
  themes: {
    path: () => `/${ws()}/workspace-settings/themes`,
    selectors: [
      "page-title",
      "create-new-theme-button",
      "tooljet-list-item",
      "label-maintenance-mode",
      "togglr-button-light",
      "togglr-button-dark",
      "draggable-widget-button1-button",
      "draggable-widget-textinput1-input",
      "draggable-widget-toggleswitch1",
    ].map(dataCy),
  },
  "data-source": {
    path: () => `/${ws()}/data-sources/${Cypress.env(`${dataSourceName}-dataSource-id`)}`,
    selectors: [
      "body-key-input-field-0",
      "body-value-input-field-0",
      "body-add-button",
      "authentication-type-select-dropdown-input",
      "retry-network-errors-toggle-input",
      "label-general-settings",
      "db-connection-save-button",
    ].map(dataCy),
  },
  "tjdb-sql-editor": {
    path: () => `/${ws()}/database`,
    selectors: ["add-table-button", "tjdb-environment-switcher-button", "filter-button", "sort-button"].map(dataCy),
    steps: [
      {
        open: () => {
          cy.get(dataCy("tjdb-migration-history-button")).click();
          cy.get(dataCy("new-migration-button")).click();
        },
        selectors: [
          `${dataCy("migration-confirm-sql-editor")} .cm-editor`,
          `${dataCy("migration-confirm-sql-editor")} .cm-gutters`,
          dataCy("migration-confirm-title-input"),
          dataCy("migration-confirm-cancel"),
          dataCy("migration-confirm-run"),
        ],
        close: () => cy.get(dataCy("migration-confirm-cancel")).click(),
      },
    ],
  },
  workflows: {
    path: () => `/${ws()}/workflows`,
    selectors: ["create-new-workflows-button", "import-dropdown-menu", "all-workflows-link", "home-page-search-bar"].map(dataCy),
  },
  "audit-logs": {
    path: () => `/${ws()}/audit-logs`,
    selectors: ["filter-by-section", "filter-by-label", "select-users-dropdown", "label-query-transformation", "pagination-section"].map(
      dataCy
    ),
  },
  "profile-notifications": {
    path: () => `/${ws()}/profile-settings`,
    selectors: ["card-title-notifications", "ai-build-notifications-toggle", "card-title-profile", "name-input-field", "update-button"].map(
      dataCy
    ),
  },
};

const seedViewerApp = () => {
  cy.apiCreateApp(appName);
  cy.then(() => api("GET", `/apps/${Cypress.env("appId")}`)).then((app) => {
    Cypress.env("sentinelAppId", app.id);
    const version = app.editing_version;
    Cypress.env("sentinelVersionId", version.id);
    const layout = (top, height = 40) => ({ top, left: 2, width: 12, height });
    const widgets = [
      ["button1", "Button", 20],
      ["textinput1", "TextInput", 80],
      ["toggleswitch1", "ToggleSwitchV2", 140],
      ["dropdown1", "DropdownV2", 200],
      ["modal1", "ModalV2", 260],
      ["codeeditor1", "CodeEditor", 320, 120],
    ];
    api("POST", `/v2/apps/${app.id}/versions/${version.id}/components`, {
      is_user_switched_version: false,
      pageId: version.home_page_id,
      diff: Object.fromEntries(
        widgets.map(([name, type, top, height]) => [
          crypto.randomUUID(),
          { name, type, properties: {}, layouts: { desktop: layout(top, height), mobile: layout(top, height) } },
        ])
      ),
    });
  });
};

// Created with the plugin's own defaults, as the data source form does, so the page does not depend
// on what the workspace already holds.
const seedDataSource = () =>
  cy.readFile("../plugins/packages/restapi/lib/manifest.json").then(({ defaults }) =>
    cy.apiCreateDataSource(
      `${Cypress.env("server_host")}/api/data-sources`,
      dataSourceName,
      "restapi",
      Object.entries(defaults).map(([key, { value }]) => ({ key, value }))
    )
  );

const sameAsBaseline = (name, facts) => {
  if (EVIDENCE_RUN === "base") return;
  cy.readFile(`cypress/evidence/base/sentinels/${name}.json`, { log: false }).then((base) => {
    expect(facts, `${name} matches the baseline at 4bdaed6682`).to.deep.equal(base);
  });
};

describe("Sentinels outside the editor", { testIsolation: false }, () => {
  before(() => {
    guardBaseline();
    cy.apiLogin();
    seedViewerApp();
    seedDataSource();
  });
  after(() => {
    cy.apiDeleteApp(Cypress.env("sentinelAppId"));
    cy.apiDeleteDataSource(dataSourceName);
  });

  forEachTheme((theme) =>
    Object.entries(SURFACES).forEach(([surface, { path, selectors, steps = [], prepare }]) =>
      it(`[sentinel] ${surface} (${theme})`, () => {
        if (prepare) prepare(theme);
        cy.window().then((win) => win.localStorage.setItem("darkMode", String(theme === "dark")));
        cy.then(() => cy.visit(path()));
        settled(selectors);
        const facts = {};
        cy.document().then((doc) => {
          facts.page = fingerprint(doc, selectors);
          facts.darkClass = !!doc.querySelector(".dark-theme, .theme-dark");
        });
        steps.forEach(({ open, selectors: stepSelectors, close }, i) => {
          open();
          settled(stepSelectors);
          cy.document().then((doc) => {
            facts[`step${i + 1}`] = fingerprint(doc, stepSelectors);
          });
          if (close) close();
          else cy.get("body").type("{esc}");
        });
        const name = `${surface}.${theme}`;
        cy.screenshot(`evidence/${EVIDENCE_RUN}/sentinel-${name}`, { capture: "viewport", overwrite: true });
        cy.then(() => cy.writeFile(`${EVIDENCE_DIR}/sentinels/${name}.json`, `${JSON.stringify(facts, null, 2)}\n`));
        cy.then(() => expect(facts.darkClass, `${name} renders in the ${theme} theme`).to.equal(theme === "dark"));
        cy.then(() => sameAsBaseline(name, facts));
      })
    )
  );
});
