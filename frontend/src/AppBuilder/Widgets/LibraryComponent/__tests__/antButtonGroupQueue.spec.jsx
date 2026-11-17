import fs from 'fs';
import path from 'path';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Ant Design ButtonGroup QA queue (fix/ant-design-bugs-1.0). The pack's ButtonGroup, the inline SDK and the host
// renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Ant Design ButtonGroup: Block', () => {
  // Break this catches: the loading wrapper around the group is inline-block, so it shrinks to the buttons and Block
  // cannot stretch them to the box width.
  test('[PackComponent-ANTBUTTONGROUP-001] with Block on, the group sits in a full-width wrapper', async () => {
    const v = await mountPack('antd', 'ButtonGroup', { block: true });
    await settle();

    const group = v.root().querySelector('.ant-space-compact');
    expect(group.closest('.tj-ant-spin-inline')).toBeNull();
    expect(group.closest('.tj-ant-spin-block')).not.toBeNull();
  });
});

describe('Ant Design ButtonGroup: Mode changed by a binding', () => {
  // Break this catches: in actions mode the group clears Value for good, so when Mode becomes single the configured
  // Value (week) is not picked.
  test('[PackComponent-ANTBUTTONGROUP-002] Value is picked when Mode turns from actions to single, firing nothing', async () => {
    const v = await mountPack('antd', 'ButtonGroup', { value: 'week', mode: 'actions' });
    await settle();
    expect(v.exposed.value).toBe('');

    await v.update({ props: { value: 'week', mode: 'single' } });
    await settle();

    expect(v.exposed.value).toBe('week');
    expect(v.events).toEqual([]);
  });
});

describe('Ant Design ButtonGroup: the Type field in the Inspector', () => {
  // The editor hides the fx toggle on any field labelled exactly "Type" (shared SingleLineCodeEditor rule). Break this
  // catches: the ButtonGroup's type property is labelled "Type" again.
  test('[PackComponent-ANTBUTTONGROUP-003] the type property is not labelled "Type", so it keeps its fx toggle', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../../../../../../packs/antd/src/components/Composite.tsx'),
      'utf8'
    );
    const group = src.slice(src.indexOf('export const ButtonGroup'));
    const typeHook = group.slice(group.indexOf("name: 'type'"), group.indexOf("name: 'type'") + 80);

    expect(typeHook).toMatch(/label: 'Button type'/);
  });
});
