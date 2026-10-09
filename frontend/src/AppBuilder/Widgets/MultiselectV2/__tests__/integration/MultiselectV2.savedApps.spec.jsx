/**
 * MultiselectV2 — what a saved app does when a binding resolves to the wrong
 * type.
 *
 * Contract: `frontend/ee/test/app-builder/widgets/MultiselectV2/TESTING.md`
 * (scenarios MultiselectV2-SAVED-*).
 *
 * The mechanism these pin is easy to get wrong from reading the registered
 * config alone, and D-20 records the correction: a boolean property's schema is
 * wrapped in `coerce(boolean(), any(), v => v ? true : false)`
 * (`_utils/component-properties-validation.js:46-52`), so a boolean binding
 * CANNOT fail and is never substituted — truthy becomes `true`, falsy becomes
 * `false`, and no debugger entry is raised. The `validation.defaultValue: true`
 * sitting beside each of those schemas is dead config for every registered
 * widget, because the substitution path looks for `defaultValue` INSIDE the
 * schema (`_stores/slices/debuggerSlice.js:179`) and no config puts it there.
 *
 * So every test here asserts the resolved property the widget was handed AND
 * the debugger's silence: the silence is half the guarantee, and it is the half
 * a builder actually suffers.
 */
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, drain } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import useStore from '@/AppBuilder/_stores/store';
import { createMultiselectHarness } from './multiselectV2Harness';

const harness = createMultiselectHarness();
const state = () => useStore.getState();

/** The property value the resolver actually handed the widget. */
const resolved = (property) => state().getResolvedComponent('ms1').properties[property];
const resolvedStyle = (style) => state().getResolvedComponent('ms1').styles[style];
const debuggerLogs = () => state().debugger.logs;

const control = () => screen.getByRole('combobox');
const rowLabels = () => screen.queryAllByRole('option').map((r) => r.textContent);
const searchBox = () => screen.queryByPlaceholderText('Search');
const isMenuOpen = () => screen.queryAllByRole('option').length > 0 || searchBox() !== null;
const loader = () => document.querySelector('.tj-widget-loader');
const labelElement = () => document.querySelector('#ms1-label');
const fieldIcon = () => document.querySelector('.multiselect-widget svg.tabler-icon');
/** The platform's fallback for a widget that threw during render. */
const errorBoundary = () => document.querySelector('[data-cy="error-boundary-fallback"]');

async function clickControl() {
  fireEvent.click(control());
  await drain();
}

function remount() {
  cleanup();
  harness.teardown();
  harness.setup();
}

const EMPTY_SELECTION = { values: binding('{{[]}}') };

describe('MultiselectV2: broken bindings in a saved app', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('[MultiselectV2-SAVED-001] A broken `disabledState` binding is coerced by truthiness, not defaulted', async () => {
    // Break this catches: dropping the recursion-depth-0 `coerce` wrapper from
    // the boolean schema (_utils/component-properties-validation.js:46-52). The
    // binding would then FAIL its schema, and `findDefault({type:'boolean'})`
    // returns the offending value itself (debuggerSlice.js:225-226) — so a
    // string would reach the widget raw and a debugger entry would appear.
    harness.render({ properties: { ...EMPTY_SELECTION, disabledState: binding('{{"yes"}}') } });
    await drain();

    expect(resolved('disabledState')).toBe(true);
    expect(control()).toBeDisabled();
    expect(harness.exposed().isDisabled).toBe(true);
    expect(debuggerLogs()).toEqual([]);

    // Falsy is coerced too — to `false`, NOT to the registered `true`.
    remount();
    harness.render({ properties: { ...EMPTY_SELECTION, disabledState: binding('{{0}}') } });
    await drain();

    expect(resolved('disabledState')).toBe(false);
    expect(control()).not.toBeDisabled();
    await clickControl();
    expect(isMenuOpen()).toBe(true);
    expect(debuggerLogs()).toEqual([]);
  });

  test('[MultiselectV2-SAVED-002] A truthy non-boolean `loadingState` binding pins the field loading', async () => {
    // Break this catches: the same coercion wrapper, from the loading side —
    // and the two open guards (MultiselectV2.jsx:373,630), since a field that
    // is permanently loading but still openable is a different bug than a
    // field that is merely wrong.
    harness.render({ properties: { ...EMPTY_SELECTION, loadingState: binding('{{"nope"}}') } });
    await drain();

    expect(resolved('loadingState')).toBe(true);
    expect(loader()).not.toBeNull();
    await clickControl();
    expect(isMenuOpen()).toBe(false);
    fireEvent.keyDown(control(), { key: 'Enter' });
    await drain();
    expect(isMenuOpen()).toBe(false);
    expect(debuggerLogs()).toEqual([]);

    remount();
    harness.render({ properties: { ...EMPTY_SELECTION, loadingState: binding('{{0}}') } });
    await drain();

    expect(resolved('loadingState')).toBe(false);
    expect(loader()).toBeNull();
    expect(debuggerLogs()).toEqual([]);
  });

  test('[MultiselectV2-SAVED-003] Truthy non-boolean `showAllOption` and `optionsLoadingState` bindings turn both features on', async () => {
    // Break this catches: the coercion wrapper again, plus the two consumers of
    // `optionsLoadingState` — the select-all gate (MultiselectV2.jsx:133) and
    // the menu-body gate (DropdownV2/CustomMenuList.jsx:110). One broken
    // binding reaching both is what makes this worse than a cosmetic default.
    harness.render({ properties: { ...EMPTY_SELECTION, showAllOption: binding('{{"x"}}') } });
    await drain();
    await clickControl();

    expect(resolved('showAllOption')).toBe(true);
    expect(rowLabels()).toEqual(['Select all', 'option1', 'option2', 'option3']);
    expect(debuggerLogs()).toEqual([]);

    // The same coercion on `optionsLoadingState` suppresses that row, and with
    // dynamic options on it replaces the rows with a loader.
    remount();
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        advanced: binding('{{true}}'),
        showAllOption: binding('{{"x"}}'),
        optionsLoadingState: binding('{{"x"}}'),
      },
    });
    await drain();
    await clickControl();

    expect(resolved('optionsLoadingState')).toBe(true);
    expect(rowLabels()).toEqual([]);
    expect(loader()).not.toBeNull();
    expect(debuggerLogs()).toEqual([]);

    // Falsy leaves both features off — not on, as a registered `true` fallback
    // would have made them.
    remount();
    harness.render({
      properties: { ...EMPTY_SELECTION, showAllOption: binding('{{0}}'), optionsLoadingState: binding('{{0}}') },
    });
    await drain();
    await clickControl();

    expect(resolved('showAllOption')).toBe(false);
    expect(resolved('optionsLoadingState')).toBe(false);
    expect(rowLabels()).toEqual(['option1', 'option2', 'option3']);
    expect(loader()).toBeNull();
    expect(debuggerLogs()).toEqual([]);
  });

  test('[MultiselectV2-SAVED-004] A broken `label` binding shows a label no configuration produced', async () => {
    // Break this catches: the string schema's `coerce(string(), number(),
    // JSON.stringify)` (component-properties-validation.js:25-33) — a number
    // label would start failing and fall back to '' — or the fallback becoming
    // the registered `Label` if the substitution path ever learns to read
    // `validation.defaultValue`, which is the platform fix D-20 records.
    harness.render({ properties: { ...EMPTY_SELECTION, label: binding('{{42}}') } });
    await drain();

    expect(resolved('label')).toBe('42');
    expect(labelElement()).toHaveTextContent('42');
    expect(harness.exposed().label).toBe('42');
    expect(debuggerLogs()).toEqual([]);

    // A type the string schema cannot coerce falls back to the empty string —
    // which, being empty, also takes the label element away entirely.
    remount();
    harness.render({ properties: { ...EMPTY_SELECTION, label: binding('{{({a: 1})}}') } });
    await drain();

    expect(resolved('label')).toBe('');
    expect(labelElement()).toBeNull();
    expect(harness.exposed().label).toBe('');
    expect(debuggerLogs()).toHaveLength(1);
    expect(debuggerLogs()[0]).toMatchObject({
      key: 'multiselect1 - Label',
      error: { effectiveProperty: { label: '' } },
    });
  });

  test('[MultiselectV2-SAVED-005] A broken `values` or `options` binding empties the widget with no report', async () => {
    // Break this catches: dropping the `Array.isArray` guard in
    // `findDefaultItem` (MultiselectV2.jsx:171-174) — a non-array `values`
    // would go back to throwing `value.find is not a function` and the platform
    // error boundary would replace the whole field, which is why the
    // `errorBoundary()` assertions are here and not just the empty ones.
    harness.render({ properties: { values: binding('{{"nope"}}'), options: binding('{{"also-nope"}}') } });
    await drain();
    await clickControl();

    expect(errorBoundary()).toBeNull();
    expect(rowLabels()).toEqual([]);
    expect(harness.exposed().options).toEqual([]);
    expect(harness.exposed().values).toEqual([]);
    expect(debuggerLogs()).toEqual([]);

    // A non-array `values` over a REAL option list: the menu is intact, there
    // is simply no default selection.
    remount();
    harness.render({ properties: { values: binding('{{({a: 1})}}') } });
    await drain();
    await clickControl();

    expect(errorBoundary()).toBeNull();
    expect(rowLabels()).toEqual(['option1', 'option2', 'option3']);
    expect(harness.exposed().values).toEqual([]);
    expect(debuggerLogs()).toEqual([]);
  });

  test('[MultiselectV2-SAVED-006] A broken `iconVisibility` binding shows the icon on any truthy value', async () => {
    // Break this catches: adding a boolean `validation.schema` to
    // `iconVisibility` (multiselectV2.js:480 has none) — the value would then
    // be coerced to a real boolean, and the raw string this test hands the
    // widget would stop reaching it.
    harness.render({ properties: EMPTY_SELECTION, styles: { iconVisibility: binding('{{"shown"}}') } });
    await drain();
    await waitFor(() => expect(fieldIcon()).not.toBeNull());

    expect(resolvedStyle('iconVisibility')).toBe('shown');
    expect(debuggerLogs()).toEqual([]);

    remount();
    harness.render({ properties: EMPTY_SELECTION, styles: { iconVisibility: binding('{{0}}') } });
    await drain();

    expect(resolvedStyle('iconVisibility')).toBe(0);
    expect(fieldIcon()).toBeNull();
    expect(debuggerLogs()).toEqual([]);
  });
});
