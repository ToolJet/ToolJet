/**
 * MODULE — appBuilder/components/link: browser-only helpers for the Link widget.
 * FOR AI: addLinksViaApi seeds one or more fully-configured Links in a single components POST (faster and
 * more deterministic than inspector edits for geometry matrices); openLinkAppInViewer opens the running app;
 * trackAnchorClicks / anchorClicks observe native <a> activation without letting a `_blank` link spawn a
 * tab Cypress cannot drive; the box/scroll helpers read real layout boxes.
 */
import { linkText } from "Texts/appBuilder/components/link";

/**
 * @tjBlock  contexts
 * @tjUsage  addLinksViaApi([{ name: 'link1', layout: { top: 40, left: 2, width: 10, height: 30 }, properties: { linkText: { value: 'Docs' } }, events: [{ eventId: 'onClick', message: 'clicked' }] }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components
 *           (one diff entry per item; a Link gets link.js definition defaults merged with the overrides, any other
 *           `type` only what is passed — the app loader fills the rest) → POST .../events per Show-alert handler
 */
export const addLinksViaApi = (items, appIdArg) =>
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
      const D = linkText.definition;
      const diff = {};
      const events = [];
      items.forEach((item) => {
        const id = crypto.randomUUID();
        const type = item.type || "Link";
        const isLink = type === "Link";
        const layout = { top: 40, left: 2, width: 10, height: 30, ...item.layout };
        diff[id] = {
          name: item.name,
          type,
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: { ...(isLink ? D.properties : {}), ...item.properties },
          styles: { ...(isLink ? D.styles : {}), ...item.styles },
          others: { ...(isLink ? D.others : {}), ...item.others },
          validation: {},
        };
        (item.events || []).forEach((e, index) =>
          events.push({
            name: `${item.name} ${e.eventId} ${index + 1}`,
            event: { eventId: e.eventId, actionId: "show-alert", message: e.message, alertType: "info" },
            eventType: "component",
            attachedTo: id,
            index,
          })
        );
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
 * @tjBlock  contexts
 * @tjUsage  openLinkAppInViewer('[data-cy="link1"]')
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a widget
 */
export const openLinkAppInViewer = (waitForSelector, appId) => {
  cy.then(() => cy.visit(viewerPath(appId)));
  if (waitForSelector) cy.get(waitForSelector, { timeout: 30000 }).should("be.visible");
};

export const viewerPath = (appId, query = "") =>
  `/applications/${appId || Cypress.env("appId")}/home?version=v1${query}`;

/**
 * @tjBlock  events
 * @tjUsage  trackAnchorClicks(); cy.get(sel).realClick(); anchorClicks().should('have.length', 1)
 * @tjDom    bubble-phase click listener on the React root container `#app` (index.jsx createRoot), added after
 *           React's own, so it runs after the widget handler even though Link calls stopPropagation
 *           (Link.jsx:167). Records every click inside an <a> as {href, target, prevented} — `prevented` is
 *           whether the widget cancelled the native navigation — then cancels it so `_blank` opens no real tab
 */
export const trackAnchorClicks = () =>
  cy.window().then((win) => {
    win.__linkClicks = [];
    const root = win.document.getElementById("app") || win.document;
    root.addEventListener("click", (e) => {
      const a = e.target && e.target.closest ? e.target.closest("a") : null;
      if (!a) return;
      win.__linkClicks.push({ href: a.href, target: a.getAttribute("target"), prevented: e.defaultPrevented });
      e.preventDefault();
    });
  });

export const anchorClicks = () => cy.window().its("__linkClicks");

/**
 * @tjBlock  events
 * @tjUsage  markWindow(); ...; expectWindowMarked(false)   // false → a full same-tab navigation happened
 * @tjDom    sets/reads a property on the AUT window; a real document navigation replaces the window object
 */
export const markWindow = () => cy.window().then((win) => { win.__linkMarker = true; });
export const expectWindowMarked = (marked) =>
  cy.window().should((win) => expect(!!win.__linkMarker, "same window (no navigation)").to.eq(marked));

/**
 * @tjBlock  canvas
 * @tjUsage  expectBoxes('link1', (b) => expect(b.text.top).to.be.gte(b.wrapper.top))
 * @tjDom    retries the callback with rects of the Link's wrapper/anchor/text/icon (null when absent), the
 *           wrapper's scroll state, and the text's client line rects (one per rendered line)
 */
export const expectBoxes = (name, assertFn) =>
  cy.get(`[data-cy="${name}"].link-widget`).first().should(($w) => {
    const w = $w[0];
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const text = w.querySelector(".link-text");
    const icon = w.querySelector("a > span > span:not(.link-text) svg");
    const lines = text ? Array.from(text.getClientRects()) : [];
    assertFn({
      wrapper: rect(w),
      anchor: rect(w.querySelector("a")),
      text: rect(text),
      icon: rect(icon),
      lines,
      scrollTop: w.scrollTop,
      scrollHeight: w.scrollHeight,
      clientHeight: w.clientHeight,
      el: w,
    });
  });

/**
 * @tjBlock  canvas
 * @tjUsage  scrollLinkTo('link1', 'top' | 'bottom')
 * @tjDom    sets scrollTop on the `.link-widget` wrapper (its own `overflow: auto` scroller, theme.scss)
 */
export const scrollLinkTo = (name, where) =>
  cy.get(`[data-cy="${name}"].link-widget`).first().then(($w) => {
    $w[0].scrollTop = where === "top" ? 0 : $w[0].scrollHeight;
  });

/**
 * @tjBlock  styles
 * @tjUsage  hitAtCenter('[data-cy="link1"] .link-text').then(({ el, cursor }) => ...)
 * @tjDom    document.elementFromPoint at the element's centre — the real pointer hit-target, honouring
 *           `pointer-events` — plus that hit element's computed cursor
 */
export const hitAtCenter = (selector) =>
  cy.get(selector).first().then(($el) => {
    const doc = $el[0].ownerDocument;
    const r = $el[0].getBoundingClientRect();
    const el = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { el, cursor: el ? doc.defaultView.getComputedStyle(el).cursor : null };
  });
