// No Cypress dependency, so the same functions run in a plain browser session for what Cypress
// fakes (real zoom, real-mouse drags). To paste them into a browser console:
// sed -E '/^import /d; s/^export //' <contrast.js> <this file>
import { contrastRatio, parseColor } from "../../../../../frontend/src/test/contrast";

const css = (el) => el.ownerDocument.defaultView.getComputedStyle(el);
const round = (value) => Math.round(value * 100) / 100;

export const isVisible = (el) => {
  const rect = el.getBoundingClientRect();
  const style = css(el);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
};

export const box = (el) => {
  const { x, y, width, height } = el.getBoundingClientRect();
  return { x: round(x), y: round(y), width: round(width), height: round(height) };
};

export const pick = (el, props) => {
  const style = css(el);
  return Object.fromEntries(props.map((prop) => [prop, style.getPropertyValue(prop)]));
};

// css-loader's default [hash:base64] module classes, emotion's css-<hash>- prefix and CSS-module
// __<hash> suffixes change between builds, so labels drop them.
const stableClass = (c) =>
  /^[\w-]{16}$/.test(c) && /[A-Z]/.test(c) && /[a-z]/.test(c)
    ? ""
    : c.replace(/^css-[a-z0-9]+-/, "").replace(/(module_\w+?)__[\w-]{5}$/, "$1");

export const label = (el) => {
  const cy = el.getAttribute("data-cy");
  const cls = [...el.classList]
    .filter((c) => !c.includes(":"))
    .map(stableClass)
    .filter(Boolean)
    .slice(0, 2)
    .map((c) => `.${c}`)
    .join("");
  // Ids and log ages change on every run, so evidence masks them.
  const text = (el.innerText || el.placeholder || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>")
    .replace(/^(now|\d+[smh])$/, "<age>")
    .slice(0, 30);
  return `${el.tagName.toLowerCase()}${cy ? `[data-cy=${cy}]` : cls}${text ? ` "${text}"` : ""}`;
};

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]';
export const TEXT_ENTRY =
  'input:not([type="checkbox"]):not([type="radio"]):not([type="button"]):not([type="submit"]), textarea, [contenteditable="true"]';

// Chrome reports tabIndex -1 for a contenteditable without a tabindex attribute, though Tab reaches it.
const tabbable = (el) => el.tabIndex >= 0 || (el.isContentEditable && !el.hasAttribute("tabindex"));

export const focusables = (root) =>
  [...root.querySelectorAll(FOCUSABLE)].filter(
    (el) => !el.disabled && tabbable(el) && !el.closest('[aria-hidden="true"]') && isVisible(el)
  );

export const accessibleName = (el) => {
  const doc = el.ownerDocument;
  const byIds = (el.getAttribute("aria-labelledby") || "")
    .split(/\s+/)
    .map((id) => (id && doc.getElementById(id)?.textContent) || "")
    .join(" ");
  const forLabel = el.id ? doc.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent : "";
  const wrapping = el.closest("label")?.textContent;
  const own = el.matches("input, select, textarea") ? "" : el.innerText;
  const alt = [...el.querySelectorAll("img[alt]")].map((img) => img.alt).join(" ");
  return (
    [byIds, el.getAttribute("aria-label"), forLabel, wrapping, own, alt, el.getAttribute("title")]
      .map((part) => (part || "").trim())
      .find(Boolean) || ""
  );
};

const DISABLED = '[disabled], [aria-disabled="true"], .disabled';

// Disabled controls are skipped because WCAG exempts them.
export const textElements = (root) =>
  [root, ...root.querySelectorAll("*")].filter(
    (el) =>
      [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) &&
      !el.closest(DISABLED) &&
      !el.closest(".cm-editor, .CodeMirror, svg, .canvas-area") &&
      isVisible(el)
  );

const ownText = (el) =>
  [...el.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => n.textContent)
    .join("")
    .trim();

const TRANSFORMS = {
  uppercase: (text) => text.toUpperCase(),
  lowercase: (text) => text.toLowerCase(),
  capitalize: (text) => text.replace(/(^|\s)(\S)/g, (_, space, letter) => space + letter.toUpperCase()),
};
const renderedText = (el) => (TRANSFORMS[css(el).textTransform] || String)(ownText(el));

export const backgroundLayers = (el) => {
  const layers = [];
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    const style = css(node);
    if (style.backgroundImage !== "none") return null;
    const colour = parseColor(style.backgroundColor);
    if (colour.a > 0) layers.push(style.backgroundColor);
    if (colour.a === 1) break;
  }
  return layers;
};

export const textContrast = (el) => {
  const style = css(el);
  const layers = backgroundLayers(el);
  if (!layers) return null;
  const size = parseFloat(style.fontSize);
  const large = size >= 24 || (size >= 18.66 && parseInt(style.fontWeight, 10) >= 700);
  return { ratio: contrastRatio(style.color, ...layers), min: large ? 3 : 4.5 };
};

// A focus indicator may be drawn by the control, by the styled sibling of a visually hidden input,
// by a wrapper through :focus-within, or by the react-select control around its input.
export const focusChain = (el) =>
  [
    el,
    el.nextElementSibling,
    el.parentElement,
    el.parentElement?.parentElement,
    el.closest('[class*="-control"], [class*="__control"]'),
  ].filter(Boolean);

export const ringSignature = (node) => {
  const s = css(node);
  const outline = s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0 ? `${s.outlineWidth} ${s.outlineColor}` : "";
  return [outline, s.boxShadow, s.borderColor, s.backgroundColor, s.textDecorationLine].join(" | ");
};

// A coarse ring shape, so stops can be compared whichever node draws the ring.
export const ringShape = (node) => {
  const s = css(node);
  if (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) return `outline ${s.outlineWidth}`;
  const spreads = (s.boxShadow === "none" ? [] : s.boxShadow.split(/,(?![^(]*\))/))
    .filter((shadow) => !/rgba\([^)]*,\s*0\)/.test(shadow))
    .map((shadow) => shadow.trim().split(/\s+/).at(-1));
  if (spreads.length) return `shadow ${spreads.join(" ")}`;
  return "border or fill only";
};

export const hiddenWhileFocused = (el) => {
  const rect = el.getBoundingClientRect();
  const win = el.ownerDocument.defaultView;
  // react-select's DummyInput and visually hidden checkboxes are zero-size by design.
  const hiddenByDesign = /dummyInput/i.test(el.className) || el.matches('input[type="checkbox"], input[type="radio"]');
  if ((rect.width < 1 || rect.height < 1) && !hiddenByDesign) return "zero size";
  const x = rect.x + rect.width / 2;
  const y = rect.y + rect.height / 2;
  if (x < 0 || y < 0 || x > win.innerWidth || y > win.innerHeight) return "off screen";
  const top = el.ownerDocument.elementFromPoint(x, y);
  // A tooltip the focus itself opened is transient, not a cover.
  if (top?.closest('[data-radix-popper-content-wrapper], [role="tooltip"], .tooltip')) return "";
  if (top && top !== el && !el.contains(top) && !top.contains(el)) return `covered by ${label(top)}`;
  return "";
};

export const lightness = (colour) => {
  const { r, g, b, a } = parseColor(colour);
  return a < 1 ? null : (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

const HEADER = ".tj-panel-header, .panel-header";
const CLOSE = '[aria-label^="Close"], [data-cy*="close"]';
const TABLIST = '.runtime-panel-bar, [role="tablist"], .nav-tabs, .query-manager-tabs';
const ACTIVE_TAB =
  '[role="tab"][aria-selected="true"], .nav-link.active, .runtime-panel-tab.active, [data-cy^="query-tab-"].active';
const ROW = ".page-menu-item, .query-row, .dependency-row, .code-search-entity-row, .runtime-inspector__entry";
const SEARCH = 'input[type="search"], input[placeholder^="Search"], input[placeholder^="Filter"]';
const MONOSPACE = /mono|code|courier|consolas|menlo/i;
// Title Case strings the QA report found in panels (UC-26), as rendered after text-transform.
const TITLE_CASE =
  /\b(Additional Actions|Data Source|Filter By|Sort By|Tooljet Database|Button Group|Popover Menu|Pages And Menu|Header And Navigation)\b/;

const centreY = (el) => {
  const r = el.getBoundingClientRect();
  return r.y + r.height / 2;
};

export const panelFacts = (root) => {
  const header = [...root.querySelectorAll(HEADER)].find(isVisible);
  const close = [...(header || root).querySelectorAll(CLOSE), ...root.querySelectorAll(CLOSE)].find(isVisible);
  const closeInHeader = header && close && header.contains(close);
  const title =
    header &&
    (header.querySelector('.tj-panel-header__title, [class*="inline-name"], input') ||
      textElements(header).find((el) => !el.closest('button, [role="tab"]')));
  const tablist = [...root.querySelectorAll(TABLIST)].find(isVisible);
  const activeTab = tablist && tablist.querySelector(ACTIVE_TAB);
  const texts = textElements(root);
  const families = {};
  const sizes = {};
  const offScale = [];
  texts.forEach((el) => {
    const { "font-family": family, "font-size": size } = pick(el, ["font-family", "font-size"]);
    const name = family.split(",")[0].replace(/["']/g, "").trim();
    if (MONOSPACE.test(name)) return;
    families[name] = (families[name] || 0) + 1;
    sizes[size] = (sizes[size] || 0) + 1;
    if (!["12px", "13px", "14px", "16px"].includes(size)) offScale.push(`${label(el)} ${size}`);
  });
  const rows = {};
  [...root.querySelectorAll(ROW)].filter(isVisible).forEach((row) => {
    const kind = [...row.classList].find((c) => ROW.includes(`.${c}`));
    const name = textElements(row)[0];
    rows[kind] ??= { radius: pick(row, ["border-radius"])["border-radius"], fontSize: name && pick(name, ["font-size"])["font-size"] };
  });
  return {
    header: header && {
      height: box(header).height,
      closeOffsetY: closeInHeader ? round(centreY(close) - centreY(header)) : null,
      closeInsetRight: closeInHeader ? round(box(header).x + box(header).width - box(close).x - box(close).width) : null,
    },
    title: title && {
      text: (title.value ?? title.innerText).trim(),
      x: box(title).x,
      y: box(title).y,
      ...pick(title, ["font-size", "font-weight", "color"]),
    },
    close: close && {
      top: round(box(close).y - box(root).y),
      right: round(box(root).x + box(root).width - box(close).x - box(close).width),
      y: box(close).y,
    },
    // The colour of the active tab's text as drawn, not its button's: tj-tabs colour an inner label.
    tabs: tablist && {
      height: activeTab && box(activeTab).height,
      activeColor: activeTab && pick(textElements(activeTab)[0] || activeTab, ["color"]).color,
    },
    search: [...root.querySelectorAll(SEARCH)].filter(isVisible).map((input) => ({
      placeholder: input.placeholder,
      name: input.getAttribute("aria-label"),
      height: box(input).height,
      ...pick(input, ["border-radius", "border-top-color"]),
    })),
    rows,
    families,
    sizes,
    offScale,
    titleCase: texts.map(renderedText).filter((text) => TITLE_CASE.test(text)),
    lightAreas: [root, ...root.querySelectorAll("*")]
      .filter((el) => isVisible(el) && el.getBoundingClientRect().width * el.getBoundingClientRect().height >= 400)
      .filter((el) => lightness(css(el).backgroundColor) > 0.6)
      .map(label),
  };
};

export const isClipped = (el) => {
  const right = el.getBoundingClientRect().right;
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    const { overflowX } = css(node);
    if (overflowX !== "hidden" && overflowX !== "clip") continue;
    if (node === el ? el.scrollWidth > el.clientWidth + 1 : right > node.getBoundingClientRect().right + 1) return true;
  }
  return false;
};

// Callers hover what is left, since a tooltip shows only on hover.
export const clippedWithoutTitle = (root) => {
  const clipped = textElements(root).filter((el) => {
    if (!isClipped(el)) return false;
    const text = el.innerText.trim();
    const named = el.closest("[title], [aria-label]");
    return !(named && root.contains(named) && (named.title || named.getAttribute("aria-label")).includes(text));
  });
  return clipped.filter((el) => !clipped.some((outer) => outer !== el && outer.contains(el)));
};
