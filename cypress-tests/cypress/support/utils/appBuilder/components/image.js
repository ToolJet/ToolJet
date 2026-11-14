/**
 * MODULE — appBuilder/components/image: real-geometry helpers for the Image widget's zoom surface
 * (react-zoom-pan-pinch, Image.jsx:308-333) and LazyLoad scroll mounting (Image.jsx:363-373).
 */
import { imageSelector } from "Selectors/appBuilder/components/image";
import { commonSelectors } from "Selectors/common";

// Image.jsx:353 repeats `data-cy="draggable-widget-<name>"` on its own root, inside the grid wrapper that
// already carries it — so generic canvas helpers that use that selector see 2 elements per Image.
// These variants target the grid wrapper (`.canvas-component`) only.
const gridWidget = (name) => `.canvas-component[data-cy="draggable-widget-${name}"]`;

/**
 * @tjBlock  canvas
 * @tjUsage  verifyImageWidgetCount('image', 2)
 * @tjDom    counts grid wrappers `.canvas-component[data-cy^="draggable-widget-<prefix>"]` (one per Image)
 */
export const verifyImageWidgetCount = (namePrefix, expectedCount) =>
  cy.get(`.canvas-component[data-cy^="draggable-widget-${namePrefix}"]`).should("have.length", expectedCount);

/**
 * @tjBlock  canvas
 * @tjUsage  moveImageWidget('image1', 650, 450)
 * @tjDom    cy.moveComponent's mouseover/mousedown → canvas mousemove → mouseup, on the grid wrapper only
 */
export const moveImageWidget = (name, x, y) => {
  cy.get(gridWidget(name))
    .trigger("mouseover", { force: true })
    .trigger("mousedown", { which: 1, force: true });
  cy.get(commonSelectors.canvas)
    .trigger("mousemove", { which: 1, force: true, clientX: x, clientY: y, pageX: x, pageY: y, screenX: x, screenY: y })
    .trigger("mouseup", { force: true });
};

/**
 * @tjBlock  canvas
 * @tjUsage  multiSelectImageWidgets(['image1', 'image2'])
 * @tjDom    click the first grid wrapper, shift+click the rest
 */
export const multiSelectImageWidgets = (names = []) => {
  cy.forceClickOnCanvas();
  names.forEach((name, i) => {
    cy.get(gridWidget(name)).click(i === 0 ? { force: true } : { shiftKey: true, force: true });
  });
};

/**
 * @tjBlock  userflow
 * @tjUsage  readZoom('image1').then(({ x, y, scale }) => ...)
 * @tjDom    parses `translate(Xpx, Ypx) scale(S)` from the TransformComponent content's inline style
 */
export const parseZoom = (transform) => {
  const m = /translate\(([-\d.e]+)px,\s*([-\d.e]+)px\)\s*scale\(([-\d.e]+)\)/.exec(transform || "");
  if (!m) throw new Error(`unexpected zoom transform: "${transform}"`);
  return { x: Number(m[1]), y: Number(m[2]), scale: Number(m[3]) };
};

export const readZoom = (name) =>
  cy.get(imageSelector.zoomContent(name)).then(($el) => parseZoom($el[0].style.transform));

/**
 * @tjBlock  userflow
 * @tjUsage  expectZoom('image1', (z) => expect(z.scale).to.be.gt(1))
 * @tjDom    retries the callback with the parsed transform (zoom animations take ~200ms)
 */
export const expectZoom = (name, assertFn) =>
  cy.get(imageSelector.zoomContent(name)).should(($el) => assertFn(parseZoom($el[0].style.transform)));

/**
 * @tjBlock  userflow
 * @tjUsage  clickZoomSurface('image1')
 * @tjDom    real hover (mouseenter arms zoom, Image.jsx:323) then a real click at the surface centre
 */
export const clickZoomSurface = (name) => {
  cy.get(imageSelector.zoomSurface(name)).realHover({ scrollBehavior: false });
  cy.get(imageSelector.zoomSurface(name)).realClick({ scrollBehavior: false });
};

/**
 * @tjBlock  userflow
 * @tjUsage  dragZoomSurface('image1', 60, 40)
 * @tjDom    real pointer down at the centre → move by (dx, dy) in steps → up
 */
export const dragZoomSurface = (name, dx, dy, steps = 8) => {
  cy.get(imageSelector.zoomSurface(name)).then(($el) => {
    const r = $el[0].getBoundingClientRect();
    const x = r.width / 2;
    const y = r.height / 2;
    cy.get(imageSelector.zoomSurface(name)).realMouseDown({ position: { x, y }, scrollBehavior: false });
    for (let i = 1; i <= steps; i++) {
      cy.get(imageSelector.zoomSurface(name)).realMouseMove(x + (dx * i) / steps, y + (dy * i) / steps, {
        position: "topLeft",
        scrollBehavior: false,
      });
    }
    cy.get(imageSelector.zoomSurface(name)).realMouseUp({ position: { x: x + dx, y: y + dy }, scrollBehavior: false });
  });
};

/**
 * @tjBlock  canvas
 * @tjUsage  stubDefaultImageSource()
 * @tjDom    serves the dropped Image's default external Source URL from a local SVG (offline-deterministic)
 */
export const stubDefaultImageSource = (url) =>
  cy.intercept("GET", url, {
    statusCode: 200,
    headers: { "content-type": "image/svg+xml" },
    body: "<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='#4a90d9'/></svg>",
  });

/**
 * @tjBlock  userflow
 * @tjUsage  readSettledZoom('image1').then(({ scale }) => ...)
 * @tjDom    waits until the zoom transform stops changing for 300ms (zoom animations), then yields it
 */
export const readSettledZoom = (name, quietMs = 300) => {
  let last = null;
  let since = 0;
  return cy
    .get(imageSelector.zoomContent(name), { timeout: 10000 })
    .should(($el) => {
      const t = $el[0].style.transform;
      if (t !== last) {
        last = t;
        since = Date.now();
      }
      expect(Date.now() - since, "zoom transform settled").to.be.gte(quietMs);
    })
    .then(($el) => parseZoom($el[0].style.transform));
};

/**
 * @tjBlock  userflow
 * @tjUsage  clickZoomUntil('image1', (z) => z.scale === 8, (prev, z) => expect(z.scale).to.be.gt(prev.scale))
 * @tjDom    clicks the zoom surface (settling after each) until `done(z)`; `eachFn(prev, z)` asserts every step
 */
export const clickZoomUntil = (name, done, eachFn, maxClicks = 8) => {
  const step = (prev, n) => {
    if (done(prev)) return cy.wrap(prev, { log: false });
    expect(n, `reached the target within ${maxClicks} clicks`).to.be.lt(maxClicks);
    clickZoomSurface(name);
    return readSettledZoom(name).then((z) => {
      eachFn(prev, z);
      return step(z, n + 1);
    });
  };
  return readSettledZoom(name).then((z) => step(z, 0));
};

/**
 * @tjBlock  canvas
 * @tjUsage  wheelCanvasUntil((sc, doc) => sc.scrollTop > 0, 100)
 * @tjDom    waits until the viewer canvas scroller can scroll, then sends real wheel events over it
 *           (each `deltaY`) until `doneFn(scroller, document)` holds — at most `maxWheels` events
 */
export const wheelCanvasUntil = (doneFn, deltaY, maxWheels = 15) => {
  cy.get(imageSelector.canvasScroller).should(($sc) =>
    expect($sc[0].scrollHeight, "canvas is scrollable").to.be.gt($sc[0].clientHeight)
  );
  const step = (n) =>
    cy.get(imageSelector.canvasScroller).then(($sc) => {
      if (doneFn($sc[0], $sc[0].ownerDocument)) return;
      expect(n, `condition reached within ${maxWheels} wheel events`).to.be.lt(maxWheels);
      cy.get(imageSelector.canvasScroller).realMouseWheel({ deltaY, scrollBehavior: false });
      cy.wait(150); // let the wheel's (smooth) scroll land before re-checking
      step(n + 1);
    });
  step(0);
};
