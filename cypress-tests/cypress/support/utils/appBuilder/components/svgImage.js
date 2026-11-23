/**
 * MODULE — appBuilder/components/svgImage: browser-only helpers for the Svg Image widget.
 * FOR AI: addSvgImagesViaApi seeds Svg Images (with svgImage.js definition defaults) plus any helper widgets in
 * one components POST through link.js's generic seeder; svgBoxes reads the real layout boxes of the grid box,
 * the clipping container and the drawn <svg>; expectSvgDrawn is the viewer-safe 'is drawn' check.
 */
import { svgImageText } from "Texts/appBuilder/components/svgImage";
import { svgImageSelector } from "Selectors/appBuilder/components/svgImage";
import { addLinksViaApi } from "Support/utils/appBuilder/components/link";

const merge = (defaults, overrides = {}) => ({ ...defaults, ...overrides });

/**
 * @tjBlock  contexts
 * @tjUsage  addSvgImagesViaApi([{ name: 'svgimage1', layout: { top: 40, left: 2, width: 6, height: 100 }, properties: { data: { value: '<svg …/>' } } }, { type: 'Text', name: 'text1', layout: {…}, properties: { text: { value: 'A' } } }])
 * @tjDom    POST /api/v2/apps/<appId>/versions/<v>/components (addLinksViaApi); an item without `type` is an
 *           SvgImage and gets svgImage.js definition defaults merged under its properties/styles/others
 */
export const addSvgImagesViaApi = (items, appIdArg) => {
  const D = svgImageText.definition;
  return addLinksViaApi(
    items.map((item) =>
      item.type && item.type !== "SvgImage"
        ? item
        : {
          ...item,
          type: "SvgImage",
          layout: { width: svgImageText.defaultSize.width, height: svgImageText.defaultSize.height, ...item.layout },
          properties: merge(D.properties, item.properties),
          styles: merge(D.styles, item.styles),
          others: merge(D.others, item.others),
        }
    ),
    appIdArg
  );
};

/**
 * @tjBlock  canvas
 * @tjUsage  svgBoxes('svgimage1', (b) => expect(b.svg.height).to.be.gt(b.container.height))
 * @tjDom    retries the callback with rects of the grid box (`draggable-widget-<name>`), the widget's container
 *           (SvgImage.jsx:8) and its <svg>, the container's computed overflow/display and scroll size
 */
export const svgBoxes = (name, assertFn) =>
  cy.get(svgImageSelector.container(name)).first().should(($c) => {
    const c = $c[0];
    const doc = c.ownerDocument;
    const rect = (el) => (el ? el.getBoundingClientRect() : null);
    const cs = doc.defaultView.getComputedStyle(c);
    assertFn({
      widget: rect(doc.querySelector(svgImageSelector.draggableWidget(name))),
      container: rect(c),
      svg: rect(c.querySelector('[role="img"] > svg')),
      overflow: cs.overflow,
      display: cs.display,
      scrollHeight: c.scrollHeight,
      clientHeight: c.clientHeight,
      scrollWidth: c.scrollWidth,
      clientWidth: c.clientWidth,
      el: c,
    });
  });

/**
 * @tjBlock  canvas
 * @tjUsage  expectSvgDrawn('svgimage1')
 * @tjDom    the container is displayed and its <svg> has a non-empty box. Cypress `be.visible` is unreliable for
 *           Svg Images in the viewer: it hit-tests the element's centre, which an unfilled icon (fill='none')
 *           or a clipped oversized vector does not cover, so it reports "covered by another element"
 */
export const expectSvgDrawn = (name, timeout = 30000) =>
  cy.get(svgImageSelector.svg(name), { timeout }).should(($svg) => {
    const c = $svg[0].closest(`[data-cy="${name}"]`);
    expect(c.ownerDocument.defaultView.getComputedStyle(c).display, `${name} container displayed`).to.not.eq("none");
    const r = $svg[0].getBoundingClientRect();
    expect(r.width * r.height, `${name} svg box`).to.be.gt(0);
  });

/**
 * @tjBlock  canvas
 * @tjUsage  resizeWidgetBy('svgimage1', 40, 80)
 * @tjDom    selects the widget, then drags the react-moveable SE handle CLOSEST to the widget's bottom-right
 *           corner by (dx, dy) on #real-canvas. cy.resizeWidget drags `.moveable-se` `.last()`, which on a
 *           canvas with several widgets can be another widget's handle.
 */
export const resizeWidgetBy = (name, dx, dy) => {
  cy.get(svgImageSelector.draggableWidget(name)).first().click({ force: true });
  cy.wait(500);
  cy.get(svgImageSelector.draggableWidget(name)).first().then(($w) => {
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
