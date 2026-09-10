/**
 * RadioButtonV2 widget behaviour — see
 * frontend/ee/test/app-builder/widgets/RadioButtonV2/TESTING.md for the
 * approved contract. Every test title starts with its scenario ID; the
 * validator (`npm run validate:widget-testing-contracts`) greps for it.
 *
 * Uses the shared widget harness (../../widgetHarness.js) for the real
 * composed store + RenderWidget seam. `useStore` is imported directly here
 * (not only through the harness) so this integration spec is recognised by
 * scripts/validate-test-layout.js, and because the ListView sub-container
 * mount for [RadioButtonV2-CTR-001] needs a couple of raw store calls the
 * harness doesn't expose.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import RenderWidget from '@/AppBuilder/AppCanvas/RenderWidget';
import useStore from '@/AppBuilder/_stores/store';
import { AppBuilderTestSession, defineAppBuilderScenario, seedApp, componentDefinition } from '@/test/app-builder';
import {
  createWidgetHarness,
  radioButtonV2Defaults,
  option,
  binding,
  setVariableOn,
  widgetProps,
  MODULE_ID,
} from '@/AppBuilder/Widgets/widgetHarness';

const HANDLE = 'radio1';

describe('RadioButtonV2', () => {
  const harness = createWidgetHarness({
    componentType: 'RadioButtonV2',
    handle: HANDLE,
    id: HANDLE,
    defaultProperties: radioButtonV2Defaults.defaultProperties,
    defaultStyles: radioButtonV2Defaults.defaultStyles,
  });

  beforeEach(() => harness.setup());
  afterEach(() => harness.teardown());

  describe('DEF', () => {
    test('[RadioButtonV2-DEF-001] the default option becomes the initial checked value and exposed value', async () => {
      // Break this catches: findDefaultItem no longer seeds useState's initial checkedValue (RadioButtonV2.jsx:59,109-111).
      harness.render({
        properties: {
          options: binding([option('A', 'a'), option('B', 'b', { isDefault: true }), option('C', 'c')]),
        },
      });

      expect(screen.getByRole('radio', { name: 'B' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: 'C' })).not.toBeChecked();
      expect(harness.exposed().value).toBe('b');
    });

    test('[RadioButtonV2-DEF-002] no matching default leaves nothing selected', async () => {
      // Break this catches: findDefaultItem stops requiring item.visible === true (RadioButtonV2.jsx:109), so a hidden default matches.
      harness.render({
        properties: {
          options: binding([option('A', 'a'), option('B', 'b', { visible: false, isDefault: true }), option('C', 'c')]),
        },
      });

      expect(screen.getByRole('radio', { name: 'A' })).not.toBeChecked();
      expect(screen.getByRole('radio', { name: 'C' })).not.toBeChecked();
      expect(harness.exposed().value).toBeUndefined();
    });

    test('[RadioButtonV2-DEF-003] label renders and supplies an accessible name when its column is collapsed', async () => {
      // Break this catches: removing the aria-label computation at RadioButtonV2.jsx:266, or the Label render condition.
      harness.render({ properties: { label: binding('Pick one') }, styles: { auto: binding('{{true}}') } });
      expect(screen.getByText('Pick one')).toBeInTheDocument();

      harness.render({
        properties: { label: binding('Pick one') },
        styles: { auto: binding('{{false}}'), labelWidth: binding('0') },
      });
      expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Pick one');
    });
  });

  describe('OPT', () => {
    test('[RadioButtonV2-OPT-001] `advanced` switches the option source between `options` and `schema`', async () => {
      // Break this catches: `advanced ? schema : options` hardcoded to always read `options` (RadioButtonV2.jsx:89,123).
      const opts = [option('Opt A', 'oa', { isDefault: true })];
      const sch = [option('Schema B', 'sb', { isDefault: true })];

      harness.render({ properties: { options: binding(opts), schema: binding(sch), advanced: binding('{{false}}') } });
      expect(screen.getByRole('radio', { name: 'Opt A' })).toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: 'Schema B' })).not.toBeInTheDocument();
      expect(harness.exposed().value).toBe('oa');

      harness.render({ properties: { options: binding(opts), schema: binding(sch), advanced: binding('{{true}}') } });
      expect(await screen.findByRole('radio', { name: 'Schema B' })).toBeInTheDocument();
      expect(screen.queryByRole('radio', { name: 'Opt A' })).not.toBeInTheDocument();
      expect(harness.exposed().value).toBe('sb');
    });

    test('[RadioButtonV2-OPT-002] hidden options are excluded from render and cannot be the default', async () => {
      // Break this catches: removing the `.filter((data) => data?.visible ?? true)` line (RadioButtonV2.jsx:92).
      harness.render({
        properties: {
          options: binding([
            option('Hidden Default', 'hd', { visible: false, isDefault: true }),
            option('Visible', 'v'),
          ]),
        },
      });

      expect(screen.queryByRole('radio', { name: 'Hidden Default' })).not.toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(1);
      expect(harness.exposed().value).toBeUndefined();
    });

    test('[RadioButtonV2-OPT-003] a per-option `disable` blocks native interaction, not just visuals', async () => {
      // Break this catches: removing `disabled={option.isDisabled}` on the input (RadioButtonV2.jsx:329).
      harness.render({
        properties: { options: binding([option('A', 'a', { isDefault: true }), option('B', 'b', { disable: true })]) },
        events: setVariableOn(HANDLE, 'onSelectionChange', { key: 'seen' }),
      });

      const inputB = screen.getByRole('radio', { name: 'B' });
      expect(inputB).toBeDisabled();

      await harness.session.user.click(inputB);

      expect(harness.exposed().value).toBe('a');
      expect(harness.variables().seen).toBeUndefined();
    });

    test('[RadioButtonV2-OPT-004] exposed `options` reflects only currently-visible `{label, value}` pairs', async () => {
      // Break this catches: the exposed `options` effect stops filtering by visibility (RadioButtonV2.jsx:137-138).
      harness.render({
        properties: {
          options: binding([option('A', 'a'), option('B', 'b', { visible: false }), option('C', 'c')]),
        },
      });

      await waitFor(() =>
        expect(harness.exposed().options).toEqual([
          { label: 'A', value: 'a' },
          { label: 'C', value: 'c' },
        ])
      );

      harness.render({
        properties: {
          options: binding([
            option('A', 'a'),
            option('B', 'b', { visible: false }),
            option('C', 'c'),
            option('D', 'd'),
          ]),
        },
      });

      await waitFor(() =>
        expect(harness.exposed().options).toEqual([
          { label: 'A', value: 'a' },
          { label: 'C', value: 'c' },
          { label: 'D', value: 'd' },
        ])
      );
    });

    test('[RadioButtonV2-OPT-005] changing the options array overwrites a user manual selection with the new default', async () => {
      // Break this catches: the re-derive effect's deps drop `JSON.stringify(options)` (RadioButtonV2.jsx:125), so a re-resolve no longer overwrites the manual pick.
      harness.render({
        properties: { options: binding([option('A', 'a', { isDefault: true }), option('B', 'b')]) },
      });
      expect(harness.exposed().value).toBe('a');

      await harness.session.user.click(screen.getByRole('radio', { name: 'B' }));
      expect(harness.exposed().value).toBe('b');

      // A query re-resolve reshuffles the array (same default, but the JSON differs).
      harness.render({
        properties: {
          options: binding([option('A', 'a', { isDefault: true }), option('B', 'b'), option('C', 'c')]),
        },
      });

      await waitFor(() => expect(harness.exposed().value).toBe('a'));
    });

    test('[RadioButtonV2-OPT-006] a non-string option label renders safely', async () => {
      // Break this catches: removing the getSafeRenderableValue call (RadioButtonV2.jsx:95) — a null label would render literal text "null" instead of "".
      harness.render({ properties: { options: binding([option(null, 'a', { isDefault: true })]) } });

      expect(screen.getAllByRole('radio')).toHaveLength(1);
      await waitFor(() => expect(harness.exposed().options).toEqual([{ label: '', value: 'a' }]));
      expect(screen.queryByText('null')).not.toBeInTheDocument();
    });
  });

  describe('LAY', () => {
    const twoOptions = binding([option('A', 'a', { isDefault: true }), option('B', 'b')]);

    test('[RadioButtonV2-LAY-001] `layout: column` stacks options vertically', async () => {
      // Break this catches: `flexDirection: layout === 'wrap' ? 'row' : layout` hardcoded to always 'row' (RadioButtonV2.jsx:228).
      const { container } = harness.render({ properties: { options: twoOptions, layout: binding('column') } });
      const optionsContainer = container.querySelector('.d-flex.px-0');
      expect(optionsContainer.style.flexDirection).toBe('column');
    });

    test('[RadioButtonV2-LAY-002] `layout: wrap` wraps options onto new rows', async () => {
      // Break this catches: dropping the `...(layout === 'wrap' && { flexWrap: 'wrap', ... })` spread (RadioButtonV2.jsx:229-233).
      let { container } = harness.render({ properties: { options: twoOptions, layout: binding('row') } });
      let optionsContainer = container.querySelector('.d-flex.px-0');
      expect(optionsContainer.style.flexWrap).toBe('');

      ({ container } = harness.render({ properties: { options: twoOptions, layout: binding('wrap') } }));
      optionsContainer = container.querySelector('.d-flex.px-0');
      expect(optionsContainer.style.flexDirection).toBe('row');
      expect(optionsContainer.style.flexWrap).toBe('wrap');
    });

    test('[RadioButtonV2-LAY-003] `dynamicHeight` only activates in view mode', async () => {
      // Break this catches: `isDynamicHeightEnabled` no longer requires `currentMode === 'view'` (RadioButtonV2.jsx:73).
      harness.render({ properties: { options: twoOptions, dynamicHeight: binding('{{true}}') }, currentMode: 'edit' });
      let group = screen.getByRole('radiogroup');
      expect(group.style.height).toBe('100%');

      harness.render({ properties: { options: twoOptions, dynamicHeight: binding('{{true}}') }, currentMode: 'view' });
      group = screen.getByRole('radiogroup');
      expect(group.style.height).toBe('auto');
    });
  });

  describe('STATE', () => {
    test('[RadioButtonV2-STATE-001] `disabledState` sets aria-disabled and exposes isDisabled', async () => {
      // Break this catches: the sync effect stops writing local isDisabled from disabledState (RadioButtonV2.jsx:130,181).
      harness.render({
        properties: {
          options: binding([option('A', 'a', { isDefault: true })]),
          disabledState: binding('{{true}}'),
        },
      });

      const group = screen.getByRole('radiogroup');
      await waitFor(() => expect(group).toHaveAttribute('aria-disabled', 'true'));
      await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
    });

    test('[RadioButtonV2-STATE-002] `loadingState` or `optionsLoadingState` swaps options for a loader', async () => {
      // Break this catches: the loader condition stops OR-ing both flags, e.g. `isLoading` alone (RadioButtonV2.jsx:286).
      const opts = binding([option('A', 'a', { isDefault: true })]);

      let { container } = harness.render({ properties: { options: opts, loadingState: binding('{{true}}') } });
      expect(container.querySelector('.spinner-border, [class*="loader"]') || screen.queryByRole('radio')).toBeTruthy();
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();
      let group = screen.getByRole('radiogroup');
      expect(group).toHaveAttribute('aria-busy', 'true');

      ({ container } = harness.render({
        properties: { options: opts, loadingState: binding('{{false}}'), optionsLoadingState: binding('{{true}}') },
      }));
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();

      ({ container } = harness.render({
        properties: { options: opts, loadingState: binding('{{false}}'), optionsLoadingState: binding('{{false}}') },
      }));
      expect(screen.getByRole('radio', { name: 'A' })).toBeInTheDocument();
    });

    test('[RadioButtonV2-STATE-003] `visibility` hides the group without unmounting it', async () => {
      // Break this catches: `visibility:false` removes the widget from the DOM instead of only hiding it (RadioButtonV2.jsx:249-250,261).
      harness.render({
        properties: { options: binding([option('A', 'a', { isDefault: true })]), visibility: binding('{{false}}') },
      });

      const group = screen.getByRole('radiogroup', { hidden: true });
      expect(group).toHaveAttribute('aria-hidden', 'true');
      expect(group).toHaveClass('invisible');
      await waitFor(() => expect(harness.exposed().isVisible).toBe(false));
    });

    // STATE-004/005/006: a boolean CSA action and its paired property are the same two values, so a
    // single CSA-call-then-property-change pair cannot tell "the effect synced" from "it coincidentally
    // already matched". Each test therefore does: CSA diverges -> survives an unrelated re-resolve ->
    // a quiet property transition (lands on the same value the CSA already set, not asserted) -> a
    // second, fresh property transition whose target is impossible to reach except via the sync effect.
    test('[RadioButtonV2-STATE-004] `setVisibility` action: survives unrelated re-resolve, yields to a genuine property change', async () => {
      // Break this catches: the sync effect's dependency array drops `properties.visibility` (RadioButtonV2.jsx:133), so a real property change never overrides the CSA value.
      //
      // Asserts the root's `aria-hidden` (driven by the LOCAL `visibility` state that effect
      // syncs), not just the `isVisible` exposed variable — `isVisible` also has its own
      // independent effect keyed only on `properties.visibility` (RadioButtonV2.jsx:173-177) and
      // CSA writes it directly too, so it alone can't isolate the L127-133 effect under test.
      const opts = binding([option('A', 'a', { isDefault: true })]);
      harness.render({ properties: { options: opts, visibility: binding('{{true}}'), label: binding('L1') } });

      await harness.act('setVisibility', false);
      await waitFor(() =>
        expect(screen.getByRole('radiogroup', { hidden: true })).toHaveAttribute('aria-hidden', 'true')
      );

      harness.render({ properties: { options: opts, visibility: binding('{{true}}'), label: binding('L2') } });
      expect(screen.getByRole('radiogroup', { hidden: true })).toHaveAttribute('aria-hidden', 'true');

      harness.render({ properties: { options: opts, visibility: binding('{{false}}'), label: binding('L2') } });

      harness.render({ properties: { options: opts, visibility: binding('{{true}}'), label: binding('L2') } });
      await waitFor(() => expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-hidden', 'false'));
    });

    test('[RadioButtonV2-STATE-005] `setLoading` action: survives unrelated re-resolve, yields to a genuine property change', async () => {
      // Break this catches: the sync effect's dependency array drops `loadingState` (RadioButtonV2.jsx:133), so a real property change never overrides the CSA value.
      //
      // Asserts the Loader/options swap (driven by the LOCAL `isLoading` state that effect
      // syncs), not just the `isLoading` exposed variable — it has its own independent effect
      // keyed only on `loadingState` (RadioButtonV2.jsx:167-171) and CSA writes it directly too.
      const opts = binding([option('A', 'a', { isDefault: true })]);
      harness.render({ properties: { options: opts, loadingState: binding('{{false}}'), label: binding('L1') } });

      await harness.act('setLoading', true);
      await waitFor(() => expect(screen.queryByRole('radio')).not.toBeInTheDocument());

      harness.render({ properties: { options: opts, loadingState: binding('{{false}}'), label: binding('L2') } });
      expect(screen.queryByRole('radio')).not.toBeInTheDocument();

      harness.render({ properties: { options: opts, loadingState: binding('{{true}}'), label: binding('L2') } });

      harness.render({ properties: { options: opts, loadingState: binding('{{false}}'), label: binding('L2') } });
      await waitFor(() => expect(screen.getByRole('radio', { name: 'A' })).toBeInTheDocument());
    });

    test('[RadioButtonV2-STATE-006] `setDisable` action: survives unrelated re-resolve, yields to a genuine property change', async () => {
      // Break this catches: the sync effect's dependency array drops `disabledState` (RadioButtonV2.jsx:133), so a real property change never overrides the CSA value.
      //
      // Asserts the root's `aria-disabled` (driven by the LOCAL `isDisabled` state that effect
      // syncs), not just the `isDisabled` exposed variable — it has its own independent effect
      // keyed only on `disabledState` (RadioButtonV2.jsx:179-183) and CSA writes it directly too.
      const opts = binding([option('A', 'a', { isDefault: true })]);
      harness.render({ properties: { options: opts, disabledState: binding('{{false}}'), label: binding('L1') } });

      await harness.act('setDisable', true);
      await waitFor(() => expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true'));

      harness.render({ properties: { options: opts, disabledState: binding('{{false}}'), label: binding('L2') } });
      expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'true');

      harness.render({ properties: { options: opts, disabledState: binding('{{true}}'), label: binding('L2') } });

      harness.render({ properties: { options: opts, disabledState: binding('{{false}}'), label: binding('L2') } });
      await waitFor(() => expect(screen.getByRole('radiogroup')).toHaveAttribute('aria-disabled', 'false'));
    });
  });

  describe('VAL', () => {
    test('[RadioButtonV2-VAL-001] mandatory + unselected shows an error immediately; selecting clears it', async () => {
      // Break this catches: the error text render loses its unconditional `!isValid` gate (RadioButtonV2.jsx:352-363), or the mandatory validation stops firing on mount.
      harness.render({
        properties: { options: binding([option('A', 'a'), option('B', 'b')]) },
        validation: { mandatory: binding('{{true}}') },
      });

      expect(await screen.findByText('Field cannot be empty')).toBeInTheDocument();
      const group = screen.getByRole('radiogroup');
      expect(group).toHaveAttribute('aria-required', 'true');
      expect(group).toHaveAttribute('aria-invalid', 'true');
      expect(harness.exposed().isValid).toBe(false);
      expect(harness.exposed().isMandatory).toBe(true);

      await harness.session.user.click(screen.getByRole('radio', { name: 'A' }));

      await waitFor(() => expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument());
      expect(harness.exposed().isValid).toBe(true);
    });

    test('[RadioButtonV2-VAL-003] `customRule` failure renders its own error text', async () => {
      // Break this catches: RadioButtonV2 stops passing validation.customRule through to validate() / stops rendering validationError.
      harness.render({
        properties: { options: binding([option('A', 'a', { isDefault: true })]) },
        validation: { customRule: binding('Always broken') },
      });

      expect(await screen.findByText('Always broken')).toBeInTheDocument();
      expect(harness.exposed().isValid).toBe(false);
    });

    test('[RadioButtonV2-VAL-004] Form `clearForm` clears the selection and re-invalidates a mandatory field', async () => {
      // Break this catches: `useFormClear(() => onSelect(null))` removed or its callback stops calling onSelect (RadioButtonV2.jsx:222).
      harness.renderInsideForm({
        properties: { options: binding([option('A', 'a', { isDefault: true }), option('B', 'b')]) },
        validation: { mandatory: binding('{{true}}') },
      });

      await waitFor(() => expect(harness.exposed().value).toBe('a'));
      expect(harness.exposed().isValid).toBe(true);

      await waitFor(() => expect(harness.exposed('form1').clearForm).toBeInstanceOf(Function));
      await harness.session.store.act(async () => {
        await harness.exposed('form1').clearForm();
      });

      await waitFor(() => expect(harness.exposed().value).toBeNull());
      expect(harness.exposed().isValid).toBe(false);
      expect(await screen.findByText('Field cannot be empty')).toBeInTheDocument();
    });

    test('[RadioButtonV2-VAL-005] Form `resetForm` remounts the widget back to its config default, distinct from `clearForm`', async () => {
      // Break this catches: resetComponent()'s remount (RenderWidget's key bump) stops happening, so resetForm leaves the manually-selected value in place instead of restoring the config default.
      harness.renderInsideForm({
        properties: { options: binding([option('A', 'a', { isDefault: true }), option('B', 'b')]) },
      });

      await waitFor(() => expect(harness.exposed().value).toBe('a'));
      await harness.act('selectOption', 'b');
      await waitFor(() => expect(harness.exposed().value).toBe('b'));

      await waitFor(() => expect(harness.exposed('form1').resetForm).toBeInstanceOf(Function));
      await harness.session.store.act(async () => {
        await harness.exposed('form1').resetForm();
      });

      await waitFor(() => expect(harness.exposed().value).toBe('a'));
    });
  });

  describe('EVT', () => {
    test('[RadioButtonV2-EVT-001] selecting an option fires `onSelectionChange` once and updates value/isValid', async () => {
      // Break this catches: the onChange handler fires `onSelectionChange` twice (or zero times) per click (RadioButtonV2.jsx:325-328).
      harness.render({
        properties: { options: binding([option('A', 'a', { isDefault: true }), option('B', 'b')]) },
        events: setVariableOn(HANDLE, 'onSelectionChange', {
          key: 'fireCount',
          value: '{{ (variables.fireCount || 0) + 1 }}',
        }),
      });

      await harness.session.user.click(screen.getByRole('radio', { name: 'B' }));

      await waitFor(() => expect(harness.variables().fireCount).toBe(1));
      expect(harness.exposed().value).toBe('b');
      expect(harness.exposed().isValid).toBe(true);
    });

    test('[RadioButtonV2-EVT-002] exposed `selectOption(value)` action selects programmatically and fires the event', async () => {
      // Break this catches: the exposed selectOption stops calling fireEvent('onSelectionChange') (RadioButtonV2.jsx:196-199).
      harness.render({
        properties: { options: binding([option('A', 'a', { isDefault: true }), option('B', 'b')]) },
        events: setVariableOn(HANDLE, 'onSelectionChange', { key: 'seen' }),
      });

      await harness.act('selectOption', 'b');

      expect(harness.exposed().value).toBe('b');
      await waitFor(() => expect(harness.variables().seen).toBe('YES'));
    });

    test('[RadioButtonV2-EVT-003] exposed `deselectOption()` clears the selection and fires the event', async () => {
      // Break this catches: deselectOption stops calling onSelect(null) or stops firing the event (RadioButtonV2.jsx:200-203).
      harness.render({
        properties: { options: binding([option('A', 'a', { isDefault: true }), option('B', 'b')]) },
        events: setVariableOn(HANDLE, 'onSelectionChange', { key: 'seen' }),
      });
      await waitFor(() => expect(harness.exposed().value).toBe('a'));

      await harness.act('deselectOption');

      expect(harness.exposed().value).toBeNull();
      await waitFor(() => expect(harness.variables().seen).toBe('YES'));
    });

    test('[RadioButtonV2-EVT-004] runtime `label` change updates the exposed `label` variable', async () => {
      // Break this catches: the `[label]` effect stops calling setExposedVariable('label', label) (RadioButtonV2.jsx:147-151).
      harness.render({ properties: { label: binding('Initial') } });
      await waitFor(() => expect(harness.exposed().label).toBe('Initial'));

      harness.render({ properties: { label: binding('Updated') } });
      await waitFor(() => expect(harness.exposed().label).toBe('Updated'));
    });
  });

  describe('STY', () => {
    const opts = binding([option('A', 'a', { isDefault: true })]);

    test('[RadioButtonV2-STY-001] `alignment: top` stacks the label above the options when a label is present', async () => {
      // Break this catches: the flex-column class's alignment==='top' condition removed (RadioButtonV2.jsx:242-246).
      let { container } = harness.render({
        properties: { options: opts, label: binding('Pick one') },
        styles: { alignment: binding('top') },
      });
      expect(container.querySelector('[role="radiogroup"]')).toHaveClass('flex-column');

      ({ container } = harness.render({
        properties: { options: opts, label: binding('Pick one') },
        styles: { alignment: binding('side') },
      }));
      expect(container.querySelector('[role="radiogroup"]')).not.toHaveClass('flex-column');
    });

    test('[RadioButtonV2-STY-002] `direction: right` reverses layout differently per alignment', async () => {
      // Break this catches: direction/alignment class conditions collapsed into one (RadioButtonV2.jsx:247-248).
      let { container } = harness.render({
        properties: { options: opts, label: binding('Pick one') },
        styles: { direction: binding('right'), alignment: binding('side') },
      });
      let group = container.querySelector('[role="radiogroup"]');
      expect(group).toHaveClass('flex-row-reverse');
      expect(group).not.toHaveClass('text-right');

      ({ container } = harness.render({
        properties: { options: opts, label: binding('Pick one') },
        styles: { direction: binding('right'), alignment: binding('top') },
      }));
      group = container.querySelector('[role="radiogroup"]');
      expect(group).toHaveClass('text-right');
      expect(group).not.toHaveClass('flex-row-reverse');
    });

    test('[RadioButtonV2-STY-003] `optionsTextColor` overrides option text color; a default-color option does not take the override path while disabled', async () => {
      // Break this catches: a customized optionsTextColor stops being applied (RadioButtonV2.jsx:307).
      //
      // Note on this test's oracle: the widget's own default optionsTextColor is '#1B1F24' — reading the
      // source precisely, the disabled-text fallback (var(--text-disabled)) only ever applies while
      // optionsTextColor is left at that default; a builder-set custom color always wins over disabledState
      // (the ternary checks optionsTextColor first), which is narrower than the contract prose's "regardless
      // of optionsTextColor" — see the final report. Separately, jsdom's CSSStyleDeclaration rejects `color:
      // var(...)` outright (confirmed experimentally: `el.style.color = 'var(--text-disabled)'` writes
      // nothing at all, not even a style attribute), so this suite cannot read back the exact CSS-variable
      // token a real browser would apply. What IS observable and asserted here: the override color applies
      // exactly when optionsTextColor is customized, and does NOT apply (falls off the override path
      // entirely, leaving no inline color) once optionsTextColor is left at its default while disabled —
      // proving the ternary's disabled branch is taken instead of the override branch.
      // Disabled + default color FIRST, on a fresh mount with no prior inline color to leave stale.
      const { container: disabledContainer } = harness.render({
        properties: { options: opts, disabledState: binding('{{true}}') },
        styles: { optionsTextColor: binding('#1B1F24') },
      });
      const disabledSpan = disabledContainer.querySelector(`[data-cy="${HANDLE}-option-label-0"]`);
      await waitFor(() => expect(harness.exposed().isDisabled).toBe(true));
      // Neither the override color NOR the literal default color (#1B1F24, which jsdom normalizes to
      // rgb(27, 31, 36) on read-back) should leak through as the rendered color — the code must go
      // through the disabled-fallback branch (jsdom drops the `var(--text-disabled)` value it actually
      // computes there, see comment above, so absence of both literals is the strongest assertion
      // available here).
      expect(disabledSpan.style.color).not.toBe('rgb(255, 0, 0)');
      expect(disabledSpan.style.color).not.toBe('rgb(27, 31, 36)');

      const { container: overrideContainer } = harness.render({
        properties: { options: opts, disabledState: binding('{{false}}') },
        styles: { optionsTextColor: binding('rgb(255, 0, 0)') },
      });
      const overrideSpan = overrideContainer.querySelector(`[data-cy="${HANDLE}-option-label-0"]`);
      await waitFor(() => expect(overrideSpan.style.color).toBe('rgb(255, 0, 0)'));
    });

    test('[RadioButtonV2-STY-004] label-width style keys only apply together when alignment=side and auto=false', async () => {
      // Break this catches: getLabelWidthOfInput's 'ofField' branch stops scaling (`(labelWidth/100)*70`), or Label stops ignoring _width when auto=true.
      let { container } = harness.render({
        properties: { options: opts, label: binding('Pick one') },
        styles: {
          alignment: binding('side'),
          auto: binding('{{false}}'),
          widthType: binding('ofComponent'),
          labelWidth: binding('40'),
        },
      });
      let label = container.querySelector(`[data-cy="${HANDLE}-label"]`);
      expect(label.style.width).toBe('40%');

      ({ container } = harness.render({
        properties: { options: opts, label: binding('Pick one') },
        styles: {
          alignment: binding('side'),
          auto: binding('{{true}}'),
          widthType: binding('ofComponent'),
          labelWidth: binding('40'),
        },
      }));
      label = container.querySelector(`[data-cy="${HANDLE}-label"]`);
      expect(label.style.width).toBe('auto');

      ({ container } = harness.render({
        properties: { options: opts, label: binding('Pick one') },
        styles: {
          alignment: binding('side'),
          auto: binding('{{false}}'),
          widthType: binding('ofField'),
          labelWidth: binding('40'),
        },
      }));
      label = container.querySelector(`[data-cy="${HANDLE}-label"]`);
      expect(label.style.width).toBe('28%');
    });

    test('[RadioButtonV2-STY-005] `labelFontSize` drives the rendered label font size', async () => {
      // Break this catches: labelFontSizeValue stops being derived from getLabelFontSize / stops reaching Label's fontSize prop (RadioButtonV2.jsx:54,283).
      const { container } = harness.render({
        properties: { options: opts, label: binding('Pick one') },
        styles: { labelFontSize: binding('{{20}}') },
      });
      const label = container.querySelector(`[data-cy="${HANDLE}-label"]`);
      expect(label.style.fontSize).toBe('20px');
    });
  });

  describe('CTR', () => {
    test('[RadioButtonV2-CTR-001] dropping into a ListView sub-container does not force-disable the widget', async () => {
      // Break this catches: reintroducing a `subContainerIndex != null` disable cascade in RadioButtonV2 (regression #14791).
      const listviewSession = new AppBuilderTestSession({
        scenario: defineAppBuilderScenario({
          id: 'radiobuttonv2-inside-listview',
          name: 'RadioButtonV2 inside a ListView row',
          primarySeam: 'rtl',
          surface: 'app-editor',
          edition: 'ce',
          environment: 'development',
          layout: 'desktop',
          version: 'draft',
          transferPath: 'not-applicable',
          access: 'authenticated',
          capabilities: { observers: true, media: { matches: false }, dnd: true },
        }),
      });

      const listviewDef = componentDefinition('lv1', 'listview1', 'Listview', {
        dataSourceSelector: binding('rawJson'),
        data: binding([{ id: 1 }]),
        mode: binding('list'),
        columns: binding('{{1}}'),
        rowsPerPage: binding('{{10}}'),
        enablePagination: binding('{{false}}'),
        visibility: binding('{{true}}'),
        disabledState: binding('{{false}}'),
        loadingState: binding('{{false}}'),
      });

      const child = componentDefinition(HANDLE, HANDLE, 'RadioButtonV2', {
        ...radioButtonV2Defaults.defaultProperties,
        options: binding([option('A', 'a', { isDefault: true })]),
        disabledState: binding('{{false}}'),
      });
      child.component.parent = 'lv1';
      child.component.definition.styles = { ...radioButtonV2Defaults.defaultStyles };
      child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };

      seedApp({ lv1: listviewDef, [HANDLE]: child }, { moduleId: MODULE_ID });
      useStore.getState().setEditorLoading(false, MODULE_ID);
      useStore.getState().setCurrentMode('edit', MODULE_ID);

      listviewSession.render(<RenderWidget {...widgetProps('lv1', 'Listview', { currentMode: 'edit' })} />);

      const radio = await screen.findByRole('radio', { name: 'A' });
      expect(radio).not.toBeDisabled();
      const group = screen.getByRole('radiogroup');
      expect(group).toHaveAttribute('aria-disabled', 'false');
      // A ListView row-child's exposed values are stored per-row (an array, one entry per row —
      // see listViewRowScope.spec.js), not the flat object getExposedValueOfComponent returns for
      // top-level components, so row 0's entry is read directly here.
      await waitFor(() => {
        const perRow = useStore.getState().resolvedStore.modules[MODULE_ID].exposedValues.components[HANDLE];
        expect(perRow?.[0]?.isDisabled).toBe(false);
      });
    });
  });
});
