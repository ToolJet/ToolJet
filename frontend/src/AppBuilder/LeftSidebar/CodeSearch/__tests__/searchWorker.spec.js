/** @jest-environment node */
// jest.config.js stubs createCodeSearchWorker to return null, so every search here takes the
// main-thread fallback.
import { runSearch } from '../searchWorker';

const input = {
  pages: [],
  queries: [
    {
      id: 'q1',
      name: 'getUsers',
      kind: 'restapi',
      options: { url: 'aaaaaaaaaa!' },
    },
  ],
  events: [],
  globalSettings: {},
  pageSettings: null,
  queryIdNameMapping: {},
  defs: { widgetDefs: {}, actionDefs: [], pageSettingsDef: {} },
};
const search = (term, filters = {}) => runSearch({ input, term, filters, currentPageId: null });

describe('runSearch without a worker', () => {
  test('runs a literal search on the main thread', async () => {
    const { result } = await search('getUsers');
    expect(result.total).toBe(1);
  });

  test('refuses a regex instead of running it on the main thread, where it could freeze the editor', async () => {
    const { result } = await search('(a+)+$', { regex: true });
    expect(result).toMatchObject({
      total: 0,
      error: expect.stringMatching(/regular expression/i),
    });
  });
});
