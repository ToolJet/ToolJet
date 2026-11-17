import * as probe from "Support/utils/appBuilder/probe";
import {
  AUDIT_CHECKS,
  EVIDENCE_DIR,
  LONG_QUERY,
  PANELS,
  SHORT_QUERY,
  auditPanel,
  evidence,
  expectOpen,
  expectTheme,
  forEachTheme,
  guardBaseline,
  openEditor,
  openPanel,
  seedPanelApp,
  settledValue,
} from "Support/utils/appBuilder/panelAudit";

// 683x600 is a 1024px screen at 150% zoom. QA ids come from the panel redesign QA report
// (ToolJet PR #18471).
const VIEWPORTS = [
  [1440, 960],
  [683, 600],
];
const LEFT = ["pages", "components", "queries", "libraries", "code-search", "dependencies", "settings"];
const RIGHT = ["query", "component"];
const appName = `panel-sweep-${Date.now()}`;
const sweep = [];
const flows = {};
// Every test the checks read from. A hook failure that drops some of them must fail every check,
// not leave the checks judging a partial sweep.
const declared = new Set();
const finished = new Set();
const step = (title, body, ratchet = () => {}) => {
  declared.add(title);
  it(title, () => {
    body();
    cy.then(() => finished.add(title));
    ratchet();
  });
};

const SEARCH = 'input[type="search"], input[placeholder^="Search"], input[placeholder^="Filter"]';
const PAGE_POPUP = ".popover:has(label.form-label)";
const SECTION_HEADER = '.accordion-button, [class*="section-header"], [class*="group-header"]';
const TOOLTIP = '.app-builder-tooltip, .tooltip, [role="tooltip"]';
const PAGE_TOGGLES = ["Mark as home", "Hide this page on navigation", "Disable page"];

const idsOf = (title) => title.match(/[A-Z]+-\d+[a-z]?(?=\])/g);
const writeCheck = (ids, violations) => cy.writeFile(`${EVIDENCE_DIR}/checks/${ids.join("_")}.json`, violations);

// Violations are written as evidence before the ratchet asserts, so a failing run still leaves them.
const flow = (title, body) => {
  const ids = idsOf(title);
  let violations;
  step(
    title,
    () => {
      violations = [];
      body(violations);
      cy.then(() => evidence(`flow-${ids.join("_")}`, () => ({ violations }), { file: "flows.json", mask: [appName] }));
      cy.then(() => writeCheck(ids, violations));
    },
    () => cy.then(() => expectOpen(ids, violations))
  );
};

const openPageMenu = (page) => {
  cy.get(`[data-cy="pages-name-${page.toLowerCase()}"]`).closest(".page-menu-item").as("row").realHover();
  cy.get("@row").find(".action-btn-wrapper .icon-btn").last().click({ force: true });
  cy.get("#edit-page-popover").should("be.visible");
};

const overlaySurface = (overlay) => {
  const surface = [overlay, ...overlay.querySelectorAll("*")].find((el) => probe.lightness(probe.pick(el, ["background-color"])["background-color"]) !== null);
  return surface && probe.pick(surface, ["background-color", "border-top-color", "border-top-width", "border-radius", "box-shadow"]);
};

// `text` proves the loose `root` selector matched that overlay.
const OVERLAYS = {
  version: {
    root: "#version-manager-popover",
    text: [/\bv1\b/],
    open: () => cy.get('[data-cy="version-switcher-button"]').click(),
  },
  "query-menu": {
    root: "#query-list-menu",
    text: [/Rename/, /Duplicate/, /Delete/],
    open: () => {
      openPanel("queries");
      cy.get('[data-cy="query-handler-menu-runjs1"]').click({ force: true });
    },
  },
  "query-filter": {
    root: '.popover:has(.query-editor-sort-filter-popup), [class*="sort-filter-popup"]',
    text: [/filter by/i, /sort by/i],
    open: () => {
      openPanel("queries");
      cy.get('[data-cy="query-filter-button"]').click();
    },
  },
  "new-query": {
    root: '[class*="ds-select-popover"], .popover:has([class*="datasource"]), [role="dialog"]',
    text: [/REST API/i],
    open: () => {
      openPanel("queries");
      cy.contains(".left-sidebar-panel-content button", "New query").click();
    },
  },
  "page-menu": {
    root: "#edit-page-popover",
    text: [/delete/i],
    open: () => {
      openPanel("pages");
      openPageMenu("Second");
    },
  },
};
const SURFACE_COUNT = (Object.keys(PANELS).length * VIEWPORTS.length + Object.keys(OVERLAYS).length) * 2;

const BLOCKED = [
  { title: "[QE-58] gRPC query editor selects render and open", kinds: ["grpc", "grpcv2"] },
  { title: "[QE-59] OpenAPI query editor selects render and open", kinds: ["openapi"] },
];

const headerFacts = (doc) => {
  const header = doc.querySelector(".header");
  const win = doc.defaultView;
  const controls = [...header.querySelectorAll("button, a[href]")].filter(probe.isVisible);
  return {
    overflowX: header.scrollWidth - header.clientWidth,
    offscreen: controls.filter((el) => el.getBoundingClientRect().right > win.innerWidth + 0.5).map(probe.label),
    controlCentres: controls
      .filter((el) => Math.round(el.getBoundingClientRect().height) === 32)
      .map((el) => [probe.label(el), Math.round((el.getBoundingClientRect().y + 16) * 10) / 10]),
  };
};

const railFacts = (doc, rail) => {
  const button = doc.querySelector(`[data-cy="left-sidebar-${rail}-button"]`);
  const beta = button.querySelector('[class*="beta"]');
  const glyph = button.querySelector("svg");
  return {
    railName: button.getAttribute("aria-label"),
    railLabel: button.querySelector(".left-sidebar-item-label")?.innerText,
    betaClearance:
      beta && glyph ? Math.round(beta.getBoundingClientRect().left - glyph.getBoundingClientRect().right) : null,
  };
};

const surfaceFacts = (surface) => (doc) =>
  surface === "header"
    ? { ...probe.panelFacts(doc.querySelector(".header")), ...headerFacts(doc) }
    : {
        ...probe.panelFacts(doc.querySelector(PANELS[surface].root)),
        ...(PANELS[surface].rail && railFacts(doc, PANELS[surface].rail)),
      };

const where = (entry) => `${entry.surface} ${entry.theme} ${entry.viewport}`;
const of = (surfaces) => sweep.filter((entry) => surfaces.includes(entry.surface));
const groupBy = (entries, keyOf) =>
  entries.reduce((groups, entry) => ({ ...groups, [keyOf(entry)]: [...(groups[keyOf(entry)] || []), entry] }), {});
const spread = (values) => Math.max(...values) - Math.min(...values);

const variants = (entries, valueOf) => {
  const byValue = groupBy(entries.filter((entry) => valueOf(entry) !== undefined), (entry) => JSON.stringify(valueOf(entry)));
  const keys = Object.keys(byValue);
  return keys.length > 1 ? keys.map((key) => `${key}: ${[...new Set(byValue[key].map((e) => e.surface))].sort().join(", ")}`) : [];
};
const perTheme = (entries, valueOf) =>
  Object.entries(groupBy(entries, (e) => e.theme)).flatMap(([theme, group]) =>
    variants(group, valueOf).map((v) => `${theme} ${v}`)
  );

const audited = (key) => () => sweep.flatMap((e) => (e.audit?.[key] || []).map((v) => `${where(e)}: ${v}`));

// Where the QA report found type one-offs (UB-09): editor overlays, drawer counts and times, and
// segmented control labels, whose text carries a togglr-button data-cy.
const qaTypeSite = (surface, offScale) =>
  surface.startsWith("overlay-") || ["inspect", "debugger"].includes(surface) || /togglr-button-/.test(offScale);

const CHECKS = [
  { title: "[UB-04] every focusable control has an accessible name", run: audited("unnamed") },
  { title: "[UB-05][UB-06][UB-07][UB-08] text reaches WCAG AA on its background", run: audited("lowContrast") },
  { title: "[UB-13] every Tab stop shows a focus indicator", run: audited("ringless") },
  {
    title: "[UB-12][UA-27] every focus ring has the same shape",
    run: () =>
      perTheme(
        sweep.flatMap((e) => (e.audit?.rings || []).map((ring) => ({ ...e, ring: ring.split(" | ")[0] }))),
        (e) => e.ring
      ),
  },
  {
    title: "[UA-01][UA-02][UA-18] every panel header is 48px with its close button centred",
    run: () =>
      of([...LEFT, ...RIGHT]).flatMap((e) => {
        const header = e.facts.header;
        if (!header) return [`${where(e)}: no panel header`];
        return [
          header.height !== 48 && `${where(e)}: header ${header.height}px`,
          header.closeOffsetY === null && `${where(e)}: no close button in the header`,
          Math.abs(header.closeOffsetY) > 1 && `${where(e)}: close ${header.closeOffsetY}px off centre`,
        ].filter(Boolean);
      }),
  },
  {
    title: "[UA-07] panel titles share one size, weight and colour",
    run: () => [
      ...of([...LEFT, ...RIGHT])
        .filter((e) => e.facts.title && (e.facts.title["font-size"] !== "14px" || e.facts.title["font-weight"] !== "500"))
        .map((e) => `${where(e)}: "${e.facts.title.text}" ${e.facts.title["font-size"]}/${e.facts.title["font-weight"]}`),
      ...perTheme(of([...LEFT, ...RIGHT]).filter((e) => e.facts.title), (e) => e.facts.title.color),
    ],
  },
  {
    title: "[UA-16][UB-18] panel tabs are 36px tall and share one active tab colour",
    run: () => [
      ...of([...LEFT, ...RIGHT])
        .filter((e) => e.facts.tabs && e.facts.tabs.height !== 36)
        .map((e) => `${where(e)}: active tab ${e.facts.tabs.height}px`),
      ...perTheme(sweep.filter((e) => e.facts.tabs?.activeColor), (e) => e.facts.tabs.activeColor),
    ],
  },
  {
    title: "[UB-01][UA-08] editor chrome renders in one UI font",
    run: () =>
      sweep.flatMap((e) =>
        Object.keys(e.facts.families || {})
          .filter((family) => family !== "IBM Plex Sans")
          .map((family) => `${where(e)}: ${family} x${e.facts.families[family]}`)
      ),
  },
  {
    title: "[UB-09] overlay, drawer count and segmented label text sits on the 12/13/14/16px scale",
    run: () =>
      sweep.flatMap((e) =>
        (e.facts.offScale || []).filter((v) => qaTypeSite(e.surface, v)).map((v) => `${where(e)}: ${v}`)
      ),
  },
  {
    title: "[UA-12] page rows and query rows use one name size",
    run: () => perTheme(sweep.filter((e) => ["pages", "queries"].includes(e.surface)), (e) =>
      Object.values(e.facts.rows || {})[0]?.fontSize),
  },
  {
    title: "[UA-10][UB-15] every panel search field has one height, radius and border",
    run: () =>
      perTheme(
        sweep.flatMap((e) => (e.facts.search || []).map((s) => ({ ...e, s }))),
        (e) => [e.s.height, e.s["border-radius"], e.s["border-top-color"]]
      ),
  },
  {
    title: "[UA-11] list rows share one corner radius",
    run: () =>
      perTheme(
        sweep.flatMap((e) => Object.values(e.facts.rows || {}).map((row) => ({ ...e, row }))),
        (e) => e.row.radius
      ),
  },
  {
    title: "[UC-21] each rail item is named after the panel it opens",
    run: () =>
      of(LEFT)
        .filter((e) => e.facts.title && e.facts.railName !== e.facts.title.text)
        .map((e) => `${where(e)}: rail "${e.facts.railName}" opens "${e.facts.title.text}"`),
  },
  {
    title: "[UC-23][UC-24] every search field says what it searches, with one name for placeholder and label",
    run: () =>
      sweep.flatMap((e) =>
        (e.facts.search || [])
          .filter((s) => s.placeholder === "Search" || (s.name && s.name !== s.placeholder))
          .map((s) => `${where(e)}: placeholder "${s.placeholder}", label "${s.name}"`)
      ),
  },
  {
    title: "[UC-26] panel copy uses sentence case",
    run: () => sweep.flatMap((e) => (e.facts.titleCase || []).map((text) => `${where(e)}: "${text}"`)),
  },
  {
    title: "[PL-71][LR-42][UA-26][UB-23] dark panels have no light areas",
    run: () =>
      sweep.filter((e) => e.theme === "dark").flatMap((e) => (e.facts.lightAreas || []).map((v) => `${where(e)}: ${v}`)),
  },
  {
    title: "[UC-01] left panel titles and close buttons stay put when switching rail items",
    run: () => {
      // Vertical positions are on screen, since a panel's content may scroll under a pinned header.
      const positions = {
        "close y": (f) => f.close?.y,
        "close inset": (f) => f.close?.right,
        "title y": (f) => f.title?.y,
        "title x": (f) => f.title?.x,
      };
      return Object.values(groupBy(of(LEFT), (e) => `${e.theme} ${e.viewport}`)).flatMap((group) =>
        Object.entries(positions)
          .filter(([, at]) => group.some((e) => at(e.facts) === undefined) || spread(group.map((e) => at(e.facts))) > 1)
          .map(([what, at]) => `${group[0].theme} ${group[0].viewport}: ${what} ${group.map((e) => `${e.surface}=${at(e.facts)}`).join(" ")}`)
      );
    },
  },
  {
    title: "[UC-02] right panels put the close button in one place",
    run: () => perTheme(of(RIGHT), (e) => e.facts.close),
  },
  {
    title: "[UC-03] 32px header controls share one centre line",
    run: () =>
      of(["header"])
        .filter((e) => spread(e.facts.controlCentres.map(([, y]) => y)) > 1)
        .map((e) => `${where(e)}: ${e.facts.controlCentres.map(([name, y]) => `${name}@${y}`).join(", ")}`),
  },
  {
    title: "[UC-09] the editor header fits at 1024px and 150% zoom",
    run: () =>
      of(["header"])
        .filter((e) => e.facts.overflowX > 0 || e.facts.offscreen.length)
        .map((e) => `${where(e)}: overflow ${e.facts.overflowX}px, off screen ${e.facts.offscreen.join(", ")}`),
  },
  {
    title: "[UB-19][UB-21] editor overlays share one surface, border, radius and shadow",
    run: () => perTheme(sweep.filter((e) => e.surface.startsWith("overlay-")), (e) => e.facts.surfaceStyle),
  },
  {
    title: "[UB-20][UA-19] code fields follow the panel surface in both themes, not Monokai",
    run: () => [...(flows["UB-20_light"] || []), ...(flows["UB-20_dark"] || [])],
  },
  {
    title: "[UC-18] the Beta pill keeps 2px clear of its rail glyph",
    run: () =>
      of(LEFT)
        .filter((e) => e.facts.betaClearance !== null && e.facts.betaClearance < 2)
        .map((e) => `${where(e)}: ${e.facts.betaClearance}px`),
  },
];

// Off the page: a screenshot hides the Cypress reporter and slides the app under any on-page point.
const parkMouse = () => cy.get("body").realMouseMove(-10000, -10000, { position: "topLeft" });

// Hovers near the left edge, which stays visible when the text is clipped.
const tooltipShows = (el, text) => {
  cy.wrap(el).realHover({ position: "left" });
  cy.wait(800);
  return cy.get("body").then(($body) => {
    const shown = $body.find(TOOLTIP).filter(":visible").filter((_, tip) => tip.innerText.includes(text)).length > 0;
    parkMouse();
    return cy.wrap(shown, { log: false });
  });
};

const textStart = (node) => {
  const range = node.ownerDocument.createRange();
  range.setStart(node, node.textContent.search(/\S/));
  range.setEnd(node, node.textContent.length);
  return range.getClientRects()[0].left;
};

describe("Panel sweep", { testIsolation: false }, () => {
  before(() => {
    guardBaseline();
    // The drawer keeps its height in localStorage, and the PL-35 drag of an earlier run moves it.
    cy.clearAllLocalStorage();
    seedPanelApp(appName);
  });
  after(() => cy.apiDeleteApp());

  forEachTheme((theme) =>
    VIEWPORTS.forEach((viewport) => {
      const size = viewport.join("x");
      describe(`${theme} ${size}`, () => {
        before(() => openEditor(theme, viewport));
        // Cypress resets the viewport before every test.
        beforeEach(() => cy.viewport(...viewport));

        Object.keys(PANELS).forEach((surface) =>
          step(`[sweep] ${surface} (${theme} ${size})`, () => {
            const name = `${surface}.${theme}.${size}`;
            expectTheme(theme);
            openPanel(surface);
            // Facts describe the resting panel, not a field it autofocuses on open.
            cy.document().then((doc) => doc.activeElement?.blur());
            // Panels slide and fade in for ~200ms (PANEL_MOTION); measure the settled frame.
            cy.wait(400);
            evidence(name, surfaceFacts(surface), { mask: [appName] }).then((facts) =>
              sweep.push({ surface, theme, viewport: size, facts })
            );
            auditPanel(PANELS[surface].root, { evidenceName: name, mask: [appName] }).then((audit) => {
              sweep.at(-1).audit = audit;
            });
          })
        );
      });
    })
  );

  // Overlays portal to <body>, outside every panel root, so they join the sweep as surfaces of
  // their own (fonts, type scale, contrast, names) and are compared with each other.
  forEachTheme((theme) =>
    describe(`overlays ${theme}`, () => {
      before(() => openEditor(theme));

      Object.entries(OVERLAYS).forEach(([overlay, { root, text, open }]) =>
        step(`[sweep] overlay ${overlay} (${theme})`, () => {
          const name = `overlay-${overlay}.${theme}.1440x960`;
          expectTheme(theme);
          parkMouse();
          cy.get("body").type("{esc}");
          open();
          // Waiting for the text also waits for overlays that load their content after opening.
          cy.get(root)
            .filter(":visible")
            .last()
            .should(($el) => text.forEach((pattern) => expect($el[0].innerText, `${overlay} overlay text`).to.match(pattern)))
            .then(($el) => {
              const el = $el[0];
              cy.wait(300);
              evidence(name, () => ({ ...probe.panelFacts(el), surfaceStyle: overlaySurface(el) }), {
                mask: [appName],
              }).then((facts) => sweep.push({ surface: `overlay-${overlay}`, theme, viewport: "1440x960", facts }));
              auditPanel(el, { walk: false, evidenceName: name, mask: [appName] }).then((audit) => {
                sweep.at(-1).audit = audit;
              });
            });
        })
      );

      step(`[sweep] code field surface in component config (${theme})`, () => {
        openPanel("component");
        cy.get(".right-panel-shell .cm-editor").first().then(($code) => {
          const surface = probe.backgroundLayers($code[0].closest(".right-panel-shell"))?.[0];
          const own = probe.pick($code[0], ["background-color"])["background-color"];
          flows[`UB-20_${theme}`] = own === surface || own === "rgba(0, 0, 0, 0)" ? [] : [`${theme}: code field ${own} on panel ${surface}`];
        });
      });
    })
  );

  describe("flows", () => {
    // New page switches the canvas to the page it creates, so every journey starts from a fresh load.
    beforeEach(() => openEditor("light"));

    flow("[UC-14] New page stays pinned at the bottom of the Pages panel", (violations) => {
      openPanel("pages");
      // The Pages panel ends where the drawer starts, so its bottom moves until the drawer height settles.
      settledValue((doc) => {
        const button = doc.querySelector(".add-new-page");
        return Math.round(button.closest(".left-sidebar-panel-content").getBoundingClientRect().bottom - button.getBoundingClientRect().bottom);
      }).then((gap) => {
        if (gap > 24) violations.push(`New page sits ${gap}px above the panel bottom`);
      });
    });

    flow("[LR-23] page popups open fully past the Pages panel", (violations) => {
      openPanel("pages");
      const check = (which) =>
        cy.get(PAGE_POPUP).filter(":visible").last().then(($popup) => {
          const popup = $popup[0].getBoundingClientRect();
          const panel = Cypress.$(".left-sidebar-panel-content")[0].getBoundingClientRect();
          if (popup.left < panel.right) violations.push(`${which} popup starts at ${Math.round(popup.left)}, panel ends at ${Math.round(panel.right)}`);
          if (popup.right > $popup[0].ownerDocument.defaultView.innerWidth) violations.push(`${which} popup overflows the viewport`);
        });
      openPageMenu("Second");
      cy.contains("#edit-page-popover button", "Edit page details").click({ force: true });
      check("Edit page details");
      cy.get('[data-cy="close-page-configuration-button"]').filter(":visible").first().click();
      // A click while the first popup is still closing lands on its outside-click handler.
      cy.get(PAGE_POPUP).should("not.exist");
      cy.get(".add-new-page").scrollIntoView().click({ force: true });
      check("New page");
    });

    flow("[UC-15] page popup toggle labels share one left edge", (violations) => {
      openPanel("pages");
      openPageMenu("Second");
      cy.contains("#edit-page-popover button", "Edit page details").click({ force: true });
      cy.get(PAGE_POPUP).filter(":visible").last().then(($popup) => {
        const walker = $popup[0].ownerDocument.createTreeWalker($popup[0], NodeFilter.SHOW_TEXT);
        const starts = {};
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent.trim();
          if (PAGE_TOGGLES.includes(text) && probe.isVisible(node.parentElement)) starts[text] = textStart(node);
        }
        expect(Object.keys(starts), "toggle labels measured").to.have.members(PAGE_TOGGLES);
        const min = Math.min(...Object.values(starts));
        Object.entries(starts)
          .filter(([, x]) => x - min > 0.5)
          .forEach(([text, x]) => violations.push(`"${text}" starts ${Math.round((x - min) * 100) / 100}px right of its siblings`));
      });
    });

    flow("[UB-02][UB-03] page menus and page delete use the shared menu and delete dialog", (violations) => {
      openPanel("pages");
      openPageMenu("Second");
      cy.get("#edit-page-popover button").each(($option) => {
        if (!$option.closest(".list-item-popover-option").length && !$option.hasClass("list-item-popover-option")) {
          violations.push(`page menu option "${$option.text().trim()}" is not a .list-item-popover-option`);
        }
      });
      cy.contains("#edit-page-popover button", /delete/i).click({ force: true });
      cy.get('[role="dialog"], .modal-dialog').filter(":visible").last().then(($dialog) => {
        const title = $dialog.find('[role="heading"], .modal-title, h1, h2, h3').first().text().trim();
        if (!/^Delete ".+"\?$/.test(title)) violations.push(`page delete dialog title "${title}"`);
        cy.wrap($dialog).contains("button", /cancel/i).click();
      });
    });

    flow("[UA-20][UC-25] a search with no matches shows the shared no-match state", (violations) => {
      ["queries", "dependencies", "code-search", "components", "inspect", "debugger"].forEach((surface) => {
        openPanel(surface);
        cy.get(PANELS[surface].root).find(SEARCH).filter(":visible").first().clear({ force: true }).type("zzqx", { delay: 0, force: true });
        cy.wait(400);
        cy.get(PANELS[surface].root).then(($root) => {
          const empty = $root.find(".tj-panel-empty:visible");
          const clear = empty.find("button").filter((_, b) => /clear search/i.test(b.innerText));
          if (!empty.length || !/No matches/.test(empty.text()) || !clear.length) {
            violations.push(`${surface}: "${($root.find('[class*="empty"]:visible').first().text() || "no empty state").trim().slice(0, 60)}"`);
          }
        });
      });
    });

    flow("[UA-14] collapsible section headers share one pattern", (violations) => {
      const headers = [];
      ["pages", "components", "dependencies", "code-search", "inspect"].forEach((surface) => {
        openPanel(surface);
        // Code search shows section headers only once a search has results.
        if (surface === "code-search") {
          cy.get(PANELS[surface].root).find(SEARCH).filter(":visible").first().clear({ force: true }).type("in", { delay: 0, force: true });
          cy.wait(400);
        }
        cy.get(PANELS[surface].root).then(($root) => {
          const found = $root.find(SECTION_HEADER).filter(":visible").filter((_, header) => header.querySelector("svg"));
          if (!found.length) violations.push(`${surface}: no collapsible section header`);
          found.each((_, header) => {
            const text = probe.textElements(header)[0] || header;
            const count = [...header.querySelectorAll("*")].find((el) => el !== text && /^\d+$/.test(el.textContent.trim()));
            headers.push({
              surface,
              style: probe.pick(text, ["font-size", "font-weight", "color"]),
              caret: header.querySelector("svg").getBoundingClientRect().left < text.getBoundingClientRect().left ? "leading" : "trailing",
              count: /\(\d+\)$/.test(text.innerText.trim()) ? "in the title" : count && probe.pick(count, ["font-size", "color", "background-color"]),
            });
          });
        });
      });
      cy.then(() => {
        violations.push(...variants(headers, (h) => [h.style, h.caret]));
        violations.push(...variants(headers.filter((h) => h.count), (h) => h.count).map((v) => `count ${v}`));
      });
    });

    flow("[UB-14][UB-16][UB-17] switches, inputs and add buttons share one spec across panels", (violations) => {
      const controls = { switch: [], input: [], add: [] };
      const collect = (surface) =>
        cy.get(PANELS[surface].root).then(($root) => {
          const size = (el) => [Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)];
          $root.find('.form-switch .form-check-input:visible, [class*="toggle-switch"] input:visible, [role="switch"]:visible')
            .each((_, el) => controls.switch.push({ surface, value: size(el) }));
          $root.find('input.form-control:visible, input[type="text"]:visible').each((_, el) =>
            controls.input.push({ surface, value: [Math.round(el.getBoundingClientRect().height), probe.pick(el, ["border-radius"])["border-radius"]] })
          );
          $root.find("button:visible").filter((_, b) => /^\+?\s*(New|Add)\b/.test(b.innerText.trim())).each((_, el) =>
            controls.add.push({ surface, value: [Math.round(el.getBoundingClientRect().height), probe.pick(el, ["font-size", "font-weight", "border-top-color"])] })
          );
        });
      ["pages", "queries", "settings", "component"].forEach((surface) => {
        openPanel(surface);
        collect(surface);
      });
      openPanel("query");
      cy.get('[data-cy="query-tab-settings"]').click();
      collect("query");
      cy.then(() =>
        Object.entries(controls).forEach(([kind, list]) =>
          violations.push(...variants(list, (c) => c.value).map((v) => `${kind} ${v}`))
        )
      );
    });

    flow("[UB-11] icon-only buttons show a tooltip on hover", (violations) => {
      openPanel("query");
      openPanel("inspect");
      ['[data-cy="query-manager-toggle-button"]', '[data-cy="query-filter-button"]', '[data-cy="query-handler-menu-runjs1"]']
        .forEach((selector) => {
          openPanel("queries");
          cy.get("body").then(($body) => {
            const target = $body.find(selector).filter(":visible")[0];
            if (!target) {
              violations.push(`${selector} is not on screen`);
              return;
            }
            tooltipShows(target, "").then((shown) => shown || violations.push(`${probe.label(target)} has no tooltip`));
          });
        });
    });

    flow("[UB-10] the rail theme toggle uses the editor tooltip", (violations) => {
      cy.get(".left-sidebar button")
        .filter((_, b) => b.querySelector(".lucide-moon, .lucide-sun"))
        .should("have.length", 1)
        .realHover();
      cy.wait(800);
      cy.get("body").then(($body) => {
        const other = $body.find(TOOLTIP).filter(":visible").not(".app-builder-tooltip, .app-builder-tooltip *");
        if (!$body.find(".app-builder-tooltip:visible").length) {
          violations.push(`rail theme toggle shows no editor tooltip${other.length ? `, but "${other.first().text().trim()}" in ${probe.label(other[0])}` : ""}`);
        }
      });
      parkMouse();
    });

    // 1440x900 is the QA report's viewport.
    flow("[UC-05] keyboard focus in query settings never hides under the open preview", (violations) => {
      [
        [1440, 900],
        [683, 600],
      ].forEach((viewport) => {
        const size = viewport.join("x");
        openEditor("light", viewport);
        openPanel("query");
        cy.get('[data-cy="query-tab-settings"]').click();
        cy.get("body").then(($body) => {
          if (!$body.find('[data-cy="preview-content"]:visible').length) cy.get('[data-cy="query-preview-button"]').click();
        });
        cy.get('[data-cy="preview-content"]').should("be.visible");
        cy.wait(600);
        auditPanel(".right-panel-shell", { knownOpen: new Set(AUDIT_CHECKS.flatMap(({ ids }) => ids)) }).then((audit) => {
          expect([...audit.rings, ...audit.ringless].join("\n"), `${size} walk reached New event handler`).to.include("add-event-handler");
          violations.push(...audit.hidden.map((v) => `${size}: ${v}`));
        });
      });
    });

    // 1152x720 is 1440x900 at 125% zoom, the QA report's viewport.
    flow("[UC-08] at 125% zoom the debugger detail title stays readable and its toolbar buttons keep their size", (violations) => {
      cy.viewport(1152, 720);
      openPanel("queries");
      cy.get(`[data-cy="list-query-${SHORT_QUERY.toLowerCase()}"]`).click();
      cy.get('[data-cy="query-run-button"]').click();
      openPanel("queries");
      openPanel("debugger");
      cy.contains(".runtime-debugger__row", SHORT_QUERY).click();
      cy.get(".runtime-debugger__detail-title").filter(":visible").should("have.length", 1).then(($title) => {
        const title = $title[0];
        expect(title.innerText.trim(), "detail title").to.equal(SHORT_QUERY);
        if (title.scrollWidth > title.clientWidth + 1) {
          violations.push(`detail title "${SHORT_QUERY}" clipped to ${title.clientWidth}px of ${title.scrollWidth}px`);
        }
      });
      cy.get('[data-cy="debugger-clear-button"], [data-cy="debugger-close-button"]').filter(":visible").then(($buttons) => {
        const width = (name) => $buttons.filter(`[data-cy="${name}"]`)[0].getBoundingClientRect().width;
        const [clear, close] = [width("debugger-clear-button"), width("debugger-close-button")];
        if (Math.abs(clear - close) > 0.5) violations.push(`Clear logs is ${Math.round(clear * 100) / 100}px wide, Close ${Math.round(close * 100) / 100}px`);
      });
    });

    flow("[UC-07] clipped names in panel lists show their full text on hover", (violations) => {
      const term = LONG_QUERY.slice(0, 14);
      openPanel("queries");
      cy.get(`[data-cy="list-query-${LONG_QUERY.toLowerCase()}"]`).click();
      cy.get('[data-cy="query-run-button"]').click();
      ["queries", "dependencies", "code-search", "inspect", "debugger"].forEach((surface) => {
        openPanel(surface);
        cy.get(PANELS[surface].root).find(SEARCH).filter(":visible").first().clear({ force: true }).type(term, { delay: 0, force: true });
        cy.wait(400);
        cy.get(PANELS[surface].root).then(($root) => {
          // Search highlights split the name, so match its end, which is the part that gets clipped.
          const clipped = probe.textElements($root[0]).filter((el) => probe.isClipped(el) && el.innerText.includes(LONG_QUERY.slice(-13)));
          expect(clipped.map(probe.label), `${surface} shows ${LONG_QUERY} clipped`).to.not.be.empty;
          probe.clippedWithoutTitle($root[0]).forEach((el) =>
            tooltipShows(el, el.innerText.trim()).then(
              (shown) => shown || violations.push(`${surface}: ${probe.label(el)} is clipped, no full text on hover`)
            )
          );
        });
      });
    });

    flow("[QE-51] dropdown options show selection, keyboard focus and hover in both themes", (violations) => {
      const bg = (el) => probe.pick(el, ["background-color"])["background-color"];
      const expectDistinct = (theme, act, state, name, plain) => {
        act();
        cy.get('[class*="__option"]').filter(":visible").should(($options) => {
          const option = (text) => [...$options].find((o) => o.innerText.trim() === text);
          expect(option(name).className, `${theme} ${name}`).to.include(`--is-${state}`);
          expect(option(plain).className, `${theme} ${plain}`).to.not.match(/--is-(focused|selected)/);
        }).then(($options) => {
          const option = (text) => [...$options].find((o) => o.innerText.trim() === text);
          if (bg(option(name)) === bg(option(plain))) violations.push(`${theme}: ${state} ${name} looks like plain ${plain} (${bg(option(plain))})`);
        });
      };
      forEachTheme((theme) => {
        openEditor(theme);
        openPanel("queries");
        cy.get('[data-cy="list-query-restapi1"]').click();
        // The pointer is parked off the menu so only the steps below hover an option.
        parkMouse();
        expectDistinct(theme, () => cy.get('[data-cy="method-select-dropdown-input"]').click({ force: true }), "selected", "GET", "POST");
        expectDistinct(theme, () => ["ArrowDown", "ArrowDown"].forEach((key) => cy.realPress(key)), "focused", "PUT", "POST");
        // react-select ignores the first pointer move after a key press, so the pointer moves twice.
        expectDistinct(
          theme,
          () => ["left", "center"].forEach((position) => cy.contains('[class*="__option"]', "DELETE").realHover({ position })),
          "focused",
          "DELETE",
          "POST"
        );
        cy.realPress("Escape");
        parkMouse();
      });
    });

    flow("[LR-39] the Libraries rail item opens App libraries", (violations) => {
      cy.get("body").then(($body) => {
        if (!$body.find('[data-cy="left-sidebar-libraries-button"]').length) {
          violations.push("blocked: no Libraries rail item without an EE licence");
          return;
        }
        openPanel("libraries");
        cy.get(".left-sidebar-panel-content").then(($panel) => {
          if (!/Libraries/.test($panel.text())) violations.push("Libraries panel did not open");
        });
      });
    });

    // Last, because the drag persists a drawer height the later journeys would inherit.
    flow("[PL-35] a fast drawer drag leaves canvas, left panel and drawer flush", (violations) => {
      openPanel("pages");
      openPanel("inspect");
      cy.wait(400);
      cy.get(".runtime-panel-content").then(($drawer) => {
        const top = Math.round($drawer[0].getBoundingClientRect().top);
        cy.document().trigger("mousemove", { clientX: 700, clientY: top + 1 });
        cy.get(".runtime-panel-content").trigger("mousedown", { clientX: 700, clientY: top + 1 });
        cy.document().trigger("mousemove", { clientX: 700, clientY: top - 150 });
        cy.document().trigger("mouseup", { clientX: 700, clientY: top - 150 });
      });
      cy.wait(600);
      cy.document().then((doc) => {
        const drawerTop = doc.querySelector(".runtime-panel-content").getBoundingClientRect().top;
        const canvas = doc.querySelector("#sidebar-page-navigation > div").getBoundingClientRect().bottom;
        const left = doc.querySelector(".left-sidebar-panel-content").getBoundingClientRect().bottom;
        [
          ["canvas bottom", canvas],
          ["left panel bottom", left],
        ].forEach(([what, y]) => {
          if (Math.abs(y - drawerTop) > 1) violations.push(`${what} ${Math.round(y)} vs drawer top ${Math.round(drawerTop)}`);
        });
      });
    });

    it("[HP-17b] lifecycle CTA shows Sync, Pull commit and Commit states", function () {
      cy.get('[data-cy="lifecycle-cta-button"]').then(($cta) => {
        // Needs git sync configured against a reachable remote; the QA report marks it blocked.
        if (/Configure Git/i.test($cta.text())) this.skip();
        throw new Error("git sync is configured here: automate HP-17b before trusting this run");
      });
    });

    BLOCKED.forEach(({ title, kinds }) =>
      it(title, function () {
        cy.request({
          url: `${Cypress.env("server_host")}/api/data-sources/${Cypress.env("workspaceId")}/environments/${Cypress.env("environmentId")}/versions/${Cypress.env("editingVersionId")}`,
          headers: { "Tj-Workspace-Id": Cypress.env("workspaceId") },
          failOnStatusCode: false,
        }).then((res) => {
          const present = (res.body?.data_sources || []).some((ds) => kinds.includes(ds.kind));
          // Needs a reachable gRPC or OpenAPI target; the QA report marks these blocked.
          if (!present) this.skip();
          throw new Error(`a ${kinds[0]} data source exists here: automate ${idsOf(title)} before trusting this run`);
        });
      })
    );
  });

  describe("QA items across every surface", () => {
    CHECKS.forEach(({ title, run }) =>
      it(title, () => {
        const ids = idsOf(title);
        expect([...declared].filter((t) => !finished.has(t)), "sweep steps that did not finish").to.deep.equal([]);
        expect(sweep, "surfaces swept").to.have.length(SURFACE_COUNT);
        const violations = run();
        writeCheck(ids, violations).then(() => expectOpen(ids, violations));
      })
    );
  });
});
