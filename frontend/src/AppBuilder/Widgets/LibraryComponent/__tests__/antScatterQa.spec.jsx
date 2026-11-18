import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Scatter. The pack's Scatter, the inline SDK and the host renderer are
// the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// jsdom has no canvas: the plots are fakes that record the config the pack gives them.
jest.mock('../../../../../../packs/antd/node_modules/@ant-design/plots', () => {
  const React = require('react');
  global.__plotProps = [];
  const fake = (name) => (props) => {
    global.__plotProps.push({ name, props });
    return React.createElement('div', { 'data-fake-plot': name });
  };
  const names = ['Area', 'Bar', 'Column', 'DualAxes', 'Funnel', 'Gauge', 'Heatmap', 'Line', 'Pie', 'Radar', 'Scatter'];
  return {
    __esModule: true,
    ...Object.fromEntries(names.map((n) => [n, fake(n)])),
    RadialBar: fake('RadialBar'),
    Tiny: { Line: fake('Tiny.Line'), Area: fake('Tiny.Area'), Column: fake('Tiny.Column') },
  };
});

afterEach(() => {
  document.body.innerHTML = '';
  global.__plotProps.length = 0;
});

const lastScatter = () => [...global.__plotProps].reverse().find((p) => p.name === 'Scatter').props;
const data = [
  { x: 1, a: 2, b: 3, size: 5 },
  { x: 2, a: 4, b: 6, size: 7 },
];

// PF-237: with several Y fields (['a', 'b']) the Scatter drew only the first, one colour and no legend, though the Y
// field help says each is a series (Column, Line, Area and Radar draw one per field). Each Y field is now a series in its
// own colour; one Y field, or a Color field, draws as before.
describe('Ant Design Scatter with several Y fields', () => {
  test('[PackComponent-SCATTER-001] each Y field is a series, every point kept', async () => {
    await mountPack('antd', 'Scatter', { data, xField: 'x', yField: ['a', 'b'], sizeField: 'size' });
    const props = lastScatter();

    expect(props.yField).toBe('value');
    expect(props.colorField).toBe('series');
    expect(props.data.map((d) => [d.x, d.series, d.value, d.size])).toEqual([
      [1, 'a', 2, 5],
      [1, 'b', 3, 5],
      [2, 'a', 4, 7],
      [2, 'b', 6, 7],
    ]);
  });

  test('[PackComponent-SCATTER-002] one Y field draws as before', async () => {
    await mountPack('antd', 'Scatter', { data, xField: 'x', yField: 'a' });
    const props = lastScatter();

    expect(props.yField).toBe('a');
    expect(props.colorField).toBeUndefined();
    expect(props.data).toHaveLength(2);
  });

  test('[PackComponent-SCATTER-003] with a Color field the first Y field is drawn, grouped by it', async () => {
    await mountPack('antd', 'Scatter', {
      data: data.map((d, i) => ({ ...d, g: i ? 'two' : 'one' })),
      xField: 'x',
      yField: ['a', 'b'],
      colorField: 'g',
    });
    const props = lastScatter();

    expect(props.yField).toBe('a');
    expect(props.colorField).toBe('g');
  });
});
