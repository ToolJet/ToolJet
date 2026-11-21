/**
 * MODULE — appBuilder/components/pdf: browser-only helpers for the PDF widget.
 * FOR AI: stubPdfFixtures serves the local fixture PDFs (cypress/fixtures/pdf) on a fake host + the config's default
 * wikimedia URL through cy.intercept (no external network); addPdfsViaApi seeds PDFs (pdf.js definition defaults
 * merged) plus helper widgets in one components POST; pdfDataUri builds a `data:application/pdf;base64,` url from a
 * fixture; pdfMetrics reads the real render (pages, canvas geometry, painted centre pixel, text layer), the scroll
 * wrapper and the footer; wheelPdfUntil drives real wheel scrolling of one instance's wrapper; setNativeInputValue
 * commits a whole value into a React-controlled input in one change event; contrastRatio is the WCAG 2.x ratio.
 */
import { pdfText } from "Texts/appBuilder/components/pdf";
import { pdfSelector } from "Selectors/appBuilder/components/pdf";

const merge = (defaults, overrides = {}) => ({ ...defaults, ...overrides });
const F = pdfText.fixtures;
const CORS = { "access-control-allow-origin": "*", "access-control-expose-headers": "content-length" };

/**
 * @tjBlock  properties
 * @tjUsage  stubPdfFixtures(); … cy.get('@pdfMulti.all').should('have.length', 1)
 * @tjDom    cy.intercept per fixture url (aliases @pdfMulti, @pdfPassword, @pdfMissing, @pdfNotPdf, @pdfDefault).
 *           The default wikimedia url (pdf.js:78) answers the multi-page fixture too. `delayMs` delays the PDF bodies
 *           (to observe the pre-load state).
 */
export const stubPdfFixtures = ({ delayMs = 0 } = {}) => {
  const pdf = (fixture) => ({
    statusCode: 200,
    headers: { ...CORS, "content-type": "application/pdf" },
    // ",null" = serve the raw bytes; without it a .pdf fixture is read as utf8 text and every byte > 0x7f is
    // re-encoded (corrupts encrypted streams and shifts xref offsets)
    fixture: `${fixture},null`,
    delay: delayMs,
  });
  cy.intercept("GET", F.multiPage.url, pdf(F.multiPage.path)).as("pdfMulti");
  cy.intercept("GET", F.passwordProtected.url, pdf(F.passwordProtected.path)).as("pdfPassword");
  cy.intercept("GET", F.missingUrl, { statusCode: 404, headers: CORS, body: "Not Found" }).as("pdfMissing");
  cy.intercept("GET", F.notPdfUrl, {
    statusCode: 200,
    headers: { ...CORS, "content-type": "text/html" },
    body: "<!doctype html><html><body>not a pdf</body></html>",
  }).as("pdfNotPdf");
  cy.intercept("GET", pdfText.defaultUrl, pdf(F.multiPage.path)).as("pdfDefault");
};

/**
 * @tjBlock  properties
 * @tjUsage  pdfDataUri(pdfText.fixtures.multiPage.path).then((uri) => addPdfsViaApi([{ name: 'pdf1', properties: { url: { value: uri } } }]))
 * @tjDom    reads the fixture as base64 and yields `data:application/pdf;base64,<payload>`
 */
export const pdfDataUri = (fixturePath) =>
  cy.fixture(fixturePath, "base64").then((b64) => `data:application/pdf;base64,${b64}`);

/**
 * @tjBlock  contexts
 * @tjUsage  addPdfsViaApi([{ name: 'pdf1', layout: { top: 40, left: 2, width: 20, height: 640 }, properties: { scale: { value: '{{false}}' } } }, { type: 'TextInput', name: 'textinput1', layout: {…}, properties: { value: { value: 'x' } } }])
 * @tjDom    GET /api/apps/<appId> (editing version + home page) → POST /api/v2/apps/<appId>/versions/<v>/components.
 *           An item without `type` is a PDF: pdf.js definition defaults (url = the multi-page fixture url) under every
 *           bucket; any other `type` posts only what is passed. Sets Cypress.env('editingVersionId').
 */
export const addPdfsViaApi = (items, appIdArg) =>
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
      const D = pdfText.definition;
      const diff = {};
      items.forEach((item) => {
        const isPdf = !item.type || item.type === pdfText.componentType;
        const layout = {
          top: 40,
          left: 2,
          width: pdfText.defaultSize.width,
          height: isPdf ? pdfText.defaultSize.height : 40,
          ...item.layout,
        };
        diff[item.id || crypto.randomUUID()] = {
          name: item.name,
          type: item.type || pdfText.componentType,
          layouts: { desktop: layout, mobile: { ...layout, ...item.mobileLayout } },
          properties: isPdf
            ? merge({ url: { value: F.multiPage.url }, ...D.properties }, item.properties)
            : item.properties || {},
          styles: isPdf ? merge(D.styles, item.styles) : item.styles || {},
          others: isPdf ? merge(D.others, item.others) : item.others || {},
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

const rect = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
};

// RGB of the canvas pixel at the page centre (pdfjs draws into a 2d context; same-origin bytes → readable)
const centrePixel = (canvas) => {
  try {
    const ctx = canvas.getContext("2d");
    const d = ctx.getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data;
    return [d[0], d[1], d[2]];
  } catch (e) {
    return null;
  }
};

/**
 * @tjBlock  properties
 * @tjUsage  pdfMetrics('pdf1', (m) => { expect(m.pages).to.have.length(3); expect(m.footer.indicator).to.eq('1 of 3') })
 * @tjDom    retries the callback with: root (data-cy=<name>) rect + display; card rect; scroller rect / scroll sizes /
 *           computed overflow-x; pages [{ n, canvas rect, canvas px width, centre pixel RGB, text layer text, offsetTop }];
 *           message (react-pdf error text or the scroller's own text when no Document is mounted); retry button;
 *           footer (null when not rendered) { rect, justify, controls, indicator, prevDisabled, nextDisabled,
 *           download rect }.
 */
export const pdfMetrics = (name, assertFn) =>
  cy.get(pdfSelector.root(name), { timeout: 30000 }).should(($root) => {
    const doc = $root[0].ownerDocument;
    const q = (sel) => doc.querySelector(sel);
    const sc = q(pdfSelector.scroller(name));
    const footer = q(pdfSelector.footer(name));
    const pages = [...doc.querySelectorAll(pdfSelector.page(name))].map((p) => {
      const canvas = p.querySelector("canvas");
      const text = p.querySelector(".textLayer");
      return {
        n: Number(p.getAttribute("data-page-number")),
        rect: rect(p),
        canvas: rect(canvas),
        canvasPxWidth: canvas ? canvas.width : 0,
        pixel: canvas && canvas.width ? centrePixel(canvas) : null,
        text: text ? text.textContent.trim() : "",
        offsetTop: p.offsetTop,
      };
    });
    const err = q(pdfSelector.errorMessage(name));
    const download = footer && footer.querySelector(".download-icon-outer-wrapper");
    assertFn({
      root: rect($root[0]),
      rootDisplay: doc.defaultView.getComputedStyle($root[0]).display,
      card: rect(q(pdfSelector.card(name))),
      scroller: sc && {
        rect: rect(sc),
        scrollTop: sc.scrollTop,
        scrollLeft: sc.scrollLeft,
        scrollHeight: sc.scrollHeight,
        clientHeight: sc.clientHeight,
        scrollWidth: sc.scrollWidth,
        clientWidth: sc.clientWidth,
        overflowX: doc.defaultView.getComputedStyle(sc).overflowX,
      },
      pages,
      message: err ? err.textContent.trim() : sc && !sc.querySelector(".react-pdf__Document") ? sc.textContent.trim() : "",
      retry: !!q(pdfSelector.retryButton(name)),
      footer: footer && {
        rect: rect(footer),
        justify: doc.defaultView.getComputedStyle(footer).justifyContent,
        controls: rect(footer.querySelector(".pdf-page-controls")),
        indicator: (footer.querySelector(".pdf-page-controls > span") || { textContent: null }).textContent,
        prevDisabled: (footer.querySelector('button[aria-label="Previous page"]') || {}).disabled,
        nextDisabled: (footer.querySelector('button[aria-label="Next page"]') || {}).disabled,
        download: rect(download),
        downloadText: download ? download.textContent.trim() : null,
      },
    });
  });

/**
 * @tjBlock  canvas
 * @tjUsage  wheelPdfUntil('pdf1', (sc) => sc.scrollTop > 900, 200)
 * @tjDom    real wheel events (CDP) over the instance's own scroll wrapper until doneFn(scroller) is true; each step
 *           waits for the wheel's scroll to land. Fails after maxWheels.
 */
export const wheelPdfUntil = (name, doneFn, deltaY, maxWheels = 25) => {
  cy.get(pdfSelector.scroller(name)).should(($sc) =>
    expect($sc[0].scrollHeight, `${name}: wrapper is scrollable`).to.be.gt($sc[0].clientHeight)
  );
  const step = (n) =>
    cy.get(pdfSelector.scroller(name)).then(($sc) => {
      if (doneFn($sc[0])) return;
      expect(n, `condition reached within ${maxWheels} wheel events`).to.be.lt(maxWheels);
      cy.get(pdfSelector.scroller(name)).realMouseWheel({ deltaY, scrollBehavior: false });
      cy.wait(150); // let the wheel's (smooth) scroll land before re-checking
      step(n + 1);
    });
  step(0);
};

/**
 * @tjBlock  properties
 * @tjUsage  setNativeInputValue(pdfSelector.textInput('urlsource'), 'https://…/missing.pdf')
 * @tjDom    sets the value through the native HTMLInputElement setter and dispatches one bubbling `input` event, so a
 *           React-controlled input commits the whole string in a single change (no per-keystroke intermediate urls)
 */
export const setNativeInputValue = (selector, value) =>
  cy.get(selector).first().then(($input) => {
    const el = $input[0];
    const setter = Object.getOwnPropertyDescriptor(el.ownerDocument.defaultView.HTMLInputElement.prototype, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new el.ownerDocument.defaultView.Event("input", { bubbles: true }));
  });

/**
 * @tjBlock  styles
 * @tjUsage  expect(contrastRatio('rgb(207, 211, 216)', 'rgb(230, 230, 230)')).to.be.lt(1.5)
 * @tjDom    pure — WCAG 2.x relative-luminance contrast of two opaque rgb()/rgba() colours
 */
export const contrastRatio = (a, b) => {
  const lum = (c) => {
    const [r, g, bl] = c.match(/[\d.]+/g).slice(0, 3).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};

/**
 * @tjBlock  events
 * @tjUsage  trackDownloadAnchors(); cy.get(sel).click(); downloadAnchors().should('have.length', 1)
 * @tjDom    wraps HTMLAnchorElement.prototype.click in the AUT window: records {download, href scheme} of every
 *           programmatic anchor click (downloadFile — PDF.jsx:197-201) and then performs the real click
 */
export const trackDownloadAnchors = () =>
  cy.window().then((win) => {
    win.__pdfDownloadAnchors = [];
    const original = win.HTMLAnchorElement.prototype.click;
    win.HTMLAnchorElement.prototype.click = function click(...args) {
      win.__pdfDownloadAnchors.push({ download: this.getAttribute("download"), scheme: this.href.split(":")[0] });
      return original.apply(this, args);
    };
  });

export const downloadAnchors = () => cy.window().its("__pdfDownloadAnchors");
