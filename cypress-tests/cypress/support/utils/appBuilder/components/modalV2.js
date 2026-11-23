/**
 * MODULE — appBuilder/components/modalV2: browser-only helpers for the Modal (ModalV2) widget.
 * FOR AI: addModalsViaApi seeds fully-configured Modals (modalV2.js definition defaults merged) plus children placed
 * in a modal's body / header / footer through `parent` (`<id>`, `<id>-header`, `<id>-footer`) and helper widgets,
 * in one components POST; openModalAppInViewer opens the running app; openModal clicks a trigger and waits for the
 * modal to finish entering; modalBoxes / readModalBoxes read the real layout of an open modal (page container,
 * overlay, dialog + its size class, content, header/body/footer, every slot canvas and the widgets inside each
 * slot); focusedElement / focusTrail describe where real keyboard focus is (widget, open modal, popover menu,
 * dropdown menu) as plain objects.
 * NOT here: legacy modal helpers (launchButton / launchModal / closeModal / addAndVerifyColor) → components/modal.js.
 */
import { commonSelectors } from "Selectors/common";
import { modalV2Selector as S } from "Selectors/appBuilder/components/modalV2";
import { modalV2Text as T } from "Texts/appBuilder/components/modalV2";
import { addDropdownsViaApi, visitDropdownApp } from "Support/utils/appBuilder/components/dropdownV2";
import { grantClipboardAccess } from "Support/utils/appBuilder/canvas";

/**
 * @tjBlock  contexts
 * @tjUsage  addModalsViaApi([{ id: M, name: 'm1', properties: { size: { value: 'fullscreen' } } }, { type: 'Text', name: 'inbody', parent: M, layout: { top: 10, left: 0, width: 43, height: 40 } }, { type: 'Text', name: 'inhead', parent: `${M}-header` }])
 * @tjDom    delegates to addDropdownsViaApi (GET app → POST components diff → POST events; supports `id`, `parent`,
 *           `mobileLayout`, control-component `componentName`). Items without a `type` become ModalV2 with the
 *           modalV2.js:396-443 definition properties/styles/others merged under the item's own (layout defaults to
 *           the 10×40 trigger); other types pass through unchanged. Sets Cypress.env('editingVersionId').
 */
export const addModalsViaApi = (items, appId) => {
  const D = T.definition;
  return addDropdownsViaApi(
    items.map((item) =>
      item.type && item.type !== T.componentType
        ? item
        : {
            ...item,
            type: T.componentType,
            layout: { top: 40, left: 2, width: T.defaultSize.width, height: T.defaultSize.height, ...item.layout },
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
 * @tjUsage  openModalAppInViewer(modalV2Selector.launchButton('m1'), { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for the selector
 */
export const openModalAppInViewer = (waitForSelector, opts) => visitDropdownApp(waitForSelector, opts);

/**
 * @tjBlock  canvas
 * @tjUsage  modalComponentId('modal1').then((id) => cy.get(modalV2Selector.content(id)))
 * @tjDom    closest `[component-type]` wrapper of the widget box → its id (the component id)
 */
export const modalComponentId = (name) =>
  cy.get(S.draggableWidget(name)).first().closest(S.wrapper).invoke("attr", "id");

// finishes running animations (react-bootstrap fade) so rects are final
const finishAnimations = (selector) =>
  cy.get(selector).should(($el) => {
    const doc = $el[0].ownerDocument;
    doc.getAnimations().forEach((a) => a.finish());
    const overlay = $el[0].closest(".modal");
    expect(overlay && overlay.classList.contains("show"), "modal overlay shown").to.eq(true);
  });

/**
 * @tjBlock  canvas
 * @tjUsage  openModal('m1', M1_ID)  ·  openModal('m1', M1_ID, { real: true })
 * @tjDom    clicks the trigger (ModalV2.jsx:308-323; real CDP click with `real`) then waits for
 *           `.tj-modal-content-<componentId>` to be visible inside a shown `.modal` overlay
 */
export const openModal = (name, componentId, { real = false } = {}) => {
  if (real) cy.get(S.launchButton(name)).realClick({ scrollBehavior: false });
  else cy.get(S.launchButton(name)).click({ scrollBehavior: false });
  cy.get(S.content(componentId), { timeout: 15000 }).should("be.visible");
  finishAnimations(S.content(componentId));
};

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const snapshot = (doc, componentId) => {
  const win = doc.defaultView;
  const content = doc.querySelector(S.content(componentId));
  const overlay = content ? content.closest(".modal") : null;
  const dialog = content ? content.closest(".modal-dialog") : null;
  const slot = (name) => {
    const canvas = doc.querySelector(S.slotCanvas(componentId, name));
    const widgets = {};
    if (canvas) {
      canvas.querySelectorAll('[data-cy^="draggable-widget-"]').forEach((w) => {
        // only direct children of this slot (not widgets of a nested container)
        if (w.closest('[id^="canvas-"]') !== canvas) return;
        widgets[w.getAttribute("data-cy").replace("draggable-widget-", "")] = rectOf(w);
      });
    }
    return canvas ? { ...rectOf(canvas), widgets } : null;
  };
  return {
    viewport: { width: win.innerWidth, height: win.innerHeight },
    pageContainer: rectOf(doc.querySelector(".page-container.canvas-container")),
    // the element the modal is portalled into (ModalV2.jsx:356-358: `.tj-canvas-area`, else `.real-canvas`)
    host: overlay ? rectOf(overlay.parentElement) : null,
    overlay: overlay ? { ...rectOf(overlay), className: String(overlay.className) } : null,
    dialog: dialog ? { ...rectOf(dialog), className: String(dialog.className) } : null,
    content: rectOf(content),
    header: rectOf(doc.querySelector(S.header(componentId))),
    body: rectOf(doc.querySelector(S.body(componentId))),
    footer: rectOf(doc.querySelector(S.footer(componentId))),
    slots: { header: slot("header"), body: slot("body"), footer: slot("footer") },
    openModals: doc.querySelectorAll(".modal.show").length,
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  modalBoxes(M1_ID, (b) => expect(b.content.width).to.be.closeTo(b.pageContainer.width, 1))
 * @tjDom    retries the callback with plain objects for one open modal: viewport size; the
 *           `.page-container.canvas-container` rect (what useResizeSideEffects observes); `host` = the element the modal
 *           is portalled into (`.tj-canvas-area`); the `.modal` overlay (rect,
 *           class); `.modal-dialog` (rect, class incl. modal-fullscreen / modal-lg …); `.modal-content`; header / body /
 *           footer rects; per slot (header|body|footer) the SubContainer canvas rect plus `widgets` {name → rect} of the
 *           widgets placed directly in it; `openModals` = number of shown overlays
 */
export const modalBoxes = (componentId, assertFn) => cy.document().should((doc) => assertFn(snapshot(doc, componentId)));

/**
 * @tjBlock  canvas
 * @tjUsage  readModalBoxes(M1_ID).then((b) => …)
 * @tjDom    one-shot read (no retry) of the plain object modalBoxes passes to its callback
 */
export const readModalBoxes = (componentId) => cy.document().then((doc) => snapshot(doc, componentId));

const describeFocus = (doc) => {
  const el = doc.activeElement;
  if (!el || el === doc.body) return { widget: null, dataCy: null, tag: "body", modal: null, popover: false, dropdownMenu: false };
  const widget = el.closest('[data-cy^="draggable-widget-"]');
  const body = el.closest(".modal") ? el.closest(".modal").querySelector('[data-cy="modal-body"]') : null;
  return {
    widget: widget ? widget.getAttribute("data-cy").replace("draggable-widget-", "") : null,
    dataCy: el.getAttribute("data-cy"),
    tag: el.tagName.toLowerCase(),
    // component id of the open modal holding the focused element (header, body or footer), else null
    modal: body ? body.id : null,
    popover: !!el.closest('[data-cy="popover-menu-content"]'),
    dropdownMenu: !!el.closest(".dropdown-multiselect-widget-custom-menu-list"),
  };
};

/**
 * @tjBlock  userflow
 * @tjUsage  focusedElement().then((f) => expect(f.modal).to.eq(M2_ID))
 * @tjDom    document.activeElement as a plain object: { widget (runtime name of the nearest widget box), dataCy, tag,
 *           modal (component id of the open modal that contains it), popover (inside a Popover Menu's portalled
 *           content), dropdownMenu (inside a Dropdown's portalled menu) }
 */
export const focusedElement = () => cy.document().then((doc) => describeFocus(doc));

/**
 * @tjBlock  userflow
 * @tjUsage  focusTrail(6).then((trail) => expect(trail.every((f) => f.popover)).to.eq(true))
 * @tjDom    sends `count` real Tab presses (CDP; Shift+Tab with { shift: true }) from the current focus and yields
 *           the focusedElement object after each press
 */
export const focusTrail = (count, { shift = false } = {}) => {
  const trail = [];
  Cypress._.times(count, () => {
    cy.realPress(shift ? ["Shift", "Tab"] : "Tab");
    cy.document().then((doc) => trail.push(describeFocus(doc)));
  });
  return cy.wrap(trail, { log: false });
};

const modKey = () => (Cypress.platform === "darwin" ? "Meta" : "Control");

/**
 * @tjBlock  canvas
 * @tjUsage  selectModalBox('modal1')
 * @tjDom    clicks the widget box at (1,1) — its 2px padding, outside the trigger <button> (ModalV2.jsx:308-322, whose
 *           click opens the modal) — so the Modal is selected on the canvas without opening; asserts no modal opened.
 *           The shared helpers (nudgeWidget, copyWidget, cutWidget, duplicateWidgetByKeyboard, resizeWidgetBy) click
 *           the box centre, which is the trigger.
 */
export const selectModalBox = (name, { shift = false } = {}) => {
  if (!shift) cy.forceClickOnCanvas();
  cy.get(S.draggableWidget(name)).first().click(1, 1, { force: true, shiftKey: shift });
  cy.get(".modal.show").should("not.exist");
};

/**
 * @tjBlock  canvas
 * @tjUsage  modalCanvasShortcut('modal1', 'd', 'Component cloned successfully')
 * @tjDom    clipboard permission (CDP) → selectModalBox → real Cmd/Ctrl+<key> → (optional) toast text
 */
export const modalCanvasShortcut = (name, key, toast) => {
  grantClipboardAccess(); // copy / cut / paste go through the async clipboard API
  selectModalBox(name);
  cy.realPress([modKey(), key]);
  if (toast) cy.verifyToastMessage(commonSelectors.toastMessage, toast);
};

/**
 * @tjBlock  canvas
 * @tjUsage  resizeModalBy('modal1', 160, 40)
 * @tjDom    selectModalBox → the moveable SE handle nearest the box's bottom-right corner → mousedown, mousemove on
 *           #real-canvas by (dx, dy), mouseup → autosave
 */
export const resizeModalBy = (name, dx, dy) => {
  selectModalBox(name);
  cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting
  cy.get(S.draggableWidget(name)).first().then(($w) => {
    const w = $w[0].getBoundingClientRect();
    cy.get('.moveable-control.moveable-direction.moveable-se[data-direction="se"]').then(($handles) => {
      const dist = (el) => {
        const r = el.getBoundingClientRect();
        return Math.hypot(r.left + r.width / 2 - w.right, r.top + r.height / 2 - w.bottom);
      };
      const handle = [...$handles].sort((a, b) => dist(a) - dist(b))[0];
      expect(dist(handle), `${name} SE handle at its corner`).to.be.lt(20);
      const x = w.right + dx;
      const y = w.bottom + dy;
      cy.wrap(handle).trigger("mousedown", { which: 1, force: true });
      cy.get("#real-canvas")
        .trigger("mousemove", { which: 1, force: true, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y })
        .trigger("mouseup", { force: true });
    });
  });
  cy.waitForAutoSave();
  cy.forceClickOnCanvas();
};

/**
 * @tjBlock  canvas
 * @tjUsage  collapseQueryPanel()   // after cy.openApp
 * @tjDom    the editor remembers the query panel state; if `.query-pane` is `.expanded` (QueryPanel.jsx:167),
 *           click query-manager-toggle-button; then asserts `.query-pane.collapsed`
 */
export const collapseQueryPanel = () => {
  cy.get(".query-pane").should("exist");
  cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting -- let the remembered state apply
  cy.get(".query-pane").then(($p) => {
    if ($p.hasClass("expanded")) cy.get('[data-cy="query-manager-toggle-button"]').click();
  });
  cy.get(".query-pane").should("have.class", "collapsed");
};
