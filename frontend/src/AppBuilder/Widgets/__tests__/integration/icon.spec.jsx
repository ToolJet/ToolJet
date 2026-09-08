/**
 * Behaviour spec for the real Icon widget (src/AppBuilder/Widgets/Icon.jsx).
 *
 * Nothing about the widget is mocked. The real composed store resolves the
 * definition, the real RenderWidget supplies the props, the real eventsSlice
 * dispatches onClick/onHover, and the real `@tabler/icons-react` package is
 * what produces the `<svg>` — the icon library is deliberately NOT stubbed,
 * because "the name the user typed does not exist in the icon set" is the
 * failure mode this spec exists to pin down. Shared setup lives in
 * ./widgetHarness.js.
 *
 * Everything asserted here is declared in
 * src/AppBuilder/WidgetManager/widgets/icon.js (properties `icon`,
 * `loadingState`, `visibility`, `disabledState`; styles `iconColor` /
 * `iconAlign` / `boxShadow`; events `onClick`/`onHover`; actions
 * `click`/`setVisibility`/`setLoading`/`setDisable`).
 *
 * Two Icon-specific timing facts:
 *   - Icon is a React.lazy import (_helpers/editorHelpers.js:79), so it mounts
 *     through TrackedSuspense. On a cold jest cache the dynamic import has to
 *     Babel-transform the chunk first, which overruns RTL's 1s default — hence
 *     the generous timeout on the first wait of each test.
 *   - TablerIcon (_ui/Icon/TablerIcon.jsx) resolves the icon component from an
 *     `import('@tabler/icons-react')` inside an effect, so even after the
 *     widget has mounted the `<svg>` arrives a microtask later. Always
 *     `waitFor` the svg; never assert on it synchronously.
 */
import { act, waitFor } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, setVariableOn, binding, drain } from './widgetHarness';

const ICON = 'icn1';
/** The lazy chunk + the whole @tabler/icons-react module on a cold cache. */
const LAZY_TIMEOUT = 20000;

const widget = createWidgetHarness({
  componentType: 'Icon',
  handle: 'icon1',
  id: ICON,
  defaultProperties: {
    icon: binding('IconHome2'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: { iconColor: binding('#000'), iconAlign: binding('center') },
});

/** An unrendered sibling whose exposed `value` other components can bind to. */
const textInputSibling = () => ({ c1: componentDefinition('c1', 'textinput1', 'TextInput') });

const wrapper = (container) => container.querySelector('.icon-widget');
const svg = (container) => container.querySelector('svg.tabler-icon');

/** Waits out both the lazy chunk and TablerIcon's async icon import. */
async function waitForIcon(container) {
  await waitFor(() => expect(svg(container)).toBeInTheDocument(), { timeout: LAZY_TIMEOUT });
  return svg(container);
}

describe('Icon widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('icon lookup', () => {
    test('renders the icon named by its `icon` property', async () => {
      const { container } = widget.render({ properties: { icon: binding('IconSettings') } });

      // tabler stamps the resolved icon's own name into the class, so this
      // asserts WHICH icon rendered, not merely that something rendered.
      expect(await waitForIcon(container)).toHaveClass('tabler-icon-settings');
    });

    test('an unknown icon name falls back to the default icon instead of crashing the canvas', async () => {
      // `icon` is user-supplied free text (iconPicker writes it, but bindings
      // and app JSON imports can put anything there). A lookup miss must
      // degrade, not throw — TablerIcon's `fallbackIcon` is what makes it so.
      const { container } = widget.render({ properties: { icon: binding('IconNoSuchIconExistsAnywhere') } });

      expect(await waitForIcon(container)).toHaveClass('tabler-icon-home-2');
      expect(wrapper(container)).toBeInTheDocument();
    });

    test('an empty icon name renders nothing rather than crashing the canvas', async () => {
      const { container } = widget.render({ properties: { icon: binding('') } });

      await waitFor(() => expect(wrapper(container)).toBeInTheDocument(), { timeout: LAZY_TIMEOUT });
      // TablerIcon bails out of its import for a falsy name and leaves the
      // sizing placeholder behind: no svg, no throw, canvas intact.
      expect(svg(container)).not.toBeInTheDocument();
      expect(wrapper(container).querySelector('span')).toBeInTheDocument();
    });

    test('resolves a `{{ }}` binding for the icon name through the dependency graph', async () => {
      // Not a literal: the name is an expression over ANOTHER component's
      // exposed value, so it can only reach TablerIcon by travelling through
      // the real resolver and a real dependency-graph edge. The sibling
      // TextInput is never rendered — writing its exposed value is what the
      // cascade reacts to.
      const { container } = widget.render({
        properties: { icon: binding('{{ "Icon" + components.textinput1.value }}') },
        extraComponents: textInputSibling(),
      });

      await act(async () => {
        widget.setExposedValue('c1', 'value', 'Settings');
      });

      await waitFor(() => expect(svg(container)).toHaveClass('tabler-icon-settings'), { timeout: LAZY_TIMEOUT });
    });
  });

  describe('events', () => {
    test('clicking the icon runs the registered onClick handler’s action', async () => {
      const { container } = widget.render();
      widget.setEvents(setVariableOn(ICON, 'onClick', { key: 'fired', value: 'YES' }));
      await waitForIcon(container);

      await widget.session.user.click(svg(container));
      await drain();

      expect(widget.variables().fired).toBe('YES');
    });

    test('hovering the icon runs the registered onHover handler’s action', async () => {
      const { container } = widget.render();
      widget.setEvents(setVariableOn(ICON, 'onHover', { key: 'hovered', value: 'YES' }));
      await waitForIcon(container);

      await widget.session.user.hover(wrapper(container));
      await drain();

      expect(widget.variables().hovered).toBe('YES');
    });

    test.failing('a disabled icon does not fire onClick', async () => {
      // KNOWN BUG — Icon.jsx:83-104. `disabledState` only reaches the DOM as a
      // `data-disabled` attribute (:86); nothing gates the svg's onClick (:101)
      // and no stylesheet turns off pointer events for `.icon-widget
      // [data-disabled='true']`. So a disabled Icon is fully clickable and
      // still dispatches onClick, unlike every other clickable widget.
      // Correct behaviour is asserted here; flip to `test` when it is fixed.
      const { container } = widget.render({ properties: { disabledState: binding('{{true}}') } });
      widget.setEvents(setVariableOn(ICON, 'onClick', { key: 'fired', value: 'YES' }));
      await waitForIcon(container);

      await widget.session.user.click(svg(container));
      await drain();

      expect(widget.variables().fired).toBeUndefined();
    });
  });

  describe('properties', () => {
    test('shows the loader instead of the icon while `loadingState` is set', async () => {
      const { container } = widget.render({ properties: { loadingState: binding('{{true}}') } });

      await waitFor(() => expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument(), {
        timeout: LAZY_TIMEOUT,
      });
      expect(wrapper(container)).not.toBeInTheDocument();
    });

    test('hides itself while `visibility` is false', async () => {
      const { container } = widget.render({ properties: { visibility: binding('{{false}}') } });

      await waitFor(() => expect(wrapper(container)).toBeInTheDocument(), { timeout: LAZY_TIMEOUT });
      expect(wrapper(container)).toHaveClass('d-none');
    });

    test('marks itself disabled while `disabledState` is true', async () => {
      const { container } = widget.render({ properties: { disabledState: binding('{{true}}') } });

      await waitFor(() => expect(wrapper(container)).toBeInTheDocument(), { timeout: LAZY_TIMEOUT });
      expect(wrapper(container)).toHaveAttribute('data-disabled', 'true');
    });

    test('re-hides itself when a bound `visibility` flips to false after mount', async () => {
      // Local state seeded once from props is a classic desync: without the
      // sync effect the widget would stay visible forever after the first
      // render, because `visibility` is React state, not the prop.
      const { container } = widget.render({
        properties: { visibility: binding('{{components.textinput1.value}}') },
        extraComponents: textInputSibling(),
      });

      await act(async () => {
        widget.setExposedValue('c1', 'value', true);
      });
      await waitFor(() => expect(wrapper(container)).not.toHaveClass('d-none'), { timeout: LAZY_TIMEOUT });

      await act(async () => {
        widget.setExposedValue('c1', 'value', false);
      });

      await waitFor(() => expect(wrapper(container)).toHaveClass('d-none'));
    });
  });

  describe('styles', () => {
    test('applies `iconAlign` and `boxShadow` to the icon container', async () => {
      const { container } = widget.render({
        styles: { iconAlign: binding('right'), boxShadow: binding('0px 2px 4px 0px #00000040') },
      });

      await waitFor(() => expect(wrapper(container)).toBeInTheDocument(), { timeout: LAZY_TIMEOUT });
      expect(wrapper(container)).toHaveStyle({ textAlign: 'right', boxShadow: '0px 2px 4px 0px #00000040' });
    });

    test('strokes the icon with the configured `iconColor`', async () => {
      const { container } = widget.render({ styles: { iconColor: binding('#ff0000') } });

      expect(await waitForIcon(container)).toHaveAttribute('stroke', '#ff0000');
    });

    test('inverts the default `#000` icon colour in dark mode', async () => {
      // '#000' is the schema default, i.e. "unset", so on a dark canvas it has
      // to become white or the icon is invisible. A colour the user actually
      // picked is left alone (previous test).
      const { container } = widget.render({ styles: { iconColor: binding('#000') }, darkMode: true });

      expect(await waitForIcon(container)).toHaveAttribute('stroke', '#fff');
    });
  });

  describe('exposed values', () => {
    test('publishes isVisible, isLoading and isDisabled from its properties', async () => {
      widget.render({
        properties: {
          visibility: binding('{{true}}'),
          loadingState: binding('{{false}}'),
          disabledState: binding('{{true}}'),
        },
      });

      await waitFor(() => expect(widget.exposed().isDisabled).toBe(true), { timeout: LAZY_TIMEOUT });
      expect(widget.exposed().isVisible).toBe(true);
      expect(widget.exposed().isLoading).toBe(false);
    });

    test('republishes isVisible when a bound `visibility` changes after mount', async () => {
      widget.render({
        properties: { visibility: binding('{{components.textinput1.value}}') },
        extraComponents: textInputSibling(),
      });

      await act(async () => {
        widget.setExposedValue('c1', 'value', true);
      });
      await waitFor(() => expect(widget.exposed().isVisible).toBe(true), { timeout: LAZY_TIMEOUT });

      await act(async () => {
        widget.setExposedValue('c1', 'value', false);
      });

      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
    });
  });

  describe('component-specific actions', () => {
    test('click fires onClick without a pointer event', async () => {
      widget.render();
      widget.setEvents(setVariableOn(ICON, 'onClick', { key: 'fired', value: 'YES' }));
      await waitFor(() => expect(widget.exposed().click).toBeInstanceOf(Function), { timeout: LAZY_TIMEOUT });

      await act(async () => {
        await widget.exposed().click();
      });
      await drain();

      expect(widget.variables().fired).toBe('YES');
    });

    test('setVisibility hides the icon and updates isVisible', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(widget.exposed().setVisibility).toBeInstanceOf(Function), { timeout: LAZY_TIMEOUT });

      await act(async () => {
        await widget.exposed().setVisibility(false);
      });

      expect(widget.exposed().isVisible).toBe(false);
      expect(wrapper(container)).toHaveClass('d-none');
    });

    test('setLoading swaps the icon for the loader and updates isLoading', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(widget.exposed().setLoading).toBeInstanceOf(Function), { timeout: LAZY_TIMEOUT });

      await act(async () => {
        await widget.exposed().setLoading(true);
      });

      expect(widget.exposed().isLoading).toBe(true);
      expect(container.querySelector('.tj-widget-loader')).toBeInTheDocument();
      expect(wrapper(container)).not.toBeInTheDocument();
    });

    test('setDisable marks the icon disabled and updates isDisabled', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(widget.exposed().setDisable).toBeInstanceOf(Function), { timeout: LAZY_TIMEOUT });

      await act(async () => {
        await widget.exposed().setDisable(true);
      });

      expect(widget.exposed().isDisabled).toBe(true);
      expect(wrapper(container)).toHaveAttribute('data-disabled', 'true');
    });
  });
});
