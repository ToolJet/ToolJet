/**
 * UI 2.0 Combobox and Multiselect with server-side search: a selection outside the current result page is kept.
 *
 * Release audit 17 (17 Oct, P1): with serverSideSearch on, the app replaces `options` with each search's results.
 * Select Alice, search Bob, get [Bob] back: the Combobox exposed value '' and the Multiselect [], so a Form submitted
 * no assignee; picking Bob then dropped Alice for good. The selection now keeps each picked option's record while
 * it is off the page. Without server-side search the options are the whole list, so an option that leaves it was
 * deleted and its selection goes (the control).
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'field1';
const ALICE = [{ label: 'Alice', value: 'alice' }];
const BOB = [{ label: 'Bob', value: 'bob' }];
const bound = (value) => binding(`{{${JSON.stringify(value)}}}`);
const TYPES = ['ShadCombobox', 'ShadMultiselect'];
const harnesses = Object.fromEntries(
  TYPES.map((componentType) => [
    componentType,
    createWidgetHarness({ componentType, id: ID, handle: 'field1', preload: [componentType] }),
  ])
);

describe.each(TYPES)('[UI2-REMOTE-017] %s with server-side search', (type) => {
  const multi = type === 'ShadMultiselect';
  const widget = harnesses[type];
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);
  const selection = () => (multi ? widget.exposed().values : widget.exposed().value);
  const selected = () => (multi ? widget.exposed().selectedOptions : widget.exposed().selectedOption);
  const setOptions = (options) =>
    widget.setComponentProperty(ID, 'options', `{{${JSON.stringify(options)}}}`, 'properties');

  const render = async (serverSideSearch = true) => {
    widget.render({
      currentMode: 'view',
      properties: {
        label: binding('Assignees'),
        searchPlaceholder: binding('Search people'),
        serverSideSearch: bound(serverSideSearch),
        options: bound(ALICE),
        defaultValue: bound(multi ? ['alice'] : 'alice'),
      },
    });
    await waitFor(() => expect(selection()).toEqual(multi ? ['alice'] : 'alice'));
    await act(async () => fireEvent.click(screen.getByRole('combobox')));
    await screen.findByRole('listbox');
    await act(async () => fireEvent.change(screen.getByPlaceholderText('Search people'), { target: { value: 'Bob' } }));
    await waitFor(() => expect(widget.exposed().searchText).toBe('Bob'));
  };

  it('keeps the selection, with its record, when the results no longer hold it', async () => {
    await render();
    setOptions(BOB);
    await waitFor(() => expect(widget.exposed().options).toEqual(BOB));
    expect(selection()).toEqual(multi ? ['alice'] : 'alice');
    expect(selected()).toEqual(multi ? ALICE : ALICE[0]);
  });

  if (multi)
    it('adds a pick from the new results to the kept selection', async () => {
      await render();
      setOptions(BOB);
      await waitFor(() => expect(widget.exposed().options).toEqual(BOB));
      await act(async () => fireEvent.click(screen.getByText('Bob').closest('[cmdk-item]')));
      await waitFor(() => expect(widget.exposed().values).toEqual(['alice', 'bob']));
      setOptions([...ALICE, ...BOB]);
      await waitFor(() => expect(widget.exposed().options).toHaveLength(2));
      expect(widget.exposed().values).toEqual(['alice', 'bob']);
    });

  it('without server-side search, an option that leaves the list leaves the selection', async () => {
    await render(false);
    setOptions(BOB);
    await waitFor(() => expect(widget.exposed().options).toEqual(BOB));
    await waitFor(() => expect(selection()).toEqual(multi ? [] : ''));
  });
});
