/**
 * MODULE — appBuilder/components/numberInput: browser-only helpers for the Number Input widget.
 * FOR AI: scrollOffsets / expectScrollOffsets read how far every scrollable ancestor of an element (plus
 * the document) is scrolled, so a test can prove where a real wheel over the field went (NumberInput.jsx
 * handleWheel redirects it to the nearest scrollable ancestor, else window); resetScroll puts them back to 0.
 */

const readOffsets = ($el) => {
  const doc = $el[0].ownerDocument;
  const win = doc.defaultView;
  const root = doc.scrollingElement;
  let total = root ? root.scrollTop : 0;
  let scrollable = root ? root.scrollHeight > root.clientHeight : false;
  for (let p = $el[0].parentElement; p; p = p.parentElement) {
    const { overflow, overflowY } = win.getComputedStyle(p);
    if (/(auto|scroll)/.test(overflow + overflowY) && p.scrollHeight > p.clientHeight) {
      total += p.scrollTop;
      scrollable = true;
    }
  }
  return { total, scrollable };
};

/**
 * @tjBlock  canvas
 * @tjUsage  scrollOffsets('[data-cy="numberinput1-input"]').then((s) => expect(s.total).to.eq(0))
 * @tjDom    walks parentElement from the element: every ancestor whose computed overflow/overflowY is
 *           auto|scroll and whose scrollHeight > clientHeight contributes its scrollTop, plus
 *           document.scrollingElement.scrollTop. Yields a plain object { total, scrollable }.
 */
export const scrollOffsets = (selector) => cy.get(selector).first().then(($el) => readOffsets($el));

/**
 * @tjBlock  canvas
 * @tjUsage  expectScrollOffsets('[data-cy="numberinput1-input"]', (s) => expect(s.total).to.be.gt(0))
 * @tjDom    retries the callback with the same { total, scrollable } object scrollOffsets yields
 */
export const expectScrollOffsets = (selector, assertFn) =>
  cy.get(selector).first().should(($el) => assertFn(readOffsets($el)));

/**
 * @tjBlock  canvas
 * @tjUsage  resetScroll('[data-cy="numberinput1-input"]')
 * @tjDom    sets scrollTop = 0 on every ancestor of the element and on document.scrollingElement
 */
export const resetScroll = (selector) =>
  cy.get(selector).first().then(($el) => {
    const doc = $el[0].ownerDocument;
    for (let p = $el[0].parentElement; p; p = p.parentElement) p.scrollTop = 0;
    if (doc.scrollingElement) doc.scrollingElement.scrollTop = 0;
  });
