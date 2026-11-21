/**
 * MODULE — appBuilder/components/html: browser-only helpers for the HTML Viewer widget.
 * FOR AI: addHtmlWidgetsViaApi seeds Html widgets (html.js definition defaults merged) plus any helper widgets
 * in one components POST — including children of a container via `parent`; htmlMetrics reads the real layout
 * and scroll state of the widget's own scroller (Html.jsx:178-202); trackAuthoredClicks records which authored
 * element a real click reached; tabFrom walks real keyboard focus.
 */
import { htmlText } from "Texts/appBuilder/components/html";
import { htmlSelector } from "Selectors/appBuilder/components/html";

const merge = (defaults, overrides = {}) => ({ ...defaults, ...overrides });

/**
 * @tjBlock  contexts
 * @tjUsage  addHtmlWidgetsViaApi([{ name: 'html1', layout: { top: 40, left: 2, width: 10, height: 200 }, properties: { rawHtml: { value: '<p>x</p>' } } }, { type: 'Text', name: 'text1', layout: {…}, properties: { text: { value: 'A' } } }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components.
 *           An item without `type` is an Html and gets html.js definition defaults under its properties/styles/
 *           others; any other `type` posts only what is passed (the app loader fills the rest). `id` pins the
 *           component id (so a later item can name it as its `parent`, e.g. a FlexContainer child).
 */
export const addHtmlWidgetsViaApi = (items, appIdArg) =>
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
      const D = htmlText.definition;
      const diff = {};
      items.forEach((item) => {
        const isHtml = !item.type || item.type === "Html";
        const layout = {
          top: 40,
          left: 2,
          width: htmlText.defaultSize.width,
          height: isHtml ? htmlText.defaultSize.height : 40,
          ...item.layout,
        };
        diff[item.id || crypto.randomUUID()] = {
          name: item.name,
          type: item.type || "Html",
          ...(item.parent ? { parent: item.parent } : {}),
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: isHtml ? merge(D.properties, item.properties) : item.properties || {},
          styles: isHtml ? merge(D.styles, item.styles) : item.styles || {},
          others: isHtml ? merge(D.others, item.others) : item.others || {},
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
    });
  });

/**
 * @tjBlock  canvas
 * @tjUsage  htmlMetrics('html1', (m) => expect(m.scrollHeight).to.be.lte(m.clientHeight))
 * @tjDom    retries the callback with the widget's grid box, its `.html-widget-container` scroller (rect,
 *           scroll size, computed overflow-y / scrollbar-width / scrollbar-color / display) and the content root
 */
export const htmlMetrics = (name, assertFn) =>
  cy.get(htmlSelector.container(name), { timeout: 30000 }).first().should(($c) => {
    const c = $c[0];
    const doc = c.ownerDocument;
    const cs = doc.defaultView.getComputedStyle(c);
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    assertFn({
      widget: rect(doc.querySelector(htmlSelector.draggableWidget(name))),
      container: rect(c),
      content: rect(c.firstElementChild),
      scrollTop: c.scrollTop,
      scrollHeight: c.scrollHeight,
      clientHeight: c.clientHeight,
      overflowY: cs.overflowY,
      scrollbarWidth: cs.scrollbarWidth,
      scrollbarColor: cs.scrollbarColor,
      display: cs.display,
      el: c,
    });
  });

/**
 * @tjBlock  userflow
 * @tjUsage  trackAuthoredClicks(); cy.get(sel).realClick(); authoredClicks().should('deep.equal', ['authored-btn'])
 * @tjDom    capture-phase click listener on the AUT document: records the id of the nearest `[id^="authored-"]`
 *           ancestor of every click target (the element a real pointer actually reached) and cancels native
 *           navigation for anchors so no new tab / route change happens
 */
export const trackAuthoredClicks = () =>
  cy.document().then((doc) => {
    const win = doc.defaultView;
    win.__htmlAuthoredClicks = [];
    doc.addEventListener(
      "click",
      (e) => {
        const hit = e.target && e.target.closest ? e.target.closest('[id^="authored-"]') : null;
        if (!hit) return;
        win.__htmlAuthoredClicks.push(hit.id);
        if (hit.closest("a")) e.preventDefault();
      },
      true
    );
  });

export const authoredClicks = () => cy.window().its("__htmlAuthoredClicks");

/**
 * @tjBlock  userflow
 * @tjUsage  tabFrom('[data-cy="draggable-widget-textinput1"] input', 3).should('deep.equal', ['authored-btn', …])
 * @tjDom    focuses the start element, sends `count` real Tab key presses (CDP) and yields, per press, the
 *           focused element's id when it is authored (`authored-*`), else its widget's runtime name, else "body"
 */
export const tabFrom = (startSelector, count) => {
  const seen = [];
  cy.get(startSelector).first().focus();
  for (let i = 0; i < count; i++) {
    cy.realPress("Tab");
    cy.document().then((doc) => {
      const el = doc.activeElement;
      if (!el || el === doc.body) return seen.push("body");
      const widget = el.closest('[data-cy^="draggable-widget-"]');
      seen.push(
        el.id && el.id.startsWith("authored-")
          ? el.id
          : widget
            ? widget.getAttribute("data-cy").replace("draggable-widget-", "")
            : el.tagName.toLowerCase()
      );
    });
  }
  return cy.wrap(seen, { log: false });
};
