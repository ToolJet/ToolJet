// Pixel geometry of a widget on the canvas, measured with getBoundingClientRect in the app's own window. The box is
// the canvas wrapper (`.ele-<id>`, the parent of `[data-cy="draggable-widget-<name>"]`) in both the viewer and the
// editor; the root is the widget's own top element inside it.

/** Allowed slack, in px. */
export const TOL = {
  fill: 2, // the visible surface may sit up to 2 px inside the box on each side
  outside: 1, // sub-pixel rounding when checking that nothing paints past the box
  parity: 1, // editor vs preview tops and heights
};

const r1 = (n) => Math.round(n * 10) / 10;
const rectOf = (r) => ({ top: r1(r.top), left: r1(r.left), right: r1(r.right), bottom: r1(r.bottom), width: r1(r.width), height: r1(r.height) });

/** The canvas wrapper and the widget element for a canvas name (the first one whose parent is the `.ele-` box). */
export const findWidget = (doc, name) => {
  const all = [...doc.querySelectorAll(`[data-cy="draggable-widget-${name}"]`)];
  const el = all.find((e) => /(^|\s)ele-/.test(e.parentElement?.className || "")) || all[0];
  return el ? { el, box: el.parentElement } : null;
};

const alphaOf = (color) => {
  if (!color || color === "transparent") return 0;
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return 1;
  const parts = m[1].split(/[ ,/]+/).filter(Boolean);
  return parts.length > 3 ? parseFloat(parts[3]) : 1;
};

const REPLACED = new Set(["IMG", "SVG", "CANVAS", "VIDEO", "IFRAME", "INPUT", "TEXTAREA", "SELECT", "PROGRESS"]);

/** Does this element paint something of its own (a fill, a border, a shadow, an image, a form control)? */
const paints = (win, e, s) => {
  if (REPLACED.has(e.tagName.toUpperCase())) return true;
  if (alphaOf(s.backgroundColor) > 0.02 || (s.backgroundImage && s.backgroundImage !== "none")) return true;
  if (s.boxShadow && s.boxShadow !== "none" && !/0px 0px 0px 0px/.test(s.boxShadow)) return true;
  return ["Top", "Right", "Bottom", "Left"].some(
    (side) => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== "none" && alphaOf(s[`border${side}Color`]) > 0.02
  );
};

const isClipping = (s) => s.overflowX !== "visible" || s.overflowY !== "visible" || (s.contain || "").includes("paint");
const isScroller = (s) => /(auto|scroll)/.test(s.overflowY) || /(auto|scroll)/.test(s.overflowX);

/** Intersects a rect with every clipping ancestor between `node` and `stop` (inclusive of stop). */
const clipRect = (win, node, rect, stop) => {
  // DOMRect fields are prototype getters, so spreading one gives {}: copy them.
  let r = { top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right };
  for (let a = node.parentElement; a; a = a.parentElement) {
    const s = win.getComputedStyle(a);
    if (isClipping(s)) {
      const ab = a.getBoundingClientRect();
      r = { top: Math.max(r.top, ab.top), left: Math.max(r.left, ab.left), bottom: Math.min(r.bottom, ab.bottom), right: Math.min(r.right, ab.right) };
    }
    if (a === stop) break;
  }
  return r;
};

const visible = (s) => s.display !== "none" && s.visibility !== "hidden" && s.visibility !== "collapse" && parseFloat(s.opacity) > 0.01;

/** Visible, non-fixed elements (with their computed style) under `root`, the root included. */
const visibleElements = (win, root) => {
  const out = [];
  const walk = (e) => {
    const s = win.getComputedStyle(e);
    if (s.display === "none" || parseFloat(s.opacity) <= 0.01) return; // nothing below paints either
    // A spinning element's bounding box swells as it turns (a rotated square), so it is not measured.
    const spinning = s.animationName !== "none" && s.transform !== "none";
    if (s.position !== "fixed" && visible(s) && !spinning) out.push([e, s]);
    if (e.tagName.toUpperCase() === "SVG") return; // the svg's own box stands for its shapes
    [...e.children].forEach(walk);
  };
  walk(root);
  return out;
};

/** Rects of the non-blank text under an element. */
const textRects = (doc, e) => {
  const rects = [];
  e.childNodes.forEach((n) => {
    if (n.nodeType === 3 && n.textContent.trim()) {
      const range = doc.createRange();
      range.selectNodeContents(n);
      [...range.getClientRects()].forEach((r) => r.width > 0 && r.height > 0 && rects.push(r));
    }
  });
  return rects;
};

/**
 * Everything the geometry checks need about one widget:
 *  - box: the canvas wrapper; root: the widget's top element; rootGap: how far the root sits inside the box per side
 *  - wideSurface: the first painted element at least half the box wide and tall (bands are only checked then)
 *  - surface: the union of what visibly paints (fills, borders, shadows, images, controls, text), each piece clipped by
 *    its clipping ancestors up to the box; surfaceGap: how far that sits inside the box per side (negative = outside)
 *  - outside: how far anything visible paints past the box per side
 *  - cutOff: content that runs past the box (or a clipping element inside it) and is clipped by an element that does
 *    not scroll, so it can never be seen
 *  - scrollers: the scroll containers inside the widget that have more content than room
 */
export const measureWidget = (win, name) => {
  const doc = win.document;
  const found = findWidget(doc, name);
  if (!found) return { name, missing: true };
  const { el, box } = found;
  const b = box.getBoundingClientRect();
  const root = el.firstElementChild || el;
  const rr = root.getBoundingClientRect();
  const u = { top: Infinity, left: Infinity, bottom: -Infinity, right: -Infinity };
  const outsideBy = { top: 0, right: 0, bottom: 0, left: 0 };
  const offenders = [];
  const cutOff = [];
  let wideSurface = null; // a painted element at least half the box wide and tall (a card, a field, a chart): bands show
  const add = (node, rect, what) => {
    const c = clipRect(win, node, rect, box);
    if (c.bottom - c.top < 0.5 || c.right - c.left < 0.5) return;
    u.top = Math.min(u.top, c.top);
    u.left = Math.min(u.left, c.left);
    u.bottom = Math.max(u.bottom, c.bottom);
    u.right = Math.max(u.right, c.right);
    const over = { top: b.top - c.top, right: c.right - b.right, bottom: c.bottom - b.bottom, left: b.left - c.left };
    let worst = 0;
    Object.keys(over).forEach((k) => {
      outsideBy[k] = Math.max(outsideBy[k], over[k]);
      worst = Math.max(worst, over[k]);
    });
    if (worst > 1 && offenders.length < 3) offenders.push(`${what} by ${r1(worst)}px`);
  };
  const label = (e) => `${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\s+/).slice(0, 2).join(".") : ""}`;
  visibleElements(win, el).forEach(([e, s]) => {
    const r = e.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && paints(win, e, s)) {
      add(e, r, label(e));
      if (!wideSurface && r.width >= b.width / 2 && r.height >= b.height / 2) wideSurface = label(e);
    }
    textRects(doc, e).forEach((t) => add(e, t, `text "${e.textContent.trim().slice(0, 20)}"`));
    // Content past a clipping, non-scrolling ancestor (inside the box) that can never be scrolled to: cut off.
    if (r.height > 0 && cutOff.length < 3) {
      for (let a = e.parentElement; a && a !== box.parentElement; a = a.parentElement) {
        const as = win.getComputedStyle(a);
        if (as.overflowY !== "visible") {
          const ab = a.getBoundingClientRect();
          const past = r.bottom - ab.bottom;
          const clipped = !/(auto|scroll)/.test(as.overflowY);
          // Ellipsis and line clamps cut text on purpose; skip text-only leaves that ask for it.
          const clamp = s.textOverflow === "ellipsis" || s.webkitLineClamp !== "none" || as.webkitLineClamp !== "none";
          // Media cropped by its frame (map tiles, a cover image) is cropped on purpose too.
          const media = REPLACED.has(e.tagName.toUpperCase()) && !/^(INPUT|TEXTAREA|SELECT)$/i.test(e.tagName);
          if (clipped && past > 2 && !clamp && !media && r.top < ab.bottom && (paints(win, e, s) || textRects(doc, e).length))
            cutOff.push(`${label(e)} cut ${r1(past)}px by ${label(a)}`);
          break;
        }
      }
    }
  });
  const scrollers = [el, ...el.querySelectorAll("*")]
    .filter((e) => isScroller(win.getComputedStyle(e)) && (e.scrollHeight > e.clientHeight + 1 || e.scrollWidth > e.clientWidth + 1))
    .slice(0, 3)
    .map((e) => ({ el: label(e), clientHeight: e.clientHeight, scrollHeight: e.scrollHeight }));
  const has = u.top !== Infinity;
  const canvas = el.closest(".real-canvas");
  const cb = canvas ? canvas.getBoundingClientRect() : { top: 0, left: 0 };
  return {
    name,
    box: rectOf(b),
    // Position on the canvas, independent of scroll: compare it between the editor and the viewer.
    canvasTop: r1(b.top - cb.top + (canvas ? canvas.scrollTop : 0)),
    root: rectOf(rr),
    rootGap: { top: r1(rr.top - b.top), right: r1(b.right - rr.right), bottom: r1(b.bottom - rr.bottom), left: r1(rr.left - b.left) },
    wideSurface,
    surface: has ? rectOf({ ...u, width: u.right - u.left, height: u.bottom - u.top }) : null,
    surfaceGap: has ? { top: r1(u.top - b.top), right: r1(b.right - u.right), bottom: r1(b.bottom - u.bottom), left: r1(u.left - b.left) } : null,
    outside: Object.fromEntries(Object.entries(outsideBy).map(([k, v]) => [k, r1(Math.max(0, v))])),
    offenders,
    cutOff,
    scrollers,
    contentHeight: r1(Math.max(root.scrollHeight, rr.height)),
  };
};

/**
 * The containment and fill failures for one measurement, as readable lines (empty when it passes).
 * Fill: the root fills the box within TOL.fill on every side, and the visible surface reaches within TOL.fill of the
 * top and bottom (a band inside or below the box). Containment: nothing paints more than TOL.outside past the box.
 * Scroll: content larger than the box is reachable by scrolling, not cut off.
 */
export const geometryFailures = (m, { checkSurfaceBands = true } = {}) => {
  if (m.missing) return ["widget not rendered"];
  const f = [];
  Object.entries(m.rootGap).forEach(([side, gap]) => {
    if (gap > TOL.fill + 0.5) f.push(`root sits ${gap}px inside the box at the ${side} (box ${m.box.width}x${m.box.height}, root ${m.root.width}x${m.root.height})`);
    if (gap < -(TOL.outside + 0.5)) f.push(`root sticks out ${-gap}px at the ${side} (box ${m.box.width}x${m.box.height}, root ${m.root.width}x${m.root.height})`);
  });
  // A band only shows against a painted surface; a widget that is only text or a small control is not checked.
  if (checkSurfaceBands && m.surfaceGap && m.wideSurface) {
    ["top", "bottom"].forEach((side) => {
      const gap = m.surfaceGap[side];
      if (gap > TOL.fill + 0.5) f.push(`blank band of ${gap}px at the ${side} (box ${m.box.height}px tall, visible surface ${m.surface.height}px, ${m.wideSurface})`);
    });
  }
  Object.entries(m.outside).forEach(([side, by]) => {
    if (by > TOL.outside + 0.5) f.push(`paints ${by}px outside the box at the ${side} (${m.offenders.join("; ")})`);
  });
  m.cutOff.forEach((c) => f.push(`content cut off without scrolling: ${c}`));
  return f;
};

/** Every named widget's box on the canvas in one pass (no scrolling): { name: { canvasTop, height, width } }. */
export const measureBoxes = (win, names) => {
  const out = {};
  names.forEach((name) => {
    const found = findWidget(win.document, name);
    if (!found) return;
    const b = found.box.getBoundingClientRect();
    const canvas = found.el.closest(".real-canvas");
    const cb = canvas ? canvas.getBoundingClientRect() : { top: 0 };
    out[name] = { canvasTop: r1(b.top - cb.top + (canvas ? canvas.scrollTop : 0)), height: r1(b.height), width: r1(b.width) };
  });
  const canvas = win.document.querySelector("#real-canvas") || win.document.querySelector(".real-canvas");
  out.__canvasWidth = canvas ? r1(canvas.getBoundingClientRect().width) : null;
  return out;
};
