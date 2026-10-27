/**
 * Awaitable modal open (PR #18083): the step after opening a modal must be able
 * to use the modal's children.
 *
 * The bug: in RunJS, `await components.modal1.open()` followed by
 * `components.textinput1.setText()` failed with "setText is not a function".
 * `components` was a snapshot from the start of the run, taken before the
 * modal's child had mounted, so the child's actions never appeared even after
 * waiting. RunJS `components` now reads the store live, like `queries` already did.
 *
 * The no-code Show modal action is deliberately unchanged: it does not wait for
 * open(), and Control component reads the store live on its own.
 *
 * Arranged through the real store only. The modal and its child are registered
 * the way a mounted widget registers itself — `setExposedValues` — with the
 * modal's `open()` held on a promise the test releases. Releasing it stands in
 * for "the modal finished opening and its child mounted", which is the exact
 * ordering the bug depends on. The widget's own timing (enter transition,
 * timeout) is ModalV2's contract, not these slices'.
 */
import useStore from '@/AppBuilder/_stores/store';
import { seedApp, componentDefinition, drainExposedValueBatch } from '@/test/app-builder';

const MODULE_ID = 'canvas';
const state = () => useStore.getState();
const drain = () => new Promise((resolve) => setTimeout(resolve, 0));
const exposed = (componentId) => state().getExposedValueOfComponent(componentId, MODULE_ID);

/** Registers the child's exposed value and actions, as TextInput does on mount. */
function mountTextInput(value = '') {
  state().setExposedValues(
    'textinput1',
    'components',
    {
      value,
      setText: async (text) => state().setExposedValue('textinput1', 'value', text, MODULE_ID),
    },
    MODULE_ID
  );
}

/**
 * Seeds modal1 with textinput1 inside it. modal1.open() stays pending until the
 * test calls `finishOpening()`, which first runs `onOpened` (e.g. mounting the child).
 */
function seedModalWithChild({ onOpened = () => mountTextInput() } = {}) {
  const child = componentDefinition('textinput1', 'textinput1', 'TextInput');
  child.component.parent = 'modal1';
  seedApp({ modal1: componentDefinition('modal1', 'modal1', 'ModalV2'), textinput1: child }, { moduleId: MODULE_ID });
  state().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1' });
  state().setEditorLoading(false, MODULE_ID);
  state().setCurrentMode('view', MODULE_ID);

  let release = null;
  const modal = {
    openCalls: 0,
    finishOpening() {
      if (!release) throw new Error('modal1.open() has not been called');
      release();
      release = null;
    },
  };
  state().setExposedValues(
    'modal1',
    'components',
    {
      show: false,
      open: () => {
        modal.openCalls += 1;
        return new Promise((resolve) => {
          release = () => {
            onOpened();
            resolve();
          };
        });
      },
      close: async () => {},
    },
    MODULE_ID
  );
  return modal;
}

afterEach(() => drainExposedValueBatch());

describe('RunJS components', () => {
  function runJs(code) {
    state().dataQuery.setQueries([{ id: 'q1', name: 'runjs1', kind: 'runjs', options: { code } }], MODULE_ID);
    state().setQueryMapping(MODULE_ID);
    return state().queryPanel.executeMultilineJS(code, 'q1', false, 'view', {}, MODULE_ID);
  }

  /** Runs `code`, releasing modal1.open() once the code has called it. */
  async function runJsThroughModalOpen(modal, code) {
    const run = runJs(code);
    await drain();
    expect(modal.openCalls).toBe(1);
    modal.finishOpening();
    return run;
  }

  test('`await components.modal1.open()` is followed by a usable child', async () => {
    const modal = seedModalWithChild();

    const result = await runJsThroughModalOpen(
      modal,
      `await components.modal1.open();
       await components.textinput1.setText('123');`
    );

    expect(result.status).toBe('ok');
    expect(exposed('textinput1').value).toBe('123');
  });

  test('a component value read after an await is the current value, not the start-of-run value', async () => {
    const modal = seedModalWithChild({ onOpened: () => state().setExposedValue('textinput1', 'value', 'after') });
    mountTextInput('before');

    const result = await runJsThroughModalOpen(
      modal,
      `const first = components.textinput1.value;
       await components.modal1.open();
       return [first, components.textinput1.value];`
    );

    expect(result).toEqual({ status: 'ok', data: ['before', 'after'] });
  });

  test('looping over `components` skips components that have no value yet (e.g. in a collapsed Table row)', async () => {
    const rowChild = componentDefinition('rowtext1', 'rowtext1', 'Text');
    rowChild.component.parent = 'table1';
    seedApp(
      {
        textinput1: componentDefinition('textinput1', 'textinput1', 'TextInput'),
        table1: componentDefinition('table1', 'table1', 'Table'),
        rowtext1: rowChild,
      },
      { moduleId: MODULE_ID }
    );
    state().setCurrentMode('view', MODULE_ID);

    const result = await runJs(`return Object.values(components).map((c) => c.id);`);

    expect(result.status).toBe('ok');
    expect(result.data).toEqual(expect.arrayContaining(['textinput1', 'table1']));
    expect(result.data).not.toContain('rowtext1');
  });

  test('assigning into `components` does not replace a component', async () => {
    seedModalWithChild();
    mountTextInput('kept');

    const result = await runJs(`components.textinput1 = 'replaced';
      return components.textinput1.value;`);

    expect(result).toEqual({ status: 'ok', data: 'kept' });
  });
});
