/**
 * Behaviour spec for the real Button widget (src/AppBuilder/Widgets/Button.jsx).
 *
 * Nothing about the widget is mocked: the real composed store resolves the
 * definition, the real RenderWidget supplies props, the real eventsSlice
 * dispatches onClick, and the real Button module is what ends up in the DOM.
 * Everything asserted here is declared in
 * src/AppBuilder/WidgetManager/widgets/button.js (properties `text`,
 * `loadingState`, `visibility`, `disabledState`; events `onClick`/`onHover`;
 * exposed variables `buttonText`/`isVisible`/`isDisabled`/`isLoading`; actions
 * `click`/`setText`/`setVisibility`/`setDisable`/`setLoading` and the
 * deprecated `disable`/`visibility`/`loading`).
 *
 * Lives in __tests__/integration/ because it imports @/AppBuilder/_stores/store
 * (scripts/validate-test-layout.js). Setup shared across widgets lives in
 * ./widgetHarness.js — read its header for what's load-bearing and why.
 */
import { act, screen, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, setVariableOn, binding, drain } from './widgetHarness';

const BTN = 'btn1';

// `visibility` defaults to true because the widget hides itself with
// `display: none` otherwise, which is not what any test here is about.
const widget = createWidgetHarness({
  componentType: 'Button',
  handle: 'button1',
  id: BTN,
  defaultProperties: { text: binding('Click me'), visibility: binding('{{true}}') },
});

const buttonEl = (container) => container.querySelector('button.jet-btn');

describe('Button widget', () => {
  beforeEach(widget.setup);
  // A failed assertion skips inline cleanup, and a leaked bracket silently
  // buffers the NEXT test's exposed-value writes. See seed.js.
  afterEach(widget.teardown);

  describe('label', () => {
    test('renders the label text from its `text` property', async () => {
      widget.render({ properties: { text: binding('Save changes') } });

      expect(await screen.findByText('Save changes')).toBeInTheDocument();
    });

    test('resolves a `{{ }}` binding in the label through the dependency graph', async () => {
      // Not a literal: the label is an expression over ANOTHER component's
      // exposed value, so it can only arrive in the DOM by travelling through
      // the real resolver and a real dependency-graph edge. The sibling
      // TextInput is never rendered here — writing its exposed value directly
      // is what the cascade reacts to.
      widget.render({
        properties: { text: binding('{{ "Save " + components.textinput1.value }}') },
        extraComponents: { c1: componentDefinition('c1', 'textinput1', 'TextInput') },
      });

      await act(async () => {
        widget.setExposedValue('c1', 'value', 'draft');
      });

      expect(await screen.findByText('Save draft')).toBeInTheDocument();
    });
  });

  describe('onClick', () => {
    test('clicking runs the registered onClick handler’s action', async () => {
      const { container } = widget.render();
      widget.setEvents(setVariableOn(BTN, 'onClick', { key: 'clicked', value: 'YES' }));

      await widget.session.user.click(buttonEl(container));
      await drain();

      expect(widget.variables().clicked).toBe('YES');
    });

    test('the handler resolves the current state, not the state at render time', async () => {
      // The stale-read bug class: the handler's value is an expression over
      // another component's exposed value, written AFTER the button mounted.
      const { container } = widget.render({
        extraComponents: { c1: componentDefinition('c1', 'textinput1', 'TextInput', { value: binding('stale') }) },
      });
      widget.setEvents(setVariableOn(BTN, 'onClick', { key: 'seen', value: '{{components.textinput1.value}}' }));

      await act(async () => {
        widget.setExposedValue('c1', 'value', 'fresh');
      });
      await widget.session.user.click(buttonEl(container));
      await drain();

      expect(widget.variables().seen).toBe('fresh');
    });

    test('a disabled button does not fire onClick', async () => {
      const { container } = widget.render({ properties: { disabledState: binding('{{true}}') } });
      widget.setEvents(setVariableOn(BTN, 'onClick', { key: 'clicked', value: 'YES' }));

      await waitFor(() => expect(buttonEl(container)).toHaveAttribute('aria-disabled', 'true'));
      await widget.session.user.click(buttonEl(container));
      await drain();

      expect(widget.variables().clicked).toBeUndefined();
    });

    test('a loading button does not fire onClick', async () => {
      const { container } = widget.render({ properties: { loadingState: binding('{{true}}') } });
      widget.setEvents(setVariableOn(BTN, 'onClick', { key: 'clicked', value: 'YES' }));

      await waitFor(() => expect(buttonEl(container)).toHaveAttribute('aria-busy', 'true'));
      await widget.session.user.click(buttonEl(container));
      await drain();

      expect(widget.variables().clicked).toBeUndefined();
    });
  });

  describe('loading state', () => {
    test('shows the loader instead of the label while `loadingState` is set', async () => {
      const { container } = widget.render({
        properties: { text: binding('Save changes'), loadingState: binding('{{true}}') },
      });

      await waitFor(() => expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument());
      expect(screen.queryByText('Save changes')).not.toBeInTheDocument();
    });
  });

  describe('exposed values', () => {
    test('publishes buttonText from the resolved label', async () => {
      widget.render({ properties: { text: binding('{{ "Sav" + "e" }}') } });

      await waitFor(() => expect(widget.exposed().buttonText).toBe('Save'));
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
    test('setText replaces the rendered label and the buttonText exposed value', async () => {
      widget.render({ properties: { text: binding('Before') } });
      await waitFor(() => expect(widget.exposed().setText).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().setText('After');
      });

      expect(await screen.findByText('After')).toBeInTheDocument();
      expect(widget.exposed().buttonText).toBe('After');
    });

    test('click fires onClick without a pointer event', async () => {
      widget.render();
      widget.setEvents(setVariableOn(BTN, 'onClick', { key: 'clicked', value: 'YES' }));
      await waitFor(() => expect(widget.exposed().click).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().click();
      });
      await drain();

      expect(widget.variables().clicked).toBe('YES');
    });

    test('setDisable disables the button and updates isDisabled', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(widget.exposed().setDisable).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().setDisable(true);
      });

      expect(widget.exposed().isDisabled).toBe(true);
      expect(buttonEl(container)).toHaveAttribute('aria-disabled', 'true');
    });

    test('setLoading swaps the label for the loader and updates isLoading', async () => {
      const { container } = widget.render({ properties: { text: binding('Save changes') } });
      await waitFor(() => expect(widget.exposed().setLoading).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().setLoading(true);
      });

      expect(widget.exposed().isLoading).toBe(true);
      expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();
      expect(screen.queryByText('Save changes')).not.toBeInTheDocument();
    });

    test('setVisibility hides the button and updates isVisible', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(widget.exposed().setVisibility).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().setVisibility(false);
      });

      expect(widget.exposed().isVisible).toBe(false);
      expect(buttonEl(container)).toHaveStyle({ display: 'none' });
    });

    test('the deprecated `disable` action still disables the button', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(widget.exposed().disable).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().disable(true);
      });

      expect(buttonEl(container)).toHaveAttribute('aria-disabled', 'true');
    });

    test('the deprecated `loading` action still shows the loader', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(widget.exposed().loading).toBeInstanceOf(Function));

      await act(async () => {
        await widget.exposed().loading(true);
      });

      expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();
    });
  });
});
