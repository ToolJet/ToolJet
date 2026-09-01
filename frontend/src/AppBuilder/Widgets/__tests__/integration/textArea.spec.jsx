/**
 * TextArea (src/AppBuilder/Widgets/TextArea.jsx) rendered for real. Shared
 * setup lives in ./widgetHarness.js.
 *
 * Real composed store -> real RenderWidget -> real TextArea/BaseInput/useInput ->
 * real resolver. Nothing about the widget is mocked.
 *
 * Scope note — this file deliberately does NOT re-cover what TextInput covers.
 * The thing TextArea does that no single-line input can is carry `\n`, and a
 * newline is exactly the character that a plain `<input>` silently eats, that a
 * length validation counts, and that has to survive the exposed-value ->
 * dependency-graph -> resolver round trip. So most tests here are about newlines.
 *
 * Mutation testing note: TextArea.jsx's own job is small — it resolves
 * `isDynamicHeightEnabled`, sizes the textarea, and forwards `props` +
 * `useInput()`'s return to BaseInput with `inputType="textarea"`. `useInput` and
 * `BaseInput` are SHARED with TextInput/EmailInput/PasswordInput/..., so they are
 * never mutated to verify this file. Every test below was verified by breaking a
 * line in TextArea.jsx only (the forwarding it does is genuinely its own
 * responsibility); the mutation used is named in each test's comment.
 */
import { screen, waitFor, fireEvent as domFireEvent } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding, store, MODULE_ID, drain } from './widgetHarness';

const ID = 'ta1';
const NAME = 'textarea1';

const widget = createWidgetHarness({
  componentType: 'TextArea',
  handle: NAME,
  id: ID,
  // `visibility` MUST be seeded explicitly — falsy visibility renders the
  // wrapper `invisible`, marks the textarea aria-hidden, AND suppresses the
  // validation-error element (BaseInput.jsx:296). Every test would then be
  // asserting against a hidden widget.
  defaultProperties: { visibility: binding('{{true}}') },
  // `styles.width` / `styles.auto` are likewise required — Label renders
  // nothing unless `width > 0 || auto` (Label.jsx:31).
  defaultStyles: { width: binding('{{33}}'), auto: binding('{{true}}'), alignment: binding('side') },
  widgetHeight: 100,
});

/** Seeds the TextArea, plus optionally a Text widget bound to its value. */
function mount({ boundText = null, ...options } = {}) {
  const extraComponents = boundText
    ? { txt: componentDefinition('txt', 'text1', 'Text', { text: binding(boundText) }) }
    : {};
  return widget.render({
    ...options,
    extraComponents,
    also: boundText ? [{ id: 'txt', componentType: 'Text', widgetHeight: 40 }] : [],
  });
}

const textarea = (container) => container.querySelector('textarea');
const exposed = () => widget.exposed();

/** An `onChange` handler that records what the ACTION resolved, into a variable. */
function attachOnChangeCapture(value = `{{components.${NAME}.value}}`, key = 'seenByHandler') {
  widget.setEvents([
    {
      id: 'evt-change',
      name: 'onChange',
      index: 0,
      sourceId: ID,
      target: 'component',
      event: { eventId: 'onChange', actionId: 'set-custom-variable', key, value },
    },
  ]);
}

describe('TextArea', () => {
  beforeEach(widget.setup);
  // MUST be afterEach: a failed assertion (and a `test.failing` body, which
  // throws by design) skips inline cleanup, leaking an open bracket into the
  // next test.
  afterEach(widget.teardown);

  describe('rendering', () => {
    test('renders a textarea — not an input — carrying its default value', async () => {
      // Mutation: TextArea.jsx:59 inputType="textarea" -> "text". BaseInput then
      // renders <input> (BaseInput.jsx:21) and this fails on the null textarea.
      const { container } = mount({ properties: { value: binding('already typed') } });

      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      expect(container.querySelector('input')).toBeNull();
      expect(textarea(container)).toHaveValue('already typed');
    });

    test('a multi-line default value reaches the DOM with its newlines intact', async () => {
      // Mutation: TextArea.jsx:59 inputType="textarea" -> "text". An <input>
      // element's value setter strips newlines, so the DOM shows "onetwothree".
      const value = 'one\ntwo\nthree';
      const { container } = mount({ properties: { value: binding(value) } });

      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      expect(textarea(container)).toHaveValue(value);
      expect(textarea(container).value.split('\n')).toHaveLength(3);
    });

    test('a default value that begins AND ends with a newline keeps both', async () => {
      // The interesting case: HTML strips a single leading newline immediately
      // after the <textarea> open tag when parsing markup, so a value round-
      // tripped through innerHTML loses it. React sets .value directly, which is
      // what keeps this honest.
      // Mutation: TextArea.jsx:59 inputType="textarea" -> "text" (input eats both).
      const value = '\nmiddle\n';
      const { container } = mount({ properties: { value: binding(value) } });

      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      expect(textarea(container).value).toBe(value);
      expect(textarea(container).value.startsWith('\n')).toBe(true);
      expect(textarea(container).value.endsWith('\n')).toBe(true);
    });

    test('renders its placeholder', async () => {
      // Mutation: in TextArea.jsx's BaseInput call, add
      // `properties={{ ...properties, placeholder: 'x' }}` after `{...props}`.
      const { container } = mount({ properties: { value: binding(''), placeholder: binding('Type your notes') } });

      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      expect(textarea(container)).toHaveAttribute('placeholder', 'Type your notes');
    });

    test('sizes the textarea to fill the widget when dynamic height is off', async () => {
      // This is TextArea.jsx's own layout contract (:16-19): outside dynamic
      // height the element is stretched to 100% and the wrapper does the sizing.
      // Mutation: TextArea.jsx:17 `'100%'` -> `'50px'`.
      const { container } = mount({ properties: { value: binding('a\nb\nc\nd\ne') } });

      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      expect(textarea(container).style.height).toBe('100%');
    });

    test('dynamic height is inert in edit mode even when the property is on', async () => {
      // TextArea.jsx:11 — `properties.dynamicHeight && currentMode === 'view'`.
      // In the editor the author sizes the box, so the textarea must stay at
      // 100% rather than auto-growing to its scrollHeight.
      // Mutation: TextArea.jsx:11 drop `&& currentMode === 'view'`; the branch at
      // :20-35 then runs and writes a px height.
      const { container } = mount({
        properties: { value: binding('a\nb\nc\nd\ne\nf\ng'), dynamicHeight: binding('{{true}}') },
      });

      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      expect(textarea(container).style.height).toBe('100%');
    });
  });

  describe('typing', () => {
    test('typing updates the exposed value', async () => {
      // Mutation: in TextArea.jsx's BaseInput call, add `handleChange={() => {}}`
      // after `{...inputLogic}` — the widget stops forwarding useInput's change
      // handler and the exposed value never moves off the default.
      const { container } = mount({ properties: { value: binding('') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.user.type(textarea(container), 'hello');

      expect(exposed().value).toBe('hello');
      expect(textarea(container)).toHaveValue('hello');
    });

    test('typing several lines exposes the newlines, not a flattened string', async () => {
      // The multi-line half of the same wiring: a textarea's Enter key inserts a
      // newline into the value instead of submitting.
      // Mutation: `handleChange={() => {}}` after `{...inputLogic}` in TextArea.jsx.
      const { container } = mount({ properties: { value: binding('') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.user.type(textarea(container), 'first{enter}second{enter}third');

      expect(exposed().value).toBe('first\nsecond\nthird');
      expect(textarea(container)).toHaveValue('first\nsecond\nthird');
    });

    test('a pasted block of text keeps every newline, including a trailing one', async () => {
      // Paste is the realistic way a multi-line value arrives, and it goes
      // through the same change handler as typing.
      // Mutation: `handleChange={() => {}}` after `{...inputLogic}` in TextArea.jsx.
      const { container } = mount({ properties: { value: binding('') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.user.click(textarea(container));
      await widget.session.user.paste('line one\n\nline three\n');

      expect(exposed().value).toBe('line one\n\nline three\n');
    });
  });

  describe('onChange', () => {
    test('the handler sees the value that was JUST typed, not the previous one', async () => {
      // The classic one-interaction-behind bug: useInput's handleChange writes
      // the exposed value and then fires the event (useInput.js:303-306), so a
      // handler reading {{components.textarea1.value}} must already see the new
      // character. Two edits in a row is where a lag would show up.
      // Mutation: `handleChange={() => {}}` after `{...inputLogic}` in TextArea.jsx.
      const { container } = mount({ properties: { value: binding('') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      attachOnChangeCapture();

      await widget.session.user.type(textarea(container), 'a');
      await drain();
      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('a');

      await widget.session.user.type(textarea(container), 'b');
      await drain();
      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('ab');
    });

    test('the handler sees a multi-line value with its newlines preserved', async () => {
      // Newlines have to survive the exposed-value write and the action's own
      // `{{ }}` resolution, not just the DOM.
      // Mutation: `handleChange={() => {}}` after `{...inputLogic}` in TextArea.jsx.
      const { container } = mount({ properties: { value: binding('') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      attachOnChangeCapture();

      await widget.session.user.click(textarea(container));
      await widget.session.user.paste('top\nbottom');
      await drain();

      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('top\nbottom');
    });
  });

  describe('cascade into another component', () => {
    test('a Text widget bound to the value catches up within one microtask', async () => {
      // Mutation: `handleChange={() => {}}` after `{...inputLogic}` in TextArea.jsx.
      const { container } = mount({ properties: { value: binding('') }, boundText: `{{components.${NAME}.value}}` });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.user.type(textarea(container), 'shared');
      await Promise.resolve();

      expect(store().getResolvedComponent('txt').properties.text).toBe('shared');
    });

    test('a bound component receives the multi-line value unflattened', async () => {
      // Mutation: `handleChange={() => {}}` after `{...inputLogic}` in TextArea.jsx.
      const { container } = mount({ properties: { value: binding('') }, boundText: `{{components.${NAME}.value}}` });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.user.click(textarea(container));
      await widget.session.user.paste('alpha\nbeta');
      await Promise.resolve();

      expect(store().getResolvedComponent('txt').properties.text).toBe('alpha\nbeta');
    });

    test('a binding on the newline count resolves — the value is a real string', async () => {
      // Proves the cascade carries a string rather than something the resolver
      // has already stringified/escaped: `.split('\n').length` only works on the
      // genuine article.
      // Mutation: `handleChange={() => {}}` after `{...inputLogic}` in TextArea.jsx.
      const { container } = mount({
        properties: { value: binding('') },
        boundText: `{{components.${NAME}.value.split('\\n').length}}`,
      });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.user.click(textarea(container));
      await widget.session.user.paste('1\n2\n3\n4');
      await Promise.resolve();

      // '4' as a string, not 4: the Text widget's `text` property is declared as
      // a string in its schema, so the resolver coerces the resolved number.
      expect(store().getResolvedComponent('txt').properties.text).toBe('4');
    });
  });

  describe('declared properties', () => {
    test('disabledState disables the textarea', async () => {
      // Mutation: in TextArea.jsx's BaseInput call, add `disable={false}` after
      // `{...inputLogic}`.
      const { container } = mount({ properties: { value: binding(''), disabledState: binding('{{true}}') } });

      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      expect(textarea(container)).toBeDisabled();
      expect(exposed().isDisabled).toBe(true);
    });

    test('visibility false hides the textarea from the accessibility tree', async () => {
      // Mutation: in TextArea.jsx's BaseInput call, add `visibility={true}` after
      // `{...inputLogic}`.
      const { container } = mount({ properties: { value: binding(''), visibility: binding('{{false}}') } });

      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      expect(textarea(container)).toHaveAttribute('aria-hidden', 'true');
      expect(container.querySelector('.text-input')).toHaveClass('invisible');
      expect(exposed().isVisible).toBe(false);
    });

    test('loadingState renders the loader and disables input', async () => {
      // Mutation: in TextArea.jsx's BaseInput call, add `loading={false}` after
      // `{...inputLogic}`.
      const { container } = mount({ properties: { value: binding(''), loadingState: binding('{{true}}') } });

      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      expect(textarea(container)).toBeDisabled();
      expect(textarea(container)).toHaveAttribute('aria-busy', 'true');
      expect(exposed().isLoading).toBe(true);
    });

    test('the label is rendered and exposed', async () => {
      // Mutation: in TextArea.jsx's BaseInput call, add
      // `properties={{ ...properties, label: '' }}` after `{...props}`.
      mount({ properties: { value: binding(''), label: binding('Notes') } });

      expect(await screen.findByText('Notes')).toBeInTheDocument();
      expect(exposed().label).toBe('Notes');
    });
  });

  describe('validation', () => {
    test('a maxLength violation exposes isValid false and shows the error on blur', async () => {
      // Mutation: in TextArea.jsx's BaseInput call, add
      // `isValid={true} showValidationError={false}` after `{...inputLogic}`.
      const { container } = mount({
        properties: { value: binding('') },
        validation: { maxLength: { value: '3' } },
      });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.user.type(textarea(container), 'abcd');
      await widget.session.user.tab();

      expect(exposed().isValid).toBe(false);
      expect(await screen.findByText('Maximum 3 characters is allowed')).toBeInTheDocument();
    });

    test('newlines count towards maxLength like any other character', async () => {
      // TextArea-specific: 'a\nb' is three characters, not two. If newlines were
      // stripped anywhere between the DOM and validateWidget, this would pass a
      // maxLength of 2.
      // Mutation: in TextArea.jsx's BaseInput call, add `isValid={true}` after
      // `{...inputLogic}`.
      const { container } = mount({
        properties: { value: binding('') },
        validation: { maxLength: { value: '2' } },
      });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.user.click(textarea(container));
      await widget.session.user.paste('a\nb');

      expect(exposed().value).toBe('a\nb');
      expect(exposed().isValid).toBe(false);
    });

    test('a mandatory field is invalid while empty and valid once a newline-only value is entered', async () => {
      // A newline-only value is non-empty, so `mandatory` must accept it — the
      // emptiness check is `!widgetValue` (componentsSlice.js:857).
      // Mutation: in TextArea.jsx's BaseInput call, add `isValid={true}` after
      // `{...inputLogic}` (the first assertion below still passes, the last fails).
      const { container } = mount({
        properties: { value: binding('') },
        validation: { mandatory: { value: '{{true}}' } },
      });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      expect(exposed().isValid).toBe(false);
      expect(exposed().isMandatory).toBe(true);

      await widget.session.user.click(textarea(container));
      await widget.session.user.paste('\n');

      expect(exposed().value).toBe('\n');
      expect(exposed().isValid).toBe(true);
    });

    test('a regex is applied to the whole multi-line value', async () => {
      // `^\\w+$` without the `m` flag must reject a value containing a newline.
      // Mutation: in TextArea.jsx's BaseInput call, add `isValid={true}` after
      // `{...inputLogic}`.
      const { container } = mount({
        properties: { value: binding('') },
        validation: { regex: { value: '^\\w+$' } },
      });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.user.click(textarea(container));
      await widget.session.user.paste('one\ntwo');

      expect(exposed().isValid).toBe(false);
    });
  });

  describe('component-specific actions', () => {
    test('setText writes a multi-line value to the DOM, the store and onChange', async () => {
      // Mutation: TextArea.jsx:59 inputType="textarea" -> "currency". useInput
      // then skips registering `setText` entirely (useInput.js:241-247).
      const { container } = mount({ properties: { value: binding('start') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      attachOnChangeCapture();

      await widget.session.store.act(async () => {
        await exposed().setText('set\nby\naction');
      });
      await drain();

      expect(exposed().value).toBe('set\nby\naction');
      expect(textarea(container)).toHaveValue('set\nby\naction');
      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('set\nby\naction');
    });

    test('clear empties a multi-line value and fires onChange', async () => {
      // Mutation: TextArea.jsx:59 inputType="textarea" -> "phone". `clear` then
      // routes through setPhoneInputValue (useInput.js:297) and the exposed value
      // becomes '+1' rather than ''.
      const { container } = mount({ properties: { value: binding('a\nb\nc') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      attachOnChangeCapture();

      await widget.session.store.act(async () => {
        await exposed().clear();
      });
      await drain();

      expect(exposed().value).toBe('');
      expect(textarea(container)).toHaveValue('');
      expect(store().getVariable('seenByHandler', MODULE_ID)).toBe('');
    });

    test('setDisable and setVisibility flip the exposed flags and the DOM', async () => {
      // Mutation: in TextArea.jsx's BaseInput call, add `disable={false}
      // visibility={true}` after `{...inputLogic}`.
      const { container } = mount({ properties: { value: binding('') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.store.act(async () => {
        await exposed().setDisable(true);
        await exposed().setVisibility(false);
      });

      expect(textarea(container)).toBeDisabled();
      expect(textarea(container)).toHaveAttribute('aria-hidden', 'true');
      expect(exposed().isDisabled).toBe(true);
      expect(exposed().isVisible).toBe(false);
    });

    test('setFocus focuses the textarea itself', async () => {
      // Proves TextArea forwards useInput's ref to the real element — the same
      // ref its own resizeTextArea depends on (TextArea.jsx:15).
      // Mutation: TextArea.jsx:59 inputType="textarea" -> "text"; the ref then
      // points at an <input> and the textarea assertion fails.
      const { container } = mount({ properties: { value: binding('') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.store.act(async () => {
        await exposed().setFocus();
      });

      expect(document.activeElement).toBe(textarea(container));
    });
  });

  describe('onEnterPressed', () => {
    test('Enter fires onEnterPressed while still keeping the newline in the value', async () => {
      // The behaviour that distinguishes a textarea from a single-line input:
      // Enter is BOTH an event trigger (useInput.js:323-328) and a character.
      // Mutation: `handleKeyUp={() => {}}` after `{...inputLogic}` in TextArea.jsx.
      const { container } = mount({ properties: { value: binding('') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());
      widget.setEvents([
        {
          id: 'evt-enter',
          name: 'onEnterPressed',
          index: 0,
          sourceId: ID,
          target: 'component',
          event: {
            eventId: 'onEnterPressed',
            actionId: 'set-custom-variable',
            key: 'enterSeen',
            value: `{{components.${NAME}.value}}`,
          },
        },
      ]);

      await widget.session.user.type(textarea(container), 'x{enter}y');
      await drain();

      expect(exposed().value).toBe('x\ny');
      expect(store().getVariable('enterSeen', MODULE_ID)).toBe('x\n');
    });
  });

  describe('external value change', () => {
    test('a new multi-line default value from the store replaces the typed one', async () => {
      // useInput.js:160-169 syncs `properties.value` into local state, which is
      // how a `{{ }}`-bound default value follows its source.
      // Mutation: in TextArea.jsx's BaseInput call, add
      // `properties={{ ...properties, value: 'frozen' }}` after `{...props}`.
      const { container } = mount({ properties: { value: binding('{{variables.seed}}') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      await widget.session.store.act(async (state) => {
        state.setVariable('seed', 'from\nvariable', MODULE_ID);
      });

      await waitFor(() => expect(textarea(container)).toHaveValue('from\nvariable'));
    });

    test('a change event dispatched straight at the DOM node is honoured', async () => {
      // Belt and braces for the paste/type paths above: whatever produces the
      // change, the newline reaches the store.
      // Mutation: `handleChange={() => {}}` after `{...inputLogic}` in TextArea.jsx.
      const { container } = mount({ properties: { value: binding('') } });
      await waitFor(() => expect(textarea(container)).toBeInTheDocument());

      domFireEvent.change(textarea(container), { target: { value: 'p\nq\nr' } });

      expect(exposed().value).toBe('p\nq\nr');
    });
  });
});
