/**
 * MODULE — appBuilder/components/popoverMenu: browser-only helpers for the Popover Menu widget.
 * FOR AI: addPopoverMenusViaApi seeds fully-configured Popover Menus (popoverMenu.js definition defaults merged with
 * per-item overrides) plus helper widgets and their events in one components POST; popoverMenuOptions builds a static
 * options value; openPopoverMenu / closePopoverMenu drive the portalled Radix menu (finishing its scale-in animation
 * so rects are final); popoverMenuState / readPopoverMenuState read the real computed paint of the trigger (colours,
 * border, box-shadow, focus outline, loader paint incl. the SVG gradient the browser actually resolves), the nearest
 * clipping ancestor, and the widget's own open menu (rect, Radix side/align, surface, option list scroll metrics,
 * rows) as a plain object; tabToPopoverMenu sends real Tab presses until the trigger has focus; get/setWorkspaceCss
 * read and write the workspace custom CSS (Workspace settings → Custom styles).
 * Only one Popover Menu is open at a time; a widget's menu is found through its trigger's aria-controls.
 */
import { popoverMenuSelector as S } from "Selectors/appBuilder/components/popoverMenu";
import { popoverMenuText as T } from "Texts/appBuilder/components/popoverMenu";
import { addDropdownsViaApi, visitDropdownApp } from "Support/utils/appBuilder/components/dropdownV2";

/**
 * @tjBlock  contexts
 * @tjUsage  addPopoverMenusViaApi([{ name: 'pm', layout: { top: 40, left: 2, width: 6, height: 40 }, properties: { buttonType: { value: 'outline' } }, events: [counterEvent('onSelect', 'selects')] }, { type: 'Text', name: 'probe', properties: { text: { value: '{{components.pm.isLoading}}' } } }])
 * @tjDom    delegates to addDropdownsViaApi (GET app → POST components diff → POST events; supports `id`, `parent`,
 *           `mobileLayout`, control-component `componentName`). Items without a `type` become PopoverMenu with the
 *           popoverMenu.js:314-391 definition properties/styles/others merged under the item's own; other types pass
 *           through unchanged. Sets Cypress.env('editingVersionId').
 */
export const addPopoverMenusViaApi = (items, appId) => {
  const D = T.definition;
  return addDropdownsViaApi(
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
 * @tjUsage  popoverMenuOptions(Array.from({ length: 20 }, (_, i) => `Item ${i}`))
 * @tjDom    static properties.options value (popoverMenu.js:328-361 shape); value = row index as a string
 */
export const popoverMenuOptions = (labels) => ({ value: labels.map((label, i) => T.option(label, String(i))) });

/**
 * @tjBlock  contexts
 * @tjUsage  openPopoverMenuInViewer(popoverMenuSelector.trigger('pm'))
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for the selector
 */
export const openPopoverMenuInViewer = (waitForSelector, opts) => visitDropdownApp(waitForSelector, opts);

// finishes the menu's 0.15s popoverScaleIn keyframes (popoverMenu.scss:16) so rects are final
const finishMenuAnimation = () =>
  cy.get(S.content).should(($c) => {
    $c[0].getAnimations({ subtree: true }).forEach((a) => a.finish());
    expect($c[0].getAnimations({ subtree: true }).filter((a) => a.playState === "running"), "menu animation").to.have.length(0);
  });

/**
 * @tjBlock  canvas
 * @tjUsage  openPopoverMenu('pm')  ·  openPopoverMenu('pm', { real: true })
 * @tjDom    clicks the trigger <button> (CustomButton.jsx:166-178 onClick toggles the popover) — a real CDP click with
 *           `real` — then waits for the widget's own Popover.Content (id = trigger aria-controls) and aria-expanded
 */
export const openPopoverMenu = (name, { real = false } = {}) => {
  cy.get(S.content).should("not.exist");
  if (real) cy.get(S.trigger(name)).realClick({ scrollBehavior: false });
  else cy.get(S.trigger(name)).click({ scrollBehavior: false });
  cy.get(S.trigger(name)).should("have.attr", "aria-expanded", "true");
  cy.get(S.trigger(name))
    .invoke("attr", "aria-controls")
    .then((id) => cy.get(S.contentById(id)).should("be.visible"));
  finishMenuAnimation();
};

/**
 * @tjBlock  canvas
 * @tjUsage  closePopoverMenu('pm')
 * @tjDom    Escape (PopoverMenu.jsx:225 onEscapeKeyDown) → the portal unmounts, aria-expanded false
 */
export const closePopoverMenu = (name) => {
  cy.realPress("Escape");
  cy.get(S.content).should("not.exist");
  cy.get(S.trigger(name)).should("have.attr", "aria-expanded", "false");
};

const rect = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const nearestClip = (el, win) => {
  let c = el ? el.parentElement : null;
  while (c && win.getComputedStyle(c).overflowX === "visible" && win.getComputedStyle(c).overflowY === "visible")
    c = c.parentElement;
  return c;
};

// what each loader path actually paints: a plain stroke colour, or — for url(#id) — the gradient the browser resolves
// (the FIRST element with that id in the document) with the owning widget and its computed stop colours
const loaderPaint = (svg, doc, win) =>
  [...svg.querySelectorAll("path")].map((p) => {
    const stroke = win.getComputedStyle(p).stroke;
    const ref = (stroke.match(/url\("?#([^")]+)"?\)/) || [])[1];
    if (!ref) return { stroke, colors: [stroke], owner: null };
    const g = doc.getElementById(ref);
    const owner = g && g.closest('[data-cy^="draggable-widget-"]');
    return {
      stroke,
      ref,
      owner: owner ? owner.getAttribute("data-cy").replace("draggable-widget-", "") : null,
      colors: g ? [...g.querySelectorAll("stop")].map((s) => win.getComputedStyle(s).stopColor) : [],
    };
  });

const measure = (doc, name) => {
  const win = doc.defaultView;
  const cs = (el, prop) => (el ? win.getComputedStyle(el).getPropertyValue(prop) : null);
  const box = doc.querySelector(S.draggableWidget(name));
  const btn = doc.querySelector(S.trigger(name));
  const label = doc.querySelector(S.triggerLabel(name));
  const svg = doc.querySelector(S.loader(name));
  const contentId = btn ? btn.getAttribute("aria-controls") : null;
  const content = contentId ? doc.getElementById(contentId) : null;
  const list = content ? content.querySelector('[data-cy="popover-menu-options-listbox"]') : null;
  const clip = nearestClip(btn, win);
  const canvas = doc.querySelector("#real-canvas");
  return {
    box: rect(box),
    canvas: rect(canvas),
    trigger: btn
      ? {
          ...rect(btn),
          backgroundColor: cs(btn, "background-color"),
          color: cs(btn, "color"),
          borderColor: cs(btn, "border-top-color"),
          borderStyle: cs(btn, "border-top-style"),
          borderWidth: cs(btn, "border-top-width"),
          boxShadow: cs(btn, "box-shadow"),
          labelColor: cs(label, "color"),
          outlineStyle: cs(btn, "outline-style"),
          outlineWidth: cs(btn, "outline-width"),
          outlineColor: cs(btn, "outline-color"),
          outlineOffset: cs(btn, "outline-offset"),
          focused: doc.activeElement === btn,
          focusVisible: btn.matches(":focus-visible"),
          ariaExpanded: btn.getAttribute("aria-expanded"),
          disabled: btn.disabled,
          clip: clip ? { ...rect(clip), className: String(clip.className) } : null,
        }
      : null,
    loader: svg
      ? { colorAttr: svg.getAttribute("color"), color: cs(svg, "color"), paints: loaderPaint(svg, doc, win) }
      : null,
    menu: content
      ? {
          ...rect(content),
          side: content.getAttribute("data-side"),
          align: content.getAttribute("data-align"),
          className: String(content.className),
          inWidgetTree: !!content.closest('[data-cy^="draggable-widget-"]'),
          backgroundColor: cs(content, "background-color"),
          list: list
            ? {
                ...rect(list),
                maxHeight: cs(list, "max-height"),
                overflowY: cs(list, "overflow-y"),
                scrollTop: list.scrollTop,
                scrollHeight: list.scrollHeight,
                clientHeight: list.clientHeight,
              }
            : null,
          options: [...content.querySelectorAll('[role="option"]')].map((o) => ({
            index: Number(o.getAttribute("data-cy").replace("popover-menu-option-", "")),
            text: o.textContent.trim(),
            selected: o.getAttribute("aria-selected") === "true",
            backgroundColor: cs(o, "background-color"),
            labelColor: cs(o.querySelector('[data-cy="popover-menu-option-label"]'), "color"),
            descriptionColor: cs(o.querySelector('[data-cy="popover-menu-option-description"]'), "color"),
            ...rect(o),
          })),
        }
      : null,
    portals: doc.querySelectorAll(S.portal).length,
    viewport: { width: win.innerWidth, height: win.innerHeight },
  };
};

/**
 * @tjBlock  styles
 * @tjUsage  popoverMenuState('pm', (s) => expect(s.trigger.backgroundColor).to.eq('rgb(255, 0, 0)'))
 * @tjDom    retries the callback with a plain object: `box` / `canvas` (#real-canvas) rects; `trigger` (button rect,
 *           computed background/text/border/box-shadow, label colour, outline style/width/colour/offset, focused,
 *           :focus-visible, aria-expanded, disabled, nearest overflow-clipping ancestor rect); `loader` (svg colour
 *           attribute + computed colour, and per path what it paints — for url(#id) strokes the gradient the browser
 *           resolves, its owning widget and stop colours); `menu` (this widget's open Popover.Content rect, Radix
 *           data-side/data-align, class, whether it renders inside a widget box, surface colour, option-list
 *           rect/max-height/overflow/scroll sizes, rows with index/text/selected/colours/rect); `portals` (number of
 *           popover-menu portal containers in the page); `viewport` size
 */
export const popoverMenuState = (name, assertFn) => cy.document().should((doc) => assertFn(measure(doc, name)));

/**
 * @tjBlock  styles
 * @tjUsage  readPopoverMenuState('pm').then((s) => …)
 * @tjDom    one-shot read (no retry) of the plain object popoverMenuState passes to its callback
 */
export const readPopoverMenuState = (name) => cy.document().then((doc) => measure(doc, name));

/**
 * @tjBlock  userflow
 * @tjUsage  tabToPopoverMenu('pm')
 * @tjDom    real Tab presses (CDP) from the current focus until document.activeElement is the widget's trigger
 *           <button>; fails after `max` presses
 */
export const tabToPopoverMenu = (name, max = 15) => {
  const step = (left) =>
    cy.document().then((doc) => {
      if (doc.activeElement === doc.querySelector(S.trigger(name))) return;
      expect(left, `Tab reaches ${name}`).to.be.gt(0);
      cy.realPress("Tab");
      step(left - 1);
    });
  step(max);
};

const cssRequest = (method, body) =>
  cy.getCookie("tj_auth_token").then((cookie) =>
    cy.request({
      method,
      url: `${Cypress.env("server_host")}/api/custom-styles`,
      headers: {
        "Content-Type": "application/json",
        "Tj-Workspace-Id": Cypress.env("workspaceId"),
        Cookie: `tj_auth_token=${cookie.value}`,
      },
      ...(body ? { body } : {}),
    })
  );

/**
 * @tjBlock  styles
 * @tjUsage  getWorkspaceCss().then((styles) => …)
 * @tjDom    GET /api/custom-styles → the workspace's saved custom-CSS source (Workspace settings → Custom styles)
 */
export const getWorkspaceCss = () => cssRequest("GET").then((res) => (res.body && res.body.styles) || "");

/**
 * @tjBlock  styles
 * @tjUsage  setWorkspaceCss(`${previous}\n._tooljet-pm .jet-btn { color: red !important; }`)
 * @tjDom    POST /api/custom-styles { styles } — the server scopes it under `.page-container` and the editor / viewer
 *           inject it as <style id="workspace-custom-css"> on app load (useAppData.js fetchAndInjectCustomStyles).
 *           Workspace-wide: scope rules to unique widget classes (`._tooljet-<name>`) and restore afterwards
 */
export const setWorkspaceCss = (styles) =>
  cssRequest("POST", { styles }).then((res) => expect(res.status, "save custom styles").to.be.oneOf([200, 201]));
