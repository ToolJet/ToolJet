import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Table. The pack's Table, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const rows = [1, 2, 3, 4].map((id) => ({ id, name: `Row ${id}` }));
const columns = [{ title: 'Name', dataIndex: 'name' }];
const fired = (v) => v.events.filter((e) => e === 'onSelectionChange').length;

// PF-120: selectRow with a row already selected, selectRow with a row the table does not have, and clearSelection with
// nothing selected each fired On selection change, though the selection stayed the same (the Ant List's selectItem
// fires nothing for these). A call that leaves the selection as it is now changes nothing and fires nothing.
describe('Ant Design Table selection actions that change nothing', () => {
  test('[PackComponent-TABLE-001] selectRow of a row already selected fires nothing', async () => {
    const v = await mountPack('antd', 'Table', { dataSource: rows, columns, rowSelection: 'checkbox' });
    await v.run('selectRow', 3);
    expect(fired(v)).toBe(1);

    await v.run('selectRow', 3);

    expect(fired(v)).toBe(1);
    expect(v.exposed.selectedRowKeys).toEqual([3]);
  });

  test('[PackComponent-TABLE-002] selectRow of a row the table does not have changes nothing and fires nothing', async () => {
    const v = await mountPack('antd', 'Table', { dataSource: rows, columns, rowSelection: 'checkbox' });
    await v.run('selectRow', 1);
    await v.run('selectRow', 3);
    expect(fired(v)).toBe(2);

    await v.run('selectRow', 999);

    expect(fired(v)).toBe(2);
    expect(v.exposed.selectedRowKeys).toEqual([1, 3]);
    expect(v.exposed.selectedRow).toEqual({ id: 3, name: 'Row 3' });
  });

  test('[PackComponent-TABLE-003] clearSelection with nothing selected fires nothing', async () => {
    const v = await mountPack('antd', 'Table', { dataSource: rows, columns, rowSelection: 'checkbox' });
    await v.run('selectRow', 2);
    await v.run('clearSelection');
    expect(fired(v)).toBe(2);
    expect(v.exposed.selectedRowKeys).toEqual([]);

    await v.run('clearSelection');

    expect(fired(v)).toBe(2);
  });

  test('[PackComponent-TABLE-004] a call that changes the selection still fires once', async () => {
    const v = await mountPack('antd', 'Table', { dataSource: rows, columns, rowSelection: 'radio' });
    await v.run('selectRow', 2);
    await v.run('selectRow', 4);

    expect(fired(v)).toBe(2);
    expect(v.exposed.selectedRowKeys).toEqual([4]);
  });
});
