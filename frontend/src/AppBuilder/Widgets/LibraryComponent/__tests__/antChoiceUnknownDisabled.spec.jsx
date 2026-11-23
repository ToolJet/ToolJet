import { act, fireEvent, waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA AD-35: an Ant Design TreeSelect, Cascader or Combobox whose value no option offers drew the raw value (zzz,
// nope / x) where Ant's Select shows its placeholder; the Combobox already exposed no selectedLabel and selectedOption
// for it. The pack's components, the inline SDK and the host renderer are the real ones; only module and CSS loading is
// replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// What the field draws: its selected items' text, and the placeholder when it shows.
const shown = (v) => ({
  items: [...v.root().querySelectorAll('.ant-select-selection-item')].map((e) => e.textContent),
  placeholder: v.root().querySelector('.ant-select-selection-placeholder')?.textContent ?? null,
});

describe('Ant Design choices: a value no option offers shows the placeholder', () => {
  test('[PackComponent-UNKNOWN-001] TreeSelect with the value zzz shows its placeholder', async () => {
    const v = await mountPack('antd', 'TreeSelect', { value: 'zzz' });

    expect(shown(v)).toEqual({ items: [], placeholder: 'Pick a team' });
  });

  test('[PackComponent-UNKNOWN-002] a multiple TreeSelect shows only the values its tree offers', async () => {
    const v = await mountPack('antd', 'TreeSelect', { value: ['frontend', 'zzz'], multiple: true });

    expect(shown(v).items).toEqual(['Frontend']);
  });

  test('[PackComponent-UNKNOWN-003] Cascader with the value [zzz] or [nope, x] shows its placeholder', async () => {
    const one = await mountPack('antd', 'Cascader', { value: ['zzz'] });
    const two = await mountPack('antd', 'Cascader', { value: ['nope', 'x'] });

    expect(shown(one)).toEqual({ items: [], placeholder: 'Pick a city' });
    expect(shown(two)).toEqual({ items: [], placeholder: 'Pick a city' });
  });

  test('[PackComponent-UNKNOWN-004] Cascader given [nope, x] by Set field value shows its placeholder', async () => {
    const v = await mountPack('antd', 'Cascader', { value: ['asia', 'japan'] });
    expect(shown(v).items).toEqual(['Asia / Japan']);

    await v.run('setFieldValue', ['nope', 'x']);

    expect(shown(v)).toEqual({ items: [], placeholder: 'Pick a city' });
  });

  test('[PackComponent-UNKNOWN-005] Combobox with the value zzz shows its placeholder, and no option is selected', async () => {
    const v = await mountPack('antd', 'Combobox', { value: 'zzz' });
    await settle();

    expect(shown(v)).toEqual({ items: [], placeholder: 'Search' });
    expect(v.exposed.selectedLabel).toBe('');
    expect(v.exposed.selectedOption).toEqual({});
  });

  test('[PackComponent-UNKNOWN-006] Combobox given zzz by Set field value shows its placeholder', async () => {
    const v = await mountPack('antd', 'Combobox', { value: 'berlin' });
    await waitFor(() => expect(v.exposed.selectedLabel).toBe('Berlin'));

    await v.run('setFieldValue', 'zzz');

    expect(shown(v)).toEqual({ items: [], placeholder: 'Search' });
    expect(v.exposed.selectedLabel).toBe('');
    expect(v.exposed.selectedOption).toEqual({});
  });

  // Characterization: a value the options offer still shows its label.
  test('[PackComponent-UNKNOWN-007] values the options offer still show their labels', async () => {
    const tree = await mountPack('antd', 'TreeSelect', { value: 'frontend' });
    const cascader = await mountPack('antd', 'Cascader', { value: ['europe', 'germany'] });
    const combobox = await mountPack('antd', 'Combobox', { value: 'berlin' });

    expect(shown(tree).items).toEqual(['Frontend']);
    expect(shown(cascader).items).toEqual(['Europe / Germany']);
    expect(shown(combobox).items).toEqual(['Berlin']);
  });
});

// QA AD-36: a TreeSelect node or Cascader option with disabled: true had no disabled look and could be picked (a
// checkable TreeSelect's too). Navigation's Tree reads its nodes the same way.
const deepAll = (selector, root = document) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(selector, el.shadowRoot));
  return found;
};
const open = async (v, selector) => {
  act(() => {
    fireEvent.mouseDown(v.root().querySelector('.ant-select-selector'));
  });
  await waitFor(() => expect(deepAll(selector).length).toBeGreaterThan(0));
};
const LOCKED_TREE = [
  { title: 'Open', value: 'o' },
  { title: 'Locked', value: 'l', disabled: true },
];

describe('Ant Design trees and cascades: a disabled node cannot be picked', () => {
  test('[PackComponent-DISABLED-001] TreeSelect draws Locked disabled, and a click on it picks nothing', async () => {
    const v = await mountPack('antd', 'TreeSelect', { treeData: LOCKED_TREE });
    await open(v, '.ant-select-tree-treenode');
    const locked = deepAll('.ant-select-tree-treenode').find((n) => n.textContent === 'Locked');

    expect(locked.classList.contains('ant-select-tree-treenode-disabled')).toBe(true);
    act(() => {
      fireEvent.click(locked.querySelector('.ant-select-tree-node-content-wrapper'));
    });
    await settle();

    expect(v.exposed.value).toBe('');
    expect(v.events).not.toContain('onChange');
  });

  test('[PackComponent-DISABLED-002] a checkable TreeSelect cannot tick Locked', async () => {
    const v = await mountPack('antd', 'TreeSelect', { treeData: LOCKED_TREE, treeCheckable: true });
    await open(v, '.ant-select-tree-treenode');
    const locked = deepAll('.ant-select-tree-treenode').find((n) => n.textContent === 'Locked');

    expect(locked.querySelector('.ant-select-tree-checkbox').classList).toContain('ant-select-tree-checkbox-disabled');
    act(() => {
      fireEvent.click(locked.querySelector('.ant-select-tree-checkbox'));
    });
    await settle();

    expect(v.exposed.value).toEqual([]);
  });

  test('[PackComponent-DISABLED-003] Cascader draws Locked disabled, and a click on it picks nothing', async () => {
    const v = await mountPack('antd', 'Cascader', {
      options: [
        { label: 'Open', value: 'o' },
        { label: 'Locked', value: 'l', disabled: true },
      ],
    });
    await open(v, '.ant-cascader-menu-item');
    const locked = deepAll('.ant-cascader-menu-item').find((n) => n.textContent === 'Locked');

    expect(locked.classList.contains('ant-cascader-menu-item-disabled')).toBe(true);
    act(() => {
      fireEvent.click(locked);
    });
    await settle();

    expect(v.exposed.value).toEqual([]);
  });

  test('[PackComponent-DISABLED-004] Navigation Tree draws a disabled node disabled, and a click on it selects nothing', async () => {
    const v = await mountPack('antd', 'Tree', {
      treeData: [
        { title: 'Open', key: 'o' },
        { title: 'Locked', key: 'l', disabled: true },
      ],
    });
    const locked = [...v.root().querySelectorAll('.ant-tree-treenode')].find((n) => n.textContent === 'Locked');

    expect(locked.classList.contains('ant-tree-treenode-disabled')).toBe(true);
    act(() => {
      fireEvent.click(locked.querySelector('.ant-tree-node-content-wrapper'));
    });
    await settle();

    expect(v.exposed.selectedKeys).toEqual([]);
  });
});
