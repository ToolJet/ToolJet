/**
 * Behaviour spec for the real Checkbox widget (src/AppBuilder/Widgets/Checkbox.jsx).
 *
 * Nothing about the widget is mocked: the real composed store resolves the
 * definition, the real RenderWidget supplies props, the real eventsSlice
 * dispatches onChange/onCheck/onUnCheck, and the real Checkbox module is what
 * ends up in the DOM. Everything asserted here is declared in
 * src/AppBuilder/WidgetManager/widgets/checkbox.js (properties `label`,
 * `defaultValue`, `visibility`, `disabledState`, `loadingState`; events
 * `onChange`/`onCheck`/`onUnCheck`; exposed variables
 * `value`/`label`/`isMandatory`/`isVisible`/`isDisabled`/`isLoading`; actions
 * `toggle`/`setValue`/`setVisibility`/`setDisable`/`setLoading`/`setChecked`).
 *
 * Why this widget matters out of proportion to its size: its entire value space
 * is `true`/`false`, so it is the sharpest available probe for the
 * `||`-swallows-falsy / "false reads as unset" bug class. Several tests below
 * exist only to pin `false` down as a REAL value — in the exposed store, in a
 * `{{ }}` binding consuming it, and in an event handler reading it back.
 *
 * Lives in __tests__/integration/ because it imports @/AppBuilder/_stores/store
 * (scripts/validate-test-layout.js). Setup shared across widgets lives in
 * ./widgetHarness.js — read its header for what's load-bearing and why.
 * Checkbox additionally needs `capabilities.observers`: it renders through
 * OverflowTooltip, which mounts a ResizeObserver that jsdom lacks (already
 * on by default in the harness).
 *
 * One structural note about the DOM: the real `<input type="checkbox">` is
 * `display: none`. The element a user actually clicks is its parent `<div>`,
 * which carries `onClick={handleToggleChange}` (Checkbox.jsx:190). Tests here
 * click that parent, which is the only path that fires `onChange`; clicking the
 * `<label>` activates the hidden input instead and goes through `toggleValue`
 * (Checkbox.jsx:44), which fires only the deprecated onCheck/onUnCheck.
 */
import { act, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, setVariableOn, binding, drain, store, MODULE_ID } from './widgetHarness';

const CHK = 'chk1';

// `visibility`/`disabledState`/`loadingState` default to false/off because
// the widget hides itself with `display: none` otherwise, which is not what
// most tests here are about.
const widget = createWidgetHarness({
  componentType: 'Checkbox',
  handle: 'checkbox1',
  id: CHK,
  defaultProperties: {
    label: binding('Accept terms'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
  },
});

/** The hidden real input — carries the authoritative checked state. */
const inputEl = (container) => container.querySelector('input.form-check-input');
/** The element a user clicks: the input's parent div holds `handleToggleChange`. */
const boxEl = (container) => inputEl(container).parentElement;

describe('Checkbox widget', () => {
  beforeEach(widget.setup);
  // A failed assertion skips inline cleanup, and a leaked bracket silently
  // buffers the NEXT test's exposed-value writes. See seed.js.
  afterEach(widget.teardown);

  describe('rendering', () => {
    test('renders its label and starts unchecked when `defaultValue` is false', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });

      expect(await screen.findByText('Accept terms')).toBeInTheDocument();
      expect(inputEl(container)).not.toBeChecked();
    });

    test('starts checked when `defaultValue` is true', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{true}}') } });

      await waitFor(() => expect(inputEl(container)).toBeChecked());
    });

    test('resolves a `{{ }}` binding for the default checked state through the dependency graph', async () => {
      // Not a literal: the default state is an expression over another
      // component's exposed value, so it can only become `true` by travelling
      // through the real resolver and a real dependency-graph edge. The
      // sibling TextInput is never rendered — writing its exposed value
      // directly is what the cascade reacts to.
      const { container } = widget.render({
        properties: { defaultValue: binding('{{components.textinput1.value === "yes"}}') },
        extraComponents: { c1: componentDefinition('c1', 'textinput1', 'TextInput') },
      });

      await act(async () => {
        widget.setExposedValue('c1', 'value', 'yes');
      });

      await waitFor(() => expect(inputEl(container)).toBeChecked());
    });

    test('a `{{ }}` binding that later resolves false unchecks the box again', async () => {
      // The falsy half of the binding path: once the expression flips to
      // `false`, that `false` must actually arrive and uncheck the box rather
      // than being discarded as "no value, keep what you had".
      const { container } = widget.render({
        properties: { defaultValue: binding('{{components.textinput1.value === "yes"}}') },
        extraComponents: { c1: componentDefinition('c1', 'textinput1', 'TextInput') },
      });

      await act(async () => {
        widget.setExposedValue('c1', 'value', 'yes');
      });
      await waitFor(() => expect(inputEl(container)).toBeChecked());

      await act(async () => {
        widget.setExposedValue('c1', 'value', 'no');
      });

      await waitFor(() => expect(inputEl(container)).not.toBeChecked());
      expect(widget.exposed().value).toBe(false);
    });
  });

  describe('toggling', () => {
    test('clicking an unchecked box checks it and exposes true', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(false));

      await widget.session.user.click(boxEl(container));

      expect(inputEl(container)).toBeChecked();
      await waitFor(() => expect(widget.exposed().value).toBe(true));
    });

    test('clicking a checked box exposes `false`, not undefined and not the previous true', async () => {
      // The core of the falsy bug class. `false` is a real value here: the
      // exposed store must hold literal `false`, which is a different
      // assertion from "not true".
      const { container } = widget.render({ properties: { defaultValue: binding('{{true}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await widget.session.user.click(boxEl(container));

      expect(inputEl(container)).not.toBeChecked();
      await waitFor(() => expect(widget.exposed().value).toBe(false));
      expect(widget.exposed().value).not.toBeUndefined();
    });

    test('toggling twice returns to the original value rather than getting stuck', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(false));

      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.exposed().value).toBe(true));
      await widget.session.user.click(boxEl(container));

      await waitFor(() => expect(widget.exposed().value).toBe(false));
      expect(inputEl(container)).not.toBeChecked();
    });
  });

  describe('`false` is a real value downstream', () => {
    test('a component bound to the checkbox sees false after it is unchecked', async () => {
      // Both directions of the cascade, in one pass: a Text widget consumes
      // `{{components.checkbox1.value}}` through the real dependency graph.
      // `String(...)` is deliberate — it distinguishes `false` from
      // `undefined` in the DOM, which `{{components.checkbox1.value}}` alone
      // would not (both render as empty text).
      const { container } = widget.render({
        properties: { defaultValue: binding('{{true}}') },
        extraComponents: {
          t1: componentDefinition('t1', 'text1', 'Text', {
            text: binding('{{ "v=" + String(components.checkbox1.value) }}'),
            visibility: binding('{{true}}'),
          }),
        },
        also: [{ id: 't1', componentType: 'Text' }],
      });

      expect(await screen.findByText('v=true')).toBeInTheDocument();

      await widget.session.user.click(boxEl(container));

      expect(await screen.findByText('v=false')).toBeInTheDocument();
    });

    test('a component bound to the checkbox sees true after it is checked', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{false}}') },
        extraComponents: {
          t1: componentDefinition('t1', 'text1', 'Text', {
            text: binding('{{ "v=" + String(components.checkbox1.value) }}'),
            visibility: binding('{{true}}'),
          }),
        },
        also: [{ id: 't1', componentType: 'Text' }],
      });
      // BUG WORKAROUND: mounting the Checkbox and its dependent Text sibling
      // in the same render doesn't resolve Text's initial `{{ }}` binding
      // over the Checkbox's *default* value on its own — nudging the specific
      // edge is what makes the resolved value actually land. Compare the
      // "sees false after unchecked" test above, which starts from `true` and
      // does not need this; only the `false`-starting case hits it.
      await act(async () => {
        store().updateDependencyValues('components.chk1.value', MODULE_ID);
      });

      expect(await screen.findByText('v=false')).toBeInTheDocument();

      await widget.session.user.click(boxEl(container));

      expect(await screen.findByText('v=true')).toBeInTheDocument();
    });
  });

  describe('events', () => {
    test('onChange fires and its handler reads the NEW value, not the previous one', async () => {
      // The stale-read bug class. Starting checked and unchecking is the
      // strictest form: a handler that reads the pre-click value sees `true`,
      // and a handler that reads nothing at all sees `undefined`. Only the
      // correct ordering yields `false`.
      const { container } = widget.render({ properties: { defaultValue: binding('{{true}}') } });
      widget.setEvents(setVariableOn(CHK, 'onChange', { value: '{{components.checkbox1.value}}' }));
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await widget.session.user.click(boxEl(container));
      await drain();

      expect(widget.variables().seen).toBe(false);
    });

    test('onChange fires when checking, and its handler reads true', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      widget.setEvents(setVariableOn(CHK, 'onChange', { value: '{{components.checkbox1.value}}' }));
      await waitFor(() => expect(widget.exposed().value).toBe(false));

      await widget.session.user.click(boxEl(container));
      await drain();

      expect(widget.variables().seen).toBe(true);
    });

    test('onCheck fires only when the box becomes checked', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      widget.setEvents(setVariableOn(CHK, 'onCheck', { key: 'checked', value: 'YES' }));

      await widget.session.user.click(boxEl(container));
      await drain();
      expect(widget.variables().checked).toBe('YES');
    });

    test('onUnCheck fires only when the box becomes unchecked', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{true}}') } });
      widget.setEvents(setVariableOn(CHK, 'onUnCheck', { key: 'unchecked', value: 'YES' }));
      await waitFor(() => expect(inputEl(container)).toBeChecked());

      await widget.session.user.click(boxEl(container));
      await drain();
      expect(widget.variables().unchecked).toBe('YES');
    });

    test('checking does not fire onUnCheck', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      widget.setEvents(setVariableOn(CHK, 'onUnCheck', { key: 'unchecked', value: 'YES' }));

      await widget.session.user.click(boxEl(container));
      await drain();
      expect(widget.variables().unchecked).toBeUndefined();
    });
  });

  describe('disabled', () => {
    test('marks itself disabled to assistive tech when `disabledState` is set', async () => {
      const { container } = widget.render({ properties: { disabledState: binding('{{true}}') } });

      await waitFor(() => expect(inputEl(container)).toHaveAttribute('aria-disabled', 'true'));
      expect(boxEl(container).parentElement).toHaveAttribute('data-disabled', 'true');
    });

    test.failing(
      // BUG: `disabledState` is purely cosmetic on Checkbox. The clickable
      // wrapper div at Checkbox.jsx:190 wires `onClick={handleToggleChange}`
      // with no `disable` guard, and `handleToggleChange` (Checkbox.jsx:163)
      // does not check it either, so a disabled checkbox still toggles, still
      // rewrites its exposed `value`, and still fires onChange/onCheck.
      // Compare Button, which gates its click on the disabled state.
      // Right behaviour: a disabled checkbox ignores clicks entirely.
      'a disabled checkbox cannot be toggled',
      async () => {
        const { container } = widget.render({
          properties: { defaultValue: binding('{{false}}'), disabledState: binding('{{true}}') },
        });
        await waitFor(() => expect(inputEl(container)).toHaveAttribute('aria-disabled', 'true'));

        await widget.session.user.click(boxEl(container));
        await drain();

        expect(inputEl(container)).not.toBeChecked();
        expect(widget.exposed().value).toBe(false);
      }
    );

    test.failing(
      // BUG: same root cause as above (Checkbox.jsx:163, :190) — no disabled
      // guard on the click path, so the event still dispatches.
      // Right behaviour: a disabled checkbox does not fire onChange.
      'a disabled checkbox does not fire onChange',
      async () => {
        const { container } = widget.render({
          properties: { defaultValue: binding('{{false}}'), disabledState: binding('{{true}}') },
        });
        widget.setEvents(setVariableOn(CHK, 'onChange', { key: 'fired', value: 'YES' }));
        await waitFor(() => expect(inputEl(container)).toHaveAttribute('aria-disabled', 'true'));

        await widget.session.user.click(boxEl(container));
        await drain();

        expect(widget.variables().fired).toBeUndefined();
      }
    );
  });

  describe('visibility and loading', () => {
    test('hides itself when `visibility` resolves false', async () => {
      const { container } = widget.render({ properties: { visibility: binding('{{false}}') } });

      await waitFor(() => expect(inputEl(container)).toBeInTheDocument());
      expect(boxEl(container).parentElement).toHaveStyle({ display: 'none' });
    });

    test('shows a loader instead of the box while `loadingState` is set', async () => {
      widget.render({ properties: { loadingState: binding('{{true}}') } });

      await waitFor(() => expect(screen.queryByText('Accept terms')).not.toBeInTheDocument());
    });
  });

  describe('exposed values', () => {
    test('publishes the resolved label', async () => {
      widget.render({ properties: { label: binding('{{ "Accept " + "terms" }}') } });

      await waitFor(() => expect(widget.exposed().label).toBe('Accept terms'));
    });

    test('publishes isVisible, isDisabled and isLoading from its properties', async () => {
      widget.render({
        properties: {
          visibility: binding('{{true}}'),
          disabledState: binding('{{true}}'),
          loadingState: binding('{{false}}'),
        },
      });

      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));
      expect(widget.exposed().isVisible).toBe(true);
      expect(widget.exposed().isLoading).toBe(false);
    });
  });

  describe('component-specific actions', () => {
    test('setValue(true) checks the box and exposes true', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      await waitFor(() => expect(widget.exposed().setValue).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().setValue(true);
      });

      expect(inputEl(container)).toBeChecked();
      expect(widget.exposed().value).toBe(true);
    });

    test('setValue(false) unchecks the box and exposes false, not undefined', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{true}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await act(async () => {
        await widget.exposed().setValue(false);
      });

      expect(inputEl(container)).not.toBeChecked();
      expect(widget.exposed().value).toBe(false);
    });

    test('toggle flips the current value', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      await waitFor(() => expect(widget.exposed().toggle).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().toggle();
      });

      expect(inputEl(container)).toBeChecked();
      expect(widget.exposed().value).toBe(true);
    });

    test('the deprecated setChecked action still sets the value', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      await waitFor(() => expect(widget.exposed().setChecked).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().setChecked(true);
      });

      expect(inputEl(container)).toBeChecked();
      expect(widget.exposed().value).toBe(true);
    });

    test('setDisable(true) disables the box and updates isDisabled', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(widget.exposed().setDisable).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().setDisable(true);
      });

      expect(widget.exposed().isDisabled).toBe(true);
      expect(inputEl(container)).toHaveAttribute('aria-disabled', 'true');
    });

    test('setVisibility(false) hides the box and updates isVisible', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(widget.exposed().setVisibility).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().setVisibility(false);
      });

      expect(widget.exposed().isVisible).toBe(false);
      expect(boxEl(container).parentElement).toHaveStyle({ display: 'none' });
    });

    test('setLoading(true) swaps the box for the loader and updates isLoading', async () => {
      widget.render();
      await waitFor(() => expect(widget.exposed().setLoading).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().setLoading(true);
      });

      expect(widget.exposed().isLoading).toBe(true);
      expect(screen.queryByText('Accept terms')).not.toBeInTheDocument();
    });
  });

  describe('validation', () => {
    test('marks itself required and invalid while a mandatory checkbox is unchecked', async () => {
      // `mandatory` lives on definition.validation, not on properties, so it
      // has to be set between seeding and mount rather than via `properties`.
      const { container } = widget.render({
        properties: { defaultValue: binding('{{false}}') },
        afterSeed: () => widget.setComponentProperty(CHK, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      await waitFor(() => expect(inputEl(container)).toHaveAttribute('aria-required', 'true'));
      expect(inputEl(container)).toHaveAttribute('aria-invalid', 'true');
      expect(widget.exposed().isMandatory).toBe(true);
    });
  });
});
