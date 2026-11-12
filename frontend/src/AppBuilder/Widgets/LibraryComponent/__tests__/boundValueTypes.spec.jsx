import React from 'react';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { typedPackProps } from '@/AppBuilder/Widgets/LibraryComponent/packPropertyTypes';

installBrowserStubs();

// A pack property can be bound to anything a query returns, so a binding can hand it a value of the wrong type: a
// query row bound to a text property, a number to a label, an empty binding ({{null}}, {{''}}, a query that has not
// run) to a number (QA items 14-17). A text property given an object crashed the widget (React cannot render an
// object) or showed [object Object]. The pack host now hands each property a value of the type its manifest declares
// (packPropertyTypes.ts), as it does here; the pack components, the inline SDK and the host renderer are the real
// ones, and only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// The types the properties used here declare, as the packs' manifests list them.
const PROP_TYPES = [
  { name: 'label', type: 'string' },
  { name: 'defaultValue', type: 'number' },
  { name: 'value', type: 'number' },
];
const ARRAY_VALUE = [{ name: 'value', type: 'array' }];

const packs = {
  antd: require('../../../../../../packs/antd/src/index.ts'),
  shadcn: require('../../../../../../packs/shadcn/src/index.ts'),
  mui: require('../../../../../../packs/mui/src/index.ts'),
};

let mounts = 0;
const mount = async (pack, name, bound, manifestProps = PROP_TYPES) => {
  loadLibraryModule.mockResolvedValue(packs[pack]);
  const { props } = typedPackProps(pack, name, manifestProps, bound);
  mounts += 1;
  const exposed = {};
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`${pack}.js`}
      cssUrl={`${pack}.css`}
      cacheKey={`bound-value-types-${pack}`}
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name, {})}
      dataCy={`typed-${mounts}`}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="typed-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.tj-cc-root')?.childElementCount).toBeGreaterThan(0));
  return { root: root(), exposed, view };
};

const textOf = (root) => root.querySelector('.tj-cc-root').textContent;

describe('a text property bound to a value that is not text', () => {
  const inputs = [
    ['shadcn', 'Input'],
    ['antd', 'Input'],
    ['mui', 'TextField'],
  ];

  describe.each(inputs)('%s %s', (pack, name) => {
    it.each([
      ['a query row', { id: 7, name: 'Ada' }],
      ["a query's rows", [{ id: 7, name: 'Ada' }]],
    ])('shows an empty label for %s, without crashing', async (_, label) => {
      const { root } = await mount(pack, name, { label });
      expect(textOf(root)).not.toMatch(/\[object Object\]|Ada/);
    });

    it('shows a number as its digits', async () => {
      const { root } = await mount(pack, name, { label: 42 });
      expect(textOf(root)).toContain('42');
    });
  });
});

describe('a number property bound to nothing', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ["''", ''],
  ])('leaves the Rocket Number Input empty for %s', async (_, defaultValue) => {
    const { root, exposed } = await mount('shadcn', 'NumberInput', { defaultValue });
    await waitFor(() => expect(exposed).toHaveProperty('value'));
    expect(exposed.value).toBeNull();
    expect(root.querySelector('input').value).toBe('');
  });

  it('takes a number written as text', async () => {
    const { root, exposed } = await mount('shadcn', 'NumberInput', { defaultValue: '5' });
    await waitFor(() => expect(exposed.value).toBe(5));
    expect(root.querySelector('input').value).toMatch(/^5/);
  });

  it('still starts at its sample value when the property is never set', async () => {
    const { exposed } = await mount('shadcn', 'NumberInput', {});
    await waitFor(() => expect(exposed.value).toBe(1));
  });
});

// Properties that take more than one type on purpose (packPropertyTypes' list) keep taking them.
describe('a property that takes an array on purpose', () => {
  it("keeps a Rocket Slider range's two numbers", async () => {
    const { exposed } = await mount('shadcn', 'Slider', { defaultValue: [20, 80] });
    await waitFor(() => expect(exposed.value).toEqual([20, 80]));
  });

  it("keeps an Ant Range Picker's two dates", async () => {
    const { exposed } = await mount('antd', 'RangePicker', { value: ['2026-01-05', '2026-01-09'] }, ARRAY_VALUE);
    await waitFor(() => expect(exposed.value).toEqual(['2026-01-05', '2026-01-09']));
  });

  it("keeps a multiple Ant Select's values", async () => {
    const options = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b' },
    ];
    const { exposed } = await mount('antd', 'Select', { mode: 'multiple', options, value: ['a', 'b'] }, [
      { name: 'mode', type: 'enumeration' },
      { name: 'options', type: 'array' },
      { name: 'value', type: 'string' },
    ]);
    await waitFor(() => expect(exposed.value).toEqual(['a', 'b']));
  });

  // A path its options hold: one they do not is dropped, as the Select drops a value no option offers (QA AD-57).
  it("keeps an Ant Cascader's path", async () => {
    const { exposed } = await mount('antd', 'Cascader', { value: ['asia', 'japan'] }, ARRAY_VALUE);
    await waitFor(() => expect(exposed.value).toEqual(['asia', 'japan']));
  });

  // QA NEW-1 and DVRL-56: these are declared as text and take a list too. Missing from the list of such properties,
  // a bound list was emptied: nothing pressed, no range, no facts, no sparkline.
  it("keeps a multiple Ant ButtonGroup's values", async () => {
    const { exposed } = await mount('antd', 'ButtonGroup', { mode: 'multiple', value: ['day', 'week'] }, [
      { name: 'mode', type: 'enumeration' },
      { name: 'value', type: 'string' },
    ]);
    await waitFor(() => expect(exposed.value).toEqual(['day', 'week']));
  });

  it("keeps a multiple Rocket ButtonGroup's default selection", async () => {
    const { exposed } = await mount('shadcn', 'ButtonGroup', { mode: 'multiple', defaultValue: ['day', 'month'] }, [
      { name: 'mode', type: 'enumeration' },
      { name: 'defaultValue', type: 'string' },
    ]);
    await waitFor(() => expect(exposed.selected).toEqual(['day', 'month']));
  });

  it("keeps a Rocket Calendar range's start and end", async () => {
    const { exposed } = await mount(
      'shadcn',
      'Calendar',
      { mode: 'range', defaultValue: ['2026-03-02', '2026-03-05'] },
      [
        { name: 'mode', type: 'enumeration' },
        { name: 'defaultValue', type: 'string' },
      ]
    );
    await waitFor(() => expect([exposed.startDate, exposed.endDate]).toEqual(['2026-03-02', '2026-03-05']));
  });

  it("keeps a Rocket Hero's aside facts", async () => {
    const { root } = await mount('shadcn', 'Hero', { asideValue: ['Fact A', 'Fact B'] }, [
      { name: 'asideValue', type: 'string' },
    ]);
    await waitFor(() => expect(textOf(root)).toContain('Fact A'));
    expect(textOf(root)).toContain('Fact B');
  });

  it.each([
    ['numbers', [3, 5, 4, 8]],
    [
      'points',
      [
        { x: 1, y: 3 },
        { x: 2, y: 5 },
        { x: 3, y: 4 },
        { x: 4, y: 8 },
      ],
    ],
  ])("draws a Rocket Stat's trend from a list of %s", async (_, trendData) => {
    const { root } = await mount('shadcn', 'Stat', { trendData }, [{ name: 'trendData', type: 'string' }]);
    await waitFor(() => expect(root.querySelector('.ui-stat-spark path')?.getAttribute('d')).toBeTruthy());
  });
});

// The other properties declared as text that the packs read as a list as well (a field list, values to highlight),
// found by reading every pack component for one: a bound list reaches them as it is.
describe.each([
  ['shadcn', 'AreaChart', 'yFields'],
  ['shadcn', 'BarChart', 'yFields'],
  ['shadcn', 'BarChart', 'highlight'],
  ['shadcn', 'LineChart', 'yFields'],
  ['shadcn', 'LineChart', 'dashedFields'],
  ['shadcn', 'RadarChart', 'yFields'],
  ['shadcn', 'ComboChart', 'barFields'],
  ['shadcn', 'ComboChart', 'lineFields'],
  ['shadcn', 'CardGrid', 'badgeFields'],
  ['shadcn', 'CardGrid', 'metaFields'],
  ['shadcn', 'RecordList', 'metaFields'],
  ['mui', 'RecordList', 'metaFields'],
  ['shadcn', 'Map', 'popupFields'],
  ['antd', 'Map', 'popupFields'],
])('%s %s %s bound to a list', (pack, component, prop) => {
  it('takes the list as it is', () => {
    const { props, errors } = typedPackProps(pack, component, [{ name: prop, type: 'string' }], {
      [prop]: ['revenue', 'cost'],
    });
    expect(props[prop]).toEqual(['revenue', 'cost']);
    expect(errors).toEqual([]);
  });
});
