import { isPointerOnDragHandle } from '../gridUtils';

// RangeSlider, RangeSliderV2 and BoundedBox use their body for sliding or drawing, so the canvas moves them only
// from their name badge (the config handle).
describe('isPointerOnDragHandle', () => {
  const elementsUnder = (html, id) => {
    document.body.innerHTML = html;
    const elements = [];
    for (let el = document.getElementById(id); el; el = el.parentElement) elements.push(el);
    return elements;
  };

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('[Grid-DRAG-001] accepts a drag that starts on the name badge', () => {
    // Break this catches: looking for a handle class the config handle no longer renders, so these widgets
    // can never be moved by mouse.
    const elements = elementsUnder(
      '<div class="config-handle"><span class="badge"><span id="name">boundedbox1</span></span></div>',
      'name'
    );
    expect(isPointerOnDragHandle(elements)).toBe(true);
  });

  it('[Grid-DRAG-001] rejects a drag that starts on the widget body', () => {
    const elements = elementsUnder('<div class="bounded-box"><img id="image" /></div>', 'image');
    expect(isPointerOnDragHandle(elements)).toBe(false);
  });
});
