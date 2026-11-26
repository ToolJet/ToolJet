/**
 * Creating, editing, renaming and deleting declared variables: the store, the runtime value and the
 * saved definition change together, and invalid names or circular references are rejected before
 * anything is saved. HTTP is the only controlled boundary.
 */
import '@/test/setupMsw';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition, binding } from '@/test/app-builder';

const state = () => useStore.getState();
const appVars = () => state().resolvedStore.modules.canvas.exposedValues.variables;
const pageVars = () => state().resolvedStore.modules.canvas.exposedValues.page.variables;
const flush = () => new Promise((r) => setTimeout(r, 0));
// A variable is addressed by its scope and current name; `previousName` marks an edit or rename.
const edit = (definition, changes) =>
  state().saveVariableDefinition({ scope: definition.scope, previousName: definition.name, ...changes });
const remove = (definition) => state().deleteVariableDefinition(definition.scope, definition.name);
const names = (list) => list.map((d) => d.name);

let saved;
beforeEach(() => {
  saved = [];
  server.use(
    http.put('*/v2/apps/:appId/versions/:versionId/global_settings', async ({ request }) => {
      saved.push({ type: 'global_settings', body: await request.json() });
      return HttpResponse.json({});
    }),
    http.put('*/v2/apps/:appId/versions/:versionId/pages', async ({ request }) => {
      saved.push({ type: 'pages', body: await request.json() });
      return HttpResponse.json({});
    })
  );

  const store = state();
  store.initializeDependencySlice('canvas');
  store.setApp({ appId: 'app-1' }, 'canvas');
  store.setCurrentVersionId('version-1');
  store.setGlobalSettings({ ...store.globalSettings, variables: {} });
  store.setPages(
    [
      {
        id: 'page-1',
        handle: 'home',
        name: 'Home',
        variables: {},
        components: {
          c1: componentDefinition('c1', 'text1', 'Text', { text: binding('{{variables.threshold}}') }),
        },
      },
    ],
    'canvas'
  );
  store.setCurrentPageId('page-1', 'canvas');
  store.setComponentNameIdMapping('canvas');
  store.initDependencyGraph('canvas');
});

describe('create', () => {
  test('an app variable is usable at once and saved in global settings', async () => {
    const result = await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    await flush();

    expect(result.ok).toBe(true);
    expect(appVars().threshold).toBe(5);
    expect(state().getResolvedComponent('c1').properties.text).toBe('5');
    expect(state().getAppVariableDefinitions()).toEqual([
      { scope: 'app', name: 'threshold', value: '5', fxActive: false },
    ]);
    // Saved keyed by name, with no definition id.
    expect(saved).toEqual([
      {
        type: 'global_settings',
        body: { globalSettings: { variables: { threshold: { value: '5', fxActive: false } } } },
      },
    ]);
  });

  test('a page variable is usable at once and saved on the page', async () => {
    const result = await state().saveVariableDefinition({ scope: 'page', name: 'category', value: 'Books' });

    expect(result.ok).toBe(true);
    expect(pageVars().category).toBe('Books');
    expect(saved).toEqual([
      {
        type: 'pages',
        body: expect.objectContaining({
          pageId: 'page-1',
          diff: {
            variables: { category: { value: 'Books', fxActive: false } },
          },
        }),
      },
    ]);
  });

  test('an invalid name is rejected and nothing is saved', async () => {
    const result = await state().saveVariableDefinition({ scope: 'app', name: 'my-var', value: '1' });

    expect(result).toEqual({ ok: false, field: 'name', error: expect.stringMatching(/letters, numbers/) });
    expect(state().getAppVariableDefinitions()).toEqual([]);
    expect(saved).toEqual([]);
  });

  test('a circular reference is rejected with its path and nothing is saved', async () => {
    const a = await state().saveVariableDefinition({ scope: 'app', name: 'a', value: '{{variables.b}}' });
    saved = [];
    const b = await state().saveVariableDefinition({ scope: 'app', name: 'b', value: '{{variables.a}}' });

    expect(a.ok).toBe(true);
    expect(b).toEqual({
      ok: false,
      field: 'value',
      error: 'Circular reference: b → a → b. Change one of these values to break the loop.',
    });
    expect(
      state()
        .getAppVariableDefinitions()
        .map((d) => d.name)
    ).toEqual(['a']);
    expect(saved).toEqual([]);
  });
});

describe('edit', () => {
  test('changing the value updates the variable and its dependents', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    await edit(definition, { value: '8' });
    await flush();

    expect(appVars().threshold).toBe(8);
    expect(state().getResolvedComponent('c1').properties.text).toBe('8');
  });

  test('changing an expression re-registers what it reads', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'x', value: '1' });
    await state().saveVariableDefinition({ scope: 'app', name: 'y', value: '2' });
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'z', value: '{{variables.x}}' });
    await edit(definition, { value: '{{variables.y * 10}}' });
    expect(appVars().z).toBe(20);

    state().setVariable('x', 100);
    await flush();
    expect(appVars().z).toBe(20);

    state().setVariable('y', 3);
    await flush();
    expect(appVars().z).toBe(30);
  });

  test('renaming moves the value to the new name and leaves the old name unset', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    const result = await edit(definition, { name: 'minStock' });
    await flush();

    expect(result.ok).toBe(true);
    expect(appVars().minStock).toBe(5);
    expect('threshold' in appVars()).toBe(false);
  });
});

describe('delete', () => {
  test('removes the definition and value and saves', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    saved = [];
    await remove(definition);

    expect(state().getAppVariableDefinitions()).toEqual([]);
    expect('threshold' in appVars()).toBe(false);
    expect(saved).toEqual([{ type: 'global_settings', body: { globalSettings: { variables: {} } } }]);
  });

  // Development data saved before definitions were keyed by name: { [id]: { id, name, ... } },
  // including a key mangled by an older camelizing response.
  test('removes a development definition saved under an id and saves the map keyed by name', async () => {
    const id = '05688c6c-efd3-4726-b6c5-bfde3a2f32c9';
    state().setGlobalSettings({
      ...state().globalSettings,
      variables: {
        '05688c6cEfd34726B6c5Bfde3a2f32c9': { id, name: 'threshold', value: '5', fxActive: false },
        other: { value: '1', fxActive: false },
      },
    });
    state().initVariableDefinitions('canvas');
    expect(appVars().threshold).toBe(5);

    await state().deleteVariableDefinition('app', 'threshold');

    expect(names(state().getAppVariableDefinitions())).toEqual(['other']);
    expect('threshold' in appVars()).toBe(false);
    expect(saved).toEqual([
      { type: 'global_settings', body: { globalSettings: { variables: { other: { value: '1', fxActive: false } } } } },
    ]);
  });
});

describe('declared variable boundaries', () => {
  test('a malformed saved entry is skipped instead of stopping the editor from loading', () => {
    state().setGlobalSettings({
      ...state().globalSettings,
      variables: { bad: null, threshold: { value: '5', fxActive: false } },
    });
    state().setPages([{ ...state().modules.canvas.pages[0], variables: { bad: 'x', also: null } }], 'canvas');

    expect(() => state().initVariableDefinitions('canvas')).not.toThrow();
    expect(
      state()
        .getVariableDefinitions()
        .map((d) => d.name)
    ).toEqual(['threshold']);
    expect(appVars().threshold).toBe(5);
  });

  test('invalid JSON leaves an existing value and its saved definition unchanged', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    saved = [];

    const result = await edit(definition, { value: '{broken' });

    expect(result).toEqual({ ok: false, field: 'value', error: expect.stringContaining('Not valid JSON') });
    expect(appVars().threshold).toBe(5);
    expect(state().getAppVariableDefinitions()[0].value).toBe('5');
    expect(saved).toEqual([]);
  });

  test('changing an expression to a static value stops following the former source', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'source', value: '2' });
    const { definition } = await state().saveVariableDefinition({
      scope: 'app',
      name: 'threshold',
      value: '{{variables.source * 2}}',
      fxActive: true,
    });
    expect(appVars().threshold).toBe(4);

    await edit(definition, { value: '7', fxActive: false });
    state().setVariable('source', 9);
    await flush();

    expect(appVars().threshold).toBe(7);
    expect(state().getResolvedComponent('c1').properties.text).toBe('7');
  });

  test('a deleted expression is not recreated when its former source changes', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'source', value: '2' });
    const { definition } = await state().saveVariableDefinition({
      scope: 'app',
      name: 'threshold',
      value: '{{variables.source * 2}}',
    });
    expect(appVars().threshold).toBe(4);
    await remove(definition);
    saved = [];

    state().setVariable('source', 9);
    await flush();

    expect(appVars()).not.toHaveProperty('threshold');
    expect(
      state()
        .getAppVariableDefinitions()
        .map((d) => d.name)
    ).toEqual(['source']);
    expect(saved).toEqual([]);
  });

  test('same-name app and page variables stay isolated when the page variable is edited and deleted', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    const { definition } = await state().saveVariableDefinition({ scope: 'page', name: 'threshold', value: '10' });
    await edit(definition, { value: '12' });

    expect(pageVars().threshold).toBe(12);
    expect(appVars().threshold).toBe(5);
    await remove(definition);

    expect(pageVars()).not.toHaveProperty('threshold');
    expect(appVars().threshold).toBe(5);
    expect(state().getResolvedComponent('c1').properties.text).toBe('5');
  });

  test('a page script override survives unrelated writes and yields when its source changes', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'source', value: '2' });
    await state().saveVariableDefinition({ scope: 'page', name: 'double', value: '{{variables.source * 2}}' });
    expect(pageVars().double).toBe(4);

    state().setPageVariable('double', 99);
    state().setVariable('unrelated', 8);
    await flush();
    expect(pageVars().double).toBe(99);

    state().setVariable('source', 3);
    await flush();
    expect(pageVars().double).toBe(6);
  });
});

describe('scope + name identity', () => {
  const settle = async () => {
    for (let i = 0; i < 10; i += 1) await flush();
  };
  // Holds the next global_settings save until `release(ok)` is called, then fails or succeeds it.
  const holdNextSave = () => {
    let release;
    const gate = new Promise((resolve) => (release = resolve));
    let held = false;
    server.use(
      http.put('*/v2/apps/:appId/versions/:versionId/global_settings', async ({ request }) => {
        const body = await request.json();
        if (held) {
          saved.push({ type: 'global_settings', body });
          return HttpResponse.json({});
        }
        held = true;
        const ok = await gate;
        if (!ok) return HttpResponse.json({ message: 'offline' }, { status: 500 });
        saved.push({ type: 'global_settings', body });
        return HttpResponse.json({});
      })
    );
    return (ok) => release(ok);
  };
  const lastSavedAppMap = () => saved.filter((s) => s.type === 'global_settings').at(-1)?.body.globalSettings.variables;

  test('renaming replaces the saved key and stops the old name following its source', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'source', value: '2' });
    const { definition } = await state().saveVariableDefinition({
      scope: 'app',
      name: 'threshold',
      value: '{{variables.source * 2}}',
    });

    await edit(definition, { name: 'minStock' });
    state().setVariable('source', 5);
    await flush();

    expect(appVars().minStock).toBe(10);
    expect('threshold' in appVars()).toBe(false);
    expect(Object.keys(lastSavedAppMap())).toEqual(['source', 'minStock']);
  });

  test('editing or renaming keeps the variable in its place in the list and the saved map', async () => {
    const a = (await state().saveVariableDefinition({ scope: 'app', name: 'a', value: '1' })).definition;
    await state().saveVariableDefinition({ scope: 'app', name: 'b', value: '2' });
    await state().saveVariableDefinition({ scope: 'app', name: 'c', value: '3' });

    await edit(a, { value: '9' });
    expect(names(state().getAppVariableDefinitions())).toEqual(['a', 'b', 'c']);
    await edit({ ...a, value: '9' }, { name: 'first' });
    expect(names(state().getAppVariableDefinitions())).toEqual(['first', 'b', 'c']);
    expect(Object.keys(lastSavedAppMap())).toEqual(['first', 'b', 'c']);
  });

  test('a failed delete puts the variable back in its place', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'a', value: '1' });
    const b = (await state().saveVariableDefinition({ scope: 'app', name: 'b', value: '2' })).definition;
    await state().saveVariableDefinition({ scope: 'app', name: 'c', value: '3' });
    server.use(
      http.put('*/v2/apps/:appId/versions/:versionId/global_settings', () =>
        HttpResponse.json({ message: 'offline' }, { status: 500 })
      )
    );

    await remove(b);
    await settle();

    expect(names(state().getAppVariableDefinitions())).toEqual(['a', 'b', 'c']);
    expect(appVars().b).toBe(2);
  });

  test('renaming to an existing name in the same scope is rejected; the other scope is free', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'a', value: '1' });
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'b', value: '2' });
    await state().saveVariableDefinition({ scope: 'page', name: 'c', value: '3' });

    expect(await edit(definition, { name: 'a' })).toEqual(
      expect.objectContaining({ ok: false, field: 'name', error: expect.stringMatching(/already exists/) })
    );
    expect((await edit(definition, { name: 'c' })).ok).toBe(true);
    expect(appVars()).toEqual(expect.objectContaining({ a: 1, c: 2 }));
    expect(pageVars().c).toBe(3);
  });

  test('editing a variable that no longer exists is refused instead of creating it', async () => {
    const result = await state().saveVariableDefinition({ scope: 'app', previousName: 'gone', value: '1' });

    expect(result.ok).toBe(false);
    expect(state().getAppVariableDefinitions()).toEqual([]);
    expect(saved).toEqual([]);
  });

  test('names with uppercase, _ and $ are saved and read back unchanged', async () => {
    for (const name of ['selectedOrderID', 'user_name', '$total', '_x']) {
      await state().saveVariableDefinition({ scope: 'app', name, value: '1' });
    }
    expect(Object.keys(lastSavedAppMap())).toEqual(['selectedOrderID', 'user_name', '$total', '_x']);
    expect(names(state().getAppVariableDefinitions())).toEqual(['selectedOrderID', 'user_name', '$total', '_x']);
  });

  test('repeated renames undo and redo one name at a time', async () => {
    state().resetUndoRedoStack();
    const a = (await state().saveVariableDefinition({ scope: 'app', name: 'a', value: '7' })).definition;
    const b = (await edit(a, { name: 'b' })).definition;
    await edit(b, { name: 'c' });

    state().handleUndo();
    await settle();
    expect(names(state().getAppVariableDefinitions())).toEqual(['b']);
    state().handleUndo();
    await settle();
    expect(names(state().getAppVariableDefinitions())).toEqual(['a']);
    expect(appVars()).toEqual(expect.objectContaining({ a: 7 }));
    expect(appVars()).not.toHaveProperty('b');
    expect(appVars()).not.toHaveProperty('c');

    state().handleRedo();
    state().handleRedo();
    await settle();
    expect(names(state().getAppVariableDefinitions())).toEqual(['c']);
    expect(appVars().c).toBe(7);
    expect(Object.keys(lastSavedAppMap())).toEqual(['c']);
  });

  test('delete and recreate with the same name undo as two separate steps', async () => {
    state().resetUndoRedoStack();
    const first = (await state().saveVariableDefinition({ scope: 'app', name: 'count', value: '1' })).definition;
    await remove(first);
    await state().saveVariableDefinition({ scope: 'app', name: 'count', value: '2' });

    state().handleUndo();
    await settle();
    expect(state().getAppVariableDefinitions()).toEqual([]);
    expect(appVars()).not.toHaveProperty('count');

    state().handleUndo();
    await settle();
    expect(state().getAppVariableDefinitions()).toEqual([{ scope: 'app', name: 'count', value: '1', fxActive: false }]);
    expect(appVars().count).toBe(1);
  });

  test('undo of a page variable change after moving to another page changes and saves the original page', async () => {
    state().resetUndoRedoStack();
    const home = state().modules.canvas.pages[0];
    state().setPages([home, { id: 'page-2', handle: 'two', name: 'Two', variables: {}, components: {} }], 'canvas');
    await state().saveVariableDefinition({ scope: 'page', name: 'category', value: 'Books' });
    state().setCurrentPageId('page-2', 'canvas');
    saved = [];

    state().handleUndo();
    await settle();

    const pageById = (id) => state().modules.canvas.pages.find((p) => p.id === id);
    expect(state().getPageVariableDefinitions('canvas', 'page-1')).toEqual([]);
    expect(pageById('page-2').variables).toEqual({});
    expect(saved).toEqual([
      { type: 'pages', body: expect.objectContaining({ pageId: 'page-1', diff: { variables: {} } }) },
    ]);
  });

  test('a slow failed value save is not rolled back over a newer rename of the same variable', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'x', value: '1' });
    const release = holdNextSave();

    const pending = edit(definition, { value: '9' });
    await flush();
    // Saves go one at a time, so the rename's save waits behind the held one.
    const newer = edit({ ...definition }, { name: 'y' });
    release(false);
    const result = await pending;
    expect((await newer).ok).toBe(true);
    await settle();

    expect(result.ok).toBe(false);
    expect(state().getAppVariableDefinitions()).toEqual([{ scope: 'app', name: 'y', value: '9', fxActive: false }]);
    expect(appVars()).not.toHaveProperty('x');
    expect(appVars().y).toBe(9);
  });

  test('a slow failed delete is not rolled back over a newer variable created with the same name', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'count', value: '1' });
    const release = holdNextSave();

    const pending = remove(definition);
    await flush();
    const newer = state().saveVariableDefinition({ scope: 'app', name: 'count', value: '2' });
    release(false);
    await pending;
    expect((await newer).ok).toBe(true);
    await settle();

    expect(state().getAppVariableDefinitions()).toEqual([{ scope: 'app', name: 'count', value: '2', fxActive: false }]);
    expect(appVars().count).toBe(2);
  });

  // Answers global_settings saves in the order they arrive: true succeeds, false fails with a 500,
  // and `delayMs` holds that response so a later save could overtake it if saves were not serialized.
  const scriptSaves = (...outcomes) => {
    let next = 0;
    server.use(
      http.put('*/v2/apps/:appId/versions/:versionId/global_settings', async ({ request }) => {
        const body = await request.json();
        const { ok = true, delayMs = 0 } = outcomes[next++] ?? {};
        if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
        if (!ok) return HttpResponse.json({ message: 'offline' }, { status: 500 });
        saved.push({ type: 'global_settings', body });
        return HttpResponse.json({});
      })
    );
  };

  test('two overlapping creates that both fail leave neither variable behind', async () => {
    scriptSaves({ ok: false }, { ok: false });

    const first = state().saveVariableDefinition({ scope: 'app', name: 'first', value: '1' });
    const second = state().saveVariableDefinition({ scope: 'app', name: 'second', value: '2' });
    const results = await Promise.all([first, second]);
    await settle();

    expect(results.map((r) => r.ok)).toEqual([false, false]);
    expect(state().getAppVariableDefinitions()).toEqual([]);
    expect(appVars()).not.toHaveProperty('first');
    expect(appVars()).not.toHaveProperty('second');
    expect(saved).toEqual([]);
  });

  test('a failed edit overlapping a successful edit of another variable leaves the editor matching what was saved', async () => {
    const x = (await state().saveVariableDefinition({ scope: 'app', name: 'x', value: '1' })).definition;
    const y = (await state().saveVariableDefinition({ scope: 'app', name: 'y', value: '1' })).definition;
    saved = [];
    scriptSaves({ ok: false }, { ok: true });

    const results = await Promise.all([edit(x, { value: '9' }), edit(y, { value: '5' })]);
    await settle();

    expect(results.map((r) => r.ok)).toEqual([false, true]);
    expect(state().getAppVariableDefinitions()).toEqual([
      { scope: 'app', name: 'x', value: '1', fxActive: false },
      { scope: 'app', name: 'y', value: '5', fxActive: false },
    ]);
    expect(appVars()).toEqual(expect.objectContaining({ x: 1, y: 5 }));
    expect(lastSavedAppMap()).toEqual({ x: { value: '1', fxActive: false }, y: { value: '5', fxActive: false } });
  });

  test('a failed rename is not rolled back over a newer variable created under the old name', async () => {
    const x = (await state().saveVariableDefinition({ scope: 'app', name: 'x', value: '1' })).definition;
    saved = [];
    scriptSaves({ ok: false }, { ok: true });

    const results = await Promise.all([
      edit(x, { name: 'y' }),
      state().saveVariableDefinition({ scope: 'app', name: 'x', value: '5' }),
    ]);
    await settle();

    expect(results.map((r) => r.ok)).toEqual([false, true]);
    expect(state().getAppVariableDefinitions()).toEqual([
      { scope: 'app', name: 'y', value: '1', fxActive: false },
      { scope: 'app', name: 'x', value: '5', fxActive: false },
    ]);
    expect(lastSavedAppMap()).toEqual({ y: { value: '1', fxActive: false }, x: { value: '5', fxActive: false } });
    expect(appVars()).toEqual(expect.objectContaining({ x: 5, y: 1 }));
  });

  test('a slower earlier save cannot land after a later one', async () => {
    const a = (await state().saveVariableDefinition({ scope: 'app', name: 'a', value: '1' })).definition;
    saved = [];
    scriptSaves({ ok: true, delayMs: 30 }, { ok: true });

    await Promise.all([edit(a, { value: '2' }), edit({ ...a, value: '2' }, { value: '3' })]);
    await settle();

    // Each save sends the map as it is when its request goes out, so the server ends on the newest value.
    expect(saved.at(-1).body.globalSettings.variables.a.value).toBe('3');
    expect(state().getAppVariableDefinitions()[0].value).toBe('3');
  });

  test('a failed rename puts the old name, value and dependency back', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'source', value: '2' });
    const { definition } = await state().saveVariableDefinition({
      scope: 'app',
      name: 'threshold',
      value: '{{variables.source * 2}}',
    });
    server.use(
      http.put('*/v2/apps/:appId/versions/:versionId/global_settings', () =>
        HttpResponse.json({ message: 'offline' }, { status: 500 })
      )
    );

    const result = await edit(definition, { name: 'minStock' });
    await settle();
    expect(result.ok).toBe(false);
    expect(names(state().getAppVariableDefinitions())).toEqual(['source', 'threshold']);
    expect(appVars()).not.toHaveProperty('minStock');

    state().setVariable('source', 6);
    await flush();
    expect(appVars().threshold).toBe(12);
    expect(appVars()).not.toHaveProperty('minStock');
  });

  test('development entries that share a name are reported in the debugger, not dropped silently', () => {
    state().setGlobalSettings({
      ...state().globalSettings,
      variables: {
        a1: { id: 'a1', name: 'count', value: '1', fxActive: false },
        a2: { id: 'a2', name: 'count', value: '2', fxActive: false },
      },
    });
    state().initVariableDefinitions('canvas');

    expect(appVars().count).toBe(1);
    expect(state().debugger.logs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ logLevel: 'error', message: expect.stringContaining('count') }),
      ])
    );
  });
});

describe('save ordering and failure', () => {
  const settle = async () => {
    for (let i = 0; i < 15; i += 1) await flush();
  };
  // Every variables save, in order: which version it was sent to and whether it was accepted.
  // `outcomes` decides each save in turn (true = accepted, false = HTTP 500); a pending entry
  // holds that save until `release(index, ok)` settles it.
  const routeSaves = (outcomes) => {
    const requests = [];
    const gates = [];
    const handle =
      (type) =>
      async ({ request, params }) => {
        const index = requests.length;
        const body = await request.json();
        requests.push({ type, versionId: params.versionId, body });
        let ok = outcomes[index];
        if (ok === 'hold') ok = await new Promise((resolve) => (gates[index] = resolve));
        return ok ? HttpResponse.json({}) : HttpResponse.json({ message: 'offline' }, { status: 500 });
      };
    server.use(
      http.put('*/v2/apps/:appId/versions/:versionId/global_settings', handle('global_settings')),
      http.put('*/v2/apps/:appId/versions/:versionId/pages', handle('pages'))
    );
    const release = async (index, ok) => {
      while (!gates[index]) await flush();
      gates[index](ok);
    };
    return { requests, release };
  };

  // Break this catches: a save queued before a version switch is sent afterwards with the new
  // version id and the map still in the store, overwriting the new version's variables.
  test.each([
    ['app', 'global_settings'],
    ['page', 'pages'],
  ])('a %s save queued before a version switch is never sent to the new version', async (scope, type) => {
    const { requests, release } = routeSaves(['hold', true]);
    const first = state().saveVariableDefinition({ scope, name: 'a', value: '1' });
    await flush();
    const second = state().saveVariableDefinition({ scope, name: 'b', value: '2' });
    await flush();

    // The version id changes first; the new version's settings arrive later.
    state().setCurrentVersionId('version-2');
    await release(0, true);
    await Promise.all([first, second]);
    await settle();

    expect(requests.filter((r) => r.type === type).map((r) => r.versionId)).toEqual(['version-1']);
    expect((await second).ok).toBe(false);
  });

  // Opens version-2 the way the editor does: the version id first, then its settings, with the
  // previous version's undo history cleared.
  const openVersion2 = (variables) => {
    state().setCurrentVersionId('version-2');
    state().resetUndoRedoStack();
    state().setGlobalSettings({ ...state().globalSettings, variables });
    state().initVariableDefinitions('canvas');
  };

  // Break this catches: the old version's late success replaces the new version's last-saved map,
  // so a failed edit there removes the variable instead of restoring it.
  test("an old version's late successful save does not change what a failed edit in the new version restores", async () => {
    const { release } = routeSaves(['hold', 'hold']);
    const old = state().saveVariableDefinition({ scope: 'app', name: 'x', value: '1' });
    await flush();

    openVersion2({ y: { value: '1', fxActive: false } });
    const failing = edit({ scope: 'app', name: 'y' }, { value: '2' });
    await flush();
    await release(0, true);
    await old;
    await release(1, false);
    await failing;
    await settle();

    expect(state().getAppVariableDefinitions()).toEqual([{ scope: 'app', name: 'y', value: '1', fxActive: false }]);
    expect(appVars().y).toBe(1);
  });

  // Break this catches: a save finishing after the switch records its undo step in the new
  // version's history, where undoing it would change the new version.
  test("an old version's save finishing after a switch adds no undo step to the new version", async () => {
    const { release } = routeSaves(['hold']);
    const old = state().saveVariableDefinition({ scope: 'app', name: 'x', value: '1' });
    await flush();

    openVersion2({ y: { value: '1', fxActive: false } });
    await release(0, true);
    await old;
    await settle();

    expect(state().canUndo).toBe(false);
  });

  // Break this catches: rolling back the edit restores the create, which itself never saved.
  test('create then edit before either save lands, both failing, leaves nothing behind', async () => {
    const { release } = routeSaves(['hold', false]);
    const created = state().saveVariableDefinition({ scope: 'app', name: 'count', value: '1' });
    await flush();
    const edited = edit({ scope: 'app', name: 'count' }, { value: '2' });
    await flush();

    await release(0, false);
    const results = await Promise.all([created, edited]);
    await settle();

    expect(results.map((r) => r.ok)).toEqual([false, false]);
    expect(state().getAppVariableDefinitions()).toEqual([]);
    expect(appVars()).not.toHaveProperty('count');
  });

  test('create failing, then a later edit saving, keeps the edited variable the server now has', async () => {
    const { requests, release } = routeSaves(['hold', true]);
    const created = state().saveVariableDefinition({ scope: 'app', name: 'count', value: '1' });
    await flush();
    const edited = edit({ scope: 'app', name: 'count' }, { value: '2' });
    await flush();

    await release(0, false);
    await Promise.all([created, edited]);
    await settle();

    expect(state().getAppVariableDefinitions()).toEqual([{ scope: 'app', name: 'count', value: '2', fxActive: false }]);
    expect(requests.at(-1).body.globalSettings.variables).toEqual({ count: { value: '2', fxActive: false } });
  });

  test('an edit failing after an earlier saved edit returns to the saved value', async () => {
    const { release } = routeSaves([true, 'hold', false]);
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'count', value: '1' });
    const second = edit(definition, { value: '2' });
    await flush();
    const third = edit({ ...definition, value: '2' }, { value: '3' });
    await flush();

    await release(1, false);
    await Promise.all([second, third]);
    await settle();

    expect(state().getAppVariableDefinitions()).toEqual([{ scope: 'app', name: 'count', value: '1', fxActive: false }]);
    expect(appVars().count).toBe(1);
  });
});

describe('undo and redo', () => {
  test('undo removes a created variable; redo brings it back with its value', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });

    await state().handleUndo();
    expect(state().getAppVariableDefinitions()).toEqual([]);
    expect('threshold' in appVars()).toBe(false);

    await state().handleRedo();
    expect(
      state()
        .getAppVariableDefinitions()
        .map((d) => d.name)
    ).toEqual(['threshold']);
    expect(appVars().threshold).toBe(5);
  });

  test('undo restores a deleted variable and its value in one step', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'page', name: 'category', value: 'Books' });
    await remove(definition);

    await state().handleUndo();

    expect(
      state()
        .getPageVariableDefinitions()
        .map((d) => d.name)
    ).toEqual(['category']);
    expect(pageVars().category).toBe('Books');
  });

  test('undo of a rename restores the old name and its value', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    await edit(definition, { name: 'minStock' });

    await state().handleUndo();

    expect(
      state()
        .getAppVariableDefinitions()
        .map((d) => d.name)
    ).toEqual(['threshold']);
    expect(appVars().threshold).toBe(5);
    expect('minStock' in appVars()).toBe(false);
  });

  test('undo of a value change restores the previous value and saves it', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    await edit(definition, { value: '9' });
    saved = [];

    await state().handleUndo();
    await flush();

    expect(appVars().threshold).toBe(5);
    expect(saved).toEqual([
      {
        type: 'global_settings',
        body: { globalSettings: { variables: { threshold: { value: '5', fxActive: false } } } },
      },
    ]);
  });
  describe('when the save fails', () => {
    const failSaves = () =>
      server.use(
        http.put('*/v2/apps/:appId/versions/:versionId/global_settings', () =>
          HttpResponse.json({ message: 'offline' }, { status: 500 })
        )
      );
    // A failed save settles through several awaits (request, rollback); let them all finish.
    const settle = async () => {
      for (let i = 0; i < 10; i += 1) await flush();
    };

    test('a failed undo keeps the variable and the step, so undo can be retried', async () => {
      state().resetUndoRedoStack();
      await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
      failSaves();

      state().handleUndo();
      await settle();

      expect(
        state()
          .getAppVariableDefinitions()
          .map((d) => d.name)
      ).toEqual(['threshold']);
      expect(appVars().threshold).toBe(5);
      expect(state().canUndo).toBe(true);
      expect(state().canRedo).toBe(false);

      server.use(http.put('*/v2/apps/:appId/versions/:versionId/global_settings', () => HttpResponse.json({})));
      state().handleUndo();
      await settle();

      expect(state().getAppVariableDefinitions()).toEqual([]);
      expect('threshold' in appVars()).toBe(false);
    });

    test('a failed redo keeps the undone state and the step, so redo can be retried', async () => {
      state().resetUndoRedoStack();
      await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
      state().handleUndo();
      await settle();
      failSaves();

      state().handleRedo();
      await settle();

      expect(state().getAppVariableDefinitions()).toEqual([]);
      expect('threshold' in appVars()).toBe(false);
      expect(state().canRedo).toBe(true);
      expect(state().canUndo).toBe(false);
    });
  });
});
