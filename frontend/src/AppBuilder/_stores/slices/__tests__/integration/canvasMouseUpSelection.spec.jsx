import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Button',
  handle: 'button1',
  id: 'button1',
  defaultProperties: { text: binding('Button') },
});

// The canvas mouseup runs before Selecto's selectEnd. A Shift+lasso released while Shift is still
// held ends on bare canvas; clearing the selection there makes the lasso replace the selection
// instead of adding to it.
describe('handleCanvasContainerMouseUp selection', () => {
  let canvas;

  beforeEach(() => {
    widget.setup();
    widget.render();
    canvas = document.createElement('div');
    canvas.id = 'real-canvas';
    canvas.setAttribute('component-id', 'canvas');
  });

  afterEach(() => widget.teardown());

  const mouseUpOnCanvas = (shiftKey) =>
    widget.session.store.act('handleCanvasContainerMouseUp', { target: canvas, shiftKey });
  const selected = () => widget.session.store.read((state) => state.selectedComponents);

  test('keeps the selection when released on the canvas with Shift held', async () => {
    await widget.session.store.act('setSelectedComponents', ['button1']);

    await mouseUpOnCanvas(true);

    expect(selected()).toEqual(['button1']);
  });

  test('clears the selection when released on the canvas without Shift', async () => {
    await widget.session.store.act('setSelectedComponents', ['button1']);

    await mouseUpOnCanvas(false);

    expect(selected()).toEqual([]);
  });
});
