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

describe('Ant Design ButtonGroup: values whose type changes', () => {
  // Break this catches: buttons going from the text '1' to the number 1 look like the same buttons, so the value stays
  // the text '1' and a query comparing it with the number 1 stops matching.
  test('[PackComponent-ANTBUTTONGROUP-003] buttons changed from text 1 to number 1 expose the number', async () => {
    const v = await mountPack('antd', 'ButtonGroup', { mode: 'single', value: '1', buttons: ['1', '2'] });
    await settle();
    expect(v.exposed.value).toBe('1');

    await v.update({ props: { mode: 'single', value: '1', buttons: [1, 2] } });
    await settle();

    expect(v.exposed.value).toBe(1);
  });
});

describe('Ant Design ButtonGroup: a clear after a dropped value', () => {
  // Break this catches: a value cleared after the drop comes back when a button later offers the dropped one.
  test('[PackComponent-ANTBUTTONGROUP-004] Clear after the drop keeps no selection when the button arrives', async () => {
    const v = await mountPack(
      'antd',
      'ButtonGroup',
      { mode: 'single', value: 'qa', buttons: ['design'] },
      { actions: new Map() }
    );
    await settle();
    expect(v.exposed.value).toBe('');
    await v.run('clear');
    await settle();

    await v.update({ props: { mode: 'single', value: 'qa', buttons: ['design', 'qa'] } });
    await settle();

    expect(v.exposed.value).toBe('');
  });
});
