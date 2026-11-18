import { syncSelectionCorner } from '../selectionCorner';

// A flex child inside `.flex-container-widget` (the box that clips its children to its rounded inner corner).
const flexChild = (boxStyle) => {
  const box = document.createElement('div');
  box.className = 'flex-container-widget';
  Object.assign(box.style, boxStyle);
  const canvas = document.createElement('div');
  canvas.className = 'flex-container-canvas';
  const child = document.createElement('div');
  canvas.appendChild(child);
  box.appendChild(canvas);
  document.body.appendChild(box);
  return child;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('syncSelectionCorner', () => {
  it("rounds a flex child's selection to the container's inner corner, so the clip cannot cut it", () => {
    const child = flexChild({ borderRadius: '6px', borderTopWidth: '1px', borderStyle: 'solid' });
    syncSelectionCorner(child);
    expect(child.style.getPropertyValue('--tj-selection-corner')).toBe('5px');
  });

  it('follows a card style with a larger radius', () => {
    const child = flexChild({ borderRadius: '14px', borderTopWidth: '1px', borderStyle: 'solid' });
    syncSelectionCorner(child);
    expect(child.style.getPropertyValue('--tj-selection-corner')).toBe('13px');
  });

  it('keeps square corners in a square container, and leaves widgets outside flex containers alone', () => {
    const square = flexChild({ borderRadius: '0px' });
    syncSelectionCorner(square);
    expect(square.style.getPropertyValue('--tj-selection-corner')).toBe('0px');
    const loose = document.createElement('div');
    document.body.appendChild(loose);
    syncSelectionCorner(loose);
    syncSelectionCorner(null);
    expect(loose.style.getPropertyValue('--tj-selection-corner')).toBe('');
  });
});
