import { waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA AD-46: an Ant Design Funnel whose first stage is 0 labelled 'Signed up 50 (5000%)': each stage's share of the
// first was worked out against 1 put in the first's place. The pack's Funnel, @ant-design/plots and G2 are the real
// ones; the spec reads the labels G2 drew from its scene graph (jsdom paints nothing).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// The G2 that @ant-design/plots draws with, from the pack's own dependencies.
const { Runtime } = require('../../../../../../packs/antd/node_modules/@antv/g2');

const renders = jest.spyOn(Runtime.prototype, 'render');
let errors;
beforeAll(() => {
  errors = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  renders.mockRestore();
  errors.mockRestore();
});

// The label texts G2 drew on the last chart rendered.
const labels = () => {
  const chart = renders.mock.instances[renders.mock.instances.length - 1];
  const out = [];
  const walk = (node, inLabel) => {
    const here = inLabel || /label/i.test(String(node.className ?? ''));
    if (here && node.nodeName === 'text' && node.style?.text) out.push(String(node.style.text));
    (node.childNodes ?? []).forEach((child) => walk(child, here));
  };
  walk(chart.getContext().canvas.getRoot(), false);
  return out;
};

const drawn = async (data) => {
  const before = renders.mock.instances.length;
  await mountPack('antd', 'Funnel', { data });
  await waitFor(() => {
    expect(renders.mock.instances.length).toBeGreaterThan(before);
    expect(labels()).toHaveLength(data.length);
  });
  return labels();
};

describe('Ant Design Funnel: the share of the first stage', () => {
  test('[PackComponent-FUNNEL-001] a first stage of 0 gives no share: no 5000%', async () => {
    const texts = await drawn([
      { stage: 'Visited', value: 0 },
      { stage: 'Signed up', value: 50 },
    ]);

    expect(texts).toEqual(['Visited  0', 'Signed up  50']);
  });

  // Characterization: a first stage above 0 still gives each stage its share.
  test('[PackComponent-FUNNEL-002] a first stage of 100 gives 100% and 50%', async () => {
    const texts = await drawn([
      { stage: 'Visited', value: 100 },
      { stage: 'Signed up', value: 50 },
    ]);

    expect(texts).toEqual(['Visited  100 (100%)', 'Signed up  50 (50%)']);
  });
});
