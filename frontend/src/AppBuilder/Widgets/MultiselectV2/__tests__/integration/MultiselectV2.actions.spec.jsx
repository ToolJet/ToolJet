/**
 * MultiselectV2 — the six client-side actions, and the option search.
 *
 * Contract: `frontend/ee/test/app-builder/widgets/MultiselectV2/TESTING.md`
 * (scenarios MultiselectV2-CSA-* and MultiselectV2-SRCH-*).
 *
 * Two of these guarantees are about an event NOT firing (`CSA-006`) and one is
 * about it firing once per keystroke (`SRCH-005`), so the recorded handlers
 * increment a counter rather than writing a constant — a constant proves only
 * at-least-once and would pass a double fire.
 */
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { binding, drain, option } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { createMultiselectHarness } from './multiselectV2Harness';

const harness = createMultiselectHarness();

const countEvent = (eventId, key) => [
  {
    id: `evt-${eventId}`,
    index: 0,
    sourceId: 'ms1',
    name: `evt-${eventId}`,
    target: 'component',
    event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
  },
];
const count = (key) => useStore.getState().getVariable(key, 'canvas') ?? 0;

async function openMenu() {
  await harness.session.user.click(screen.getByRole('combobox'));
  await drain();
}

const rowLabels = () => screen.getAllByRole('option').map((r) => r.textContent);
const searchBox = () => screen.queryByPlaceholderText('Search');
const loader = () => document.querySelector('.tj-widget-loader');
const fieldWrapper = () => document.querySelector('.multiselect-widget');

async function typeSearch(term) {
  await harness.session.user.type(searchBox(), term);
  await drain();
}

/** The highlighted fragments inside one option row, ignoring the empty spans
 *  `highlightText` emits between characters when the term is empty. */
const highlighted = (rowElement) =>
  [...rowElement.querySelectorAll('span[style*="background-color"]')].map((s) => s.textContent).filter(Boolean);

function row(text) {
  const found = screen
    .getAllByRole('option')
    .find((candidate) => candidate.textContent === text || candidate.textContent.startsWith(text));
  if (!found) throw new Error(`no option row rendering "${text}" (rows: ${JSON.stringify(rowLabels())})`);
  return found;
}
const clickRow = async (text) => {
  await harness.session.user.click(row(text));
  await drain();
};

const setProperty = async (property, value) => {
  await harness.session.store.act(async () => {
    harness.setComponentProperty('ms1', property, value, 'properties');
  });
  await drain();
};

function remount() {
  cleanup();
  harness.teardown();
  harness.setup();
}

const EMPTY_SELECTION = { values: binding('{{[]}}') };

describe('MultiselectV2: client-side actions and option search', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('[MultiselectV2-CSA-001] `selectOptions` accepts raw values or objects carrying a value', async () => {
    // Break this catches: dropping the `isObject(val) && has(val, 'value')`
    // unwrap (MultiselectV2.jsx:322-325), or starting from `[]` instead of
    // `[...selected]` (:320) so each call replaced the selection.
    harness.render({ properties: { values: binding("{{['1']}}") }, validation: { mandatory: binding(true) } });
    await drain();

    await harness.act('selectOptions', ['2']);
    expect(harness.exposed().values).toEqual(['1', '2']);

    await harness.act('selectOptions', [{ value: '3' }]);
    expect(harness.exposed().values).toEqual(['1', '2', '3']);
    expect(harness.exposed().selectedOptions).toEqual([
      { label: 'option1', value: '1', caption: null },
      { label: 'option2', value: '2', caption: null },
      { label: 'option3', value: '3', caption: null },
    ]);
    expect(harness.exposed().isValid).toBe(true);
  });

  test('[MultiselectV2-CSA-002] `selectOptions` ignores unknown and already-selected values, and matches falsy values by type', async () => {
    // Break this catches: relaxing `option.value === val` (MultiselectV2.jsx:326)
    // to `==`, which would make the last case below select the `'0'` option
    // from a numeric 0 — and, separately, dropping the
    // `!selected.some(...)` guard, which would duplicate an entry.
    harness.render({
      properties: { ...EMPTY_SELECTION, options: { value: [option('zero', 0), option('one', '1')] } },
    });
    await drain();

    await harness.act('selectOptions', ['nope']);
    expect(harness.exposed().values).toEqual([]);

    await harness.act('selectOptions', [0]);
    expect(harness.exposed().values).toEqual([0]);

    await harness.act('selectOptions', [0]);
    expect(harness.exposed().values).toEqual([0]);

    // A numeric 0 against a string-'0' option is a silent no-op.
    remount();
    harness.render({
      properties: { ...EMPTY_SELECTION, options: { value: [option('string zero', '0')] } },
    });
    await drain();
    await harness.act('selectOptions', [0]);
    expect(harness.exposed().values).toEqual([]);
  });

  test('[MultiselectV2-CSA-003] `deselectOptions` removes exactly the named values', async () => {
    // Break this catches: inverting the `!_value.includes(option.value)` filter
    // (MultiselectV2.jsx:345-348), or having it clear the whole selection.
    harness.render({ properties: { values: binding("{{['1','2','3']}}") }, validation: { mandatory: binding(true) } });
    await drain();

    await harness.act('deselectOptions', ['2', 'not-selected']);
    expect(harness.exposed().values).toEqual(['1', '3']);

    await harness.act('deselectOptions', [{ value: '1' }]);
    expect(harness.exposed().values).toEqual(['3']);
    expect(harness.exposed().selectedOptions).toEqual([{ label: 'option3', value: '3', caption: null }]);
    expect(harness.exposed().isValid).toBe(true);
  });

  test('[MultiselectV2-CSA-004] `deselectOptions()` with no argument does nothing', async () => {
    // Break this catches: giving the no-arg call the documented
    // "deselect all currently selected options" behaviour
    // (MultiselectV2.jsx:343-350). That is the fix; today the published
    // signature and the runtime disagree, and this pins the runtime.
    harness.render({ properties: { values: binding("{{['1','2']}}") }, validation: { mandatory: binding(true) } });
    await drain();

    const before = { ...harness.exposed() };

    await harness.act('deselectOptions');

    expect(harness.exposed().values).toEqual(['1', '2']);
    expect(harness.exposed().selectedOptions).toHaveLength(2);
    expect(harness.exposed().isValid).toBe(before.isValid);
  });

  test('[MultiselectV2-CSA-005] `clear` empties the field and does not restore the configured default', async () => {
    // Break this catches: `clear` calling the default derivation instead of
    // `setInputValue([])` (MultiselectV2.jsx:293-295) — "clear" would then mean
    // "reset to the builder's default", and a mandatory field would stay valid.
    harness.render({ properties: { values: binding("{{['1','2']}}") }, validation: { mandatory: binding(true) } });
    await drain();
    // A click first, so the error row is allowed to render at all: it is gated
    // on the user having interacted (MultiselectV2.jsx:656).
    await openMenu();
    await clickRow('option3');

    await harness.act('clear');

    expect(harness.exposed().values).toEqual([]);
    expect(harness.exposed().selectedOptions).toEqual([]);
    expect(harness.exposed().isValid).toBe(false);
    expect(screen.getByText('Field cannot be empty')).toBeInTheDocument();
  });

  test('[MultiselectV2-CSA-006] No client-side action fires `onSelect`', async () => {
    // Break this catches: routing any action through `onChangeHandler`, which is
    // where the single `fireEvent('onSelect')` lives (MultiselectV2.jsx:213).
    // The actions call `setInputValue` directly and deliberately stay silent.
    harness.render({ properties: EMPTY_SELECTION, events: countEvent('onSelect', 'selectCount') });
    await drain();

    await harness.act('selectOptions', ['1', '2']);
    expect(harness.exposed().values).toEqual(['1', '2']);

    await harness.act('deselectOptions', ['1']);
    expect(harness.exposed().values).toEqual(['2']);

    await harness.act('clear');
    expect(harness.exposed().values).toEqual([]);

    expect(count('selectCount')).toBe(0);
  });

  test('[MultiselectV2-CSA-007] Two selection actions in one tick: the last one wins', async () => {
    // Break this catches: making the action read the live selection — e.g.
    // through a ref or a functional `setSelected` — instead of the `selected`
    // its effect closed over (MultiselectV2.jsx:317-341). That is the fix; today
    // the first call's result is silently discarded.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();

    await harness.session.store.act(async () => {
      const widget = harness.exposed();
      await Promise.all([widget.selectOptions(['1']), widget.selectOptions(['2'])]);
    });
    await drain();

    expect(harness.exposed().values).toEqual(['2']);
  });

  test('[MultiselectV2-CSA-008] The three setter actions move both the rendered state and the exposed variable', async () => {
    // Break this catches: dropping the `!!value` coercion, or updating only the
    // local state and not the exposed variable (MultiselectV2.jsx:296-307) —
    // the field would look right while every binding on it read the old value.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();

    await harness.act('setVisibility', 'yes');
    expect(harness.exposed().isVisible).toBe(true);
    await harness.act('setVisibility', 0);
    expect(harness.exposed().isVisible).toBe(false);
    expect(fieldWrapper()).toHaveClass('invisible');

    await harness.act('setLoading', 'spinning');
    expect(harness.exposed().isLoading).toBe(true);
    expect(loader()).not.toBeNull();

    await harness.act('setLoading', 0);
    await harness.act('setDisable', 'off-but-truthy');
    expect(harness.exposed().isDisabled).toBe(true);
    expect(screen.getByRole('combobox')).toBeDisabled();

    // A disabled field stops opening at all. `fireEvent`, not `user.click`:
    // react-select puts `pointer-events: none` on a disabled control, so
    // userEvent refuses the interaction before the widget's own guard
    // (MultiselectV2.jsx:373) is ever reached — and that guard is the thing
    // under test here.
    fireEvent.click(screen.getByRole('combobox'));
    await drain();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  test('[MultiselectV2-SRCH-001] Typing in the search box filters options by a case-insensitive label substring', async () => {
    // Break this catches: making `filterOption` compare with `startsWith`, or
    // dropping the `toLowerCase()` on either side (MultiselectV2.jsx:578-585).
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        options: { value: [option('Alpha', 'a'), option('BETA', 'b'), option('gamma-alpha', 'g')] },
      },
    });
    await drain();
    await openMenu();

    await typeSearch('AL');
    expect(rowLabels()).toEqual(['Alpha', 'gamma-alpha']);

    await harness.session.user.clear(searchBox());
    await drain();
    expect(rowLabels()).toEqual(['Alpha', 'BETA', 'gamma-alpha']);
  });

  test('[MultiselectV2-SRCH-002] A caption-only match keeps its option visible', async () => {
    // Break this catches: dropping the caption arm of `filterOption`
    // (MultiselectV2.jsx:583-584) — an option findable only by its caption
    // would vanish from the menu with no way to reach it.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        options: { value: [option('one', '1', { caption: 'findme' }), option('two', '2')] },
      },
    });
    await drain();
    await openMenu();

    await typeSearch('findme');
    expect(rowLabels()).toEqual(['onefindme']);
  });

  test('[MultiselectV2-SRCH-003] A term containing regex metacharacters filters and highlights literally', async () => {
    // Break this catches: dropping `escapeRegExp` from `highlightText`
    // (DropdownV2/utils.js:57-62) — `(` would throw an invalid-regex error
    // while the menu was open, taking the whole widget down.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        options: { value: [option('a(b', '1'), option('axb', '2'), option('a.b', '3')] },
      },
    });
    await drain();
    await openMenu();

    await typeSearch('(');
    expect(rowLabels()).toEqual(['a(b']);
    expect(highlighted(row('a(b'))).toEqual(['(']);

    await harness.session.user.clear(searchBox());
    await typeSearch('a.b');
    // Literal, so the regex-wildcard match 'axb' is NOT included.
    expect(rowLabels()).toEqual(['a.b']);
  });

  test('[MultiselectV2-SRCH-004] The matched part of a label is visibly highlighted', async () => {
    // Break this catches: `highlightText` returning the plain text
    // (DropdownV2/utils.js:64-70) — filtering would still work, so nothing else
    // in this file would notice the user lost the "why did this match" cue.
    harness.render({ properties: { ...EMPTY_SELECTION, options: { value: [option('option1', '1')] } } });
    await drain();
    await openMenu();

    await typeSearch('pti');

    expect(highlighted(row('option1'))).toEqual(['pti']);
    expect(row('option1')).toHaveTextContent('option1');
  });

  test('[MultiselectV2-SRCH-005] Typing publishes `searchText` and fires `onSearchTextChanged`', async () => {
    // Break this catches: firing `onSearchTextChanged` outside the
    // `action === 'input-change'` guard (MultiselectV2.jsx:354-360), which fires
    // it on menu open and close too — the count below would exceed 3.
    harness.render({ properties: EMPTY_SELECTION, events: countEvent('onSearchTextChanged', 'searchCount') });
    await drain();
    await openMenu();

    await typeSearch('abc');

    expect(harness.exposed().searchText).toBe('abc');
    expect(count('searchCount')).toBe(3);
  });

  test('[MultiselectV2-SRCH-006] Exposed `searchText` keeps the last term after the menu closes', async () => {
    // Break this catches: adding a `setExposedVariable('searchText', '')` beside
    // the `setSearchInputValue('')` calls on close (MultiselectV2.jsx:369,378).
    // That is the fix; today a bound query keeps running against an invisible
    // term, and this pins it.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();
    await openMenu();
    await typeSearch('opt');

    await harness.session.user.click(screen.getByRole('combobox'));
    await drain();
    expect(harness.exposed().searchText).toBe('opt');

    await openMenu();
    expect(searchBox()).toHaveValue('');
    expect(harness.exposed().searchText).toBe('opt');
  });

  test('[MultiselectV2-SRCH-007] The select-all row survives an active search term', async () => {
    // Break this catches: dropping the `Select all ${searchInputValue}` suffix
    // (MultiselectV2.jsx:135) that keeps the row past `filterOption`, or
    // dropping the `isSelectAll` text override in the row
    // (MultiselectV2/CustomOption.jsx:13,31) — the row would then read
    // "Select all zzz" back to the user.
    harness.render({ properties: { ...EMPTY_SELECTION, showAllOption: binding('{{true}}') } });
    await drain();
    await openMenu();

    await typeSearch('zzz');

    expect(rowLabels()).toEqual(['Select all']);
  });

  test('[MultiselectV2-SRCH-008] `showSearchInput: false` removes the search box and the event with it', async () => {
    // Break this catches: rendering the search box unconditionally
    // (DropdownV2/CustomMenuList.jsx:81), or making the control itself
    // searchable (`isSearchable={false}`, MultiselectV2.jsx:616) — either would
    // give the user a way to type, and `searchText` would stop being empty.
    harness.render({
      properties: { ...EMPTY_SELECTION, showSearchInput: binding('{{false}}') },
      events: countEvent('onSearchTextChanged', 'searchCount'),
    });
    await drain();
    await openMenu();

    expect(searchBox()).toBeNull();
    expect(rowLabels()).toEqual(['option1', 'option2', 'option3']);

    // The control is the only thing left to type into, and it is not searchable
    // — the keystrokes land nowhere. (`user.type` clicks first, which toggles
    // the menu shut; that the menu closed is EVT-002's guarantee, not this one.)
    await harness.session.user.type(screen.getByRole('combobox'), 'abc');
    await drain();

    expect(harness.exposed().searchText).toBe('');
    expect(count('searchCount')).toBe(0);
  });

  test('[MultiselectV2-SRCH-009] Server-side search only stops client filtering; the widget fetches nothing', async () => {
    // Break this catches: the `serverSideSearch === true` early return leaving
    // `filterOption` (MultiselectV2.jsx:579) — the widget would narrow the list
    // itself and hide rows the server deliberately returned.
    harness.render({
      properties: { ...EMPTY_SELECTION, serverSideSearch: binding('{{true}}') },
      events: countEvent('onSearchTextChanged', 'searchCount'),
    });
    await drain();
    await openMenu();

    await typeSearch('option1');

    expect(rowLabels()).toEqual(['option1', 'option2', 'option3']);
    expect(count('searchCount')).toBe(7);
    expect(loader()).toBeNull();
  });

  test('[MultiselectV2-SRCH-010] In server mode labels stop highlighting but captions still do', async () => {
    // Break this catches: extending the server-mode highlight suppression to
    // the caption line (MultiselectV2/CustomOption.jsx:17-18,32-34) — which is
    // the consistent fix — or dropping it from the label. Today the two lines
    // disagree, and this pins the split.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        serverSideSearch: binding('{{true}}'),
        options: { value: [option('match-label', 'm', { caption: 'match-caption' })] },
      },
    });
    await drain();
    await openMenu();

    await typeSearch('match');

    const target = row('match-label');
    expect(highlighted(target)).toEqual(['match']);
    expect(target.querySelector('[title="match-label"]')).toHaveTextContent('match-label');
    expect(highlighted(target.querySelector('.multiselectV2-option-caption'))).toEqual(['match']);
  });

  test('[MultiselectV2-SRCH-011] Server mode applies even when the search box is hidden', async () => {
    // Break this catches: gating `serverSideSearch` on `showSearchInput` in the
    // runtime to match the inspector's `conditionallyRender`
    // (multiselectV2.js:166-172) — a saved server-mode app would start
    // client-filtering the moment the box came back.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        serverSideSearch: binding('{{true}}'),
        showSearchInput: binding('{{false}}'),
      },
    });
    await drain();
    await openMenu();
    expect(searchBox()).toBeNull();

    await setProperty('showSearchInput', '{{true}}');
    await typeSearch('option1');

    expect(rowLabels()).toEqual(['option1', 'option2', 'option3']);
  });
});
