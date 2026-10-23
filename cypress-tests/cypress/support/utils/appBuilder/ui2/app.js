// Test apps for the UI 2.0 browser QA suite: sign-in to the configured workspace, apps built through the same
// components endpoint the editor saves to (each component is its config's definition, as a palette drop makes it),
// the viewer and editor views, theme and canvas settings, and cleanup. Every app is named "Cypress UI2 ..." and
// deleted by the spec that made it; a stale one from an aborted run is swept before the next run.
import { GRID_COLUMNS } from "./widgets";

export const APP_PREFIX = "Cypress UI2";

const clone = (o) => JSON.parse(JSON.stringify(o ?? {}));
const uuid = () => crypto.randomUUID();

/**
 * Signs in with the suite's usual seed account (cy.apiLogin defaults) and switches to the workspace named by
 * `CYPRESS_ui2_workspace` (a slug, default "final"); falls back to the account's default workspace.
 */
export const ui2Login = () => {
  const slug = Cypress.env("ui2_workspace") || "final";
  cy.apiLogin();
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({ method: "GET", url: `${Cypress.env("server_host")}/api/organizations`, headers, log: false })
      .then(({ body }) => {
        const ws = (body.organizations || []).find((o) => o.slug === slug || o.name === slug);
        if (ws && ws.id !== Cypress.env("workspaceId")) cy.apiLogin(undefined, undefined, ws.id);
      })
  );
  cy.window({ log: false }).then((win) => win.localStorage.setItem("walkthroughCompleted", "true"));
};

/** Deletes apps left by an aborted run of this suite (named "Cypress UI2 ..."). Never touches any other app. */
export const sweepStaleApps = () => {
  cy.getAuthHeaders().then((headers) =>
    cy
      .request({
        method: "GET",
        url: `${Cypress.env("server_host")}/api/apps?page=1&searchKey=${encodeURIComponent(APP_PREFIX)}`,
        headers,
        log: false,
      })
      .then(({ body }) => {
        (body.apps || [])
          .filter((a) => a.name.startsWith(`${APP_PREFIX} `))
          .forEach((a) => cy.apiDeleteApp(a.id));
      })
  );
};

/**
 * Creates an app and records what later commands need: appId (cy.apiCreateApp), editingVersionId (for
 * cy.apiUpdateGlobalSettings), the home page id and handle, and the version name (for the viewer URL).
 */
export const createUi2App = (title) => {
  const name = `${APP_PREFIX} ${title} ${Date.now().toString(36)}`;
  cy.apiCreateApp(name);
  return cy.apiGetAppData().then((app) => {
    const page = app.pages[0];
    const info = {
      name,
      appId: app.id,
      versionId: app.editing_version.id,
      versionName: app.editing_version.name,
      pageId: page.id,
      pageHandle: page.handle,
    };
    Cypress.env("editingVersionId", info.versionId);
    Cypress.env("ui2App", info);
    return info;
  });
};

/** Posts components in the shape the editor saves a drop in (componentsSlice addComponentToCurrentPage). */
export const postComponents = (diff) =>
  cy.getAuthHeaders().then((headers) => {
    const app = Cypress.env("ui2App");
    return cy
      .request({
        method: "POST",
        url: `${Cypress.env("server_host")}/api/v2/apps/${app.appId}/versions/${app.versionId}/components`,
        headers: { ...headers, "Content-Type": "application/json" },
        body: { is_user_switched_version: false, pageId: app.pageId, diff },
        log: false,
      })
      .then((res) => expect(res.status, "components saved").to.be.oneOf([200, 201]));
  });

/**
 * One component as a palette drop creates it: its config's definition, its config type, desktop and mobile layouts.
 * `properties` / `styles` override definition values (raw values, wrapped as { value }). Mobile shows every
 * component at full width so the 390 px viewer (mobile layout below 600 px) renders the same widgets.
 */
export const componentEntry = (widget, { name, top, left = 1, width, height, parent = null, properties = {}, styles = {} }) => {
  const definition = clone(widget.config.definition);
  // What the widget registry (WidgetManager/componentTypes.js) adds to every config before a drop (the editor's create diff carries all of these; a
  // component saved without general/generalStyles leaves the editor and viewer on their loading screen).
  delete definition.events;
  definition.properties = definition.properties || {};
  definition.styles = { cssClass: { value: "" }, ...(definition.styles || {}) };
  definition.general = definition.general || {};
  definition.generalStyles = { boxShadow: { value: "0px 0px 0px 0px #00000040" }, ...(definition.generalStyles || {}) };
  definition.validation = definition.validation || {};
  definition.others = { ...(definition.others || {}), showOnDesktop: { value: "{{true}}" }, showOnMobile: { value: "{{true}}" } };
  Object.entries(properties).forEach(([k, v]) => (definition.properties[k] = { value: v }));
  Object.entries(styles).forEach(([k, v]) => (definition.styles[k] = { value: v }));
  const w = width ?? widget.defaultSize.width;
  const h = height ?? widget.defaultSize.height;
  return {
    name,
    type: widget.type,
    ...definition,
    parent,
    layouts: {
      desktop: { top, left, width: w, height: h },
      mobile: { top, left: 0, width: parent ? w : GRID_COLUMNS, height: h },
    },
  };
};

/**
 * A widget's default children, made the way addChildrenWidgetsToParent makes them on a drop (List view rows,
 * Dialog header/footer slots).
 */
export const defaultChildren = (widget, parentId, parentName, configOf) =>
  (widget.config.defaultChildren || []).map((child, i) => {
    const childWidget = configOf(child.componentName);
    const props = {};
    (child.properties || []).forEach((prop) => {
      const fixed = child.defaultValue && child.defaultValue[prop] !== undefined;
      props[prop] =
        widget.type === "ShadListView" && child.accessorKey && !fixed
          ? `{{listItem.${child.accessorKey}}}`
          : (child.defaultValue && child.defaultValue[prop]) || "";
    });
    const layout = child.layout || {};
    const width = layout.width ? layout.width : (childWidget.defaultSize.width * 100) / GRID_COLUMNS;
    const parent = child.slotName ? `${parentId}-${child.slotName}` : parentId;
    return [
      uuid(),
      componentEntry(childWidget, {
        name: `${parentName}c${i + 1}`,
        top: layout.top || 0,
        left: layout.left || 0,
        width: child.incrementWidth ? width * child.incrementWidth : width,
        height: layout.height || childWidget.defaultSize.height,
        parent,
        properties: props,
      }),
    ];
  });

/** The small fixed size: about half the default height on the grid, at least two rows, Dynamic height off. */
export const smallHeight = (widget) => Math.max(20, Math.floor(widget.defaultSize.height / 2 / 10) * 10);

/**
 * Lays every widget out twice, top to bottom: at its default size (default properties) and at the small fixed size
 * with Dynamic height off, side by side when both fit in the 43 columns. Returns the placements
 * [{ widget, size: 'default'|'small', name, id, layout }] and posts the components (children included).
 */
export const buildGallery = (widgets, configOf, { gap = 30 } = {}) => {
  const placements = [];
  const diff = {};
  let top = 20;
  widgets.forEach((widget) => {
    const width = Math.min(widget.defaultSize.width, GRID_COLUMNS - 2);
    const small = smallHeight(widget);
    const sideBySide = width * 2 + 3 <= GRID_COLUMNS;
    const rows = [
      { size: "default", left: 1, top, height: widget.defaultSize.height, properties: {} },
      {
        size: "small",
        left: sideBySide ? width + 2 : 1,
        top: sideBySide ? top : top + widget.defaultSize.height + gap,
        height: small,
        properties: widget.hasDynamicHeight ? { dynamicHeight: "{{false}}" } : {},
      },
    ];
    rows.forEach((r) => {
      const id = uuid();
      const name = `${widget.base}${r.size === "default" ? "d" : "s"}`;
      diff[id] = componentEntry(widget, { name, top: r.top, left: r.left, width, height: r.height, properties: r.properties });
      defaultChildren(widget, id, name, configOf).forEach(([cid, c]) => (diff[cid] = c));
      placements.push({ widget, size: r.size, name, id, layout: { top: r.top, left: r.left, width, height: r.height } });
    });
    const bottom = Math.max(...rows.map((r) => r.top + r.height));
    top = bottom + gap;
  });
  // The endpoint takes a page's worth; post in slices so one bad widget names itself in the error.
  const ids = Object.keys(diff);
  for (let i = 0; i < ids.length; i += 40) {
    postComponents(Object.fromEntries(ids.slice(i, i + 40).map((k) => [k, diff[k]])));
  }
  return cy.wrap(placements, { log: false });
};

/** Light or dark: the version's appMode wins over the viewer's own toggle. */
export const setTheme = (theme) => cy.apiUpdateGlobalSettings({ appMode: theme });

export const viewerUrl = (app) =>
  `/applications/${app.appId}/${app.pageHandle}?env=development&version=${encodeURIComponent(app.versionName)}`;

/** Waits until the named widgets have mounted, web fonts are in, and animations (charts) have settled. */
export const waitForWidgets = (names, settleMs = 2500) => {
  names.forEach((n) => cy.get(`[data-cy="draggable-widget-${n}"]`, { timeout: 60000 }).should("exist"));
  cy.document({ log: false }).then((doc) => doc.fonts && doc.fonts.ready);
  cy.wait(settleMs, { log: false });
};

export const openViewer = (names, settleMs) => {
  cy.then(() => cy.visit(viewerUrl(Cypress.env("ui2App"))));
  waitForWidgets(names, settleMs);
};

export const openEditor = (names, settleMs) => {
  cy.then(() => cy.openApp("", Cypress.env("workspaceId"), Cypress.env("ui2App").appId, '[data-cy^="draggable-widget-"]'));
  waitForWidgets(names, settleMs);
  deselectAll();
};

/** Clears the editor selection so no handle or selection outline sits on a widget. */
export const deselectAll = () => {
  cy.get("body").type("{esc}", { log: false, force: true });
  cy.get("body").then(($b) => {
    if ($b.find("#real-canvas").length) cy.get("#real-canvas").click("bottomRight", { force: true, log: false });
  });
};

export const deleteUi2App = () =>
  cy.then(() => {
    const app = Cypress.env("ui2App");
    Cypress.env("ui2App", null);
    // CYPRESS_ui2_keep_apps=true keeps the app for debugging (the next run's sweep removes it).
    if (app && !Cypress.env("ui2_keep_apps")) cy.apiDeleteApp(app.appId);
  });
