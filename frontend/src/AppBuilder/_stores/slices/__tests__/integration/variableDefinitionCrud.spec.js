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
      expect.objectContaining({ id: result.definition.id, name: 'threshold', value: '5', scope: 'app' }),
    ]);
    expect(saved).toEqual([
      {
        type: 'global_settings',
        body: {
          globalSettings: {
            variables: {
              [result.definition.id]: { id: result.definition.id, name: 'threshold', value: '5', fxActive: false },
            },
          },
        },
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
            variables: { [result.definition.id]: expect.objectContaining({ name: 'category', value: 'Books' }) },
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
    await state().saveVariableDefinition({ ...definition, value: '8' });
    await flush();

    expect(appVars().threshold).toBe(8);
    expect(state().getResolvedComponent('c1').properties.text).toBe('8');
  });

  test('changing an expression re-registers what it reads', async () => {
    await state().saveVariableDefinition({ scope: 'app', name: 'x', value: '1' });
    await state().saveVariableDefinition({ scope: 'app', name: 'y', value: '2' });
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'z', value: '{{variables.x}}' });
    await state().saveVariableDefinition({ ...definition, value: '{{variables.y * 10}}' });
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
    const result = await state().saveVariableDefinition({ ...definition, name: 'minStock' });
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
    await state().deleteVariableDefinition(definition.id);

    expect(state().getAppVariableDefinitions()).toEqual([]);
    expect('threshold' in appVars()).toBe(false);
    expect(saved).toEqual([{ type: 'global_settings', body: { globalSettings: { variables: {} } } }]);
  });
});

describe('declared variable boundaries', () => {
  test('invalid JSON leaves an existing value and its saved definition unchanged', async () => {
    const { definition } = await state().saveVariableDefinition({ scope: 'app', name: 'threshold', value: '5' });
    saved = [];

    const result = await state().saveVariableDefinition({ id: definition.id, value: '{broken' });

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

    await state().saveVariableDefinition({ id: definition.id, value: '7', fxActive: false });
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
    await state().deleteVariableDefinition(definition.id);
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
    await state().saveVariableDefinition({ id: definition.id, value: '12' });

    expect(pageVars().threshold).toBe(12);
    expect(appVars().threshold).toBe(5);
    await state().deleteVariableDefinition(definition.id);

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
    await state().deleteVariableDefinition(definition.id);

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
    await state().saveVariableDefinition({ ...definition, name: 'minStock' });

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
    await state().saveVariableDefinition({ ...definition, value: '9' });
    saved = [];

    await state().handleUndo();
    await flush();

    expect(appVars().threshold).toBe(5);
    expect(saved).toEqual([
      {
        type: 'global_settings',
        body: { globalSettings: { variables: { [definition.id]: expect.objectContaining({ value: '5' }) } } },
      },
    ]);
  });
});
