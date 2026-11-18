import { act, fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design List. The pack's List, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const rows = [
  { id: 1, title: 'Alpha' },
  { id: 2, title: 'Beta' },
  { id: 3, title: 'Gamma' },
];
const items = (v) => [...v.root().querySelectorAll('.ant-list-item.tj-ant-item')];
const clicks = (v) => v.events.filter((e) => e === 'onItemClick').length;

// PF-121: no row of a List took focus, so a keyboard user could not select one. Each row a click selects is a Tab stop,
// and Enter or Space selects it as a click does.
describe('Ant Design List from the keyboard', () => {
  test('[PackComponent-LIST-001] every row is a Tab stop', async () => {
    const v = await mountPack('antd', 'List', { dataSource: rows });

    expect(items(v).map((i) => i.getAttribute('tabindex'))).toEqual(['0', '0', '0']);
  });

  test.each(['Enter', ' '])('[PackComponent-LIST-002] %j on a row selects it as a click does', async (key) => {
    const v = await mountPack('antd', 'List', { dataSource: rows });

    act(() => {
      fireEvent.keyDown(items(v)[1], { key });
    });
    await settle();

    expect(clicks(v)).toBe(1);
    expect(v.exposed.selectedItem).toEqual({ id: 2, title: 'Beta' });
  });
});

// PKB-41: Container background did nothing on a List (it stayed transparent). Set, it fills the list's box.
describe('Ant Design List: Container background', () => {
  test('[PackComponent-LIST-003] Container background fills the list', async () => {
    const v = await mountPack('antd', 'List', { dataSource: rows }, { styles: { colorBgContainer: '#ffeeaa' } });

    const root = v.root().querySelector('.tj-ant-list');
    expect(root.style.backgroundColor).toMatch(/#ffeeaa|rgb\(255, 238, 170\)/);
  });

  test('[PackComponent-LIST-004] unset, the list keeps no background of its own', async () => {
    const v = await mountPack('antd', 'List', { dataSource: rows });

    expect(v.root().querySelector('.tj-ant-list').style.backgroundColor).toBe('');
  });
});

// PKB-55: in components mode a row's content is the host's ToolJet components, projected into the row through a
// <slot>. A click on them (and the row's whole area is them) selected nothing: React finds the handler by walking the
// clicked node's parents, and a slotted node's parents are the host's, never the row. The row is found on the event's
// composed path instead.
describe('Ant Design List (components mode): a click on a row selects it', () => {
  const mountRows = async () => {
    const v = await mountPack('antd', 'List', { dataSource: rows, renderItem: 'components' });
    const host = v.root().host;
    const content = rows.map((_, i) => {
      const el = document.createElement('div');
      el.setAttribute('slot', `tj-row-List-${i}`);
      const text = document.createElement('span');
      text.textContent = `row ${i}`;
      el.appendChild(text);
      host.appendChild(el);
      return text;
    });
    await settle();
    return { v, content };
  };

  test('[PackComponent-LIST-005] a click on a component inside a row selects the row and fires On item click', async () => {
    const { v, content } = await mountRows();

    act(() => {
      fireEvent.click(content[2]);
    });
    await settle();

    expect(v.exposed.selectedItem).toEqual({ id: 3, title: 'Gamma' });
    expect(clicks(v)).toBe(1);
  });

  test("[PackComponent-LIST-006] a click on the row's own area selects it once", async () => {
    const { v } = await mountRows();

    act(() => {
      fireEvent.click(items(v)[1]);
    });
    await settle();

    expect(v.exposed.selectedItem).toEqual({ id: 2, title: 'Beta' });
    expect(clicks(v)).toBe(1);
  });
});
