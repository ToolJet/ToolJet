import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';
import { ANT_PACK_CSS, removeCopies } from './antPackCss';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design Menu. The pack's Menu, the inline SDK and the host renderer are the
// real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  removeCopies();
  document.body.innerHTML = '';
});

// The menu's markup under pack.css, with the component's own Border color written in for its variable: jsdom drops a
// colour written as var(), which the browser resolves.
const copyMenu = (v) => {
  const antRoot = v.root().querySelector('.tj-ant-root');
  const own = antRoot.style.getPropertyValue('--tj-ant-color-border').trim();
  const holder = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = own ? ANT_PACK_CSS.replaceAll('var(--tj-ant-color-border)', own) : ANT_PACK_CSS;
  holder.appendChild(style);
  holder.insertAdjacentHTML('beforeend', antRoot.outerHTML);
  document.body.appendChild(holder);
  return holder.querySelector('.ant-menu-root');
};
const line = (menu, side) => getComputedStyle(menu).getPropertyValue(side);

// PKB-41: Border color did nothing on the Menu: the pack takes away the line Ant draws at an inline or vertical menu's
// edge, and a horizontal menu's bottom line is Ant's colorSplit. Set, Border color draws that line in it; unset, the
// menu keeps the pack's look (no edge line, Ant's own bottom line).
describe('Ant Design Menu Border color', () => {
  test.each(['inline', 'vertical'])('[PackComponent-MENU-001] draws the %s menu’s edge line', async (mode) => {
    const v = await mountPack('antd', 'Menu', { mode }, { styles: { colorBorder: '#0000ff' } });

    expect(line(copyMenu(v), 'border-inline-end')).toMatch(/solid #0000ff/);
  });

  test('[PackComponent-MENU-002] colours a horizontal menu’s bottom line', async () => {
    const v = await mountPack('antd', 'Menu', { mode: 'horizontal' }, { styles: { colorBorder: '#0000ff' } });

    expect(line(copyMenu(v), 'border-bottom')).toMatch(/solid #0000ff/);
  });

  test('[PackComponent-MENU-003] a sub-menu’s own list inside an inline menu draws no line', async () => {
    const v = await mountPack('antd', 'Menu', { mode: 'inline' }, { styles: { colorBorder: '#0000ff' } });
    const menu = copyMenu(v);
    const sub = document.createElement('ul');
    sub.className = 'ant-menu ant-menu-sub ant-menu-inline';
    menu.appendChild(sub);

    expect(line(sub, 'border-inline-end')).not.toMatch(/#0000ff/);
  });

  test('[PackComponent-MENU-004] left unset, an inline menu keeps no edge line', async () => {
    const v = await mountPack('antd', 'Menu', { mode: 'inline' });

    expect(line(copyMenu(v), 'border-inline-end')).not.toMatch(/solid/);
  });
});

// PF-286: an item with a key and a blank label ({ key: 'a', label: '' }) drew an empty row: the label was taken as set
// because it is not missing. Blank text is no item, as null, a number, {} and '' are not (QA AD-44), and as the
// Breadcrumb and Dropdown leave it out. An item with a key and no label at all still shows its key.
describe('Ant Design Menu items with a blank label', () => {
  const texts = (v) => [...v.root().querySelectorAll('.ant-menu-item')].map((e) => e.textContent);

  test('[PackComponent-MENU-005] leaves out an item whose label is blank', async () => {
    const v = await mountPack('antd', 'Menu', {
      items: [
        null,
        1,
        {},
        { key: 'a', label: '' },
        { key: 'b', label: '   ' },
        { key: 'x', label: 'x' },
        { key: 'y', label: 'y' },
      ],
    });

    expect(texts(v)).toEqual(['x', 'y']);
  });

  test('[PackComponent-MENU-006] an item with a key and no label shows its key', async () => {
    const v = await mountPack('antd', 'Menu', { items: [{ key: 'reports' }, { key: 'x', title: 'Exports' }] });

    expect(texts(v)).toEqual(['reports', 'Exports']);
  });
});
