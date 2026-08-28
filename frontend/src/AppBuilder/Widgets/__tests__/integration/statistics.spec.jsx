/**
 * Behaviour spec for the real Statistics widget (AppBuilder/Widgets/Statistics.jsx),
 * rendered through the real RenderWidget against the real composed store. Nothing
 * about the widget is mocked. Shared setup lives in ./widgetHarness.js.
 *
 * Scope is exactly what statisticsConfig (WidgetManager/widgets/statistics.js)
 * declares: the primary/secondary label + value properties with their prefix and
 * suffix text, `secondarySignDisplay` (the trend), `hideSecondary`,
 * `loadingState`, `visibility`, the `iconVisibility` style, the exposed values
 * primaryLabel / secondaryLabel / primaryValue / secondaryValue /
 * secondarySignDisplay / isLoading / isVisible, and the four actions
 * setPrimaryValue / setSecondaryValue / setLoading / setVisibility. The config
 * declares `events: {}`, so there are no event tests.
 *
 * Every test seeds a second, unrendered Text widget (id `src`, name
 * `sourceText`) that exists purely to be a binding target: a
 * `{{components.sourceText.<key>}}` expression has to travel the real
 * dependency graph to reach the rendered widget.
 */
import { screen, waitFor } from '@testing-library/react';
import { componentDefinition, drainExposedValueBatch } from '@/test/app-builder';
import { createWidgetHarness, binding, store, MODULE_ID } from './widgetHarness';

const STAT = 'stat';

const widget = createWidgetHarness({
  componentType: 'Statistics',
  handle: 'statistics1',
  id: STAT,
  defaultProperties: {
    primaryValueLabel: binding('This months earnings'),
    primaryValue: binding('682.3'),
    secondaryValueLabel: binding('Last month'),
    secondaryValue: binding('2.85'),
    secondarySignDisplay: binding('positive'),
    dataAlignment: binding('left'),
    secondaryValueAlignment: binding('horizontal'),
    hideSecondary: binding('{{false}}'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    dynamicHeight: binding('{{false}}'),
  },
  defaultExtraComponents: {
    src: componentDefinition('src', 'sourceText', 'Text', { text: binding('unused') }),
  },
  widgetHeight: 152,
  widgetWidth: 300,
});

/** The widget's own root card — the node carrying baseStyle and data-cy. */
const statRoot = (container) => container.querySelector('[data-cy="statistics1"]');

/** The up/down trend glyphs are distinct SVGs, told apart by their brand colour. */
const UP_TREND = 'path[fill="#1E823B"]';
const DOWN_TREND = 'path[stroke="#D72D39"]';

/** Seeds `src`'s exposed value before mount, so an initial binding resolves it. */
const withSource = (values) => () => store().setExposedValues('src', 'components', values, MODULE_ID);

describe('Statistics widget', () => {
  beforeEach(widget.setup);
  afterEach(drainExposedValueBatch);

  describe('rendering its primary and secondary values', () => {
    test('renders the primary label and value', async () => {
      widget.render();

      expect(await screen.findByText('This months earnings')).toBeInTheDocument();
      expect(await screen.findByText('682.3')).toBeInTheDocument();
    });

    test('renders the secondary label and value', async () => {
      widget.render();

      expect(await screen.findByText('Last month')).toBeInTheDocument();
      expect(await screen.findByText('2.85')).toBeInTheDocument();
    });

    test('wraps the primary value in its prefix and suffix text', async () => {
      widget.render({
        properties: {
          primaryValue: binding('1200'),
          primaryPrefixText: binding('$'),
          primarySuffixText: binding(' USD'),
        },
      });

      expect(await screen.findByText('$1200 USD')).toBeInTheDocument();
    });

    test('wraps the secondary value in its prefix and suffix text', async () => {
      widget.render({
        properties: {
          secondaryValue: binding('12'),
          secondaryPrefixText: binding('+'),
          secondarySuffixText: binding('%'),
        },
      });

      expect(await screen.findByText('+12%')).toBeInTheDocument();
    });

    test('drops the whole secondary block when hideSecondary is true', async () => {
      const { container } = widget.render({ properties: { hideSecondary: binding('{{true}}') } });

      await waitFor(() => expect(screen.getByText('682.3')).toBeInTheDocument());
      expect(screen.queryByText('2.85')).not.toBeInTheDocument();
      expect(screen.queryByText('Last month')).not.toBeInTheDocument();
      expect(container.querySelector(UP_TREND)).not.toBeInTheDocument();
    });

    test('renders the configured icon only when the iconVisibility style is on', async () => {
      const { container } = widget.render({
        properties: { icon: binding('IconDatabaseDollar') },
        styles: { iconVisibility: binding('{{true}}') },
      });

      // TablerIcon (src/_ui/Icon/TablerIcon.jsx) dynamic-imports @tabler/icons-react,
      // so the real glyph only appears after that import resolves; until then it
      // renders a sizing placeholder. The generous timeout is the Babel transform
      // of the icon package on a cold jest cache, not padding.
      await waitFor(() => expect(statRoot(container).querySelector(':scope > svg')).toBeInTheDocument(), {
        timeout: 30000,
      });
    });

    test('omits the icon when the iconVisibility style is off', async () => {
      const { container } = widget.render({
        properties: { icon: binding('IconDatabaseDollar') },
        styles: { iconVisibility: binding('{{false}}') },
      });

      await waitFor(() => expect(statRoot(container)).toBeInTheDocument());
      // Neither the loaded glyph nor TablerIcon's sizing placeholder — proving the
      // absence is `Boolean(iconVisibility)` and not just a pending dynamic import.
      expect(statRoot(container).querySelector(':scope > svg, :scope > span')).not.toBeInTheDocument();
    });
  });

  describe('formatting numeric values that come back from a query', () => {
    test('renders a zero primary value as "0" rather than as nothing', async () => {
      // The classic falsy bug in a display widget: `0` is a legitimate metric.
      widget.render({ properties: { primaryValue: binding('{{0}}') } });

      expect(await screen.findByText('0')).toBeInTheDocument();
    });

    test('renders a negative primary value with its minus sign intact', async () => {
      widget.render({ properties: { primaryValue: binding('{{-42.5}}') } });

      expect(await screen.findByText('-42.5')).toBeInTheDocument();
    });

    test('renders a decimal primary value without rounding it', async () => {
      widget.render({ properties: { primaryValue: binding('{{9.99}}') } });

      expect(await screen.findByText('9.99')).toBeInTheDocument();
    });

    test('renders a very large primary value in full, without exponent notation', async () => {
      widget.render({ properties: { primaryValue: binding('{{1234567890123}}') } });

      expect(await screen.findByText('1234567890123')).toBeInTheDocument();
    });

    test('renders nothing for a null primary value instead of the word "null"', async () => {
      // A query that returned nothing. `primaryValue`'s schema is `{type:'string'}`,
      // so the resolver coerces null to '' before the widget sees it — the empty
      // string is what keeps `String(...)` (Statistics.jsx:230) honest here.
      widget.render({ properties: { primaryValue: binding('{{null}}'), primaryValueLabel: binding('Revenue') } });

      expect(await screen.findByText('Revenue')).toBeInTheDocument();
      expect(screen.queryByText('null')).not.toBeInTheDocument();
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });

    test('renders nothing for an undefined secondary value instead of the word "undefined"', async () => {
      widget.render({
        properties: { secondaryValue: binding('{{undefined}}'), secondaryValueLabel: binding('Last week') },
      });

      expect(await screen.findByText('Last week')).toBeInTheDocument();
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });

    test.failing('the setPrimaryValue action given an undefined value renders nothing, not "undefined"', async () => {
      // KNOWN BUG. Statistics.jsx:230 stringifies unconditionally:
      //   `${primaryPrefixText ?? ''}${String(exposedVariablesTemporaryState.primaryValue)}...`
      // The PROPERTY path is safe because the resolver coerces null/undefined to
      // '' for the string schema, but the setPrimaryValue action is unvalidated, so
      // `statistics1.setPrimaryValue(query.data.total)` on an empty result paints
      // the literal text "undefined" into the card. Same for setSecondaryValue,
      // which interpolates without String() at Statistics.jsx:233.
      widget.render();
      await waitFor(() => expect(widget.exposed().setPrimaryValue).toBeInstanceOf(Function));

      await widget.session.store.act(async () => {
        await widget.exposed().setPrimaryValue(undefined);
      });

      await waitFor(() => expect(screen.queryByText('682.3')).not.toBeInTheDocument());
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });
  });

  describe('the trend indicator', () => {
    test('shows the up glyph when secondarySignDisplay is positive', async () => {
      const { container } = widget.render({ properties: { secondarySignDisplay: binding('positive') } });

      await waitFor(() => expect(container.querySelector(UP_TREND)).toBeInTheDocument());
      expect(container.querySelector(DOWN_TREND)).not.toBeInTheDocument();
    });

    test('shows the down glyph when secondarySignDisplay is negative', async () => {
      const { container } = widget.render({ properties: { secondarySignDisplay: binding('negative') } });

      await waitFor(() => expect(container.querySelector(DOWN_TREND)).toBeInTheDocument());
      expect(container.querySelector(UP_TREND)).not.toBeInTheDocument();
    });

    test('the glyph follows secondarySignDisplay, not the sign of the secondary value', async () => {
      // Deliberate: `secondarySignDisplay` is its own property, so a negative
      // delta only points down when the app author says so (Statistics.jsx:275).
      // A negative NUMBER with the default 'positive' trend still points up.
      const { container } = widget.render({
        properties: { secondaryValue: binding('{{-2.85}}'), secondarySignDisplay: binding('positive') },
      });

      expect(await screen.findByText('-2.85')).toBeInTheDocument();
      expect(container.querySelector(UP_TREND)).toBeInTheDocument();
      expect(container.querySelector(DOWN_TREND)).not.toBeInTheDocument();
    });

    test('paints the secondary value in the negative colour when the trend is negative', async () => {
      const { container } = widget.render({
        properties: { secondarySignDisplay: binding('negative') },
        styles: { positiveSecondaryValueColor: binding('#1e823b'), negativeSecondaryValueColor: binding('#d72d39') },
      });

      await waitFor(() => expect(screen.getByText('2.85')).toBeInTheDocument());
      expect(screen.getByText('2.85')).toHaveStyle({ color: '#d72d39' });
      expect(container.querySelector(DOWN_TREND)).toBeInTheDocument();
    });

    test('paints the secondary value in the positive colour when the trend is positive', async () => {
      widget.render({
        properties: { secondarySignDisplay: binding('positive') },
        styles: { positiveSecondaryValueColor: binding('#1e823b'), negativeSecondaryValueColor: binding('#d72d39') },
      });

      await waitFor(() => expect(screen.getByText('2.85')).toBeInTheDocument());
      expect(screen.getByText('2.85')).toHaveStyle({ color: '#1e823b' });
    });
  });

  describe('resolving bindings through the dependency graph', () => {
    test('a `{{ }}` binding is resolved before the primary value reaches the DOM', async () => {
      widget.render({ properties: { primaryValue: binding('{{ 600 + 82.3 }}') } });

      expect(await screen.findByText('682.3')).toBeInTheDocument();
    });

    test('a primary value bound to another component reads it through the real graph', async () => {
      widget.render({
        properties: { primaryValue: binding('{{components.sourceText.total}}') },
        afterSeed: withSource({ total: '9,410' }),
      });

      expect(await screen.findByText('9,410')).toBeInTheDocument();
    });

    test('updating the bound source updates the displayed primary value', async () => {
      widget.render({
        properties: { primaryValue: binding('{{components.sourceText.total}}') },
        afterSeed: withSource({ total: '100' }),
      });
      expect(await screen.findByText('100')).toBeInTheDocument();

      // The exposed-value WRITE is synchronous but the dependency CASCADE is
      // deferred by one microtask (resolvedSlice), so the re-render cannot be
      // observed in the same tick — findByText awaits it.
      await widget.session.store.act(() => {
        store().setExposedValue('src', 'total', '250', MODULE_ID);
      });

      expect(await screen.findByText('250')).toBeInTheDocument();
      expect(screen.queryByText('100')).not.toBeInTheDocument();
    });

    test('a bound source going to zero still displays "0"', async () => {
      widget.render({
        properties: { primaryValue: binding('{{components.sourceText.total}}') },
        afterSeed: withSource({ total: 7 }),
      });
      expect(await screen.findByText('7')).toBeInTheDocument();

      await widget.session.store.act(() => {
        store().setExposedValue('src', 'total', 0, MODULE_ID);
      });

      expect(await screen.findByText('0')).toBeInTheDocument();
    });

    test('updating the bound source updates the displayed secondary value', async () => {
      widget.render({
        properties: { secondaryValue: binding('{{components.sourceText.delta}}') },
        afterSeed: withSource({ delta: '1.5' }),
      });
      expect(await screen.findByText('1.5')).toBeInTheDocument();

      await widget.session.store.act(() => {
        store().setExposedValue('src', 'delta', '3.5', MODULE_ID);
      });

      expect(await screen.findByText('3.5')).toBeInTheDocument();
    });

    test('a bound trend flipping to negative swaps the glyph', async () => {
      const { container } = widget.render({
        properties: { secondarySignDisplay: binding('{{components.sourceText.trend}}') },
        afterSeed: withSource({ trend: 'positive' }),
      });
      await waitFor(() => expect(container.querySelector(UP_TREND)).toBeInTheDocument());

      await widget.session.store.act(() => {
        store().setExposedValue('src', 'trend', 'negative', MODULE_ID);
      });

      await waitFor(() => expect(container.querySelector(DOWN_TREND)).toBeInTheDocument());
      expect(container.querySelector(UP_TREND)).not.toBeInTheDocument();
    });
  });

  describe('the exposed values it publishes', () => {
    test('publishes every declared exposed value on mount', async () => {
      widget.render();

      await waitFor(() => expect(widget.exposed().primaryValue).toBe('682.3'));
      expect(widget.exposed().primaryLabel).toBe('This months earnings');
      expect(widget.exposed().secondaryLabel).toBe('Last month');
      expect(widget.exposed().secondaryValue).toBe('2.85');
      expect(widget.exposed().secondarySignDisplay).toBe('positive');
      expect(widget.exposed().isLoading).toBe(false);
      expect(widget.exposed().isVisible).toBe(true);
    });

    test('republishes the primary value when its property changes', async () => {
      widget.render({
        properties: { primaryValue: binding('{{components.sourceText.total}}') },
        afterSeed: withSource({ total: 'before' }),
      });
      await waitFor(() => expect(widget.exposed().primaryValue).toBe('before'));

      await widget.session.store.act(() => {
        store().setExposedValue('src', 'total', 'after', MODULE_ID);
      });

      await waitFor(() => expect(widget.exposed().primaryValue).toBe('after'));
    });

    test('republishes the labels when their properties change', async () => {
      widget.render({
        properties: {
          primaryValueLabel: binding('{{components.sourceText.pl}}'),
          secondaryValueLabel: binding('{{components.sourceText.sl}}'),
        },
        afterSeed: withSource({ pl: 'p-before', sl: 's-before' }),
      });
      await waitFor(() => expect(widget.exposed().primaryLabel).toBe('p-before'));

      await widget.session.store.act(() => {
        store().setExposedValues('src', 'components', { pl: 'p-after', sl: 's-after' }, MODULE_ID);
      });

      await waitFor(() => expect(widget.exposed().primaryLabel).toBe('p-after'));
      await waitFor(() => expect(widget.exposed().secondaryLabel).toBe('s-after'));
    });

    test('exposes the four declared actions as callable functions', async () => {
      widget.render();
      await waitFor(() => expect(widget.exposed().setPrimaryValue).toBeInstanceOf(Function));

      for (const handle of ['setPrimaryValue', 'setSecondaryValue', 'setLoading', 'setVisibility']) {
        expect(widget.exposed()[handle]).toBeInstanceOf(Function);
      }
    });

    test('the setPrimaryValue action replaces the displayed value and the exposed value', async () => {
      widget.render();
      expect(await screen.findByText('682.3')).toBeInTheDocument();

      await widget.session.store.act(async () => {
        await widget.exposed().setPrimaryValue('999');
      });

      expect(await screen.findByText('999')).toBeInTheDocument();
      expect(screen.queryByText('682.3')).not.toBeInTheDocument();
      await waitFor(() => expect(widget.exposed().primaryValue).toBe('999'));
    });

    test('the setSecondaryValue action replaces the displayed secondary value', async () => {
      widget.render();
      expect(await screen.findByText('2.85')).toBeInTheDocument();

      await widget.session.store.act(async () => {
        await widget.exposed().setSecondaryValue('7.15');
      });

      expect(await screen.findByText('7.15')).toBeInTheDocument();
      await waitFor(() => expect(widget.exposed().secondaryValue).toBe('7.15'));
    });

    test('the setPrimaryValue action given a zero displays "0"', async () => {
      widget.render();
      expect(await screen.findByText('682.3')).toBeInTheDocument();

      await widget.session.store.act(async () => {
        await widget.exposed().setPrimaryValue(0);
      });

      expect(await screen.findByText('0')).toBeInTheDocument();
    });
  });

  describe('visibility and loading state', () => {
    test('hides the card when the visibility property is false', async () => {
      const { container } = widget.render({ properties: { visibility: binding('{{false}}') } });

      await waitFor(() => expect(statRoot(container)).toBeInTheDocument());
      expect(statRoot(container)).toHaveStyle({ display: 'none' });
    });

    test('displays the card when the visibility property is true', async () => {
      const { container } = widget.render({ properties: { visibility: binding('{{true}}') } });

      await waitFor(() => expect(statRoot(container)).toBeInTheDocument());
      expect(statRoot(container)).toHaveStyle({ display: 'flex' });
    });

    test('a later change to the visibility property is picked up after mount', async () => {
      const { container } = widget.render({
        properties: { visibility: binding('{{components.sourceText.shown}}') },
        afterSeed: withSource({ shown: true }),
      });
      await waitFor(() => expect(statRoot(container)).toHaveStyle({ display: 'flex' }));

      await widget.session.store.act(() => {
        store().setExposedValue('src', 'shown', false, MODULE_ID);
      });

      await waitFor(() => expect(statRoot(container)).toHaveStyle({ display: 'none' }));
      await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
    });

    test('the setVisibility action hides an already-visible card', async () => {
      const { container } = widget.render();
      await waitFor(() => expect(statRoot(container)).toHaveStyle({ display: 'flex' }));

      await widget.session.store.act(async () => {
        await widget.exposed().setVisibility(false);
      });

      await waitFor(() => expect(statRoot(container)).toHaveStyle({ display: 'none' }));
      expect(widget.exposed().isVisible).toBe(false);
    });

    test('shows a spinner instead of its values while loadingState is true', async () => {
      const { container } = widget.render({ properties: { loadingState: binding('{{true}}') } });

      await waitFor(() => expect(container.querySelector('.spinner-border')).toBeInTheDocument());
      expect(screen.queryByText('682.3')).not.toBeInTheDocument();
      expect(screen.queryByText('This months earnings')).not.toBeInTheDocument();
    });

    test('the setLoading action swaps the values for a spinner and back', async () => {
      const { container } = widget.render();
      expect(await screen.findByText('682.3')).toBeInTheDocument();

      await widget.session.store.act(async () => {
        await widget.exposed().setLoading(true);
      });
      await waitFor(() => expect(container.querySelector('.spinner-border')).toBeInTheDocument());
      expect(screen.queryByText('682.3')).not.toBeInTheDocument();
      expect(widget.exposed().isLoading).toBe(true);

      await widget.session.store.act(async () => {
        await widget.exposed().setLoading(false);
      });
      expect(await screen.findByText('682.3')).toBeInTheDocument();
      expect(container.querySelector('.spinner-border')).not.toBeInTheDocument();
    });
  });
});
