/**
 * MODULE — appBuilder/components/customComponent: browser-only helpers for the Custom Component widget.
 * FOR AI: the widget renders author React code inside a same-origin srcdoc <iframe> (CustomComponent.jsx:185-191,
 * iframe.html), so its DOM is reachable through `iframe.contentDocument`. addCustomComponentsViaApi seeds
 * Custom Components (the app loader fills definition defaults for any property not passed) plus helper widgets in
 * one components POST; inFrame yields an element the author code rendered (retrying until the frame has rendered
 * it); realClickInFrame sends a REAL (CDP) click at that element's centre; pasteCustomCode replaces the inspector
 * Code property through CodeMirror's own paste path and commits it on blur; frameRuntime / cardStyle read the frame's
 * runtime globals and the wrapper's computed paint as plain objects.
 */
import { customComponentSelector } from "Selectors/appBuilder/components/customComponent";

const S = customComponentSelector;

/**
 * @tjBlock  contexts
 * @tjUsage  addCustomComponentsViaApi([{ name: 'customcomponent1', layout: { top: 40, left: 2, width: 15, height: 200 }, properties: { code: { value: '…' } } }, { type: 'Text', name: 'text1', layout: {…}, properties: { text: { value: '{{components.customcomponent1.data.title}}' } } }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page; sets Cypress.env('editingVersionId')) →
 *           POST /api/v2/apps/<appId>/versions/<v>/components. An item without `type` is a CustomComponent; only
 *           what is passed is posted (the app loader fills customComponent.js definition defaults for the rest).
 */
export const addCustomComponentsViaApi = (items, appIdArg) =>
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
      const diff = {};
      items.forEach((item) => {
        const layout = { top: 40, left: 2, width: 15, height: 200, ...item.layout };
        diff[item.id || crypto.randomUUID()] = {
          name: item.name,
          type: item.type || "CustomComponent",
          ...(item.parent ? { parent: item.parent } : {}),
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: item.properties || {},
          styles: item.styles || {},
          others: item.others || {},
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
 * @tjBlock  userflow
 * @tjUsage  inFrame('customcomponent1', 'h1').should('have.text', 'Hi! There')
 * @tjDom    the widget's srcdoc iframe → contentDocument.body → `selector` (re-queried until the author code has
 *           rendered it; CDN imports + in-browser Babel can take a few seconds)
 */
export const inFrame = (name, selector, timeout = 40000) =>
  cy.get(S.frame(name), { timeout }).its("0.contentDocument.body", { timeout }).find(selector, { timeout });

/**
 * @tjBlock  userflow
 * @tjUsage  realClickInFrame('customcomponent1', 'button')
 * @tjDom    measures the element inside the frame, then a CDP mouse click on the <iframe> at that element's centre —
 *           the browser routes the real pointer event into the frame document (no synthetic dispatch)
 */
export const realClickInFrame = (name, selector) => {
  inFrame(name, selector).should("be.visible");
  cy.get(S.frame(name)).then(($f) => {
    const el = $f[0].contentDocument.querySelector(selector);
    const r = el.getBoundingClientRect(); // frame-viewport coordinates = offset from the iframe's top-left
    cy.wrap($f).realClick({ x: r.left + r.width / 2, y: r.top + r.height / 2, scrollBehavior: false });
  });
};

/**
 * @tjBlock  properties
 * @tjUsage  pasteCustomCode(code)   // inspector already open on the widget
 * @tjDom    Code CodeHinter (`.custom-component-inspector-multiline`, Inspector/Components/CustomComponent.jsx:33-48):
 *           select all, dispatch a paste ClipboardEvent (CodeMirror 6 replaces the selection with the clipboard text),
 *           assert the editor holds the code, then click the Code accordion label — the multiline editor commits on
 *           blur (MultiLineCodeEditor.jsx handleOnBlur)
 */
export const pasteCustomCode = (code) => {
  // the 400px editor's centre sits under the sticky accordion header: click its first line instead
  cy.get(S.codeEditor).scrollIntoView().click("topLeft", { force: true });
  cy.get(S.codeEditor)
    .type("{selectall}", { force: true })
    .then(($content) => {
      const win = $content[0].ownerDocument.defaultView;
      const data = new win.DataTransfer();
      data.setData("text/plain", code);
      $content[0].dispatchEvent(new win.ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
  cy.get(S.codeEditorLines).should(($lines) =>
    expect([...$lines].map((l) => l.textContent).join("\n"), "Code editor holds the pasted code").to.eq(code)
  );
  cy.get(S.codeAccordionLabel).click();
};

/**
 * @tjBlock  properties
 * @tjUsage  frameRuntime('customcomponent1', (rt) => expect(rt.react).to.eq('16.7.0'))
 * @tjDom    retries the callback with the frame window's globals from the pinned bundles (Babel / React versions,
 *           ReactDOM.render), its `window.Tooljet` bridge, and the `data-required` <script> srcs of iframe.html:3-5
 */
export const frameRuntime = (name, assertFn) =>
  cy.get(S.frame(name), { timeout: 40000 }).should(($f) => {
    const win = $f[0].contentWindow;
    const doc = $f[0].contentDocument;
    assertFn({
      babel: win.Babel && win.Babel.version,
      react: win.React && win.React.version,
      // react-dom 16.7 UMD exposes no `version`; its legacy render entry point proves the bundle executed
      reactDomRender: !!(win.ReactDOM && typeof win.ReactDOM.render === "function"),
      bridge: !!(win.Tooljet && typeof win.Tooljet.connectComponent === "function"),
      scripts: [...doc.querySelectorAll('script[src][data-required="true"]')].map((s) => s.src),
    });
  });

/**
 * @tjBlock  styles
 * @tjUsage  cardStyle('customcomponent1', (c) => expect(c.borderTopColor).to.eq('rgb(0, 0, 255)'))
 * @tjDom    retries the callback with getComputedStyle of the wrapper `.card` (CustomComponent.jsx:170-183): border
 *           sides, radius, shadow, outline and the forwarded `--cc-custom-component-border-color` custom property
 */
export const cardStyle = (name, assertFn) =>
  cy.get(S.card(name), { timeout: 30000 }).should(($c) => {
    const cs = $c[0].ownerDocument.defaultView.getComputedStyle($c[0]);
    assertFn({
      borderTopColor: cs.borderTopColor,
      borderRightColor: cs.borderRightColor,
      borderBottomColor: cs.borderBottomColor,
      borderLeftColor: cs.borderLeftColor,
      borderTopWidth: cs.borderTopWidth,
      borderTopStyle: cs.borderTopStyle,
      borderRadius: cs.borderTopLeftRadius,
      borderBottomRightRadius: cs.borderBottomRightRadius,
      boxShadow: cs.boxShadow,
      outlineStyle: cs.outlineStyle,
      borderColorVar: cs.getPropertyValue("--cc-custom-component-border-color").trim(),
    });
  });
