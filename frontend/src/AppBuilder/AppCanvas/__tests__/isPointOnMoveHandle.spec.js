import { isPointOnMoveHandle } from '../Grid/gridUtils';

// BoundedBox and the range sliders use their body for their own gestures, so they move only from the config handle.
describe('isPointOnMoveHandle', () => {
  const elementsAt = (html, id) => {
    const root = document.createElement('div');
    root.innerHTML = html;
    document.body.appendChild(root);
    const elements = [];
    for (let element = root.querySelector(`#${id}`); element; element = element.parentElement) elements.push(element);
    return elements;
  };

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('[BoundedBox-MOVE-001] allows a move that starts on the name in the config handle', () => {
    const elements = elementsAt(
      '<div class="widget-target"><div class="config-handle"><span class="config-handle-button component-name-btn"><span id="name">boundedbox1</span></span></div><img id="image" /></div>',
      'name'
    );
    expect(isPointOnMoveHandle(elements)).toBe(true);
  });

  it('[BoundedBox-MOVE-001] refuses a move that starts on the widget body', () => {
    const elements = elementsAt(
      '<div class="widget-target"><div class="config-handle"><span id="name">boundedbox1</span></div><img id="image" /></div>',
      'image'
    );
    expect(isPointOnMoveHandle(elements)).toBe(false);
  });
});
