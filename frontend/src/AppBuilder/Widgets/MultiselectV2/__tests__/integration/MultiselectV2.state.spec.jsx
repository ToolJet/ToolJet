/**
 * MultiselectV2 — loading/disabled/visibility precedence, the options loader,
 * and validation.
 *
 * Contract: `frontend/ee/test/app-builder/widgets/MultiselectV2/TESTING.md`
 * (scenarios MultiselectV2-STATE-* and MultiselectV2-VAL-*).
 *
 * STATE-004 through STATE-009 are the state-precedence class the contract calls
 * out as recurring across every stateful ToolJet widget: the widget keeps
 * `setX` results in local state, the platform wrapper prefers the exposed
 * variable, and one `useEffect` (MultiselectV2.jsx:99-104) resyncs ALL THREE
 * local states whenever ANY of the three properties changes. So changing the
 * loading property silently undoes a `setDisable`, in the widget but not in the
 * exposed variable. These tests pin that disagreement rather than the intent.
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

const rowLabels = () => screen.queryAllByRole('option').map((r) => r.textContent);
const searchBox = () => screen.queryByPlaceholderText('Search');
const loader = () => document.querySelector('.tj-widget-loader');
/** The platform wrapper `RenderWidget` renders around every widget. */
const platformWrapper = () => document.querySelector('.canvas-component');
/** The widget's own root, which carries its visibility marker. */
const widgetRoot = () => document.querySelector('.multiselect-widget');
const selectContainer = () => document.querySelector('#component-ms1');
/**
 * The chevron. Not a role or a label anywhere — react-select renders it as a
 * bare svg — but it is the one thing a loading field visibly swaps for the
 * loader, so it is matched by the authored `cursor-pointer` class, excluding
 * the clear control which shares it.
 */
const dropdownIndicator = () => document.querySelector('svg.cursor-pointer:not(.clear-indicator)');

/** `fireEvent`, not `user.click`: a disabled or loading control carries
 *  `pointer-events: none`, and userEvent refuses to reach the widget's own
 *  guard through it — which is exactly what these tests are checking. */
async function clickControl() {
  fireEvent.click(screen.getByRole('combobox'));
  await drain();
}
const isMenuOpen = () => screen.queryAllByRole('option').length > 0 || searchBox() !== null;

const clickRow = async (text) => {
  const found = screen.getAllByRole('option').find((r) => r.textContent.startsWith(text));
  if (!found) throw new Error(`no option row rendering "${text}" (rows: ${JSON.stringify(rowLabels())})`);
  await harness.session.user.click(found);
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
const MANDATORY = { mandatory: binding(true) };

describe('MultiselectV2: state precedence, option loading, and validation', () => {
  beforeEach(harness.setup);
  afterEach(harness.teardown);

  test('[MultiselectV2-STATE-001] A loading field shows the loader and cannot be opened', async () => {
    // Break this catches: dropping `isMultiSelectLoading` from either the
    // click guard (MultiselectV2.jsx:373) or the Enter guard (:630) — the menu
    // would open over a field that is still loading its own state.
    harness.render({
      properties: { ...EMPTY_SELECTION, loadingState: binding('{{true}}') },
      events: countEvent('onFocus', 'focusCount'),
    });
    await drain();

    expect(loader()).not.toBeNull();
    expect(dropdownIndicator()).toBeNull();

    await clickControl();
    expect(isMenuOpen()).toBe(false);

    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    await drain();
    expect(isMenuOpen()).toBe(false);
    expect(count('focusCount')).toBe(0);
  });

  test('[MultiselectV2-STATE-002] A disabled field cannot be opened and is marked disabled at the wrapper', async () => {
    // Break this catches: dropping `isMultiSelectDisabled` from the click guard
    // (MultiselectV2.jsx:373), or narrowing `isDisabledOrLoading`
    // (AppCanvas/RenderWidget.jsx:305-311) so the wrapper stops marking either
    // state — the shared `disabled` class is what dims the whole widget.
    harness.render({ properties: { ...EMPTY_SELECTION, disabledState: binding('{{true}}') } });
    await drain();

    await clickControl();
    expect(isMenuOpen()).toBe(false);
    expect(platformWrapper()).toHaveClass('disabled');
    expect(loader()).toBeNull();

    // The same class, for a different state: only the loader tells them apart.
    remount();
    harness.render({ properties: { ...EMPTY_SELECTION, loadingState: binding('{{true}}') } });
    await drain();
    await clickControl();
    expect(isMenuOpen()).toBe(false);
    expect(platformWrapper()).toHaveClass('disabled');
    expect(loader()).not.toBeNull();
  });

  test('[MultiselectV2-STATE-003] A hidden field marks itself invisible and hides its validation error', async () => {
    // Break this catches: dropping `visibility` from the error row's render
    // condition (MultiselectV2.jsx:656) — a hidden field would push an error
    // message into a layout that is not showing the field it belongs to.
    harness.render({ properties: EMPTY_SELECTION, validation: MANDATORY });
    await drain();
    // Interact so the error is allowed to render, then hide the field.
    await harness.session.user.click(screen.getByRole('combobox'));
    await drain();
    await clickRow('option1');
    await clickRow('option1');
    expect(screen.getByText('Field cannot be empty')).toBeInTheDocument();

    await setProperty('visibility', '{{false}}');

    expect(widgetRoot()).toHaveClass('invisible');
    expect(widgetRoot()).not.toHaveClass('visibility');
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
    expect(harness.exposed().isValid).toBe(false);
    // `aria-hidden` is handed to react-select, which never forwards it.
    expect(selectContainer().hasAttribute('aria-hidden')).toBe(false);
  });

  test('[MultiselectV2-STATE-004] `setDisable` survives a rewrite of `disabledState` to the value it already had', async () => {
    // Break this catches: the resync effect (MultiselectV2.jsx:99-104) being
    // driven by a render count rather than by a changed value — a no-op
    // property rewrite would then undo the action.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();

    await harness.act('setDisable', true);
    await setProperty('disabledState', '{{false}}');

    await clickControl();
    expect(isMenuOpen()).toBe(false);
    expect(harness.exposed().isDisabled).toBe(true);
  });

  test('[MultiselectV2-STATE-005] `setDisable` survives an unrelated property change', async () => {
    // Break this catches: widening the resync effect's dependency list
    // (MultiselectV2.jsx:104) to every property, which would re-enable the
    // field on any unrelated re-resolve.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();

    await harness.act('setDisable', true);
    await setProperty('label', 'A new label');

    await clickControl();
    expect(isMenuOpen()).toBe(false);
    expect(harness.exposed().isDisabled).toBe(true);
  });

  test('[MultiselectV2-STATE-006] After `setDisable(true)`, a loading change re-enables the field while the wrapper still calls it disabled', async () => {
    // Break this catches: the resync effect writing only the state whose
    // property changed instead of all three (MultiselectV2.jsx:100-102). That
    // is the fix. Today one property's change clobbers another's action, and
    // only the local state — never the exposed variable — so the field looks
    // disabled and behaves enabled.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();

    await harness.act('setDisable', true);
    await setProperty('loadingState', '{{true}}');
    await setProperty('loadingState', '{{false}}');

    await clickControl();
    expect(isMenuOpen()).toBe(true);
    expect(harness.exposed().isDisabled).toBe(true);
    expect(platformWrapper()).toHaveClass('disabled');
  });

  test('[MultiselectV2-STATE-007] After `setVisibility(false)`, a disabled change unhides the widget while the platform keeps it hidden', async () => {
    // Break this catches: the same resync effect, from the visibility side
    // (MultiselectV2.jsx:100). The platform wrapper prefers the exposed
    // `isVisible` (AppCanvas/RenderWidget.jsx:276-278), so the two authorities
    // end up disagreeing rather than one simply winning.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();

    await harness.act('setVisibility', false);
    expect(widgetRoot()).toHaveClass('invisible');

    await setProperty('disabledState', '{{true}}');

    expect(widgetRoot()).not.toHaveClass('invisible');
    expect(harness.exposed().isVisible).toBe(false);
  });

  test('[MultiselectV2-STATE-008] After `setLoading(true)`, a visibility change removes the loader while the platform still reports loading', async () => {
    // Break this catches: the resync effect, from the loading side
    // (MultiselectV2.jsx:101) — the loader disappears while every binding on
    // `isLoading`, and the wrapper's own `disabled` class, still say loading.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();

    await harness.act('setLoading', true);
    expect(loader()).not.toBeNull();

    await setProperty('visibility', '{{false}}');

    expect(loader()).toBeNull();
    expect(dropdownIndicator()).not.toBeNull();
    expect(harness.exposed().isLoading).toBe(true);
    expect(platformWrapper()).toHaveClass('disabled');
  });

  test('[MultiselectV2-STATE-009] A real property change overrides an earlier `setDisable`, in both places', async () => {
    // Break this catches: the resync effect's `!==` comparisons
    // (MultiselectV2.jsx:100-102) being dropped, which would leave the action's
    // value in place permanently and make the property unable to win.
    harness.render({ properties: EMPTY_SELECTION });
    await drain();

    await harness.act('setDisable', true);
    await setProperty('disabledState', '{{true}}');
    await clickControl();
    expect(isMenuOpen()).toBe(false);
    expect(harness.exposed().isDisabled).toBe(true);

    await setProperty('disabledState', '{{false}}');
    await clickControl();
    expect(isMenuOpen()).toBe(true);
    expect(harness.exposed().isDisabled).toBe(false);
  });

  test('[MultiselectV2-STATE-010] `optionsLoadingState` with dynamic options on replaces the rows with a menu loader', async () => {
    // Break this catches: dropping the `!optionsLoadingState` guard around the
    // menu body (DropdownV2/CustomMenuList.jsx:110) — rows and loader would
    // render together — or moving the search box inside that guard, which
    // would be the fix for offering a search over nothing.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        advanced: binding('{{true}}'),
        optionsLoadingState: binding('{{true}}'),
      },
    });
    await drain();
    await harness.session.user.click(screen.getByRole('combobox'));
    await drain();

    expect(rowLabels()).toEqual([]);
    expect(loader()).not.toBeNull();
    expect(searchBox()).not.toBeNull();
  });

  test('[MultiselectV2-STATE-011] `optionsLoadingState` with dynamic options off shows no loader', async () => {
    // Break this catches: dropping the `&& advanced` conjunction on the prop
    // (MultiselectV2.jsx:648) — a static list would start showing a spinner
    // that nothing can ever resolve. Which is also the honest reading of the
    // toggle; today it is half-wired, and this pins that.
    harness.render({
      properties: { ...EMPTY_SELECTION, advanced: binding('{{false}}'), optionsLoadingState: binding('{{true}}') },
    });
    await drain();
    await harness.session.user.click(screen.getByRole('combobox'));
    await drain();

    expect(loader()).toBeNull();
    expect(rowLabels()).toEqual(['option1', 'option2', 'option3']);
  });

  test('[MultiselectV2-STATE-012] `optionsLoadingState` removes the select-all row in either mode', async () => {
    // Break this catches: the select-all gate reading the same `advanced &&
    // optionsLoadingState` the loader does (MultiselectV2.jsx:133 vs :648)
    // instead of the bare toggle. The two consumers disagree today, and a
    // static list silently loses select-all — this pins it.
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        showAllOption: binding('{{true}}'),
        optionsLoadingState: binding('{{true}}'),
        advanced: binding('{{false}}'),
      },
    });
    await drain();
    await harness.session.user.click(screen.getByRole('combobox'));
    await drain();

    expect(rowLabels()).toEqual(['option1', 'option2', 'option3']);
    expect(rowLabels()).not.toContain('Select all');

    remount();
    harness.render({
      properties: {
        ...EMPTY_SELECTION,
        showAllOption: binding('{{true}}'),
        optionsLoadingState: binding('{{true}}'),
        advanced: binding('{{true}}'),
      },
    });
    await drain();
    await harness.session.user.click(screen.getByRole('combobox'));
    await drain();
    expect(rowLabels()).not.toContain('Select all');
  });

  test('[MultiselectV2-VAL-001] A mandatory field with nothing selected is invalid but shows no error yet', async () => {
    // Break this catches: dropping `userInteracted` from the error row's
    // condition (MultiselectV2.jsx:656) — every mandatory field on a freshly
    // loaded form would render its error before the user touched anything.
    harness.render({ properties: EMPTY_SELECTION, validation: MANDATORY });
    await drain();

    expect(harness.exposed().isValid).toBe(false);
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();
  });

  test('[MultiselectV2-VAL-002] Emptying a mandatory field after a selection reveals the error', async () => {
    // Break this catches: resetting `userInteracted` when the selection becomes
    // empty, or setting it before the change rather than after
    // (MultiselectV2.jsx:214) — the error would flicker or never appear.
    harness.render({ properties: EMPTY_SELECTION, validation: MANDATORY });
    await drain();
    await harness.session.user.click(screen.getByRole('combobox'));
    await drain();

    await clickRow('option2');
    expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();

    await clickRow('option2');
    expect(harness.exposed().isValid).toBe(false);
    expect(screen.getByText('Field cannot be empty')).toBeInTheDocument();
  });

  test('[MultiselectV2-VAL-003] A custom validation string becomes the rendered error message', async () => {
    // Break this catches: the custom-rule branch losing its
    // `typeof === 'string' && !== ''` test (componentsSlice.js:845-848), which
    // would make a rule resolving to `false` invalidate the field with the
    // string "false" as its message.
    harness.render({
      properties: EMPTY_SELECTION,
      validation: { customRule: binding("{{'pick at least one region'}}") },
    });
    await drain();
    await harness.session.user.click(screen.getByRole('combobox'));
    await drain();
    await clickRow('option1');

    expect(harness.exposed().isValid).toBe(false);
    expect(screen.getByText('pick at least one region')).toBeInTheDocument();

    // A non-string rule leaves validity to the other rules.
    remount();
    harness.render({ properties: EMPTY_SELECTION, validation: { customRule: binding('{{false}}') } });
    await drain();
    expect(harness.exposed().isValid).toBe(true);
  });

  test('[MultiselectV2-VAL-004] Every selection write republishes `isValid`', async () => {
    // Break this catches: hoisting the `setExposedVariable('isValid', ...)` out
    // of `setInputValue` (MultiselectV2.jsx:399-401) into an effect — a binding
    // on `isValid` would then lag the selection by a render.
    harness.render({ properties: EMPTY_SELECTION, validation: MANDATORY });
    await drain();
    await harness.session.user.click(screen.getByRole('combobox'));
    await drain();

    await clickRow('option1');
    expect(harness.exposed().values).toEqual(['1']);
    expect(harness.exposed().isValid).toBe(true);

    await harness.act('clear');
    expect(harness.exposed().values).toEqual([]);
    expect(harness.exposed().isValid).toBe(false);

    await harness.act('selectOptions', ['2']);
    expect(harness.exposed().values).toEqual(['2']);
    expect(harness.exposed().isValid).toBe(true);

    await harness.act('deselectOptions', ['2']);
    expect(harness.exposed().values).toEqual([]);
    expect(harness.exposed().isValid).toBe(false);
  });

  test("[MultiselectV2-VAL-005] The store's selection-count rules cannot be reached from this widget", async () => {
    // Break this catches: making the widget hand `validateWidget` an empty
    // ARRAY instead of `null` for an empty selection (MultiselectV2.jsx:395) —
    // the `minSelection` branch would start firing for a rule no inspector can
    // configure, and a mandatory field's message would change from "Field
    // cannot be empty" to "Minimum N selections required".
    const validateWidget = useStore.getState().validateWidget;
    const validationObject = { minSelection: { value: 2 }, maxSelection: { value: 1 } };

    // What the widget actually passes for an empty selection: not an array, so
    // the whole selection-count block is skipped.
    expect(
      validateWidget({ validationObject, widgetValue: null, componentType: 'MultiselectV2', moduleId: 'canvas' })
    ).toEqual({ isValid: true, validationError: null });

    // The branch is reachable only by a caller that hands it an array — which
    // this widget never does while the selection is empty, and which no
    // MultiselectV2 inspector can configure a rule for in the first place.
    expect(
      validateWidget({
        validationObject,
        widgetValue: ['1', '2'],
        componentType: 'MultiselectV2',
        moduleId: 'canvas',
      })
    ).toEqual({ isValid: false, validationError: 'Maximum 1 selections allowed' });
  });
});
