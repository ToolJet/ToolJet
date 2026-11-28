import * as probe from "./probe";

export const forEachTheme = (fn) => ["light", "dark"].forEach(fn);

const LEFT = ".left-sidebar-panel-content";
const RIGHT = ".right-panel-shell";
const DRAWER = ".runtime-panel";

export const api = (method, path, body) =>
  cy.getCookie("tj_auth_token").then((cookie) =>
    cy
      .request({
        method,
        url: `${Cypress.env("server_host")}/api${path}`,
        headers: { "Tj-Workspace-Id": Cypress.env("workspaceId"), Cookie: `tj_auth_token=${cookie.value}` },
        body,
      })
      .then((res) => res.body)
  );

// A 22-character name, as in the QA report's debugger detail title (UC-08).
export const SHORT_QUERY = "setDeepNestedVariables";
// Long enough to clip in every panel list (UC-07); its error log gives the debugger a long row.
export const LONG_QUERY = "customerOrdersWithInvoicesAndShippingAddressesForTheCurrentBillingPeriod";

// `--env panelWorkspaceId=<id>` pins the workspace: the admin's default one may be a git-sync
// workspace, which refuses new apps on its default branch.
export const panelLogin = () => cy.apiLogin(undefined, undefined, Cypress.env("panelWorkspaceId") || "");

export const seedPanelApp = (appName) => {
  panelLogin();
  cy.apiCreateApp(appName);
  cy.then(() => api("GET", `/apps/${Cypress.env("appId")}`)).then((app) => {
    const version = app.editing_version;
    const layout = (top) => ({ top, left: 2, width: 10, height: 40 });
    const component = (name, type, top, properties = {}) => ({
      name,
      type,
      layouts: { desktop: layout(top), mobile: layout(top) },
      properties,
    });
    api("POST", `/v2/apps/${app.id}/versions/${version.id}/components`, {
      is_user_switched_version: false,
      pageId: version.home_page_id,
      diff: {
        [crypto.randomUUID()]: component("button1", "Button", 30),
        // The binding gives the Dependencies panel a row for the long query.
        [crypto.randomUUID()]: component("textinput1", "TextInput", 100, {
          placeholder: { value: `{{queries.${LONG_QUERY}.data}}` },
        }),
      },
    });
    api("POST", `/v2/apps/${app.id}/versions/${version.id}/pages`, {
      id: crypto.randomUUID(),
      name: "Second",
      handle: "second",
      index: 1,
    });
  });
  [
    ["runjs1", "return [1, 2, 3]"],
    [SHORT_QUERY, "return { deep: { nested: true } }"],
    [LONG_QUERY, `throw new Error("${LONG_QUERY} failed: no billing period is selected for the current customer region")`],
  ].forEach(([queryName, code]) =>
    cy.apiAddQueryToApp({
      queryName,
      options: { code, hasParamSupport: true, parameters: [] },
      dataSourceName: "runjsdefault",
      dsKind: "runjs",
    })
  );
  cy.apiAddQueryToApp({
    queryName: "restapi1",
    options: { method: "get", url: "https://example.com", url_params: [["", ""]] },
    dataSourceName: "restapidefault",
    dsKind: "restapi",
  });
};

export const expectTheme = (theme) =>
  cy.get(".left-sidebar").should(theme === "dark" ? "have.class" : "not.have.class", "dark-theme");

// darkMode must be in localStorage before the app mounts (App.jsx reads it once).
export const openEditor = (theme, [width, height] = [1440, 960]) => {
  cy.viewport(width, height);
  cy.window().then((win) => win.localStorage.setItem("darkMode", String(theme === "dark")));
  cy.openApp("", Cypress.env("workspaceId"), Cypress.env("appId"), '[data-cy="draggable-widget-button1"]');
  expectTheme(theme);
};

const openRail = (name) => {
  cy.get(`[data-cy="left-sidebar-${name}-button"]`).then(($button) => {
    if (!$button.hasClass("sidebar-item--active")) cy.wrap($button).click();
  });
  cy.get(`[data-cy="left-sidebar-${name}-button"]`).should("have.class", "sidebar-item--active");
  cy.get(LEFT).should("have.length", 1);
};

const openDrawerTab = (id) => {
  cy.get(`[data-cy="runtime-panel-tab-${id}"]`).then(($tab) => {
    const open = Cypress.$(".runtime-panel-content").hasClass("expanded");
    if (!(open && $tab.hasClass("active"))) cy.wrap($tab).click();
  });
  cy.get(".runtime-panel-content").should("have.class", "expanded");
  cy.get(`[data-cy="runtime-panel-tab-${id}"]`).should("have.class", "active");
};

export const PANELS = {
  pages: { root: LEFT, rail: "pages", open: () => openRail("pages") },
  components: { root: LEFT, rail: "components", open: () => openRail("components") },
  queries: { root: LEFT, rail: "queries", open: () => openRail("queries") },
  libraries: { root: LEFT, rail: "libraries", open: () => openRail("libraries") },
  "code-search": { root: LEFT, rail: "code-search", open: () => openRail("code-search") },
  dependencies: { root: LEFT, rail: "dependencies", open: () => openRail("dependencies") },
  settings: { root: LEFT, rail: "settings", open: () => openRail("settings") },
  query: {
    root: RIGHT,
    open: () => {
      openRail("queries");
      cy.get('[data-cy="list-query-runjs1"]').click();
      // At 683px the Queries panel overlaps the query editor, so close it once the query is open.
      cy.get('[data-cy="left-sidebar-queries-button"]').click();
      cy.get(LEFT).should("not.exist");
      cy.get('[data-cy="query-tab-setup"]').should("be.visible");
    },
  },
  component: {
    root: RIGHT,
    open: () => {
      cy.get('[data-cy="draggable-widget-button1"]').click();
      cy.get(RIGHT).should("not.have.class", "right-panel-shell--query").and("be.visible");
    },
  },
  inspect: { root: DRAWER, open: () => openDrawerTab("inspect") },
  debugger: { root: DRAWER, open: () => openDrawerTab("debugger") },
  header: { root: ".header", open: () => {} },
};

export const openPanel = (name) => PANELS[name].open();

// Yields `measure(doc)` once it has held for `ms`, so nothing is read while a panel still animates or
// follows the drawer's committed height.
export const settledValue = (measure, ms = 500) => {
  let last;
  let since;
  return cy
    .document()
    .should((doc) => {
      const now = JSON.stringify(measure(doc));
      if (now !== last) [last, since] = [now, Date.now()];
      expect(Date.now() - since, "ms the measurement has held").to.be.at.least(ms);
    })
    .then(() => JSON.parse(last));
};

export const AUDIT_CHECKS = [
  { ids: ["UB-04"], key: "unnamed", title: "every focusable control has an accessible name" },
  { ids: ["UB-05", "UB-06", "UB-07", "UB-08"], key: "lowContrast", title: "text reaches WCAG AA on its background" },
  { ids: ["UB-13"], key: "ringless", title: "every Tab stop shows a focus indicator" },
];

const tags = (ids) => ids.map((id) => `[${id}]`).join("");

// Every QA item the harness checks is closed, so any violation fails its check.
export const expectClean = (ids, violations) => expect(violations, tags(ids)).to.deep.equal([]);

const MAX_STOPS = 40;
const STILL = "panel-audit-still";

// Asserts every AUDIT_CHECKS entry except those with an id in `skip`, for callers that only want the
// raw audit (see [UC-05] in panelSweep).
export const auditPanel = (root, { skip = new Set(), walk: walkFocus = true } = {}) => {
  const audit = { unnamed: [], lowContrast: [], ringless: [], hidden: [], rings: [], walk: "" };
  const rest = new Map();
  const stops = [];
  let rootEl;
  let first;
  let blurred;

  // Waits until `target`'s focus styles hold for three frames, because React commits some
  // focus-driven styles a few frames late (react-select draws its ring that way).
  const settle = (target = (doc) => doc.activeElement) =>
    cy.window({ log: false }).then(
      (win) =>
        new Promise((done) => {
          let last;
          let stable = 0;
          let frames = 0;
          const tick = () => {
            const el = target(win.document);
            const now = el ? probe.focusChain(el).map(probe.ringSignature).join(" || ") : "";
            stable = now === last ? stable + 1 : 0;
            last = now;
            if (stable >= 3 || ++frames > 30) done();
            else win.requestAnimationFrame(tick);
          };
          win.requestAnimationFrame(tick);
        })
    );

  // The resting snapshot is taken unfocused and with transitions paused, so a field the panel
  // autofocuses on open is compared with its resting look, and every stop with its final state.
  (typeof root === "string" ? cy.get(root) : cy.wrap(root, { log: false })).then(($root) => {
    rootEl = $root[0];
    const doc = rootEl.ownerDocument;
    if (!doc.getElementById(STILL)) {
      const still = doc.createElement("style");
      still.id = STILL;
      still.textContent = "*, *::before, *::after { transition: none !important; animation: none !important; }";
      doc.head.appendChild(still);
    }
    blurred = doc.activeElement;
    blurred?.blur();
  });
  settle(() => blurred);
  cy.then(() => {
    expect(rootEl.isConnected && probe.textElements(rootEl).length > 0, "audited surface still on screen after blur").to.equal(
      true
    );
    const controls = probe.focusables(rootEl);
    controls.forEach((el) => {
      rest.set(el, probe.focusChain(el).map(probe.ringSignature));
      if (!probe.accessibleName(el) && !el.matches(probe.TEXT_ENTRY)) audit.unnamed.push(probe.label(el));
    });
    probe.textElements(rootEl).forEach((el) => {
      const contrast = probe.textContrast(el);
      if (contrast && contrast.ratio < contrast.min) audit.lowContrast.push(`${probe.label(el)} ${contrast.ratio.toFixed(2)}:1`);
    });
    first = controls[0];
    audit.walk = !walkFocus ? "not walked" : first ? "" : "no stops";
  });

  const recordStop = (el) => {
    const chain = probe.focusChain(el);
    stops.push({
      el,
      chain,
      label: probe.label(el),
      focused: chain.map(probe.ringSignature),
      shapes: chain.map(probe.ringShape),
      hidden: probe.hiddenWhileFocused(el),
    });
  };

  // A stop that is not tabbable at rest (a roving-tabindex item, a scroller Chrome makes focusable)
  // is compared with its look once the walk has moved focus off it.
  const judgeStops = () =>
    stops.forEach(({ el, chain, label, focused, shapes, hidden }) => {
      const unfocused = rest.get(el) || chain.map(probe.ringSignature);
      const changed = focused.findIndex((signature, i) => signature !== unfocused[i]);
      if (changed === -1) audit.ringless.push(label);
      else audit.rings.push(`${shapes[changed]} | ${label}`);
      if (hidden) audit.hidden.push(`${label} (${hidden})`);
    });

  // Code fields bind Tab to indent, so the walk leaves them the CodeMirror way, Escape then Tab.
  const tab = (from) => {
    if (from?.closest(".cm-editor")) cy.realPress("Escape");
    cy.realPress("Tab");
  };

  const walk = (seen, from) => {
    tab(from);
    settle();
    cy.document().then((doc) => {
      const el = doc.activeElement;
      if (!rootEl.contains(el)) audit.walk = `left the surface after ${seen.size} stops`;
      else if (seen.has(el)) audit.walk = `returned to ${probe.label(el)} after ${seen.size} stops`;
      else if (seen.size >= MAX_STOPS) audit.walk = `stopped at the ${MAX_STOPS}-stop cap`;
      else {
        seen.add(el);
        recordStop(el);
        walk(seen, el);
      }
    });
  };

  // Programmatic focus on the first stop, then Tab and Shift+Tab, so it carries keyboard modality.
  cy.then(() => {
    if (!first || !walkFocus) return;
    first.focus();
    tab(first);
    cy.realPress(["Shift", "Tab"]);
    settle();
    cy.document().then((doc) => {
      const seen = new Set();
      if (rootEl.contains(doc.activeElement)) {
        seen.add(doc.activeElement);
        recordStop(doc.activeElement);
      }
      walk(seen, doc.activeElement);
    });
  });

  let last;
  cy.document().then((doc) => {
    last = doc.activeElement;
    last?.blur();
  });
  settle(() => last);
  cy.document().then((doc) => {
    judgeStops();
    doc.getElementById(STILL)?.remove();
    Object.values(audit)
      .filter(Array.isArray)
      .forEach((list) => list.sort());
  });
  return cy.then(() => {
    AUDIT_CHECKS.filter(({ ids }) => !ids.some((id) => skip.has(id))).forEach(({ ids, key }) =>
      expect(audit[key], `${tags(ids)} ${root}`).to.deep.equal([])
    );
    return audit;
  });
};
