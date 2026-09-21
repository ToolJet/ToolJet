/**
 * DropdownV2 — the Engineering half of the approved contract at
 * ee/test/app-builder/widgets/DropdownV2/TESTING.md, run against the REAL
 * composed App Builder store. Shared setup lives in
 * ../../../__tests__/integration/widgetHarness.js.
 *
 * Scope, stated up front: generic `validateWidget` truthiness rules are pinned
 * at STORE level in `_stores/slices/__tests__/integration/validateWidget.spec.js`
 * (DropdownV2-VAL-001). This file owns what the composed widget renders,
 * exposes, and publishes to event actions. Everything geometric — menu width,
 * virtualization, mobile touch, generated React Select CSS — is Browser/QA
 * (DropdownV2-BRW-001..008) and deliberately absent here.
 *
 * Two DropdownV2-specific jsdom problems, and why the fixes are legitimate:
 *
 *   1. CustomMenuList virtualizes the option list (CustomMenuList.jsx:30-35)
 *      and @tanstack/virtual-core measures its scroll container with
 *      `offsetHeight`, which jsdom hard-codes to 0 — with the ResizeObserver
 *      stub emitting no entries, nothing ever corrects it. Zero measured
 *      height means ZERO options in the DOM, so a spec that only asserts "the
 *      menu opened" proves nothing. `offsetHeight` is stubbed by the harness.
 *      Geometry is one of the controls the harness explicitly permits
 *      (src/test/app-builder/README.md); nothing about the widget is mocked.
 *
 *   2. The menu renders into `menuPortalTarget={document.body}`, so option
 *      queries go through `screen`, never the render container.
 *
 * Recorded gaps — approved guarantees production does not meet yet.
 *
 * No production file is changed by this work, so four approved guarantees have
 * no passing implementation. Each is written as a `test.failing` next to its
 * siblings rather than left out: the test documents the guarantee, passes while
 * the defect stands, and starts failing the moment someone fixes it — at which
 * point the `.failing` marker is what must be removed.
 *
 *   [DropdownV2-EVT-002]  Tab-away neither closes the menu nor fires `onBlur`;
 *                         the widget wires no focus-exit handler at all.
 *   [DropdownV2-VAL-002]  Blur is an approved touch path (D-08) but only
 *                         `onChange` and the Form-submit signal mark the field
 *                         touched, so tabbing past a mandatory Dropdown leaves
 *                         it silently invalid.
 *   [DropdownV2-VAL-002]  `aria-required` is passed to `Select` and dropped:
 *                         react-select builds it from its own `required` prop.
 *   [DropdownV2-STATE-002] `aria-hidden` is passed to `Select` and dropped the
 *                         same way, so a hidden Dropdown stays reachable by
 *                         assistive tech.
 *
 * `aria-disabled` and `aria-busy` are dropped by react-select for the same
 * reason. No approved scenario asserts them, so they are reported rather than
 * pinned here. A fifth gap, `sortArray` sorting its caller's array in place,
 * is recorded in ../utils.spec.js.
 *
 * Option shape matters and is easy to get wrong. The inspector stores an option
 * as `{ label, value, visible: { value: '{{true}}' }, disable: { value: '{{false}}' } }`
 * (RightSideBar/Inspector/Components/Select.jsx:117-139), and the resolver
 * FLATTENS those wrappers to plain booleans before the widget sees them. The
 * harness `option()` builds that real pre-resolution shape, so these tests
 * would catch a regression in the flattening too. Tests that need an option
 * with a key genuinely ABSENT (D-18's omitted `visible`) build the literal by
 * hand instead.
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
    label: binding('Letter'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
    optionsLoadingState: binding('{{false}}'),
    advanced: binding('{{false}}'),
    showClearBtn: binding('{{true}}'),
    showSearchInput: binding('{{true}}'),
    serverSideSearch: binding('{{false}}'),
    sort: binding('none'),
  },
  // Schema defaults for the label-sizing styles. `_ui/Label.jsx:31` renders
  // nothing unless `label && (width > 0 || auto)`, and DropdownV2 wires that
  // `width` prop from the `labelWidth` style key — without these, a "label is
  // rendered" assertion fails not because the label is broken, but because it
  // never mounts at all.
  defaultStyles: {
    auto: binding('{{true}}'),
    labelWidth: binding('33'),
    widthType: binding('ofComponent'),
    alignment: binding('side'),
    direction: binding('left'),
    labelFontSize: binding('{{12}}'),
    errTextColor: binding('var(--cc-error-systemStatus)'),
    padding: binding('default'),
  },
  offsetHeight: 300,
});

const OPTIONS = { value: [option('Alpha', 'a'), option('Beta', 'b'), option('Gamma', 'c')] };

/** Opens the menu the way a user does: the handler is on `.dropdownV2-widget`, not the combobox. */
async function openMenu() {
  const combobox = await screen.findByRole('combobox');
  fireEvent.click(combobox.closest('.dropdownV2-widget'));
  return combobox;
}

/** What the closed control shows. Throws when the control is missing so `not.toContain` cannot pass on a failed render. */
function displayedText() {
  const root = document.querySelector('.dropdownV2-widget');
  if (!root) throw new Error('DropdownV2 control (.dropdownV2-widget) is not in the document');
  return root.textContent;
}

/** Option rows currently in the portalled menu, in presentation order. */
const optionLabels = () => screen.queryAllByRole('option').map((el) => el.textContent);

/**
 * Clicks an option by its exact text.
 *
 * Scoped to the option ROLE rather than a plain text query because once a
 * value is selected its label is ALSO the closed control's displayed text, and
 * matched by `textContent` rather than testing-library's accessible-name
 * matcher, which trips on the option's letter-by-letter highlight spans.
 */
async function pickOption(label) {
  const options = await screen.findAllByRole('option');
  // Matched on the label span's own `title` (CustomOption.jsx:30) rather than
  // the row's textContent, which also carries the caption on a captioned row.
  const target = options.find((el) => el.querySelector(`[title="${label}"]`) || el.textContent === label);
  if (!target) throw new Error(`No option labelled "${label}"; menu shows ${JSON.stringify(optionLabels())}`);
  await widget.session.user.click(target);
}

/**
 * An event row that COUNTS deliveries instead of recording a constant.
 *
 * A `set-custom-variable` holding a fixed string cannot tell one delivery from
 * five, which is exactly the regression the contract's "exactly once"
 * guarantees exist to catch (two overlapping close paths both firing onBlur,
 * say). Reading the variable back in its own expression makes the real events
 * pipeline do the counting.
 */
function countingEventOn(sourceId, eventId, key) {
  return [
    {
      id: `count-${eventId}-${key}`,
      index: 0,
      sourceId,
      name: `count-${eventId}-${key}`,
      target: 'component',
      event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
    },
  ];
}

/** Deliveries counted by `countingEventOn`; 0 when the event never fired. */
const countOf = (key) => store().getVariable(key, MODULE_ID) ?? 0;

describe('DropdownV2', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  describe('label and placeholder', () => {
    test('[DropdownV2-DATA-001] the label names the control once, is visible, and is exposed', async () => {
      // Break this catches: naming the combobox with BOTH aria-labelledby and
      // an aria-label, which screen readers announce twice; or dropping the
      // `label` exposed variable that apps bind to.
      widget.render({ properties: { label: binding('Pick a letter'), options: OPTIONS } });

      const combobox = await screen.findByRole('combobox', { name: 'Pick a letter' });
      expect(screen.getByText('Pick a letter')).toBeVisible();
      expect(combobox).toHaveAttribute('aria-labelledby', `${ID}-label`);
      expect(combobox).not.toHaveAttribute('aria-label');
      expect(widget.exposed().label).toBe('Pick a letter');
    });

    test('[DropdownV2-DATA-001] a re-resolved label binding updates both the visible label and the exposed one', async () => {
      // Break this catches: reading `label` once at mount, so a query-driven
      // label never changes after the first render.
      widget.render({ properties: { label: binding('Pick a letter'), options: OPTIONS } });
      await screen.findByText('Pick a letter');

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'label', 'Choose a letter', 'properties');
      });

      expect(await screen.findByText('Choose a letter')).toBeVisible();
      await waitFor(() => expect(widget.exposed().label).toBe('Choose a letter'));
      expect(screen.queryByText('Pick a letter')).not.toBeInTheDocument();
    });

    test('[DropdownV2-DATA-002] the placeholder stands in for an empty selection and yields to a real one', async () => {
      // Break this catches: rendering the placeholder as the control's
      // accessible name, or leaving it on screen next to a chosen value.
      widget.render({ properties: { options: OPTIONS, placeholder: binding('Select an option') } });

      await waitFor(() => expect(displayedText()).toContain('Select an option'));
      // The placeholder is presentation, not naming: the label still names it.
      expect(await screen.findByRole('combobox', { name: 'Letter' })).toBeInTheDocument();

      await openMenu();
      await pickOption('Alpha');

      expect(displayedText()).toContain('Alpha');
      expect(displayedText()).not.toContain('Select an option');
      expect(await screen.findByRole('combobox', { name: 'Letter' })).toBeInTheDocument();
    });
  });

  describe('options', () => {
    test('[DropdownV2-OPT-001] static options keep configured order, hide explicit visible:false, and show omitted visibility', async () => {
      // Break this catches: treating a missing `visible` key as hidden (D-18
      // keeps omitted visibility RENDERING, and only bars it from being a
      // default), or reordering options that asked for `sort: none`.
      widget.render({
        properties: {
          options: {
            value: [
              option('Gamma', 'c'),
              option('Alpha', 'a'),
              { label: 'Delta', value: 'd', caption: null }, // no `visible` key at all
              option('Hidden', 'h', { visible: false }),
            ],
          },
        },
      });

      await openMenu();

      await waitFor(() => expect(optionLabels()).toEqual(['Gamma', 'Alpha', 'Delta']));
      expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
    });

    test('[DropdownV2-OPT-002] advanced mode makes the resolved schema the only option source', async () => {
      // Break this catches: reading `options` while `advanced` is on, which
      // would show stale static rows next to (or instead of) the query's.
      widget.render({
        properties: {
          advanced: binding('{{true}}'),
          options: { value: [option('FromOptions', 'x')] },
          schema: binding(
            '{{ [{ label: "Ada", value: 1, visible: true }, { label: "Grace", value: 2, visible: true }] }}'
          ),
        },
      });

      await openMenu();

      await waitFor(() => expect(optionLabels()).toEqual(['Ada', 'Grace']));
      expect(screen.queryByText('FromOptions')).not.toBeInTheDocument();
      expect(widget.exposed().options).toEqual([
        { label: 'Ada', value: 1, caption: null },
        { label: 'Grace', value: 2, caption: null },
      ]);
    });

    test('[DropdownV2-OPT-002] with advanced off the static options stay authoritative even when a schema exists', async () => {
      // Break this catches: the reverse precedence bug — a leftover `schema`
      // binding silently winning over the list the builder is editing.
      widget.render({
        properties: {
          advanced: binding('{{false}}'),
          options: { value: [option('FromOptions', 'x')] },
          schema: binding('{{ [{ label: "FromSchema", value: "s", visible: true }] }}'),
        },
      });

      await openMenu();

      await waitFor(() => expect(optionLabels()).toEqual(['FromOptions']));
      expect(screen.queryByText('FromSchema')).not.toBeInTheDocument();
    });

    const MALFORMED_SOURCES = [
      ['a bound expression that is not an array', binding('{{ "not an array" }}')],
      ['null', binding('{{null}}')],
      ['undefined', binding('{{undefined}}')],
      ['an empty list', { value: [] }],
    ];

    test.each(MALFORMED_SOURCES)(
      '[DropdownV2-OPT-003] an active option source that is %s fails closed',
      async (_case, options) => {
        // Break this catches: `.map`/`.filter` straight off the resolved value,
        // which throws on the canvas the moment a query returns null.
        widget.render({ properties: { options } });

        await openMenu();

        await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
        expect(optionLabels()).toEqual([]);
        expect(widget.exposed().options).toEqual([]);
        expect(widget.exposed().value).toBeUndefined();
        expect(widget.exposed().selectedOption).toBeNull();
      }
    );

    test('[DropdownV2-OPT-004] initialization selects the first option that is both default and visible', async () => {
      // Break this catches: picking the first `default:true` option regardless
      // of visibility, which selects a value the user can never see or change.
      widget.render({
        properties: {
          options: {
            value: [
              option('Hidden default', 'h', { visible: false, isDefault: true }),
              option('Alpha', 'a'),
              option('Beta', 'b', { isDefault: true }),
              option('Gamma', 'c', { isDefault: true }),
            ],
          },
        },
      });

      await waitFor(() => expect(widget.exposed().value).toBe('b'));
      expect(widget.exposed().selectedOption).toEqual({ label: 'Beta', value: 'b', caption: null });
      expect(displayedText()).toContain('Beta');
    });

    test('[DropdownV2-OPT-004] a disabled default is still the initial selection (D-16)', async () => {
      // Break this catches: "improving" initialization to skip disabled
      // defaults. D-16 deliberately preserves the baseline: saved apps rely on
      // a disabled default rendering as the chosen value.
      widget.render({
        properties: {
          options: { value: [option('Alpha', 'a'), option('Locked', 'x', { isDefault: true, disable: true })] },
        },
      });

      await waitFor(() => expect(widget.exposed().value).toBe('x'));
      expect(displayedText()).toContain('Locked');
    });

    test('[DropdownV2-OPT-004] an option with omitted visibility is not default-eligible (D-18)', async () => {
      // Break this catches: relaxing `findDefaultItem` to `visible !== false`.
      // The asymmetry is deliberate — omitted visibility RENDERS (OPT-001) but
      // does not qualify as a default.
      widget.render({
        properties: { options: { value: [{ label: 'Delta', value: 'd', default: { value: '{{true}}' } }] } },
      });

      await openMenu();
      await waitFor(() => expect(optionLabels()).toEqual(['Delta']));
      expect(widget.exposed().value).toBeUndefined();
      expect(widget.exposed().selectedOption).toBeNull();
    });

    test('[DropdownV2-OPT-004] with no default option nothing is selected', async () => {
      widget.render({ properties: { options: OPTIONS, placeholder: binding('Select an option') } });

      await waitFor(() => expect(displayedText()).toContain('Select an option'));
      expect(widget.exposed().value).toBeUndefined();
      expect(widget.exposed().selectedOption).toBeNull();
    });

    test('[DropdownV2-OPT-005] a disabled option is announced as disabled and cannot be chosen by user or action', async () => {
      // Break this catches: dropping `isDisabled` off the mapped option, which
      // makes a blocked row silently selectable by click AND by selectOption.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Blocked', 'x', { disable: true })] } },
      });

      await openMenu();
      await waitFor(() => expect(optionLabels()).toEqual(['Alpha', 'Blocked']));
      const blocked = screen.getAllByRole('option').find((el) => el.textContent === 'Blocked');
      expect(blocked).toHaveAttribute('aria-disabled', 'true');

      await widget.session.user.click(blocked);
      expect(widget.exposed().value).toBeUndefined();

      await widget.act('selectOption', 'x');
      expect(widget.exposed().value).toBeUndefined();
      expect(widget.exposed().selectedOption).toBeNull();
    });

    test('[DropdownV2-OPT-006] captions render beside their own option and travel with the exposed objects', async () => {
      // Break this catches: rendering a caption against the wrong row, or
      // dropping `caption` from the exposed option/selection shape apps read.
      widget.render({
        properties: {
          options: {
            value: [
              option('Alpha', 'a', { caption: 'first letter' }),
              option('Beta', 'b', { caption: null }),
              option('Gamma', 'c', { caption: '' }),
            ],
          },
        },
      });

      await openMenu();
      await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));
      const rows = screen.getAllByRole('option');
      expect(within(rows[0]).getByText('first letter')).toBeInTheDocument();
      // Null and empty captions add no stray node: the row is exactly its label.
      expect(rows[1].textContent).toBe('Beta');
      expect(rows[2].textContent).toBe('Gamma');

      // `caption: data?.caption ?? null` only substitutes for undefined, so a
      // configured empty string is published verbatim rather than nulled.
      expect(widget.exposed().options).toEqual([
        { label: 'Alpha', value: 'a', caption: 'first letter' },
        { label: 'Beta', value: 'b', caption: null },
        { label: 'Gamma', value: 'c', caption: '' },
      ]);

      await pickOption('Alpha');
      expect(widget.exposed().selectedOption).toEqual({ label: 'Alpha', value: 'a', caption: 'first letter' });
    });

    test.each([
      ['false', false, 'Off'],
      ['zero', 0, 'Zero'],
      ['an empty string', '', 'Blank'],
    ])(
      '[DropdownV2-OPT-008] an option valued %s is selectable and published unchanged',
      async (_case, value, label) => {
        // Break this catches: any `if (value)` truthiness guard on the selection
        // path, which silently drops exactly these three values (D-09).
        widget.render({
          properties: {
            options: { value: [option('Alpha', 'a'), option(label, value)] },
            placeholder: binding('Select an option'),
          },
        });

        await openMenu();
        await pickOption(label);

        expect(widget.exposed().value).toBe(value);
        expect(widget.exposed().selectedOption).toEqual({ label, value, caption: null });
        expect(displayedText()).toContain(label);
        expect(displayedText()).not.toContain('Select an option');
      }
    );

    test('[DropdownV2-OPT-009] refreshing the options replaces the selection with the new first visible default', async () => {
      // Break this catches: preserving the old selection across a refresh.
      // D-10 deliberately keeps the baseline's recompute-from-source behavior.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })] } },
      });
      await waitFor(() => expect(widget.exposed().value).toBe('b'));

      await widget.session.store.act(() => {
        widget.setComponentProperty(
          ID,
          'options',
          [option('Beta', 'b'), option('Gamma', 'c', { isDefault: true })],
          'properties'
        );
      });

      // 'b' still exists in the new list and is NOT kept: the default wins.
      await waitFor(() => expect(widget.exposed().value).toBe('c'));
      expect(widget.exposed().selectedOption).toEqual({ label: 'Gamma', value: 'c', caption: null });
    });

    test('[DropdownV2-OPT-009] a refresh with no default clears the selection and fires no event', async () => {
      // Break this catches: firing `onSelect` from the reconciliation effect,
      // which would make every query refresh look like a user choice.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })] } },
      });
      await waitFor(() => expect(widget.exposed().value).toBe('b'));
      widget.setEvents(setVariableOn(ID, 'onSelect', { key: 'selectSeen', value: 'SELECTED' }));

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'options', [option('Beta', 'b'), option('Gamma', 'c')], 'properties');
      });

      await waitFor(() => expect(widget.exposed().value).toBeUndefined());
      expect(widget.exposed().selectedOption).toBeNull();
      expect(store().getVariable('selectSeen', MODULE_ID)).toBeUndefined();
    });
  });
});

describe('DropdownV2 selection, events and actions', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  describe('selection', () => {
    test('[DropdownV2-SEL-001] choosing an option closes the menu, publishes it, then fires onSelect once', async () => {
      // Break this catches: firing `onSelect` BEFORE `setInputValue` publishes,
      // so every handler reads the previous selection (D-05); and a second
      // delivery from an overlapping change path.
      widget.render({ properties: { options: OPTIONS } });
      widget.setEvents([
        ...countingEventOn(ID, 'onSelect', 'selectCount'),
        ...setVariableOn(ID, 'onSelect', { key: 'seenValue', value: `{{components.${NAME}.value}}` }),
        ...setVariableOn(ID, 'onSelect', { key: 'seenLabel', value: `{{components.${NAME}.selectedOption.label}}` }),
      ]);

      await openMenu();
      await pickOption('Beta');

      await waitFor(() => expect(countOf('selectCount')).toBe(1));
      expect(widget.exposed().value).toBe('b');
      expect(widget.exposed().selectedOption).toEqual({ label: 'Beta', value: 'b', caption: null });
      expect(store().getVariable('seenValue', MODULE_ID)).toBe('b');
      expect(store().getVariable('seenLabel', MODULE_ID)).toBe('Beta');
      expect(optionLabels()).toEqual([]);
      expect(displayedText()).toContain('Beta');
    });

    test('[DropdownV2-SEL-002] choosing the already-selected option clears it and fires onSelect once', async () => {
      // Break this catches: making reselection a no-op (D-04 keeps the
      // baseline's deselection), or reporting the OLD value to the handler.
      widget.render({ properties: { options: OPTIONS } });

      await openMenu();
      await pickOption('Beta');
      expect(widget.exposed().value).toBe('b');

      // Attached after the first selection so the counter can only see the second.
      widget.setEvents([
        ...countingEventOn(ID, 'onSelect', 'selectCount'),
        ...setVariableOn(ID, 'onSelect', { key: 'seenValue', value: `{{components.${NAME}.value}}` }),
      ]);

      await openMenu();
      await pickOption('Beta');

      await waitFor(() => expect(countOf('selectCount')).toBe(1));
      expect(widget.exposed().value).toBeNull();
      expect(widget.exposed().selectedOption).toBeNull();
      expect(store().getVariable('seenValue', MODULE_ID)).toBeNull();
    });

    test('[DropdownV2-SEL-003] the clear affordance appears only with a value, clears, revalidates and fires onSelect once', async () => {
      // Break this catches: a clear control with no accessible name (findable
      // only by CSS class), one that shows with nothing selected, or one that
      // clears without recomputing mandatory validity (D-06, D-08).
      widget.render({
        properties: { options: OPTIONS, showClearBtn: binding('{{true}}') },
        validation: { mandatory: { value: '{{true}}' } },
      });

      await screen.findByRole('combobox');
      expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();

      await openMenu();
      await pickOption('Alpha');
      expect(widget.exposed().value).toBe('a');
      expect(widget.exposed().isValid).toBe(true);

      widget.setEvents([
        ...countingEventOn(ID, 'onSelect', 'selectCount'),
        ...setVariableOn(ID, 'onSelect', { key: 'seenValue', value: `{{components.${NAME}.value}}` }),
      ]);
      const clear = await screen.findByRole('button', { name: 'Clear selection' });
      await widget.session.user.click(clear);

      await waitFor(() => expect(countOf('selectCount')).toBe(1));
      expect(widget.exposed().value).toBeNull();
      expect(widget.exposed().selectedOption).toBeNull();
      expect(widget.exposed().isValid).toBe(false);
      expect(store().getVariable('seenValue', MODULE_ID)).toBeNull();
    });

    test('[DropdownV2-SEL-003] no clear affordance is rendered when showClearBtn is off', async () => {
      widget.render({ properties: { options: OPTIONS, showClearBtn: binding('{{false}}') } });

      await openMenu();
      await pickOption('Alpha');

      expect(widget.exposed().value).toBe('a');
      expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
      expect(document.querySelector('.clear-indicator')).not.toBeInTheDocument();
    });
  });

  describe('selection events', () => {
    // Two of these paths select BEFORE the interaction under test, so the
    // expected count covers the whole path rather than one per interaction.
    test.each([
      [
        'a user selection',
        1,
        async () => {
          await openMenu();
          await pickOption('Beta');
        },
      ],
      ['a valid selectOption action', 1, async () => widget.act('selectOption', 'b')],
      [
        'a user clear after a selection',
        2,
        async () => {
          await openMenu();
          await pickOption('Beta');
          await widget.session.user.click(await screen.findByRole('button', { name: 'Clear selection' }));
        },
      ],
      [
        'reselecting the current option',
        2,
        async () => {
          await openMenu();
          await pickOption('Beta');
          await openMenu();
          await pickOption('Beta');
        },
      ],
    ])('[DropdownV2-EVT-001] %s delivers onSelect exactly once per state change', async (_path, expected, run) => {
      // Break this catches: a duplicate delivery from two writers publishing
      // the same change — the failure a constant-valued handler cannot see.
      widget.render({ properties: { options: OPTIONS } });
      widget.setEvents(countingEventOn(ID, 'onSelect', 'selectCount'));
      await screen.findByRole('combobox');

      await run();

      await waitFor(() => expect(countOf('selectCount')).toBe(expected));
    });

    test('[DropdownV2-EVT-001] an invalid selectOption, a programmatic clear and an option refresh deliver none', async () => {
      // Break this catches: `clear()` firing `onSelect` — which would make the
      // silent programmatic path indistinguishable from a user clear (D-06).
      widget.render({
        properties: { options: { value: [option('Alpha', 'a', { isDefault: true }), option('Beta', 'b')] } },
      });
      await waitFor(() => expect(widget.exposed().value).toBe('a'));
      widget.setEvents(countingEventOn(ID, 'onSelect', 'selectCount'));

      await widget.act('selectOption', 'not-an-option');
      await widget.act('clear');
      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'options', [option('Beta', 'b'), option('Gamma', 'c')], 'properties');
      });

      await waitFor(() => expect(widget.exposed().value).toBeUndefined());
      expect(countOf('selectCount')).toBe(0);
    });
  });

  describe('focus events', () => {
    const OPEN_PATHS = [
      ['a pointer', async () => void (await openMenu())],
      [
        'the keyboard',
        async () => {
          await screen.findByRole('combobox');
          await widget.session.user.tab();
          await widget.session.user.keyboard('{Enter}');
        },
      ],
    ];

    test.each(OPEN_PATHS)('[DropdownV2-EVT-002] opening with %s fires onFocus exactly once', async (_path, open) => {
      // Break this catches: an open path that skips `fireEvent('onFocus')`, and
      // one that fires it twice because pointer and keyboard handlers overlap.
      widget.render({ properties: { options: OPTIONS } });
      widget.setEvents(countingEventOn(ID, 'onFocus', 'focusCount'));

      await open();

      await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0));
      expect(countOf('focusCount')).toBe(1);
    });

    const CLOSE_PATHS = [
      [
        'the control toggle',
        async () => void fireEvent.click(screen.getByRole('combobox').closest('.dropdownV2-widget')),
      ],
      [
        'an outside pointer',
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
      ['Escape', async () => void (await widget.session.user.keyboard('{Escape}'))],
    ];

    test.each(CLOSE_PATHS)('[DropdownV2-EVT-002] closing with %s fires onBlur exactly once', async (_path, close) => {
      // Break this catches: a close path that never notifies the app, and the
      // opposite failure where two overlapping handlers (the outside-pointer
      // listener and react-select's own blur) both fire for one close.
      widget.render({ properties: { options: OPTIONS } });
      widget.setEvents(countingEventOn(ID, 'onBlur', 'blurCount'));

      await openMenu();
      await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0));
      expect(countOf('blurCount')).toBe(0);

      await close();

      await waitFor(() => expect(optionLabels()).toEqual([]));
      expect(countOf('blurCount')).toBe(1);
    });

    /**
     * PENDING A PRODUCTION FIX — recorded as `test.failing` so the approved
     * guarantee stays visible; see "Recorded gaps" at the top of this file.
     *
     * DropdownV2 wires no focus-exit handler at all, so tabbing out of an open
     * menu leaves it open and notifies nothing, while the other three close
     * paths each fire `onBlur`. Fixing it means routing every close through one
     * idempotent notifier and closing on focusout — deferred by a task, because
     * focusout fires before the next element is focused and opening the menu
     * from the keyboard hands focus to the portalled search box with no
     * relatedTarget to read.
     */
    test.failing('[DropdownV2-EVT-002] closing with Tab-away fires onBlur exactly once', async () => {
      widget.render({ properties: { options: OPTIONS } });
      widget.setEvents(countingEventOn(ID, 'onBlur', 'blurCount'));

      await openMenu();
      await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0));

      await widget.session.user.tab();

      await waitFor(() => expect(optionLabels()).toEqual([]));
      expect(countOf('blurCount')).toBe(1);
    });
  });

  describe('component actions', () => {
    test.each([
      ['a bare scalar', 'b'],
      ['an object wrapping that scalar', { value: 'b' }],
    ])('[DropdownV2-ACT-001] selectOption accepts %s and fires one fresh onSelect', async (_case, input) => {
      // Break this catches: dropping either accepted form (D-01), or firing
      // the event before the new value reaches the exposed state.
      widget.render({ properties: { options: OPTIONS } });
      widget.setEvents([
        ...countingEventOn(ID, 'onSelect', 'selectCount'),
        ...setVariableOn(ID, 'onSelect', { key: 'seenValue', value: `{{components.${NAME}.value}}` }),
      ]);

      await widget.act('selectOption', input);

      await waitFor(() => expect(countOf('selectCount')).toBe(1));
      expect(widget.exposed().value).toBe('b');
      expect(widget.exposed().selectedOption).toEqual({ label: 'Beta', value: 'b', caption: null });
      expect(store().getVariable('seenValue', MODULE_ID)).toBe('b');
      expect(displayedText()).toContain('Beta');
    });

    test('[DropdownV2-ACT-001] selectOption matches the option type exactly', async () => {
      // Break this catches: a `==` comparison, which would let the string '1'
      // select the numeric option 1 and publish the wrong type to the app.
      widget.render({ properties: { options: { value: [option('One', 1), option('Stringy one', '1')] } } });

      await widget.act('selectOption', 1);

      expect(widget.exposed().value).toBe(1);
      expect(widget.exposed().selectedOption).toEqual({ label: 'One', value: 1, caption: null });
    });

    test.each([
      ['no argument at all', undefined],
      ['null', null],
      ['an array', ['a']],
      ['an object with no matching value', { label: 'Alpha' }],
      ['an object whose value matches nothing', { value: 'nope' }],
      ['the wrong value type', 1],
      ['an unknown value', 'not-an-option'],
      ['a hidden option value', 'h'],
      ['a disabled option value', 'x'],
    ])('[DropdownV2-ACT-002] selectOption with %s is a complete no-op', async (_case, input) => {
      // Break this catches: any input shape that slips past the match guard and
      // mutates state (or fires onSelect) instead of being ignored (D-03).
      widget.render({
        properties: {
          options: {
            value: [
              option('Alpha', 'a'),
              option('Beta', 'b'),
              option('Hidden', 'h', { visible: false }),
              option('Blocked', 'x', { disable: true }),
            ],
          },
        },
      });

      await openMenu();
      await pickOption('Alpha');
      expect(widget.exposed().value).toBe('a');

      // Attached after the valid selection so any capture can only come from
      // an incorrect onSelect fired by the unmatched action below.
      widget.setEvents(countingEventOn(ID, 'onSelect', 'selectCount'));

      await widget.act('selectOption', input);

      expect(widget.exposed().value).toBe('a');
      expect(widget.exposed().selectedOption).toEqual({ label: 'Alpha', value: 'a', caption: null });
      expect(displayedText()).toContain('Alpha');
      expect(countOf('selectCount')).toBe(0);
    });

    test('[DropdownV2-ACT-003] clear() empties the selection, revalidates, stays silent and leaves presentation untouched', async () => {
      // Break this catches: `clear()` marking the field touched, which would
      // pop a validation error no user interaction asked for (D-08); or firing
      // `onSelect` like the user-facing clear does (D-06).
      widget.render({
        properties: { options: { value: [option('Alpha', 'a', { isDefault: true }), option('Beta', 'b')] } },
        validation: { mandatory: { value: '{{true}}' } },
      });
      await waitFor(() => expect(widget.exposed().value).toBe('a'));
      widget.setEvents(countingEventOn(ID, 'onSelect', 'selectCount'));

      await widget.act('clear');

      await waitFor(() => expect(widget.exposed().value).toBeNull());
      expect(widget.exposed().selectedOption).toBeNull();
      expect(widget.exposed().isValid).toBe(false);
      expect(countOf('selectCount')).toBe(0);
      expect(document.getElementById(`${ID}-validation-error`)).not.toBeInTheDocument();
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-errormessage');

      // Repeating an already-clear action changes nothing.
      await widget.act('clear');

      expect(widget.exposed().value).toBeNull();
      expect(widget.exposed().isValid).toBe(false);
      expect(countOf('selectCount')).toBe(0);
    });

    test.each([
      ['setVisibility', 'isVisible', 0, false, 'a truthy string', 'yes', true],
      ['setLoading', 'isLoading', '', false, 'a non-empty string', 'go', true],
      ['setDisable', 'isDisabled', null, false, 'the number 1', 1, true],
    ])(
      '[DropdownV2-ACT-004] %s coerces its argument to a boolean and leaves the selection alone',
      async (action, exposedKey, falsyInput, falsyResult, _truthyCase, truthyInput, truthyResult) => {
        // Break this catches: storing the raw argument, so `isVisible` becomes
        // `0` or `'yes'` instead of a boolean the app can rely on.
        widget.render({ properties: { options: { value: [option('Alpha', 'a', { isDefault: true })] } } });
        await waitFor(() => expect(widget.exposed().value).toBe('a'));

        await widget.act(action, truthyInput);
        expect(widget.exposed()[exposedKey]).toBe(truthyResult);

        await widget.act(action, falsyInput);
        expect(widget.exposed()[exposedKey]).toBe(falsyResult);

        expect(widget.exposed().value).toBe('a');
        expect(widget.exposed().selectedOption).toEqual({ label: 'Alpha', value: 'a', caption: null });
      }
    );
  });
});

describe('DropdownV2 search, state and validation', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  const searchBox = () => screen.queryByPlaceholderText('Search');

  describe('search', () => {
    test.each([
      ['true', '{{true}}', true],
      ['false', '{{false}}', false],
    ])(
      '[DropdownV2-SRCH-001] showSearchInput %s decides the search box without changing which options exist',
      async (_case, configured, expectPresent) => {
        // Break this catches: hiding the search box by also dropping options, or
        // rendering two search inputs into one menu.
        widget.render({ properties: { options: OPTIONS, showSearchInput: binding(configured) } });

        await openMenu();

        await waitFor(() => expect(optionLabels()).toEqual(['Alpha', 'Beta', 'Gamma']));
        expect(screen.queryAllByPlaceholderText('Search')).toHaveLength(expectPresent ? 1 : 0);
      }
    );

    test.each([
      ['a label in the same case', 'Bet', ['Beta']],
      ['a label in the opposite case', 'bET', ['Beta']],
      ['a caption', 'THIRD', ['Gamma']],
    ])('[DropdownV2-SRCH-002] client search keeps the options matching %s', async (_case, typed, expected) => {
      // Break this catches: a case-sensitive `includes`, or a filter that only
      // ever looks at the label and silently ignores captions.
      widget.render({
        properties: {
          options: {
            value: [
              option('Alpha', 'a', { caption: 'first' }),
              option('Beta', 'b', { caption: 'second' }),
              option('Gamma', 'c', { caption: 'third' }),
            ],
          },
          showSearchInput: binding('{{true}}'),
        },
      });

      await openMenu();
      await widget.session.user.type(await screen.findByPlaceholderText('Search'), typed);

      await waitFor(() =>
        expect(screen.queryAllByRole('option').map((el) => el.querySelector('[title]')?.getAttribute('title'))).toEqual(
          expected
        )
      );
    });

    test('[DropdownV2-SRCH-003] server-side search filters nothing locally and defers to the next schema refresh', async () => {
      // Break this catches: applying the client filter in server mode, which
      // hides rows the backend deliberately returned.
      widget.render({
        properties: {
          advanced: binding('{{true}}'),
          schema: binding(
            '{{ [{ label: "Ada", value: 1, visible: true }, { label: "Grace", value: 2, visible: true }] }}'
          ),
          showSearchInput: binding('{{true}}'),
          serverSideSearch: binding('{{true}}'),
        },
      });

      await openMenu();
      await waitFor(() => expect(optionLabels()).toEqual(['Ada', 'Grace']));

      await widget.session.user.type(await screen.findByPlaceholderText('Search'), 'zzz');

      await waitFor(() => expect(widget.exposed().searchText).toBe('zzz'));
      expect(optionLabels()).toEqual(['Ada', 'Grace']);

      // The query is what narrows the list, by re-resolving the schema.
      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'schema', '{{ [{ label: "Grace", value: 2, visible: true }] }}', 'properties');
      });

      await waitFor(() => expect(optionLabels()).toEqual(['Grace']));
    });

    test('[DropdownV2-SRCH-004] each input change publishes the current text before one onSearchTextChanged', async () => {
      // Break this catches: firing the event before `searchText` is published,
      // so a handler reading it sees the previous keystroke; and a delivery
      // count that does not match the number of real input changes.
      widget.render({ properties: { options: OPTIONS, showSearchInput: binding('{{true}}') } });
      widget.setEvents([
        ...countingEventOn(ID, 'onSearchTextChanged', 'searchCount'),
        ...setVariableOn(ID, 'onSearchTextChanged', { key: 'seenText', value: `{{components.${NAME}.searchText}}` }),
      ]);

      await openMenu();
      expect(countOf('searchCount')).toBe(0);

      await widget.session.user.type(await screen.findByPlaceholderText('Search'), 'ga');

      await waitFor(() => expect(widget.exposed().searchText).toBe('ga'));
      expect(countOf('searchCount')).toBe(2); // one per keystroke
      expect(store().getVariable('seenText', MODULE_ID)).toBe('ga');
    });

    test.each([
      [
        'a selection',
        async () => {
          await pickOption('Gamma');
        },
      ],
      [
        'a user clear',
        async () => {
          await widget.session.user.click(await screen.findByRole('button', { name: 'Clear selection' }));
        },
      ],
      [
        'the control toggle',
        async () => {
          fireEvent.click(screen.getByRole('combobox').closest('.dropdownV2-widget'));
        },
      ],
      [
        'an outside pointer',
        async () => {
          const outside = document.createElement('button');
          document.body.appendChild(outside);
          try {
            await widget.session.user.click(outside);
          } finally {
            outside.remove();
          }
        },
      ],
    ])('[DropdownV2-SRCH-005] closing by %s resets the visible and exposed search text', async (_path, close) => {
      // Break this catches: a close path that leaves a stale filter behind, so
      // reopening shows a narrowed list the user never asked for.
      widget.render({
        properties: {
          options: { value: [option('Alpha', 'a', { isDefault: true }), option('Gamma', 'c')] },
          showSearchInput: binding('{{true}}'),
        },
      });
      await waitFor(() => expect(widget.exposed().value).toBe('a'));

      await openMenu();
      await widget.session.user.type(await screen.findByPlaceholderText('Search'), 'ga');
      await waitFor(() => expect(widget.exposed().searchText).toBe('ga'));

      await close();

      await waitFor(() => expect(widget.exposed().searchText).toBe(''));
      await openMenu();
      expect(await screen.findByPlaceholderText('Search')).toHaveValue('');
    });

    test('[DropdownV2-SRCH-005] Escape keeps the search text, which reappears on reopen (D-14)', async () => {
      // Break this catches: "tidying up" Escape to reset search like the other
      // paths. D-14 deliberately preserves the split.
      widget.render({ properties: { options: OPTIONS, showSearchInput: binding('{{true}}') } });

      await openMenu();
      await widget.session.user.type(await screen.findByPlaceholderText('Search'), 'ga');
      await waitFor(() => expect(widget.exposed().searchText).toBe('ga'));

      await widget.session.user.keyboard('{Escape}');

      await waitFor(() => expect(optionLabels()).toEqual([]));
      expect(widget.exposed().searchText).toBe('ga');

      await openMenu();
      expect(await screen.findByPlaceholderText('Search')).toHaveValue('ga');
    });

    test('[DropdownV2-SRCH-005] tabbing away adds no search reset of its own (D-14)', async () => {
      // Break this catches: folding the focus-exit path into the
      // search-resetting group, which D-14 explicitly did not approve.
      //
      // Scope note: this asserts only the search text. Whether Tab-away also
      // CLOSES the menu is the separate, still-unmet EVT-002 guarantee — today
      // it does not, so asserting a close here would fail for that reason
      // rather than for a search-reset regression.
      widget.render({ properties: { options: OPTIONS, showSearchInput: binding('{{true}}') } });

      await openMenu();
      await widget.session.user.type(await screen.findByPlaceholderText('Search'), 'ga');
      await waitFor(() => expect(widget.exposed().searchText).toBe('ga'));

      await widget.session.user.tab();

      expect(widget.exposed().searchText).toBe('ga');
      expect(await screen.findByPlaceholderText('Search')).toHaveValue('ga');
    });
  });

  describe('disabled, loading and visibility', () => {
    test.each([
      ['disabledState', 'isDisabled'],
      ['loadingState', 'isLoading'],
    ])('[DropdownV2-STATE-001] %s gates opening, searching, selecting and clearing', async (property, exposedKey) => {
      // Break this catches: a gate that only greys the control visually while
      // the menu still opens and selection still changes.
      widget.render({
        properties: {
          options: { value: [option('Alpha', 'a', { isDefault: true }), option('Beta', 'b')] },
          [property]: binding('{{true}}'),
        },
      });

      const combobox = await screen.findByRole('combobox');
      expect(widget.exposed()[exposedKey]).toBe(true);

      fireEvent.click(combobox.closest('.dropdownV2-widget'));

      expect(optionLabels()).toEqual([]);
      expect(searchBox()).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
      expect(widget.exposed().value).toBe('a');
    });

    test.each([
      ['disabledState', 'isDisabled', (combobox) => expect(combobox).toBeDisabled()],
      [
        'loadingState',
        'isLoading',
        // Overall loading is presented as the control spinner, which also
        // replaces the caret — the widget's own documented busy presentation.
        () => expect(document.querySelector('.tj-widget-loader')).toBeInTheDocument(),
      ],
    ])(
      '[DropdownV2-STATE-001] %s is presented on the control and published as %s',
      async (property, exposedKey, assertPresented) => {
        // Break this catches: a state that changes behaviour without any visible
        // or published trace, so neither the user nor the app can tell.
        widget.render({ properties: { options: OPTIONS, [property]: binding('{{true}}') } });

        assertPresented(await screen.findByRole('combobox'));
        expect(widget.exposed()[exposedKey]).toBe(true);
      }
    );

    test('[DropdownV2-STATE-002] visibility:false hides the widget from interaction and assistive tech, and restoring it keeps the selection', async () => {
      // Break this catches: hiding only visually, leaving a screen-reader
      // reachable control an app author believes is gone.
      widget.render({
        properties: {
          options: { value: [option('Alpha', 'a', { isDefault: true }), option('Beta', 'b')] },
          visibility: binding('{{false}}'),
        },
      });

      // The whole widget — label, control and menu trigger — is hidden as one
      // subtree, so the guarantee is asserted on the wrapper, not the input.
      const wrapper = await waitFor(() => {
        const found = document.querySelector('.dropdown-widget');
        expect(found).toBeTruthy();
        return found;
      });
      expect(wrapper).toHaveClass('invisible');
      expect(widget.exposed().isVisible).toBe(false);

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'visibility', '{{true}}', 'properties');
      });

      await waitFor(() => expect(widget.exposed().isVisible).toBe(true));
      expect(document.querySelector('.dropdown-widget')).not.toHaveClass('invisible');
      expect(widget.exposed().value).toBe('a');
    });

    /**
     * PENDING A PRODUCTION FIX — see "Recorded gaps" at the top of this file.
     *
     * `aria-hidden={!visibility}` is passed to `Select`, but react-select uses
     * `aria-hidden` for its OWN decorative nodes and never forwards the prop —
     * so a hidden Dropdown is invisible to sighted users while still being
     * announced and reachable by assistive tech. The approved STATE-002
     * guarantee says "unavailable to interaction/assistive use". The fix is to
     * put `aria-hidden` on the widget wrapper, which is the node the
     * `invisible` class already hides.
     */
    test.failing('[DropdownV2-STATE-002] a hidden dropdown is hidden from assistive tech too', async () => {
      widget.render({ properties: { options: OPTIONS, visibility: binding('{{false}}') } });

      await waitFor(() => expect(document.querySelector('.dropdown-widget')).toHaveClass('invisible'));

      expect(document.querySelector('.dropdown-widget')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('state precedence between actions and properties', () => {
    const STATE_PAIRS = [
      {
        action: 'setDisable',
        arg: true,
        property: 'disabledState',
        currentValue: '{{false}}',
        changedValue: '{{true}}',
        exposedKey: 'isDisabled',
        assertOverridden: async () => {
          expect(await screen.findByRole('combobox')).toBeDisabled();
          expect(widget.exposed().isDisabled).toBe(true);
        },
      },
      {
        action: 'setVisibility',
        arg: false,
        property: 'visibility',
        currentValue: '{{true}}',
        changedValue: '{{false}}',
        exposedKey: 'isVisible',
        assertOverridden: async () => {
          await waitFor(() => expect(document.querySelector('.dropdown-widget')).toHaveClass('invisible'));
          expect(widget.exposed().isVisible).toBe(false);
        },
      },
      {
        action: 'setLoading',
        arg: true,
        property: 'loadingState',
        currentValue: '{{false}}',
        changedValue: '{{true}}',
        exposedKey: 'isLoading',
        assertOverridden: async () => {
          await waitFor(() => expect(document.querySelector('.tj-widget-loader')).toBeInTheDocument());
          expect(widget.exposed().isLoading).toBe(true);
        },
      },
    ];

    test.each(STATE_PAIRS)(
      '[DropdownV2-STATE-003] $action takes the widget away from its $property value',
      async ({ action, arg, assertOverridden }) => {
        // Break this catches: an action that publishes the exposed variable
        // without actually changing behaviour, or vice versa.
        widget.render({ properties: { options: OPTIONS } });
        await screen.findByRole('combobox');

        await widget.act(action, arg);

        await assertOverridden();
      }
    );

    test.each(STATE_PAIRS)(
      '[DropdownV2-STATE-004] $action survives unrelated property resolution',
      async ({ action, arg, assertOverridden }) => {
        // Break this catches: the property-to-state sync effect running
        // unguarded, so the override dies the moment any other property
        // re-resolves — including a plain option refresh (D-12).
        widget.render({ properties: { options: OPTIONS } });
        await widget.act(action, arg);
        await assertOverridden();

        await widget.session.store.act(() => {
          widget.setComponentProperty(ID, 'label', 'Changed by a query', 'properties');
        });
        await waitFor(() => expect(widget.exposed().label).toBe('Changed by a query'));
        await assertOverridden();

        await widget.session.store.act(() => {
          widget.setComponentProperty(ID, 'options', [option('Delta', 'd', { isDefault: true })], 'properties');
        });
        await waitFor(() => expect(widget.exposed().value).toBe('d'));
        await assertOverridden();
      }
    );

    test.each(STATE_PAIRS)(
      '[DropdownV2-STATE-005] $action survives a no-op rewrite of $property',
      async ({ action, arg, property, currentValue, assertOverridden }) => {
        // Break this catches: syncing on every resolution rather than on a real
        // change, so re-saving an unchanged property silently revokes the CSA.
        widget.render({ properties: { options: OPTIONS } });
        await widget.act(action, arg);
        await assertOverridden();

        await widget.session.store.act(() => {
          widget.setComponentProperty(ID, property, currentValue, 'properties');
        });

        await assertOverridden();
      }
    );

    test.each(STATE_PAIRS)(
      '[DropdownV2-STATE-006] a genuine $property change retakes control from $action',
      async ({ action, arg, property, changedValue, exposedKey, assertOverridden }) => {
        // Break this catches: an override that outlives the property entirely,
        // leaving a query unable to re-enable the field it disabled (D-12).
        widget.render({ properties: { options: OPTIONS } });
        await widget.act(action, !arg);
        await widget.act(action, arg);
        await assertOverridden();

        await widget.session.store.act(() => {
          widget.setComponentProperty(ID, property, changedValue, 'properties');
        });

        await waitFor(() => expect(widget.exposed()[exposedKey]).toBe(property === 'visibility' ? false : true));
      }
    );
  });

  describe('options loading', () => {
    test('[DropdownV2-LOAD-001] with dynamic options the spinner replaces the rows and leaves the control usable', async () => {
      // Break this catches: options loading leaking into overall `isLoading`,
      // which would disable the whole control while a query refreshes its list.
      widget.render({
        properties: {
          advanced: binding('{{true}}'),
          schema: binding('{{ [{ label: "Ada", value: 1, visible: true }] }}'),
          optionsLoadingState: binding('{{true}}'),
        },
      });

      await openMenu();

      await waitFor(() => expect(document.querySelector('.tj-widget-loader')).toBeInTheDocument());
      expect(optionLabels()).toEqual([]);
      expect(widget.exposed().isLoading).toBe(false);
      expect(screen.getByRole('combobox')).not.toBeDisabled();
      // The menu is still open and the search box still usable: only the option
      // rows are waiting, which is the whole point of a menu-local spinner.
      expect(searchBox()).toBeInTheDocument();

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'optionsLoadingState', '{{false}}', 'properties');
      });

      await waitFor(() => expect(optionLabels()).toEqual(['Ada']));
    });

    test('[DropdownV2-LOAD-001] static options ignore optionsLoadingState entirely (D-13)', async () => {
      // Break this catches: showing a permanent spinner on a static list,
      // where there is nothing to wait for.
      widget.render({
        properties: { advanced: binding('{{false}}'), options: OPTIONS, optionsLoadingState: binding('{{true}}') },
      });

      await openMenu();

      await waitFor(() => expect(optionLabels()).toEqual(['Alpha', 'Beta', 'Gamma']));
      expect(widget.exposed().isLoading).toBe(false);
    });
  });

  describe('validation', () => {
    const errorNode = () => document.getElementById(`${ID}-validation-error`);

    test('[DropdownV2-VAL-002] a mandatory empty field is invalid immediately but shows nothing until it is touched', async () => {
      // Break this catches: publishing `isValid` only after interaction (apps
      // gate submit buttons on it from the first render), and the opposite
      // failure of shouting an error at a field nobody has touched yet.
      widget.render({ properties: { options: OPTIONS }, validation: { mandatory: { value: '{{true}}' } } });

      const combobox = await screen.findByRole('combobox');
      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(combobox).toHaveAttribute('aria-invalid', 'true');
      expect(errorNode()).not.toBeInTheDocument();
      expect(combobox).not.toHaveAttribute('aria-errormessage');
    });

    /**
     * PENDING A PRODUCTION FIX — see "Recorded gaps" at the top of this file.
     *
     * DropdownV2 passes `aria-required={isMandatory}` to `Select`, but
     * react-select builds that attribute from its OWN `required` prop and
     * ignores a passed `aria-required`, so a mandatory Dropdown is never
     * announced as required. The fix is one word: pass `required={isMandatory}`.
     */
    test.failing('[DropdownV2-VAL-002] a mandatory dropdown announces itself as required', async () => {
      widget.render({ properties: { options: OPTIONS }, validation: { mandatory: { value: '{{true}}' } } });

      expect(await screen.findByRole('combobox')).toHaveAttribute('aria-required', 'true');
    });

    test('[DropdownV2-VAL-002] clearing a selection reveals the error and associates it with the control', async () => {
      // Break this catches: a touch path that updates validity without ever
      // linking the message to the control, leaving screen-reader users with
      // an invalid field and no reason why (D-08).
      widget.render({ properties: { options: OPTIONS }, validation: { mandatory: { value: '{{true}}' } } });
      await screen.findByRole('combobox');

      await openMenu();
      await pickOption('Alpha');
      await widget.session.user.click(await screen.findByRole('button', { name: 'Clear selection' }));

      await waitFor(() => expect(errorNode()).toBeInTheDocument());
      expect(errorNode()).toHaveTextContent('Field cannot be empty');
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-errormessage', `${ID}-validation-error`);
    });

    /**
     * PENDING A PRODUCTION FIX — see "Recorded gaps" at the top of this file.
     *
     * D-08 approved blur as a touch path, but `setUserInteracted(true)` is only
     * called from `onChange` (and by the Form-submit signal). Tabbing past a
     * mandatory Dropdown therefore leaves it silently invalid. The fix rides
     * along with the EVT-002 focus-exit handler, which is the natural place to
     * mark the field touched.
     */
    test.failing('[DropdownV2-VAL-002] blurring away from an empty mandatory field reveals the error', async () => {
      widget.render({ properties: { options: OPTIONS }, validation: { mandatory: { value: '{{true}}' } } });
      await screen.findByRole('combobox');

      await openMenu();
      await widget.session.user.tab();

      await waitFor(() => expect(errorNode()).toBeInTheDocument());
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-errormessage', `${ID}-validation-error`);
    });

    test('[DropdownV2-VAL-002] the revealed error disappears once a value is chosen', async () => {
      widget.render({ properties: { options: OPTIONS }, validation: { mandatory: { value: '{{true}}' } } });

      await openMenu();
      await pickOption('Alpha');
      await widget.session.user.click(await screen.findByRole('button', { name: 'Clear selection' }));
      await waitFor(() => expect(errorNode()).toBeInTheDocument());

      await openMenu();
      await pickOption('Alpha');

      await waitFor(() => expect(widget.exposed().isValid).toBe(true));
      expect(errorNode()).not.toBeInTheDocument();
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-errormessage');
    });

    test('[DropdownV2-VAL-003] a bound custom rule fails against the current typed selection and recovers', async () => {
      // Break this catches: evaluating the rule against a stale selection, so
      // the message survives a choice that should satisfy it.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a'), option('Beta', 'b')] } },
        validation: {
          customRule: binding(`{{components.${NAME}.value === 'b' ? 'Beta is banned' : true}}`),
        },
      });

      await openMenu();
      await pickOption('Beta');

      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(await screen.findByText('Beta is banned')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-errormessage', `${ID}-validation-error`);

      await openMenu();
      await pickOption('Alpha');

      await waitFor(() => expect(widget.exposed().isValid).toBe(true));
      expect(screen.queryByText('Beta is banned')).not.toBeInTheDocument();
      expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-errormessage');
    });
  });

  describe('public surface', () => {
    test('[DropdownV2-EXP-001] the widget exposes exactly its documented variables and actions', async () => {
      // Break this catches: an accidental addition (an internal flag leaking
      // into the app-facing surface) as much as a removal, either of which
      // breaks apps binding to `components.dropdown1.*`.
      widget.render({
        properties: { options: { value: [option('Alpha', 'a', { isDefault: true, caption: 'first' })] } },
        validation: { mandatory: { value: '{{true}}' } },
      });

      await waitFor(() => expect(widget.exposed().value).toBe('a'));
      const exposed = widget.exposed();

      expect(Object.keys(exposed).sort()).toEqual(
        [
          // Published by RenderWidget.jsx:270 for EVERY widget, so it is part
          // of the surface apps see even though DropdownV2 does not write it.
          'id',
          'clear',
          'isDisabled',
          'isLoading',
          'isMandatory',
          'isValid',
          'isVisible',
          'label',
          'options',
          'searchText',
          'selectOption',
          'selectedOption',
          'setDisable',
          'setLoading',
          'setVisibility',
          'value',
        ].sort()
      );
      for (const action of ['clear', 'selectOption', 'setVisibility', 'setLoading', 'setDisable']) {
        expect(typeof exposed[action]).toBe('function');
      }
      expect(exposed.label).toBe('Letter');
      expect(exposed.searchText).toBe('');
      expect(exposed.options).toEqual([{ label: 'Alpha', value: 'a', caption: 'first' }]);
      expect(exposed.selectedOption).toEqual({ label: 'Alpha', value: 'a', caption: 'first' });
      expect(exposed.isValid).toBe(true);
      expect(exposed.isVisible).toBe(true);
      expect(exposed.isLoading).toBe(false);
      expect(exposed.isDisabled).toBe(false);
      expect(exposed.isMandatory).toBe(true);
    });
  });

  describe('icon', () => {
    test.each([
      ['{{true}}', true],
      ['{{false}}', false],
    ])(
      '[DropdownV2-ICON-001] iconVisibility %s decides whether the configured icon renders',
      async (configured, expectIcon) => {
        // Break this catches: rendering the icon whenever `icon` is configured,
        // ignoring the gate the inspector actually exposes.
        widget.render({
          properties: { options: OPTIONS, placeholder: binding('Select an option') },
          styles: { icon: binding('IconHome2'), iconVisibility: binding(configured) },
        });

        await screen.findByRole('combobox');
        const control = document.querySelector('.dropdownV2-widget');

        await waitFor(() =>
          expect(
            control.querySelectorAll('.tabler-icon, svg.icon-tabler, [class*="tabler-icon-home"]').length > 0
          ).toBe(expectIcon)
        );
        // Everything else about the field is unaffected either way.
        expect(displayedText()).toContain('Select an option');
        await openMenu();
        expect(await screen.findByPlaceholderText('Search')).toBeInTheDocument();
        expect(optionLabels()).toEqual(['Alpha', 'Beta', 'Gamma']);
      }
    );
  });
});

/**
 * Styles, the universal CSS class, and the Form lifecycle.
 *
 * Only styles DropdownV2 emits DIRECTLY as inline style — the label, the
 * validation message, the leading icon, and RenderWidget's own padding/class
 * — are asserted here. Everything React Select generates into a stylesheet
 * (field background, border, accent, radius, shadow) needs real computed CSS
 * and belongs to DropdownV2-BRW-008 in the browser lane.
 */
describe('DropdownV2 styles, CSS class and Form lifecycle', () => {
  const labelElement = () => document.getElementById(`${ID}-label`);
  const labelText = () => labelElement()?.querySelector('p');
  const errorNode = () => document.getElementById(`${ID}-validation-error`);
  const canvasComponent = () => document.querySelector('.canvas-component');

  describe('label and message styles', () => {
    beforeEach(() => widget.setup());
    afterEach(() => widget.teardown());

    test('[DropdownV2-STY-001] the label carries the configured colour and font size, and follows a re-resolved binding', async () => {
      // Break this catches: label typography read once at mount, so a bound
      // colour never changes after the first render.
      widget.render({
        properties: { label: binding('Pick a letter'), options: OPTIONS },
        styles: { labelColor: binding('rgb(255, 0, 0)'), labelFontSize: binding('{{18}}') },
      });

      await screen.findByText('Pick a letter');
      expect(labelElement()).toHaveStyle({ fontSize: '18px' });
      expect(labelText()).toHaveStyle({ color: 'rgb(255, 0, 0)' });

      await widget.session.store.act(() => {
        widget.setComponentProperty(ID, 'labelColor', 'rgb(0, 0, 255)', 'styles');
      });

      await waitFor(() => expect(labelText()).toHaveStyle({ color: 'rgb(0, 0, 255)' }));
    });

    const LABEL_LAYOUTS = [
      [
        'side + left',
        { alignment: binding('side'), direction: binding('left'), auto: binding('{{true}}') },
        (wrapper) => {
          expect(wrapper).toHaveClass('align-items-center');
          expect(wrapper).not.toHaveClass('flex-row-reverse');
          expect(labelElement()).toHaveStyle({ width: 'auto', justifyContent: 'flex-start' });
        },
      ],
      [
        'side + right',
        { alignment: binding('side'), direction: binding('right'), auto: binding('{{true}}') },
        (wrapper) => {
          expect(wrapper).toHaveClass('flex-row-reverse');
          expect(labelElement()).toHaveStyle({ justifyContent: 'flex-end' });
        },
      ],
      [
        'top + right',
        { alignment: binding('top'), direction: binding('right'), auto: binding('{{true}}') },
        (wrapper) => {
          expect(wrapper).toHaveClass('flex-column');
          expect(wrapper).toHaveClass('text-right');
        },
      ],
      [
        'a fixed width measured against the component',
        {
          alignment: binding('side'),
          direction: binding('left'),
          auto: binding('{{false}}'),
          labelWidth: binding('40'),
          widthType: binding('ofComponent'),
        },
        (wrapper) => {
          expect(labelElement()).toHaveStyle({ width: '40%', maxWidth: '100%' });
          // The field takes the remainder, which is what "of component" means.
          expect(wrapper.querySelector('.dropdownV2-widget')).toHaveStyle({ width: '60%' });
        },
      ],
      [
        'a fixed width measured against the field',
        {
          alignment: binding('side'),
          direction: binding('left'),
          auto: binding('{{false}}'),
          labelWidth: binding('40'),
          widthType: binding('ofField'),
        },
        () => {
          // 40% OF the 70% cap, and the cap itself is declared.
          expect(labelElement()).toHaveStyle({ width: '28%', maxWidth: '70%' });
        },
      ],
    ];

    test.each(LABEL_LAYOUTS)(
      '[DropdownV2-STY-002] label layout %s emits the registered structure',
      async (_case, styles, assertLayout) => {
        // Break this catches: any one of the five layout keys being ignored, which
        // silently reflows every saved app that set it.
        widget.render({ properties: { label: binding('Pick a letter'), options: OPTIONS }, styles });

        await screen.findByText('Pick a letter');

        assertLayout(document.querySelector('.dropdown-widget'));
      }
    );

    test.each([
      ['left', 'flex-end'],
      ['right', 'flex-start'],
    ])(
      '[DropdownV2-STY-003] the validation message uses errTextColor and aligns opposite direction %s',
      async (direction, expectedJustify) => {
        // Break this catches: styling the message but breaking the association,
        // or aligning it with the label instead of opposite it.
        widget.render({
          properties: { options: OPTIONS },
          validation: { mandatory: { value: '{{true}}' } },
          styles: { direction: binding(direction), errTextColor: binding('rgb(200, 0, 0)') },
        });

        // Revealed through the clear affordance: it is the touch path the
        // runtime actually honours today (see the recorded VAL-002 blur gap).
        await openMenu();
        await pickOption('Alpha');
        await widget.session.user.click(await screen.findByRole('button', { name: 'Clear selection' }));

        await waitFor(() => expect(errorNode()).toBeInTheDocument());
        expect(errorNode()).toHaveStyle({ color: 'rgb(200, 0, 0)', justifyContent: expectedJustify });
        // Styling must not disturb the result or its association.
        expect(widget.exposed().isValid).toBe(false);
        expect(screen.getByRole('combobox')).toHaveAttribute('aria-errormessage', `${ID}-validation-error`);
      }
    );

    const ICON_COLOR_CASES = [
      [
        'the explicit icon colour',
        { iconColor: 'rgb(10, 20, 30)', placeholderTextColor: 'rgb(90, 90, 90)' },
        'rgb(10, 20, 30)',
      ],
      [
        'the placeholder colour when icon colour is left at its default',
        { iconColor: 'var(--cc-default-icon)', placeholderTextColor: 'rgb(90, 90, 90)' },
        'rgb(90, 90, 90)',
      ],
    ];

    test.each(ICON_COLOR_CASES)(
      '[DropdownV2-STY-004] a visible leading icon uses %s',
      async (_case, colors, expectedColor) => {
        // Break this catches: losing the documented placeholder-colour fallback,
        // which leaves the icon at a default colour that clashes with the field.
        widget.render({
          properties: { options: OPTIONS, placeholder: binding('Select an option') },
          styles: {
            icon: binding('IconHome2'),
            iconVisibility: binding('{{true}}'),
            iconColor: binding(colors.iconColor),
            placeholderTextColor: binding(colors.placeholderTextColor),
          },
        });

        await screen.findByRole('combobox');
        const icon = await waitFor(() => {
          const found = document.querySelector('.dropdownV2-widget svg');
          expect(found).toBeTruthy();
          return found;
        });

        expect(icon).toHaveStyle({ color: expectedColor });
        // Option and selection state are untouched by icon styling.
        expect(displayedText()).toContain('Select an option');
        expect(widget.exposed().value).toBeUndefined();
      }
    );

    test.each([
      ['none', '0px'],
      ['default', '2px'],
    ])('[DropdownV2-STY-005] padding %s sets the inner canvas component inset to %s', async (padding, expected) => {
      // Break this catches: the padding style being read from the wrong node,
      // so a widget asked to sit flush still carries the canvas inset.
      widget.render({ properties: { options: OPTIONS }, styles: { padding: binding(padding) } });

      await screen.findByRole('combobox');

      expect(canvasComponent()).toHaveStyle({ padding: expected });
      // Behaviour is unchanged either way.
      await openMenu();
      await waitFor(() => expect(optionLabels()).toEqual(['Alpha', 'Beta', 'Gamma']));
    });
  });

  describe('universal CSS class', () => {
    // The licence endpoint is the only public way to move
    // `license.featureAccess`, so it is driven through MSW and re-fetched with
    // the real `updateFeatureAccess` action rather than poked into the store.
    let customStyling = true;
    const licensed = createWidgetHarness({
      componentType: 'DropdownV2',
      handle: NAME,
      id: ID,
      defaultProperties: {
        label: binding('Letter'),
        visibility: binding('{{true}}'),
        loadingState: binding('{{false}}'),
        disabledState: binding('{{false}}'),
        optionsLoadingState: binding('{{false}}'),
        advanced: binding('{{false}}'),
      },
      defaultStyles: { auto: binding('{{true}}'), labelWidth: binding('33'), widthType: binding('ofComponent') },
      offsetHeight: 300,
      capabilities: {
        network: [
          { url: '*/license/access', json: () => ({ customStyling }) },
          { method: 'get', url: '*', json: {} },
          { method: 'post', url: '*', json: {} },
          { method: 'put', url: '*', json: {} },
          { method: 'patch', url: '*', json: {} },
        ],
      },
    });

    const refreshLicense = () => licensed.session.store.act('updateFeatureAccess');

    beforeEach(() => {
      customStyling = true;
      licensed.setup();
    });
    afterEach(() => licensed.teardown());

    test('[DropdownV2-CSS-001] a licensed cssClass is trimmed, whitespace-collapsed and applied to the inner canvas component', async () => {
      // Break this catches: applying the raw string, which turns a stray
      // double space or newline into empty class tokens the client's custom
      // CSS can never target.
      await refreshLicense();
      licensed.render({
        properties: { options: OPTIONS },
        styles: { cssClass: binding('  brand-field   is-wide \n') },
      });

      await screen.findByRole('combobox');

      await waitFor(() => expect(canvasComponent()).toHaveClass('brand-field', 'is-wide'));
      expect(canvasComponent().className).not.toMatch(/\s{2,}/);
    });

    test('[DropdownV2-CSS-001] the class is withheld without the customStyling licence and returns when it is restored', async () => {
      // Break this catches: erasing the saved value when the licence lapses —
      // the classes must come back untouched on re-enable, with no migration.
      customStyling = false;
      await refreshLicense();
      licensed.render({ properties: { options: OPTIONS }, styles: { cssClass: binding('brand-field') } });

      await screen.findByRole('combobox');
      await waitFor(() => expect(canvasComponent()).not.toHaveClass('brand-field'));
      // The saved value is untouched; only its application is gated.
      expect(licensed.session.store.read((state) => state.getResolvedComponent(ID, MODULE_ID)?.styles?.cssClass)).toBe(
        'brand-field'
      );

      customStyling = true;
      await refreshLicense();

      await waitFor(() => expect(canvasComponent()).toHaveClass('brand-field'));
    });
  });

  describe('Form lifecycle', () => {
    const FORM = 'form1';

    beforeEach(() => widget.setup());
    afterEach(() => widget.teardown());

    test('[DropdownV2-FRM-001] submitting a Form reveals the Dropdown error, keeps its value and associates exactly one message', async () => {
      // Break this catches: ignoring `useShowValidationOnFormSubmit`, so an
      // invalid submit leaves the field looking untouched and unexplained.
      widget.renderInsideForm({
        properties: {
          label: binding('Required choice'),
          options: { value: [option('Alpha', 'a'), option('Beta', 'b')] },
        },
        validation: { mandatory: binding('{{true}}') },
      });

      const combobox = await screen.findByRole('combobox', { name: /Required choice/ });
      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(errorNode()).not.toBeInTheDocument();

      await waitFor(() => expect(widget.exposed(FORM).submitForm).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed(FORM).submitForm();
      });

      await waitFor(() => expect(errorNode()).toBeInTheDocument());
      expect(errorNode()).toHaveTextContent('Field cannot be empty');
      expect(combobox).toHaveAttribute('aria-invalid', 'true');
      expect(combobox).toHaveAttribute('aria-errormessage', `${ID}-validation-error`);
      expect(document.querySelectorAll(`#${ID}-validation-error`)).toHaveLength(1);
      expect(widget.exposed().value).toBeUndefined();
    }, 30000);

    test('[DropdownV2-FRM-002] clearing a Form publishes null and restores untouched presentation even with a default', async () => {
      // Break this catches: Form clear reselecting the schema default (D-11),
      // or leaving a previously revealed error on screen afterwards.
      widget.renderInsideForm({
        properties: {
          label: binding('Required choice'),
          options: { value: [option('Alpha', 'a'), option('Beta', 'b', { isDefault: true })] },
        },
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
      expect(widget.exposed().selectedOption).toBeNull();
      // Validity is still computed correctly; only its PRESENTATION is reset.
      expect(widget.exposed().isValid).toBe(false);
      expect(errorNode()).not.toBeInTheDocument();
    }, 30000);
  });
});
