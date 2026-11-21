/**
 * MODULE — appBuilder/components/boundedBox: browser-only helpers for the Bounded Box (image annotation) widget.
 * FOR AI: addBoundedBoxesViaApi seeds Bounded Boxes (boundedBox.js definition defaults merged) plus helper widgets
 * through addIconsViaApi; annotationsProbe/expectAnnotations read the public `annotations` exposed value through a
 * Text widget; bboxState reads the real geometry of the widget box, root, <img>, in-progress selection, label
 * editor and committed highlights (with pointer hit-tests); drawRectangle / clickPoint / touchDrag / touchTap drive
 * the third-party selector with real (CDP) pointer and touch input at fractions of the image.
 */
import { getCypressElementCoordinates } from "cypress-real-events/getCypressElementCoordinates";
import { boundedBoxSelector as S } from "Selectors/appBuilder/components/boundedBox";
import { boundedBoxText } from "Texts/appBuilder/components/boundedBox";
import { addIconsViaApi } from "Support/utils/appBuilder/components/icon";

const cdp = (command, params) => Cypress.automation("remote:debugger:protocol", { command, params });

/**
 * @tjBlock  common
 * @tjUsage  svgDataUri(400, 200, '#4a90d9')
 * @tjDom    base64 `data:image/svg+xml` URI of a solid w×h SVG (no network)
 */
export const svgDataUri = (width, height, fill = "#4a90d9") =>
  `data:image/svg+xml;base64,${btoa(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><rect width='${width}' height='${height}' fill='${fill}'/></svg>`
  )}`;

/**
 * @tjBlock  contexts
 * @tjUsage  addBoundedBoxesViaApi([{ name: 'boundedbox1', layout: { top: 40, left: 2, width: 12, height: 300 }, properties: { imageUrl: { value: svgDataUri(400, 200) } } }, annotationsProbe('probe', 'boundedbox1')])
 * @tjDom    addIconsViaApi with type BoundedBox and boundedBox.js definition defaults under each item's
 *           properties/styles/others; items with another `type` are passed through unchanged
 */
export const addBoundedBoxesViaApi = (items, appId) => {
  const D = boundedBoxText.definition;
  return addIconsViaApi(
    items.map((item) =>
      item.type && item.type !== "BoundedBox"
        ? item
        : {
            ...item,
            type: "BoundedBox",
            layout: { top: 40, left: 2, width: 12, height: 300, ...item.layout },
            properties: { ...D.properties, ...item.properties },
            styles: { ...D.styles, ...item.styles },
            others: { ...D.others, ...item.others },
          }
    ),
    appId
  );
};

/**
 * @tjBlock  contexts
 * @tjUsage  annotationsProbe('probe', 'boundedbox1', { top: 40, left: 30 })
 * @tjDom    a Text widget rendering JSON.stringify(components.<bbox>.annotations ?? null)
 */
export const annotationsProbe = (name, bboxName, layout = {}, extra = {}) => ({
  type: "Text",
  name,
  layout: { top: 40, left: 30, width: 12, height: 160, ...layout },
  properties: { text: { value: `{{JSON.stringify(components.${bboxName}.annotations ?? null)}}` } },
  ...extra,
});

const parseProbe = ($el) => {
  const text = $el.text().trim();
  try {
    return JSON.parse(text || "undefined");
  } catch (e) {
    return { unparsable: text };
  }
};

/**
 * @tjBlock  contexts
 * @tjUsage  expectAnnotations('probe', (list) => expect(list).to.have.length(1))
 * @tjDom    retries the callback with the probe Text's parsed JSON (undefined when it renders nothing)
 */
export const expectAnnotations = (probeName, assertFn) =>
  cy.get(`[data-cy="draggable-widget-${probeName}"]`).first().should(($el) => assertFn(parseProbe($el)));

export const readAnnotations = (probeName) =>
  cy.get(`[data-cy="draggable-widget-${probeName}"]`).first().then(($el) => parseProbe($el));

const plainRect = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
};

// pointer hit-test: does a real pointer at each sample point (left edge, centre, right edge — mid height) land on `el`?
const hitSamples = (el) => {
  if (!el) return null;
  const doc = el.ownerDocument;
  const r = el.getBoundingClientRect();
  const y = r.top + r.height / 2;
  return [r.left + 6, r.left + r.width / 2, r.right - 6].map((x) => {
    const hit = doc.elementFromPoint(x, y);
    return !!hit && (hit === el || el.contains(hit));
  });
};

const collectState = (widgetEl) => {
  const doc = widgetEl.ownerDocument;
  const win = doc.defaultView;
  const root = widgetEl.querySelector(".bounded-box");
  const img = root ? root.querySelector("img") : null;
  const container = img ? img.parentElement : null;
  const items = img ? img.nextElementSibling : null;
  const children = items ? [...items.children] : [];
  const highlightWrappers = children.filter((d) => d.querySelector(":scope > .row.m-0"));
  const selection = children.find((d) => !d.querySelector(":scope > .row.m-0")) || null;
  const editor = container ? container.querySelector(":scope > .col") : null;
  return {
    widget: plainRect(widgetEl),
    root: plainRect(root),
    rootDisplay: root ? win.getComputedStyle(root).display : null,
    img: plainRect(img),
    imgSrc: img ? img.getAttribute("src") : null,
    imgAttributes: img ? [...img.attributes].map((a) => a.name).sort() : [],
    natural: img ? { width: img.naturalWidth, height: img.naturalHeight, complete: img.complete } : null,
    selection: plainRect(selection),
    editor: editor ? { rect: plainRect(editor), hits: hitSamples(editor) } : null,
    highlights: highlightWrappers.map((d) => {
      const row = d.querySelector(":scope > .row.m-0");
      const del = row.querySelector(":scope > span");
      const value = row.querySelector(".react-select__single-value");
      return {
        box: plainRect(d.firstElementChild),
        control: plainRect(row),
        hits: hitSamples(row),
        del: del
          ? {
              rect: plainRect(del),
              tabIndex: del.tabIndex,
              tag: del.tagName.toLowerCase(),
              role: del.getAttribute("role"),
              name: del.getAttribute("aria-label") || del.getAttribute("title") || del.textContent.trim(),
            }
          : null,
        text: value ? value.textContent : null,
      };
    }),
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  bboxState('boundedbox1', (s) => expect(s.highlights).to.have.length(1))
 * @tjDom    retries the callback with plain rects of the grid box, `.bounded-box` root, <img>, the in-progress
 *           selection box, the label editor (+ pointer hit-tests) and each committed highlight (box, label row,
 *           delete span semantics, selected label text)
 */
export const bboxState = (name, assertFn) =>
  cy.get(S.draggableWidget(name), { timeout: 30000 }).first().should(($w) => assertFn(collectState($w[0])));

export const getBboxState = (name) =>
  cy.get(S.draggableWidget(name), { timeout: 30000 }).first().then(($w) => collectState($w[0]));

/**
 * @tjBlock  canvas
 * @tjUsage  waitForImage('boundedbox1')
 * @tjDom    the annotated <img> finished loading with a non-zero natural size and a non-zero rendered box
 */
export const waitForImage = (name) =>
  bboxState(name, (s) => {
    expect(s.natural && s.natural.complete && s.natural.width, `${name} image loaded`).to.be.gt(0);
    expect(s.img.height, `${name} image laid out`).to.be.gt(0);
  });

/**
 * @tjBlock  userflow
 * @tjUsage  drawRectangle('boundedbox1', [0.2, 0.2], [0.5, 0.6])
 * @tjDom    real CDP mouse down → stepped moves → up over the image (fractions of the <img> box); the
 *           third-party Target overlay receives them
 */
export const drawRectangle = (name, [fx0, fy0], [fx1, fy1], steps = 6) =>
  cy.get(S.img(name)).first().then(($img) => {
    const r = $img[0].getBoundingClientRect();
    const x0 = r.width * fx0;
    const y0 = r.height * fy0;
    const x1 = r.width * fx1;
    const y1 = r.height * fy1;
    cy.get(S.img(name)).first().realMouseDown({ position: { x: x0, y: y0 }, scrollBehavior: false });
    for (let i = 1; i <= steps; i++) {
      cy.get(S.img(name)).first().realMouseMove(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps, {
        position: "topLeft",
        scrollBehavior: false,
      });
    }
    cy.get(S.img(name)).first().realMouseUp({ position: { x: x1, y: y1 }, scrollBehavior: false });
  });

/**
 * @tjBlock  userflow
 * @tjUsage  clickPoint('boundedbox1', [0.3, 0.7])
 * @tjDom    real CDP click over the image at a fraction of the <img> box
 */
export const clickPoint = (name, [fx, fy]) =>
  cy.get(S.img(name)).first().then(($img) => {
    const r = $img[0].getBoundingClientRect();
    cy.get(S.img(name)).first().realClick({ position: { x: r.width * fx, y: r.height * fy }, scrollBehavior: false });
  });

/**
 * @tjBlock  userflow
 * @tjUsage  chooseLabel(boundedBoxSelector.editorControl('boundedbox1'), 'Car')
 * @tjDom    clicks a label Select control, then the portalled `.react-select__option` with exactly that text
 */
export const chooseLabel = (controlSelector, label) => {
  cy.get(controlSelector).last().click({ scrollBehavior: false });
  cy.get(S.option).filter((i, el) => el.textContent === String(label)).first().click({ scrollBehavior: false });
  cy.get(S.menu).should("not.exist");
};

/**
 * @tjBlock  userflow
 * @tjUsage  setTouchEmulation(true)
 * @tjDom    CDP Emulation.setTouchEmulationEnabled (exposes the TouchEvent API like a phone)
 */
export const setTouchEmulation = (enabled) =>
  cy.then(() => cdp("Emulation.setTouchEmulationEnabled", enabled ? { enabled, maxTouchPoints: 5 } : { enabled }));

const touchPoint = ($img, fx, fy) => {
  const r = $img[0].getBoundingClientRect();
  const { x, y } = getCypressElementCoordinates($img, { x: r.width * fx, y: r.height * fy }, false);
  return { x, y };
};

/**
 * @tjBlock  userflow
 * @tjUsage  touchDrag('boundedbox1', [0.2, 0.2], [0.5, 0.6])
 * @tjDom    CDP Input.dispatchTouchEvent touchStart → stepped diagonal touchMoves → touchEnd over the image
 *           (coordinates corrected for the AUT iframe offset/scale)
 */
export const touchDrag = (name, [fx0, fy0], [fx1, fy1], steps = 8) =>
  cy.get(S.img(name)).first().then(($img) => {
    const points = Array.from({ length: steps + 1 }, (_, i) =>
      touchPoint($img, fx0 + ((fx1 - fx0) * i) / steps, fy0 + ((fy1 - fy0) * i) / steps)
    );
    cy.then(() => cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [points[0]] }));
    points.slice(1).forEach((p) => cy.then(() => cdp("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [p] })));
    cy.then(() => cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }));
  });

/**
 * @tjBlock  userflow
 * @tjUsage  touchTap('boundedbox1', [0.3, 0.7])
 * @tjDom    CDP touchStart + touchEnd at one point over the image (the browser synthesises the click)
 */
export const touchTap = (name, [fx, fy]) =>
  cy.get(S.img(name)).first().then(($img) => {
    const p = touchPoint($img, fx, fy);
    cy.then(() => cdp("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [p] }));
    cy.then(() => cdp("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }));
  });

/**
 * @tjBlock  canvas
 * @tjUsage  rectInside(inner, outer, 1)
 * @tjDom    pure: is the plain rect `inner` within `outer` (± tolerance px)?
 */
export const rectInside = (inner, outer, tol = 1) =>
  !!inner &&
  !!outer &&
  inner.left >= outer.left - tol &&
  inner.top >= outer.top - tol &&
  inner.right <= outer.right + tol &&
  inner.bottom <= outer.bottom + tol;

export const rectsOverlap = (a, b, tol = 0.5) =>
  !!a && !!b && a.left < b.right - tol && b.left < a.right - tol && a.top < b.bottom - tol && b.top < a.bottom - tol;

/**
 * @tjBlock  canvas
 * @tjUsage  relativeBox(state.highlights[0].box, state.img) → { x, y, width, height } in % of the image
 * @tjDom    pure: a rect expressed in percent of the image box (the annotation coordinate space)
 */
export const relativeBox = (rect, img) => ({
  x: ((rect.left - img.left) / img.width) * 100,
  y: ((rect.top - img.top) / img.height) * 100,
  width: (rect.width / img.width) * 100,
  height: (rect.height / img.height) * 100,
});
