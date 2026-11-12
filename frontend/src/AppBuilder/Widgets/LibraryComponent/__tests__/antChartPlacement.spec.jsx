import { waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// Where Ant charts draw their value labels and figures. The pack's charts, @ant-design/plots and G2 are the real ones;
// the spec reads the boxes G2 laid out in its scene graph (jsdom paints nothing). Text is measured at 0.6em a
// character, about what the browser's sans-serif digits measure.
// - QA DVRL-80: a Scatter's value labels sat on their points and hid the markers (label box 940-956 over the marker at
//   948-954).
// - QA DVRL-82: a small Gauge's figure ran into the needle hub (text top 898, hub bottom 903), a currency figure
//   ($1,234,567.00, 187px in a 223px box) ran past the dial, and the Gauge had no currency property.
// - QA DVRL-83: a Funnel whose values are all 0 drew its labels at the plot's left edge, cut off ('ed 0 (0%)').
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// The G2 that @ant-design/plots draws with, from the pack's own dependencies.
const { Runtime } = require('../../../../../../packs/antd/node_modules/@antv/g2');

const renders = jest.spyOn(Runtime.prototype, 'render');
const realGetContext = HTMLCanvasElement.prototype.getContext;
let errors;
beforeAll(() => {
  errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  HTMLCanvasElement.prototype.getContext = function getContext() {
    const ctx = {
      font: '12px sans-serif',
      measureText(text) {
        const px = Number(/([\d.]+)px/.exec(ctx.font)?.[1] ?? 12);
        return { width: String(text).length * px * 0.6 };
      },
    };
    return new Proxy(ctx, { get: (target, key) => (key in target ? target[key] : () => ({ data: [] })) });
  };
});
afterAll(() => {
  renders.mockRestore();
  errors.mockRestore();
  HTMLCanvasElement.prototype.getContext = realGetContext;
});

// Every box size reads `size` while a test sets one: G2 fits its canvas to its container's clientWidth/clientHeight.
let size = null;
const sizeProps = ['clientWidth', 'clientHeight'];
const realSize = Object.fromEntries(sizeProps.map((p) => [p, Object.getOwnPropertyDescriptor(Element.prototype, p)]));
beforeAll(() => {
  for (const p of sizeProps) {
    Object.defineProperty(Element.prototype, p, {
      configurable: true,
      get() {
        return size ? size[p === 'clientWidth' ? 0 : 1] : realSize[p].get.call(this);
      },
    });
  }
});
afterAll(() => sizeProps.forEach((p) => Object.defineProperty(Element.prototype, p, realSize[p])));
afterEach(() => {
  size = null;
});

const box = (node) => {
  const b = node.getBounds();
  return { left: b.min[0], top: b.min[1], right: b.max[0], bottom: b.max[1] };
};
// The nodes of the last chart G2 rendered, in drawing order.
const nodes = () => {
  const chart = renders.mock.instances[renders.mock.instances.length - 1];
  const out = [];
  const walk = (node, label) => {
    const here = label || /(^|\s)label(\s|$)/.test(String(node.className ?? ''));
    out.push({ node, label: here, className: String(node.className ?? '') });
    (node.childNodes ?? []).forEach((child) => walk(child, here));
  };
  walk(chart.getContext().canvas.getRoot(), false);
  return out;
};
const labelTexts = () => nodes().filter((n) => n.label && n.node.nodeName === 'text' && n.node.style?.text);
const drawn = async (name, props, ready) => {
  const before = renders.mock.instances.length;
  await mountPack('antd', name, props);
  await waitFor(() => {
    expect(renders.mock.instances.length).toBeGreaterThan(before);
    expect(ready()).toBe(true);
  });
};

describe('Ant Design Scatter value labels', () => {
  test('[PackComponent-ANTCHART-001] sit above their points, clear of the markers and inside the chart', async () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 30 },
      { x: 3, y: 20 },
    ];
    await drawn('Scatter', { data, label: true }, () => labelTexts().length === 3);
    const points = nodes()
      .filter((n) => n.className === 'element' && n.node.nodeName === 'path')
      .map((n) => box(n.node));
    expect(points).toHaveLength(3);
    for (const label of labelTexts().map((n) => box(n.node))) {
      const centre = (label.left + label.right) / 2;
      const point = points.find((p) => p.left <= centre && centre <= p.right);
      expect(point).toBeDefined();
      expect(label.bottom).toBeLessThanOrEqual(point.top);
      // The highest point's label too: it sat on the plot's top edge, its label above the chart.
      expect(label.top).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Ant Design Gauge figure', () => {
  // The figure: the text G2 draws in the Gauge's text mark (axis tick labels sit in label groups of their own).
  const figureText = () =>
    nodes().filter(
      (n) => n.node.nodeName === 'text' && !n.label && n.node.style?.text && n.node.parentNode?.className === 'element'
    );
  const hub = () => nodes().find((n) => n.node.nodeName === 'circle');

  test('[PackComponent-ANTCHART-002] in a small gauge sits below the needle hub', async () => {
    size = [223, 230];
    await drawn('Gauge', {}, () => figureText().length === 1 && !!hub());
    expect(figureText()[0].node.style.text).toBe('72');
    await waitFor(() => expect(box(figureText()[0].node).top).toBeGreaterThanOrEqual(box(hub().node).bottom));
  });

  test('[PackComponent-ANTCHART-003] fits a long currency figure inside the dial', async () => {
    size = [223, 230];
    await drawn('Gauge', { target: 1234567, total: 2000000, formatter: 'currency' }, () => figureText().length === 1);
    expect(figureText()[0].node.style.text).toBe('$1,234,567.00');
    // The figure is sized once the chart's box is measured: G2 draws it again.
    await waitFor(() => {
      const text = box(figureText()[0].node);
      const arcs = nodes()
        .filter((n) => n.className === 'element' && n.node.nodeName === 'path')
        .map((n) => box(n.node));
      // Within the dial's width, and over none of its tick labels (it ran over the '2000000' at the end).
      expect(text.left).toBeGreaterThanOrEqual(Math.min(...arcs.map((a) => a.left)));
      expect(text.right).toBeLessThanOrEqual(Math.max(...arcs.map((a) => a.right)));
      const ticks = nodes()
        .filter((n) => n.node.nodeName === 'text' && /axis-label-item/.test(n.className))
        .map((n) => ({ text: n.node.style.text, ...box(n.node) }));
      expect(ticks.length).toBeGreaterThan(0);
      const over = ticks.filter(
        (t) => t.left < text.right && text.left < t.right && t.top < text.bottom && text.top < t.bottom
      );
      expect(over.map((t) => t.text)).toEqual([]);
    });
  });

  test('[PackComponent-ANTCHART-004] takes a currency for the currency formatter', async () => {
    await drawn(
      'Gauge',
      { target: 1250, total: 2000, formatter: 'currency', currency: 'EUR' },
      () => figureText().length === 1
    );
    const text = figureText()[0].node.style.text;
    expect(text).toContain('€');
    expect(text).not.toContain('$');
  });
});

describe('Ant Design Funnel labels', () => {
  test('[PackComponent-ANTCHART-005] stay inside the chart when every value is 0', async () => {
    const data = [
      { stage: 'Visited', value: 0 },
      { stage: 'Signed up', value: 0 },
      { stage: 'Paid', value: 0 },
    ];
    await drawn('Funnel', { data }, () => labelTexts().length === 3);
    const canvas = renders.mock.instances[renders.mock.instances.length - 1].getContext().canvas;
    const width = canvas.getConfig().width;
    for (const label of labelTexts().map((n) => box(n.node))) {
      expect(label.left).toBeGreaterThanOrEqual(0);
      expect(label.right).toBeLessThanOrEqual(width);
    }
  });
});
