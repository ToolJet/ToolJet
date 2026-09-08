/**
 * TextInput — behaviour spec against the real store, the real resolver and the
 * real event pipeline. Nothing about the widget is mocked. Shared setup lives
 * in ./widgetHarness.js.
 *
 * TextInput is the origin of the bug class this suite exists for: "the event
 * fired but the handler read the previous value". `onChange` is dispatched by
 * useInput.handleChange immediately after setInputValue writes the exposed
 * value, and the write is only *queued* for the dependency cascade
 * (resolvedSlice.scheduleDependencyUpdate uses queueMicrotask — see
 * _stores/__tests__/integration/exposedValueCascade.spec.js). What keeps the
 * handler honest is the `flushImplicitBatchEntries()` call at the top of
 * eventsSlice.fireEvent (eventsSlice.js:93). The onChange tests below are the
 * end-to-end proof of that line.
 *
 * Every test mounts the TextInput plus a Text mirror bound to
 * `{{components.textinput1.value}}`, so the canvas-visible half of the
 * cascade can be asserted on directly.
 */
import { screen, waitFor, act } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding, store, MODULE_ID } from './widgetHarness';

const INPUT_ID = 'inp1';
const MIRROR_ID = 'txt1';

const widget = createWidgetHarness({
  componentType: 'TextInput',
  handle: 'textinput1',
  id: INPUT_ID,
  defaultProperties: {
    label: binding('Label'),
    placeholder: binding('Enter your input'),
    value: binding(''),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    showClearBtn: binding('{{false}}'),
  },
  // The schema's own default styles. Without them `styles.width` is undefined
  // and BaseInput's `hasLabel` is false, so the label collapses into an
  // aria-label instead of rendering — see BaseInput.jsx:79.
  defaultStyles: {
    alignment: binding('side'),
    direction: binding('left'),
    auto: binding('{{true}}'),
    width: binding('{{33}}'),
    widthType: binding('ofComponent'),
    labelFontSize: binding('{{12}}'),
    borderRadius: binding('{{6}}'),
  },
  defaultExtraComponents: {
    [MIRROR_ID]: componentDefinition(MIRROR_ID, 'text1', 'Text', {
      text: binding('{{components.textinput1.value}}'),
    }),
  },
  defaultAlso: [{ id: MIRROR_ID, componentType: 'Text' }],
});

/** An event handler row in the shape eventsSlice.executeAction consumes. */
function setCustomVariableOnChange(key, valueExpression) {
  return [
    {
      id: 'evt-1',
      index: 0,
      sourceId: INPUT_ID,
      target: 'component',
      event: { eventId: 'onChange', actionId: 'set-custom-variable', key, value: valueExpression },
    },
  ];
}

describe('TextInput', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  async function mount(options) {
    const rendered = widget.render(options);
    await waitFor(() => expect(rendered.container.querySelector('input')).toBeInTheDocument());
    return { ...rendered, input: rendered.container.querySelector('input') };
  }

  describe('value', () => {
    test('typing updates the input DOM value and its own exposed value', async () => {
      const { input } = await mount();

      await widget.session.user.type(input, 'hello');

      expect(input).toHaveValue('hello');
      expect(widget.exposed().value).toBe('hello');
    });

    test('the configured default value is what the input renders on mount', async () => {
      const { input } = await mount({ properties: { value: binding('seeded') } });

      expect(input).toHaveValue('seeded');
      expect(widget.exposed().value).toBe('seeded');
    });

    test('a `{{ }}` default value is resolved before it reaches the input', async () => {
      const { input } = await mount({ properties: { value: binding('{{ "a" + "b" }}') } });

      expect(input).toHaveValue('ab');
    });
  });

  describe('onChange', () => {
    test('the onChange handler reads the value that was just typed, not the previous one', async () => {
      // THE regression this whole suite exists for. `set-custom-variable` runs
      // with value `{{components.textinput1.value}}`; a one-interaction lag
      // shows up as 'ab' after typing 'abc'.
      const { input } = await mount({ events: setCustomVariableOnChange('seen', '{{components.textinput1.value}}') });

      await widget.session.user.type(input, 'abc');

      expect(store().getVariable('seen', MODULE_ID)).toBe('abc');
    });

    test('every keystroke advances the onChange handler in lockstep with the input', async () => {
      const { input } = await mount({ events: setCustomVariableOnChange('seen', '{{components.textinput1.value}}') });

      for (const expectedSoFar of ['a', 'ab', 'abc']) {
        await widget.session.user.type(input, expectedSoFar.slice(-1));
        expect(store().getVariable('seen', MODULE_ID)).toBe(expectedSoFar);
      }
    });

    test('a component bound to the input value updates on canvas after the cascade', async () => {
      const { container, input } = await mount();

      await widget.session.user.type(input, 'mirrored');

      // One microtask, not zero: scheduleDependencyUpdate queues the cascade,
      // so both the resolved store entry and the DOM need the retry loop.
      await waitFor(() => {
        expect(store().getResolvedComponent(MIRROR_ID, undefined, MODULE_ID).properties.text).toBe('mirrored');
        expect(container.querySelector('[data-cy="text1-text"]')).toHaveTextContent('mirrored');
      });
    });
  });

  describe('properties', () => {
    test('the placeholder reaches the input element', async () => {
      const { input } = await mount({ properties: { placeholder: binding('type here') } });

      expect(input).toHaveAttribute('placeholder', 'type here');
    });

    test('disabledState disables the input so typing cannot change it', async () => {
      const { input } = await mount({ properties: { disabledState: binding('{{true}}') } });

      expect(input).toBeDisabled();
      await widget.session.user.type(input, 'nope');
      expect(input).toHaveValue('');
    });

    test('visibility false hides the field and marks it aria-hidden', async () => {
      const { container, input } = await mount({ properties: { visibility: binding('{{false}}') } });

      expect(container.querySelector('.text-input')).toHaveClass('invisible');
      expect(input).toHaveAttribute('aria-hidden', 'true');
    });

    test('the label is rendered next to the input', async () => {
      await mount({ properties: { label: binding('Full name') } });

      expect(screen.getByText('Full name')).toBeInTheDocument();
    });

    test('showClearBtn renders a clear button only once the field has a value', async () => {
      const { container, input } = await mount({ properties: { showClearBtn: binding('{{true}}') } });

      expect(container.querySelector('.tj-input-clear-btn')).not.toBeInTheDocument();
      await widget.session.user.type(input, 'x');
      expect(container.querySelector('.tj-input-clear-btn')).toBeInTheDocument();
    });

    test('the clear button empties the field and fires onChange', async () => {
      const { container, input } = await mount({
        properties: { showClearBtn: binding('{{true}}'), value: binding('preset') },
        events: setCustomVariableOnChange('seen', '{{components.textinput1.value}}'),
      });

      await widget.session.user.click(container.querySelector('.tj-input-clear-btn'));

      expect(input).toHaveValue('');
      expect(widget.exposed().value).toBe('');
      expect(store().getVariable('seen', MODULE_ID)).toBe('');
    });
  });

  describe('validation', () => {
    test('a mandatory field is invalid while empty and valid once filled', async () => {
      const { input } = await mount({ validation: { mandatory: binding('{{true}}') } });

      expect(widget.exposed().isValid).toBe(false);
      await widget.session.user.type(input, 'a');
      expect(widget.exposed().isValid).toBe(true);
    });

    test('exceeding maxLength invalidates the field and shows the error after blur', async () => {
      const { input } = await mount({ validation: { maxLength: { value: '3' } } });

      await widget.session.user.type(input, 'abcd');
      expect(widget.exposed().isValid).toBe(false);

      await widget.session.user.tab();
      expect(await screen.findByText('Maximum 3 characters is allowed')).toBeInTheDocument();
    });

    test('a value that fails the regex is invalid', async () => {
      const { input } = await mount({ validation: { regex: { value: '^[0-9]+$' } } });

      await widget.session.user.type(input, 'abc');
      expect(widget.exposed().isValid).toBe(false);
      expect(widget.exposed().value).toBe('abc');
    });

    test('an invalid field is marked aria-invalid once it has been blurred', async () => {
      const { input } = await mount({ validation: { minLength: { value: '5' } } });

      await widget.session.user.type(input, 'ab');
      expect(input).toHaveAttribute('aria-invalid', 'false');

      await widget.session.user.tab();
      await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'));
    });
  });

  describe('component actions', () => {
    test('setText writes the input, the exposed value and fires onChange', async () => {
      const { input } = await mount({ events: setCustomVariableOnChange('seen', '{{components.textinput1.value}}') });

      await act(async () => {
        await widget.exposed().setText('from action');
      });

      expect(input).toHaveValue('from action');
      expect(widget.exposed().value).toBe('from action');
      expect(store().getVariable('seen', MODULE_ID)).toBe('from action');
    });

    test('clear empties the input', async () => {
      const { input } = await mount({ properties: { value: binding('preset') } });

      await act(async () => {
        await widget.exposed().clear();
      });

      expect(input).toHaveValue('');
      expect(widget.exposed().value).toBe('');
    });

    test('setFocus focuses the input element', async () => {
      const { input } = await mount();

      await act(async () => {
        await widget.exposed().setFocus();
      });

      expect(input).toHaveFocus();
    });

    test('setDisable disables the input and updates isDisabled', async () => {
      const { input } = await mount();

      await act(async () => {
        await widget.exposed().setDisable(true);
      });

      expect(input).toBeDisabled();
      expect(widget.exposed().isDisabled).toBe(true);
    });

    test('setVisibility hides the input and updates isVisible', async () => {
      const { container } = await mount();

      await act(async () => {
        await widget.exposed().setVisibility(false);
      });

      expect(container.querySelector('.text-input')).toHaveClass('invisible');
      expect(widget.exposed().isVisible).toBe(false);
    });
  });

  describe('onEnterPressed', () => {
    test('pressing Enter fires onEnterPressed with the current value', async () => {
      const events = [
        {
          id: 'evt-enter',
          index: 0,
          sourceId: INPUT_ID,
          target: 'component',
          event: {
            eventId: 'onEnterPressed',
            actionId: 'set-custom-variable',
            key: 'submitted',
            value: '{{components.textinput1.value}}',
          },
        },
      ];
      const { input } = await mount({ events });

      await widget.session.user.type(input, 'query{Enter}');

      expect(store().getVariable('submitted', MODULE_ID)).toBe('query');
    });
  });
});
