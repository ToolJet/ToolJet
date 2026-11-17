import * as probe from "Support/utils/appBuilder/probe";
import {
  evidence,
  forEachTheme,
  guardBaseline,
  openEditor,
  openPanel,
  seedPanelApp,
} from "Support/utils/appBuilder/panelAudit";
import { contrastRatio } from "../../../../../../frontend/src/test/contrast";

const appName = `panel-contrast-${Date.now()}`;

const closeOverlays = () => cy.get("body").type("{esc}");

const SITES = [
  {
    title: "[UB-07] header Share and Configure Git",
    parts: { share: '[data-cy="editor-app-share-button"]', git: '[data-cy="lifecycle-cta-button"]' },
  },
  {
    title: "[UB-06] version popover selected environment tab and Draft tag",
    open: () => cy.get('[data-cy="version-switcher-button"]').click(),
    parts: {
      selected: "#version-manager-popover .environment-toggle__btn.selected",
      draft: '#version-manager-popover [data-cy$="-draft-tag"]',
    },
  },
  {
    title: "[UB-07][UB-08] Inspector filter pill and the Debugger toggle badge",
    open: (theme) => {
      openEditor(theme);
      openPanel("inspect");
    },
    parts: { pill: ".runtime-inspector__filter.is-active", badge: ".runtime-panel-badge" },
  },
  {
    title: "[UB-07][UB-08] Debugger pills, scope, badges, rows and values",
    open: () => openPanel("debugger"),
    parts: {
      pill: '[data-cy="debugger-filter-all"]',
      scope: ".runtime-debugger__scope .is-active",
      badge: ".runtime-debugger__badge",
      source: ".runtime-debugger__row.is-selected .runtime-debugger__row-source",
      time: ".runtime-debugger__row.is-selected .runtime-debugger__row-time",
      values: ".runtime-debugger .json-viewer-node-value",
      action: '[data-cy="debugger-log-action"]',
    },
  },
  {
    title: "[UB-05] segmented toggle options in the Pages panel",
    open: () => openPanel("pages"),
    parts: { options: ".left-sidebar-panel-content .toggle-item" },
  },
  {
    title: "[UB-05] segmented toggle options in App settings",
    open: () => openPanel("settings"),
    parts: { options: ".left-sidebar-panel-content .toggle-item" },
  },
  {
    title: "[UB-08] query filter popup labels",
    open: () => {
      openPanel("queries");
      cy.get('[data-cy="query-filter-button"]').click();
    },
    parts: { filter: '[data-cy="label-filter-by"]', sort: '[data-cy="label-sort-by"]' },
  },
  {
    title: "[UB-08] query row menu Delete",
    open: () => {
      openPanel("queries");
      cy.get('[data-cy="query-handler-menu-runjs1"]').click({ force: true });
    },
    parts: { delete: '#query-list-menu [data-cy="query-card-delete-button"]' },
  },
  {
    title: "[UB-08] ToolJet database select placeholder",
    open: () => {
      openPanel("queries");
      cy.get('[data-cy="list-query-tjdb1"]').click();
    },
    parts: { select: ".right-panel-shell .tdb-dropdown-btn" },
  },
  {
    title: "[UB-08] Share modal slug hint",
    open: () => cy.get('[data-cy="editor-app-share-button"]').click(),
    close: () => cy.get('[data-cy="modal-close-button"]').click(),
    parts: { hint: '[data-cy="app-slug-info-label"]' },
  },
];

const NON_TEXT_MIN = 3;

const glyphShortfalls = (svg) => {
  const [cloud, letters] = [...svg.querySelectorAll("path")].map((path) => probe.pick(path, ["fill"]).fill);
  const ratio = contrastRatio(letters, cloud);
  return ratio < NON_TEXT_MIN ? [`letters ${letters} on cloud ${cloud} ${ratio.toFixed(2)}:1`] : [];
};

const measure = (parts) => (doc) =>
  Object.fromEntries(
    Object.entries(parts).map(([part, selector]) => {
      const texts = [...doc.querySelectorAll(selector)].filter(probe.isVisible).flatMap(probe.textElements);
      return [
        part,
        texts.map((el) => {
          const contrast = probe.textContrast(el);
          return { text: probe.label(el), ratio: contrast && Number(contrast.ratio.toFixed(2)), min: contrast?.min };
        }),
      ];
    })
  );

const violations = (facts) =>
  Object.entries(facts).flatMap(([part, rows]) =>
    rows.length
      ? rows.filter(({ ratio, min }) => ratio === null || ratio < min).map(({ text, ratio }) => `${part}: ${text} ${ratio}:1`)
      : [`${part}: no visible element`]
  );

describe("Panel text contrast", { testIsolation: false }, () => {
  before(() => {
    guardBaseline();
    cy.clearAllLocalStorage();
    seedPanelApp(appName);
    cy.apiAddQueryToApp({
      queryName: "tjdb1",
      options: { operation: "", transformationLanguage: "javascript", enableTransformation: false },
      dataSourceName: "tooljetdbdefault",
      dsKind: "tooljetdb",
    });
  });
  after(() => cy.apiDeleteApp());

  forEachTheme((theme) =>
    describe(theme, () => {
      before(() => openEditor(theme));
      beforeEach(() => cy.viewport(1440, 960));

      SITES.forEach(({ title, open = () => {}, close = closeOverlays, parts }) =>
        it(`${title} (${theme})`, () => {
          open(theme);
          // The probe's visibility, not Cypress's: the debugger's JSON values sit below the fold of their scroller.
          Object.values(parts).forEach((selector) =>
            cy.document().should((doc) => expect([...doc.querySelectorAll(selector)].some(probe.isVisible), selector).to.equal(true))
          );
          cy.wait(300);
          evidence(`contrast-${title.replace(/^(\[[^\]]+\])+ /, "").replace(/\W+/g, "-")}.${theme}`, measure(parts), {
            file: "contrast.json",
            mask: [appName],
          }).then((facts) => {
            close();
            expect(violations(facts), title).to.deep.equal([]);
          });
        })
      );

      it(`[UA-22] REST API query icon glyphs in the Queries list (${theme})`, () => {
        openPanel("queries");
        cy.get('.query-card-leading:has([data-cy="list-query-restapi1"]) .query-icon svg').then(($svg) => {
          const shortfalls = glyphShortfalls($svg[0]);
          evidence(`contrast-rest-icon.${theme}`, () => ({ shortfalls }), { file: "contrast.json", mask: [appName] });
          cy.then(() => expect(shortfalls, "REST icon glyphs").to.deep.equal([]));
        });
      });
    })
  );
});
