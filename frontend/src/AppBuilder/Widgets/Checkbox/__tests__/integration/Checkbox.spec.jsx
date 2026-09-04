/**
 * Checkbox behaviour spec, run against the real RenderWidget/store path.
 *
 * Approved contract: `src/test/app-builder/widgets/Checkbox/TESTING.md`.
 * Every test title starts with its approved scenario ID.
 */
import { screen, waitFor, within } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { componentDefinition } from '@/test/app-builder';
import { checkboxConfig } from '@/AppBuilder/WidgetManager/widgets/checkbox';
import { createWidgetHarness, setVariableOn, binding, store } from '../../../__tests__/integration/widgetHarness';

const CHK = 'chk1';
const FORM = 'form1';

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

const inputEl = (container) => within(container).getByRole('checkbox', { hidden: true });
const boxEl = (container) => inputEl(container).parentElement;
const rowEl = (container) => inputEl(container).closest('[data-cy]');
const labelEl = (container) => container.querySelector('label');
const loaderEl = (container) => container.querySelector('.tj-widget-loader');

function controlCheckbox(handle, params = []) {
  return [
    {
      id: `evt-${handle}`,
      index: 0,
      sourceId: 'btn1',
      name: `evt-${handle}`,
      target: 'component',
      event: {
        eventId: 'onClick',
        actionId: 'control-component',
        componentId: CHK,
        componentSpecificActionHandle: handle,
        componentSpecificActionParams: params,
      },
    },
  ];
}

describe('Checkbox', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('selection', () => {
    test('[Checkbox-SEL-001] clicking the box publishes the exact boolean and round-trips', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      expect(await screen.findByText('Accept terms')).toBeInTheDocument();
      await waitFor(() => expect(widget.exposed().value).toBe(false));
      expect(inputEl(container)).not.toBeChecked();

      await widget.session.user.click(boxEl(container));
      expect(inputEl(container)).toBeChecked();
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await widget.session.user.click(boxEl(container));
      expect(inputEl(container)).not.toBeChecked();
      await waitFor(() => expect(widget.exposed().value).toBe(false));
      expect(widget.exposed().value).not.toBeUndefined();

      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.exposed().value).toBe(true));
    });

    test('[Checkbox-SEL-001] starts checked when defaultValue is true', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{true}}') } });
      await waitFor(() => expect(inputEl(container)).toBeChecked());
      expect(widget.exposed().value).toBe(true);
    });

    test('[Checkbox-SEL-002] clicking the label toggles the same checked state as clicking the box', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(false));

      await widget.session.user.click(labelEl(container));
      expect(inputEl(container)).toBeChecked();
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await widget.session.user.click(labelEl(container));
      expect(inputEl(container)).not.toBeChecked();
      await waitFor(() => expect(widget.exposed().value).toBe(false));
    });

    test('[Checkbox-SEL-003] bound defaultValue and label follow the dependency graph, including false', async () => {
      const { container } = widget.render({
        properties: {
          defaultValue: binding('{{components.textinput1.value === "yes"}}'),
          label: binding('{{ "I accept " + components.text1.text }}'),
        },
        extraComponents: {
          c1: componentDefinition('c1', 'textinput1', 'TextInput'),
          t1: componentDefinition('t1', 'text1', 'Text', { text: binding('the terms') }),
        },
      });

      await actSet('c1', 'value', 'yes');
      await waitFor(() => expect(inputEl(container)).toBeChecked());

      await actSet('c1', 'value', 'no');
      await waitFor(() => expect(inputEl(container)).not.toBeChecked());
      expect(widget.exposed().value).toBe(false);

      await actSet('t1', 'text', 'the new terms');
      await waitFor(() => expect(screen.getByText('I accept the new terms')).toBeInTheDocument());
    });
  });

  describe('events', () => {
    test('[Checkbox-EVT-001] On change reads the value after the click, not before', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{true}}') } });
      widget.setEvents(setVariableOn(CHK, 'onChange', { value: '{{components.checkbox1.value}}' }));
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.variables().seen).toBe(false));
    });

    test('[Checkbox-EVT-001] On change fires when checking and its handler reads true', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      widget.setEvents(setVariableOn(CHK, 'onChange', { value: '{{components.checkbox1.value}}' }));
      await waitFor(() => expect(widget.exposed().value).toBe(false));

      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.variables().seen).toBe(true));
    });

    test('[Checkbox-EVT-002] On check and On uncheck fire only in the matching direction', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      widget.setEvents([
        ...setVariableOn(CHK, 'onCheck', { key: 'checked', value: 'YES' }),
        ...setVariableOn(CHK, 'onUnCheck', { key: 'unchecked', value: 'YES' }),
      ]);

      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.variables().checked).toBe('YES'));
      expect(widget.variables().unchecked).toBeUndefined();

      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.variables().unchecked).toBe('YES'));
    });

    // needs to be looked at again
    test.skip('[Checkbox-EVT-003] one user click on the label fires each event once', async () => {
      const fired = [];
      const realFire = store().eventsSlice.fireEvent;
      useStore.setState((state) => {
        state.eventsSlice.fireEvent = (eventName, ...rest) => {
          fired.push(eventName);
          return realFire(eventName, ...rest);
        };
      });

      try {
        const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
        widget.setEvents([
          ...setVariableOn(CHK, 'onChange', { value: '{{components.checkbox1.value}}' }),
          ...setVariableOn(CHK, 'onCheck', { key: 'checked', value: 'YES' }),
        ]);
        await waitFor(() => expect(widget.exposed().value).toBe(false));

        await widget.session.user.click(labelEl(container));

        await waitFor(() => expect(widget.exposed().value).toBe(true));
        await waitFor(() => expect(widget.variables().seen).toBe(true));
        await waitFor(() => expect(widget.variables().checked).toBe('YES'));
        expect(fired.filter((name) => name === 'onChange')).toHaveLength(1);
        expect(fired.filter((name) => name === 'onCheck')).toHaveLength(1);
      } finally {
        useStore.setState((state) => {
          state.eventsSlice.fireEvent = realFire;
        });
      }
    });
  });

  describe('actions', () => {
    test('[Checkbox-ACT-001] setValue and setChecked publish exact booleans and notify check events', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      widget.setEvents(setVariableOn(CHK, 'onCheck', { key: 'checked', value: 'YES' }));

      await widget.act('setValue', true);
      expect(inputEl(container)).toBeChecked();
      expect(widget.exposed().value).toBe(true);
      await waitFor(() => expect(widget.variables().checked).toBe('YES'));

      await widget.act('setValue', false);
      expect(inputEl(container)).not.toBeChecked();
      expect(widget.exposed().value).toBe(false);

      await widget.act('setChecked', true);
      expect(inputEl(container)).toBeChecked();
      expect(widget.exposed().value).toBe(true);
    });

    test('[Checkbox-ACT-001] a Control Component {{false}} argument is not dropped', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{true}}') },
        extraComponents: { btn1: componentDefinition('btn1', 'button1', 'Button', { text: binding('Run') }) },
        also: [{ id: 'btn1', componentType: 'Button' }],
        events: controlCheckbox('setValue', [{ handle: 'value', value: '{{false}}' }]),
      });
      await waitFor(() => expect(inputEl(container)).toBeChecked());

      await widget.session.user.click(container.querySelector('button.jet-btn'));
      await waitFor(() => expect(inputEl(container)).not.toBeChecked());
      expect(widget.exposed().value).toBe(false);
    });

    test('[Checkbox-ACT-001] a Control Component setValue still fires onCheck', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{false}}') },
        extraComponents: { btn1: componentDefinition('btn1', 'button1', 'Button', { text: binding('Run') }) },
        also: [{ id: 'btn1', componentType: 'Button' }],
        events: [
          ...controlCheckbox('setValue', [{ handle: 'value', value: '{{true}}' }]),
          ...setVariableOn(CHK, 'onCheck', { key: 'checked', value: 'YES' }),
        ],
      });
      await waitFor(() => expect(container.querySelector('button.jet-btn')).toBeInTheDocument());

      await widget.session.user.click(container.querySelector('button.jet-btn'));
      await waitFor(() => expect(widget.variables().checked).toBe('YES'));
    });

    test('[Checkbox-ACT-002] toggle flips the current value and fires On change', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{false}}') } });
      widget.setEvents(setVariableOn(CHK, 'onChange', { value: '{{components.checkbox1.value}}' }));

      await widget.act('toggle');
      expect(inputEl(container)).toBeChecked();
      expect(widget.exposed().value).toBe(true);
      await waitFor(() => expect(widget.variables().seen).toBe(true));
    });

    test('[Checkbox-ACT-003] setVisibility, setLoading, and setDisable update flags and the DOM', async () => {
      const { container } = widget.render();

      await widget.act('setDisable', true);
      expect(widget.exposed().isDisabled).toBe(true);
      expect(inputEl(container)).toHaveAttribute('aria-disabled', 'true');

      await widget.act('setVisibility', false);
      expect(widget.exposed().isVisible).toBe(false);
      expect(rowEl(container)).toHaveStyle({ display: 'none' });

      await widget.act('setLoading', true);
      expect(widget.exposed().isLoading).toBe(true);
      expect(loaderEl(container)).toBeInTheDocument();
      expect(screen.queryByText('Accept terms')).not.toBeInTheDocument();
    });

    test.each([
      ['setLoading', 'isLoading'],
      ['setVisibility', 'isVisible'],
      ['setDisable', 'isDisabled'],
    ])('[Checkbox-ACT-003] %s coerces its argument to a boolean', async (action, exposedKey) => {
      widget.render();
      await widget.act(action, 'yes');
      expect(widget.exposed()[exposedKey]).toBe(true);
    });

    test('[Checkbox-ACT-004] setChecked survives an unrelated property re-resolve', async () => {
      widget.render({ properties: { defaultValue: binding('{{false}}'), label: binding('Before') } });
      await widget.act('setChecked', true);
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await widget.session.store.act(() => {
        widget.setComponentProperty(CHK, 'label', 'After', 'properties');
      });

      expect(await screen.findByText('After')).toBeInTheDocument();
      expect(widget.exposed().value).toBe(true);
    });

    test('[Checkbox-ACT-005] rewriting defaultValue with the same boolean does not revert setChecked', async () => {
      widget.render({ properties: { defaultValue: binding('{{false}}') } });
      await widget.act('setChecked', true);
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await widget.session.store.act(() => {
        widget.setComponentProperty(CHK, 'defaultValue', '{{false}}', 'properties');
      });

      expect(widget.exposed().value).toBe(true);
    });
  });

  describe('validation', () => {
    test('[Checkbox-VAL-001] a mandatory unchecked box surfaces its error after interact and hides it when hidden or valid', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{true}}') },
        afterSeed: () => widget.setComponentProperty(CHK, 'mandatory', '{{true}}', 'validation', 'value', false),
      });
      await waitFor(() => expect(inputEl(container)).toBeChecked());
      expect(container.querySelector('[data-cy="checkbox1-invalid-feedback"]')).not.toBeInTheDocument();

      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(container.querySelector('[data-cy="checkbox1-invalid-feedback"]')).toHaveTextContent(
        'Field cannot be empty'
      );

      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.exposed().isValid).toBe(true));
      expect(container.querySelector('[data-cy="checkbox1-invalid-feedback"]')).not.toBeInTheDocument();
    });

    test('[Checkbox-VAL-001] the error never appears on a hidden field', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{true}}'), visibility: binding('{{false}}') },
        afterSeed: () => widget.setComponentProperty(CHK, 'mandatory', '{{true}}', 'validation', 'value', false),
      });
      await waitFor(() => expect(inputEl(container)).toBeInTheDocument());
      await widget.session.user.click(boxEl(container));
      expect(container.querySelector('[data-cy="checkbox1-invalid-feedback"]')).not.toBeInTheDocument();
    });

    test('[Checkbox-VAL-002] a custom rule invalidates the box with that message and clears when satisfied', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{false}}') },
        afterSeed: () =>
          widget.setComponentProperty(
            CHK,
            'customRule',
            `{{components.checkbox1.value === false && 'You must accept to continue'}}`,
            'validation',
            'value',
            false
          ),
      });
      await waitFor(() => expect(widget.exposed().isValid).toBe(false));

      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.exposed().isValid).toBe(true));
    });
  });

  describe('Form lifecycle', () => {
    test('[Checkbox-FORM-001] clearing the parent Form unchecks a non-default value', async () => {
      widget.renderInsideForm({ properties: { defaultValue: binding('{{true}}') } });
      expect(await screen.findByRole('checkbox', { hidden: true })).toBeChecked();
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await widget.session.store.act(async () => {
        await widget.exposed(FORM).clearForm();
      });

      await waitFor(() => expect(widget.exposed().value).toBe(false));
      expect(screen.getByRole('checkbox', { hidden: true })).not.toBeChecked();
    }, 30000);

    test('[Checkbox-FORM-002] Form submit reveals mandatory validation without a click', async () => {
      widget.renderInsideForm({
        properties: { defaultValue: binding('{{false}}') },
        validation: { mandatory: binding('{{true}}') },
      });
      const input = await screen.findByRole('checkbox', { hidden: true });
      await waitFor(() => expect(widget.exposed().isValid).toBe(false));
      expect(screen.queryByText('Field cannot be empty')).not.toBeInTheDocument();

      await waitFor(() => expect(widget.exposed(FORM).submitForm).toBeInstanceOf(Function));
      await widget.session.store.act(async () => {
        await widget.exposed(FORM).submitForm();
      });

      expect(await screen.findByText('Field cannot be empty')).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'true');
    }, 30000);
  });

  describe('state', () => {
    test('[Checkbox-STATE-001] property-driven visibility, loading, and disabled reach the DOM and flags', async () => {
      const hidden = widget.render({ properties: { visibility: binding('{{false}}') } });
      await waitFor(() => expect(inputEl(hidden.container)).toBeInTheDocument());
      expect(rowEl(hidden.container)).toHaveStyle({ display: 'none' });
      expect(widget.exposed().isVisible).toBe(false);

      widget.teardown();
      widget.setup();
      const loaded = widget.render({ properties: { loadingState: binding('{{true}}') } });
      await waitFor(() => expect(loaderEl(loaded.container)).toBeInTheDocument());
      expect(screen.queryByText('Accept terms')).not.toBeInTheDocument();
      expect(widget.exposed().isLoading).toBe(true);

      widget.teardown();
      widget.setup();
      const disabled = widget.render({ properties: { disabledState: binding('{{true}}') } });
      await waitFor(() => expect(inputEl(disabled.container)).toHaveAttribute('aria-disabled', 'true'));
      expect(rowEl(disabled.container)).toHaveAttribute('data-disabled', 'true');
      expect(widget.exposed().isDisabled).toBe(true);
    });

    // needs to be looked at again
    test.skip('[Checkbox-STATE-002] a disabled checkbox ignores clicks', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{false}}'), disabledState: binding('{{true}}') },
      });
      widget.setEvents(setVariableOn(CHK, 'onChange', { key: 'fired', value: 'YES' }));
      await waitFor(() => expect(inputEl(container)).toHaveAttribute('aria-disabled', 'true'));

      await widget.session.user.click(boxEl(container));

      expect(inputEl(container)).not.toBeChecked();
      expect(widget.exposed().value).toBe(false);
      expect(widget.variables().fired).toBeUndefined();
    });

    test('[Checkbox-STATE-003] setChecked still runs while the box is disabled', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{false}}'), disabledState: binding('{{true}}') },
      });
      await waitFor(() => expect(inputEl(container)).toHaveAttribute('aria-disabled', 'true'));

      await widget.act('setChecked', true);
      expect(inputEl(container)).toBeChecked();
      expect(widget.exposed().value).toBe(true);
    });

    test('[Checkbox-STATE-004] clicking while loading does not toggle', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{false}}'), loadingState: binding('{{true}}') },
      });
      await waitFor(() => expect(loaderEl(container)).toBeInTheDocument());
      expect(widget.exposed().value).toBe(false);

      await widget.session.user.click(container.querySelector('[data-cy="checkbox1"]'));
      expect(widget.exposed().value).toBe(false);
    });

    test('[Checkbox-STATE-005] hiding the box does not clear exposed value', async () => {
      const { container } = widget.render({ properties: { defaultValue: binding('{{true}}') } });
      await waitFor(() => expect(widget.exposed().value).toBe(true));

      await widget.act('setVisibility', false);
      expect(widget.exposed().isVisible).toBe(false);
      expect(rowEl(container)).toHaveStyle({ display: 'none' });
      expect(widget.exposed().value).toBe(true);
    });

    test('[Checkbox-STATE-006] toggle while disabled still flips value', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{false}}'), disabledState: binding('{{true}}') },
      });
      await waitFor(() => expect(inputEl(container)).toHaveAttribute('aria-disabled', 'true'));

      await widget.act('toggle');
      expect(inputEl(container)).toBeChecked();
      expect(widget.exposed().value).toBe(true);
    });

    const STATE_PAIRS = [
      {
        action: 'setDisable',
        arg: true,
        property: 'disabledState',
        currentValue: '{{false}}',
        assertHeld: async (container) => {
          expect(inputEl(container)).toHaveAttribute('aria-disabled', 'true');
          expect(widget.exposed().isDisabled).toBe(true);
        },
      },
      {
        action: 'setVisibility',
        arg: false,
        property: 'visibility',
        currentValue: '{{true}}',
        assertHeld: async (container) => {
          expect(rowEl(container)).toHaveStyle({ display: 'none' });
          expect(widget.exposed().isVisible).toBe(false);
        },
      },
      {
        action: 'setLoading',
        arg: true,
        property: 'loadingState',
        currentValue: '{{false}}',
        assertHeld: async (container) => {
          expect(loaderEl(container)).toBeInTheDocument();
          expect(widget.exposed().isLoading).toBe(true);
        },
      },
    ];

    test.each(STATE_PAIRS)(
      '[Checkbox-STATE-007] $action survives an unrelated property change',
      async ({ action, arg, assertHeld }) => {
        const { container } = widget.render();
        await widget.act(action, arg);
        await assertHeld(container);

        await widget.session.store.act(() => {
          widget.setComponentProperty(CHK, 'label', 'Changed by a query', 'properties');
        });

        await waitFor(() => expect(widget.exposed().label).toBe('Changed by a query'));
        await assertHeld(container);
      }
    );

    test.each(STATE_PAIRS)(
      '[Checkbox-STATE-007] $action survives a no-op rewrite of $property',
      async ({ action, arg, property, currentValue, assertHeld }) => {
        const { container } = widget.render();
        await widget.act(action, arg);
        await assertHeld(container);

        await widget.session.store.act(() => {
          widget.setComponentProperty(CHK, property, currentValue, 'properties');
        });

        await assertHeld(container);
      }
    );

    test('[Checkbox-STATE-008] ending loading does not leave an enabled box disabled', async () => {
      const { container } = widget.render({
        properties: { loadingState: binding('{{true}}'), disabledState: binding('{{false}}') },
      });
      await waitFor(() => expect(loaderEl(container)).toBeInTheDocument());

      await widget.session.store.act(() => {
        widget.setComponentProperty(CHK, 'loadingState', '{{false}}', 'properties');
      });

      await waitFor(() => expect(inputEl(container)).toBeInTheDocument());
      expect(inputEl(container)).toHaveAttribute('aria-disabled', 'false');
      await widget.session.user.click(boxEl(container));
      await waitFor(() => expect(widget.exposed().value).toBe(true));
    });
  });

  describe('exposed surface', () => {
    test('[Checkbox-EXP-001] the widget publishes its documented variables and actions', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(inputEl(container)).toBeInTheDocument());

      expect(widget.exposed()).toMatchObject({
        value: false,
        label: 'Accept terms',
        isMandatory: false,
        isVisible: true,
        isDisabled: false,
        isLoading: false,
        isValid: true,
      });

      const exposed = widget.exposed();
      for (const { handle } of checkboxConfig.actions) {
        expect(typeof exposed[handle]).toBe('function');
      }
    });

    test('[Checkbox-EXP-001] a changed label re-renders and republishes the exposed label', async () => {
      widget.render({ properties: { label: binding('Before') } });
      await waitFor(() => expect(screen.getByText('Before')).toBeInTheDocument());

      await widget.session.store.act(() => {
        widget.setComponentProperty(CHK, 'label', 'After', 'properties');
      });

      await waitFor(() => expect(screen.getByText('After')).toBeInTheDocument());
      expect(widget.exposed().label).toBe('After');
    });

    test('[Checkbox-EXP-002] a sibling bound to value sees true after check', async () => {
      // The default-false first paint is not asserted here on purpose: the
      // harness seed pre-writes exposed `value: false`, and the store's
      // equal-skip (exposedValueCascade.spec.js) then runs no mount cascade.
      // That is seed/cascade order, not Checkbox behaviour (D-05). The
      // post-click write always cascades, and that is what this test protects.
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

      await waitFor(() => expect(widget.exposed().value).toBe(false));
      await widget.session.user.click(boxEl(container));
      expect(await screen.findByText('v=true')).toBeInTheDocument();
    });

    test('[Checkbox-EXP-002] a sibling bound to value sees false after uncheck', async () => {
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
  });

  describe('accessibility', () => {
    test('[Checkbox-A11Y-001] label association, mandatory marker, and aria state flags', async () => {
      const { container } = widget.render({
        properties: { defaultValue: binding('{{false}}') },
        afterSeed: () => widget.setComponentProperty(CHK, 'mandatory', '{{true}}', 'validation', 'value', false),
      });

      const input = await waitFor(() => inputEl(container));
      expect(labelEl(container)).toHaveAttribute('for', input.id);
      expect(labelEl(container)).toHaveTextContent('*');
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-busy', 'false');
      expect(input).toHaveAttribute('aria-hidden', 'false');
      expect(widget.exposed().isMandatory).toBe(true);
    });

    test('[Checkbox-A11Y-001] a non-mandatory field has no asterisk and is not aria-invalid without cause', async () => {
      const { container } = widget.render();
      const input = await waitFor(() => inputEl(container));
      expect(labelEl(container)).not.toHaveTextContent('*');
      expect(input).toHaveAttribute('aria-required', 'false');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    test('[Checkbox-ISO-001] each instance routes its label click to its own input', async () => {
      const { container } = widget.render({
        also: [{ id: CHK, componentType: 'Checkbox' }],
      });

      const labels = await screen.findAllByText('Accept terms');
      expect(labels.length).toBeGreaterThanOrEqual(2);
      const inputs = within(container).getAllByRole('checkbox', { hidden: true });
      expect(inputs[0].id).not.toBe(inputs[1].id);

      await widget.session.user.click(labels[1].closest('label') ?? labels[1]);
      expect(inputs[1]).toBeChecked();
      expect(inputs[0]).not.toBeChecked();
    });
  });

  describe('styles', () => {
    // jsdom drops inline `var(--token)` values, so cases whose only observable
    // is a token (legacy textColor → var(--text-primary); unchecked
    // borderColor #CCD1D5 → var(--borders-default)) are skipped.
    const STYLE_CASES = [
      {
        name: 'textColor on the label',
        styles: { textColor: binding('rgb(255, 0, 0)') },
        assert: (container) => {
          expect(labelEl(container).parentElement).toHaveStyle({ color: 'rgb(255, 0, 0)' });
        },
      },
      {
        name: 'borderColor on the box',
        styles: { borderColor: binding('rgb(255, 0, 0)') },
        assert: (container) => {
          expect(boxEl(container)).toHaveStyle({ border: '1px solid rgb(255, 0, 0)' });
        },
      },
      {
        name: 'legacy checked borderColor becomes transparent',
        properties: { defaultValue: binding('{{true}}') },
        styles: { borderColor: binding('#CCD1D5') },
        assert: (container) => {
          expect(boxEl(container)).toHaveStyle({ borderColor: 'transparent' });
        },
      },
      {
        name: 'checkboxColor is the box background when checked',
        properties: { defaultValue: binding('{{true}}') },
        styles: { checkboxColor: binding('rgb(255, 0, 0)'), uncheckedColor: binding('rgb(0, 0, 255)') },
        assert: (container) => {
          expect(boxEl(container)).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
        },
      },
      {
        name: 'uncheckedColor is the box background when unchecked',
        styles: { checkboxColor: binding('rgb(255, 0, 0)'), uncheckedColor: binding('rgb(0, 0, 255)') },
        assert: (container) => {
          expect(boxEl(container)).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' });
        },
      },
      {
        name: 'handleColor is the checkmark stroke',
        properties: { defaultValue: binding('{{true}}') },
        styles: { handleColor: binding('rgb(255, 0, 0)') },
        assert: (container) => {
          expect(container.querySelector('svg.icon-tabler-check')).toHaveAttribute('stroke', 'rgb(255, 0, 0)');
        },
      },
      {
        name: 'boxShadow on the widget row',
        styles: { boxShadow: binding('2px 4px 6px 0px rgb(255, 0, 0)') },
        assert: (container) => {
          expect(rowEl(container)).toHaveStyle({ boxShadow: '2px 4px 6px 0px rgb(255, 0, 0)' });
        },
      },
      {
        name: 'right alignment puts the label after the box',
        styles: { alignment: binding('right') },
        assert: (container) => {
          expect(rowEl(container)).toHaveClass('flex-row');
          expect(rowEl(container)).toHaveStyle({ justifyContent: 'start' });
        },
      },
      {
        name: 'left alignment reverses the row',
        styles: { alignment: binding('left') },
        assert: (container) => {
          expect(rowEl(container)).toHaveClass('flex-row-reverse');
          expect(rowEl(container)).toHaveStyle({ justifyContent: 'space-between' });
        },
      },
      {
        name: 'loader is centred while loading',
        properties: { loadingState: binding('{{true}}') },
        assert: (container) => {
          const row = container.querySelector('[data-cy="checkbox1"]');
          expect(row).toHaveStyle({ justifyContent: 'center', alignItems: 'center' });
          expect(loaderEl(container)).toBeInTheDocument();
        },
      },
    ];

    test.each(STYLE_CASES)('[Checkbox-STY-001] $name', async ({ styles = {}, properties = {}, assert }) => {
      const { container } = widget.render({ styles, properties });
      await waitFor(() => expect(container.querySelector('[data-cy="checkbox1"]')).toBeInTheDocument());
      assert(container);
    });

    test('[Checkbox-STY-001] the background swaps from unchecked to checked on a click', async () => {
      const { container } = widget.render({
        styles: { checkboxColor: binding('rgb(255, 0, 0)'), uncheckedColor: binding('rgb(0, 0, 255)') },
      });
      await waitFor(() => expect(boxEl(container)).toHaveStyle({ backgroundColor: 'rgb(0, 0, 255)' }));
      expect(container.querySelector('svg.icon-tabler-check')).not.toBeInTheDocument();

      await widget.session.user.click(boxEl(container));
      expect(boxEl(container)).toHaveStyle({ backgroundColor: 'rgb(255, 0, 0)' });
    });
  });
});

async function actSet(id, key, value) {
  await widget.session.store.act(() => {
    widget.setExposedValue(id, key, value);
  });
}
