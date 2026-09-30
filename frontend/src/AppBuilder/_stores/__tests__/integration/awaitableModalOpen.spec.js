/**
 * Awaitable modal open (PR #18083): the step after opening a modal must be able
 * to use the modal's children.
 *
 * The bug: `components.modal1.open()` followed by `components.textinput1.setText()`
 * failed, because the child had not mounted yet — and in RunJS, `components` was
 * a snapshot from the start of the run, so the child's actions never appeared
 * even after waiting. Two App Builder surfaces had to change:
 *   - the Show modal action returns open()'s promise, so the next action waits;
 *   - RunJS `components` reads the store live, like `queries` already did.
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
    closeCalls: 0,
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
      close: async () => {
        modal.closeCalls += 1;
      },
    },
    MODULE_ID
  );
  return modal;
}

afterEach(() => drainExposedValueBatch());

describe('Show modal action', () => {
  const onClick = (actionId, event, index) => ({
    id: `evt-${index}`,
    index,
    sourceId: 'button1',
    name: `evt-${index}`,
    target: 'component',
    event: { eventId: 'onClick', actionId, ...event },
  });
  const showModal = onClick('show-modal', { modal: 'modal1' }, 0);
  const setText = onClick(
    'control-component',
    {
      componentId: 'textinput1',
      componentSpecificActionHandle: 'setText',
      componentSpecificActionParams: [{ handle: 'text', value: '123' }],
    },
    1
  );

  test('the next action waits until the modal has opened, so it can set text on a child', async () => {
    const modal = seedModalWithChild();

    const run = state().eventsSlice.executeActionsForEventId('onClick', [showModal, setText], 'view', {}, MODULE_ID);
    await drain();

    // Still opening: the child has only its seeded defaults, and Set text has not run yet
    expect(modal.openCalls).toBe(1);
    expect(exposed('textinput1').setText).toBeUndefined();
    expect(exposed('textinput1').value).toBe('');

    modal.finishOpening();
    await run;

    expect(exposed('textinput1').value).toBe('123');
  });

  test('works again after the modal is closed and reopened', async () => {
    const modal = seedModalWithChild();
    const closeModal = onClick('close-modal', { modal: 'modal1' }, 0);

    const first = state().eventsSlice.executeActionsForEventId('onClick', [showModal], 'view', {}, MODULE_ID);
    await drain();
    modal.finishOpening();
    await first;
    await state().eventsSlice.executeActionsForEventId('onClick', [closeModal], 'view', {}, MODULE_ID);
    expect(modal.closeCalls).toBe(1);

    const second = state().eventsSlice.executeActionsForEventId('onClick', [showModal, setText], 'view', {}, MODULE_ID);
    await drain();
    expect(modal.openCalls).toBe(2);
    expect(exposed('textinput1').value).toBe('');

    modal.finishOpening();
    await second;

    expect(exposed('textinput1').value).toBe('123');
  });
});

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

  test('assigning into `components` does not replace a component', async () => {
    seedModalWithChild();
    mountTextInput('kept');

    const result = await runJs(`components.textinput1 = 'replaced';
      return components.textinput1.value;`);

    expect(result).toEqual({ status: 'ok', data: 'kept' });
  });
});
