/**
 * MultiselectV2 — option sourcing, defaults, and the exposed option list.
 *
 * Contract: `frontend/ee/test/app-builder/widgets/MultiselectV2/TESTING.md`
 * (scenarios MultiselectV2-DEF-* and MultiselectV2-OPT-*). Every title starts
 * with its approved scenario ID; the guarantee each one pins is the contract's,
 * not this file's, and where the runtime diverges from its own documentation or
 * schema default these are characterization tests of unmodified `lts-3.16` —
 * per the blanket decision in that contract's `## Decisions`.
 */
import { cleanup, screen, waitFor } from '@testing-library/react';
import { binding, drain, option } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { createMultiselectHarness, schemaOption } from './multiselectV2Harness';

const harness = createMultiselectHarness();

/** The widget owns its own menu state and opens on a click anywhere on the control. */
async function openMenu() {
  await harness.session.user.click(screen.getByRole('combobox'));
  await drain();
}

/** Menu rows in render order. `textContent` because the label is split into
 *  highlight spans (`DropdownV2/utils.js:56-70`) even with an empty search. */
const rowLabels = () => screen.getAllByRole('option').map((row) => row.textContent);

/**
 * Menu rows carry no accessible name of their own — react-select puts the label
 * inside a checkbox row, and `highlightText` splits it into per-character spans
 * — so rows are addressed by their rendered text, which is what a user reads.
 */
function row(text) {
  const found = screen
    .getAllByRole('option')
    .find((candidate) => candidate.textContent === text || candidate.textContent.startsWith(text));
  if (!found) throw new Error(`no option row rendering "${text}" (rows: ${JSON.stringify(rowLabels())})`);
  return found;
}

/** The selected-labels summary the field shows in place of the placeholder
 *  (`MultiselectV2/CustomValueContainer.jsx:66-71`). */
const valueSummary = () => document.querySelector('#options');

const clickRow = async (text) => {
  await harness.session.user.click(row(text));
  await drain();
};

/** `setComponentProperty` takes the UNRESOLVED value and the attr separately,
 *  so a `{{ }}` expression or a raw array goes in bare — not `{ value }`-wrapped. */
const setProperty = async (property, value) => {
  await harness.session.store.act(async () => {
    harness.setComponentProperty('ms1', property, value, 'properties');
  });
  await drain();
};

/** Unmounts the current tree so the next `render()` is a real fresh mount,
 *  which several scenarios need: mount-only effects publish the initial
 *  exposed-variable set, and a rerender would skip them. */
function remount() {
  cleanup();
  harness.teardown();
  harness.setup();
}

describe('MultiselectV2: options, defaults, and the exposed option list', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('[MultiselectV2-DEF-001] Basic-mode default selection comes from `values` by strict equality', async () => {
    // Break this catches: relaxing `val === item.value` (MultiselectV2.jsx:171-174)
    // to `==` or to a String() comparison, which would make the second half of
    // this test pre-select every option instead of none.
    harness.render({ properties: { values: binding("{{['1','3']}}") } });
    await drain();

    expect(harness.exposed().values).toEqual(['1', '3']);
    expect(harness.exposed().selectedOptions).toEqual([
      { label: 'option1', value: '1', caption: null },
      { label: 'option3', value: '3', caption: null },
    ]);
    expect(screen.getByText('option1, option3')).toBeInTheDocument();

    // Same option list, numeric defaults: nothing matches, nothing is selected,
    // and no error surfaces anywhere — the builder just sees an empty field.
    remount();
    harness.render({ properties: { values: binding('{{[1, 3]}}') } });
    await drain();

    expect(harness.exposed().values).toEqual([]);
    expect(screen.getByText('Select the options')).toBeInTheDocument();
  });

  test('[MultiselectV2-DEF-002] Advanced mode takes its options and its defaults from `schema` alone', async () => {
    // Break this catches: making the option source fall back to `options` when
    // `schema` is set (MultiselectV2.jsx:110), or dropping the `visible &&
    // default` conjunction at :168 so a hidden default is selected.
    harness.render({
      properties: {
        advanced: binding('{{true}}'),
        values: binding("{{['1','2']}}"),
        options: { value: [option('static-only', 'static')] },
        schema: binding(
          `{{${JSON.stringify([
            schemaOption('alpha', 'a', { isDefault: true }),
            schemaOption('beta', 'b'),
            schemaOption('hidden-default', 'h', { visible: false, isDefault: true }),
          ])}}}`
        ),
      },
    });
    await drain();
    await openMenu();

    expect(rowLabels()).toEqual(['alpha', 'beta']);
    expect(harness.exposed().values).toEqual(['a']);
  });

  test('[MultiselectV2-DEF-003] An empty selection shows the configured placeholder and no value summary', async () => {
    // Break this catches: rendering the placeholder unconditionally instead of
    // only while the value is empty (CustomValueContainer.jsx:62-72).
    harness.render({ properties: { values: binding('{{[]}}'), placeholder: binding('Pick some') } });
    await drain();

    expect(screen.getByText('Pick some')).toBeInTheDocument();
    expect(screen.queryByText('option1')).not.toBeInTheDocument();

    await openMenu();
    await clickRow('option1');

    expect(screen.queryByText('Pick some')).not.toBeInTheDocument();
    expect(valueSummary()).toHaveTextContent('option1');
  });

  test('[MultiselectV2-DEF-004] The label element exists only when a non-empty label has a width or `auto`', async () => {
    // Break this catches: dropping the `(width > 0 || auto)` half of the render
    // gate (_ui/Label.jsx:31), which would render a label element — and the
    // `aria-labelledby` target with it — in the second configuration below.
    harness.render({ properties: { label: binding('Pick one') } });
    await drain();
    expect(document.querySelector('#ms1-label')).toHaveTextContent('Pick one');

    remount();
    harness.render({ styles: { auto: binding('{{false}}'), labelWidth: binding('0') } });
    await drain();
    expect(document.querySelector('#ms1-label')).toBeNull();

    remount();
    harness.render({ properties: { label: binding('') } });
    await drain();
    expect(document.querySelector('#ms1-label')).toBeNull();
  });

  test("[MultiselectV2-DEF-005] Only `searchText` is readable before the widget's own effects run", async () => {
    // Break this catches: adding `values`/`options` to the registered
    // `exposedVariables` map (multiselectV2.js:409-411) — which would be a fix,
    // and would make the pre-mount reads below defined. Until then a binding on
    // page load sees `undefined`, and this pins that.
    let preMount;
    harness.render({
      afterSeed: () => {
        preMount = harness.exposed();
      },
    });

    expect(preMount.searchText).toBe('');
    expect(preMount.values).toBeUndefined();
    expect(preMount.selectedOptions).toBeUndefined();
    expect(preMount.isValid).toBeUndefined();

    await drain();
    expect(harness.exposed().values).toEqual(['1', '2']);
  });

  test("[MultiselectV2-DEF-006] Flipping `advanced` re-derives the selection and discards the user's picks", async () => {
    // Break this catches: keeping the still-valid part of the user's selection
    // across the flip instead of overwriting it with the newly active source's
    // default (MultiselectV2.jsx:223-229,231-237).
    harness.render({ properties: { values: binding("{{['1']}}") } });
    await drain();
    await openMenu();
    await clickRow('option3');

    expect(harness.exposed().values).toEqual(['1', '3']);

    await setProperty('advanced', '{{true}}');

    // The definition's own schema defaults to `option1` (numeric value 1), so
    // the user's option3 pick is gone and the selection is the schema's.
    expect(harness.exposed().values).toEqual([1]);
  });

  test('[MultiselectV2-OPT-001] Option entries map to label, value, caption and disabled, and `visible: false` drops them', async () => {
    // Break this catches: dropping the `.filter((data) => data?.visible ?? true)`
    // pass, or the `isDisabled: data?.disable` mapping (MultiselectV2.jsx:109-124).
    harness.render({
      properties: {
        values: binding('{{[]}}'),
        options: {
          value: [
            option('plain', 'p'),
            option('captioned', 'c', { caption: 'a second line' }),
            option('blocked', 'b', { disable: true }),
            option('gone', 'g', { visible: false }),
          ],
        },
      },
    });
    await drain();
    await openMenu();

    expect(rowLabels()).toEqual(['plain', 'captioneda second line', 'blocked']);
    expect(row('blocked')).toHaveAttribute('aria-disabled', 'true');
    expect(row('plain')).toHaveAttribute('aria-disabled', 'false');
    expect(harness.exposed().options).toEqual([
      { label: 'plain', value: 'p', caption: null },
      { label: 'captioned', value: 'c', caption: 'a second line' },
      { label: 'blocked', value: 'b', caption: null },
    ]);
  });

  test('[MultiselectV2-OPT-002] Exposed `options` follows the option list and never carries the select-all row', async () => {
    // Break this catches: moving the exposed-`options` republish off the derived
    // option list onto `modifiedSelectOptions` (MultiselectV2.jsx:239-247 vs
    // :130-140), which would leak the synthetic select-all row into every
    // binding that reads the list.
    harness.render({ properties: { values: binding('{{[]}}'), showAllOption: binding('{{true}}') } });
    await drain();
    await openMenu();
    await clickRow('Select all');

    expect(harness.exposed().values).toEqual(['1', '2', '3']);
    expect(harness.exposed().options).toEqual([
      { label: 'option1', value: '1', caption: null },
      { label: 'option2', value: '2', caption: null },
      { label: 'option3', value: '3', caption: null },
    ]);

    await setProperty('options', [option('only', 'o')]);

    expect(harness.exposed().options).toEqual([{ label: 'only', value: 'o', caption: null }]);
  });

  test('[MultiselectV2-OPT-003] `sort` orders by label and leaves select-all first', async () => {
    // Break this catches: prepending the select-all row before `sortArray`
    // instead of after (MultiselectV2.jsx:122,133-140) — 'Select all' would
    // then sort into the middle of the list under 'asc'.
    const options = { value: [option('cherry', 'c'), option('apple', 'a'), option('banana', 'b')] };

    harness.render({ properties: { values: binding('{{[]}}'), showAllOption: binding('{{true}}'), options } });
    await drain();
    await openMenu();
    expect(rowLabels()).toEqual(['Select all', 'cherry', 'apple', 'banana']);

    remount();
    harness.render({
      properties: { values: binding('{{[]}}'), showAllOption: binding('{{true}}'), options, sort: binding('asc') },
    });
    await drain();
    await openMenu();
    expect(rowLabels()).toEqual(['Select all', 'apple', 'banana', 'cherry']);
    expect(harness.exposed().options.map(({ label }) => label)).toEqual(['apple', 'banana', 'cherry']);

    remount();
    harness.render({
      properties: { values: binding('{{[]}}'), showAllOption: binding('{{true}}'), options, sort: binding('desc') },
    });
    await drain();
    await openMenu();
    expect(rowLabels()).toEqual(['Select all', 'cherry', 'banana', 'apple']);
  });

  test('[MultiselectV2-OPT-004] Boolean and nullish option labels render without crashing and are published raw', async () => {
    // Break this catches: reverting the `getSafeRenderableValue` coercion
    // (Widgets/utils.js:50-59, commits 6594e76b1f5 / b2f809724c9) — a nullish
    // label crashed the widget before it, and stringifying eagerly instead
    // would publish '0' and 'true' where a binding expects 0 and true.
    harness.render({
      properties: {
        values: binding('{{[]}}'),
        sort: binding('asc'),
        options: { value: [option(true, 't'), option(0, 'z'), option(null, 'n'), option('zeta', 's')] },
      },
    });
    await drain();
    await openMenu();

    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(harness.exposed().options).toEqual(
      expect.arrayContaining([
        { label: true, value: 't', caption: null },
        { label: 0, value: 'z', caption: null },
        { label: '', value: 'n', caption: null },
        { label: 'zeta', value: 's', caption: null },
      ])
    );
    // Non-string labels share the empty sort key (DropdownV2/utils.js:77-78),
    // so only the one string label's position is specified: it sorts last.
    expect(harness.exposed().options.at(-1)).toEqual({ label: 'zeta', value: 's', caption: null });
  });

  test('[MultiselectV2-OPT-005] An option `caption` renders under its label and is published', async () => {
    // Break this catches: dropping the `caption: caption ?? null` normalisation
    // (MultiselectV2.jsx:241-247,306-311) so an uncaptioned option publishes no
    // `caption` key at all, or removing the second-line render
    // (MultiselectV2/CustomOption.jsx:31-35).
    harness.render({
      properties: {
        values: binding('{{[]}}'),
        options: { value: [option('with', 'w', { caption: 'the caption' }), option('without', 'x')] },
      },
    });
    await drain();
    await openMenu();

    expect(screen.getByTitle('the caption')).toBeInTheDocument();
    await clickRow('with');
    await clickRow('without');

    expect(harness.exposed().options).toEqual([
      { label: 'with', value: 'w', caption: 'the caption' },
      { label: 'without', value: 'x', caption: null },
    ]);
    expect(harness.exposed().selectedOptions).toEqual([
      { label: 'with', value: 'w', caption: 'the caption' },
      { label: 'without', value: 'x', caption: null },
    ]);
  });

  test('[MultiselectV2-OPT-006] An empty option list keeps the placeholder only while select-all is off', async () => {
    // Break this catches: the `selectOptions.length === selected.length` value
    // swap (MultiselectV2.jsx:575) losing its guard — with no options both
    // lengths are 0, so the synthetic select-all row becomes the whole value and
    // an empty widget reports itself filled. A fix here flips the second half.
    harness.render({ properties: { values: binding('{{[]}}'), options: { value: [] } } });
    await drain();

    expect(screen.getByText('Select the options')).toBeInTheDocument();
    expect(document.querySelector('.clear-indicator')).toBeNull();
    expect(harness.exposed().values).toEqual([]);

    remount();
    harness.render({
      properties: { values: binding('{{[]}}'), options: { value: [] }, showAllOption: binding('{{true}}') },
    });
    await drain();

    expect(screen.queryByText('Select the options')).not.toBeInTheDocument();
    expect(screen.getByText('All items are selected.')).toBeInTheDocument();
    expect(document.querySelector('.clear-indicator')).not.toBeNull();
    expect(harness.exposed().values).toEqual([]);
  });

  test('[MultiselectV2-OPT-007] Changing `sort` or the option list preserves the still-valid selection', async () => {
    // Break this catches: the option-list effect (MultiselectV2.jsx:217-221)
    // being changed to pass `isDefault: true`, as the two `advanced` effects do
    // (:223-237). It would then re-derive from the configured `values` and
    // discard the user's picks on every refresh of a query-driven option list —
    // which is what D-05 originally believed it already did.
    harness.render({ properties: { values: binding("{{['1']}}") } });
    await drain();
    await openMenu();
    await clickRow('option3');
    expect(harness.exposed().values).toEqual(['1', '3']);

    // Sort: both picks survive, reordered to match the new option order.
    await setProperty('sort', 'desc');
    expect(rowLabels()).toEqual(['option3', 'option2', 'option1']);
    expect(harness.exposed().values).toEqual(['3', '1']);

    // A rebind that still carries option3 keeps it and drops option1 with it.
    await setProperty('options', [option('option3', '3'), option('option4', '4')]);
    await waitFor(() => expect(harness.exposed().values).toEqual(['3']));

    // A rebind that drops the selected option empties the selection.
    await setProperty('options', [option('option4', '4'), option('option5', '5')]);
    await waitFor(() => expect(harness.exposed().values).toEqual([]));
  });
});
