/**
 * MODULE — appBuilder/components/treeSelect: browser-only helpers for the Tree Select widget.
 * FOR AI: addTreeSelectsViaApi seeds Tree Selects (treeSelect.js definition defaults merged with per-item overrides)
 * plus helper widgets and their events in one components POST; openTreeAppInViewer opens the running app;
 * treeBoxes / readTreeBoxes read plain-object geometry + computed styles of the grid box, the RenderWidget box, the
 * `.custom-checkbox-tree` root (inline height, overflow, padding, scroll sizes) and every rendered node (title, rect,
 * expanded / leaf, checkbox state); expectHugsTree / expectAuthoredTree are the dynamic-height vs authored-height
 * contracts (TreeSelect.jsx:73,442 + WidgetWrapper.jsx:199-204); toggleNode clicks a node's expand button by exact
 * title; tabTrail walks real Tab / Shift+Tab presses and names every focus stop; focusedNode describes the focused
 * tree control (kind, title, focus ring, rect, the scroller that clips it).
 */
import { treeSelectText } from "Texts/appBuilder/components/treeSelect";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

const T = treeSelectText;
const PX = 1.5; // sub-pixel layout tolerance

/**
 * @tjBlock  contexts
 * @tjUsage  addTreeSelectsViaApi([{ name: 'ts1', layout: { top: 40, left: 2, width: 12, height: 150 }, properties: { dynamicHeight: { value: '{{true}}' } } }, { type: 'Text', name: 'below' }])
 * @tjDom    delegates to addIconsViaApi (GET app → POST components diff → POST events). Items without a `type` become
 *           TreeSelect with the treeSelect.js:319-412 definition properties/styles/others merged under the item's own;
 *           items with another `type` pass through unchanged. Also sets Cypress.env('editingVersionId').
 */
export const addTreeSelectsViaApi = (items, { appId } = {}) => {
  const D = T.definition;
  return addIconsViaApi(
    items.map((item) =>
      item.type && item.type !== T.componentType
        ? item
        : {
            ...item,
            type: T.componentType,
            layout: { top: 40, left: 2, width: T.defaultGridWidth, height: T.defaultHeight, ...item.layout },
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
 * @tjUsage  openTreeAppInViewer(treeSelectSelector.root('ts1'), { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openTreeAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const ownTitle = (li) => {
  const t = li.querySelector(":scope > .rct-text .rct-title");
  return t ? t.textContent.trim() : "";
};

const snapshot = (box) => {
  const win = box.ownerDocument.defaultView;
  const name = box.getAttribute("data-cy").replace("draggable-widget-", "");
  const root = box.querySelector(".custom-checkbox-tree");
  const css = (el, prop) => (el ? win.getComputedStyle(el).getPropertyValue(prop) : null);
  const nodes = root
    ? [...root.querySelectorAll("li.rct-node")].map((li) => {
        const input = li.querySelector(':scope > .rct-text .rct-title input[data-cy="checkbox-input"]');
        const tick = input ? input.nextElementSibling : null; // TreeSelectCheckbox.jsx:82-94 tick icon (opacity 1 = checked)
        return {
          title: ownTitle(li),
          rect: rectOf(li.querySelector(":scope > .rct-text")),
          leaf: li.classList.contains("rct-node-leaf"),
          expanded: li.classList.contains("rct-node-expanded"),
          checked: input ? input.checked : null,
          disabled: input ? input.disabled : null,
          checkbox: rectOf(input),
          painted: tick ? css(tick, "opacity") === "1" : null,
          fill: css(input, "background-color"),
        };
      })
    : [];
  return {
    name,
    wrapper: rectOf(box.parentElement),
    box: rectOf(box),
    boxPadding: {
      top: css(box, "padding-top"),
      right: css(box, "padding-right"),
      bottom: css(box, "padding-bottom"),
      left: css(box, "padding-left"),
    },
    root: rectOf(root),
    rootInlineHeight: root ? root.style.height : null,
    rootDisplay: css(root, "display"),
    rootOverflowY: css(root, "overflow-y"),
    rootPaddingTop: css(root, "padding-top"),
    rootPaddingBottom: css(root, "padding-bottom"),
    scrollHeight: root ? root.scrollHeight : null,
    clientHeight: root ? root.clientHeight : null,
    scrollTop: root ? root.scrollTop : null,
    nodes,
    titles: nodes.map((n) => n.title),
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  treeBoxes('ts1', (b) => expect(b.titles).to.deep.eq(['Asia', 'Africa']))
 * @tjDom    retries the callback with plain objects: wrapper (WidgetWrapper grid box), box (`draggable-widget-<name>`
 *           + its four computed paddings), root (`.custom-checkbox-tree`: rect, inline height, computed display /
 *           overflow-y / padding-top/-bottom, scroll + client height, scrollTop), nodes[] (own title, `.rct-text` row
 *           rect, leaf / expanded, checkbox input checked / disabled / rect, painted = tick icon shown, fill = checkbox
 *           background) and titles[]
 */
export const treeBoxes = (name, assertFn) =>
  cy
    .get(`[data-cy="draggable-widget-${name}"]`, { timeout: 30000 })
    .first()
    .should(($box) => assertFn(snapshot($box[0])));

/**
 * @tjBlock  canvas
 * @tjUsage  readTreeBoxes('ts1').then((b) => …)
 * @tjDom    one treeBoxes snapshot yielded as a plain object (no retry)
 */
export const readTreeBoxes = (name) =>
  cy.get(`[data-cy="draggable-widget-${name}"]`, { timeout: 30000 }).first().then(($box) => snapshot($box[0]));

/**
 * @tjBlock  canvas
 * @tjUsage  treeBoxes('ts1', (b) => expectHugsTree(b, 'expanded'))
 * @tjDom    dynamic-height contract on a treeBoxes() snapshot (running app only — TreeSelect.jsx:73): the root is
 *           height:auto and never scrolls, the last node sits inside it, the RenderWidget box = root + its padding
 *           (`pad`, default BOX_PADDING) and the grid box (height:auto, WidgetWrapper.jsx:199-204) follows the box
 */
export const expectHugsTree = (b, label = "", pad = T.boxPadding) => {
  expect(b.rootDisplay, `${label}: root displayed`).to.not.eq("none");
  expect(b.rootInlineHeight, `${label}: root height auto`).to.eq(T.dynamicRootHeight);
  expect(b.scrollHeight, `${label}: no inner scroll`).to.be.lte(b.clientHeight + 1);
  const last = b.nodes[b.nodes.length - 1];
  expect(last.rect.bottom, `${label}: last node inside the root`).to.be.lte(b.root.bottom + PX);
  expect(b.box.height, `${label}: widget box = root + padding`).to.be.closeTo(b.root.height + 2 * pad, PX);
  expect(b.wrapper.height, `${label}: grid box follows the content`).to.be.closeTo(b.box.height, PX);
};

/**
 * @tjBlock  canvas
 * @tjUsage  treeBoxes('ts1', (b) => expectAuthoredTree(b, 150, 'editor'))
 * @tjDom    authored-height contract (dynamic height off, and the editor even with it on): grid box = authored height,
 *           root = authored - 2·padding at height 100% with overflow-y auto (the nodes scroll inside)
 */
export const expectAuthoredTree = (b, authoredHeight, label = "", pad = T.boxPadding) => {
  expect(b.rootDisplay, `${label}: root displayed`).to.not.eq("none");
  expect(b.rootInlineHeight, `${label}: root height 100%`).to.eq(T.fixedRootHeight);
  expect(b.rootOverflowY, `${label}: root scrolls`).to.eq(T.scrollOverflow);
  expect(b.wrapper.height, `${label}: grid box keeps the authored height`).to.be.closeTo(authoredHeight, PX);
  expect(b.root.height, `${label}: root = authored - padding`).to.be.closeTo(authoredHeight - 2 * pad, PX);
};

/**
 * @tjBlock  userflow
 * @tjUsage  toggleNode('ts1', 'China')
 * @tjDom    clicks the `button.rct-collapse-btn` of the node whose own `.rct-title` text is exactly `title`
 *           (a parent's li also contains its children's titles, so `contains` would hit the wrong node)
 */
export const toggleNode = (name, title) =>
  cy
    .get(`[data-cy="draggable-widget-${name}"] li.rct-node`)
    .filter((_, li) => ownTitle(li) === title)
    .should("have.length", 1)
    .find("> .rct-text > button.rct-collapse-btn")
    .click();

/**
 * @tjBlock  userflow
 * @tjUsage  checkboxOf('ts1', 'Japan').focus()
 * @tjDom    the per-node checkbox input (TreeSelectCheckbox.jsx:45-80) of the node titled exactly `title`
 */
export const checkboxOf = (name, title) =>
  cy
    .get(`[data-cy="draggable-widget-${name}"] li.rct-node`)
    .filter((_, li) => ownTitle(li) === title)
    .should("have.length", 1)
    .find('> .rct-text .rct-title input[data-cy="checkbox-input"]');

const describeActive = (doc) => {
  const el = doc.activeElement;
  const widget = el && el.closest('[data-cy^="draggable-widget-"]');
  const li = el && el.closest("li.rct-node");
  const kind =
    el && el.matches("button.rct-collapse-btn")
      ? "toggle"
      : el && el.matches('input[data-cy="checkbox-input"]')
        ? "check"
        : el
          ? el.tagName.toLowerCase()
          : "none";
  return `${widget ? widget.getAttribute("data-cy").replace("draggable-widget-", "") : "page"}:${kind}${li ? `:${ownTitle(li)}` : ""}`;
};

/**
 * @tjBlock  userflow
 * @tjUsage  tabTrail(4).should('deep.eq', ['ts1:toggle:Asia', 'ts1:check:Asia', …]); tabTrail(2, { reverse: true })
 * @tjDom    presses real Tab (or Shift+Tab) `count` times and yields one `<widget>:<kind>[:<node title>]` string per
 *           stop — kind `toggle` = button.rct-collapse-btn, `check` = the node checkbox, else the tag name
 */
export const tabTrail = (count, { reverse = false } = {}) => {
  const stops = [];
  Cypress._.times(count, () => {
    cy.realPress(reverse ? ["Shift", "Tab"] : "Tab");
    cy.document().then((doc) => stops.push(describeActive(doc)));
  });
  return cy.wrap(stops);
};

/**
 * @tjBlock  userflow
 * @tjUsage  focusedNode().then((f) => expect(f.kind).to.eq('check'))
 * @tjDom    plain object for document.activeElement: id (`<widget>:<kind>:<title>`), kind, focusVisible, boxShadow +
 *           spread (largest box-shadow spread px — the checkbox ring), outline (width + style — the toggle ring),
 *           rect, scroller (rect + scrollTop of the enclosing `.custom-checkbox-tree`)
 */
export const focusedNode = () =>
  cy.document().then((doc) => {
    const win = doc.defaultView;
    const el = doc.activeElement;
    const cs = win.getComputedStyle(el);
    const shadow = cs.boxShadow;
    const spreads =
      shadow === "none"
        ? []
        : shadow.split(/,(?![^(]*\))/).map((layer) => {
            const color = (layer.match(/rgba?\([^)]*\)/) || [""])[0];
            const px = (layer.replace(color, "").match(/-?[\d.]+px/g) || []).map(parseFloat);
            return px[3] || 0;
          });
    const scroller = el.closest(".custom-checkbox-tree");
    const id = describeActive(doc);
    return {
      id,
      kind: id.split(":")[1],
      focusVisible: el.matches(":focus-visible"),
      boxShadow: shadow,
      spread: spreads.length ? Math.max(...spreads) : 0,
      outline: `${cs.outlineWidth} ${cs.outlineStyle}`,
      rect: rectOf(el),
      scroller: scroller ? { ...rectOf(scroller), scrollTop: scroller.scrollTop } : null,
    };
  });

/**
 * @tjBlock  canvas
 * @tjUsage  treeTop('below').then((top) => …)
 * @tjDom    yields the draggable box's viewport top (a number, not a DOM element)
 */
export const treeTop = (name) =>
  cy.get(`[data-cy="draggable-widget-${name}"]`).first().then(($el) => $el[0].getBoundingClientRect().top);
