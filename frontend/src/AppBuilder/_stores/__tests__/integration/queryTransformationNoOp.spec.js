/**
 * runTransformation must never hand a nullish value back to its callers.
 *
 * A query created via the API/MCP can carry `enableTransformation: true` together with a
 * null/empty `transformation`. The editor itself never produces that — getDefaultOptions
 * (_stores/storeHelper.js) sets `enableTransformation: false` for non-runjs queries — but a
 * PAT/MCP caller writes query options directly.
 *
 * The old code built `Function([...args], null)`, whose body is the no-op string "null" that
 * returns `undefined` and never throws, so runTransformation returned `undefined`. Every run
 * path then reads `finalData.status` (queryPanelSlice.js:545 and the workflow paths) and throws
 * "Cannot read properties of undefined (reading 'status')" — a hard crash on query run,
 * including run-on-page-load in the released viewer.
 *
 * NO MOCKS: the real composed store's queryPanel.runTransformation is driven directly. The
 * no-op guard short-circuits before any store access, so these assertions are about the exact
 * changed line; the "real transformation still runs" case proves the normal path is intact.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';

const state = () => useStore.getState();
const query = { id: 'q1', name: 'query1', kind: 'restapi', options: {} };

describe('runTransformation — a null/empty transformation is a safe no-op', () => {
  beforeEach(() => {
    seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') });
    state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' }, 'canvas');
  });

  test('a null transformation passes the raw data through instead of returning undefined', async () => {
    const raw = [{ id: 1 }, { id: 2 }];
    const result = await state().queryPanel.runTransformation(raw, null, 'javascript', query, 'edit', 'canvas');
    // Before the fix this was `undefined` (Function([...], null) → no-op body), which made every
    // run path crash on `finalData.status`.
    expect(result).toEqual(raw);
  });

  test('a whitespace-only transformation is also a no-op', async () => {
    const raw = [{ id: 1 }, { id: 2 }];
    const result = await state().queryPanel.runTransformation(raw, '   ', 'javascript', query, 'edit', 'canvas');
    expect(result).toEqual(raw);
  });

  test('a real transformation still runs', async () => {
    const raw = [{ id: 1 }, { id: 2 }];
    const result = await state().queryPanel.runTransformation(
      raw,
      'return data.filter((row) => row.id === 1);',
      'javascript',
      query,
      'edit',
      'canvas'
    );
    expect(result).toEqual([{ id: 1 }]);
  });
});
