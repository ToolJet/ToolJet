/**
 * Module-namespace isolation contract for the App Builder store.
 *
 * A ToolJet Module renders in a SECOND namespace of the same singleton store:
 * every per-app collection is keyed `...modules[moduleId]`, and `'canvas'` is
 * only the name of the main app's namespace. A whole family of shipped bugs
 * comes from a function that ACCEPTS a `moduleId` and then reads or writes
 * `'canvas'` anyway — one of them was fixed in 5e5ebfb1a3 / PR #17339
 * (`getModuleEvents('canvas')` -> `getModuleEvents(moduleId)`), and the ones
 * below are still open.
 *
 * Nothing here is mocked except `appVersionService` (an HTTP boundary). The
 * bug shape is "wrong namespace read", so a stubbed store cannot express it:
 * the two namespaces must both really exist and really differ.
 *
 * `bootModule` is deliberately explicit rather than a store action, because no
 * single store action initialises a namespace — each slice has its own
 * `initialize*Slice(moduleId)`, and missing any one of them fails as
 * `undefined is not an object` deep inside a slice rather than as a useful error.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { appVersionService } from '@/_services';
import toast from 'react-hot-toast';

const s = () => useStore.getState();
const drain = () => new Promise((r) => setTimeout(r, 0));

/** Creates the `moduleId` namespace in every slice the tests below touch. */
function bootModule(moduleId) {
  s().initializeComponentsSlice(moduleId);
  s().initializeAppSlice(moduleId);
  s().initializeEventsSlice(moduleId);
  s().initializeResolvedSlice(moduleId);
  s().initializeDependencySlice(moduleId);
  s().initializeDataQuerySlice(moduleId);
  s().initializeModeSlice(moduleId);
  s().initializeLoaderSlice(moduleId);
  s().setEditorLoading(false, moduleId);
  s().setCurrentMode('edit', moduleId);
}

function handler({ id = 'evt-1', index = 0, sourceId = 'component-1', ...event }) {
  return {
    id,
    index,
    sourceId,
    name: id,
    target: 'component',
    event: { eventId: 'onClick', ...event },
  };
}

const variables = (moduleId) => s().resolvedStore.modules[moduleId].exposedValues.variables;

describe('per-module state is independent', () => {
  test('an exposed value written to one module is invisible in the other', () => {
    bootModule('m1');
    seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') }, { moduleId: 'canvas' });
    seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') }, { moduleId: 'm1' });

    s().setExposedValue('c1', 'value', 'FROM_CANVAS', 'canvas');
    s().setExposedValue('c1', 'value', 'FROM_M1', 'm1');

    expect(s().getExposedValueOfComponent('c1', 'canvas').value).toBe('FROM_CANVAS');
    expect(s().getExposedValueOfComponent('c1', 'm1').value).toBe('FROM_M1');
  });

  test('each module owns its own dependency graph', () => {
    bootModule('m1');
    seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') }, { moduleId: 'canvas' });
    seedApp({ c1: componentDefinition('c1', 'textinput1', 'TextInput') }, { moduleId: 'm1' });

    // `addDependency` normalises fromPath to its first three segments
    // (DependencyClass.js:24 -> addNode(path, 3)), so the edge is only
    // addressable under an already-3-segment path. Using a longer one silently
    // registers a different edge and the assertion below would pass vacuously.
    s().addDependency('components.c1.value', 'components.c2.properties.text', {}, 'm1');

    expect(s().checkIfDependencyExists('components.c1.value', 'components.c2.properties.text', 'm1')).toBe(true);
    expect(s().checkIfDependencyExists('components.c1.value', 'components.c2.properties.text', 'canvas')).toBe(false);
  });

  test('fireEvent with an explicit moduleId runs the action in that module', async () => {
    bootModule('m1');
    seedApp({}, { moduleId: 'canvas' });
    s().setEditorLoading(false, 'canvas');
    s().setCurrentMode('edit', 'canvas');

    s().eventsSlice.setEvents([handler({ actionId: 'set-custom-variable', key: 'items', value: 'M1' })], 'm1');
    s().eventsSlice.setEvents(
      [
        handler({
          actionId: 'set-custom-variable',
          key: 'items',
          value: 'CANVAS',
        }),
      ],
      'canvas'
    );

    s().eventsSlice.fireEvent('onClick', 'component-1', 'm1', {}, {});
    await drain();

    expect(variables('m1').items).toBe('M1');
    expect(variables('canvas').items).toBeUndefined();
  });
});

describe('confirmed module-isolation bugs', () => {
  /**
   * BUG — eventsSlice.js:211-212. `updateAppVersionEventHandlers(events, type, param, moduleId)`
   * reads `get().modules['canvas'].componentNameIdMapping` / `queryNameIdMapping`
   * regardless of `moduleId`, then hands them to
   * `replaceQueryOptionsEntityReferencesWithIds`. A component that exists only in
   * the module is therefore not in the mapping, so its NAME is persisted where an
   * ID belongs — and a later rename of the main app's component silently rebinds
   * or breaks the module's handler.
   */
  test.failing("a module's event handler is serialised with the module's name->id mapping", async () => {
    bootModule('m1');
    // btn1 exists ONLY inside the module. canvas has an unrelated component.
    seedApp({ 'canvas-c': componentDefinition('canvas-c', 'other1', 'Button') }, { moduleId: 'canvas' });
    seedApp({ 'm1-btn': componentDefinition('m1-btn', 'btn1', 'Button') }, { moduleId: 'm1' });
    s().setApp({ appId: 'app-m1' }, 'm1');
    s().eventsSlice.setEvents([], 'm1');

    const save = jest.spyOn(appVersionService, 'saveAppVersionEventHandlers').mockResolvedValue([]);

    await s().eventsSlice.updateAppVersionEventHandlers(
      [
        handler({
          actionId: 'show-alert',
          message: '{{components.btn1.text}}',
        }),
      ],
      'update',
      undefined,
      'm1'
    );

    const persisted = JSON.stringify(save.mock.calls[0][2]);
    expect(persisted).toContain('components.m1-btn.text');
  });

  /**
   * BUG — eventsSlice.js:472-478. `logError` has no `moduleId` parameter at all
   * and hardcodes `get().modules.canvas.pages`, `getCurrentPageId('canvas')` and
   * `modules['canvas'].componentNameIdMapping`. Every runtime error raised inside
   * a module is therefore filed against the MAIN APP's current page, and the
   * component name resolves to `undefined` because the module's component id is
   * not in the canvas mapping.
   */
  test.failing("a module's action error is attributed to the module's page and component", async () => {
    bootModule('m1');
    seedApp({ 'canvas-c': componentDefinition('canvas-c', 'other1', 'Button') }, { moduleId: 'canvas' });
    seedApp({ 'm1-btn': componentDefinition('m1-btn', 'btn1', 'Button') }, { moduleId: 'm1', pageId: 'm1-page' });
    // Give the two namespaces distinguishable page names.
    s().setPages(
      [
        {
          id: 'm1-page',
          handle: 'modulepage',
          name: 'ModulePage',
          components: {},
        },
      ],
      'm1'
    );
    s().setCurrentPageId('m1-page', 'm1');
    s().debugger.clear();

    // `show-modal` with no modal throws inside showModal -> logError.
    s().eventsSlice.setEvents([handler({ sourceId: 'm1-btn', actionId: 'show-modal', modal: '' })], 'm1');
    s().eventsSlice.fireEvent('onClick', 'm1-btn', 'm1', {}, {});
    await drain();

    expect(s().debugger.logs[0].key).toBe('[Page ModulePage] [Component btn1] [Event onClick] [Action show-modal]');
  });

  /**
   * BUG — eventsSlice.js:502. `constructErrorHeader` reads `currentPage.name`
   * unconditionally, before it knows whether the header template even uses a page
   * name. With no current page yet (an error raised during app load, or any
   * namespace whose pages have not been set) `currentPage` is `undefined` and
   * logError throws a TypeError out of the catch block it was called from,
   * replacing the real error with an unrelated crash.
   */
  test.failing('logError survives being called before any page exists', () => {
    expect(s().modules.canvas.pages).toEqual([]);

    expect(() =>
      s().eventsSlice.logError('event', 'run-query', new Error('boom'), {
        event: { eventId: 'onDataQuerySuccess', actionId: 'run-query' },
      })
    ).not.toThrow();
  });

  /**
   * BUG — eventsSlice.js:1347 / :1363 / :1379. `generateAppActions(queryId, mode,
   * isPreview, moduleId)` builds the RunJS `log` / `logInfo` / `logError`
   * helpers, and all three resolve the calling query with
   * `dataQuery.queries.modules['canvas'].find(...)` instead of `modules[moduleId]`.
   * For a query that lives in a module the lookup returns `undefined` and the very
   * next line (`query.name`) throws, so `log()` inside a module's RunJS crashes
   * the query instead of writing a debugger entry.
   */
  test.failing('RunJS log() finds the calling query when it lives in a module', () => {
    bootModule('m1');
    seedApp({}, { moduleId: 'canvas' });
    s().dataQuery.setQueries([{ id: 'm1-q', name: 'moduleQuery', options: {} }], 'm1');
    s().debugger.clear();

    const actions = s().eventsSlice.generateAppActions('m1-q', 'edit', false, 'm1');
    actions.log('hello from the module');

    expect(s().debugger.logs[0].description).toBe('hello from the module');
    expect(s().debugger.logs[0].key).toContain('moduleQuery');
  });

  /**
   * BUG — eventsSlice.js:1085. Inside `generateAppActions(..., moduleId)` the
   * returned `runQuery` re-declares its own `moduleId = 'canvas'` parameter,
   * SHADOWING the module the actions were generated for. RunJS receives this
   * function as `actions.runQuery` and the documented call is
   * `actions.runQuery('name')` with no third argument, so a module's RunJS can
   * only ever see the MAIN APP's queries. Its siblings `resetQuery`
   * (eventsSlice.js:1124) and `abortQuery` (:1139) get this right by closing over
   * the outer `moduleId`, which is what makes this a slip rather than a design.
   */
  test.failing("RunJS runQuery('name') resolves against the enclosing module", () => {
    bootModule('m1');
    seedApp({}, { moduleId: 'canvas' });
    s().dataQuery.setQueries(
      [
        {
          id: 'm1-q',
          name: 'moduleQuery',
          options: {},
          kind: 'restapi',
          data_source_id: 'ds-1',
        },
      ],
      'm1'
    );
    const toastError = jest.spyOn(toast, 'error');

    // Generated FOR the query itself, which is the only way to observe the
    // lookup without letting a found query proceed to the network: a
    // self-reference is rejected by a different branch (eventsSlice.js:1097)
    // with a different message, and neither branch runs the query.
    const actions = s().eventsSlice.generateAppActions('m1-q', 'edit', false, 'm1');
    actions.runQuery('moduleQuery');

    expect(toastError).toHaveBeenCalledWith('Cannot run query from itself');
  });
});
