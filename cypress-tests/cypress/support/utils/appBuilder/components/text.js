/**
 * MODULE — appBuilder/components/text: browser-only helpers for the Text widget.
 * FOR AI: addTextsViaApi seeds fully-configured Text widgets (text.js definition defaults merged) plus any helper
 * widgets in one components POST and wires their events (merged over show-alert; counterEvent from icon.js works);
 * textMetrics reads the real layout boxes, wrapped line boxes and scroll state of one Text; execProbe /
 * execRecord detect script execution inside the app under test (a window flag list + stubbed dialogs).
 */
import { textText } from "Texts/appBuilder/components/text";
import { textSelector } from "Selectors/appBuilder/components/text";

const authHeaders = (cookie) => ({
  "Content-Type": "application/json",
  "Tj-Workspace-Id": Cypress.env("workspaceId"),
  Cookie: `tj_auth_token=${cookie.value}`,
});

/**
 * @tjBlock  contexts
 * @tjUsage  addTextsViaApi([{ name: 'text1', layout: { top: 40, left: 2, width: 10, height: 60 }, properties: { text: { value: 'A' } }, styles: { textAlign: { value: 'center' } }, events: [counterEvent('onClick', 'clicks')] }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page; sets Cypress.env('editingVersionId')) →
 *           POST /api/v2/apps/<appId>/versions/<v>/components (an item without `type` is a Text and gets text.js
 *           definition defaults under its properties/styles/others; any other `type` posts only what is passed —
 *           the app loader fills the rest) → POST .../events per handler (merged over show-alert; a
 *           `componentName` is resolved to the seeded component's id)
 */
export const addTextsViaApi = (items, appIdArg) =>
  cy.getCookie("tj_auth_token").then((cookie) => {
    // resolve lazily: apiCreateApp sets Cypress.env('appId') only when its request completes
    const appId = appIdArg || Cypress.env("appId");
    const api = `${Cypress.env("server_host")}/api`;
    const headers = authHeaders(cookie);
    return cy.request({ method: "GET", url: `${api}/apps/${appId}`, headers }).then((res) => {
      const { id: versionId, home_page_id: pageId } = res.body.editing_version;
      // only cy.openApp sets it otherwise; apiPublishDraftVersion / apiPromoteAppVersion read it
      Cypress.env("editingVersionId", versionId);
      const D = textText.definition;
      const ids = {};
      items.forEach((item) => {
        ids[item.name] = item.id || crypto.randomUUID();
      });
      const diff = {};
      const events = [];
      items.forEach((item) => {
        const id = ids[item.name];
        const type = item.type || "Text";
        const isText = type === "Text";
        const layout = { top: 40, left: 2, width: 10, height: 40, ...item.layout };
        diff[id] = {
          name: item.name,
          type,
          ...(item.parent ? { parent: item.parent } : {}),
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: { ...(isText ? D.properties : {}), ...item.properties },
          styles: { ...(isText ? D.styles : {}), ...item.styles },
          others: { ...(isText ? D.others : {}), ...item.others },
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
 * @tjBlock  canvas
 * @tjUsage  textMetrics('text1', (m) => expect(m.scroller.scrollHeight).to.be.gt(m.scroller.clientHeight))
 * @tjDom    retries the callback with plain-object rects of the RenderWidget box, the `.text-widget` root, the
 *           `.text-widget-section` and the per-format content box (the scroller), the client rects of every
 *           rendered line of the content (Range over the scroller's contents, one rect per wrapped line for
 *           plain text), and the scroller's scroll state + computed overflow-y
 */
export const textMetrics = (name, assertFn) =>
  cy.get(textSelector.root(name), { timeout: 30000 }).first().should(($root) => {
    const root = $root[0];
    const doc = root.ownerDocument;
    const win = doc.defaultView;
    const plain = (r) =>
      r ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height } : null;
    const rect = (el) => (el ? plain(el.getBoundingClientRect()) : null);
    const section = root.querySelector(":scope > .text-widget-section");
    const scroller = section ? section.firstElementChild : null;
    let lines = [];
    if (scroller) {
      const range = doc.createRange();
      range.selectNodeContents(scroller);
      lines = Array.from(range.getClientRects())
        .filter((r) => r.width > 0 && r.height > 0)
        .map(plain);
    }
    assertFn({
      box: rect(doc.querySelector(textSelector.draggableWidget(name))),
      root: rect(root),
      section: rect(section),
      content: rect(scroller),
      lines,
      rootDisplay: win.getComputedStyle(root).display,
      scroller: scroller
        ? {
            scrollTop: scroller.scrollTop,
            scrollHeight: scroller.scrollHeight,
            clientHeight: scroller.clientHeight,
            overflowY: win.getComputedStyle(scroller).overflowY,
          }
        : null,
    });
  });

/**
 * @tjBlock  contexts
 * @tjUsage  cy.visit(url, { onBeforeLoad: execProbe }); …; execRecord().should('deep.equal', [])
 * @tjDom    before the app's own scripts run: `window.__textExec = []` and alert/confirm/prompt replaced with
 *           recorders that push `dialog:<message>` — markup that executes anything (a nested same-origin
 *           document reaches it through `parent`) leaves an entry behind
 */
export const execProbe = (win) => {
  win.__textExec = [];
  ["alert", "confirm", "prompt"].forEach((fn) => {
    win[fn] = (msg) => {
      win.__textExec.push(`${fn}:${msg}`);
      return fn === "confirm" ? false : null;
    };
  });
};

export const execRecord = () => cy.window().then((win) => [...(win.__textExec || [])]);

/**
 * @tjBlock  contexts
 * @tjUsage  guardNavigation(); cy.get(link).realClick(); navigationAttempts().should('deep.equal', [...])
 * @tjDom    capture-phase click listener on the AUT document: records every click that lands inside an <a> or a
 *           form submit button as {kind, url} and cancels the native navigation for http(s)/empty URLs, so the
 *           page stays put — but lets `javascript:` URLs through, so an executable link still runs (and is caught
 *           by execProbe)
 */
export const guardNavigation = () =>
  cy.document().then((doc) => {
    const win = doc.defaultView;
    win.__textNav = [];
    doc.addEventListener(
      "click",
      (e) => {
        const a = e.target && e.target.closest ? e.target.closest("a") : null;
        const btn = e.target && e.target.closest ? e.target.closest("form button, form input[type=submit]") : null;
        if (!a && !btn) return;
        const url = a ? a.getAttribute("href") || a.getAttribute("xlink:href") : btn.form.getAttribute("action");
        win.__textNav.push({ kind: a ? "link" : "form", url });
        if (!/^\s*javascript:/i.test(url || "")) e.preventDefault();
      },
      true
    );
  });

export const navigationAttempts = () => cy.window().then((win) => [...(win.__textNav || [])]);
