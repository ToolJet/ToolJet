/**
 * MODULE — appBuilder/components/libraryComponent: browser-only helpers for the Library component widget
 * (Custom Component Library host, LibraryComponent.jsx).
 * FOR AI: the local license has `customComponentLibraries: false` and library authoring answers 451, so
 * stubCclBackend fakes the CCL surface IN THE BROWSER: it flips the license flag, serves a fixture library
 * list and serves a real ES-module bundle + manifest for each (libraryId, revision) — the real shell.html,
 * postMessage handshake, Inspector panel and drop flow all run unchanged. The fixture bundle posts
 * `{ type: 'qa-probe' }` messages (mount / focus / size) straight to the parent; installProbeLog records them.
 * addLibraryComponentsViaApi seeds configured instances + the app-level revision pin without DnD;
 * dragLibraryComponent drops one from the Components panel › Custom tab.
 */
import { libraryComponentText } from "Texts/appBuilder/components/libraryComponent";
import { libraryComponentSelector } from "Selectors/appBuilder/components/libraryComponent";

const T = libraryComponentText;
const L = T.library;

// pins are keyed by the dashless correlationId (libraryComponentRevision.ts:37,47-50)
export const dashless = (id) => id.replace(/-/g, "");

/**
 * The fixture bundle. The shell imports it as an ES module and renders `mod[componentName]` with the host's
 * React (shell.html window.__tj_React). Each component reports to the parent window directly:
 *   { type:'qa-probe', event:'mounted'|'size', component, w, h }  — the iframe's own viewport size
 *   { type:'qa-probe', event:'focus', component, id }             — an inner control got focus
 * LibraryComponent ignores unknown message types (LibraryComponent.jsx:181-205).
 */
export const PROBE_BUNDLE = `
const React = window.__tj_React;
const h = React.createElement;
const say = (msg) => window.parent.postMessage({ type: 'qa-probe', ...msg }, '*');
const useViewport = (component) => {
  React.useEffect(() => {
    const report = (event) => say({ event, component, w: window.innerWidth, h: window.innerHeight });
    report('mounted');
    const onResize = () => report('size');
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
};
const field = (component, id) =>
  h('input', { id, 'aria-label': id, onFocus: () => say({ event: 'focus', component, id }), style: { display: 'block', margin: 4 } });
export function FocusProbe(props) {
  useViewport('FocusProbe');
  return h('div', { id: 'probe-root', style: { position: 'absolute', inset: 0, background: '#e8f0fe' } },
    field('FocusProbe', 'inner-a'), field('FocusProbe', 'inner-b'), h('span', null, String(props.title ?? '')));
}
export function SizedProbe() {
  useViewport('SizedProbe');
  return h('div', { id: 'probe-root', style: { position: 'absolute', inset: 0, background: '#fde8e8' } }, 'sized');
}
`;

// manifest props for FocusProbe at revision 1.0.0: one unsectioned prop (→ "Properties"), two sectioned props,
// a hidden one (filterVisibleProps drops it) and one event
export const manifestV1 = {
  components: {
    [T.components.focus.exportName]: {
      displayName: T.components.focus.displayName,
      props: [
        { name: "title", label: "Title text", type: "string", default: "hello" },
        { name: "tone", label: "Tone", type: "enumeration", enumValues: ["calm", "loud"], default: "calm", section: "Appearance" },
        { name: "compact", label: "Compact", type: "boolean", default: false, section: "Layout" },
        { name: "accent", label: "Accent", type: "string", default: "#000000", section: "Appearance" },
        { name: "secretToken", label: "Secret token", type: "string", inspector: "hidden" },
      ],
      events: [{ name: "onPing" }],
    },
    [T.components.sized.exportName]: {
      displayName: T.components.sized.displayName,
      ...T.sizedManifest,
      props: [],
    },
  },
};

// revision 2.0.0 reshapes FocusProbe: one prop in a new section, no events
export const manifestV2 = {
  components: {
    [T.components.focus.exportName]: {
      displayName: `${T.components.focus.displayName} v2`,
      props: [{ name: "heading", label: "Heading", type: "string", default: "", section: "Content" }],
      events: [],
    },
    [T.components.sized.exportName]: manifestV1.components[T.components.sized.exportName],
  },
};

/**
 * @tjBlock  contexts
 * @tjUsage  stubCclBackend({ revisions: [{ version: '2.0.0', manifest: manifestV2 }, { version: '1.0.0', manifest: manifestV1 }], devUserId })
 * @tjDom    cy.intercept on: GET /api/license/access (response patched: customComponentLibraries=true);
 *           GET /api/custom-component-libraries (fixture list; revisions newest first, list `manifest` = latest);
 *           GET /api/custom-component-libraries/<id>/(revisions/<v>|dev/<uid>)/files/<file> (manifest.json,
 *           index.js = PROBE_BUNDLE, index.css; CORS * so the opaque-origin shell can import them);
 *           GET .../dev/<uid>/stream aliased `@devStream` (answered with a one-comment SSE body).
 *           Revision files 404 for an unknown (libraryId, revision).
 */
export const stubCclBackend = ({ revisions = [{ version: T.revisions.v1, manifest: manifestV1 }], devUserId = null, devManifest = manifestV1 } = {}) => {
  // Libraries now mount inline by default; the contract covers the sandboxed shell, which stays behind this flag
  // (inlineRuntime.ts getLibraryComponentRuntime). Set before every page load of the test.
  cy.on("window:before:load", (win) => {
    try {
      win.localStorage.setItem("tj-cc-runtime", "iframe");
    } catch (e) {
      // storage blocked: the page falls back to inline and the iframe assertions fail loudly
    }
  });
  cy.intercept({ method: "GET", url: /\/api\/license\/access(\?.*)?$/ }, (req) => {
    delete req.headers["if-none-match"];
    req.continue((res) => {
      if (res.body && typeof res.body === "object") res.body.customComponentLibraries = true;
    });
  }).as("licenseAccess");

  const files = {};
  revisions.forEach(({ version, manifest }) => {
    files[`revisions/${version}`] = manifest;
  });
  if (devUserId) files[`dev/${devUserId}`] = devManifest;

  const list = [
    {
      id: L.id,
      name: L.name,
      correlationId: L.correlationId,
      revisions: revisions.map(({ version }, i) => ({
        id: `${L.id.slice(0, -2)}${String(i).padStart(2, "0")}`,
        version,
        createdAt: "2026-10-01T10:00:00.000Z",
      })),
      devBundles: devUserId ? [{ userId: devUserId, userEmail: "dev@tooljet.io" }] : [],
      manifest: revisions[0]?.manifest,
    },
  ];
  cy.intercept({ method: "GET", url: /\/api\/custom-component-libraries(\?.*)?$/ }, { statusCode: 200, body: list }).as("libraryList");

  const cors = { "access-control-allow-origin": "*", "cache-control": "no-store" };
  cy.intercept(
    { method: "GET", url: /\/api\/custom-component-libraries\/[^/]+\/(revisions|dev)\/[^/]+\/files\/[^/?]+/ },
    (req) => {
      const m = req.url.match(/custom-component-libraries\/([^/]+)\/((?:revisions|dev)\/[^/]+)\/files\/([^/?]+)/);
      const [, libraryId, slot, file] = m;
      const manifest = libraryId === L.id ? files[slot] : undefined;
      if (!manifest) return req.reply({ statusCode: 404, headers: cors, body: { message: "not found" } });
      if (file === "manifest.json") return req.reply({ statusCode: 200, headers: { ...cors, "content-type": "application/json" }, body: manifest });
      if (file === "index.js") return req.reply({ statusCode: 200, headers: { ...cors, "content-type": "text/javascript" }, body: PROBE_BUNDLE });
      if (file === "index.css") return req.reply({ statusCode: 200, headers: { ...cors, "content-type": "text/css" }, body: "#probe-root{font:12px sans-serif}" });
      return req.reply({ statusCode: 404, headers: cors, body: {} });
    }
  ).as("libraryFile");

  cy.intercept({ url: /\/api\/custom-component-libraries\/[^/]+\/dev\/[^/]+\/stream/ }, (req) => {
    req.reply({ statusCode: 200, headers: { "content-type": "text/event-stream", "cache-control": "no-store" }, body: ": qa\n\n" });
  }).as("devStream");
};

/**
 * @tjBlock  contexts
 * @tjUsage  currentUserId().then((uid) => ...)
 * @tjDom    GET /api/session → the logged-in user's id (dev pins are `dev:<userId>`)
 */
export const currentUserId = () =>
  cy.getAuthHeaders().then((headers) =>
    cy.request({ method: "GET", url: `${Cypress.env("server_host")}/api/session`, headers }).then((res) => res.body.id)
  );

/**
 * @tjBlock  contexts
 * @tjUsage  addLibraryComponentsViaApi([{ name: 'focusprobe1', component: 'FocusProbe', layout: { top: 60, left: 2, width: 12, height: 200 } }], { pin: '1.0.0' })
 * @tjDom    GET /api/apps/<appId> → POST /api/v2/apps/<appId>/versions/<v>/components (a LibraryComponent item gets
 *           libraryComponent.js definition defaults + the fixture identity libraryId/correlationId/libraryName/
 *           componentName; any other `type` only what is passed) → PUT .../global_settings
 *           { customComponentLibraries: { <dashless correlationId>: pin } } when `pin` is given.
 */
export const addLibraryComponentsViaApi = (items, { pin, appId: appIdArg } = {}) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    const appId = appIdArg || Cypress.env("appId");
    const api = `${Cypress.env("server_host")}/api`;
    const headers = {
      "Content-Type": "application/json",
      "Tj-Workspace-Id": Cypress.env("workspaceId"),
      Cookie: `tj_auth_token=${cookie.value}`,
    };
    return cy.request({ method: "GET", url: `${api}/apps/${appId}`, headers }).then((res) => {
      const { id: versionId, home_page_id: pageId } = res.body.editing_version;
      Cypress.env("editingVersionId", versionId);
      const D = T.definition;
      const diff = {};
      items.forEach((item) => {
        const type = item.type || T.componentType;
        const isLib = type === T.componentType;
        const layout = { top: 40, left: 2, width: T.defaultSize.width, height: isLib ? T.defaultSize.height : 40, ...item.layout };
        const identity = isLib
          ? {
              libraryId: { value: L.id },
              correlationId: { value: L.correlationId },
              libraryName: { value: L.name },
              componentName: { value: item.component || T.components.focus.exportName },
            }
          : {};
        diff[item.id || crypto.randomUUID()] = {
          name: item.name,
          type,
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: isLib ? { ...D.properties, ...identity, ...item.properties } : item.properties || {},
          styles: isLib ? { ...D.styles, ...item.styles } : item.styles || {},
          others: isLib ? { ...D.others, ...item.others } : item.others || {},
          validation: {},
        };
      });
      cy.request({
        method: "POST",
        url: `${api}/v2/apps/${appId}/versions/${versionId}/components`,
        headers,
        body: { is_user_switched_version: false, pageId, diff },
        failOnStatusCode: false,
      }).then((r) => expect(r.status, `create components: ${JSON.stringify(r.body)}`).to.eq(201));
      if (pin) {
        cy.request({
          method: "PUT",
          url: `${api}/v2/apps/${appId}/versions/${versionId}/global_settings`,
          headers,
          body: { globalSettings: { customComponentLibraries: { [dashless(L.correlationId)]: pin } } },
          failOnStatusCode: false,
        }).then((r) => expect(r.status, `pin revision: ${JSON.stringify(r.body)}`).to.eq(200));
      }
    });
  });

/**
 * @tjBlock  contexts
 * @tjUsage  cy.on('window:before:load', installProbeLog); … probeLog().should(...)
 * @tjDom    window 'message' listener on the AUT window: keeps every `{ type: 'qa-probe' }` message posted by a
 *           fixture bundle, tagged with the `data-cy` of the iframe whose contentWindow sent it (`frame`)
 */
export const installProbeLog = (win) => {
  win.__libProbe = [];
  win.addEventListener("message", (e) => {
    if (!e.data || e.data.type !== "qa-probe") return;
    const frame = [...win.document.querySelectorAll("iframe")].find((f) => f.contentWindow === e.source);
    win.__libProbe.push({ ...e.data, frame: frame ? frame.getAttribute("data-cy") : null });
  });
};

export const probeLog = () => cy.window().then((win) => [...(win.__libProbe || [])]);

/**
 * @tjBlock  contexts
 * @tjUsage  expectShellMounted('focusprobe1', 'FocusProbe')
 * @tjDom    waits until the fixture bundle inside that instance's iframe has rendered (its 'mounted' probe) —
 *           i.e. the ready → load → props handshake completed for real
 */
export const expectShellMounted = (name, component) =>
  cy.window({ timeout: 30000 }).should((win) => {
    const hit = (win.__libProbe || []).find((m) => m.event === "mounted" && m.frame === name && m.component === component);
    expect(hit, `${component} bundle mounted inside ${name}'s iframe`).to.exist;
  });

/**
 * @tjBlock  canvas
 * @tjUsage  openCustomTab()
 * @tjDom    opens the Components panel (right-sidebar-components-button), picks the fixture library in the
 *           Components tab's library picker (LibraryPicker.jsx; custom libraries are license-gated), then waits for
 *           the picked library's version chip (the picked section has no data-cy of its own:
 *           CustomComponentsTab.jsx LibrarySection `picked`)
 */
export const openCustomTab = () => {
  cy.get("body").then(($body) => {
    if (!$body.find(`${libraryComponentSelector.libraryPicker}:visible`).length) {
      cy.get('[data-cy="right-sidebar-components-button"]').click();
    }
  });
  cy.get("body").then(($body) => {
    if ($body.find(`${libraryComponentSelector.versionChip(L.cardSlug)}:visible`).length) return;
    cy.get(libraryComponentSelector.libraryPicker, { timeout: 20000 }).should("be.visible").click({ force: true }); // the panel button tooltip can overlap it
    cy.get(libraryComponentSelector.libraryChoice(L.id)).should("be.visible").click();
  });
  cy.get(libraryComponentSelector.versionChip(L.cardSlug), { timeout: 20000 }).should("be.visible");
};

/**
 * @tjBlock  canvas
 * @tjUsage  dragLibraryComponent('FocusProbe', 300, 150)
 * @tjDom    real CDP drag of the Custom-tab card `[data-cy=custom-component-<export lower>]` (its react-dnd source
 *           ref) onto #real-canvas at (x, y) — the same priming as cy.dragAndDropWidget — then waits for autosave
 */
export const dragLibraryComponent = (exportName, x, y) => {
  openCustomTab();
  const source = libraryComponentSelector.componentCard(exportName);
  cy.get(source).should("be.visible");
  cy.wait(1000);
  cy.realDragInit();
  cy.wait(1000);
  cy.realDragRewarm();
  cy.realDragAndDrop(source, "#real-canvas", { targetX: x, targetY: y });
  cy.waitForAutoSave();
};

/**
 * @tjBlock  canvas
 * @tjUsage  slotGeometry('focusprobe1').then((g) => expect(g.iframe.width).to.be.closeTo(g.slot.width, 1))
 * @tjDom    plain rects of the grid box, the padded inner box's CONTENT area (its rect minus computed padding) =
 *           the canvas slot, and the iframe; plus the iframe's computed display and border widths
 */
export const slotGeometry = (name) =>
  cy.get(libraryComponentSelector.iframe(name), { timeout: 30000 }).should("be.visible").then(($f) => {
    const f = $f[0];
    const doc = f.ownerDocument;
    const win = doc.defaultView;
    const inner = doc.querySelector(libraryComponentSelector.innerBox(name));
    const box = doc.querySelector(libraryComponentSelector.draggableWidget(name));
    const plain = (r) => ({ left: r.left, top: r.top, width: r.width, height: r.height, right: r.right, bottom: r.bottom });
    const ir = inner.getBoundingClientRect();
    const cs = win.getComputedStyle(inner);
    const pl = parseFloat(cs.paddingLeft);
    const pr = parseFloat(cs.paddingRight);
    const pt = parseFloat(cs.paddingTop);
    const pb = parseFloat(cs.paddingBottom);
    const fcs = win.getComputedStyle(f);
    return {
      box: plain(box.getBoundingClientRect()),
      slot: { left: ir.left + pl, top: ir.top + pt, width: ir.width - pl - pr, height: ir.height - pt - pb },
      iframe: plain(f.getBoundingClientRect()),
      display: fcs.display,
      border: fcs.borderTopWidth,
    };
  });

/**
 * @tjBlock  inspector
 * @tjUsage  inspectorSections().then((sections) => expect(sections.map((s) => s.title)).to.deep.eq([...]))
 * @tjDom    every Inspector accordion item (`.accordion-item` with a `widget-accordion-<title>` header) in DOM
 *           order → { title, labels: field labels (`[data-cy$="-widget-parameter-label"]` texts), text } — plain objects
 */
export const inspectorSections = () =>
  cy.get('[data-cy^="widget-accordion-"]', { timeout: 20000 }).then(($headers) =>
    [...$headers].map((h) => {
      const item = h.closest(".accordion-item");
      return {
        title: h.innerText.trim(),
        labels: [...item.querySelectorAll('[data-cy$="-widget-parameter-label"]')].map((l) => l.innerText.trim()),
        text: item.innerText.replace(/\s+/g, " ").trim(),
      };
    })
  );

/**
 * @tjBlock  inspector
 * @tjUsage  pickRevision('2.0.0')
 * @tjDom    Components panel › Custom tab › the library's version chip (`custom-library-version-<slug>`) → the
 *           menu row whose title is that version (pins it app-wide: CustomComponentsTab.jsx:182-186)
 */
export const pickRevision = (version) => {
  openCustomTab();
  cy.get(libraryComponentSelector.versionChip(L.cardSlug)).click();
  cy.contains(libraryComponentSelector.versionMenuRow, version).click();
  cy.get(libraryComponentSelector.versionChip(L.cardSlug)).should("have.text", version);
};
