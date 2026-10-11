/**
 * TagsInput — `onSearch` event and `searchText` exposed variable (PR #17672).
 * Shared setup lives in ./widgetHarness.js.
 *
 * Scope, stated up front: this file covers only the search-text behaviour
 * added by that PR — `onSearch` firing as the user types, and `searchText`
 * retaining the last typed value across a clear instead of resetting to ''.
 * Tag creation/selection, validation, and the widget's other lifecycle
 * events are exercised elsewhere and not repeated here.
 */
import { waitFor } from '@testing-library/react';
import { createWidgetHarness, binding, setVariableOn, store, MODULE_ID } from './widgetHarness';

const ID = 'tags1';
const NAME = 'tagsinput1';

const widget = createWidgetHarness({
  componentType: 'TagsInput',
  handle: NAME,
  id: ID,
  defaultProperties: { visibility: binding('{{true}}') },
});

/** The CreatableSelect's own text input — the only `<input>` TagsInput renders. */
const input = (container) => container.querySelector('.tags-input-widget input');

/**
 * TagsInput is lazy-loaded, so on the first render in a file the input isn't
 * in the DOM yet — waiting for it here mirrors DropdownV2's `openMenu`.
 */
async function getInput(container) {
  await waitFor(() => expect(input(container)).toBeInTheDocument());
  return input(container);
}

/**
 * Registers a real `set-custom-variable` action on onSearch whose value is a
 * binding into this component's own exposed `searchText`. The variable it
 * writes is the probe: a stale read leaves the PREVIOUS search text there,
 * which is exactly the ordering bug this event's firing point could hide.
 */
function attachOnSearchCapture() {
  return setVariableOn(ID, 'onSearch', { key: 'seenByHandler', value: `{{components.${NAME}.searchText}}` });
}

describe('TagsInput', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('search', () => {
    test('typing in the search box fires onSearch and exposes the freshly typed searchText', async () => {
      const { container } = widget.render({ events: attachOnSearchCapture() });

      await widget.session.user.type(await getInput(container), 'ga');

      await waitFor(() => expect(widget.exposed().searchText).toBe('ga'));
      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('ga');
    });

    test('clearing the search box keeps the last searched text exposed instead of resetting it', async () => {
      const { container } = widget.render({});
      const el = await getInput(container);

      await widget.session.user.type(el, 'ga');
      await waitFor(() => expect(widget.exposed().searchText).toBe('ga'));

      await widget.session.user.clear(el);

      expect(el).toHaveValue('');
      expect(widget.exposed().searchText).toBe('ga');
    });

    test('starting a new search after a clear overwrites the retained searchText', async () => {
      const { container } = widget.render({});
      const el = await getInput(container);

      await widget.session.user.type(el, 'ga');
      await waitFor(() => expect(widget.exposed().searchText).toBe('ga'));
      await widget.session.user.clear(el);
      expect(widget.exposed().searchText).toBe('ga');

      await widget.session.user.type(el, 'zzz');

      await waitFor(() => expect(widget.exposed().searchText).toBe('zzz'));
    });
  });
});
