/**
 * MODULE — appBuilder/components/icon: browser-only helpers for the Icon widget.
 * FOR AI: addIconsViaApi seeds one or more fully-configured Icons (plus any helper widgets) in a single
 * components POST and wires their events — faster and more deterministic than inspector edits for geometry
 * and device matrices; openIconAppInViewer opens the running app; iconBoxes reads the real layout boxes and
 * computed styles of the RenderWidget box / Icon root / SVG; hitTarget asks the browser which element a
 * real pointer lands on; counterEvent / expectCounter count event dispatches through an app variable.
 */
import { iconText } from "Texts/appBuilder/components/icon";

const authHeaders = (cookie) => ({
  "Content-Type": "application/json",
  "Tj-Workspace-Id": Cypress.env("workspaceId"),
  Cookie: `tj_auth_token=${cookie.value}`,
});

/**
 * @tjBlock  contexts
 * @tjUsage  addIconsViaApi([{ name: 'icon1', layout: { top: 40, left: 2, width: 5, height: 48 }, styles: { iconAlign: { value: 'left' } }, events: [counterEvent('onClick', 'clicks')] }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components
 *           (one diff entry per item; an Icon gets icon.js definition defaults merged with the overrides, any
 *           other `type` only what is passed — the app loader fills the rest) → POST .../events per handler.
 *           Event items are merged over { actionId: 'show-alert', alertType: 'info' }; `componentName` in a
 *           control-component event is resolved to the seeded component's id.
 */
export const addIconsViaApi = (items, appIdArg) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    // resolve lazily: apiCreateApp sets Cypress.env('appId') only when its request completes
    const appId = appIdArg || Cypress.env("appId");
    const api = `${Cypress.env("server_host")}/api`;
    const headers = authHeaders(cookie);
    return cy.request({ method: "GET", url: `${api}/apps/${appId}`, headers }).then((res) => {
      const { id: versionId, home_page_id: pageId } = res.body.editing_version;
      // only cy.openApp sets it otherwise; apiUpdateGlobalSettings / promote read it
      Cypress.env("editingVersionId", versionId);
      const D = iconText.definition;
      const diff = {};
      const ids = {};
      items.forEach((item) => {
        ids[item.name] = crypto.randomUUID();
      });
      const events = [];
      items.forEach((item) => {
        const id = ids[item.name];
        const type = item.type || "Icon";
        const isIcon = type === "Icon";
        const layout = { top: 40, left: 2, width: 5, height: 48, ...item.layout };
        diff[id] = {
          name: item.name,
          type,
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: { ...(isIcon ? D.properties : {}), ...item.properties },
          styles: { ...(isIcon ? D.styles : {}), ...item.styles },
          others: { ...(isIcon ? D.others : {}), ...item.others },
          validation: {},
        };
        (item.events || []).forEach((e, index) => {
          const { componentName, ...rest } = e;
          events.push({
            name: rest.eventId, // event_handlers.name is NOT NULL (the editor stores the event id)
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
      })
        .its("status")
        .should("eq", 201);
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
 * @tjBlock  events
 * @tjUsage  addIconsViaApi([{ name: 'icon1', events: [counterEvent('onClick', 'clicks')] }, counterText('clickcount', 'clicks', { top: 120 })])
 * @tjDom    set-custom-variable action: variables[key] = (variables[key] ?? 0) + 1 on every dispatch
 */
export const counterEvent = (eventId, key) => ({
  eventId,
  actionId: "set-custom-variable",
  key,
  value: `{{(variables.${key} ?? 0) + 1}}`,
});

/**
 * @tjBlock  events
 * @tjUsage  counterText('clickcount', 'clicks', { top: 120, left: 2 })
 * @tjDom    a Text widget rendering `<key>:<count>` (0 until the first dispatch)
 */
export const counterText = (name, key, layout = {}) => ({
  type: "Text",
  name,
  layout: { top: 200, left: 2, width: 8, height: 40, ...layout },
  properties: { text: { value: `{{"${key}:" + (variables.${key} ?? 0)}}` } },
});

/**
 * @tjBlock  events
 * @tjUsage  expectCounter('clickcount', 'clicks', 1)
 * @tjDom    trimmed text of the counter Text widget's draggable box equals `<key>:<n>`
 */
export const expectCounter = (name, key, n) =>
  cy
    .get(`[data-cy="draggable-widget-${name}"]`)
    .should(($el) => expect($el.text().trim(), `${key} count`).to.eq(`${key}:${n}`));

/**
 * @tjBlock  contexts
 * @tjUsage  openIconAppInViewer('[data-cy="icon1"]', { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a widget
 */
export const openIconAppInViewer = (waitForSelector, { appId, query = "" } = {}) => {
  cy.then(() => cy.visit(`/applications/${appId || Cypress.env("appId")}/home?version=v1${query}`));
  if (waitForSelector) cy.get(waitForSelector, { timeout: 30000 }).should("be.visible");
};

/**
 * @tjBlock  canvas
 * @tjUsage  iconBoxes('icon1', (b) => expect(b.svg.left).to.be.closeTo(b.root.left, 0.5))
 * @tjDom    retries the callback with rects of the RenderWidget box (`draggable-widget-<name>`), the Icon root
 *           (`.icon-widget`) and the <svg>, plus computed styles: box padding, root box-shadow/cursor/
 *           justify-content, svg color/stroke
 */
export const iconBoxes = (name, assertFn) =>
  cy.get(`[data-cy="draggable-widget-${name}"]`).first().should(($box) => {
    const box = $box[0];
    const root = box.querySelector(".icon-widget");
    const svg = root ? root.querySelector("svg") : null;
    const win = box.ownerDocument.defaultView;
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const css = (el, prop) => (el ? win.getComputedStyle(el).getPropertyValue(prop) : null);
    assertFn({
      box: rect(box),
      root: rect(root),
      svg: rect(svg),
      boxPadding: parseFloat(css(box, "padding-left")),
      boxShadow: css(root, "box-shadow"),
      cursor: css(root, "cursor"),
      justify: css(root, "justify-content"),
      svgColor: css(svg, "color"),
      svgStroke: css(svg, "stroke"),
      svgStrokeAttr: svg ? svg.getAttribute("stroke") : null,
      rootScroll: root ? { sw: root.scrollWidth, cw: root.clientWidth, sh: root.scrollHeight, ch: root.clientHeight } : null,
    });
  });

/**
 * @tjBlock  events
 * @tjUsage  hitTarget('[data-cy="icon1"].icon-widget > svg').then(({ el, cursor }) => expect(el.closest('.icon-widget')).to.be.null)
 * @tjDom    document.elementFromPoint at the element's centre — the real pointer hit-target, honouring
 *           `pointer-events` (the ancestor `.disabled { pointer-events: none }`) — plus its computed cursor.
 *           Returned as a plain object so Cypress does not re-wrap the element in jQuery.
 */
export const hitTarget = (selector) =>
  cy.get(selector).first().then(($el) => {
    const doc = $el[0].ownerDocument;
    const r = $el[0].getBoundingClientRect();
    const el = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { el, cursor: el ? doc.defaultView.getComputedStyle(el).cursor : null };
  });
