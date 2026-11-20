import { waitFor, fireEvent, screen } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Engineering scenarios for the BoundedBox widget.
// Contract: frontend/ee/test/app-builder/widgets/BoundedBox/TESTING.md.
// jsdom never loads images or lays out boxes, so the spec fires the img `load`
// event and fixes getBoundingClientRect (browser geometry boundary only).

const ID = 'boundedbox1';

const widget = createWidgetHarness({
  componentType: 'BoundedBox',
  handle: ID,
  id: ID,
  defaultProperties: {
    imageUrl: binding('https://example.com/three-cars.jpg'),
    defaultValue: binding(
      "{{[{type:'RECTANGLE',x:41,y:62,width:40,height:24,text:'Car'},{type:'POINT',x:20,y:30,width:0,height:0,text:'Tree'}]}}"
    ),
    selector: binding('RECTANGLE'),
    labels: binding("{{['Car','Tree']}}"),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: {
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const image = () => document.querySelector('.bounded-box img');

let rectSpy;

describe('BoundedBox widget', () => {
  beforeEach(() => {
    widget.setup();
    rectSpy = jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ width: 200, height: 100, top: 0, left: 0, right: 200, bottom: 100, x: 0, y: 0 });
  });

  afterEach(() => {
    rectSpy.mockRestore();
    widget.teardown();
  });

  test('[BoundedBox-DEF-001] saved default annotations are exposed once the image loads', async () => {
    // Break this catches: BoundedBox.jsx finding the image/wrapper by generated styled-components
    // class names, so the load listener never attaches and `annotations` stays empty.
    widget.render({});
    await waitFor(() => expect(image()).toBeInTheDocument());

    fireEvent.load(image());

    await waitFor(() => expect(exposed().annotations.map((a) => a.type)).toEqual(['RECTANGLE', 'POINT']));
    expect(exposed().annotations).toMatchObject([
      { type: 'RECTANGLE', x: 41, y: 62, width: 40, height: 24, text: 'Car', id: expect.any(String) },
      { type: 'POINT', x: 20, y: 30, width: 0, height: 0, text: 'Tree', id: expect.any(String) },
    ]);
    expect(await screen.findByText('Tree')).toBeInTheDocument();
    expect(screen.getByText('Car')).toBeInTheDocument();
  });

  test('[BoundedBox-FIT-001] a loaded image is scaled to fit inside the widget box, keeping its shape', async () => {
    // Break this catches: fitting the image with CSS keyed on generated class hashes the build no longer
    // emits, so a tall image is drawn taller than its box and covers the widgets below.
    widget.render({});
    await waitFor(() => expect(image()).toBeInTheDocument());
    Object.defineProperty(image(), 'naturalWidth', { configurable: true, value: 200 });
    Object.defineProperty(image(), 'naturalHeight', { configurable: true, value: 400 });

    fireEvent.load(image());

    // The box is 200x100 (mocked layout), so a 200x400 image fits at 50x100.
    await waitFor(() => expect(image()).toHaveStyle({ width: '50px', height: '100px' }));
  });
});
