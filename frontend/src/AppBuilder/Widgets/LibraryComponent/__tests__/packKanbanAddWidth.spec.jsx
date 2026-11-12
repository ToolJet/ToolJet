import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA AD-41: Add card with the Column id left empty (the action's default) put a card that has no status into a new
// column with no name, its status ''. QA AD-42: Column width did nothing, the columns grew and shrank to fill the board
// as with no width set. The Kanban of each pack (Ant and MUI share useKanban; Rocket 2.0 has its own copy), the inline
// SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// The columns each pack draws (its default board: To do, In progress, Done).
const COLUMN = { antd: '.tj-ant-kb-col', mui: '.tj-mui-kb-col', shadcn: '.ui2-kb-col' };
const columns = (v, pack) => [...v.root().querySelectorAll(COLUMN[pack])];

describe.each(['antd', 'mui', 'shadcn'])('%s Kanban', (pack) => {
  test('[PackComponent-KANBANADD-001] Add card with the column id left empty puts a card with no status in the first column', async () => {
    const v = await mountPack(pack, 'Kanban', {});
    expect(columns(v, pack)).toHaveLength(3);

    await v.run('addCard', { title: 'New card' }, '');

    expect(v.exposed.lastAddedCard).toMatchObject({ title: 'New card', status: 'todo' });
    expect(columns(v, pack)).toHaveLength(3);
    expect(v.exposed.updatedCardData.filter((card) => card.status === '')).toEqual([]);
  });

  // Characterization: a card's own status and a given column id still decide where it goes.
  test('[PackComponent-KANBANADD-002] a card with a status, or a column id given, still lands there', async () => {
    const v = await mountPack(pack, 'Kanban', {});

    await v.run('addCard', { title: 'Doing card', status: 'doing' }, '');
    expect(v.exposed.lastAddedCard.status).toBe('doing');
    await v.run('addCard', { title: 'Done card' }, 'done');
    expect(v.exposed.lastAddedCard.status).toBe('done');

    expect(columns(v, pack)).toHaveLength(3);
  });

  test('[PackComponent-KANBANWIDTH-001] a set Column width keeps each column at that width', async () => {
    const v = await mountPack(pack, 'Kanban', { columnWidth: '200' });
    const drawn = columns(v, pack);

    expect(drawn).toHaveLength(3);
    drawn.forEach((column) => {
      expect(column.style.width).toBe('200px');
      expect(column.style.flex).toBe('0 0 200px');
    });
  });

  // Characterization: with no width set the columns share the board.
  test('[PackComponent-KANBANWIDTH-002] an empty Column width still fills the board', async () => {
    const v = await mountPack(pack, 'Kanban', { columnWidth: '' });

    columns(v, pack).forEach((column) => {
      expect(column.classList.contains('is-fill')).toBe(true);
      expect(column.style.width).toBe('');
    });
  });
});
