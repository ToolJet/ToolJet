/**
 * DropdownV2 — rendering and interaction, against the REAL store. Shared
 * setup lives in ../../../__tests__/integration/widgetHarness.js.
 *
 * Scope, stated up front: generic `validateWidget` rules are pinned at STORE
 * level in `_stores/slices/__tests__/integration/validateWidget.spec.js`. This
 * file crosses that seam only when the composed widget lifecycle is itself the
 * behavior, such as selecting a configured empty-string option. Its primary
 * scope is what the widget renders, exposes, and publishes to event actions.
 *
 * One DropdownV2-specific jsdom problem, and why the fix below is legitimate:
 * CustomMenuList virtualizes the option list (CustomMenuList.jsx:30-35), and
 * @tanstack/virtual-core measures the scroll container with `offsetHeight`
 * (virtual-core `getRect`), which jsdom hard-codes to 0 — with the ResizeObserver
 * stub emitting no entries, nothing ever corrects it. Zero measured height means
 * ZERO options in the DOM, so a spec that only asserts "the menu opened" proves
 * nothing about the options. `offsetHeight` is stubbed per-test below. Geometry
 * is one of the controls the harness explicitly permits (src/test/README.md,
 * "Mock discipline"); nothing about the widget itself is mocked.
 *
 * Option shape matters and is easy to get wrong. The inspector stores an option
 * as `{ label, value, visible: { value: '{{true}}' }, disable: { value: '{{false}}' } }`
 * (RightSideBar/Inspector/Components/Select.jsx:117-139), and the resolver
 * FLATTENS those wrappers to plain booleans before the widget sees them
 * (componentsSlice.js checkValueAndResolve). `option()` below builds that real
 * shape rather than the post-resolution one, so these tests would catch a
 * regression in that flattening too.
 */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  option,
  setVariableOn,
  store,
  MODULE_ID,
} from '../../../__tests__/integration/widgetHarness';

const ID = 'dd1';
const NAME = 'dropdown1';

const widget = createWidgetHarness({
  componentType: 'DropdownV2',
  handle: NAME,
  id: ID,
  // Passed explicitly on purpose: DropdownV2 renders itself with the
  // `invisible` class when `properties.visibility` is falsy, which silently
  // breaks every DOM assertion.
  defaultProperties: {
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    optionsLoadingState: binding('{{false}}'),
  },
  // Schema defaults for the label-sizing styles. `_ui/Label.jsx:31` renders
  // nothing unless `label && (width > 0 || auto)`, and DropdownV2 wires that
  // `width` prop from the `labelWidth` style key — without these, the "label
  // is rendered" test fails not because the label is broken, but because it
  // never mounts at all.
  defaultStyles: {
    auto: binding('{{true}}'),
    labelWidth: binding('33'),
    widthType: binding('ofComponent'),
    alignment: binding('side'),
    direction: binding('left'),
  },
  offsetHeight: 300,
});

async function openMenu() {
  const combobox = await screen.findByRole('combobox');
  // The open handler lives on `.dropdownV2-widget`, not the combobox input.
  fireEvent.click(combobox.closest('.dropdownV2-widget'));
  return combobox;
}

/** What the closed dropdown shows. Throws when the control is missing so `not.toContain` cannot pass on a failed render. */
function displayedText(container) {
  const root = container.querySelector('.dropdownV2-widget');
  if (!root) throw new Error('DropdownV2 control (.dropdownV2-widget) is not in the document');
  return root.textContent;
}

describe('DropdownV2', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  describe('options', () => {
    test('[DropdownV2-OPT-001] renders one entry per visible option, hiding the ones flagged not visible', async () => {
      const { container } = widget.render({
        properties: {
          options: { value: [option('Alpha', 'a'), option('Beta', 'b'), option('Gamma', 'c', { visible: false })] },
        },
      });

      await openMenu(container);

      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));
      expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual(['Alpha', 'Beta']);
      expect(screen.queryByText('Gamma')).not.toBeInTheDocument();
    });

    test('[DropdownV2-OPT-002] an options list bound to a `{{ }}` expression is resolved before it reaches the menu', async () => {
      // This is how a real app wires a dropdown to a query: the list is an
      // expression, not a literal, so it has to travel through the real
      // resolver and dependency graph to become options.
      const { container } = widget.render({
        properties: {
          options: binding(
            '{{ [{ "label": "Ada", "value": 1 }, { "label": "Grace", "value": 2 }].map(r => ({ label: r.label, value: r.value })) }}'
          ),
        },
      });

      await openMenu(container);

      await waitFor(() => expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual(['Ada', 'Grace']));
      expect(widget.exposed().options).toEqual([
        { label: 'Ada', value: 1, caption: null },
        { label: 'Grace', value: 2, caption: null },
      ]);
    });

    test('[DropdownV2-OPT-003] dynamic options read the `schema` property instead of `options` when advanced is on', async () => {
      const { container } = widget.render({
        properties: {
          advanced: binding('{{true}}'),
          options: { value: [option('FromOptions', 'x')] },
          schema: binding('{{ [{ label: "FromSchema", value: "s", visible: true }] }}'),
        },
      });

      await openMenu(container);

      await waitFor(() => expect(screen.getByText('FromSchema')).toBeInTheDocument());
      expect(screen.queryByText('FromOptions')).not.toBeInTheDocument();
    });

    test('[DropdownV2-OPT-004] sort `desc` reverses the option order the user sees', async () => {
      const { container } = widget.render({
        properties: {
          options: { value: [option('Alpha', 'a'), option('Beta', 'b'), option('Gamma', 'c')] },
          sort: { value: 'desc' },
        },
      });

      await openMenu(container);

      await waitFor(() =>
        expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual(['Gamma', 'Beta', 'Alpha'])
      );
    });

    test('[DropdownV2-OPT-005] an option flagged default is selected on mount, without any interaction', async () => {
      const { container } = widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })] } },
      });

      await waitFor(() => expect(displayedText(container)).toContain('Beta'));
      expect(widget.exposed().value).toBe('b');
    });

    test("[DropdownV2-OPT-006] an option's caption is rendered under its label", async () => {
      const { container } = widget.render({
        properties: { options: { value: [option('Alpha', 'a', { caption: 'first letter' })] } },
      });

      await openMenu(container);

      await waitFor(() => expect(screen.getByText('first letter')).toBeInTheDocument());
      expect(screen.getByRole('option')).toHaveTextContent('first letter');
    });

    test('[DropdownV2-OPT-007] an option flagged disable is rendered but not selectable', async () => {
      const { container } = widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b', { disable: true })] } },
      });

      await openMenu(container);
      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2));

      const beta = screen.getAllByRole('option')[1];
      expect(beta).toHaveAttribute('aria-disabled', 'true');

      await widget.session.user.click(beta);
      expect(widget.exposed().value).toBeUndefined();
    });
  });

  describe('selection', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b')] };

    test('[DropdownV2-SEL-002] picking an option exposes its value and the whole selected option', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await openMenu(container);
      await waitFor(() => expect(screen.getByText('Beta')).toBeInTheDocument());
      await widget.session.user.click(screen.getByText('Beta'));

      expect(widget.exposed().value).toBe('b');
      expect(widget.exposed().selectedOption).toEqual({ label: 'Beta', value: 'b', caption: null });
      expect(displayedText(container)).toContain('Beta');
    });

    test('[DropdownV2-SEL-003] picking an option closes the menu', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await openMenu(container);
      await waitFor(() => expect(screen.getByText('Beta')).toBeInTheDocument());
      await widget.session.user.click(screen.getByText('Beta'));

      await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0));
    });

    test('[DropdownV2-SEL-004] picking the already-selected option again clears the selection', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Beta'));
      expect(widget.exposed().value).toBe('b');

      await openMenu();
      // Not `findByText('Beta')` here: once selected, "Beta" is ALSO the
      // closed dropdown's displayed value, so a plain text query is
      // ambiguous the second time round. Scoping to the option ROLE (with a
      // manual textContent match rather than testing-library's accessible-name
      // matcher, which trips on the option's letter-by-letter highlight spans)
      // is what the first click (before any selection existed) didn't need.
      const options = await screen.findAllByRole('option');
      await widget.session.user.click(options.find((el) => el.textContent === 'Beta'));

      expect(widget.exposed().value).toBeNull();
      expect(widget.exposed().selectedOption).toBeNull();
    });

    test('[DropdownV2-SEL-005] the placeholder is what shows while nothing is selected', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, placeholder: binding('Pick a letter') } });

      await waitFor(() => expect(displayedText(container)).toContain('Pick a letter'));

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Alpha'));

      expect(displayedText(container)).not.toContain('Pick a letter');
    });

    test('[DropdownV2-ACT-002] the clear button empties the selection', async () => {
      // Break this catches: a clear affordance with no accessible name, so the
      // control can only be found by the `clear-indicator` class.
      widget.render({ properties: { options: OPTIONS, showClearBtn: binding('{{true}}') } });

      await openMenu();
      await widget.session.user.click(await screen.findByText('Alpha'));
      expect(widget.exposed().value).toBe('a');

      const clear = screen.getByRole('button', { name: 'Clear selection' });
      expect(clear).toHaveClass('clear-indicator');
      await widget.session.user.click(clear);

      expect(widget.exposed().value).toBeNull();
    });

    test('[DropdownV2-ACT-003] no clear button is rendered when showClearBtn is off', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, showClearBtn: binding('{{false}}') } });

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Alpha'));

      expect(container.querySelector('.clear-indicator')).not.toBeInTheDocument();
    });
  });

  describe('falsy option values', () => {
    // Selection presence comes from matching an option, not JavaScript
    // truthiness. The approved contract keeps `false`, `0`, and `''` as real
    // option values; clearing has the separate `null` representation. Commit
    // f39ae77294 independently confirms the option-widget rule for `false`.
    const FALSY_OPTIONS = {
      value: [option('Off', false), option('Zero', 0), option('Blank', ''), option('One', 1)],
    };

    test.each([
      ['false', 'Off', false],
      ['0', 'Zero', 0],
      ["''", 'Blank', ''],
    ])(
      '[DropdownV2-OPT-008] an option whose value is %s is selectable and exposed as itself',
      async (_label, optionLabel, value) => {
        const { container } = widget.render({ properties: { options: FALSY_OPTIONS } });

        await openMenu(container);
        await widget.session.user.click(await screen.findByText(optionLabel));

        expect(widget.exposed().value).toBe(value);
        // The `selectedOption` lookup is the second place a falsy value can be
        // lost: a truthiness test there returns null for a perfectly good option.
        expect(widget.exposed().selectedOption).toEqual({ label: optionLabel, value, caption: null });
        expect(displayedText(container)).toContain(optionLabel);
      }
    );

    test('[DropdownV2-OPT-005] a default option whose value is `false` is pre-selected on mount', async () => {
      const { container } = widget.render({
        properties: { options: { value: [option('Off', false, { isDefault: true }), option('One', 1)] } },
      });

      await waitFor(() => expect(displayedText(container)).toContain('Off'));
      expect(widget.exposed().value).toBe(false);
    });

    test('[DropdownV2-ACT-004] the selectOption action accepts `0` and does not read it as "no argument"', async () => {
      widget.render({ properties: { options: FALSY_OPTIONS } });

      await widget.act('selectOption', 0);

      expect(widget.exposed().value).toBe(0);
      expect(widget.exposed().selectedOption).toEqual({ label: 'Zero', value: 0, caption: null });
    });

    test('[DropdownV2-SEL-001] an empty-string option satisfies mandatory validation', async () => {
      const { container } = widget.render({
        properties: { label: binding('Required choice'), options: FALSY_OPTIONS },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      const combobox = await screen.findByRole('combobox', { name: /Required choice/ });
      await waitFor(() => expect(widget.exposed().isValid).toBe(false));

      await widget.session.user.click(combobox);
      await widget.session.user.click(await screen.findByText('Blank'));

      expect(displayedText(container)).toContain('Blank');
      expect(widget.exposed().value).toBe('');
      expect(widget.exposed().selectedOption).toEqual({ label: 'Blank', value: '', caption: null });
      await waitFor(() => expect(widget.exposed().isValid).toBe(true));
      expect(combobox).toHaveAttribute('aria-invalid', 'false');
      expect(within(container).queryByText('Field cannot be empty')).not.toBeInTheDocument();
    });
  });

  describe('onSelect', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b')] };

    test('[DropdownV2-EVT-001] onSelect actions read the option selected by the triggering interaction', async () => {
      // Public contract: event actions may bind to this widget's exposed value.
      // Sensitivity fault: firing onSelect before setInputValue makes this read stale data.
      widget.render({ properties: { label: binding('Letter'), options: OPTIONS } });
      widget.setEvents(setVariableOn(ID, 'onSelect', { key: 'seenByHandler', value: `{{components.${NAME}.value}}` }));

      const combobox = await screen.findByRole('combobox', { name: 'Letter' });
      await widget.session.user.click(combobox);
      await widget.session.user.keyboard('{Enter}');
      expect(widget.session.store.read((state) => state.getVariable('seenByHandler', MODULE_ID))).toBe('a');

      // The second selection is where a one-interaction lag shows up: a stale
      // read hands the handler 'a' again instead of 'b'.
      await widget.session.user.click(combobox);
      await widget.session.user.keyboard('{ArrowDown}{Enter}');
      expect(widget.session.store.read((state) => state.getVariable('seenByHandler', MODULE_ID))).toBe('b');
    });

    test('[DropdownV2-EVT-002] the handler sees a newly selected `false` value, not the placeholder state', async () => {
      const { container } = widget.render({
        properties: { options: { value: [option('One', 1), option('Off', false)] } },
      });
      widget.setEvents(setVariableOn(ID, 'onSelect', { key: 'seenByHandler', value: `{{components.${NAME}.value}}` }));

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Off'));

      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe(false);
    });

    test('[DropdownV2-EVT-003] the handler can read the whole selectedOption, not just the value', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });
      widget.setEvents(
        setVariableOn(ID, 'onSelect', { key: 'seenByHandler', value: `{{components.${NAME}.selectedOption.label}}` })
      );

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Beta'));

      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('Beta');
    });

    test('[DropdownV2-EVT-004] the selectOption action fires onSelect too, so both paths notify the app', async () => {
      widget.render({ properties: { options: OPTIONS } });
      widget.setEvents(setVariableOn(ID, 'onSelect', { key: 'seenByHandler', value: `{{components.${NAME}.value}}` }));

      await widget.act('selectOption', 'b');

      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('b');
    });

    test.each([
      ['an unknown value', 'not-an-option'],
      ['a disabled option value', 'blocked'],
      ['the wrong value type', 1],
    ])(
      '[DropdownV2-ACT-001] selectOption preserves the current selection and fires nothing for %s',
      async (_case, requestedValue) => {
        const { container } = widget.render({
          properties: {
            options: {
              value: [option('Alpha', 'a'), option('One', '1'), option('Blocked', 'blocked', { disable: true })],
            },
          },
        });

        await openMenu(container);
        await widget.session.user.click(await screen.findByText('Alpha'));
        expect(widget.exposed().value).toBe('a');

        // Attach after the valid selection so any captured value can only come
        // from an incorrect onSelect fired by the unmatched action below.
        widget.setEvents(
          setVariableOn(ID, 'onSelect', { key: 'seenByHandler', value: `{{components.${NAME}.value}}` })
        );

        await widget.act('selectOption', requestedValue);

        expect(displayedText(container)).toContain('Alpha');
        expect(widget.exposed().value).toBe('a');
        expect(widget.exposed().selectedOption).toEqual({ label: 'Alpha', value: 'a', caption: null });
        expect(store().getVariable('seenByHandler', MODULE_ID)).toBeUndefined();
      }
    );
  });

  describe('search', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b'), option('Gamma', 'c')] };

    test('[DropdownV2-SRCH-001] the search box filters the option list as the user types', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, showSearchInput: binding('{{true}}') } });

      await openMenu(container);
      const search = await screen.findByPlaceholderText('Search');
      await widget.session.user.type(search, 'et');

      await waitFor(() => expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual(['Beta']));
    });

    test('[DropdownV2-SRCH-002] typing in the search box exposes searchText', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, showSearchInput: binding('{{true}}') } });

      await openMenu(container);
      await widget.session.user.type(await screen.findByPlaceholderText('Search'), 'ga');

      await waitFor(() => expect(widget.exposed().searchText).toBe('ga'));
    });

    test('[DropdownV2-SRCH-003] server-side search keeps every option on screen, leaving filtering to the query', async () => {
      const { container } = widget.render({
        properties: { options: OPTIONS, showSearchInput: binding('{{true}}'), serverSideSearch: binding('{{true}}') },
      });

      await openMenu(container);
      await widget.session.user.type(await screen.findByPlaceholderText('Search'), 'zzz');

      // Client-side filtering would leave zero options; in server mode the
      // backend owns the result set, so the list must stay intact.
      await waitFor(() => expect(widget.exposed().searchText).toBe('zzz'));
      expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    test('[DropdownV2-SRCH-004] no search box is rendered when showSearchInput is off', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, showSearchInput: binding('{{false}}') } });

      await openMenu(container);
      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));

      expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    });
  });

  describe('disabled, loading and visibility', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b')] };

    test('[DropdownV2-STATE-001] a disabled dropdown does not open its menu when clicked', async () => {
      widget.render({ properties: { options: OPTIONS, disabledState: binding('{{true}}') } });

      const combobox = await screen.findByRole('combobox');
      expect(combobox).toBeDisabled();
      fireEvent.click(combobox.closest('.dropdownV2-widget'));

      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(widget.exposed().isDisabled).toBe(true);
    });

    test('[DropdownV2-STATE-002] a loading dropdown shows the spinner instead of the caret, and does not open', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, loadingState: binding('{{true}}') } });

      await waitFor(() => expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument());

      const combobox = await screen.findByRole('combobox');
      fireEvent.click(combobox.closest('.dropdownV2-widget'));
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(widget.exposed().isLoading).toBe(true);
    });

    test('[DropdownV2-STATE-003] a hidden dropdown is rendered invisible rather than removed', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, visibility: binding('{{false}}') } });

      await waitFor(() => expect(container.querySelector('.dropdown-widget')).toBeInTheDocument());
      expect(container.querySelector('.dropdown-widget')).toHaveClass('invisible');
      expect(widget.exposed().isVisible).toBe(false);
    });

    test('[DropdownV2-STATE-004] the setDisable action disables an enabled dropdown', async () => {
      widget.render({ properties: { options: OPTIONS } });

      await widget.act('setDisable', true);

      const combobox = await screen.findByRole('combobox');
      expect(combobox).toBeDisabled();
      fireEvent.click(combobox.closest('.dropdownV2-widget'));
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(widget.exposed().isDisabled).toBe(true);
    });

    test('[DropdownV2-STATE-004] the setVisibility action hides a visible dropdown', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await widget.act('setVisibility', false);

      expect(container.querySelector('.dropdown-widget')).toHaveClass('invisible');
      expect(widget.exposed().isVisible).toBe(false);
    });

    test('[DropdownV2-STATE-004] the setLoading action puts an idle dropdown into its loading state', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await widget.act('setLoading', true);

      expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();
      expect(widget.exposed().isLoading).toBe(true);
    });

    test('[DropdownV2-ACT-005] the clear action empties the selection and reports invalid for a mandatory field', async () => {
      const { container } = widget.render({
        properties: { options: OPTIONS },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Alpha'));
      expect(widget.exposed().value).toBe('a');
      await waitFor(() => expect(widget.exposed().isValid).toBe(true));

      await widget.act('clear');

      expect(widget.exposed().value).toBeNull();
      expect(displayedText(container)).not.toContain('Alpha');
      // `clear()` (DropdownV2.jsx:301-303) only writes the value — it does not
      // go through the Select's onChange, so this is checking that validity
      // recomputes off the value alone, not off the interaction flag below.
      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
    });
  });

  describe('label and validation message', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b')] };

    test('[DropdownV2-EXP-001] the widget publishes its documented variables and actions', async () => {
      // Break this catches: dropping a documented variable or action from the
      // mount-time surface, which silently breaks every app binding to it.
      widget.render({ properties: { options: OPTIONS, label: binding('Pick a letter') } });

      expect(await screen.findByText('Pick a letter')).toBeInTheDocument();
      await waitFor(() => expect(widget.exposed().selectOption).toBeInstanceOf(Function));
      await waitFor(() => expect(widget.exposed()).toHaveProperty('selectedOption'));
      const exposed = widget.exposed();

      expect(exposed.label).toBe('Pick a letter');
      expect(exposed.value).toBeUndefined();
      expect(exposed.selectedOption).toBeNull();
      expect(exposed.options).toEqual([
        { label: 'Alpha', value: 'a', caption: null },
        { label: 'Beta', value: 'b', caption: null },
      ]);
      expect(exposed.searchText).toBe('');
      expect(exposed.isValid).toBe(true);
      expect(exposed.isMandatory).toBe(false);
      expect(exposed.isVisible).toBe(true);
      expect(exposed.isLoading).toBe(false);
      expect(exposed.isDisabled).toBe(false);

      for (const action of ['selectOption', 'clear', 'setVisibility', 'setLoading', 'setDisable']) {
        expect(exposed[action]).toBeInstanceOf(Function);
      }
    });

    // needs to be looked at again
    test.skip('[DropdownV2-VAL-002] leaving a mandatory dropdown empty reveals its validation error', async () => {
      // Validation lives under `validation`, not `properties`, so it has to be
      // set between seeding and mount rather than via `properties`.
      const { container } = widget.render({
        properties: { label: binding('Pick a letter'), options: OPTIONS },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      const combobox = await screen.findByRole('combobox', { name: /Pick a letter/ });
      await waitFor(() => expect(widget.exposed().isMandatory).toBe(true));
      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(combobox).toHaveAttribute('aria-invalid', 'false');
      expect(within(container).queryByText('Field cannot be empty')).not.toBeInTheDocument();

      await widget.session.user.click(combobox);
      await widget.session.user.tab();

      const error = await within(container).findByText('Field cannot be empty');
      expect(combobox).toHaveAttribute('aria-invalid', 'true');
      expect(combobox).toHaveAttribute('aria-errormessage', error.id);
    });

    test('[DropdownV2-VAL-003] a failing custom rule surfaces its message after the user selects, and a passing rule clears it', async () => {
      // Break this catches: rendering the custom-rule message only from store
      // validity, never from the widget, so a failing rule leaves the canvas
      // silent while `isValid` is already false.
      widget.render({
        properties: { label: binding('Pick a letter'), options: OPTIONS },
        afterSeed: () =>
          widget.setComponentProperty(ID, 'customRule', "{{'Beta is banned'}}", 'validation', 'value', false),
      });

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(screen.queryByText('Beta is banned')).not.toBeInTheDocument();

      await openMenu();
      await widget.session.user.click(await screen.findByText('Alpha'));

      expect(await screen.findByText('Beta is banned')).toBeInTheDocument();
      expect(widget.exposed().isValid).toBe(false);

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'customRule', '{{false}}', 'validation', 'value', false);
      });

      await waitFor(() => expect(widget.exposed().isValid).toBe(true));
      expect(screen.queryByText('Beta is banned')).not.toBeInTheDocument();
    });
  });

  describe('icon and options loading', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b')] };

    test('[DropdownV2-ICON-001] a configured icon renders when visible and is absent when iconVisibility is off', async () => {
      // Break this catches: ignoring `iconVisibility` (always showing or never
      // showing the leading icon) or dropping the `icon` style from the value container.
      const leadingIcon = (container) => container.querySelector('.dropdownV2-widget .d-inline-flex svg');

      const visible = widget.render({
        properties: { options: OPTIONS },
        styles: { icon: { value: 'IconHome2' }, iconVisibility: binding('{{true}}') },
      });
      await waitFor(() => expect(leadingIcon(visible.container)).toBeInTheDocument());

      const hidden = widget.render({
        properties: { options: OPTIONS },
        styles: { icon: { value: 'IconHome2' }, iconVisibility: binding('{{false}}') },
      });
      expect(leadingIcon(hidden.container)).not.toBeInTheDocument();
    });

    test('[DropdownV2-LOAD-002] optionsLoadingState shows a menu spinner with no options and does not mark the control busy', async () => {
      // Break this catches: folding `optionsLoadingState` into `aria-busy` /
      // `loadingState`, or showing the options behind the spinner.
      widget.render({
        properties: {
          label: binding('Pick a letter'),
          advanced: binding('{{true}}'),
          optionsLoadingState: binding('{{true}}'),
          schema: binding(
            '{{ [{ label: "Alpha", value: "a", visible: true }, { label: "Beta", value: "b", visible: true }] }}'
          ),
        },
      });

      const combobox = await openMenu();
      await waitFor(() => expect(document.querySelector('.tj-widget-loader')).toBeInTheDocument());
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(combobox).not.toHaveAttribute('aria-busy', 'true');
      expect(widget.exposed().isLoading).toBe(false);

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'optionsLoadingState', '{{false}}', 'properties');
      });

      await waitFor(() => expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual(['Alpha', 'Beta']));
      expect(
        document.querySelector('.dropdown-multiselect-widget-custom-menu-list .tj-widget-loader')
      ).not.toBeInTheDocument();
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('search and focus events', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b'), option('Gamma', 'c')] };

    test('[DropdownV2-EVT-005] typing in the search box fires onSearchTextChanged and does not client-filter when serverSideSearch is on', async () => {
      // Break this catches: dropping `fireEvent('onSearchTextChanged')` or
      // applying the client filter while `serverSideSearch` is true.
      widget.render({
        properties: {
          label: binding('Pick a letter'),
          options: OPTIONS,
          showSearchInput: binding('{{true}}'),
          serverSideSearch: binding('{{true}}'),
        },
      });
      widget.setEvents(
        setVariableOn(ID, 'onSearchTextChanged', { key: 'seenSearch', value: `{{components.${NAME}.searchText}}` })
      );

      await openMenu();
      expect(store().getVariable('seenSearch', MODULE_ID)).toBeUndefined();

      await widget.session.user.type(await screen.findByPlaceholderText('Search'), 'zzz');

      await waitFor(() => expect(widget.exposed().searchText).toBe('zzz'));
      expect(store().getVariable('seenSearch', MODULE_ID)).toBe('zzz');
      expect(screen.getAllByRole('option')).toHaveLength(3);
    });

    test('[DropdownV2-EVT-006] opening the menu fires onFocus once', async () => {
      // Break this catches: opening the menu without `fireEvent('onFocus')`.
      widget.render({ properties: { label: binding('Pick a letter'), options: OPTIONS } });
      widget.setEvents(setVariableOn(ID, 'onFocus', { key: 'focusSeen', value: 'FOCUS' }));

      expect(store().getVariable('focusSeen', MODULE_ID)).toBeUndefined();
      await openMenu();
      await waitFor(() => expect(store().getVariable('focusSeen', MODULE_ID)).toBe('FOCUS'));
    });

    test.each([
      [
        'toggle click',
        async () => {
          fireEvent.click(screen.getByRole('combobox').closest('.dropdownV2-widget'));
        },
      ],
      [
        'click outside',
        async () => {
          const outside = document.createElement('button');
          outside.textContent = 'outside';
          document.body.appendChild(outside);
          try {
            await widget.session.user.click(outside);
          } finally {
            outside.remove();
          }
        },
      ],
      [
        'Escape',
        async () => {
          await widget.session.user.keyboard('{Escape}');
        },
      ],
    ])('[DropdownV2-EVT-006] closing via %s fires onBlur once', async (_path, close) => {
      // Break this catches: a close path that never calls `fireEvent('onBlur')`.
      widget.render({ properties: { label: binding('Pick a letter'), options: OPTIONS } });
      widget.setEvents([
        ...setVariableOn(ID, 'onFocus', { key: 'focusSeen', value: 'FOCUS' }),
        ...setVariableOn(ID, 'onBlur', { key: 'blurSeen', value: 'BLUR' }),
      ]);

      await openMenu();
      await waitFor(() => expect(store().getVariable('focusSeen', MODULE_ID)).toBe('FOCUS'));
      expect(store().getVariable('blurSeen', MODULE_ID)).toBeUndefined();

      await close();

      await waitFor(() => expect(store().getVariable('blurSeen', MODULE_ID)).toBe('BLUR'));
      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });

    // needs to be looked at again
    test.skip('[DropdownV2-EVT-006] tabbing away from an open menu fires onBlur', async () => {
      // Break this catches: the react-select onBlur handler closing the menu
      // without `fireEvent('onBlur')`, so Tab-away is silent while the other
      // three close paths still notify the app.
      widget.render({ properties: { label: binding('Pick a letter'), options: OPTIONS } });
      widget.setEvents(setVariableOn(ID, 'onBlur', { key: 'blurSeen', value: 'BLUR' }));

      await openMenu();
      expect(store().getVariable('blurSeen', MODULE_ID)).toBeUndefined();

      await widget.session.user.tab();

      await waitFor(() => expect(store().getVariable('blurSeen', MODULE_ID)).toBe('BLUR'));
      expect(screen.queryAllByRole('option')).toHaveLength(0);
    });
  });

  describe('state precedence', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b')] };
    const STATE_PAIRS = [
      {
        action: 'setDisable',
        arg: true,
        property: 'disabledState',
        currentValue: '{{false}}',
        assertHeld: async () => {
          expect(await screen.findByRole('combobox')).toBeDisabled();
          expect(widget.exposed().isDisabled).toBe(true);
        },
      },
      {
        action: 'setVisibility',
        arg: false,
        property: 'visibility',
        currentValue: '{{true}}',
        assertHeld: async () => {
          expect(document.querySelector('.dropdown-widget')).toHaveClass('invisible');
          expect(widget.exposed().isVisible).toBe(false);
        },
      },
      {
        action: 'setLoading',
        arg: true,
        property: 'loadingState',
        currentValue: '{{false}}',
        assertHeld: async () => {
          expect(document.querySelector('.tj-widget-loader')).toBeInTheDocument();
          expect(widget.exposed().isLoading).toBe(true);
        },
      },
    ];

    test.each(STATE_PAIRS)(
      '[DropdownV2-STATE-006] $action survives an unrelated property change',
      async ({ action, arg, assertHeld }) => {
        // Break this catches: the property-to-state sync effect running
        // unguarded (or on every render), which would revert the action the
        // moment any other property re-resolves.
        widget.render({ properties: { label: binding('Pick a letter'), options: OPTIONS } });
        await widget.act(action, arg);
        await assertHeld();

        await widget.session.store.act(() => {
          widget.setComponentProperty(ID, 'label', 'Changed by a query', 'properties');
        });

        await waitFor(() => expect(widget.exposed().label).toBe('Changed by a query'));
        await assertHeld();
      }
    );

    test.each(STATE_PAIRS)(
      '[DropdownV2-STATE-007] $action survives a no-op rewrite of $property',
      async ({ action, arg, property, currentValue, assertHeld }) => {
        // Break this catches: a no-op rewrite of the paired property undoing
        // the CSA. If the widget resets, this is a finding — do not lock it in.
        widget.render({ properties: { label: binding('Pick a letter'), options: OPTIONS } });
        await widget.act(action, arg);
        await assertHeld();

        await widget.session.store.act(() => {
          widget.setComponentProperty(ID, property, currentValue, 'properties');
        });

        await assertHeld();
      }
    );
  });

  describe('Form lifecycle', () => {
    const FORM = 'form1';
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })] };

    test('[DropdownV2-FRM-001] submitting a Form reveals mandatory DropdownV2 validation', async () => {
      // Break this catches: ignoring `useShowValidationOnFormSubmit`, so an
      // invalid Form submit leaves the dropdown looking untouched.
      widget.renderInsideForm({
        properties: {
          label: binding('Required choice'),
          options: { value: [option('Alpha', 'a'), option('Beta', 'b')] },
        },
        validation: { mandatory: binding('{{true}}') },
      });

      const combobox = await screen.findByRole('combobox', { name: /Required choice/ });
      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();

      await waitFor(() => expect(widget.exposed(FORM).submitForm).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed(FORM).submitForm();
      });

      expect(await screen.findByText('Field cannot be empty')).toBeInTheDocument();
      expect(combobox).toHaveAttribute('aria-invalid', 'true');
    }, 30000);

    test('[DropdownV2-FRM-002] Form clear empties the selection and restores untouched validation presentation', async () => {
      // Break this catches: Form clear resetting to the schema default, or
      // leaving a previously revealed error on screen after the Form is cleared.
      widget.renderInsideForm({
        properties: { label: binding('Required choice'), options: OPTIONS },
        validation: { mandatory: binding('{{true}}') },
      });

      await waitFor(() => expect(widget.exposed().value).toBe('b'));
      await waitFor(() => expect(widget.exposed().isValid).toBe(true));

      await waitFor(() => expect(widget.exposed(FORM).submitForm).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed(FORM).submitForm();
      });

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().value).toBeNull());
      expect(widget.exposed().isValid).toBe(false);
      expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
    }, 30000);
  });
});
