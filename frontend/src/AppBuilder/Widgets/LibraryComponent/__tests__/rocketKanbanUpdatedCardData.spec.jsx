import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-161): a Rocket 2.0 Kanban's updatedCardData read [] from load and stayed [] after its Data changed; the
// native Kanban and the Ant Design pack's expose every card from load and follow new data. The pack component, the
// inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const DATA = [
  { id: 1, title: 'One', status: 'todo' },
  { id: 2, title: 'Two', status: 'doing' },
  { id: 3, title: 'Three', status: 'done' },
];
const ids = (v) => (v.exposed.updatedCardData ?? []).map((card) => card.id);

describe('Rocket Kanban: updatedCardData holds the board from load', () => {
  test('[PackComponent-KANBAN-UCD-001] every card is exposed from the first render', async () => {
    const v = await mountPack('shadcn', 'Kanban', { data: DATA });
    expect(ids(v)).toEqual([1, 2, 3]);
  });

  test('[PackComponent-KANBAN-UCD-002] new Data replaces what is exposed', async () => {
    const v = await mountPack('shadcn', 'Kanban', { data: DATA });
    await v.update({ props: { data: [DATA[0]] } });
    expect(ids(v)).toEqual([1]);
  });

  test('[PackComponent-KANBAN-UCD-003] control: a card removed with deleteCard leaves the rest exposed', async () => {
    const v = await mountPack('shadcn', 'Kanban', { data: DATA });
    await v.run('deleteCard', 2);
    expect(ids(v)).toEqual([1, 3]);
  });
});
