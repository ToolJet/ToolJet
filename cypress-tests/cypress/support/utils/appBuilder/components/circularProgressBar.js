/**
 * MODULE — appBuilder/components/circularProgressBar: browser-only helpers for the Circular Progressbar.
 * FOR AI: addCircularProgressBarsViaApi seeds fully-configured widgets (definition defaults merged per item, plus
 * any helper widgets) through the components API; cpbBoxes reads plain-object layout boxes and computed styles of
 * the RenderWidget box, the outer root (shadow / display), the inner flex container (alignment / loading
 * rotation), the <svg> and the drawn ring (trail path geometry); expectCircleFits asserts the real geometry
 * contract (square SVG = widget height - 4, ring centred in the SVG, aligned in the root, nothing overflowing);
 * sampleCpb takes timed snapshots for the loading animation; rootShadowClip reports ancestors that would clip the
 * root's painted box-shadow.
 */
import { circularProgressBarText } from "Texts/appBuilder/components/circularProgressBar";
import { addDividersViaApi } from "Support/utils/appBuilder/components/divider";

const T = circularProgressBarText;

/**
 * @tjBlock  contexts
 * @tjUsage  addCircularProgressBarsViaApi([{ name: 'c1', layout: { top: 40, left: 2, width: 7, height: 50 }, styles: { alignment: { value: 'flex-start' } } }])
 * @tjDom    addDividersViaApi (GET app → POST components diff) with type CircularProgressBar and the
 *           circularProgressbar.js:239-274 definition defaults merged under each item's own
 *           properties/styles/others; items with another `type` (a neighbouring Text, …) pass through unchanged
 */
export const addCircularProgressBarsViaApi = (items, opts = {}) =>
  addDividersViaApi(items, { type: T.componentType, definition: T.definition, ...opts });

const readCpb = (box) => {
  const doc = box.ownerDocument;
  const win = doc.defaultView;
  const name = box.getAttribute("data-cy").replace("draggable-widget-", "");
  const root = box.querySelector(`[data-cy="${name}"]`);
  const inner = root && root.firstElementChild;
  const svg = root && root.querySelector("svg.CircularProgressbar");
  const trail = svg && svg.querySelector(".CircularProgressbar-trail");
  const text = svg && svg.querySelector(".CircularProgressbar-text");
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };
  const cs = (el) => win.getComputedStyle(el);
  return {
    box: rect(box),
    boxPadding: cs(box).paddingTop,
    root: rect(root),
    rootDisplay: root ? cs(root).display : null,
    rootShadow: root ? cs(root).boxShadow : null,
    rootScroll: root
      ? { sw: root.scrollWidth, cw: root.clientWidth, sh: root.scrollHeight, ch: root.clientHeight }
      : null,
    inner: rect(inner),
    innerJustify: inner ? cs(inner).justifyContent : null,
    innerClass: inner ? String(inner.className) : null,
    innerAnimation: inner ? cs(inner).animationName : null,
    innerTransform: inner ? cs(inner).transform : null,
    svg: rect(svg),
    // the drawn ring: trail path geometry (stroke excluded) — radius 50 - strokeWidth/2 in the 100 viewBox
    ring: rect(trail),
    label: text ? text.textContent : null,
    // untransformed sizes (offset*/inline style ignore the loading rotation)
    svgInlineHeight: svg ? parseFloat(svg.style.height) : null,
    innerOffset: inner ? { w: inner.offsetWidth, h: inner.offsetHeight } : null,
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  cpbBoxes('c1', (b) => expect(b.svg.height).to.be.closeTo(b.box.height - 4, 0.6))
 * @tjDom    retries the callback with plain objects: box (`draggable-widget-<name>`, padding), root
 *           (`[data-cy=<name>]`: rect, display, box-shadow, scroll/client sizes), inner (first child: rect,
 *           justify-content, className, animation-name, transform), svg (`svg.CircularProgressbar`), ring
 *           (`.CircularProgressbar-trail` rect), label text
 */
export const cpbBoxes = (name, assertFn) =>
  cy.get(`[data-cy="draggable-widget-${name}"]`).first().should(($box) => assertFn(readCpb($box[0])));

/**
 * @tjBlock  canvas
 * @tjUsage  sampleCpb('c1', 5, 200).then((snaps) => expect(new Set(snaps.map((s) => s.innerTransform)).size).to.be.gt(1))
 * @tjDom    reads cpbBoxes-shaped plain snapshots `count` times, `gapMs` apart (real time, for CSS animations)
 */
export const sampleCpb = (name, count = 5, gapMs = 200) => {
  const snaps = [];
  for (let i = 0; i < count; i += 1) {
    cy.get(`[data-cy="draggable-widget-${name}"]`)
      .first()
      .then(($box) => {
        snaps.push(readCpb($box[0]));
      });
    if (i < count - 1) cy.wait(gapMs); // dynamic: animation sampling interval
  }
  return cy.then(() => snaps);
};

/**
 * @tjBlock  canvas
 * @tjUsage  cpbBoxes('c1', (b) => expectCircleFits(b, 'dropped', { alignment: 'center' }))
 * @tjDom    on a cpbBoxes() snapshot: root displayed and inset by the box padding (2px, or 0 with padding
 *           none); SVG height = widget height - 4 (RenderWidget.jsx:356) and width = min(height, root width)
 *           (square, shrinks in a narrow root); the ring is a circle of diameter (100 - strokeWidth)% of the
 *           SVG's short side, centred in the SVG; the SVG sits at the root's left / centre / right per
 *           alignment; SVG and ring stay inside the root and the box; the root has no scroll overflow
 */
export const expectCircleFits = (
  b,
  label = "",
  { alignment = T.alignCenter, padding = T.boxPadding, strokeWidth = T.defaultStrokeWidth } = {}
) => {
  const PX = 0.75;
  const midX = (r) => r.left + r.width / 2;
  const midY = (r) => r.top + r.height / 2;
  expect(b.rootDisplay, `${label}: root displayed`).to.eq("flex");
  expect(b.boxPadding, `${label}: box padding`).to.eq(`${padding}px`);
  expect(b.root.left, `${label}: root inset by padding (left)`).to.be.closeTo(b.box.left + padding, PX);
  expect(b.root.top, `${label}: root inset by padding (top)`).to.be.closeTo(b.box.top + padding, PX);
  expect(b.root.width, `${label}: root = box width minus padding`).to.be.closeTo(b.box.width - 2 * padding, PX);
  // responsive SVG sizing
  expect(b.svg.height, `${label}: SVG height = widget height - 4`).to.be.closeTo(b.box.height - T.svgHeightInset, PX);
  expect(b.svg.width, `${label}: SVG width = min(height, root width)`).to.be.closeTo(
    Math.min(b.svg.height, b.root.width),
    PX
  );
  const side = Math.min(b.svg.width, b.svg.height);
  const ringDiameter = (side * (T.viewBox - strokeWidth)) / T.viewBox;
  expect(b.ring.width, `${label}: ring diameter`).to.be.closeTo(ringDiameter, 1);
  expect(b.ring.height, `${label}: ring is a circle`).to.be.closeTo(b.ring.width, 1);
  expect(midX(b.ring), `${label}: ring centred in SVG (x)`).to.be.closeTo(midX(b.svg), 1);
  expect(midY(b.ring), `${label}: ring centred in SVG (y)`).to.be.closeTo(midY(b.svg), 1);
  // alignment
  expect(b.innerJustify, `${label}: inner justify-content`).to.eq(alignment);
  if (alignment === T.alignLeft) {
    expect(b.svg.left, `${label}: SVG at the root's left edge`).to.be.closeTo(b.root.left, PX);
  } else if (alignment === T.alignRight) {
    expect(b.svg.right, `${label}: SVG at the root's right edge`).to.be.closeTo(b.root.right, PX);
  } else {
    expect(midX(b.svg), `${label}: SVG centred in the root`).to.be.closeTo(midX(b.root), PX);
  }
  // no overflow
  [
    ["SVG", b.svg],
    ["ring", b.ring],
  ].forEach(([what, r]) => {
    expect(r.left, `${label}: ${what} inside root (left)`).to.be.gte(b.root.left - PX);
    expect(r.right, `${label}: ${what} inside root (right)`).to.be.lte(b.root.right + PX);
    expect(r.top, `${label}: ${what} inside box (top)`).to.be.gte(b.box.top - PX);
    expect(r.bottom, `${label}: ${what} inside box (bottom)`).to.be.lte(b.box.bottom + PX);
  });
  expect(b.rootScroll.sw, `${label}: root has no horizontal overflow`).to.be.lte(b.rootScroll.cw + 1);
  expect(b.rootScroll.sh, `${label}: root has no vertical overflow`).to.be.lte(b.rootScroll.ch + 1);
};

/**
 * @tjBlock  styles
 * @tjUsage  sampleCpb('c1').then((snaps) => snaps.forEach((b, i) => expectDiscInsideBox(b, `sample ${i}`)))
 * @tjDom    rotation-proof check on a cpbBoxes() snapshot: the painted disc's centre is the centre of the ring's
 *           (possibly rotated) bounding box — exact under rotation — and its radius is half the untransformed SVG
 *           side (min(inline height, inner offsetWidth)); the whole disc must lie inside the RenderWidget box
 */
export const expectDiscInsideBox = (b, label = "") => {
  const PX = 0.75;
  const cx = b.ring.left + b.ring.width / 2;
  const cy = b.ring.top + b.ring.height / 2;
  const r = Math.min(b.svgInlineHeight, b.innerOffset.w) / 2;
  const at = `centre (${cx.toFixed(1)}, ${cy.toFixed(1)}) r ${r.toFixed(1)} vs box ${JSON.stringify(b.box)}`;
  expect(cx - r, `${label}: disc inside box (left) — ${at}`).to.be.gte(b.box.left - PX);
  expect(cx + r, `${label}: disc inside box (right) — ${at}`).to.be.lte(b.box.right + PX);
  expect(cy - r, `${label}: disc inside box (top) — ${at}`).to.be.gte(b.box.top - PX);
  expect(cy + r, `${label}: disc inside box (bottom) — ${at}`).to.be.lte(b.box.bottom + PX);
};

/**
 * @tjBlock  styles
 * @tjUsage  rootShadowClip('c1').then((s) => expect(s.clippedBy).to.deep.eq([]))
 * @tjDom    reads the root's computed box-shadow (`<color> x y blur spread`), expands the root rect by it, walks
 *           the ancestors up to #real-canvas and returns every ancestor whose overflow is not `visible` and whose
 *           rect does not contain that extent. Plain object: { shadow, root, extent, clippedBy: [{ tag, cy, ... }] }
 */
export const rootShadowClip = (name) =>
  cy.get(`[data-cy="draggable-widget-${name}"] [data-cy="${name}"]`).first().then(($root) => {
    const root = $root[0];
    const win = root.ownerDocument.defaultView;
    const shadow = win.getComputedStyle(root).boxShadow;
    const nums = (shadow.replace(/rgba?\([^)]*\)/, "").match(/-?\d+(\.\d+)?px/g) || []).map(parseFloat);
    const [x = 0, y = 0, blur = 0, spread = 0] = nums;
    const r = root.getBoundingClientRect();
    const reach = blur + spread;
    const extent = {
      left: Math.min(r.left, r.left + x - reach),
      right: Math.max(r.right, r.right + x + reach),
      top: Math.min(r.top, r.top + y - reach),
      bottom: Math.max(r.bottom, r.bottom + y + reach),
    };
    const clippedBy = [];
    for (let el = root.parentElement; el && el.id !== "real-canvas" && el !== root.ownerDocument.body; el = el.parentElement) {
      const cs = win.getComputedStyle(el);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const a = el.getBoundingClientRect();
      const cutX = cs.overflowX !== "visible" && (extent.left < a.left - 0.5 || extent.right > a.right + 0.5);
      const cutY = cs.overflowY !== "visible" && (extent.top < a.top - 0.5 || extent.bottom > a.bottom + 0.5);
      if (cutX || cutY) {
        clippedBy.push({
          tag: el.tagName,
          cls: String(el.className).slice(0, 80),
          cy: el.getAttribute("data-cy"),
          overflowX: cs.overflowX,
          overflowY: cs.overflowY,
        });
      }
    }
    return {
      shadow,
      root: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
      extent,
      clippedBy,
    };
  });
