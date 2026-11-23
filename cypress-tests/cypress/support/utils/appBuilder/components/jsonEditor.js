/**
 * MODULE — appBuilder/components/jsonEditor: browser-only helpers for the JSON widgets (JSON Editor, and reusable
 * for JSON Explorer through `componentType` / `rootSelector`).
 * FOR AI: addJsonWidgetsViaApi seeds JSON widgets (+ helper widgets, events, children via `parent`) in one
 * components POST, merging the widget's definition defaults; jsonEditorMetrics / readJsonEditorMetrics read plain
 * geometry + scroll + gutter + line-number state of a CodeMirror JSON Editor; tokenContrast measures every painted
 * text run of a CodeMirror document against the background it is actually painted on (WCAG ratio); contrastRatio /
 * parseColor are the pure colour maths; typeIntoJsonEditor types real keys at the end of a line; hoverTwice opens
 * hover tooltips reliably (CodeMirror needs a pointer MOVE over the target).
 */
import { jsonEditorText } from "Texts/appBuilder/components/jsonEditor";
import { jsonEditorSelector as S } from "Selectors/appBuilder/components/jsonEditor";
import { addDateWidgetsViaApi } from "Support/utils/appBuilder/components/dateTimeCommon";

const T = jsonEditorText;

/**
 * @tjBlock  contexts
 * @tjUsage  addJsonWidgetsViaApi([{ name: 'je1', layout: { top: 40, left: 2, width: 12, height: 120 }, properties: { dynamicHeight: { value: '{{true}}' } } }, { type: 'Text', name: 'text1', layout: {…}, properties: { text: { value: 'A' } } }])
 *           addJsonWidgetsViaApi(items, { componentType: 'JSONExplorer', definition: jsonExplorerText.definition, defaultSize: {…} })
 * @tjDom    GET /api/apps/<appId> → POST /api/v2/apps/<appId>/versions/<v>/components (+ POST .../events per handler,
 *           see addDateWidgetsViaApi). Items without `type` are `componentType` (default JSONEditor) and get
 *           `definition` (default jsonEditor.js:179-205) merged under properties/styles/others; other types post only
 *           what is passed. Sets Cypress.env('editingVersionId') (needed by cy.apiUpdateGlobalSettings). Yields the
 *           name → component-id map.
 */
export const addJsonWidgetsViaApi = (
  items,
  { componentType = T.componentType, definition, defaultSize = T.defaultSize, appId } = {}
) => {
  const defs = definition || (componentType === T.componentType ? T.definition : null);
  const merged = items.map((item) => {
    const own = !item.type || item.type === componentType;
    if (!own || !defs) return item;
    return {
      ...item,
      properties: { ...defs.properties, ...item.properties },
      styles: { ...defs.styles, ...item.styles },
      others: { ...defs.others, ...item.others },
    };
  });
  return addDateWidgetsViaApi(merged, { componentType, defaultSize, appId });
};

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const measure = (doc, name) => {
  const win = doc.defaultView;
  const widget = doc.querySelector(S.draggableWidget(name));
  const box = doc.querySelector(S.box(name));
  const q = (sel) => doc.querySelector(sel);
  const scroller = q(S.scroller(name));
  const gutters = q(S.gutters(name));
  const content = q(S.content(name));
  const numbers = [...doc.querySelectorAll(`${S.lineNumbers(name)} .cm-gutterElement`)].filter((e) => e.textContent);
  const lastNumber = numbers[numbers.length - 1];
  let lastNumberInfo = null;
  if (lastNumber) {
    const range = doc.createRange();
    range.selectNodeContents(lastNumber);
    const text = range.getBoundingClientRect();
    lastNumberInfo = {
      text: lastNumber.textContent,
      textLeft: text.left,
      textRight: text.right,
      right: lastNumber.getBoundingClientRect().right,
      scrollWidth: lastNumber.scrollWidth,
      clientWidth: lastNumber.clientWidth,
    };
  }
  const cs = (el) => (el ? win.getComputedStyle(el) : null);
  return {
    widget: rectOf(widget),
    widgetClass: widget ? widget.className : null,
    widgetOpacity: widget ? cs(widget).opacity : null,
    widgetPointerEvents: widget ? cs(widget).pointerEvents : null,
    box: box && { ...rectOf(box), inlineHeight: box.style.height },
    editorBackground: q(S.editor(name)) ? cs(q(S.editor(name))).backgroundColor : null,
    scroller: scroller && {
      ...rectOf(scroller),
      scrollTop: scroller.scrollTop,
      scrollLeft: scroller.scrollLeft,
      scrollWidth: scroller.scrollWidth,
      scrollHeight: scroller.scrollHeight,
      clientWidth: scroller.clientWidth,
      clientHeight: scroller.clientHeight,
      overflowX: cs(scroller).overflowX,
      overscrollBehaviorX: cs(scroller).overscrollBehaviorX,
      background: cs(scroller).backgroundColor,
    },
    gutters: gutters && {
      ...rectOf(gutters),
      background: cs(gutters).backgroundColor,
      position: cs(gutters).position,
      borderRight: parseFloat(cs(gutters).borderRightWidth) || 0,
    },
    lineNumbers: rectOf(q(S.lineNumbers(name))),
    lastNumber: lastNumberInfo,
    content: content && {
      ...rectOf(content),
      editable: content.getAttribute("contenteditable"),
      text: content.textContent,
    },
    lines: doc.querySelectorAll(S.line(name)).length,
    lineHeight: q(S.line(name)) ? q(S.line(name)).getBoundingClientRect().height : 0,
    foldPlaceholders: doc.querySelectorAll(S.foldPlaceholder(name)).length,
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  jsonEditorMetrics('je1', (m) => expect(m.scroller.scrollLeft).to.be.gt(0))
 * @tjDom    retries the callback with plain objects: widget (grid box rect, class, opacity, pointer-events), box
 *           (`.json-editor-widget` rect + inline height), editorBackground (`.cm-editor` computed background),
 *           scroller (rect, scroll offsets/sizes, overflow-x, overscroll-behavior-x, background), gutters (rect,
 *           background, position, border-right), lineNumbers rect, lastNumber (last rendered line number: text,
 *           painted text box, element right edge, scroll/client width), content (rect, contenteditable, text),
 *           lines (rendered `.cm-line` count), lineHeight (first line's height) and foldPlaceholders
 */
export const jsonEditorMetrics = (name, assertFn) =>
  cy.get(S.draggableWidget(name), { timeout: 30000 }).should(($w) => assertFn(measure($w[0].ownerDocument, name)));

/** Yields the metrics once (no retry) — for before/after comparisons. */
export const readJsonEditorMetrics = (name) =>
  cy.get(S.draggableWidget(name), { timeout: 30000 }).then(($w) => measure($w[0].ownerDocument, name));

/**
 * @tjBlock  styles
 * @tjUsage  parseColor('rgba(1, 2, 3, 0.5)') → { r: 1, g: 2, b: 3, a: 0.5 }
 */
export const parseColor = (css) => {
  const m = String(css).match(/[\d.]+/g) || [0, 0, 0];
  const [r, g, b, a] = m.map(Number);
  return { r, g, b, a: a === undefined ? 1 : a };
};

const luminance = ({ r, g, b }) => {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/**
 * @tjBlock  styles
 * @tjUsage  expect(contrastRatio('rgb(255, 255, 255)', 'rgb(51, 51, 56)')).to.be.gte(4.5)
 * @tjDom    pure: WCAG 2.x contrast ratio (L1 + 0.05) / (L2 + 0.05) of two opaque CSS colours
 */
export const contrastRatio = (fg, bg) => {
  const [l1, l2] = [luminance(parseColor(fg)), luminance(parseColor(bg))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/**
 * @tjBlock  styles
 * @tjUsage  tokenContrast('[data-cy="draggable-widget-je1"] .cm-content').then((runs) => runs.forEach((r) => expect(r.ratio).to.be.gte(3)))
 * @tjDom    walks every non-blank text node under `rootSelector` and yields plain rows { text, color, background,
 *           ratio, opacity } sorted worst-first: `color` is the text node's parent computed colour, `background` the
 *           first ancestor background that is painted (alpha > 0.5) — what the reader actually sees behind the glyphs
 */
export const tokenContrast = (rootSelector) =>
  cy.get(rootSelector, { timeout: 30000 }).then(($root) => {
    const root = $root[0];
    const doc = root.ownerDocument;
    const win = doc.defaultView;
    const paintedBackground = (el) => {
      for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
        const bg = win.getComputedStyle(e).backgroundColor;
        if (parseColor(bg).a > 0.5) return bg;
      }
      return "rgb(255, 255, 255)";
    };
    const rows = [];
    const walker = doc.createTreeWalker(root, win.NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      const el = node.parentElement;
      const color = win.getComputedStyle(el).color;
      const background = paintedBackground(el);
      rows.push({ text: node.textContent.trim().slice(0, 24), color, background, ratio: Number(contrastRatio(color, background).toFixed(2)) });
    }
    return rows.sort((a, b) => a.ratio - b.ratio);
  });

/**
 * @tjBlock  userflow
 * @tjUsage  typeIntoJsonEditor('je1', 1, '{enter}"k": 1,')
 * @tjDom    real click on rendered line `lineIndex` of the widget's `.cm-content`, End, then cy.realType(keys)
 *           (CDP key events — CodeMirror sees real input, onChange fires)
 */
export const typeIntoJsonEditor = (name, lineIndex, keys) => {
  cy.get(S.line(name)).eq(lineIndex).realClick({ scrollBehavior: false });
  cy.realPress("End");
  cy.realType(keys, { delay: 10 });
};

/**
 * @tjBlock  userflow
 * @tjUsage  hoverTwice(jsonEditorSelector.lintMarker('je1'))
 * @tjDom    two real pointer moves onto the element (CodeMirror hover tooltips open on mousemove, not mouseover)
 */
export const hoverTwice = (selector) => {
  cy.get(selector).first().realHover({ scrollBehavior: false });
  cy.get(selector).first().realHover({ position: "topLeft", scrollBehavior: false });
  cy.get(selector).first().realHover({ scrollBehavior: false });
};
