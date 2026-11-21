/**
 * MODULE — appBuilder/components/tabs: browser-only helpers for the Tabs widget.
 * FOR AI: addTabsViaApi seeds fully-configured Tabs, their children (via `parent: '<tabsId>-<tabId>'`) and helper
 * widgets plus their events in one components POST; openTabsAppInViewer opens the running app; tabsBoxes /
 * readTabsBoxes read the real layout boxes + computed styles of the RenderWidget box, the Tabs root, the header
 * row, every header (with its hover surface), the nav scroll arrows and every pane wrapper; tabsComponentId reads
 * a Tabs' component id from its pane canvases; focusTrail walks real keyboard focus with Tab.
 */
import { tabsText } from "Texts/appBuilder/components/tabs";
import { tabsSelector } from "Selectors/appBuilder/components/tabs";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

/**
 * @tjBlock  contexts
 * @tjUsage  addTabsViaApi([{ id: TABS_ID, name: 'tb', properties: { useDynamicOptions: { value: '{{true}}' }, tabs: { value: "{{[{title:'A',id:'a'}]}}" } }, events: [counterEvent('onTabSwitch', 'sw')] }, { type: 'Text', name: 'child', parent: `${TABS_ID}-a`, layout: { top: 10, left: 2, width: 10, height: 40 } }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components
 *           (an item without `type` is a Tabs with the tabs.js definition properties/styles/others merged under the
 *           item's own; other types post only what is passed; `id` pins the component id and `parent` places a child
 *           in a tab pane `<tabsId>-<tabId>`) → POST .../events per handler (merged over show-alert; `componentName`
 *           in a control-component event resolves to the seeded component's id).
 */
export const addTabsViaApi = (items, { appId: appIdArg } = {}) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    // resolve lazily: apiCreateApp sets Cypress.env('appId') only when its request completes
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
      const D = tabsText.definition;
      const ids = {};
      items.forEach((item) => {
        ids[item.name] = item.id || crypto.randomUUID();
      });
      const diff = {};
      const events = [];
      items.forEach((item) => {
        const id = ids[item.name];
        const isTabs = !item.type || item.type === tabsText.componentType;
        const layout = isTabs
          ? { top: 40, left: 2, width: 20, height: 300, ...item.layout }
          : { top: 10, left: 2, width: 10, height: 40, ...item.layout };
        diff[id] = {
          name: item.name,
          type: item.type || tabsText.componentType,
          ...(item.parent ? { parent: item.parent } : {}),
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: { ...(isTabs ? D.properties : {}), ...item.properties },
          styles: { ...(isTabs ? D.styles : {}), ...item.styles },
          others: { ...(isTabs ? D.others : {}), ...item.others },
          validation: {},
        };
        (item.events || []).forEach((e, index) => {
          const { componentName, ...rest } = e;
          events.push({
            name: rest.eventId, // event_handlers.name is NOT NULL
            event: {
              actionId: "show-alert",
              alertType: "info",
              ...rest,
              ...(componentName ? { componentId: ids[componentName] } : {}),
            },
            eventType: "component",
            attachedTo: id,
            index,
          });
        });
      });
      cy.request({
        method: "POST",
        url: `${api}/v2/apps/${appId}/versions/${versionId}/components`,
        headers,
        body: { is_user_switched_version: false, pageId, diff },
        failOnStatusCode: false,
      }).then((r) => expect(r.status, `create components: ${JSON.stringify(r.body)}`).to.eq(201));
      events.forEach((body) =>
        cy
          .request({
            method: "POST",
            url: `${api}/v2/apps/${appId}/versions/${versionId}/events`,
            headers,
            body,
            failOnStatusCode: false,
          })
          .then((r) => expect(r.status, `create event: ${JSON.stringify(r.body)}`).to.be.oneOf([200, 201]))
      );
    });
  });

/**
 * @tjBlock  contexts
 * @tjUsage  addTabsViaApi([{ name: 'tb', properties: tabsData([{ title: 'A', id: 'a' }, { title: 'B', id: 'b', disable: true }], 'a') }])
 * @tjDom    properties for a Tabs driven by Dynamic options (tabs.js:15-22, 57-79): useDynamicOptions {{true}}, `tabs`
 *           = the array as a JSON expression (titles may hold quotes), and `defaultTab` when given. Avoids the static
 *           tabItems array, which the loader merges positionally with the definition's three default tabs.
 */
export const tabsData = (tabs, defaultTab) => ({
  useDynamicOptions: { value: "{{true}}" },
  tabs: { value: `{{${JSON.stringify(tabs)}}}` },
  ...(defaultTab !== undefined ? { defaultTab: { value: String(defaultTab) } } : {}),
});

/**
 * @tjBlock  contexts
 * @tjUsage  openTabsAppInViewer(tabsSelector.headers('tb'), { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openTabsAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const snapshot = (box, name) => {
  const win = box.ownerDocument.defaultView;
  const cs = (el) => win.getComputedStyle(el);
  const root = box.querySelector(`.tabs-component[data-cy="${name}"]`);
  const nav = root ? root.querySelector(":scope > div > ul.nav") : null;
  const headers = nav ? [...nav.querySelectorAll(":scope > li.nav-item")] : [];
  const arrows = root ? [...root.querySelectorAll(":scope > div > div.px-2")] : [];
  const panes = root ? [...root.querySelectorAll(".tab-pane[activetab]")] : [];
  return {
    box: rectOf(box),
    boxClass: box.className,
    root: root
      ? {
          ...rectOf(root),
          display: cs(root).display,
          inert: !!root.inert,
          dataDisabled: root.getAttribute("data-disabled"),
          pointerEvents: cs(root).pointerEvents,
        }
      : null,
    nav: nav
      ? {
          ...rectOf(nav),
          paddingLeft: parseFloat(cs(nav).paddingLeft),
          paddingRight: parseFloat(cs(nav).paddingRight),
          scrollLeft: nav.scrollLeft,
          scrollWidth: nav.scrollWidth,
          clientWidth: nav.clientWidth,
          display: cs(nav).display,
        }
      : null,
    headers: headers.map((li) => {
      const surface = li.firstElementChild;
      const label = surface && surface.querySelector(":scope > span, .text-truncate, div");
      return {
        ...rectOf(li),
        text: li.textContent.trim(),
        active: li.classList.contains("active"),
        styleWidth: li.style.width,
        tabIndex: li.tabIndex,
        opacity: parseFloat(cs(li).opacity),
        cursor: cs(li).cursor,
        borderBottomWidth: parseFloat(cs(li).borderBottomWidth),
        borderBottomStyle: cs(li).borderBottomStyle,
        borderBottomColor: cs(li).borderBottomColor,
        surfaceBg: surface ? cs(surface).backgroundColor : null,
        labelRect: rectOf(label),
      };
    }),
    arrows: arrows.map((a) => ({ ...rectOf(a), opacity: parseFloat(cs(a).opacity), cursor: cs(a).cursor })),
    panes: panes.map((p) => {
      const w = p.parentElement;
      const canvas = p.querySelector('[id^="canvas-"]');
      return {
        id: p.getAttribute("activetab"),
        ...rectOf(p),
        canvasScrollTop: canvas ? canvas.scrollTop : null,
        canvasScrollHeight: canvas ? canvas.scrollHeight : null,
        canvasClientHeight: canvas ? canvas.clientHeight : null,
        wrapper: {
          ...rectOf(w),
          display: cs(w).display,
          position: cs(w).position,
          transform: cs(w).transform,
          opacity: parseFloat(cs(w).opacity),
          visibility: cs(w).visibility,
        },
      };
    }),
    // a pane's wrapper may be `display:none`: list every wrapper, mounted pane or not (renderOnlyActiveTab)
    paneWrapperCount: root ? root.querySelectorAll(":scope > div:last-child > div").length : 0,
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  tabsBoxes('tb', (b) => expect(b.headers.map((h) => h.active)).to.deep.eq([true, false]))
 * @tjDom    retries the callback with plain objects for: the RenderWidget box (rect, class), the Tabs root (rect,
 *           display, inert, data-disabled, pointer-events), the header <ul> (rect, padding, scroll offsets), every
 *           visible header <li> (rect, text, active, inline width, tabIndex, opacity, cursor, bottom border width/style/
 *           colour, hover-surface background), the nav scroll arrows (rect, opacity, cursor) and every mounted pane
 *           (tab id, rect, its canvas scroll offsets, and its wrapper's display/position/transform/opacity/visibility).
 */
export const tabsBoxes = (name, assertFn) =>
  cy.get(tabsSelector.draggableWidget(name)).first().should(($box) => assertFn(snapshot($box[0], name)));

/**
 * @tjBlock  canvas
 * @tjUsage  readTabsBoxes('tb').then((before) => { ... })
 * @tjDom    same plain object as tabsBoxes, yielded once (no retry) for before/after comparisons
 */
export const readTabsBoxes = (name) => cy.get(tabsSelector.draggableWidget(name)).first().then(($box) => snapshot($box[0], name));

/**
 * @tjBlock  canvas
 * @tjUsage  tabsComponentId('tabs1').then((id) => cy.get(tabsSelector.paneCanvas(id, 't0')))
 * @tjDom    component id of a Tabs, read from its first pane canvas id `canvas-<componentId>-<tabId>` (Tabs.jsx:607-608)
 */
export const tabsComponentId = (name) =>
  cy
    .get(`${tabsSelector.draggableWidget(name)} .tab-pane[activetab]`)
    .first()
    .then(($pane) => {
      const tabId = $pane.attr("activetab");
      const canvasId = $pane.find('[id^="canvas-"]').first().attr("id");
      return canvasId.slice("canvas-".length, canvasId.length - tabId.length - 1);
    });

/**
 * @tjBlock  userflow
 * @tjUsage  focusTrail('[data-cy="draggable-widget-before"] input', 4).then((trail) => expect(trail[0].widget).to.eq('tb'))
 * @tjDom    focuses the start element, then presses real Tab `count` times; after each press records the focused
 *           element: { widget (runtime name of the nearest widget box), tag, text (trimmed, 40 chars), header (true
 *           when it is, or sits in, a Tabs header <li>), headerText } — plain objects
 */
export const focusTrail = (startSelector, count) => {
  cy.get(startSelector).first().focus();
  const trail = [];
  Cypress._.times(count, () => {
    cy.realPress("Tab");
    cy.document().then((doc) => {
      const el = doc.activeElement;
      if (!el || el === doc.body) {
        trail.push({ widget: "body", tag: "body", text: "", header: false, headerText: null });
        return;
      }
      const w = el.closest('[data-cy^="draggable-widget-"]');
      const li = el.closest("li.nav-item");
      trail.push({
        widget: w ? w.getAttribute("data-cy").replace("draggable-widget-", "") : null,
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().slice(0, 40),
        header: !!li,
        headerText: li ? li.textContent.trim() : null,
      });
    });
  });
  return cy.wrap(trail);
};

/**
 * @tjBlock  canvas
 * @tjUsage  useMainCanvasForCanvasCommands()   // once at the top of a spec whose app holds Tabs (or other sub-canvases)
 * @tjDom    every SubContainer canvas also carries data-cy="real-canvas" (Container.jsx), so with a Tabs on the page
 *           cy.forceClickOnCanvas / cy.moveComponent (which get `[data-cy=real-canvas]`) match several elements and
 *           throw. Overwrites both, for the current spec file only, to target the main `#real-canvas` whenever more
 *           than one canvas matches; with a single canvas they behave exactly as before.
 */
export const useMainCanvasForCanvasCommands = () => {
  const mainCanvas = ($all) => ($all.length > 1 && $all.filter("#real-canvas").length ? $all.filter("#real-canvas") : $all);
  Cypress.Commands.overwrite("forceClickOnCanvas", () => {
    cy.get('[data-cy="real-canvas"]').then(($all) => cy.wrap(mainCanvas($all)).click("topRight", { force: true }));
  });
  Cypress.Commands.overwrite("moveComponent", (_original, componentName, x, y) => {
    cy.get(`[data-cy="draggable-widget-${componentName}"]`)
      .first()
      .trigger("mouseover", { force: true })
      .trigger("mousedown", { which: 1, force: true });
    cy.get('[data-cy="real-canvas"]').then(($all) =>
      cy
        .wrap(mainCanvas($all))
        .trigger("mousemove", { which: 1, force: true, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y })
        .trigger("mouseup", { force: true })
    );
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  selectAllOnMainCanvas()
 * @tjDom    selectAllWidgets for pages with sub-canvases: deselect, click the main `#real-canvas`, Cmd/Ctrl+A
 *           (canvas.js selectAllWidgets clicks `[data-cy=real-canvas]`, which every Tabs pane canvas also carries)
 */
export const selectAllOnMainCanvas = () => {
  cy.forceClickOnCanvas();
  cy.get("#real-canvas")
    .click("topLeft", { force: true })
    .realPress([Cypress.platform === "darwin" ? "Meta" : "Control", "a"]);
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(500);
};
