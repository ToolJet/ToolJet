import { isPointerOverCanvasArea } from '../gridUtils';

// While the right sidebar is open and the canvas is scrolled part-way, the canvas
// area's bounding rect still extends underneath the sidebar (the rect ignores the
// scroll container's clipping). A new-component drag starting over the sidebar must
// not count as 'over the canvas', otherwise the ghost is placed for the pre-collapse
// layout and drifts right when the sidebar closes and the canvas shifts.
describe('isPointerOverCanvasArea', () => {
  let canvasArea;
  let sidebar;

  beforeEach(() => {
    canvasArea = document.createElement('div');
    canvasArea.className = 'tj-canvas-area';
    canvasArea.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 1800,
      bottom: 1200,
      width: 1800,
      height: 1200,
    });
    const canvasChild = document.createElement('div');
    canvasArea.appendChild(canvasChild);
    sidebar = document.createElement('div');
    document.body.append(canvasArea, sidebar);

    // jsdom does not implement hit-testing; the sidebar covers x >= 1500.
    document.elementFromPoint = jest.fn((x) => (x >= 1500 ? sidebar : canvasChild));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    delete document.elementFromPoint;
  });

  it('is false over the sidebar even where the canvas area rect extends underneath it', () => {
    expect(isPointerOverCanvasArea(1600, 400)).toBe(false);
  });

  it('is true over visible canvas content', () => {
    expect(isPointerOverCanvasArea(800, 400)).toBe(true);
  });
});
