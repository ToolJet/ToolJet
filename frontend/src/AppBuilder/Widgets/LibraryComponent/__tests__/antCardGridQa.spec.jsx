import { act, fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA board "Pack Components Full QA", Ant Design CardGrid. The pack's CardGrid, the inline SDK and the host renderer are
// the real ones; only module and CSS loading is replaced.
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
];
const cards = (v) => [...v.root().querySelectorAll('.tj-ant-gridcard')];
const clicks = (v) => v.events.filter((e) => e === 'onCardClicked').length;

// PKB-31: a card could not be reached with Tab nor picked with Enter, only with the pointer. Each card is a Tab stop, and
// Enter or Space picks it as a click does (it selects the card and fires On card clicked); on the picked card it
// unselects it, again as a click does.
describe('Ant Design CardGrid from the keyboard', () => {
  test('[PackComponent-CARDGRID-001] every card is a Tab stop', async () => {
    const v = await mountPack('antd', 'CardGrid', { dataSource: rows });

    expect(cards(v).map((c) => c.getAttribute('tabindex'))).toEqual(['0', '0']);
  });

  test.each(['Enter', ' '])('[PackComponent-CARDGRID-002] %j on a card picks it as a click does', async (key) => {
    const v = await mountPack('antd', 'CardGrid', { dataSource: rows });

    act(() => {
      fireEvent.keyDown(cards(v)[1], { key });
    });
    await settle();

    expect(clicks(v)).toBe(1);
    expect(v.exposed.selectedItem).toEqual({ id: 2, title: 'Beta' });
  });

  test('[PackComponent-CARDGRID-003] Enter on the picked card unselects it, with no click event', async () => {
    const v = await mountPack('antd', 'CardGrid', { dataSource: rows });
    act(() => {
      fireEvent.keyDown(cards(v)[0], { key: 'Enter' });
    });
    await settle();

    act(() => {
      fireEvent.keyDown(cards(v)[0], { key: 'Enter' });
    });
    await settle();

    expect(clicks(v)).toBe(1);
    expect(v.exposed.selectedItemIndex).toBe(-1);
  });

  test('[PackComponent-CARDGRID-004] other keys do nothing', async () => {
    const v = await mountPack('antd', 'CardGrid', { dataSource: rows });

    act(() => {
      fireEvent.keyDown(cards(v)[0], { key: 'a' });
    });
    await settle();

    expect(clicks(v)).toBe(0);
  });
});

// PF-017: QA saw the selection of a row with no id cleared (index -1, item {}) when the data changed around it. On
// current main the selection follows the row by its content, as the List does (antHardening); this pins it for the
// CardGrid.
describe('Ant Design CardGrid: a selected row with no id when the data changes', () => {
  const abc = () => [{ t: 'A' }, { t: 'B' }, { t: 'C' }];
  const pickB = async (v) => {
    act(() => {
      fireEvent.click(cards(v)[1]);
    });
    await settle();
    expect(v.exposed.selectedItem).toEqual({ t: 'B' });
  };

  test('[PackComponent-CARDGRID-005] a row added before it: the selection follows B to index 2', async () => {
    const v = await mountPack('antd', 'CardGrid', { dataSource: abc(), titleField: 't' });
    await pickB(v);

    await v.update({ props: { dataSource: [{ t: 'Z' }, ...abc()], titleField: 't' } });
    await settle();

    expect(v.exposed.selectedItem).toEqual({ t: 'B' });
    expect(v.exposed.selectedItemIndex).toBe(2);
  });

  test('[PackComponent-CARDGRID-006] the row before it removed: the selection follows B to index 0', async () => {
    const v = await mountPack('antd', 'CardGrid', { dataSource: abc(), titleField: 't' });
    await pickB(v);

    await v.update({ props: { dataSource: abc().slice(1), titleField: 't' } });
    await settle();

    expect(v.exposed.selectedItem).toEqual({ t: 'B' });
    expect(v.exposed.selectedItemIndex).toBe(0);
  });
});
