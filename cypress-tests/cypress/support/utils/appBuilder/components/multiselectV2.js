/**
 * MODULE — appBuilder/components/multiselectV2: browser-only helpers for the Multi Select (MultiselectV2) widget.
 * FOR AI: addMultiselectsViaApi seeds fully-configured Multi Selects (definition defaults merged) plus helper widgets
 * (Modal, Text counters…) through the shared components POST of addDropdownsViaApi; openMultiselectMenu /
 * closeMultiselectMenu / clickMultiselectOption drive the widget's OWN portalled menu (scoped by component id — two
 * menus can be open at once); multiselectState reads the real geometry + computed styles of the field, the
 * selected-labels summary, the open menu (virtualized rows, sticky select-all, scroll state) and where keyboard
 * focus is, as a plain object.
 * The Select has no classNamePrefix and the field no data-cy (MultiselectV2.jsx:567-647), so parts are reached
 * structurally — see Selectors/appBuilder/components/multiselectV2.
 * NOT here: legacy Multiselect (v1) helpers → components/multiSelect.js; shared DropdownV2 plumbing → dropdownV2.js.
 */
import { multiselectV2Selector as S } from "Selectors/appBuilder/components/multiselectV2";
import { multiselectV2Text as T } from "Texts/appBuilder/components/multiselectV2";
import { addDropdownsViaApi, visitDropdownApp } from "Support/utils/appBuilder/components/dropdownV2";

/**
 * @tjBlock  contexts
 * @tjUsage  addMultiselectsViaApi([{ name: 'ms', layout: { top: 40, left: 2, width: 12, height: 40 }, properties: { options: multiselectOptions(['a', 'b']) } }])
 * @tjDom    delegates to addDropdownsViaApi (GET app → POST components diff → POST events; supports `id`, `parent`,
 *           `mobileLayout`, `events`). Items without a `type` become MultiselectV2 with the multiselectV2.js:413-496
 *           definition properties/styles/others/validation merged under the item's own; other types pass through.
 */
export const addMultiselectsViaApi = (items, appId) => {
  const D = T.definition;
  return addDropdownsViaApi(
    items.map((item) =>
      item.type && item.type !== T.componentType
        ? item
        : {
            ...item,
            type: T.componentType,
            properties: { ...D.properties, ...item.properties },
            styles: { ...D.styles, ...item.styles },
            others: { ...D.others, ...item.others },
            validation: { ...D.validation, ...item.validation },
          }
    ),
    appId
  );
};

/**
 * @tjBlock  contexts
 * @tjUsage  multiselectOptions(['alpha', 'beta', 'gamma'], { disabled: ['beta'] })
 * @tjDom    builds a static properties.options value (multiselectV2.js:444-471 shape) — value = label. The selection
 *           on mount comes from properties.values (multiselectValues), not from the per-option default flag
 */
export const multiselectOptions = (labels, { disabled = [] } = {}) => ({
  value: labels.map((label) => ({
    label,
    value: label,
    caption: null,
    disable: { value: disabled.includes(label) },
    visible: { value: true },
    default: { value: false },
  })),
});

/**
 * @tjBlock  contexts
 * @tjUsage  multiselectValues(['alpha'])  ·  multiselectValues([])
 * @tjDom    properties.values (multiselectV2.js:424) — the selection on mount, matched by strict equality
 */
export const multiselectValues = (values) => ({ value: values });

/**
 * @tjBlock  contexts
 * @tjUsage  modalItem({ id: MODAL_ID, name: 'mdl' })  then children with parent: MODAL_ID
 * @tjDom    a ModalV2 item (modalV2.js:396-441 definition properties) whose default trigger is
 *           `[data-cy="<name>-launch-button"]`; children go into its body with `parent: <id>`
 */
export const modalItem = ({ id, name, layout }) => ({
  id,
  name,
  type: T.modal.componentType,
  layout: { top: 40, left: 2, width: 10, height: 40, ...layout },
  properties: T.modal.properties,
  others: T.modal.others,
});

/**
 * @tjBlock  contexts
 * @tjUsage  visitMultiselectApp(multiselectV2Selector.field('ms'), { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL), optional user agent, waits
 */
export const visitMultiselectApp = (waitForSelector, opts) => visitDropdownApp(waitForSelector, opts);

/**
 * @tjBlock  canvas
 * @tjUsage  multiselectComponentId('ms').then((id) => cy.get(multiselectV2Selector.menu(id)))
 * @tjDom    the react-select container id `component-<id>` (MultiselectV2.jsx:596) → the component id
 */
export const multiselectComponentId = (name) =>
  cy
    .get(S.container(name))
    .first()
    .invoke("attr", "id")
    .then((id) => id.replace(/^component-/, ""));

/**
 * @tjBlock  canvas
 * @tjUsage  openMultiselectMenu('ms')
 * @tjDom    clicks the field (MultiselectV2.jsx:569 handleClickInsideSelect) → the widget's own menu visible
 */
export const openMultiselectMenu = (name) =>
  multiselectComponentId(name).then((id) => {
    cy.get(S.menu(id)).should("not.exist");
    cy.get(S.field(name)).click({ scrollBehavior: "center" });
    cy.get(S.menu(id)).should("be.visible");
  });

/**
 * @tjBlock  canvas
 * @tjUsage  closeMultiselectMenu('ms')
 * @tjDom    clicks the field again (toggle) → the widget's own menu removed
 */
export const closeMultiselectMenu = (name) =>
  multiselectComponentId(name).then((id) => {
    cy.get(S.field(name)).click({ scrollBehavior: "center" });
    cy.get(S.menu(id)).should("not.exist");
  });

/**
 * @tjBlock  canvas
 * @tjUsage  clickMultiselectOption('ms', 'beta')
 * @tjDom    clicks the row of the widget's own open menu whose label equals `label` (toggles it; the menu stays open)
 */
export const clickMultiselectOption = (name, label) =>
  multiselectComponentId(name).then((id) => {
    cy.get(`${S.menu(id)} ${S.option}`)
      .filter((_, el) => el.querySelector("span.tw-truncate")?.textContent.trim() === label)
      .should("have.length", 1)
      .click();
    cy.get(S.menu(id)).should("be.visible");
  });

const rect = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const MENU_PREFIX = "dropdown-multiselect-widget-custom-menu-list-";
const widgetNameOf = (el) =>
  el?.closest('[data-cy^="draggable-widget-"]')?.getAttribute("data-cy").replace("draggable-widget-", "") || null;
// the widget that owns a portalled menu: menu id suffix = component id = react-select container `component-<id>`
const menuOwner = (doc, menu) => (menu ? widgetNameOf(doc.getElementById(`component-${menu.id.slice(MENU_PREFIX.length)}`)) : null);

const measureMultiselect = (doc, name) => {
  const win = doc.defaultView;
  const cs = (el, prop) => (el ? win.getComputedStyle(el).getPropertyValue(prop) : null);
  const box = doc.querySelector(S.draggableWidget(name));
  const container = box ? box.querySelector('[id^="component-"]') : null;
  const id = container ? container.id.replace(/^component-/, "") : null;
  const control = container ? container.querySelector(":scope > div") : null;
  const valueContainer = control ? control.firstElementChild : null;
  const summary = container ? container.querySelector("span#options") : null;
  const placeholder = valueContainer && !summary ? valueContainer.querySelector("span.d-flex > div") : null;
  const indicators = control ? control.lastElementChild : null;
  const field = box ? box.querySelector(".multiselect-widget > div.px-0") : null;
  const list = id ? doc.getElementById(`${MENU_PREFIX}${id}`) : null;
  const body = list ? list.querySelector(S.menuBody) : null;
  const search = list ? list.querySelector(S.menuSearch) : null;
  const active = doc.activeElement;
  const options = list
    ? [...list.querySelectorAll(S.option)].map((o) => {
        const check = o.querySelector(S.optionCheck);
        const label = o.querySelector("span.tw-truncate");
        const r = o.getBoundingClientRect();
        const hit = doc.elementFromPoint(r.left + Math.min(20, r.width / 2), r.top + r.height / 2);
        return {
          index: Number(o.id.split("-option-")[1]),
          text: (label || o).textContent.trim(),
          ...rect(o),
          backgroundColor: cs(o, "background-color"),
          opacity: cs(o, "opacity"),
          checked: check ? check.checked : null,
          disabled: check ? check.disabled : null,
          // nothing (a modal, the sticky row, another layer) covers the row at its own position
          onTop: !!hit && o.contains(hit),
        };
      })
    : [];
  return {
    id,
    box: rect(box),
    field: rect(field),
    control: control
      ? {
          ...rect(control),
          backgroundColor: cs(control, "background-color"),
          borderColor: cs(control, "border-top-color"),
          borderRadius: cs(control, "border-top-left-radius"),
          boxShadow: cs(control, "box-shadow"),
        }
      : null,
    // CustomValueContainer.jsx:62-72 — the selected-labels summary (or the placeholder when nothing is selected)
    summary: summary
      ? {
          ...rect(summary),
          text: summary.textContent,
          scrollWidth: summary.scrollWidth,
          clientWidth: summary.clientWidth,
          maxWidth: parseFloat(summary.style.maxWidth),
          textOverflow: cs(summary, "text-overflow"),
          color: cs(summary, "color"),
          // the observed span the max-width is measured from (CustomValueContainer.jsx:21-22,46)
          containerWidth: summary.parentElement.offsetWidth,
        }
      : null,
    placeholder: placeholder ? { text: placeholder.textContent.trim(), color: cs(placeholder, "color") } : null,
    indicators: rect(indicators),
    loader: !!(box && box.querySelector(".tj-widget-loader")),
    ariaInvalid: box ? box.querySelector('input[role="combobox"]')?.getAttribute("aria-invalid") : null,
    menu: list
      ? {
          ...rect(list),
          backgroundColor: body ? cs(body, "background-color") : null,
          search: search ? { ...rect(search), value: search.value } : null,
          body: body
            ? { ...rect(body), scrollTop: body.scrollTop, scrollHeight: body.scrollHeight, clientHeight: body.clientHeight }
            : null,
          options,
        }
      : null,
    // where real keyboard focus is: which widget's menu / which widget box, and what kind of element
    focus: {
      menuOf: menuOwner(doc, active ? active.closest(S.anyMenu) : null),
      widget: widgetNameOf(active),
      isSearch: !!(active && active.matches(S.menuSearch)),
      isCombobox: !!(active && active.matches('input[role="combobox"]')),
    },
    // every Multi Select / Dropdown menu currently open, by owning widget name (document order)
    openMenus: [...doc.querySelectorAll(S.anyMenu)].map((m) => menuOwner(doc, m)),
    viewport: { innerWidth: win.innerWidth, innerHeight: win.innerHeight },
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  multiselectState('ms', (s) => expect(s.summary.right).to.be.lte(s.indicators.left))
 * @tjDom    retries the callback with a plain object: `id`, `box`/`field` rects, `control` (rect + background,
 *           border colour, radius, box-shadow), `summary` (#options rect/text/scroll+client width/max-width/
 *           text-overflow/colour/observed container width) or `placeholder`, `indicators` rect, `loader`,
 *           `ariaInvalid`, `menu` (the widget's own menu: rect, background, search rect/value, scroller
 *           rect/scrollTop/scrollHeight/clientHeight, rendered rows index/text/rect/background/opacity/checked/
 *           disabled/onTop — the row is the element hit at its own position), `focus` (menuOf, widget, isSearch, isCombobox), `openMenus` (owner names) and `viewport`
 */
export const multiselectState = (name, assertFn) => cy.document().should((doc) => assertFn(measureMultiselect(doc, name)));

/**
 * @tjBlock  canvas
 * @tjUsage  getMultiselectState('ms').then((s) => …)
 * @tjDom    one-shot read (no retry) of the plain object multiselectState passes to its callback
 */
export const getMultiselectState = (name) => cy.document().then((doc) => measureMultiselect(doc, name));

/**
 * @tjBlock  canvas
 * @tjUsage  scrollMultiselectMenuTo('ms', 'bottom')  ·  scrollMultiselectMenuTo('ms', 200)
 * @tjDom    scrolls the widget's own menu scroller (a real scroll event the virtualizer reads)
 */
export const scrollMultiselectMenuTo = (name, position) =>
  multiselectComponentId(name).then((id) => {
    const scroller = cy.get(`${S.menu(id)} ${S.menuBody}`);
    if (typeof position === "number") scroller.scrollTo(0, position, { ensureScrollable: false });
    else scroller.scrollTo(position, { ensureScrollable: false });
  });

/**
 * @tjBlock  canvas
 * @tjUsage  openMultiselectMenu('ms'); waitForMenuScrollSettled('ms'); scrollMultiselectMenuTo('ms', 'top')
 * @tjDom    re-reads the widget's menu scroller scrollTop every 300ms until two reads agree. The open-time
 *           scroll-to-selected (CustomMenuList.jsx:56-67, virtualizer.scrollToIndex) keeps re-aligning for a few
 *           frames while rows are measured; a scroll issued inside that window (<~100ms) is pulled back to the selection
 */
export const waitForMenuScrollSettled = (name, triesLeft = 20) =>
  getMultiselectState(name).then((a) => {
    cy.wait(300); // dynamic: settle interval
    getMultiselectState(name).then((b) => {
      if (!a.menu || !b.menu || a.menu.body.scrollTop !== b.menu.body.scrollTop) {
        expect(triesLeft, `${name} menu scroll settles`).to.be.gt(0);
        waitForMenuScrollSettled(name, triesLeft - 1);
      }
    });
  });
