/**
 * MODULE — appBuilder/components/textArea: viewer-mode geometry helpers for the Text Area's dynamic
 * height. Dynamic height only runs in a running app (TextArea.jsx:11 `dynamicHeight && currentMode === 'view'`),
 * so these open the imported app in the viewer and read real layout boxes of the grid widget wrappers.
 */

/**
 * @tjBlock  contexts
 * @tjUsage  openAppInViewer()   // after importAppFixture → Cypress.env('appId')
 * @tjDom    visits /applications/<appId>/<page>?version=v1 (the editor's Preview URL) and waits for a widget
 */
export const openAppInViewer = (waitForSelector, appId, pageHandle = "home") => {
  // resolve the id lazily: importAppFixture sets Cypress.env('appId') only when its request completes
  cy.then(() => cy.visit(`/applications/${appId || Cypress.env("appId")}/${pageHandle}?version=v1`));
  if (waitForSelector) cy.get(waitForSelector, { timeout: 30000 }).should("be.visible");
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectLayout((box) => expect(box('text1').top - box('textarea1').bottom).to.be.closeTo(20, 2))
 * @tjDom    retries until the callback passes; box(name, rowIndex=0) = getBoundingClientRect of the
 *           nth `[data-cy="draggable-widget-<name>"]` (rowIndex picks a list-view row instance).
 *           Assert RELATIONS between boxes read in the same pass — absolute tops move with scroll.
 */
export const expectLayout = (assertFn) =>
  cy.document().should((doc) => {
    const box = (name, rowIndex = 0) => {
      const el = doc.querySelectorAll(`[data-cy="draggable-widget-${name}"]`)[rowIndex];
      expect(el, `widget ${name}[${rowIndex}]`).to.exist;
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height, left: r.left, right: r.right };
    };
    assertFn(box);
  });

/**
 * @tjBlock  canvas
 * @tjUsage  typeLines('[data-cy="textarea1-input"]', 10)
 * @tjDom    clicks the <textarea> and types `n` "lineN{enter}" lines — real keystrokes, so onChange fires
 */
export const typeLines = (selector, n, prefix = "line") => {
  const text = Array.from({ length: n }, (_, i) => `${prefix}${i + 1}`).join("{enter}");
  cy.get(selector).first().click().type(text, { delay: 0 });
};

/**
 * @tjBlock  canvas
 * @tjUsage  expectScrollState('[data-cy="textarea1-input"]', (el) => expect(el.scrollTop).to.be.gt(0))
 * @tjDom    retries the callback with the raw element (scrollTop / scrollHeight / clientHeight)
 */
export const expectScrollState = (selector, assertFn) =>
  cy.get(selector).first().should(($el) => assertFn($el[0]));
