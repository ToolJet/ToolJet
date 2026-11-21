/**
 * MODULE — appBuilder/components/pagination: browser-only helpers for the Pagination widget.
 * FOR AI: addPaginationsViaApi seeds fully-configured Paginations (plus any helper widgets / events) in one
 * components POST; openPaginationAppInViewer opens the running app; paginationBoxes reads the real geometry and
 * computed styles of the RenderWidget box, the navigation root, the control row and every row item;
 * clickPaginationItem real-clicks the VISIBLE part of an item (the row clips horizontally); paginationHitAt asks
 * the browser which element a real pointer lands on; currentPageText / expectCurrentPage observe
 * components.<name>.currentPageIndex through a Text widget plus the highlighted page.
 */
import { paginationText } from "Texts/appBuilder/components/pagination";
import { paginationSelector } from "Selectors/appBuilder/components/pagination";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

/**
 * @tjBlock  contexts
 * @tjUsage  addPaginationsViaApi([{ name: 'pg', layout: { top: 40, left: 2, width: 10 }, properties: { numberOfPages: { value: '{{150}}' } }, events: [counterEvent('onPageChange', 'changes')] }])
 * @tjDom    delegates to addIconsViaApi (GET app → POST components diff → POST events). Items without a `type`
 *           become Paginations (default 10 col × 30px) with the pagination.js definition properties/styles/others
 *           merged under the item's own; items with another `type` (a Text, TextInput, Button …) pass through.
 */
export const addPaginationsViaApi = (items, { appId } = {}) => {
  const type = paginationText.componentType;
  const D = paginationText.definition;
  return addIconsViaApi(
    items.map((item) =>
      item.type && item.type !== type
        ? item
        : {
            ...item,
            type,
            layout: { top: 40, left: 2, ...paginationText.defaultSize, ...item.layout },
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
 * @tjUsage  openPaginationAppInViewer(paginationSelector.items('pg'), { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openPaginationAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

// row order of the operators: <<, <, (pages), >, >>  (Pagination.jsx:175-210)
const OPERATORS_IN_ROW_ORDER = [
  paginationText.operators.first,
  paginationText.operators.previous,
  paginationText.operators.next,
  paginationText.operators.last,
];

const rectOf = (el) => {
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const measurePagination = (box, name) => {
  const win = box.ownerDocument.defaultView;
  const cs = (el) => win.getComputedStyle(el);
  const root = box.querySelector(`[data-cy="${name}"]`);
  const ul = root ? root.querySelector("ul.pagination") : null;
  const items = ul
    ? [...ul.children].map((li) => {
        const a = li.firstElementChild;
        const ariaLabel = li.getAttribute("aria-label");
        const text = (li.textContent || "").trim();
        return {
          label: ariaLabel || text,
          kind: ariaLabel ? "operator" : text === paginationText.ellipsis ? "ellipsis" : "page",
          active: li.classList.contains(paginationText.activeClass),
          disabled: li.classList.contains(paginationText.disabledClass),
          ...rectOf(li),
          pointerEvents: cs(li).pointerEvents,
          linkPointerEvents: a ? cs(a).pointerEvents : null,
          linkCursor: a ? cs(a).cursor : null,
          linkColor: a ? cs(a).color : null,
        };
      })
    : [];
  return {
    box: rectOf(box),
    // RenderWidget puts the shared `disabled` class on the box's inner node while disabled
    boxDisabled: !!box.querySelector(`.${paginationText.disabledClass}`) || box.classList.contains(paginationText.disabledClass),
    root: root
      ? {
          ...rectOf(root),
          display: cs(root).display,
          justify: cs(root).justifyContent,
          pointerEvents: cs(root).pointerEvents,
          ariaHidden: root.getAttribute("aria-hidden"),
          ariaDisabled: root.getAttribute("aria-disabled"),
        }
      : null,
    list: ul
      ? {
          ...rectOf(ul),
          display: cs(ul).display,
          overflowX: cs(ul).overflowX,
          flexWrap: cs(ul).flexWrap,
          scrollWidth: ul.scrollWidth,
          clientWidth: ul.clientWidth,
        }
      : null,
    items,
    rows: new Set(items.map((i) => Math.round(i.top))).size,
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  paginationBoxes('pg', (b) => expect(b.items.filter((i) => i.kind === 'operator')).to.have.length(4))
 * @tjDom    retries the callback with plain objects: `box` (RenderWidget box rect), `boxDisabled` (shared disabled
 *           class present), `root` (rect, display, justify-content, pointer-events, aria-hidden/-disabled), `list`
 *           (ul rect, display, overflow-x, flex-wrap, scroll/client width; null while loading), `items` (per <li> in
 *           row order: label = operator aria-label or text, kind operator|page|ellipsis, active, disabled, rect, and
 *           the <li>'s and its inner link's computed pointer-events, the link's cursor/colour), `rows` (distinct item tops)
 */
export const paginationBoxes = (name, assertFn) =>
  cy
    .get(paginationSelector.draggableWidget(name))
    .first()
    .should(($box) => assertFn(measurePagination($box[0], name)));

/**
 * @tjBlock  canvas
 * @tjUsage  getPaginationGeometry('pg').then((g) => expect(g.items.length).to.be.gt(4))
 * @tjDom    one-shot read (no retry) of the plain object paginationBoxes passes to its callback
 */
export const getPaginationGeometry = (name) =>
  cy
    .get(paginationSelector.draggableWidget(name))
    .first()
    .then(($box) => measurePagination($box[0], name));

/**
 * @tjBlock  canvas
 * @tjUsage  expectRowInsideBox('pg', { context: 'w10' })  /  expectRowInsideBox('pg', { clipped: true })
 * @tjDom    paginationBoxes: one row (no wrap), the control row (ul) lies inside the widget box, all four operators
 *           render in order, and no item starts left of the row. `clipped: false` (default, at or above the
 *           six-item floor): the row must not overflow (scrollWidth ≤ clientWidth + 1) and every item ends inside
 *           the ul. `clipped: true` (below the floor): the content IS wider than the row and the ul clips it
 *           (overflow-x: clip), so items extend past the ul only on its right edge and nothing paints outside the
 *           box. `clipped: 'auto'`: whichever applies — strict fit when the content fits, else the clipped checks.
 */
export const expectRowInsideBox = (name, { context = name, clipped = false } = {}) =>
  paginationBoxes(name, (b) => {
    const tol = 0.5;
    expect(b.list, `${context}: control row rendered`).to.not.eq(null);
    expect(b.rows, `${context}: one row, no wrapping`).to.eq(1);
    expect(b.items.filter((i) => i.kind === "operator").map((i) => i.label), `${context}: operators`).to.deep.eq(
      OPERATORS_IN_ROW_ORDER
    );
    expect(b.list.left, `${context}: row left inside box`).to.be.gte(b.box.left - tol);
    expect(b.list.right, `${context}: row right inside box`).to.be.lte(b.box.right + tol);
    expect(b.list.top, `${context}: row top inside box`).to.be.gte(b.box.top - tol);
    expect(b.list.bottom, `${context}: row bottom inside box`).to.be.lte(b.box.bottom + tol);
    b.items.forEach((i) => expect(i.left, `${context}: "${i.label}" starts inside the row`).to.be.gte(b.list.left - tol));
    const clip = clipped === "auto" ? b.list.scrollWidth > b.list.clientWidth + 1 : clipped;
    if (clip) {
      expect(b.list.overflowX, `${context}: row clips horizontally`).to.eq("clip");
      expect(b.list.scrollWidth, `${context}: content wider than the row (clipped)`).to.be.gt(b.list.clientWidth);
    } else {
      expect(b.list.scrollWidth, `${context}: row content fits`).to.be.lte(b.list.clientWidth + 1);
      b.items.forEach((i) => expect(i.right, `${context}: "${i.label}" ends inside the row`).to.be.lte(b.list.right + tol));
    }
  });

// the item <li> by label: an operator aria-label or the exact page text
const getItem = (name, label) =>
  Object.values(paginationText.operators).includes(label)
    ? cy.get(paginationSelector.operator(name, label)).first()
    : cy
        .get(paginationSelector.items(name))
        .filter((_, li) => !li.hasAttribute("aria-label") && (li.textContent || "").trim() === String(label))
        .first();

// centre of the part of the item that is not clipped by the row (relative to the item, and in viewport coords)
const visibleCentre = ($li) => {
  const li = $li[0];
  const ul = li.parentElement;
  const r = li.getBoundingClientRect();
  const u = ul.getBoundingClientRect();
  const left = Math.max(r.left, u.left);
  const right = Math.min(r.right, u.right);
  return {
    visibleWidth: Math.max(0, right - left),
    x: (left + right) / 2 - r.left,
    y: r.height / 2,
    clientX: (left + right) / 2,
    clientY: r.top + r.height / 2,
  };
};

/**
 * @tjBlock  userflow
 * @tjUsage  clickPaginationItem('pg', paginationText.operators.next)  /  clickPaginationItem('pg', 7)
 * @tjDom    real (CDP) click at the centre of the VISIBLE part of an item — an operator by aria-label or a page
 *           number by its text; the row clips overflow (overflow-x: clip) so a clipped item is clicked where it is
 *           still painted. Asserts some part of it is visible. scrollBehavior:false (measure, don't scroll).
 */
export const clickPaginationItem = (name, label) =>
  getItem(name, label).then(($li) => {
    const c = visibleCentre($li);
    expect(c.visibleWidth, `${name}: "${label}" has a visible part to click`).to.be.gt(2);
    cy.wrap($li).realClick({ x: Math.round(c.x), y: Math.round(c.y), scrollBehavior: false });
  });

/**
 * @tjBlock  userflow
 * @tjUsage  paginationHitAt('pg', paginationText.operators.first).then((h) => expect(h.onLink).to.be.false)
 * @tjDom    document.elementFromPoint at the centre of the visible part of an item (or at `{ clientX, clientY }`
 *           when given) — the real pointer hit-target, honouring pointer-events. Returns a plain object:
 *           { onItem (hit inside that <li>), onLink (hit inside its inner <a>/<span>), inWidget (hit inside the
 *           widget box), tag, cursor (computed cursor of the hit element), visibleWidth }.
 */
export const paginationHitAt = (name, label, point) =>
  cy.get(paginationSelector.draggableWidget(name)).first().then(($box) => {
    const resolve = point
      ? cy.wrap({ clientX: point.clientX, clientY: point.clientY, visibleWidth: null, li: null })
      : getItem(name, label).then(($li) => ({ ...visibleCentre($li), li: $li[0] }));
    return resolve.then((c) => {
      const doc = $box[0].ownerDocument;
      const hit = doc.elementFromPoint(c.clientX, c.clientY);
      return {
        onItem: !!(c.li && hit && c.li.contains(hit)),
        onLink: !!(c.li && hit && c.li.firstElementChild && c.li.firstElementChild.contains(hit)),
        inWidget: !!(hit && $box[0].contains(hit)),
        tag: hit ? hit.tagName : null,
        cursor: hit ? doc.defaultView.getComputedStyle(hit).cursor : null,
        visibleWidth: c.visibleWidth,
      };
    });
  });

/**
 * @tjBlock  userflow
 * @tjUsage  currentPageText('cur', 'pg', { top: 200 })
 * @tjDom    a Text widget rendering `page:<components.<pg>.currentPageIndex>`
 */
export const currentPageText = (name, paginationName, layout = {}) => ({
  type: "Text",
  name,
  layout: { top: 200, left: 2, width: 8, height: 40, ...layout },
  properties: { text: { value: `{{"page:" + components.${paginationName}.currentPageIndex}}` } },
});

/**
 * @tjBlock  userflow
 * @tjUsage  expectCurrentPage('cur', 'pg', 3)
 * @tjDom    the Text from currentPageText reads `page:<n>` AND the highlighted (li.active) page of the row is <n>
 *           (or no page is highlighted when <n> is outside the rendered window)
 */
export const expectCurrentPage = (textName, paginationName, n) => {
  cy.get(paginationSelector.draggableWidget(textName)).should(($el) =>
    expect($el.text().trim(), `${paginationName}.currentPageIndex`).to.eq(`page:${n}`)
  );
  paginationBoxes(paginationName, (b) => {
    const active = b.items.filter((i) => i.active).map((i) => i.label);
    if (b.items.some((i) => i.kind === "page" && i.label === String(n))) {
      expect(active, `${paginationName}: highlighted page`).to.deep.eq([String(n)]);
    }
  });
};

/**
 * @tjBlock  userflow
 * @tjUsage  moveMouseAway()
 * @tjDom    real pointer to the top-left corner of <body> (the real mouse position persists between tests)
 */
export const moveMouseAway = () => cy.get("body").realHover({ position: "topLeft", scrollBehavior: false });
