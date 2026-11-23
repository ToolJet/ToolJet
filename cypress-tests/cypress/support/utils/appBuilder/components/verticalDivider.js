/**
 * MODULE — appBuilder/components/verticalDivider: browser-only helpers for the Vertical Divider.
 * FOR AI: seeding / viewer / box reading reuse the Horizontal Divider helpers (components/divider.js) with the
 * VerticalDivider type + definition. lineShadowClip reports which ancestors (if any) would clip the line's
 * painted box-shadow — the shadow itself is not hit-testable, so the check is geometric.
 */
import { verticalDividerText } from "Texts/appBuilder/components/verticalDivider";
import { addDividersViaApi } from "Support/utils/appBuilder/components/divider";

/**
 * @tjBlock  contexts
 * @tjUsage  addVerticalDividersViaApi([{ name: 'v1', layout: { top: 40, left: 4, width: 1, height: 20 }, styles: { dividerStyle: { value: 'dashed' } } }])
 * @tjDom    addDividersViaApi with type VerticalDivider and the VerticalDivider definition defaults
 *           (verticalDivider.js:98-115) merged under each item's own properties/styles/others; items with another
 *           `type` (a neighbouring Text, …) pass through unchanged
 */
export const addVerticalDividersViaApi = (items, opts = {}) =>
  addDividersViaApi(items, {
    type: verticalDividerText.componentType,
    definition: verticalDividerText.definition,
    ...opts,
  });

/**
 * @tjBlock  styles
 * @tjUsage  lineShadowClip('v1').then((s) => expect(s.clippedBy).to.deep.eq([]))
 * @tjDom    reads the painted line's computed box-shadow (`<color> x y blur spread`), expands the line rect by it
 *           (offset ± (blur + spread)), then walks the ancestors up to the canvas and returns every ancestor whose
 *           overflow is not `visible` and whose rect does not contain that extent. Plain object:
 *           { shadow, line, extent, clippedBy: [{ tag, cls, cy, overflowX, overflowY, rect }] }
 */
export const lineShadowClip = (name) =>
  cy.get(`[data-cy="draggable-widget-${name}"] [data-cy="${name}"] > div`).first().then(($line) => {
    const line = $line[0];
    const win = line.ownerDocument.defaultView;
    const shadow = win.getComputedStyle(line).boxShadow;
    const nums = (shadow.replace(/rgba?\([^)]*\)/, "").match(/-?\d+(\.\d+)?px/g) || []).map(parseFloat);
    const [x = 0, y = 0, blur = 0, spread = 0] = nums;
    const r = line.getBoundingClientRect();
    const reach = blur + spread;
    const extent = {
      left: Math.min(r.left, r.left + x - reach),
      right: Math.max(r.right, r.right + x + reach),
      top: Math.min(r.top, r.top + y - reach),
      bottom: Math.max(r.bottom, r.bottom + y + reach),
    };
    const clippedBy = [];
    for (let el = line.parentElement; el && el.id !== "real-canvas" && el !== line.ownerDocument.body; el = el.parentElement) {
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
          rect: { left: a.left, right: a.right, top: a.top, bottom: a.bottom },
        });
      }
    }
    return {
      shadow,
      line: { left: r.left, right: r.right, top: r.top, bottom: r.bottom },
      extent,
      clippedBy,
    };
  });

/**
 * @tjBlock  canvas
 * @tjUsage  dividerBoxes('v1', (b) => expectCenteredLine(b, 'default'))
 * @tjDom    on a dividerBoxes() snapshot: exactly one painted line, 1px wide, spanning the full height of the
 *           flex root, horizontally centred in it; the root fills the RenderWidget box minus its padding
 *           (BOX_PADDING 2px, or 0 with padding:none)
 */
export const expectCenteredLine = (b, label = "", padding = verticalDividerText.boxPadding) => {
  const PX = 0.6;
  const mid = (r) => r.left + r.width / 2;
  expect(b.rootDisplay, `${label}: root displayed`).to.eq("flex");
  expect(b.lines, `${label}: one line`).to.have.length(1);
  const [l] = b.lines;
  expect(l.width, `${label}: 1px line`).to.be.closeTo(verticalDividerText.lineWidth, 0.01);
  expect(l.top, `${label}: line starts at the root top`).to.be.closeTo(b.root.top, PX);
  expect(l.height, `${label}: line spans the root height`).to.be.closeTo(b.root.height, PX);
  expect(mid(l), `${label}: line centred in the root`).to.be.closeTo(mid(b.root), PX);
  expect(b.root.width, `${label}: root = box width minus padding`).to.be.closeTo(b.box.width - 2 * padding, PX);
  expect(b.root.height, `${label}: root = box height minus padding`).to.be.closeTo(b.box.height - 2 * padding, PX);
  expect(mid(b.root), `${label}: root centred in the box`).to.be.closeTo(mid(b.box), PX);
};
