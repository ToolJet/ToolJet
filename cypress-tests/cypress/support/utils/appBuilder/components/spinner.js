/**
 * MODULE — appBuilder/components/spinner: browser-only helpers for the Spinner widget.
 * FOR AI: addSpinnersViaApi seeds fully-configured spinners (plus any helper widgets) in one components POST —
 * spinner definition defaults merged with per-item overrides; openSpinnerAppInViewer opens the running app;
 * spinnerBoxes reads the real geometry of the RenderWidget box, the `.spinner-container` and the rotating ring.
 * The ring spins (CSS rotate), so its getBoundingClientRect is the rotated square's hull (√2 × side): use the
 * returned `ring` (un-rotated layout box: centre from the rect, side from offsetWidth/offsetHeight) instead.
 */
import { spinnerText } from "Texts/appBuilder/components/spinner";
import { commonWidgetSelector } from "Selectors/common";
import { addDividersViaApi, openDividerAppInViewer } from "Support/utils/appBuilder/components/divider";

/**
 * @tjBlock  contexts
 * @tjUsage  addSpinnersViaApi([{ name: 'big', layout: { top: 40, left: 2, width: 4, height: 30 }, styles: { size: { value: 'lg' } } }])
 * @tjDom    delegates to addDividersViaApi with the Spinner type/definition (GET app → POST components diff).
 *           Items without a `type` become Spinners with definition others/styles merged under the item's own;
 *           items with another `type` (a TextInput driving a binding, …) pass through unchanged.
 */
export const addSpinnersViaApi = (items, opts = {}) =>
  addDividersViaApi(items, {
    type: spinnerText.componentType,
    definition: spinnerText.definition,
    ...opts,
  });

/**
 * @tjBlock  contexts
 * @tjUsage  openSpinnerAppInViewer('[data-cy="draggable-widget-big"]', { query: '&layout=mobile' })
 * @tjDom    visits /applications/<appId>/home?version=v1 (the editor's Preview URL) and waits for a selector
 */
export const openSpinnerAppInViewer = (waitForSelector, opts) => openDividerAppInViewer(waitForSelector, opts);

const measureSpinner = (box, name) => {
  const win = box.ownerDocument.defaultView;
  const container = box.querySelector(`[data-cy="${name}"]`);
  const ring = container ? container.querySelector(".spinner-border") : null;
  const rect = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
  };
  let ringBox = null;
  if (ring) {
    const r = ring.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const w = ring.offsetWidth;
    const h = ring.offsetHeight;
    const cs = win.getComputedStyle(ring);
    ringBox = {
      left: cx - w / 2,
      right: cx + w / 2,
      top: cy - h / 2,
      bottom: cy + h / 2,
      width: w,
      height: h,
      side: Math.max(w, h),
      className: ring.className,
      role: ring.getAttribute("role"),
      color: cs.color,
      borderWidth: parseFloat(cs.borderTopWidth),
    };
  }
  return {
    box: rect(box),
    container: container ? { ...rect(container), display: win.getComputedStyle(container).display } : null,
    ring: ringBox,
  };
};

/**
 * @tjBlock  canvas
 * @tjUsage  spinnerBoxes('spinner1', (b) => expect(b.ring.side).to.eq(16))
 * @tjDom    retries the callback with plain objects: `box` (RenderWidget box rect), `container`
 *           (`.spinner-container` rect + computed display), `ring` (un-rotated layout box of `.spinner-border`:
 *           left/right/top/bottom/width/height/side, its className, role, computed colour and border width)
 */
export const spinnerBoxes = (name, assertFn) =>
  cy
    .get(commonWidgetSelector.draggableWidget(name))
    .first()
    .should(($box) => assertFn(measureSpinner($box[0], name)));

/**
 * @tjBlock  canvas
 * @tjUsage  getSpinnerGeometry('spinner1').then((g) => expect(g.ring.side).to.eq(16))
 * @tjDom    one-shot read (no retry) of the same plain object spinnerBoxes passes to its callback — use it to
 *           capture a value for a later comparison
 */
export const getSpinnerGeometry = (name) =>
  cy
    .get(commonWidgetSelector.draggableWidget(name))
    .first()
    .then(($box) => measureSpinner($box[0], name));

/**
 * @tjBlock  canvas
 * @tjUsage  expectSpinnerInsideBox('spinner1', 24)
 * @tjDom    spinnerBoxes: ring has the given side (px), is rendered (container not display:none) and its
 *           un-rotated layout box lies inside both the `.spinner-container` and the RenderWidget box
 */
export const expectSpinnerInsideBox = (name, side) =>
  spinnerBoxes(name, (b) => {
    expect(b.container, `${name}: container rendered`).to.not.eq(null);
    expect(b.container.display, `${name}: container displayed`).to.not.eq("none");
    expect(b.ring, `${name}: ring rendered`).to.not.eq(null);
    expect(b.ring.width, `${name}: ring width`).to.eq(side);
    expect(b.ring.height, `${name}: ring height`).to.eq(side);
    [
      ["container", b.container],
      ["widget box", b.box],
    ].forEach(([label, outer]) => {
      expect(b.ring.left, `${name}: ring left inside ${label}`).to.be.gte(outer.left - 0.5);
      expect(b.ring.right, `${name}: ring right inside ${label}`).to.be.lte(outer.right + 0.5);
      expect(b.ring.top, `${name}: ring top inside ${label}`).to.be.gte(outer.top - 0.5);
      expect(b.ring.bottom, `${name}: ring bottom inside ${label}`).to.be.lte(outer.bottom + 0.5);
    });
  });

/**
 * @tjBlock  contexts
 * @tjUsage  setToggleExpression('Show on desktop', '{{1 > 2}}')
 * @tjDom    hovers the inspector toggle, switches it to fx (code) mode, selects all in its CodeMirror field and
 *           pastes the expression verbatim (asserting the text), then blurs it (CodeHinter commits on blur)
 */
export const setToggleExpression = (paramName, expression) => {
  cy.get(commonWidgetSelector.parameterLabel(paramName)).should("have.text", paramName);
  cy.get("body").then(($body) => {
    // toggle mode has no CodeMirror field yet → switch to fx first
    if (!$body.find(commonWidgetSelector.parameterInputField(paramName)).length) {
      cy.get(commonWidgetSelector.parameterTogglebutton(paramName)).realHover();
      cy.get(commonWidgetSelector.parameterFxButton(paramName, " > svg")).click();
    }
  });
  // clearAndTypeOnCodeMirror silently drops `>`, `<`, `=`, `@` …, and its array form cannot type `{`: paste the
  // expression instead (CodeMirror 6 replaces the selection with clipboardData text on a paste event)
  cy.get(commonWidgetSelector.parameterInputField(paramName))
    .find(".cm-content")
    .click()
    .type("{selectall}")
    .then(($content) => {
      const win = $content[0].ownerDocument.defaultView;
      const data = new win.DataTransfer();
      data.setData("text/plain", expression);
      $content[0].dispatchEvent(new win.ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    });
  cy.get(commonWidgetSelector.parameterInputField(paramName)).find(".cm-line").should("have.text", expression);
  cy.get(commonWidgetSelector.parameterLabel(paramName)).click();
};
