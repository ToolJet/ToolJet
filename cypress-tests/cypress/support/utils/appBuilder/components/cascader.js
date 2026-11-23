/**
 * MODULE — appBuilder/components/cascader: browser-only helpers for the Cascader widget.
 * FOR AI: addCascadersViaApi seeds fully-configured Cascaders (cascader.js definition defaults merged with per-item
 * overrides) plus helper widgets and their events in one components POST; cascaderOption builds static option-tree
 * nodes; openCascaderMenu / pickCascaderPath drive the portalled Radix drilldown menu (one level at a time, rows are
 * `cascader-option-<value>`); cascaderState / readCascaderState read the real geometry + focus + per-row highlight of
 * the control and the open menu as a plain object; hitTest asks the browser which element a real pointer lands on.
 * Only one Cascader menu is open at a time.
 */
import { cascaderSelector as S } from "Selectors/appBuilder/components/cascader";
import { cascaderText } from "Texts/appBuilder/components/cascader";
import { addDropdownsViaApi } from "Support/utils/appBuilder/components/dropdownV2";

const T = cascaderText;

/**
 * @tjBlock  contexts
 * @tjUsage  cascaderOption('Asia', 'asia', [cascaderOption('Japan', 'japan')])  ·  cascaderOption('Mars', 'mars', null, { disabled: true })
 * @tjDom    static option node (cascader.js:434-479 shape): { label, value, visible: { value }, disable: { value }, children? }
 */
export const cascaderOption = (label, value, children = null, { disabled = false, visible = true } = {}) => ({
  label,
  value,
  visible: { value: visible },
  disable: { value: disabled },
  ...(children ? { children } : {}),
});

/**
 * @tjBlock  contexts
 * @tjUsage  schemaOption('Asia', 'asia', [schemaOption('Japan', 'japan', null, { isDefault: true })])  ·  schemaOption('Mars', 'mars', null, { disabled: true })
 * @tjDom    Dynamic-options schema node (cascader.js:422-425 `data` shape; utils.ts normalizeTree / findDefaultValue read
 *           raw `disable` / `visible` / `default`): { label, value, disable?, default?, children? }
 */
export const schemaOption = (label, value, children = null, { disabled = false, isDefault = false } = {}) => ({
  label,
  value,
  ...(disabled ? { disable: true } : {}),
  ...(isDefault ? { default: true } : {}),
  ...(children ? { children } : {}),
});

/**
 * @tjBlock  contexts
 * @tjUsage  addCascadersViaApi([{ name: 'cs', properties: { ...dynamicOptions([schemaOption('A', 'a')]) } }])
 * @tjDom    properties for Dynamic options: advanced {{true}} (cascader.js:421) + data `{{<JSON tree>}}` (cascader.js:422).
 *           The tree travels as one string, so the saved shape is exactly what was posted
 */
export const dynamicOptions = (tree) => ({
  advanced: { value: "{{true}}" },
  data: { value: `{{${JSON.stringify(tree)}}}` },
});

/**
 * @tjBlock  contexts
 * @tjUsage  addCascadersViaApi([{ name: 'cs', layout: { top: 40, left: 2, width: 12, height: 40 }, properties: { options: { value: [cascaderOption('A', 'a')] } }, events: [counterEvent('onSelect', 'selects')] }, { type: 'TextInput', name: 'ti' }])
 * @tjDom    delegates to addDropdownsViaApi (GET app → POST components diff → POST events; supports `id`, `parent`,
 *           `validation`, `mobileLayout`, control-component `componentName`). Items without a `type` become Cascader
 *           with the cascader.js:406-505 definition properties/styles/others merged under the item's own; other types
 *           pass through unchanged. Sets Cypress.env('editingVersionId').
 */
export const addCascadersViaApi = (items, appId) => {
  const D = T.definition;
  return addDropdownsViaApi(
    items.map((item) =>
      item.type && item.type !== T.componentType
        ? item
        : {
            ...item,
            type: T.componentType,
            layout: { top: 40, left: 2, width: 12, height: 40, ...item.layout },
            properties: { ...D.properties, ...item.properties },
            styles: { ...D.styles, ...item.styles },
            others: { ...D.others, ...item.others },
          }
    ),
    appId
  );
};

/**
 * @tjBlock  canvas
 * @tjUsage  openCascaderMenu('cs')
 * @tjDom    clicks the combobox (Cascader.tsx:336 onClick → toggleOpen) → Radix popover content visible
 */
export const openCascaderMenu = (name) => {
  cy.get(S.popover).should("not.exist");
  cy.get(S.control(name)).click({ scrollBehavior: "center" });
  cy.get(S.popover).should("be.visible");
  cy.get(S.control(name)).should("have.attr", "aria-expanded", "true");
};

/**
 * @tjBlock  canvas
 * @tjUsage  pickCascaderPath(['asia', 'china', 'beijing'])
 * @tjDom    clicks each `cascader-option-<value>` row of the open menu in turn (parents drill down, the leaf selects
 *           and closes the menu — CascaderMenu.tsx:84-88 activateRow)
 */
export const pickCascaderPath = (values) => {
  values.forEach((v) => cy.get(S.option(v)).click());
  cy.get(S.popover).should("not.exist");
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectCascaderDisplay('cs', 'Asia / Japan')
 * @tjDom    text of the control's `.cascader-display` span (selected pathString or placeholder)
 */
export const expectCascaderDisplay = (name, text) =>
  cy.get(S.display(name)).should(($el) => expect($el.text(), `${name} shown text`).to.eq(text));

const rect = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const measure = (doc, name) => {
  const win = doc.defaultView;
  const cs = (el, prop) => (el ? win.getComputedStyle(el).getPropertyValue(prop) : null);
  const control = doc.querySelector(S.control(name));
  const display = doc.querySelector(S.display(name));
  const popover = doc.querySelector(S.popover);
  const list = doc.querySelector(S.menuList);
  const header = doc.querySelector(S.menuBack);
  // Radix wraps Popover.Content in a positioned wrapper ([data-radix-popper-content-wrapper]) that carries z-index
  const popperWrapper = popover ? popover.closest("[data-radix-popper-content-wrapper]") : null;
  const options = list
    ? [...list.querySelectorAll('[data-cy^="cascader-option-"]')].map((row, index) => ({
        index,
        value: row.getAttribute("data-cy").replace("cascader-option-", ""),
        text: row.textContent.trim(),
        ...rect(row),
        // CascaderMenu.tsx:216-220 — the highlighted row carries the hover-overlay token inline
        highlighted: row.style.backgroundColor === T.highlightToken,
        backgroundColor: cs(row, "background-color"),
        disabled: cs(row, "cursor") === "not-allowed",
        // CascaderMenu.tsx:226-234 — gutter span + label span, plus a chevron only on parent rows
        isParent: row.children.length > 2,
      }))
    : [];
  return {
    control: control
      ? {
          ...rect(control),
          id: control.id,
          focused: doc.activeElement === control,
          ariaExpanded: control.getAttribute("aria-expanded"),
          tabIndex: control.tabIndex,
        }
      : null,
    display: display ? display.textContent : null,
    activeWidget: (() => {
      const el = doc.activeElement;
      const w = el && el.closest('[data-cy^="draggable-widget-"]');
      return w ? w.getAttribute("data-cy").replace("draggable-widget-", "") : null;
    })(),
    menu: popover
      ? {
          ...rect(popover),
          inWidgetTree: !!popover.closest('[data-cy^="draggable-widget-"]'),
          zIndex: cs(popperWrapper || popover, "z-index"),
          contentZIndex: cs(popover, "z-index"),
          header: header ? header.textContent.trim() : null,
          list: list
            ? {
                ...rect(list),
                overflowY: cs(list, "overflow-y"),
                scrollTop: list.scrollTop,
                scrollHeight: list.scrollHeight,
                clientHeight: list.clientHeight,
              }
            : null,
          options,
        }
      : null,
    viewport: { width: win.innerWidth, height: win.innerHeight },
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  cascaderState('cs', (s) => expect(s.menu.list.scrollHeight).to.be.gt(s.menu.list.clientHeight))
 * @tjDom    retries the callback with a plain object: `control` (combobox rect, id, focused, aria-expanded, tabIndex),
 *           `display` (shown text), `activeWidget` (runtime name of the widget holding document.activeElement),
 *           `menu` (popover rect, whether it is rendered inside a widget box, z-index of the Radix popper wrapper and
 *           of the content, breadcrumb header text, option-list rect/overflow-y/scroll sizes, and the rows of the
 *           current level: value/text/rect/highlighted/computed background/disabled/isParent) and `viewport` size
 */
export const cascaderState = (name, assertFn) => cy.document().should((doc) => assertFn(measure(doc, name)));

/**
 * @tjBlock  canvas
 * @tjUsage  readCascaderState('cs').then((s) => …)
 * @tjDom    one-shot read (no retry) of the plain object cascaderState passes to its callback
 */
export const readCascaderState = (name) => cy.document().then((doc) => measure(doc, name));

/**
 * @tjBlock  canvas
 * @tjUsage  hitTest(120, 300).then((h) => expect(h.option).to.eq('asia'))
 * @tjDom    document.elementFromPoint(x, y) — the element a real pointer lands on — as a plain object:
 *           { inMenu, option (`cascader-option-<value>` suffix or null), widget (runtime name of the enclosing
 *           draggable widget or null) }
 */
export const hitTest = (x, y) =>
  cy.document().then((doc) => {
    const el = doc.elementFromPoint(x, y);
    const row = el && el.closest('[data-cy^="cascader-option-"]');
    const widget = el && el.closest('[data-cy^="draggable-widget-"]');
    return {
      inMenu: !!(el && el.closest(S.popover)),
      option: row ? row.getAttribute("data-cy").replace("cascader-option-", "") : null,
      widget: widget ? widget.getAttribute("data-cy").replace("draggable-widget-", "") : null,
    };
  });
