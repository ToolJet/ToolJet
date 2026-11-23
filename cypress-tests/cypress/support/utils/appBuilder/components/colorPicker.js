/**
 * MODULE — appBuilder/components/colorPicker: browser-only helpers for the Color Picker widget.
 * FOR AI: addColorPickersViaApi seeds fully-configured Color Pickers (colorPicker.js definition defaults merged with
 * per-item overrides) plus helper widgets in one components POST; openColorPickerAppInViewer opens the running app;
 * openColorPickerPopover opens the SketchPicker popover; dragColorSlider drags the real react-color saturation
 * square / hue strip / alpha strip with CDP mouse events (press → several moves → release) at fractions of the
 * slider's own box; colorPickerState reads plain-object state (button colour code, swatch background, slider rects
 * and pointer positions as fractions); parseRgba / parseHex / rgbToHsv convert colour strings for assertions.
 */
import { colorPickerText } from "Texts/appBuilder/components/colorPicker";
import { colorPickerSelector } from "Selectors/appBuilder/components/colorPicker";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

const T = colorPickerText;
const S = colorPickerSelector;

/**
 * @tjBlock  contexts
 * @tjUsage  addColorPickersViaApi([{ name: 'colorpicker1', properties: { showAlpha: { value: '{{true}}' } } }, { type: 'Text', name: 'probe' }])
 * @tjDom    delegates to addIconsViaApi (GET app → POST components diff → POST events). Items without a `type` become
 *           ColorPicker with the colorPicker.js:287-328 definition properties/styles/others merged under the item's
 *           own; items with another `type` pass through unchanged. Also sets Cypress.env('editingVersionId').
 */
export const addColorPickersViaApi = (items, { appId } = {}) => {
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
 * @tjUsage  openColorPickerAppInViewer(colorPickerSelector.button('colorpicker1'))
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openColorPickerAppInViewer = (waitForSelector, opts) => openIconAppInViewer(waitForSelector, opts);

/**
 * @tjBlock  userflow
 * @tjUsage  openColorPickerPopover('colorpicker1')
 * @tjDom    clicks the Popover trigger (`draggable-widget-<name>-button`), waits for aria-expanded=true and the
 *           SketchPicker saturation square to have a stable, non-zero box (Radix open animation finished)
 */
export const openColorPickerPopover = (name) => {
  cy.get(S.button(name)).click();
  cy.get(S.button(name)).should("have.attr", "aria-expanded", "true");
  cy.get(S.sketchPicker(name)).should("be.visible");
  let last = null;
  cy.get(S.saturation(name)).should(($el) => {
    const r = $el[0].getBoundingClientRect();
    const key = `${Math.round(r.left)}:${Math.round(r.top)}:${Math.round(r.width)}:${Math.round(r.height)}`;
    const stable = key === last;
    last = key;
    expect(r.width, "saturation square laid out").to.be.gt(50);
    expect(stable, "popover position settled").to.be.true;
  });
};

/** The pointer-tracking container of a slider: `saturation` | `hue` | `alpha`. */
const sliderElement = (doc, name, slider) => {
  const popover = doc.querySelector(S.popover(name));
  if (!popover) return null;
  if (slider === "saturation") return popover.querySelector(".saturation-white");
  const hue = popover.querySelector(".hue-horizontal");
  if (slider === "hue") return hue;
  // Sketch.js: sliders > [hue wrapper > Hue root > .hue-horizontal, alpha wrapper > Alpha root (absolute inset 0)]
  const hueWrapper = hue && hue.parentElement ? hue.parentElement.parentElement : null;
  const alphaWrapper = hueWrapper ? hueWrapper.nextElementSibling : null;
  return alphaWrapper ? alphaWrapper.firstElementChild : null;
};

/**
 * @tjBlock  userflow
 * @tjUsage  dragColorSlider('colorpicker1', 'saturation', { x: 0.9, y: 0.1 }, { x: 0.3, y: 0.4 })
 * @tjDom    real CDP mouse: press at `from`, `steps` mouseMoved events along the line, release at `to`; positions are
 *           fractions of the slider's pointer-tracking box (saturation `.saturation-white`, hue `.hue-horizontal`,
 *           alpha = the root inside the hue strip's next sibling). scrollBehavior:false keeps the page still.
 */
export const dragColorSlider = (name, slider, from, to, { steps = 6 } = {}) => {
  cy.document().then((doc) => {
    const el = sliderElement(doc, name, slider);
    expect(el, `${slider} slider rendered`).to.exist;
    const r = el.getBoundingClientRect();
    expect(r.width, `${slider} slider has width`).to.be.gt(0);
    const at = (p) => ({ x: (p.x ?? 0.5) * r.width, y: (p.y ?? 0.5) * r.height });
    const start = at(from);
    const end = at(to);
    cy.wrap(el).realMouseDown({ position: start, scrollBehavior: false });
    for (let i = 1; i <= steps; i += 1) {
      const x = start.x + ((end.x - start.x) * i) / steps;
      const y = start.y + ((end.y - start.y) * i) / steps;
      cy.wrap(el).realMouseMove(x, y, { position: "topLeft", scrollBehavior: false });
    }
    cy.wrap(el).realMouseUp({ position: end, scrollBehavior: false });
  });
};

const rectOf = (el) => {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
};

// left/top of a react-color pointer div (absolute, sized 0) as a fraction of its container
const pointerFraction = (container, pointer) => {
  if (!container || !pointer) return null;
  const c = container.getBoundingClientRect();
  const p = pointer.getBoundingClientRect();
  return { x: (p.left - c.left) / c.width, y: c.height ? (p.top - c.top) / c.height : 0 };
};

/**
 * @tjBlock  userflow
 * @tjUsage  colorPickerState('colorpicker1', (s) => expect(s.colorCode).to.eq('#4368e3'))
 * @tjDom    retries the callback with plain objects: colorCode (`.color-code` text), previewBackground (`.color-preview`
 *           computed background-image), expanded (trigger aria-expanded), and — while the popover is open —
 *           saturation / hue / alpha rects and their pointer positions as fractions (react-color pointer divs = the
 *           container's last child, after an injected <style>: Saturation.js:163 left=s, top=1-v; Hue.js:135
 *           left=h/360; Alpha.js:151 left=a), alphaDisplay
 */
export const colorPickerState = (name, assertFn) =>
  cy.document().should((doc) => {
    const win = doc.defaultView;
    const button = doc.querySelector(S.button(name));
    const preview = doc.querySelector(S.preview(name));
    const code = doc.querySelector(S.colorCode(name));
    const sat = sliderElement(doc, name, "saturation");
    const hue = sliderElement(doc, name, "hue");
    const alpha = sliderElement(doc, name, "alpha");
    const alphaContainer = alpha ? alpha.lastElementChild : null;
    assertFn({
      expanded: button ? button.getAttribute("aria-expanded") : null,
      colorCode: code ? code.textContent : null,
      previewBackground: preview ? win.getComputedStyle(preview).getPropertyValue("background-image") : null,
      saturation: rectOf(sat),
      hue: rectOf(hue),
      alpha: rectOf(alpha),
      alphaDisplay: alpha ? win.getComputedStyle(alpha.parentElement).getPropertyValue("display") : null,
      saturationPointer: sat ? pointerFraction(sat, sat.lastElementChild) : null,
      huePointer: hue ? pointerFraction(hue, hue.lastElementChild) : null,
      alphaPointer: alphaContainer ? pointerFraction(alphaContainer, alphaContainer.lastElementChild) : null,
    });
  });

/** 'rgba(67, 104, 227, 0.4)' / 'rgb(67, 104, 227)' → { r, g, b, a } (null when unparsable). */
export const parseRgba = (text) => {
  const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(String(text));
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
};

/** '#4368e3' / '#4368e366' → { r, g, b, a } (null when unparsable). */
export const parseHex = (text) => {
  const m = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(String(text).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: m[2] ? parseInt(m[2], 16) / 255 : 1 };
};

/** { r, g, b } (0-255) → { h (0-360), s (0-1), v (0-1) }. */
export const rgbToHsv = ({ r, g, b }) => {
  const [R, G, B] = [r / 255, g / 255, b / 255];
  const max = Math.max(R, G, B);
  const min = Math.min(R, G, B);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === R) h = ((G - B) / d) % 6;
    else if (max === G) h = (B - R) / d + 2;
    else h = (R - G) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max ? d / max : 0, v: max };
};
