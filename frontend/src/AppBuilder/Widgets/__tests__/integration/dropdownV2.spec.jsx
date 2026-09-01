/**
 * DropdownV2 — rendering and interaction, against the REAL store. Shared
 * setup lives in ./widgetHarness.js.
 *
 * Scope, stated up front: `validateWidget` for DropdownV2 (including the
 * mandatory-with-`false` cases) is already pinned at STORE level in
 * `_stores/slices/__tests__/integration/validateWidget.spec.js`. This file does
 * not repeat any of it. What it covers is the widget's own behaviour: what it
 * puts in the DOM for a given schema, what a click does to the exposed values,
 * and what an `onSelect` handler sees at the moment it runs.
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
import { screen, waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding, store, MODULE_ID } from './widgetHarness';

const ID = 'dd1';
const NAME = 'dropdown1';

const widget = createWidgetHarness({
  componentType: 'DropdownV2',
  handle: NAME,
  id: ID,
  // Passed explicitly on purpose: DropdownV2 renders itself with the
  // `invisible` class when `properties.visibility` is falsy, which silently
  // breaks every DOM assertion.
  defaultProperties: { visibility: binding('{{true}}') },
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
});

/** An option in the shape the inspector actually persists — see the header. */
function option(label, value, { visible = true, disable = false, isDefault = false, caption = null } = {}) {
  return {
    label,
    value,
    caption,
    visible: { value: `{{${visible}}}` },
    disable: { value: `{{${disable}}}` },
    default: { value: `{{${isDefault}}}` },
  };
}

/** The clickable trigger; DropdownV2 opens its menu from this div, not the input. */
const trigger = (container) => container.querySelector(`[data-cy="${NAME}-actionable-section"]`);

async function openMenu(container) {
  await waitFor(() => expect(trigger(container)).toBeInTheDocument());
  await widget.session.user.click(trigger(container));
}

/** The single-value / placeholder area, i.e. what the closed dropdown displays. */
const displayedText = (container) => container.querySelector('.dropdownV2-widget .css-1do0iaa')?.textContent ?? '';

/**
 * Registers a real `set-custom-variable` action on onSelect whose value is a
 * binding into this component's own exposed `value`. The variable it writes is
 * the probe: a stale read leaves the PREVIOUS selection there.
 */
function attachOnSelectCapture(valueExpression = `{{components.${NAME}.value}}`) {
  widget.setEvents([
    {
      id: 'evt-on-select',
      name: 'onSelect',
      index: 0,
      sourceId: ID,
      target: 'component',
      event: { eventId: 'onSelect', actionId: 'set-custom-variable', key: 'seenByHandler', value: valueExpression },
    },
  ]);
}

describe('DropdownV2', () => {
  let restoreOffsetHeight;

  beforeEach(() => {
    // See the header: without a measurable scroll container the virtualizer
    // renders zero options and the option assertions below become vacuous.
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 300 });
    restoreOffsetHeight = () => Object.defineProperty(HTMLElement.prototype, 'offsetHeight', descriptor);
    widget.setup();
  });

  afterEach(() => {
    restoreOffsetHeight();
    widget.teardown();
  });

  describe('options', () => {
    test('renders one entry per visible option, hiding the ones flagged not visible', async () => {
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

    test('an options list bound to a `{{ }}` expression is resolved before it reaches the menu', async () => {
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

    test('dynamic options read the `schema` property instead of `options` when advanced is on', async () => {
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

    test('sort `desc` reverses the option order the user sees', async () => {
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

    test('an option flagged default is selected on mount, without any interaction', async () => {
      const { container } = widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })] } },
      });

      await waitFor(() => expect(displayedText(container)).toContain('Beta'));
      expect(widget.exposed().value).toBe('b');
    });

    test("an option's caption is rendered under its label", async () => {
      const { container } = widget.render({
        properties: { options: { value: [option('Alpha', 'a', { caption: 'first letter' })] } },
      });

      await openMenu(container);

      await waitFor(() => expect(screen.getByText('first letter')).toBeInTheDocument());
      expect(screen.getByRole('option')).toHaveTextContent('first letter');
    });

    test('an option flagged disable is rendered but not selectable', async () => {
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

    test('picking an option exposes its value and the whole selected option', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await openMenu(container);
      await waitFor(() => expect(screen.getByText('Beta')).toBeInTheDocument());
      await widget.session.user.click(screen.getByText('Beta'));

      expect(widget.exposed().value).toBe('b');
      expect(widget.exposed().selectedOption).toEqual({ label: 'Beta', value: 'b', caption: null });
      expect(displayedText(container)).toContain('Beta');
    });

    test('picking an option closes the menu', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await openMenu(container);
      await waitFor(() => expect(screen.getByText('Beta')).toBeInTheDocument());
      await widget.session.user.click(screen.getByText('Beta'));

      await waitFor(() => expect(screen.queryAllByRole('option')).toHaveLength(0));
    });

    test('picking the already-selected option again clears the selection', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Beta'));
      expect(widget.exposed().value).toBe('b');

      await widget.session.user.click(trigger(container));
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

    test('picking the already-selected option again keeps it selected when allowDeselection is off', async () => {
      const { container } = widget.render({
        properties: { options: OPTIONS, allowDeselection: binding('{{false}}') },
      });

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Beta'));
      expect(widget.exposed().value).toBe('b');

      await widget.session.user.click(trigger(container));
      const options = await screen.findAllByRole('option');
      await widget.session.user.click(options.find((el) => el.textContent === 'Beta'));

      expect(widget.exposed().value).toBe('b');
      expect(widget.exposed().selectedOption).toEqual({ label: 'Beta', value: 'b', caption: null });
    });

    test('the placeholder is what shows while nothing is selected', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, placeholder: binding('Pick a letter') } });

      await waitFor(() => expect(displayedText(container)).toContain('Pick a letter'));

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Alpha'));

      expect(displayedText(container)).not.toContain('Pick a letter');
    });

    test('the clear button empties the selection', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, showClearBtn: binding('{{true}}') } });

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Alpha'));
      expect(widget.exposed().value).toBe('a');

      const clear = container.querySelector('.clear-indicator');
      expect(clear).toBeInTheDocument();
      await widget.session.user.click(clear);

      expect(widget.exposed().value).toBeNull();
    });

    test('no clear button is rendered when showClearBtn is off', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, showClearBtn: binding('{{false}}') } });

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Alpha'));

      expect(container.querySelector('.clear-indicator')).not.toBeInTheDocument();
    });
  });

  describe('falsy option values', () => {
    // This widget has a documented history of `||` swallowing legitimately
    // falsy option values (three separate fixes: f39ae77294, 7c31f7a2f2,
    // 61a697cd3a). `false`, `0` and `''` are real, selectable values.
    const FALSY_OPTIONS = {
      value: [option('Off', false), option('Zero', 0), option('Blank', ''), option('One', 1)],
    };

    test.each([
      ['false', 'Off', false],
      ['0', 'Zero', 0],
      ["''", 'Blank', ''],
    ])('an option whose value is %s is selectable and exposed as itself', async (_label, optionLabel, value) => {
      const { container } = widget.render({ properties: { options: FALSY_OPTIONS } });

      await openMenu(container);
      await widget.session.user.click(await screen.findByText(optionLabel));

      expect(widget.exposed().value).toBe(value);
      // The `selectedOption` lookup is the second place a falsy value can be
      // lost: a truthiness test there returns null for a perfectly good option.
      expect(widget.exposed().selectedOption).toEqual({ label: optionLabel, value, caption: null });
      expect(displayedText(container)).toContain(optionLabel);
    });

    test('a default option whose value is `false` is pre-selected on mount', async () => {
      const { container } = widget.render({
        properties: { options: { value: [option('Off', false, { isDefault: true }), option('One', 1)] } },
      });

      await waitFor(() => expect(displayedText(container)).toContain('Off'));
      expect(widget.exposed().value).toBe(false);
    });

    test('the selectOption action accepts `0` and does not read it as "no argument"', async () => {
      widget.render({ properties: { options: FALSY_OPTIONS } });

      await waitFor(() => expect(widget.exposed().selectOption).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed().selectOption(0);
      });

      expect(widget.exposed().value).toBe(0);
      expect(widget.exposed().selectedOption).toEqual({ label: 'Zero', value: 0, caption: null });
    });
  });

  describe('onSelect', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b')] };

    test('the handler sees the option that was JUST picked, not the previous one', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });
      attachOnSelectCapture();

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Alpha'));
      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('a');

      // The second selection is where a one-interaction lag shows up: a stale
      // read hands the handler 'a' again instead of 'b'.
      await widget.session.user.click(trigger(container));
      await widget.session.user.click(await screen.findByText('Beta'));
      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('b');
    });

    test('the handler sees a newly selected `false` value, not the placeholder state', async () => {
      const { container } = widget.render({
        properties: { options: { value: [option('One', 1), option('Off', false)] } },
      });
      attachOnSelectCapture();

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Off'));

      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe(false);
    });

    test('the handler can read the whole selectedOption, not just the value', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });
      attachOnSelectCapture(`{{components.${NAME}.selectedOption.label}}`);

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Beta'));

      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('Beta');
    });

    test('the selectOption action fires onSelect too, so both paths notify the app', async () => {
      widget.render({ properties: { options: OPTIONS } });
      attachOnSelectCapture();

      await waitFor(() => expect(widget.exposed().selectOption).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed().selectOption('b');
      });

      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('b');
    });

    test('selectOption with an unknown value selects nothing and fires nothing', async () => {
      widget.render({ properties: { options: OPTIONS } });
      attachOnSelectCapture();

      await waitFor(() => expect(widget.exposed().selectOption).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed().selectOption('not-an-option');
      });

      expect(widget.exposed().value).toBeUndefined();
      expect(store().getVariable('seenByHandler', MODULE_ID)).toBeUndefined();
    });
  });

  describe('search', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b'), option('Gamma', 'c')] };

    test('the search box filters the option list as the user types', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, showSearchInput: binding('{{true}}') } });

      await openMenu(container);
      const search = await screen.findByPlaceholderText('Search');
      await widget.session.user.type(search, 'et');

      await waitFor(() => expect(screen.getAllByRole('option').map((el) => el.textContent)).toEqual(['Beta']));
    });

    test('typing in the search box exposes searchText', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, showSearchInput: binding('{{true}}') } });

      await openMenu(container);
      await widget.session.user.type(await screen.findByPlaceholderText('Search'), 'ga');

      await waitFor(() => expect(widget.exposed().searchText).toBe('ga'));
    });

    test('server-side search keeps every option on screen, leaving filtering to the query', async () => {
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

    test('no search box is rendered when showSearchInput is off', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, showSearchInput: binding('{{false}}') } });

      await openMenu(container);
      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));

      expect(screen.queryByPlaceholderText('Search')).not.toBeInTheDocument();
    });
  });

  describe('disabled, loading and visibility', () => {
    const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b')] };

    test('a disabled dropdown does not open its menu when clicked', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, disabledState: binding('{{true}}') } });

      await openMenu(container);

      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(widget.exposed().isDisabled).toBe(true);
    });

    test('a loading dropdown shows the spinner instead of the caret, and does not open', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, loadingState: binding('{{true}}') } });

      await waitFor(() => expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument());

      await widget.session.user.click(trigger(container));
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(widget.exposed().isLoading).toBe(true);
    });

    test('a hidden dropdown is rendered invisible rather than removed', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS, visibility: binding('{{false}}') } });

      await waitFor(() => expect(container.querySelector('.dropdown-widget')).toBeInTheDocument());
      expect(container.querySelector('.dropdown-widget')).toHaveClass('invisible');
      expect(widget.exposed().isVisible).toBe(false);
    });

    test('the setDisable action disables an enabled dropdown', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await waitFor(() => expect(widget.exposed().setDisable).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed().setDisable(true);
      });

      await widget.session.user.click(trigger(container));
      expect(screen.queryAllByRole('option')).toHaveLength(0);
      expect(widget.exposed().isDisabled).toBe(true);
    });

    test('the setVisibility action hides a visible dropdown', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await waitFor(() => expect(widget.exposed().setVisibility).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed().setVisibility(false);
      });

      expect(container.querySelector('.dropdown-widget')).toHaveClass('invisible');
      expect(widget.exposed().isVisible).toBe(false);
    });

    test('the setLoading action puts an idle dropdown into its loading state', async () => {
      const { container } = widget.render({ properties: { options: OPTIONS } });

      await waitFor(() => expect(widget.exposed().setLoading).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed().setLoading(true);
      });

      expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();
      expect(widget.exposed().isLoading).toBe(true);
    });

    test('the clear action empties the selection and reports invalid for a mandatory field', async () => {
      const { container } = widget.render({
        properties: { options: OPTIONS },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      await openMenu(container);
      await widget.session.user.click(await screen.findByText('Alpha'));
      expect(widget.exposed().value).toBe('a');
      await waitFor(() => expect(widget.exposed().isValid).toBe(true));

      await widget.session.store.act(async () => {
        await widget.exposed().clear();
      });

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

    test('the label is rendered and exposed', async () => {
      widget.render({ properties: { options: OPTIONS, label: binding('Pick a letter') } });

      expect(await screen.findByText('Pick a letter')).toBeInTheDocument();
      await waitFor(() => expect(widget.exposed().label).toBe('Pick a letter'));
    });

    test('a mandatory field shows no error until the user has interacted with it', async () => {
      // Validation lives under `validation`, not `properties`, so it has to be
      // set between seeding and mount rather than via `properties`.
      const { container } = widget.render({
        properties: { options: OPTIONS },
        afterSeed: () => widget.setComponentProperty(ID, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      await waitFor(() => expect(trigger(container)).toBeInTheDocument());
      await waitFor(() => expect(widget.exposed().isMandatory).toBe(true));
      // DropdownV2.jsx:634 gates the message on `userInteracted`, which only
      // flips true from a selection/clear through the Select's onChange
      // (:558-570) — never from mounting empty, however invalid that is.
      expect(within(container).queryByText('Field cannot be empty')).not.toBeInTheDocument();
    });
  });
});
