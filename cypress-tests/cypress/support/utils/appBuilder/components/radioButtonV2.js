/**
 * MODULE — appBuilder/components/radioButtonV2: browser-only helpers for the Radio Button (V2) widget.
 * FOR AI: addRadioButtonsViaApi seeds fully-configured Radio Buttons (radioButtonV2.js definition defaults merged with
 * per-item overrides) plus any helper widgets and their events in one components POST; openRadioAppInViewer opens the
 * running app; radioBoxes / readRadioBoxes read plain-object geometry + computed styles of the grid box, the
 * RenderWidget box, the radiogroup root, the options scroller (overflow, scroll sizes) and every option (caption,
 * native input state, painted checkmark incl. its ::after handle); checkmarkRing reads the keyboard focus ring drawn on
 * the focused option's checkmark and the rect of the nearest ancestor that clips it; hoverForTooltip /
 * moveMouseAway drive the Radix widget tooltip with a real pointer.
 */
import { radioButtonV2Text } from "Texts/appBuilder/components/radioButtonV2";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

const T = radioButtonV2Text;

/**
 * @tjBlock  contexts
 * @tjUsage  addRadioButtonsViaApi([{ name: 'rb1', layout: { top: 40, left: 2, width: 12, height: 43 }, properties: { layout: { value: 'column' } } }, { type: 'TextInput', name: 'ti' }])
 * @tjDom    delegates to addIconsViaApi (GET app → POST components diff → POST events). Items without a `type` become
 *           RadioButtonV2 with the radioButtonV2.js:310-379 definition properties/styles/others merged under the
 *           item's own; items with another `type` pass through unchanged. Also sets Cypress.env('editingVersionId').
 */
export const addRadioButtonsViaApi = (items, { appId } = {}) => {
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
 * @tjUsage  openRadioAppInViewer(radioButtonV2Selector.options('rb1'), { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openRadioAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
};

const snapshot = (box) => {
  const win = box.ownerDocument.defaultView;
  const name = box.getAttribute("data-cy").replace("draggable-widget-", "");
  const css = (el, prop, pseudo) => (el ? win.getComputedStyle(el, pseudo).getPropertyValue(prop) : null);
  const root = box.querySelector('[role="radiogroup"]');
  const scroller = box.querySelector(".radio-button-options");
  const labelP = box.ownerDocument.querySelector(`[data-cy="${name}-label"] p`);
  const options = scroller
    ? [...scroller.querySelectorAll("label.radio-button-container")].map((label) => {
        const input = label.querySelector("input");
        const mark = label.querySelector(".checkmark");
        const caption = label.querySelector("span");
        return {
          rect: rectOf(label),
          caption: rectOf(caption),
          text: caption ? caption.textContent : null,
          captionColor: css(caption, "color"),
          checked: input ? input.checked : null,
          disabled: input ? input.disabled : null,
          mark: rectOf(mark),
          markBg: css(mark, "background-color"),
          markBorderStyle: css(mark, "border-top-style"),
          markBorderWidth: css(mark, "border-top-width"),
          markBorderColor: css(mark, "border-top-color"),
          markRadius: css(mark, "border-top-left-radius"),
          markShadow: css(mark, "box-shadow"),
          handleDisplay: css(mark, "display", "::after"),
          handleBg: css(mark, "background-color", "::after"),
          handleWidth: css(mark, "width", "::after"),
          handleHeight: css(mark, "height", "::after"),
        };
      })
    : [];
  return {
    name,
    wrapper: rectOf(box.parentElement),
    box: rectOf(box),
    boxPadding: css(box, "padding-top"),
    root: rectOf(root),
    rootClass: root ? String(root.className) : null,
    rootVisibility: css(root, "visibility"),
    labelColor: css(labelP, "color"),
    scroller: rectOf(scroller),
    overflowX: css(scroller, "overflow-x"),
    overflowY: css(scroller, "overflow-y"),
    scrollWidth: scroller ? scroller.scrollWidth : null,
    clientWidth: scroller ? scroller.clientWidth : null,
    scrollHeight: scroller ? scroller.scrollHeight : null,
    clientHeight: scroller ? scroller.clientHeight : null,
    scrollLeft: scroller ? scroller.scrollLeft : null,
    options,
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  radioBoxes('rb1', (b) => expect(b.scrollWidth).to.be.gt(b.clientWidth))
 * @tjDom    retries the callback with plain objects: wrapper (WidgetWrapper grid box), box (`draggable-widget-<name>`
 *           + its padding), root (role=radiogroup rect / class / visibility), labelColor (the Label <p> colour),
 *           scroller (`.radio-button-options` rect, overflow-x/-y, scroll + client sizes, scrollLeft) and options[]
 *           (label rect, caption rect / text / colour, input checked / disabled, checkmark rect / background / border
 *           style-width-colour / radius / box-shadow, ::after handle display / background / size)
 */
export const radioBoxes = (name, assertFn) =>
  cy
    .get(`[data-cy="draggable-widget-${name}"]`, { timeout: 30000 })
    .first()
    .should(($box) => assertFn(snapshot($box[0])));

/**
 * @tjBlock  canvas
 * @tjUsage  readRadioBoxes('rb1').then((b) => …)
 * @tjDom    one radioBoxes snapshot yielded as a plain object (no retry)
 */
export const readRadioBoxes = (name) =>
  cy.get(`[data-cy="draggable-widget-${name}"]`, { timeout: 30000 }).first().then(($box) => snapshot($box[0]));

/**
 * @tjBlock  canvas
 * @tjUsage  expectRectWithin(option.mark, b.scroller, 'first option')
 * @tjDom    chai: inner rect lies inside the outer rect (sub-pixel tolerance)
 */
export const expectRectWithin = (inner, outer, label = "", tolerance = 0.5) => {
  expect(inner.left, `${label}: left edge inside`).to.be.gte(outer.left - tolerance);
  expect(inner.right, `${label}: right edge inside`).to.be.lte(outer.right + tolerance);
  expect(inner.top, `${label}: top edge inside`).to.be.gte(outer.top - tolerance);
  expect(inner.bottom, `${label}: bottom edge inside`).to.be.lte(outer.bottom + tolerance);
};

/**
 * @tjBlock  styles
 * @tjUsage  checkmarkRing().then((f) => expect(f.spread).to.eq(3))
 * @tjDom    reads document.activeElement (the native radio) and its painted `.checkmark` sibling (the ring is
 *           peer-focus-visible:tw-ring-2 + tw-ring-offset-1, RadioButtonV2.jsx:333): { widget, index (option index from
 *           data-cy), focusVisible, boxShadow, spread (largest box-shadow spread, px), ringColor, rect (checkmark),
 *           clip (rect of the nearest ancestor that clips overflow on either axis) } — plain object
 */
export const checkmarkRing = () =>
  cy.document().then((doc) => {
    const win = doc.defaultView;
    const input = doc.activeElement;
    const mark = input && input.nextElementSibling;
    const widget = input && input.closest('[data-cy^="draggable-widget-"]');
    const shadow = mark ? win.getComputedStyle(mark).boxShadow : "none";
    // "rgb(255, 255, 255) 0px 0px 0px 1px, rgb(67, 104, 227) 0px 0px 0px 3px, …" → [{ color, spread }]
    const layers =
      shadow === "none"
        ? []
        : shadow.split(/,(?![^(]*\))/).map((layer) => {
            const color = (layer.match(/rgba?\([^)]*\)/) || [""])[0];
            const px = (layer.replace(color, "").match(/-?[\d.]+px/g) || []).map(parseFloat);
            return { color, spread: px[3] || 0 };
          });
    const top = layers.reduce((a, l) => (l.spread > (a ? a.spread : 0) ? l : a), null);
    let clipEl = mark ? mark.parentElement : null;
    while (
      clipEl &&
      win.getComputedStyle(clipEl).overflowX === "visible" &&
      win.getComputedStyle(clipEl).overflowY === "visible"
    )
      clipEl = clipEl.parentElement;
    const dataCy = input ? input.getAttribute("data-cy") || "" : "";
    return {
      widget: widget ? widget.getAttribute("data-cy").replace("draggable-widget-", "") : null,
      index: /-option-input-(\d+)$/.test(dataCy) ? Number(dataCy.match(/-option-input-(\d+)$/)[1]) : null,
      focusVisible: input ? input.matches(":focus-visible") : false,
      boxShadow: shadow,
      spread: top ? top.spread : 0,
      ringColor: top ? top.color : null,
      rect: rectOf(mark),
      clip: rectOf(clipEl),
      clipClass: clipEl ? String(clipEl.className) : null,
    };
  });

/**
 * @tjBlock  properties
 * @tjUsage  hoverForTooltip('rb1')
 * @tjDom    real pointer over the widget's options (the Radix TooltipTrigger wraps the RenderWidget box), then waits
 *           past the 500ms show delay (WidgetTooltip.jsx:49)
 */
export const hoverForTooltip = (name) => {
  cy.get(`[data-cy="draggable-widget-${name}"] .radio-button-options`).realHover({ scrollBehavior: false });
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(T.tooltipDelayMs + 400);
};

/**
 * @tjBlock  properties
 * @tjUsage  moveMouseAway()
 * @tjDom    real pointer to the page's top-left corner, in two moves: Radix keeps a hover tooltip open after the
 *           pointer leaves its trigger until a FURTHER pointermove lands outside the trigger→content grace area, so a
 *           single jump leaves it open (closes a hover tooltip, avoids stray hover state)
 */
export const moveMouseAway = () => {
  cy.get("body").realHover({ position: { x: 4, y: 4 }, scrollBehavior: false });
  cy.get("body").realHover({ position: { x: 8, y: 8 }, scrollBehavior: false });
};
