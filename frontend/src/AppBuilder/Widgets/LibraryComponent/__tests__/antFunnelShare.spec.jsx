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

// QA PF-230: the Color field was declared but never passed on, so the stages kept one colour each whatever it named.
describe('Ant Design Funnel: Color field', () => {
  const STAGES = [
    { stage: 'Visited', value: 100, g: 'north' },
    { stage: 'Signed up', value: 70, g: 'south' },
    { stage: 'Trial', value: 40, g: 'north' },
    { stage: 'Paid', value: 20, g: 'south' },
  ];
  // The fill of each stage G2 drew on the last chart rendered.
  const fills = () => {
    const chart = renders.mock.instances[renders.mock.instances.length - 1];
    const out = [];
    const walk = (node) => {
      if (String(node.className ?? '') === 'element' && node.style?.fill) out.push(String(node.style.fill));
      (node.childNodes ?? []).forEach(walk);
    };
    walk(chart.getContext().canvas.getRoot());
    return out;
  };
  const stageFills = async (props) => {
    const before = renders.mock.instances.length;
    await mountPack('antd', 'Funnel', { data: STAGES, ...props });
    await waitFor(() => {
      expect(renders.mock.instances.length).toBeGreaterThan(before);
      expect(fills()).toHaveLength(STAGES.length);
    });
    return fills();
  };

  test('[PackComponent-FUNNEL-003] a Color field colours the stages by its group', async () => {
    const f = await stageFills({ colorField: 'g' });
    expect(new Set(f).size).toBe(2);
    expect(f[0]).toBe(f[2]);
    expect(f[1]).toBe(f[3]);
  });

  test('[PackComponent-FUNNEL-004] without one, each stage takes its own colour', async () => {
    expect(new Set(await stageFills({})).size).toBe(4);
  });
});

// The stage labels were always white: Text color changed nothing on a Funnel. A set Text color now draws them; unset,
// they stay white (turned dark by G2 where a stage is too narrow to hold them).
describe('Ant Design Funnel: Text color', () => {
  const DATA = [
    { stage: 'Visited', value: 100 },
    { stage: 'Signed up', value: 80 },
  ];
  const labelFills = () => {
    const chart = renders.mock.instances[renders.mock.instances.length - 1];
    const out = [];
    const walk = (node, inLabel) => {
      const here = inLabel || /label/i.test(String(node.className ?? ''));
      if (here && node.nodeName === 'text' && node.style?.text) out.push(String(node.style.fill));
      (node.childNodes ?? []).forEach((child) => walk(child, here));
    };
    walk(chart.getContext().canvas.getRoot(), false);
    return out;
  };
  const fillsWith = async (styles) => {
    const before = renders.mock.instances.length;
    await mountPack('antd', 'Funnel', { data: DATA }, { styles });
    await waitFor(() => {
      expect(renders.mock.instances.length).toBeGreaterThan(before);
      expect(labelFills()).toHaveLength(DATA.length);
    });
    return labelFills();
  };

  test('[PackComponent-FUNNEL-005] a set Text color draws the stage labels', async () => {
    // The chart theme's text (the style read as a colour; jsdom resolves no var(), so it reads Ant's stock text here),
    // not the white or black G2's contrast rule picks.
    const fills = await fillsWith({ colorText: '#ff0000' });
    fills.forEach((fill) => expect(fill).toBe('rgba(0, 0, 0, 0.88)'));
  });

  test('[PackComponent-FUNNEL-006] unset, the stage labels are white, or black where G2 finds white unreadable', async () => {
    (await fillsWith({})).forEach((fill) => expect(['#fff', '#000']).toContain(fill));
  });
});
