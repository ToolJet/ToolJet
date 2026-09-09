/**
 * MultiselectV2 — selecting, clearing, and the `maxLimit` cap.
 *
 * Contract: `frontend/ee/test/app-builder/widgets/MultiselectV2/TESTING.md`
 * (scenarios MultiselectV2-SEL-* and MultiselectV2-LIM-*).
 *
 * `onSelect` is counted, never merely observed. The event fires once per change
 * (`MultiselectV2.jsx:213`) and several of the guarantees below are about
 * whether it fires at all on a path that changed nothing — a handler that
 * writes a constant would pass those on a double fire, so the recorded handler
 * increments a custom variable instead and the assertions read the count.
 */
import { cleanup, screen } from '@testing-library/react';
import { binding, drain, option } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { createMultiselectHarness } from './multiselectV2Harness';

const harness = createMultiselectHarness();

/** An `onSelect` handler that COUNTS fires rather than recording that one happened. */
const countOnSelect = () => [
  {
    id: 'evt-on-select',
    index: 0,
    sourceId: 'ms1',
    name: 'evt-on-select',
    target: 'component',
    event: {
      eventId: 'onSelect',
      actionId: 'set-custom-variable',
      key: 'selectCount',
      value: '{{(variables.selectCount ?? 0) + 1}}',
    },
  },
];
const selectCount = () => useStore.getState().getVariable('selectCount', 'canvas') ?? 0;

async function openMenu() {
  await harness.session.user.click(screen.getByRole('combobox'));
  await drain();
}

const rowLabels = () => screen.getAllByRole('option').map((r) => r.textContent);
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
const disabledRows = () =>
  screen
    .getAllByRole('option')
    .filter((r) => r.getAttribute('aria-disabled') === 'true')
    .map((r) => r.textContent);

const valueSummary = () => document.querySelector('#options');
const clearIndicator = () => document.querySelector('.clear-indicator');

function remount() {
  cleanup();
  harness.teardown();
  harness.setup();
}

const FOUR = { value: [option('a', '1'), option('b', '2'), option('c', '3'), option('d', '4')] };
const EMPTY_SELECTION = { values: binding('{{[]}}') };

describe('MultiselectV2: selection, clearing, and the selection limit', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('[MultiselectV2-SEL-001] Clicking an option adds it, republishes the selection, and fires `onSelect`', async () => {
    // Break this catches: splitting `setInputValue`'s one `setExposedVariables`
    // call (MultiselectV2.jsx:391-402) into separate writes, or firing
    // `onSelect` more than once per change.
    harness.render({ properties: EMPTY_SELECTION, events: countOnSelect(), validation: { mandatory: binding(true) } });
    await drain();
    expect(harness.exposed().isValid).toBe(false);

    await openMenu();
    await clickRow('option2');

    expect(harness.exposed().values).toEqual(['2']);
    expect(harness.exposed().selectedOptions).toEqual([{ label: 'option2', value: '2', caption: null }]);
    expect(harness.exposed().isValid).toBe(true);
    expect(selectCount()).toBe(1);
  });

  test('[MultiselectV2-SEL-002] Deselecting also fires `onSelect`', async () => {
    // Break this catches: moving the `fireEvent('onSelect')` call inside the
    // add branch of `onChangeHandler` (MultiselectV2.jsx:191-215), which would
    // leave removals silent — the count below would read 1, not 2.
    harness.render({ properties: EMPTY_SELECTION, events: countOnSelect() });
    await drain();
    await openMenu();

    await clickRow('option2');
    expect(harness.exposed().values).toEqual(['2']);

    await clickRow('option2');
    expect(harness.exposed().values).toEqual([]);
    expect(selectCount()).toBe(2);
  });

  test('[MultiselectV2-SEL-003] The menu stays open across selections', async () => {
    // Break this catches: dropping `closeMenuOnSelect={false}`
    // (MultiselectV2.jsx:614) or letting a selection clear `isMultiselectOpen`.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();
    await openMenu();

    await clickRow('option1');
    await clickRow('option3');

    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(row('option1')).toHaveAttribute('aria-selected', 'true');
    expect(row('option3')).toHaveAttribute('aria-selected', 'true');
    expect(row('option2')).toHaveAttribute('aria-selected', 'false');
  });

  test('[MultiselectV2-SEL-004] Select-all applies every visible option, disabled ones included', async () => {
    // Break this catches: select-all applying `modifiedSelectOptions` (which
    // carries the synthetic row) or filtering out disabled options instead of
    // applying the whole derived list (MultiselectV2.jsx:195-198).
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        showAllOption: binding('{{true}}'),
        options: { value: [option('open', 'o'), option('blocked', 'b', { disable: true })] },
      },
    });
    await drain();
    await openMenu();
    await clickRow('Select all');

    expect(harness.exposed().values).toEqual(['o', 'b']);
    expect(harness.exposed().values).not.toContain('multiselect-custom-menulist-select-all');
  });

  test('[MultiselectV2-SEL-005] Clicking select-all again empties the selection', async () => {
    // Break this catches: routing the deselect branch through `applyLimit`
    // instead of `setInputValue([])` (MultiselectV2.jsx:195-200) — with a limit
    // configured, a truncating clear would leave options behind.
    harness.render({
      properties: { ...EMPTY_SELECTION, showAllOption: binding('{{true}}'), maxLimit: binding('{{3}}') },
    });
    await drain();
    await openMenu();

    await clickRow('Select all');
    expect(harness.exposed().values).toEqual(['1', '2', '3']);

    await clickRow('Select all');
    expect(harness.exposed().values).toEqual([]);
    expect(valueSummary()).toBeNull();
  });

  test('[MultiselectV2-SEL-006] A full selection publishes exactly the option values', async () => {
    // Break this catches: the case-3 branch (MultiselectV2.jsx:205-206) — which
    // fires when the click count reaches the option count — publishing `items`
    // (with the synthetic row) instead of the derived option list.
    harness.render({ properties: { ...EMPTY_SELECTION, showAllOption: binding('{{true}}') } });
    await drain();
    await openMenu();

    await clickRow('option1');
    await clickRow('option2');
    await clickRow('option3');

    expect(harness.exposed().values).toEqual(['1', '2', '3']);
    expect(harness.exposed().selectedOptions).toEqual([
      { label: 'option1', value: '1', caption: null },
      { label: 'option2', value: '2', caption: null },
      { label: 'option3', value: '3', caption: null },
    ]);
  });

  test('[MultiselectV2-SEL-007] A partial selection renders its labels joined by comma and space', async () => {
    // Break this catches: changing the summary join separator
    // (CustomValueContainer.jsx:71) — the field is the only place a user reads
    // their selection back, and `', '` is what makes a multi-pick legible.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();
    await openMenu();
    await clickRow('option3');
    await clickRow('option1');

    expect(valueSummary()).toHaveTextContent('option3, option1');
  });

  test('[MultiselectV2-SEL-008] A full selection with `showAllSelectedLabel` on renders exactly `All items are selected.`', async () => {
    // Break this catches: changing the literal, dropping its trailing period,
    // or gating it on something other than `value.length === options.length`
    // (CustomValueContainer.jsx:16,68-70).
    harness.render({ properties: EMPTY_SELECTION });
    await drain();
    await openMenu();
    await clickRow('option1');
    await clickRow('option2');
    await clickRow('option3');
    expect(valueSummary()).toHaveTextContent('All items are selected.');

    // Same again with the synthetic row present: it is counted on both sides of
    // the comparison, so the label still appears.
    remount();
    harness.render({ properties: { ...EMPTY_SELECTION, showAllOption: binding('{{true}}') } });
    await drain();
    await openMenu();
    await clickRow('Select all');
    expect(valueSummary()).toHaveTextContent('All items are selected.');
  });

  test('[MultiselectV2-SEL-009] A full selection with `showAllSelectedLabel` off still lists the labels', async () => {
    // Break this catches: dropping the select-all filter from the label list
    // (CustomValueContainer.jsx:12-15), which would render the synthetic row's
    // `Select all ` text as if it were one of the user's options.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        showAllOption: binding('{{true}}'),
        showAllSelectedLabel: binding('{{false}}'),
      },
    });
    await drain();
    await openMenu();
    await clickRow('Select all');

    expect(valueSummary()).toHaveTextContent('option1, option2, option3');
    expect(valueSummary().textContent).not.toContain('Select all');
  });

  test('[MultiselectV2-SEL-010] The clear indicator empties the selection and fires `onSelect`', async () => {
    // Break this catches: the clear path bypassing `onChangeHandler` — the
    // recomputed `isValid` and the `onSelect` fire both come from there
    // (MultiselectV2.jsx:191-215,391-402), so a bespoke clear would leave a
    // mandatory field reporting valid.
    harness.render({
      properties: EMPTY_SELECTION,
      validation: { mandatory: binding(true) },
      events: countOnSelect(),
    });
    await drain();
    await openMenu();
    await clickRow('option1');
    expect(harness.exposed().isValid).toBe(true);

    await harness.session.user.click(clearIndicator());
    await drain();

    expect(harness.exposed().values).toEqual([]);
    expect(harness.exposed().selectedOptions).toEqual([]);
    expect(harness.exposed().isValid).toBe(false);
    expect(selectCount()).toBe(2);
  });

  test('[MultiselectV2-SEL-011] No clear indicator with `showClearBtn` off, or with nothing selected', async () => {
    // Break this catches: rendering `CustomClearIndicator` unconditionally
    // (MultiselectV2.jsx:612) — the control would then offer to clear a field
    // the builder asked to make unclearable.
    harness.render({ properties: { values: binding("{{['1','2']}}"), showClearBtn: binding('{{false}}') } });
    await drain();
    expect(clearIndicator()).toBeNull();

    remount();
    harness.render({ properties: { values: binding("{{['1','2']}}") } });
    await drain();
    expect(clearIndicator()).not.toBeNull();

    remount();
    harness.render({ properties: EMPTY_SELECTION });
    await drain();
    expect(clearIndicator()).toBeNull();
  });

  test('[MultiselectV2-SEL-012] A disabled option cannot be selected by clicking it', async () => {
    // Break this catches: dropping the `isDisabled` mapping
    // (MultiselectV2.jsx:119) so react-select attaches its click handler to the
    // row — the selection would change AND `onSelect` would fire.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        options: { value: [option('open', 'o'), option('blocked', 'b', { disable: true })] },
      },
      events: countOnSelect(),
    });
    await drain();
    await openMenu();

    await clickRow('blocked');

    expect(harness.exposed().values).toEqual([]);
    expect(selectCount()).toBe(0);
  });

  test('[MultiselectV2-SEL-013] A user option labelled "Select all" loses its own label and caption', async () => {
    // Break this catches: narrowing `labelText.includes('Select all')` to an
    // identity check on the synthetic row's value
    // (MultiselectV2/CustomOption.jsx:13,31-35) — which is the fix, and would
    // make the row render its real label and caption. This pins today's bug.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        showAllOption: binding('{{true}}'),
        options: { value: [option('Select all regions', 'r', { caption: 'every region' })] },
      },
    });
    await drain();
    await openMenu();

    // Both the synthetic row and the user's option render as the bare text.
    expect(rowLabels()).toEqual(['Select all', 'Select all']);
    expect(screen.queryByTitle('every region')).not.toBeInTheDocument();

    // The row still behaves as the real option it is.
    await harness.session.user.click(screen.getAllByRole('option')[1]);
    await drain();
    expect(harness.exposed().values).toEqual(['r']);
  });

  test('[MultiselectV2-LIM-001] At the limit the unselected options are disabled and the selected ones stay removable', async () => {
    // Break this catches: dropping the `|| (isLimitReached && !alreadySelected)`
    // term (MultiselectV2.jsx:143-147), which would let the user exceed the cap,
    // or making it unconditional, which would trap the selection.
    harness.render({ properties: { ...EMPTY_SELECTION, options: FOUR, maxLimit: binding('{{2}}') } });
    await drain();
    await openMenu();

    await clickRow('a');
    await clickRow('b');

    expect(disabledRows()).toEqual(['c', 'd']);
    await clickRow('a');
    expect(harness.exposed().values).toEqual(['2']);
    expect(disabledRows()).toEqual([]);

    // Server-side search does not filter, so the whole list stays visible —
    // and at the limit, disabled.
    remount();
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        options: FOUR,
        maxLimit: binding('{{2}}'),
        serverSideSearch: binding('{{true}}'),
      },
    });
    await drain();
    await openMenu();
    await clickRow('a');
    await clickRow('b');
    await harness.session.user.type(screen.getByPlaceholderText('Search'), 'zzz');
    await drain();

    expect(rowLabels()).toEqual(['a', 'b', 'c', 'd']);
    expect(disabledRows()).toEqual(['c', 'd']);
  });

  test('[MultiselectV2-LIM-002] With the limit below the option count select-all is disabled outright', async () => {
    // Break this catches: flipping `maxSelectionLimit < selectOptions.length`
    // (MultiselectV2.jsx:141) so select-all applies a truncated list instead of
    // refusing — and, separately, moving `fireEvent('onSelect')` behind a
    // "something actually changed" check, which is the fix for the second half.
    harness.render({
      properties: { ...EMPTY_SELECTION, options: FOUR, maxLimit: binding('{{2}}'), showAllOption: binding('{{true}}') },
      events: countOnSelect(),
    });
    await drain();
    await openMenu();

    expect(row('Select all')).toHaveAttribute('aria-disabled', 'true');

    await clickRow('a');
    await clickRow('b');
    // A truncated write still reports itself to the app as an ordinary change.
    await harness.act('selectOptions', ['3', '4']);
    expect(harness.exposed().values).toEqual(['1', '2']);
    expect(selectCount()).toBe(2);
  });

  test('[MultiselectV2-LIM-003] With the limit equal to the option count select-all selects everything', async () => {
    // Break this catches: turning the boundary comparison into `<=`
    // (MultiselectV2.jsx:141), which would disable select-all at exactly the
    // limit that can satisfy it.
    harness.render({
      properties: { ...EMPTY_SELECTION, maxLimit: binding('{{3}}'), showAllOption: binding('{{true}}') },
    });
    await drain();
    await openMenu();

    expect(row('Select all')).toHaveAttribute('aria-disabled', 'false');
    await clickRow('Select all');
    expect(harness.exposed().values).toEqual(['1', '2', '3']);
  });

  test('[MultiselectV2-LIM-004] An empty, null, or non-numeric `maxLimit` imposes no limit', async () => {
    // Break this catches: dropping the `Number.isNaN` guard from `hasMaxLimit`
    // (MultiselectV2.jsx:126) — 'abc' would then produce a limit of NaN, whose
    // comparisons are all false, and the third case below would behave as an
    // unlimited field by accident rather than by rule. Or dropping `''`/null
    // from the guard, which caps a field the builder never capped.
    for (const limit of ['', '{{null}}', 'abc']) {
      harness.render({ properties: { ...EMPTY_SELECTION, options: FOUR, maxLimit: binding(limit) } });
      await drain();
      await openMenu();
      await clickRow('a');
      await clickRow('b');
      await clickRow('c');
      expect(harness.exposed().values).toEqual(['1', '2', '3']);
      expect(disabledRows()).toEqual([]);
      remount();
    }

    // A numeric string is a number.
    harness.render({ properties: { ...EMPTY_SELECTION, options: FOUR, maxLimit: binding('2') } });
    await drain();
    await openMenu();
    await clickRow('a');
    await clickRow('b');
    expect(disabledRows()).toEqual(['c', 'd']);
  });

  test('[MultiselectV2-LIM-005] `maxLimit: 0` ships an unusable field', async () => {
    // Break this catches: treating a zero limit as "no limit" — either by
    // widening `hasMaxLimit` (MultiselectV2.jsx:126) to reject 0, or by making
    // `isLimitReached` use `>` instead of `>=` (:128). Both are plausible
    // fixes; today the field is simply dead, and this pins that.
    harness.render({
      properties: { ...EMPTY_SELECTION, maxLimit: binding('{{0}}'), showAllOption: binding('{{true}}') },
      events: countOnSelect(),
    });
    await drain();
    await openMenu();

    expect(disabledRows()).toEqual(['Select all', 'option1', 'option2', 'option3']);
    await clickRow('option1');
    expect(harness.exposed().values).toEqual([]);
    expect(selectCount()).toBe(0);
  });

  test('[MultiselectV2-LIM-006] A negative `maxLimit` behaves as zero, not as "no limit"', async () => {
    // Break this catches: dropping the `Math.max(0, ...)` clamp
    // (MultiselectV2.jsx:127). A raw -1 makes `selected.length >= -1` true and
    // `slice(0, -1)` drop the last entry, so the failure mode would change
    // shape rather than disappear — hence asserting the clamp's own result.
    harness.render({
      properties: { ...EMPTY_SELECTION, maxLimit: binding('{{-1}}'), showAllOption: binding('{{true}}') },
    });
    await drain();
    await openMenu();

    expect(disabledRows()).toEqual(['Select all', 'option1', 'option2', 'option3']);
    await clickRow('option2');
    expect(harness.exposed().values).toEqual([]);
  });

  test('[MultiselectV2-LIM-007] A fractional `maxLimit` is floored', async () => {
    // Break this catches: swapping `Math.floor` for `Math.round`
    // (MultiselectV2.jsx:127) — 2.9 would then cap at three, which is what the
    // builder typed but not what ships today.
    harness.render({ properties: { ...EMPTY_SELECTION, options: FOUR, maxLimit: binding('{{2.9}}') } });
    await drain();
    await openMenu();

    await clickRow('a');
    await clickRow('b');
    expect(disabledRows()).toEqual(['c', 'd']);
    expect(harness.exposed().values).toEqual(['1', '2']);
  });

  test('[MultiselectV2-LIM-008] A default `values` list longer than the limit loads over the cap', async () => {
    // Break this catches: applying `applyLimit` in the load-time derivation
    // effects (MultiselectV2.jsx:217-237) as well as on change. That is the
    // fix; today a saved app opens above its own cap, and this pins it.
    harness.render({ properties: { values: binding("{{['1','2']}}"), maxLimit: binding('{{1}}') } });
    await drain();

    expect(harness.exposed().values).toEqual(['1', '2']);
    await openMenu();
    expect(disabledRows()).toEqual(['option3']);
  });

  test('[MultiselectV2-LIM-009] A `selectOptions` payload over the limit is truncated silently', async () => {
    // Break this catches: dropping the `slice(0, maxSelectionLimit)` from the
    // action path (MultiselectV2.jsx:337) — the cap would stop applying to
    // programmatic writes — or making the action report the overflow, which
    // would be the fix.
    harness.render({ properties: { ...EMPTY_SELECTION, maxLimit: binding('{{2}}') }, events: countOnSelect() });
    await drain();

    await harness.act('selectOptions', ['1', '2', '3']);

    expect(harness.exposed().values).toEqual(['1', '2']);
    expect(selectCount()).toBe(0);
  });
});
