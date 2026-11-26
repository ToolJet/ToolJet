import _useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, componentDefinition, binding } from '@/test/app-builder';

const scenario = defineAppBuilderScenario({
  id: 'module-variable-definitions',
  name: 'Each consumed module owns its app variable declarations',
  primarySeam: 'store',
  surface: 'consumed-module',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {},
});
const declarations = (count) => ({
  count: { value: String(count), fxActive: false },
  doubled: { value: '{{variables.count * 2}}', fxActive: false },
});
async function setup(parentHasVariables) {
  const session = new AppBuilderTestSession({ scenario });
  await session.store.act((s) => {
    for (const moduleId of ['module-A', 'module-B']) {
      s.initializeComponentsSlice(moduleId);
      s.initializeResolvedSlice(moduleId);
      s.initializeModeSlice(moduleId);
      s.initializeLoaderSlice(moduleId);
      s.initializeEventsSlice(moduleId);
      s.initializeDataQuerySlice(moduleId);
      s.initializeDependencySlice(moduleId);
      s.initializeAppSlice(moduleId);
      s.setGlobalSettings({ variables: declarations(0), appMode: 'dark' }, moduleId);
    }
    // Parent data can arrive or change after a module loads; it must not replace that module's definitions.
    s.setGlobalSettings({ variables: parentHasVariables ? declarations(100) : {}, appMode: 'light' });
    for (const moduleId of ['canvas', 'module-A', 'module-B']) {
      if (moduleId === 'canvas') s.initializeDependencySlice(moduleId);
      s.setPages(
        [
          {
            id: 'home',
            name: 'Home',
            handle: 'home',
            components: {
              label: componentDefinition('label', 'label', 'Text', { text: binding('{{variables.doubled}}') }),
            },
            variables: {},
          },
        ],
        moduleId
      );
      s.setCurrentPageId('home', moduleId);
      s.setComponentNameIdMapping(moduleId);
      s.initDependencyGraph(moduleId);
    }
  });
  return session;
}
const values = (session, moduleId) =>
  session.store.read((s) => s.resolvedStore.modules[moduleId].exposedValues.variables);

// Break this catches: module declarations are read from the parent's globalSettings instead of the instance.
test('MOD-VAR-06: colliding parent names do not supply module defaults', async () => {
  const session = await setup(true);
  expect(values(session, 'canvas')).toMatchObject({ count: 100, doubled: 200 });
  expect(values(session, 'module-A')).toMatchObject({ count: 0, doubled: 0 });
  expect(values(session, 'module-B')).toMatchObject({ count: 0, doubled: 0 });
  expect(session.store.read((s) => s.globalSettings.appMode)).toBe('light');
});

// Break this catches: module declarations disappear when the parent has no matching variables.
test('MOD-VAR-07: declarations initialize without matching parent declarations', async () => {
  const session = await setup(false);
  expect(values(session, 'canvas')).toEqual({});
  expect(values(session, 'module-A')).toMatchObject({ count: 0, doubled: 0 });
  expect(values(session, 'module-B')).toMatchObject({ count: 0, doubled: 0 });
});

// Break this catches: repeated instances share declarations, runtime values, or reactive graph nodes.
test.each([false, true])(
  'MOD-VAR-ISOLATION: both instances recompute independently (parent declarations: %s)',
  async (parent) => {
    const session = await setup(parent);
    await session.store.act('setVariable', 'count', 3, 'module-A');
    expect(values(session, 'module-A')).toMatchObject({ count: 3, doubled: 6 });
    expect(values(session, 'module-B')).toMatchObject({ count: 0, doubled: 0 });
    await session.store.act('setVariable', 'count', 7, 'module-B');
    expect(values(session, 'module-A')).toMatchObject({ count: 3, doubled: 6 });
    expect(values(session, 'module-B')).toMatchObject({ count: 7, doubled: 14 });
    expect(values(session, 'canvas')).toEqual(parent ? { count: 100, doubled: 200 } : {});
    expect(session.store.read((s) => s.getResolvedComponent('label', null, 'module-A').properties.text)).toBe('6');
    expect(session.store.read((s) => s.getResolvedComponent('label', null, 'module-B').properties.text)).toBe('14');
    await session.store.act('initDependencyGraph', 'module-A');
    expect(values(session, 'module-A')).toMatchObject({ count: 3, doubled: 6 });
    expect(values(session, 'module-B')).toMatchObject({ count: 7, doubled: 14 });
  }
);
