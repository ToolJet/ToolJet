/**
 * Behaviour spec for the real Text widget (AppBuilder/Widgets/Text.jsx), rendered
 * through the real RenderWidget against the real composed store. Nothing about
 * the widget is mocked. Shared setup lives in ./widgetHarness.js.
 *
 * Scope is exactly what textConfig (WidgetManager/widgets/Text.js) declares:
 * properties text / textFormat / visibility / loadingState / disabledState,
 * exposed values text / isVisible / isLoading / isDisabled, the actions setText /
 * clear / setVisibility / setLoading / setDisable, and the events onClick /
 * onHover. Nothing else is asserted, because nothing else is declared.
 *
 * `react-markdown` is stubbed with a pass-through (__mocks__/reactMarkdown.jsx),
 * so the markdown test asserts the text reached the markdown branch — never that
 * markdown was parsed.
 *
 * Every test seeds a second, unrendered Text (id `src`, name `sourceText`) that
 * exists purely to be a binding target: a `{{components.sourceText.text}}`
 * expression has to travel the real dependency graph to reach `txt`.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { createWidgetHarness, binding, store, MODULE_ID } from './widgetHarness';

const TXT = 'txt';

const widget = createWidgetHarness({
  componentType: 'Text',
  handle: 'text1',
  id: TXT,
  defaultProperties: {
    textFormat: binding('plainText'),
    visibility: binding('{{true}}'),
    loadingState: binding('{{false}}'),
    disabledState: binding('{{false}}'),
  },
  defaultExtraComponents: {
    src: componentDefinition('src', 'sourceText', 'Text', { text: binding('unused') }),
  },
});

/** The widget's own root node — the one carrying computedStyles and data-disabled. */
const textRoot = (container) => container.querySelector('.text-widget');

/** An event handler row capturing what it saw, so a fired event is observable in the store. */
function eventCapture(eventId, key) {
  return [
    {
      id: `evt-${eventId}`,
      name: eventId,
      index: 0,
      sourceId: TXT,
      target: 'component',
      event: { eventId, actionId: 'set-custom-variable', key, value: '{{components.text1.text}}' },
    },
  ];
}

describe('Text widget', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  describe('rendering its text property', () => {
    test('puts the plain-text value in the DOM', async () => {
      const { container } = widget.render({ properties: { text: binding('Hello, there!') } });

      expect(await screen.findByText('Hello, there!')).toBeInTheDocument();
      expect(textRoot(container)).toBeInTheDocument();
    });

    test('renders a numeric binding of 0 as visible text rather than nothing', async () => {
      // Worth pinning because 0 is the classic value a text renderer drops.
      // Note computeText's `properties.text === 0` branch (Text.jsx:145-147) is
      // NOT what saves it: the `text` schema is `{type: 'string'}`, so the
      // resolver hands the widget the string '0' and that branch is unreachable
      // from the property path. (`{{false}}` is coerced to '' and does render as
      // nothing — matching the schema, so not asserted as a bug here.)
      widget.render({ properties: { text: binding('{{0}}') } });

      expect(await screen.findByText('0')).toBeInTheDocument();
    });

    test('renders an object handed to setText as JSON instead of "[object Object]"', async () => {
      // Not reachable through the `text` PROPERTY: its schema is `{type: 'string'}`
      // so the resolver coerces an object binding to '' before the widget sees it.
      // The setText action is unvalidated, so `text1.setText(query.data)` is how a
      // real app gets an object in here — which is what Text.jsx:209 handles.
      widget.render({ properties: { text: binding('a string') } });
      await waitFor(() => expect(widget.exposed().setText).toBeInstanceOf(Function));

      await widget.session.store.act(async () => {
        await widget.exposed().setText({ name: 'Ada' });
      });

      expect(await screen.findByText('{"name":"Ada"}')).toBeInTheDocument();
    });

    test('renders through react-markdown when textFormat is markdown', async () => {
      // react-markdown is a pass-through stub, so this proves the value reached
      // the markdown branch — not that any markdown was parsed.
      widget.render({ properties: { text: binding('# A heading'), textFormat: binding('markdown') } });

      const markdown = await screen.findByTestId('react-markdown');
      expect(within(markdown).getByText('# A heading')).toBeInTheDocument();
    });

    test('renders sanitized HTML when textFormat is html', async () => {
      const { container } = widget.render({
        properties: {
          text: binding('<b>bold</b><script>window.__pwned = true;</script>'),
          textFormat: binding('html'),
        },
      });

      await waitFor(() => expect(container.querySelector('b')).toBeInTheDocument());
      expect(container.querySelector('b')).toHaveTextContent('bold');
      // DOMPurify.sanitize (Text.jsx:216) is what drops the script tag.
      expect(container.querySelector('script')).not.toBeInTheDocument();
    });
  });

  describe('resolving bindings through the dependency graph', () => {
    test('a `{{ }}` binding is resolved before the text reaches the DOM', async () => {
      widget.render({ properties: { text: binding('{{ "resolved" + "-" + "value" }}') } });

      expect(await screen.findByText('resolved-value')).toBeInTheDocument();
    });

    test('text bound to another component reads that component through the real graph', async () => {
      widget.render({
        properties: { text: binding('{{components.sourceText.text}}') },
        afterSeed: () => store().setExposedValues('src', 'components', { text: 'from the source widget' }, MODULE_ID),
      });

      expect(await screen.findByText('from the source widget')).toBeInTheDocument();
    });

    test('updating the bound source updates the rendered text', async () => {
      widget.render({
        properties: { text: binding('{{components.sourceText.text}}') },
        afterSeed: () => store().setExposedValues('src', 'components', { text: 'first' }, MODULE_ID),
      });
      expect(await screen.findByText('first')).toBeInTheDocument();

      // The exposed-value WRITE is synchronous but the dependency CASCADE is
      // deferred by one microtask (resolvedSlice), so the re-render cannot be
      // observed in the same tick — findByText awaits it.
      await widget.session.store.act(() => {
        store().setExposedValue('src', 'text', 'second', MODULE_ID);
      });

      expect(await screen.findByText('second')).toBeInTheDocument();
      expect(screen.queryByText('first')).not.toBeInTheDocument();
    });
  });

  describe('the exposed values it publishes', () => {
    test('publishes text, isVisible, isLoading and isDisabled on mount', async () => {
      widget.render({ properties: { text: binding('published') } });

      await waitFor(() => expect(widget.exposed().text).toBe('published'));
      expect(widget.exposed().isVisible).toBe(true);
      expect(widget.exposed().isLoading).toBe(false);
      expect(widget.exposed().isDisabled).toBe(false);
    });

    test('republishes text when the text property changes', async () => {
      widget.render({
        properties: { text: binding('{{components.sourceText.text}}') },
        afterSeed: () => store().setExposedValues('src', 'components', { text: 'before' }, MODULE_ID),
      });
      await waitFor(() => expect(widget.exposed().text).toBe('before'));

      await widget.session.store.act(() => {
        store().setExposedValue('src', 'text', 'after', MODULE_ID);
      });

      await waitFor(() => expect(widget.exposed().text).toBe('after'));
    });

    test('exposes the declared actions as callable functions', async () => {
      widget.render({ properties: { text: binding('original') } });
      await waitFor(() => expect(widget.exposed().setText).toBeInstanceOf(Function));

      for (const handle of ['setText', 'clear', 'setVisibility', 'setLoading', 'setDisable']) {
        expect(widget.exposed()[handle]).toBeInstanceOf(Function);
      }
    });

    test('the setText action replaces the rendered text and the exposed value', async () => {
      widget.render({ properties: { text: binding('original') } });
      expect(await screen.findByText('original')).toBeInTheDocument();

      await widget.session.store.act(async () => {
        await widget.exposed().setText('set by action');
      });

      expect(await screen.findByText('set by action')).toBeInTheDocument();
      await waitFor(() => expect(widget.exposed().text).toBe('set by action'));
    });

    test('the clear action empties the rendered text', async () => {
      widget.render({ properties: { text: binding('to be cleared') } });
      expect(await screen.findByText('to be cleared')).toBeInTheDocument();

      await widget.session.store.act(async () => {
        await widget.exposed().clear();
      });

      await waitFor(() => expect(screen.queryByText('to be cleared')).not.toBeInTheDocument());
      expect(widget.exposed().text).toBe('');
    });
  });

  describe('visibility, loading and disabled state', () => {
    test('hides itself when the visibility property is false', async () => {
      const { container } = widget.render({
        properties: { text: binding('invisible'), visibility: binding('{{false}}') },
      });

      await waitFor(() => expect(textRoot(container)).toBeInTheDocument());
      expect(textRoot(container)).toHaveStyle({ display: 'none' });
    });

    test('is displayed when the visibility property is true', async () => {
      const { container } = widget.render({
        properties: { text: binding('visible'), visibility: binding('{{true}}') },
      });

      await waitFor(() => expect(textRoot(container)).toBeInTheDocument());
      expect(textRoot(container)).toHaveStyle({ display: 'flex' });
    });

    test('the setVisibility action hides an already-visible widget', async () => {
      const { container } = widget.render({ properties: { text: binding('now you see me') } });
      await waitFor(() => expect(textRoot(container)).toHaveStyle({ display: 'flex' }));

      await widget.session.store.act(async () => {
        await widget.exposed().setVisibility(false);
      });

      await waitFor(() => expect(textRoot(container)).toHaveStyle({ display: 'none' }));
      expect(widget.exposed().isVisible).toBe(false);
    });

    test('shows a loader instead of its text while loadingState is true', async () => {
      const { container } = widget.render({
        properties: { text: binding('hidden by loader'), loadingState: binding('{{true}}') },
      });

      await waitFor(() => expect(textRoot(container)).toBeInTheDocument());
      expect(screen.queryByText('hidden by loader')).not.toBeInTheDocument();
      expect(container.querySelector('.text-widget-section')).not.toBeInTheDocument();
    });

    test('marks its root as disabled when the disabledState property is true', async () => {
      const { container } = widget.render({
        properties: { text: binding('disabled text'), disabledState: binding('{{true}}') },
      });

      await waitFor(() => expect(textRoot(container)).toBeInTheDocument());
      expect(textRoot(container)).toHaveAttribute('data-disabled', 'true');
    });

    test('is not marked disabled when the disabledState property is false', async () => {
      const { container } = widget.render({
        properties: { text: binding('enabled text'), disabledState: binding('{{false}}') },
      });

      await waitFor(() => expect(textRoot(container)).toBeInTheDocument());
      expect(textRoot(container)).toHaveAttribute('data-disabled', 'false');
    });

    test('a later change to the visibility property hides the widget', async () => {
      const { container } = widget.render({
        properties: { text: binding('toggling'), visibility: binding('{{components.sourceText.shown}}') },
        afterSeed: () => store().setExposedValues('src', 'components', { shown: true }, MODULE_ID),
      });
      await waitFor(() => expect(textRoot(container)).toHaveStyle({ display: 'flex' }));

      await widget.session.store.act(() => {
        store().setExposedValue('src', 'shown', false, MODULE_ID);
      });

      await waitFor(() => expect(textRoot(container)).toHaveStyle({ display: 'none' }));
    });

    test('republishes isVisible when the visibility property changes', async () => {
      // The waitFor for `true` is load-bearing, not defensive: the binding
      // resolves to false at graph-build time and only becomes true one
      // microtask later, so mount publishes isVisible=false. Asserting the
      // true->false transition is what makes this test able to fail; asserting
      // only the final `false` would pass even with the effect deleted.
      widget.render({
        properties: { text: binding('toggling'), visibility: binding('{{components.sourceText.shown}}') },
        afterSeed: () => store().setExposedValues('src', 'components', { shown: true }, MODULE_ID),
      });
      await waitFor(() => expect(widget.exposed().isVisible).toBe(true));

      await widget.session.store.act(() => {
        store().setExposedValue('src', 'shown', false, MODULE_ID);
      });

      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
    });
  });

  describe('the events it declares', () => {
    test('fires onClick when the widget is clicked', async () => {
      const { container } = widget.render({
        properties: { text: binding('clickable') },
        events: eventCapture('onClick', 'seenByClick'),
      });
      await waitFor(() => expect(textRoot(container)).toBeInTheDocument());

      await widget.session.user.click(textRoot(container));

      await waitFor(() => expect(store().getVariable('seenByClick', MODULE_ID)).toBe('clickable'));
    });

    test('fires onHover when the pointer moves over the widget', async () => {
      const { container } = widget.render({
        properties: { text: binding('hoverable') },
        events: eventCapture('onHover', 'seenByHover'),
      });
      await waitFor(() => expect(textRoot(container)).toBeInTheDocument());

      await widget.session.user.hover(textRoot(container));

      await waitFor(() => expect(store().getVariable('seenByHover', MODULE_ID)).toBe('hoverable'));
    });
  });
});
