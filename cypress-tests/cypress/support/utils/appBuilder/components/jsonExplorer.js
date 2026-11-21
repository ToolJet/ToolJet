/**
 * MODULE — appBuilder/components/jsonExplorer: browser-only helpers for the JSON Explorer widget (react-json-tree).
 * FOR AI: addJsonExplorersViaApi seeds JSON Explorers (+ helper widgets/events) through the shared JSON-widget seeder
 * (jsonEditor.js addJsonWidgetsViaApi) with the explorer's own definition defaults; explorerMetrics /
 * readExplorerMetrics read plain geometry + tree state (rendered node count, labels, scroll sizes, disabled class,
 * opacity, pointer-events, focusables, roles); toggleNode clicks one nested node's arrow / label / item string with a
 * real pointer; treeTextRuns lists every painted text run of the tree with the element whose background is actually
 * painted behind it (the "shows through" oracle) and its WCAG contrast.
 */
import { jsonExplorerText } from "Texts/appBuilder/components/jsonExplorer";
import { jsonExplorerSelector as S } from "Selectors/appBuilder/components/jsonExplorer";
import { addJsonWidgetsViaApi, contrastRatio, parseColor } from "Support/utils/appBuilder/components/jsonEditor";

const T = jsonExplorerText;

/**
 * @tjBlock  contexts
 * @tjUsage  addJsonExplorersViaApi([{ name: 'jx1', layout: { top: 40, left: 2, width: 12, height: 120 }, properties: { dynamicHeight: { value: '{{true}}' } } }, { type: 'Text', name: 'below', layout: {…}, properties: { text: { value: 'A' } } }])
 * @tjDom    addJsonWidgetsViaApi(items, { componentType: 'JSONExplorer', definition: jsonExplorer.js:184-211 defaults,
 *           defaultSize: jsonExplorer.js:6-9 }) — items without `type` are JSON Explorers. Yields name → id map.
 */
export const addJsonExplorersViaApi = (items) =>
  addJsonWidgetsViaApi(items, { componentType: T.componentType, definition: T.definition, defaultSize: T.defaultSize });

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const measure = (doc, name) => {
  const win = doc.defaultView;
  const widget = doc.querySelector(S.draggableWidget(name));
  const box = doc.querySelector(S.box(name));
  const cs = widget ? win.getComputedStyle(widget) : null;
  return {
    name,
    widget: rectOf(widget),
    widgetClass: widget ? widget.className : null,
    widgetOpacity: cs ? cs.opacity : null,
    widgetPointerEvents: cs ? cs.pointerEvents : null,
    box: box && {
      ...rectOf(box),
      inlineHeight: box.style.height,
      scrollHeight: box.scrollHeight,
      clientHeight: box.clientHeight,
      background: win.getComputedStyle(box).backgroundColor,
    },
    nodes: box ? box.querySelectorAll("li").length : 0,
    labels: box ? [...box.querySelectorAll("label")].map((l) => l.textContent) : [],
    text: box ? box.textContent : "",
    // D-04 oracle: anything a keyboard could land on, and any ARIA role (e.g. tree / treeitem)
    focusables: box ? box.querySelectorAll('a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]').length : 0,
    roles: box ? [...box.querySelectorAll("[role]")].map((e) => e.getAttribute("role")) : [],
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  explorerMetrics('jx1', (m) => expect(m.nodes).to.eq(13))
 * @tjDom    retries the callback with plain objects: widget (grid box rect, class, opacity, pointer-events), box
 *           (`.json-explorer` rect, inline height, scroll/client height, computed background), nodes (rendered `li`
 *           count — collapsed children are not rendered), labels (key label texts), text, focusables, roles
 */
export const explorerMetrics = (name, assertFn) =>
  cy.get(S.draggableWidget(name), { timeout: 30000 }).should(($w) => assertFn(measure($w[0].ownerDocument, name)));

/** Yields the metrics once (no retry) — for before/after comparisons. */
export const readExplorerMetrics = (name) =>
  cy.get(S.draggableWidget(name), { timeout: 30000 }).then(($w) => measure($w[0].ownerDocument, name));

/**
 * @tjBlock  userflow
 * @tjUsage  toggleNode('jx1', 'list', 'arrow')   // part: 'arrow' | 'label' | 'itemString'
 * @tjDom    the nested node `<li>` whose own label reads `<key>:` → its direct child part (jsonExplorer selectors
 *           nodePart) → cy.realClick (CDP pointer at the part's centre, so pointer-events:none on a disabled widget
 *           really blocks it). `{ scrollBehavior: false }` — measure positions against the widget, not the page.
 */
export const nodePart = (name, key, part = "label") =>
  cy
    .get(S.label(name), { timeout: 30000 })
    .filter((_, l) => l.textContent === `${key}:`)
    .first()
    .parent("li")
    .children(S.nodePart[part])
    .first();

export const toggleNode = (name, key, part = "label") => nodePart(name, key, part).realClick({ scrollBehavior: false });

/**
 * @tjBlock  styles
 * @tjUsage  treeTextRuns('jx1').then((runs) => runs.forEach((r) => expect(r.ratio).to.be.gte(3)))
 * @tjDom    walks every non-blank text node of the widget's `.json-explorer` and yields plain rows { text, color,
 *           background, paintedByContainer, ratio } sorted worst-first. `background` is the first ancestor whose
 *           background is painted (alpha > 0.5); `paintedByContainer` is whether that ancestor is the `.json-explorer`
 *           container itself (i.e. nothing in the tree paints over the widget's Background). Runs whose own colour is
 *           fully transparent are skipped: that is the ▶ glyph, replaced by a CSS mask icon (jsonExplorer.scss:19-22).
 */
export const treeTextRuns = (name) =>
  cy.get(S.box(name), { timeout: 30000 }).then(($box) => {
    const box = $box[0];
    const doc = box.ownerDocument;
    const win = doc.defaultView;
    const rows = [];
    const walker = doc.createTreeWalker(box, win.NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      const el = node.parentElement;
      const color = win.getComputedStyle(el).color;
      if (parseColor(color).a === 0) continue;
      let painter = el;
      while (painter && painter !== doc.documentElement && parseColor(win.getComputedStyle(painter).backgroundColor).a <= 0.5) {
        painter = painter.parentElement;
      }
      const background = painter ? win.getComputedStyle(painter).backgroundColor : "rgb(255, 255, 255)";
      rows.push({
        text: node.textContent.trim().slice(0, 24),
        color,
        background,
        paintedByContainer: painter === box,
        ratio: Number(contrastRatio(color, background).toFixed(2)),
      });
    }
    return rows.sort((a, b) => a.ratio - b.ratio);
  });
