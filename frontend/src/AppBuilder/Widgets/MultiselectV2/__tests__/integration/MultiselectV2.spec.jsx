/**
 * MultiselectV2 contract scenarios against the real RenderWidget/store path.
 *
 * CustomMenuList virtualizes options. Its browser geometry source is
 * `offsetHeight`, which jsdom fixes at zero, so the only boundary controlled
 * here is a per-test non-zero height. The widget, resolver, events, and store
 * remain real.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  option,
  setVariableOn,
  MODULE_ID,
} from '../../../__tests__/integration/widgetHarness';

const ID = 'multiselect1';
const NAME = 'multiselect1';

const widget = createWidgetHarness({
  componentType: 'MultiselectV2',
  handle: NAME,
  id: ID,
  defaultProperties: {
    label: binding('Choose letters'),
    visibility: binding('{{true}}'),
    showAllOption: binding('{{false}}'),
    showSearchInput: binding('{{false}}'),
    // The registered definition always carries these; without them the widget
    // publishes `undefined` for isLoading/isDisabled and EXP-001 would be
    // asserting a harness gap rather than the widget's surface.
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    optionsLoadingState: binding('{{false}}'),
  },
  defaultStyles: {
    auto: binding('{{true}}'),
    labelWidth: binding('33'),
    widthType: binding('ofComponent'),
    alignment: binding('side'),
    direction: binding('left'),
  },
  offsetHeight: 300,
});

const letters = {
  value: [option('Alpha', 'a'), option('Beta', 'b'), option('Gamma', 'c')],
};

async function openMenu() {
  const combobox = await screen.findByRole('combobox', { name: 'Choose letters' });
  await widget.session.user.click(combobox);
  return combobox;
}

const seenByHandler = (key) => widget.session.store.read((state) => state.getVariable(key, MODULE_ID));
const widgetRoot = () => document.querySelector('.multiselect-widget');
const controlLoader = () => document.querySelector('.tj-widget-loader');
const fieldIcon = () => document.querySelector('.icon-tabler-home-2, .tabler-icon-home-2');

describe('MultiselectV2', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[MultiselectV2-SEL-001] selecting visible options publishes ordered values and lets onSelect read the current selection', async () => {
    widget.render({
      properties: {
        options: { value: [option('Alpha', 'a'), option('Beta', 'b'), option('Hidden', 'hidden', { visible: false })] },
      },
    });
    widget.setEvents(
      setVariableOn(ID, 'onSelect', { key: 'selectionSeenByHandler', value: `{{components.${NAME}.values}}` })
    );

    await openMenu();
    await widget.session.user.click(await screen.findByText('Alpha'));
    await widget.session.user.click(await screen.findByText('Beta'));

    await waitFor(() => expect(widget.exposed().values).toEqual(['a', 'b']));
    expect(widget.exposed().selectedOptions).toEqual([
      { label: 'Alpha', value: 'a', caption: null },
      { label: 'Beta', value: 'b', caption: null },
    ]);
    expect(widget.session.store.read((state) => state.getVariable('selectionSeenByHandler', MODULE_ID))).toEqual([
      'a',
      'b',
    ]);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  test('[MultiselectV2-LIMIT-001] a configured max limit protects both menu and selectOptions selections', async () => {
    widget.render({
      properties: {
        maxLimit: binding('2'),
        options: { value: [option('Alpha', 'a'), option('Beta', 'b'), option('Gamma', 'c')] },
      },
    });

    await openMenu();
    await widget.session.user.click(await screen.findByText('Alpha'));
    await widget.session.user.click(await screen.findByText('Beta'));

    const gamma = (await screen.findAllByRole('option')).find((element) => element.textContent === 'Gamma');
    expect(gamma).toHaveAttribute('aria-disabled', 'true');
    await widget.session.user.click(gamma);
    await waitFor(() => expect(widget.exposed().values).toEqual(['a', 'b']));

    await widget.act('selectOptions', ['c']);
    expect(widget.exposed().values).toEqual(['a', 'b']);
  });

  test('[MultiselectV2-OPT-001] dynamic schema options replace static options and apply schema defaults', async () => {
    widget.render({
      properties: {
        advanced: binding('{{true}}'),
        options: { value: [option('Static option', 'static')] },
        schema: binding('{{ [{ label: "Schema option", value: "schema", visible: true, default: true }] }}'),
      },
    });

    await openMenu();

    const options = await screen.findAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Schema option');
    expect(screen.queryByText('Static option')).not.toBeInTheDocument();
    await waitFor(() => expect(widget.exposed().values).toEqual(['schema']));
    expect(widget.exposed().selectedOptions).toEqual([{ label: 'Schema option', value: 'schema', caption: null }]);
  });

  describe('component-specific actions', () => {
    test('[MultiselectV2-ACT-001] selectOptions selects matching options and publishes values and selectedOptions', async () => {
      // Break this catches: dropping the object unwrap or the membership check
      // so a RunJS call that forwards option records selects nothing.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b')] } },
      });

      await widget.act('selectOptions', ['a', { value: 'b' }]);
      await waitFor(() => expect(widget.exposed().values).toEqual(['a', 'b']));
      expect(widget.exposed().selectedOptions).toEqual([
        { label: 'Alpha', value: 'a', caption: null },
        { label: 'Beta', value: 'b', caption: null },
      ]);
    });

    // needs to be looked at again
    test.skip('[MultiselectV2-ACT-002] deselectOptions with no argument clears all selections', async () => {
      // Break this catches: the documented no-argument clear-all path going
      // missing again, leaving saved apps that call deselectOptions() stuck.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b')] } },
      });

      await widget.act('selectOptions', ['a', 'b']);
      await waitFor(() => expect(widget.exposed().values).toEqual(['a', 'b']));

      await widget.act('deselectOptions');
      await waitFor(() => expect(widget.exposed().values).toEqual([]));
      expect(widget.exposed().selectedOptions).toEqual([]);
    });

    test('[MultiselectV2-ACT-003] clear empties the published selection', async () => {
      // Break this catches: clear() updating the display without emptying the
      // published values an app binds to.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b')] } },
      });

      await widget.act('selectOptions', ['a', 'b']);
      await waitFor(() => expect(widget.exposed().values).toEqual(['a', 'b']));

      await widget.act('clear');
      await waitFor(() => expect(widget.exposed().values).toEqual([]));
      expect(widget.exposed().selectedOptions).toEqual([]);
    });
  });

  describe('search', () => {
    /** The in-menu search box; it is the only input carrying this placeholder. */
    const searchBox = () => screen.getByPlaceholderText('Search');

    test('[MultiselectV2-SRCH-001] the in-menu search box narrows the option list as the user types', async () => {
      // Break: filtering on the wrong field, or leaving the full list rendered,
      // which is what the client/server search change `2d9d9ec2a858` touched.
      widget.render({
        properties: { showSearchInput: binding('{{true}}'), options: letters },
      });
      await openMenu();
      expect(await screen.findAllByRole('option')).toHaveLength(3);

      await widget.session.user.type(searchBox(), 'Bet');

      const remaining = await screen.findAllByRole('option');
      expect(remaining).toHaveLength(1);
      expect(remaining[0]).toHaveTextContent('Beta');
    });

    test('[MultiselectV2-SRCH-002] typing in the search box publishes searchText', async () => {
      // Break: publishing the previous keystroke, or not publishing at all —
      // a server-side query binds to this variable.
      widget.render({
        properties: { showSearchInput: binding('{{true}}'), options: letters },
      });
      await openMenu();

      await widget.session.user.type(searchBox(), 'Gam');

      await waitFor(() => expect(widget.exposed().searchText).toBe('Gam'));
    });

    test('[MultiselectV2-SRCH-003] server-side search leaves filtering to the query', async () => {
      // Break: applying the client filter anyway, which hides rows the query
      // deliberately returned.
      widget.render({
        properties: {
          showSearchInput: binding('{{true}}'),
          serverSideSearch: binding('{{true}}'),
          options: letters,
        },
      });
      await openMenu();

      await widget.session.user.type(searchBox(), 'Bet');

      expect(await screen.findAllByRole('option')).toHaveLength(3);
      await waitFor(() => expect(widget.exposed().searchText).toBe('Bet'));
    });

    test('[MultiselectV2-SRCH-004] typing in the search box fires onSearchTextChanged, and merely opening the menu does not', async () => {
      // Break: dropping the fireEvent, or dropping the `input-change` guard so
      // react-select's own menu bookkeeping re-runs the server-side query.
      // SRCH-002 covers the published variable; this covers the event that
      // makes a server-side query re-run at all.
      widget.render({
        properties: { showSearchInput: binding('{{true}}'), options: letters },
      });
      widget.setEvents([
        {
          id: 'evt-on-search-text-changed',
          name: 'onSearchTextChanged',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: {
            eventId: 'onSearchTextChanged',
            actionId: 'set-custom-variable',
            key: 'searchSeenByHandler',
            value: `{{components.${NAME}.searchText}}`,
          },
        },
      ]);

      await openMenu();
      expect(await screen.findAllByRole('option')).toHaveLength(3);
      expect(seenByHandler('searchSeenByHandler')).toBeUndefined();

      await widget.session.user.type(searchBox(), 'Gam');

      await waitFor(() => expect(seenByHandler('searchSeenByHandler')).toBe('Gam'));
    });
  });

  describe('empty state and clearing', () => {
    test('[MultiselectV2-PLH-001] the placeholder shows while nothing is selected', async () => {
      // Break: rendering an empty control, or leaving the placeholder up while
      // a value is selected — both make an unset field unreadable.
      widget.render({
        properties: {
          placeholder: binding('Nothing picked yet'),
          options: { value: [option('Alpha', 'a'), option('Beta', 'b')] },
        },
      });

      expect(await screen.findByText('Nothing picked yet')).toBeInTheDocument();

      await openMenu();
      await widget.session.user.click(await screen.findByText('Alpha'));

      await waitFor(() => expect(widget.exposed().values).toEqual(['a']));
      expect(screen.queryByText('Nothing picked yet')).not.toBeInTheDocument();
    });

    test('[MultiselectV2-CLR-001] the clear affordance empties the published selection', async () => {
      // Break: clearing the display without clearing the published values.
      widget.render({
        properties: {
          showClearBtn: binding('{{true}}'),
          options: { value: [option('Alpha', 'a'), option('Beta', 'b')] },
        },
      });
      await openMenu();
      await widget.session.user.click(await screen.findByText('Alpha'));
      await waitFor(() => expect(widget.exposed().values).toEqual(['a']));

      await widget.session.user.click(screen.getByRole('button', { name: 'Clear selection' }));

      await waitFor(() => expect(widget.exposed().values).toEqual([]));
      expect(widget.exposed().selectedOptions).toEqual([]);
    });

    test('[MultiselectV2-CLR-001] no clear affordance is offered when the config turns it off', async () => {
      // Break: ignoring `showClearBtn` and always installing the indicator.
      // The selection below is load-bearing: react-select renders no clear
      // indicator for an EMPTY control whatever the config says, so asserting
      // absence before selecting would pass no matter what. A fault proved
      // exactly that — the assertion failed to fail until the select was added.
      widget.render({
        properties: {
          showClearBtn: binding('{{false}}'),
          options: { value: [option('Alpha', 'a')] },
        },
      });
      await openMenu();
      await widget.session.user.click(await screen.findByText('Alpha'));
      await waitFor(() => expect(widget.exposed().values).toEqual(['a']));

      expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
    });
  });

  describe('state actions', () => {
    test('[MultiselectV2-STATE-001] setVisibility hides the control and publishes isVisible', async () => {
      // Break this catches: publishing isVisible without applying the hidden
      // container class, so a bound flag lies about what is on screen.
      widget.render({ properties: { options: { value: [option('Alpha', 'a')] } } });
      await widget.act('setVisibility', false);
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
      expect(widgetRoot()).toHaveClass('invisible');
    });

    test('[MultiselectV2-STATE-001] setDisable disables the control and publishes isDisabled', async () => {
      // Break this catches: an action that publishes isDisabled without
      // disabling the combobox, so assistive tech and the flag disagree.
      widget.render({ properties: { options: { value: [option('Alpha', 'a')] } } });
      await widget.act('setDisable', true);
      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
      expect(screen.getByRole('combobox', { name: 'Choose letters' })).toBeDisabled();
    });

    test('[MultiselectV2-STATE-001] setLoading shows the loader and publishes isLoading', async () => {
      // Break this catches: publishing isLoading without rendering the loader
      // the user actually waits on.
      widget.render({ properties: { options: { value: [option('Alpha', 'a')] } } });
      await widget.act('setLoading', true);
      await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
      expect(controlLoader()).toBeInTheDocument();
    });

    test.each([
      ['setDisable', 'isDisabled'],
      ['setVisibility', 'isVisible'],
      ['setLoading', 'isLoading'],
    ])('[MultiselectV2-STATE-006] %s survives an unrelated property re-resolve', async (action, flag) => {
      // Break this catches: the property-to-state sync effect running on every
      // render, which would revert a CSA the moment any other property re-resolves.
      widget.render({ properties: { options: { value: [option('Alpha', 'a')] } } });
      await widget.act(action, action === 'setVisibility' ? false : true);
      await waitFor(() => expect(widget.exposed()[flag]).toBe(action !== 'setVisibility'));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'label', 'Changed by a query', 'properties');
      });

      expect(await screen.findByText('Changed by a query')).toBeInTheDocument();
      expect(widget.exposed()[flag]).toBe(action !== 'setVisibility');
      if (action === 'setDisable') {
        expect(screen.getByRole('combobox', { name: 'Changed by a query' })).toBeDisabled();
      } else if (action === 'setVisibility') {
        expect(widgetRoot()).toHaveClass('invisible');
      } else {
        expect(controlLoader()).toBeInTheDocument();
      }
    });

    test.each([
      ['setDisable', 'disabledState', 'isDisabled'],
      ['setVisibility', 'visibility', 'isVisible'],
      ['setLoading', 'loadingState', 'isLoading'],
    ])('[MultiselectV2-STATE-007] %s survives a no-op rewrite of %s', async (action, property, flag) => {
      // Break this catches: a binding that re-resolves the paired property to
      // the value it already had undoing the CSA.
      widget.render({ properties: { options: { value: [option('Alpha', 'a')] } } });
      await widget.act(action, action === 'setVisibility' ? false : true);
      await waitFor(() => expect(widget.exposed()[flag]).toBe(action !== 'setVisibility'));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, property, action === 'setVisibility' ? '{{true}}' : '{{false}}', 'properties');
      });

      expect(widget.exposed()[flag]).toBe(action !== 'setVisibility');
      if (action === 'setDisable') {
        expect(screen.getByRole('combobox', { name: 'Choose letters' })).toBeDisabled();
      } else if (action === 'setVisibility') {
        expect(widgetRoot()).toHaveClass('invisible');
      } else {
        expect(controlLoader()).toBeInTheDocument();
      }
    });
  });

  describe('boundary values', () => {
    test('[MultiselectV2-OPT-002] falsy option values and a boolean label stay selectable and readable', async () => {
      // Break: a truthiness test in the selection path (which drops `false`,
      // `0` and `''`) or an unsafe label render — the boolean-label crash
      // `6594e76b1f51` fixed.
      widget.render({
        properties: {
          options: {
            value: [option('Off', '{{false}}'), option('Zero', '{{0}}'), option('{{true}}', 'boolean-label')],
          },
        },
      });
      await openMenu();

      expect(await screen.findByText('true')).toBeInTheDocument();

      await widget.session.user.click(await screen.findByText('Off'));
      await waitFor(() => expect(widget.exposed().values).toEqual([false]));

      await widget.session.user.click(await screen.findByText('Zero'));
      await waitFor(() => expect(widget.exposed().values).toEqual([false, 0]));
      expect(widget.exposed().selectedOptions).toEqual([
        { label: 'Off', value: false, caption: null },
        { label: 'Zero', value: 0, caption: null },
      ]);
    });

    test.each([
      ['none', ['Charlie', 'Alpha', 'Bravo']],
      ['asc', ['Alpha', 'Bravo', 'Charlie']],
      ['desc', ['Charlie', 'Bravo', 'Alpha']],
    ])('[MultiselectV2-OPT-004] sort `%s` orders options by label', async (sort, labels) => {
      // Break this catches: dropping sortArray, or mapping `none` onto `asc`,
      // which silently reorders a saved app's option list.
      widget.render({
        properties: {
          sort: { value: sort },
          options: { value: [option('Charlie', 'c'), option('Alpha', 'a'), option('Bravo', 'b')] },
        },
      });
      await openMenu();

      expect((await screen.findAllByRole('option')).map((element) => element.textContent)).toEqual(labels);
    });
  });

  describe('the published surface', () => {
    test('[MultiselectV2-EXP-001] the widget publishes its documented variables and actions', async () => {
      // Break: dropping a documented variable from the mount-time surface,
      // which silently breaks every app binding to it.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a')] } },
      });
      await waitFor(() => expect(widget.exposed().selectOptions).toBeInstanceOf(Function));
      const exposed = widget.exposed();

      expect(exposed.label).toBe('Choose letters');
      expect(exposed.values).toEqual([]);
      expect(exposed.selectedOptions).toEqual([]);
      expect(exposed.options).toEqual([{ label: 'Alpha', value: 'a', caption: null }]);
      expect(exposed.searchText).toBe('');
      expect(exposed.isValid).toBe(true);
      expect(exposed.isMandatory).toBe(false);
      expect(exposed.isVisible).toBe(true);
      expect(exposed.isLoading).toBe(false);
      expect(exposed.isDisabled).toBe(false);

      for (const action of ['selectOptions', 'deselectOptions', 'clear', 'setVisibility', 'setLoading', 'setDisable']) {
        expect(exposed[action]).toBeInstanceOf(Function);
      }
    });
  });

  describe('Form lifecycle', () => {
    const FORM = 'form1';

    test('[MultiselectV2-FORM-001] clearing the parent Form clears the selection', async () => {
      widget.renderInsideForm({
        properties: {
          options: { value: [option('Alpha', 'a'), option('Beta', 'b')] },
        },
      });

      const combobox = await screen.findByRole('combobox', { name: 'Choose letters' });
      await widget.session.user.click(combobox);
      await widget.session.user.click(await screen.findByText('Alpha'));
      await waitFor(() => expect(widget.exposed().values).toEqual(['a']));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().values).toEqual([]));
      expect(widget.exposed().selectedOptions).toEqual([]);
    }, 30000);

    test('[MultiselectV2-FORM-002] submitting a Form reveals the mandatory error without prior interaction', async () => {
      // Break this catches: ignoring useShowValidationOnFormSubmit, so a
      // mandatory empty field stays silent through submit.
      widget.renderInsideForm({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b')] } },
        validation: { mandatory: binding('{{true}}') },
      });

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();

      await waitFor(() => expect(widget.exposed(FORM).isValid).toBe(false));
      await widget.session.store.act(async () => {
        await widget.exposed(FORM).submitForm();
      });

      expect(await screen.findByText('Field cannot be empty')).toBeInTheDocument();
      expect(widget.exposed().isValid).toBe(false);
    }, 30000);
  });

  describe('select all', () => {
    test('[MultiselectV2-ALL-001] the Select all option toggles every visible option', async () => {
      // Break this catches: dropping the SELECT_ALL branch so the extra row
      // is ornamental and never changes the published selection.
      widget.render({
        properties: { showAllOption: binding('{{true}}'), options: letters },
      });
      await openMenu();
      await widget.session.user.click(await screen.findByText('Select all'));

      await waitFor(() => expect(widget.exposed().values).toEqual(['a', 'b', 'c']));

      await widget.session.user.click(await screen.findByText('Select all'));
      await waitFor(() => expect(widget.exposed().values).toEqual([]));
    });

    test('[MultiselectV2-ALL-001] Select all is disabled when maxLimit is below the option count', async () => {
      // Break this catches: leaving Select all enabled under a maxLimit, which
      // would let a click try to select more than the limit allows.
      widget.render({
        properties: {
          showAllOption: binding('{{true}}'),
          maxLimit: binding('2'),
          options: letters,
        },
      });
      await openMenu();

      const selectAll = (await screen.findAllByRole('option')).find((element) =>
        element.textContent.includes('Select all')
      );
      expect(selectAll).toHaveAttribute('aria-disabled', 'true');
    });

    test('[MultiselectV2-ALL-002] all selected shows the all-selected label instead of option labels', async () => {
      // Break this catches: ignoring showAllSelectedLabel so a full selection
      // still renders the joined option list.
      widget.render({
        properties: {
          showAllSelectedLabel: binding('{{true}}'),
          options: letters,
        },
      });
      await widget.act('selectOptions', ['a', 'b', 'c']);
      await waitFor(() => expect(widget.exposed().values).toEqual(['a', 'b', 'c']));

      expect(await screen.findByText('All items are selected.')).toBeInTheDocument();
      expect(screen.queryByText('Alpha, Beta, Gamma')).not.toBeInTheDocument();
    });

    test('[MultiselectV2-ALL-003] Select all while a client search filter is active selects every option, not only the filtered ones', async () => {
      // Characterised, not endorsed. Break this catches: changing select-all
      // to honour the active filter, which would shrink the published
      // selection of every app that searches then hits Select all.
      widget.render({
        properties: {
          showAllOption: binding('{{true}}'),
          showSearchInput: binding('{{true}}'),
          options: letters,
        },
      });
      await openMenu();
      await widget.session.user.type(screen.getByPlaceholderText('Search'), 'Bet');
      expect((await screen.findAllByRole('option')).filter((element) => element.textContent === 'Beta')).toHaveLength(
        1
      );

      await widget.session.user.click(await screen.findByText('Select all'));

      await waitFor(() => expect(widget.exposed().values).toEqual(['a', 'b', 'c']));
    });
  });

  describe('options loading, validation, events, and icon', () => {
    test('[MultiselectV2-LOAD-002] optionsLoadingState shows a menu spinner without marking the control busy', async () => {
      // Break this catches: folding optionsLoadingState into aria-busy / isLoading,
      // or passing it through without `advanced` so the menu spinner never appears.
      // The runtime only forwards the flag when dynamic options are on.
      widget.render({
        properties: {
          advanced: binding('{{true}}'),
          optionsLoadingState: binding('{{true}}'),
          schema: binding(
            '{{ [{ label: "Alpha", value: "a", visible: true }, { label: "Beta", value: "b", visible: true }] }}'
          ),
        },
      });
      await openMenu();

      expect(controlLoader()).toBeInTheDocument();
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(screen.getByRole('combobox', { name: 'Choose letters' })).not.toHaveAttribute('aria-busy', 'true');
      expect(widget.exposed().isLoading).toBe(false);

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'optionsLoadingState', '{{false}}', 'properties');
      });

      expect(await screen.findByText('Alpha')).toBeInTheDocument();
      expect(screen.getByText('Beta')).toBeInTheDocument();
    });

    test('[MultiselectV2-VAL-002] a failing customRule message renders after interaction and clears when the rule passes', async () => {
      // Break this catches: never flipping userInteracted, so a failing rule
      // invalidates isValid but never shows its message.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b')] } },
        afterSeed: () =>
          widget.setComponentProperty(ID, 'customRule', "{{'Must pick two'}}", 'validation', 'value', false),
      });

      expect(screen.queryByText('Must pick two')).not.toBeInTheDocument();

      await openMenu();
      await widget.session.user.click(await screen.findByText('Alpha'));

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(await screen.findByText('Must pick two')).toBeInTheDocument();

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'customRule', '{{false}}', 'validation', 'value', false);
      });

      await waitFor(() => expect(widget.exposed().isValid).toBe(true));
      expect(screen.queryByText('Must pick two')).not.toBeInTheDocument();
    });

    test('[MultiselectV2-EVT-002] opening the menu fires onFocus once, and toggle-close fires onBlur once', async () => {
      // Break this catches: dropping fireEvent('onFocus') / fireEvent('onBlur')
      // from the click-inside toggle so handlers wired to those events never run.
      widget.render({ properties: { options: letters } });
      widget.setEvents([
        ...setVariableOn(ID, 'onFocus', { key: 'focusSeen', value: 'YES' }),
        ...setVariableOn(ID, 'onBlur', { key: 'blurSeen', value: 'YES' }),
      ]);

      expect(seenByHandler('focusSeen')).toBeUndefined();
      await openMenu();
      await waitFor(() => expect(seenByHandler('focusSeen')).toBe('YES'));
      expect(seenByHandler('blurSeen')).toBeUndefined();

      await widget.session.user.click(screen.getByRole('combobox', { name: 'Choose letters' }));
      await waitFor(() => expect(seenByHandler('blurSeen')).toBe('YES'));
    });

    test('[MultiselectV2-EVT-002] click-outside fires onBlur once', async () => {
      // Break this catches: the capture-phase mousedown listener going missing,
      // so a click on the canvas leaves the menu open and never blurs.
      widget.render({ properties: { options: letters } });
      widget.setEvents(setVariableOn(ID, 'onBlur', { key: 'blurSeen', value: 'YES' }));

      await openMenu();
      expect(await screen.findByText('Alpha')).toBeInTheDocument();
      expect(seenByHandler('blurSeen')).toBeUndefined();

      fireEvent.mouseDown(document.body);

      await waitFor(() => expect(seenByHandler('blurSeen')).toBe('YES'));
    });

    test('[MultiselectV2-ICON-001] the field icon renders when set and hides when iconVisibility is false', async () => {
      // Break this catches: dropping doShowIcon so a configured icon never
      // appears, or ignoring iconVisibility so it cannot be turned off.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a')] } },
        styles: { icon: binding('IconHome2'), iconVisibility: binding('{{true}}') },
      });

      await waitFor(() => expect(fieldIcon()).toBeInTheDocument());

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'iconVisibility', '{{false}}', 'styles');
      });

      await waitFor(() => expect(fieldIcon()).not.toBeInTheDocument());
    });
  });
});
