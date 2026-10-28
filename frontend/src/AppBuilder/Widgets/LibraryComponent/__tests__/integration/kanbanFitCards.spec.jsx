import React from 'react';
import { render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import { Kanban as ShadKanban } from '../../../../../../../packs/shadcn/src/components/Kanban';
import { Kanban as AntKanban } from '../../../../../../../packs/antd/src/components/Kanban';
import { Kanban as MuiKanban } from '../../../../../../../packs/mui/src/components/Kanban';

installBrowserStubs();

// Each pack's Kanban asks the host to fit its custom cards: a card's components grow (text wrapping in a narrow
// column) and the reflow pushes the ones below down, so the card's row grows with them, never below the card height
// (usePackHost PackRow). The card wraps its row's slot at the slot's height, so it follows the row (2026-10-24: the Ant
// card clipped its button, the shadcn card scrolled).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const DATA = [
  { id: 1, title: 'Load 1', status: 'todo' },
  { id: 2, title: 'Load 2', status: 'todo' },
  { id: 3, title: 'Load 3', status: 'doing' },
];
const COLUMNS = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing' },
];

let mounts = 0;
const mount = async (Kanban, dataName, props) => {
  loadLibraryModule.mockResolvedValue({ Kanban });
  mounts += 1;
  const setRows = jest.fn();
  const host = { ...makeHost('Kanban'), setRows };
  const rendered = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`kanban-fit-${mounts}`}
      componentName="Kanban"
      componentProps={{ [dataName]: DATA, columns: COLUMNS, ...props }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={host}
      dataCy="kanban-fit"
    />
  );
  const root = () => rendered.container.querySelector('[data-cy="kanban-fit"]')?.shadowRoot;
  await waitFor(() => expect(root()?.querySelectorAll('[data-kb-card]').length).toBe(DATA.length));
  return { root, setRows };
};

describe.each([
  ['shadcn', ShadKanban, 'data'],
  ['Ant Design', AntKanban, 'dataSource'],
  ['Material UI', MuiKanban, 'data'],
])('%s Kanban custom cards', (_pack, Kanban, dataName) => {
  test('ask the host to fit each card, floored at the card height', async () => {
    const t = await mount(Kanban, dataName, { cardLayout: 'custom', cardHeight: 194 });
    const [items, rowHeight, options] = t.setRows.mock.calls.at(-1);
    expect(items).toHaveLength(DATA.length);
    expect(rowHeight).toBe(194);
    expect(options).toEqual({ fit: true });
  });

  test("are drawn at their row's height: no fixed height on the card or its body", async () => {
    const t = await mount(Kanban, dataName, { cardLayout: 'custom', cardHeight: 194 });
    const cards = [...t.root().querySelectorAll('[data-kb-card]')];
    expect(cards.map((card) => card.querySelectorAll('slot[name^="tj-row-"]').length)).toEqual([1, 1, 1]);
    cards.forEach((card) => {
      expect(card.style.height).toBe('');
      expect(card.style.maxHeight).toBe('');
      card.querySelectorAll('*').forEach((el) => {
        if (el.contains(card.querySelector('slot'))) {
          expect(el.style.height).toBe('');
          expect(el.style.maxHeight).toBe('');
        }
      });
    });
  });

  test('built-in cards draw no rows', async () => {
    const t = await mount(Kanban, dataName, { cardLayout: 'fields' });
    expect(t.setRows.mock.calls.at(-1)[0]).toEqual([]);
    expect(t.root().querySelector('slot[name^="tj-row-"]')).toBeNull();
  });
});
