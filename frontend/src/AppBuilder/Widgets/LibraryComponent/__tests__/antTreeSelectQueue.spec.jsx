import { fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Ant Design TreeSelect QA queue (fix/ant-design-bugs-1.0). The pack's TreeSelect, the inline SDK and the host renderer
// are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// The list opens in the pack's popup layer, inside a shadow root.
const findAllDeep = (selector, root = document, out = []) => {
  out.push(...root.querySelectorAll(selector));
  root.querySelectorAll('*').forEach((el) => el.shadowRoot && findAllDeep(selector, el.shadowRoot, out));
  return out;
};

const openGroups = () => findAllDeep('.ant-select-tree-switcher_open').length;

const openList = async (v) => {
  fireEvent.mouseDown(v.root().querySelector('.ant-select-selector'));
  await settle();
};

describe('Ant Design TreeSelect: Expand all by default changed after load', () => {
  // Break this catches: Ant reads treeDefaultExpandAll only when it mounts, so turning it off later leaves every group
  // open.
  test('[PackComponent-ANTTREESELECT-001] turning Expand all off after load opens the list with its groups closed', async () => {
    const v = await mountPack('antd', 'TreeSelect', { treeDefaultExpandAll: true });
    await settle();
    await openList(v);
    expect(openGroups()).toBeGreaterThan(0);

    fireEvent.keyDown(v.root().querySelector('input'), { key: 'Escape' });
    await settle();
    await v.update({ props: { treeDefaultExpandAll: false } });
    await settle();
    await openList(v);

    expect(openGroups()).toBe(0);
  });
});

describe('Ant Design TreeSelect and Cascader: a clear after a dropped value', () => {
  const design = { title: 'Design', label: 'Design', value: 'design' };
  const qa = { title: 'QA', label: 'QA', value: 'qa' };

  // Break this catches: a value cleared after the drop comes back when the tree later offers the dropped one.
  test('[PackComponent-ANTTREESELECT-002] TreeSelect cleared after the drop stays empty when the node arrives', async () => {
    const v = await mountPack('antd', 'TreeSelect', { value: 'qa', treeData: [design] }, { actions: new Map() });
    await settle();
    expect(v.exposed.value).toBe('');
    await v.run('setFieldValue', '');
    await settle();

    await v.update({ props: { value: 'qa', treeData: [design, qa] } });
    await settle();

    expect(v.exposed.value).toBe('');
  });

  // Break this catches: a path cleared after the drop comes back when the options later hold the dropped one.
  test('[PackComponent-ANTTREESELECT-003] Cascader cleared after the drop stays empty when the path arrives', async () => {
    const v = await mountPack('antd', 'Cascader', { value: ['qa'], options: [design] }, { actions: new Map() });
    await settle();
    expect(v.exposed.value).toEqual([]);
    await v.run('setFieldValue', []);
    await settle();

    await v.update({ props: { value: ['qa'], options: [design, qa] } });
    await settle();

    expect(v.exposed.value).toEqual([]);
  });
});
