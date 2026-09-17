/**
 * Statistics: the approved contract at
 * frontend/ee/test/app-builder/widgets/Statistics/TESTING.md.
 * Shared setup lives in Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real Statistics component. Nothing about the
 * widget is mocked; the real @tabler/icons-react icon and the real
 * WidgetIcon up/down trend icons are exercised as-is.
 *
 * Test titles carry their approved scenario ID
 * (frontend/ee/test/app-builder/widgets/Statistics/TESTING.md) as a
 * `[Statistics-FAMILY-NNN]` prefix, per the widget-testing-contract validator.
 */
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { binding } from '@/test/app-builder';
import { createWidgetHarness } from '@/AppBuilder/Widgets/widgetHarness';

const ID = 'stats1';
const NAME = 'statistics1';

const widget = createWidgetHarness({
  componentType: 'Statistics',
  handle: NAME,
  id: ID,
  // Baseline is `statistics.js`'s own `definition.properties`, copied verbatim.
  // `hideSecondary` is deliberately OMITTED: production's own seeding block
  // omits it too (see the contract's research findings), so leaving it out
  // here reproduces the real gap instead of papering over it.
  defaultProperties: {
    primaryValueLabel: binding('This months earnings'),
    primaryValue: binding('682.3'),
    primaryPrefixText: binding(''),
    primarySuffixText: binding(''),
    secondaryValueLabel: binding('Last month'),
    secondaryValue: binding('2.85'),
    secondaryPrefixText: binding(''),
    secondarySuffixText: binding(''),
    secondarySignDisplay: binding('positive'),
    dataAlignment: binding('left'),
    secondaryValueAlignment: binding('horizontal'),
    icon: binding('IconDatabaseDollar'),
    iconDirection: binding('right'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    dynamicHeight: binding('{{false}}'),
    collapseWhenHidden: binding('{{false}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
  defaultStyles: {
    primaryLabelSize: binding('{{14}}'),
    primaryLabelColour: binding('var(--cc-placeholder-text)'),
    primaryValueSize: binding('{{34}}'),
    primaryTextColour: binding('var(--cc-primary-text)'),
    iconColor: binding('var(--cc-primary-brand)'),
    secondaryLabelSize: binding('{{14}}'),
    secondaryLabelColour: binding('var(--cc-placeholder-text)'),
    secondaryValueSize: binding('{{14}}'),
    positiveSecondaryValueColor: binding('var(--cc-success-systemStatus)'),
    negativeSecondaryValueColor: binding('var(--cc-error-systemStatus)'),
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-default-border)'),
    borderRadius: binding('{{6}}'),
    boxShadow: binding('0px 0px 0px 0px #00000040'),
    padding: binding('default'),
    // No schema key exists for this style (see the contract's `none:dead-config`
    // research finding) — production seeds it as a literal `true`, never `{{true}}`.
    iconVisibility: binding(true),
  },
});

const card = () => document.querySelector(`[data-cy="${NAME}"]`);
const exposed = (key) => widget.exposed()?.[key];
const spinner = () => document.querySelector('.spinner-border[role="status"]');

describe('Statistics: primary value', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Statistics-PRI-001] renders the configured primary label and value on mount', async () => {
    widget.render();

    await waitFor(() => expect(card()).toBeInTheDocument());
    expect(screen.getByText('This months earnings')).toBeInTheDocument();
    expect(screen.getByText('682.3')).toBeInTheDocument();
  });

  test('[Statistics-PRI-002] a bound property change (not a CSA call) updates the rendered primary value and exposed variables', async () => {
    widget.render();
    await waitFor(() => expect(screen.getByText('682.3')).toBeInTheDocument());

    widget.render({ properties: { primaryValue: binding('999.1'), primaryValueLabel: binding('Renamed label') } });

    await waitFor(() => expect(screen.getByText('999.1')).toBeInTheDocument());
    expect(screen.getByText('Renamed label')).toBeInTheDocument();
    expect(exposed('primaryValue')).toBe('999.1');
    expect(exposed('primaryLabel')).toBe('Renamed label');
  });

  test('[Statistics-PRI-003] prefix and suffix text compose around the primary value with no separator', async () => {
    widget.render({ properties: { primaryPrefixText: binding('$'), primarySuffixText: binding('/mo') } });

    await waitFor(() => expect(screen.getByText('$682.3/mo')).toBeInTheDocument());
  });

  test('[Statistics-PRI-003] empty prefix/suffix defaults produce no visible decoration', async () => {
    widget.render();

    await waitFor(() => expect(screen.getByText('682.3')).toBeInTheDocument());
    expect(screen.queryByText('$682.3')).not.toBeInTheDocument();
  });
});

describe('Statistics: secondary value', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Statistics-SEC-001] hideSecondary: true hides the whole secondary block', async () => {
    widget.render({ properties: { hideSecondary: binding('{{true}}') } });

    await waitFor(() => expect(card()).toBeInTheDocument());
    expect(screen.queryByText('Last month')).not.toBeInTheDocument();
    expect(screen.queryByText('2.85')).not.toBeInTheDocument();
  });

  test('[Statistics-SEC-001] an omitted hideSecondary (the real missing-seed-default) renders the secondary block, same as false', async () => {
    // No `hideSecondary` in properties at all — reproduces the gap in
    // `definition.properties` the contract's research findings recorded.
    widget.render();
    await waitFor(() => expect(screen.getByText('Last month')).toBeInTheDocument());
    expect(screen.getByText('2.85')).toBeInTheDocument();
  });

  test('[Statistics-SEC-001] hideSecondary: false renders the secondary block, same as omitted', async () => {
    widget.render({ properties: { hideSecondary: binding('{{false}}') } });
    await waitFor(() => expect(screen.getByText('Last month')).toBeInTheDocument());
  });

  test('[Statistics-SEC-002] renders the configured secondary label and value', async () => {
    widget.render({ properties: { secondaryValueLabel: binding('vs last quarter'), secondaryValue: binding('7.4') } });

    await waitFor(() => expect(screen.getByText('vs last quarter')).toBeInTheDocument());
    expect(screen.getByText('7.4')).toBeInTheDocument();
  });

  test('[Statistics-SEC-003] secondary prefix and suffix text compose around the secondary value', async () => {
    widget.render({ properties: { secondaryPrefixText: binding('+'), secondarySuffixText: binding('%') } });

    await waitFor(() => expect(screen.getByText('+2.85%')).toBeInTheDocument());
  });

  test('[Statistics-SEC-004] secondarySignDisplay "positive" shows the up-trend icon with the positive color', async () => {
    widget.render({
      styles: { positiveSecondaryValueColor: binding('#0a7d2c'), negativeSecondaryValueColor: binding('#b00020') },
    });

    await waitFor(() => expect(card().querySelector('path[fill="#1E823B"]')).toBeInTheDocument());
    expect(card().querySelector('path[stroke="#D72D39"]')).not.toBeInTheDocument();
    expect(screen.getByText('2.85')).toHaveStyle({ color: '#0a7d2c' });
  });

  test('[Statistics-SEC-004] secondarySignDisplay "negative" shows the down-trend icon with the negative color', async () => {
    widget.render({
      properties: { secondarySignDisplay: binding('negative') },
      styles: { positiveSecondaryValueColor: binding('#0a7d2c'), negativeSecondaryValueColor: binding('#b00020') },
    });

    await waitFor(() => expect(card().querySelector('path[stroke="#D72D39"]')).toBeInTheDocument());
    expect(card().querySelector('path[fill="#1E823B"]')).not.toBeInTheDocument();
    expect(screen.getByText('2.85')).toHaveStyle({ color: '#b00020' });
  });

  test('[Statistics-SEC-004] secondarySignDisplay "none" hides the trend icon but still applies the positive color (characterized as-is)', async () => {
    widget.render({
      properties: { secondarySignDisplay: binding('none') },
      styles: { positiveSecondaryValueColor: binding('#0a7d2c'), negativeSecondaryValueColor: binding('#b00020') },
    });

    await waitFor(() => expect(screen.getByText('2.85')).toBeInTheDocument());
    expect(card().querySelector('path[fill="#1E823B"]')).not.toBeInTheDocument();
    expect(card().querySelector('path[stroke="#D72D39"]')).not.toBeInTheDocument();
    expect(screen.getByText('2.85')).toHaveStyle({ color: '#0a7d2c' });
  });
});

describe('Statistics: layout', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Statistics-LAY-001] dataAlignment sets text alignment for left/center/right', async () => {
    widget.render({ properties: { dataAlignment: binding('left'), iconDirection: binding('left') } });
    await waitFor(() => expect(screen.getByText('682.3')).toHaveStyle({ textAlign: 'left' }));

    widget.render({ properties: { dataAlignment: binding('right'), iconDirection: binding('left') } });
    await waitFor(() => expect(screen.getByText('682.3')).toHaveStyle({ textAlign: 'right' }));

    widget.render({ properties: { dataAlignment: binding('center') } });
    await waitFor(() => expect(screen.getByText('682.3')).toHaveStyle({ textAlign: 'center' }));
  });

  test('[Statistics-LAY-001] dataAlignment: center switches the card to a centered column layout', async () => {
    widget.render({ properties: { dataAlignment: binding('center') } });

    await waitFor(() => expect(card()).toHaveStyle({ flexDirection: 'column', alignItems: 'center' }));
  });

  test('[Statistics-LAY-002] secondaryValueAlignment switches the secondary block between vertical and horizontal', async () => {
    widget.render({ properties: { secondaryValueAlignment: binding('vertical') } });
    await waitFor(() => {
      const label = screen.getByText('Last month');
      expect(label.closest('div')).toHaveClass('tw-flex-col');
    });

    widget.render({ properties: { secondaryValueAlignment: binding('horizontal') } });
    await waitFor(() => {
      const label = screen.getByText('Last month');
      expect(label.closest('div')).not.toHaveClass('tw-flex-col');
    });
  });

  test('[Statistics-LAY-003] the configured icon renders, and changing the icon property renders a different icon', async () => {
    // The real @tabler/icons-react icon component's own identifying
    // `tabler-icon-<name>` class is overwritten (not merged) by the
    // `className="tw-shrink-0"` Statistics.jsx passes in, so the icon is
    // identified here by its real, distinct SVG path data instead.
    widget.render();

    await waitFor(() =>
      expect(card().querySelector('svg.tw-shrink-0 path')).toHaveAttribute(
        'd',
        'M4 6c0 1.657 3.582 3 8 3s8 -1.343 8 -3s-3.582 -3 -8 -3s-8 1.343 -8 3'
      )
    );

    widget.render({ properties: { icon: binding('IconHome2') } });

    await waitFor(() =>
      expect(card().querySelector('svg.tw-shrink-0 path')).toHaveAttribute('d', 'M5 12l-2 0l9 -9l9 9l-2 0')
    );
  });

  test('[Statistics-LAY-004] iconDirection "right" reverses layout only when dataAlignment is left/right, not center', async () => {
    widget.render({ properties: { dataAlignment: binding('left'), iconDirection: binding('right') } });
    await waitFor(() => expect(card()).toHaveStyle({ flexDirection: 'row-reverse' }));

    widget.render({ properties: { dataAlignment: binding('left'), iconDirection: binding('left') } });
    await waitFor(() => expect(card()).not.toHaveStyle({ flexDirection: 'row-reverse' }));

    widget.render({ properties: { dataAlignment: binding('center'), iconDirection: binding('right') } });
    await waitFor(() => expect(card()).toHaveStyle({ flexDirection: 'column' }));
    expect(card()).not.toHaveStyle({ flexDirection: 'row-reverse' });
  });

  test('[Statistics-LAY-005] loadingState: true centers content regardless of dataAlignment and renders only the spinner', async () => {
    widget.render({
      properties: { dataAlignment: binding('left'), iconDirection: binding('left'), loadingState: binding('{{true}}') },
    });

    await waitFor(() => expect(spinner()).toBeInTheDocument());
    expect(card()).toHaveStyle({ flexDirection: 'column', alignItems: 'center' });
    expect(screen.queryByText('682.3')).not.toBeInTheDocument();
    expect(screen.queryByText('Last month')).not.toBeInTheDocument();
    expect(card().querySelector('svg.tabler-icon-database-dollar')).not.toBeInTheDocument();
  });

  test('[Statistics-LAY-005] loadingState: true centers alignment but a default iconDirection: "right" still wins the flex-direction', async () => {
    // Real interaction discovered while characterizing this widget: the loading
    // spread (`dataAlignment === 'center' || isLoading`) and the iconDirection
    // spread (`iconDirection === 'right' && dataAlignment !== 'center'`) both
    // touch `flexDirection`, and the iconDirection spread is applied SECOND in
    // `Statistics.jsx`'s `baseStyle`, so it silently wins whenever both are
    // active — only `alignItems`/`justifyContent` end up centered.
    widget.render({ properties: { dataAlignment: binding('left'), loadingState: binding('{{true}}') } });

    await waitFor(() => expect(spinner()).toBeInTheDocument());
    expect(card()).toHaveStyle({ flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center' });
  });
});

describe('Statistics: styles', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Statistics-STY-001] primary label/value size and color styles apply as configured', async () => {
    widget.render({
      styles: {
        primaryLabelSize: binding('{{20}}'),
        primaryLabelColour: binding('#222222'),
        primaryValueSize: binding('{{48}}'),
        primaryTextColour: binding('#333333'),
      },
    });

    await waitFor(() =>
      expect(screen.getByText('This months earnings')).toHaveStyle({ fontSize: '20px', color: '#222222' })
    );
    expect(screen.getByText('682.3')).toHaveStyle({ fontSize: '48px', color: '#333333' });
  });

  test('[Statistics-STY-001] the dark-mode sentinel fallback only fires for the literal legacy hex value, not the current default', async () => {
    widget.render({ styles: { primaryTextColour: binding('#000000') }, darkMode: true });

    await waitFor(() => expect(screen.getByText('682.3')).toHaveStyle({ color: '#FFFFFC' }));

    widget.render({ styles: { primaryTextColour: binding('#ABCDEF') }, darkMode: true });
    await waitFor(() => expect(screen.getByText('682.3')).toHaveStyle({ color: '#ABCDEF' }));
  });

  test('[Statistics-STY-002] icon color style applies to the rendered icon', async () => {
    widget.render({ styles: { iconColor: binding('#00aabb') } });

    await waitFor(() => expect(card().querySelector('svg.tw-shrink-0')).toHaveAttribute('stroke', '#00aabb'));
  });

  test('[Statistics-STY-003] secondary label/value size and color styles apply as configured', async () => {
    widget.render({
      styles: {
        secondaryLabelSize: binding('{{18}}'),
        secondaryLabelColour: binding('#444444'),
        secondaryValueSize: binding('{{22}}'),
      },
    });

    await waitFor(() => expect(screen.getByText('Last month')).toHaveStyle({ fontSize: '18px', color: '#444444' }));
    expect(screen.getByText('2.85')).toHaveStyle({ fontSize: '22px' });
  });

  test('[Statistics-STY-004] container styles apply, and padding: none changes the computed card height', async () => {
    widget.render({
      styles: { backgroundColor: binding('#101010'), borderColor: binding('#202020'), borderRadius: binding('{{10}}') },
    });

    await waitFor(() =>
      expect(card()).toHaveStyle({ backgroundColor: '#101010', borderRadius: '10px', border: '1px solid #202020' })
    );

    widget.render({ styles: { padding: binding('none') } });
    await waitFor(() => expect(card()).toHaveStyle({ height: '40px' }));

    widget.render({ styles: { padding: binding('default') } });
    await waitFor(() => expect(card()).not.toHaveStyle({ height: '40px' }));
  });
});

describe('Statistics: component-specific actions and state precedence', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Statistics-CSA-001] setPrimaryValue updates the value, survives an unrelated property re-resolve, but yields to a genuine property change', async () => {
    widget.render();
    await waitFor(() => expect(screen.getByText('682.3')).toBeInTheDocument());

    await widget.act('setPrimaryValue', '1234');
    await waitFor(() => expect(screen.getByText('1234')).toBeInTheDocument());
    expect(exposed('primaryValue')).toBe('1234');

    // Unrelated re-resolve: primaryValue property stays the same, an unrelated
    // property (the label) changes.
    widget.render({ properties: { primaryValueLabel: binding('changed label') } });
    await waitFor(() => expect(screen.getByText('changed label')).toBeInTheDocument());
    expect(screen.getByText('1234')).toBeInTheDocument();

    // Genuine change: primaryValue itself is reconfigured and must win.
    widget.render({ properties: { primaryValue: binding('555') } });
    await waitFor(() => expect(screen.getByText('555')).toBeInTheDocument());
    expect(screen.queryByText('1234')).not.toBeInTheDocument();
  });

  test('[Statistics-CSA-002] setSecondaryValue updates the value, survives an unrelated property re-resolve, but yields to a genuine property change', async () => {
    widget.render();
    await waitFor(() => expect(screen.getByText('2.85')).toBeInTheDocument());

    await widget.act('setSecondaryValue', '42');
    await waitFor(() => expect(screen.getByText('42')).toBeInTheDocument());
    expect(exposed('secondaryValue')).toBe('42');

    widget.render({ properties: { secondaryValueLabel: binding('changed label') } });
    await waitFor(() => expect(screen.getByText('changed label')).toBeInTheDocument());
    expect(screen.getByText('42')).toBeInTheDocument();

    widget.render({ properties: { secondaryValue: binding('9') } });
    await waitFor(() => expect(screen.getByText('9')).toBeInTheDocument());
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  test('[Statistics-CSA-003] setLoading toggles the spinner, survives an unrelated property re-resolve, but yields to a genuine property change', async () => {
    widget.render({ properties: { loadingState: binding('{{false}}') } });
    await waitFor(() => expect(screen.getByText('682.3')).toBeInTheDocument());
    expect(spinner()).not.toBeInTheDocument();

    // CSA sets loading ON while the loadingState property stays false.
    await widget.act('setLoading', true);
    await waitFor(() => expect(spinner()).toBeInTheDocument());
    expect(exposed('isLoading')).toBe(true);

    // Unrelated re-resolve: loadingState property is UNCHANGED (still false);
    // a naive implementation that resyncs on every render would wrongly hide
    // the spinner here. (The label itself isn't in the DOM while loading —
    // the whole non-spinner branch is unrendered — so the unrelated change is
    // confirmed via the exposed variable instead of DOM text.)
    widget.render({ properties: { loadingState: binding('{{false}}'), primaryValueLabel: binding('changed label') } });
    await waitFor(() => expect(exposed('primaryLabel')).toBe('changed label'));
    expect(spinner()).toBeInTheDocument();

    // Genuine change #1: loadingState actually flips false -> true.
    widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(spinner()).toBeInTheDocument());

    // Genuine change #2: loadingState actually flips true -> false. This is
    // the discriminating assertion — it only passes if the property change is
    // still driving local state, not merely coinciding with the CSA's earlier
    // (opposite-direction) value.
    widget.render({ properties: { loadingState: binding('{{false}}') } });
    await waitFor(() => expect(spinner()).not.toBeInTheDocument());
  });

  test('[Statistics-CSA-004] setVisibility hides the card without unmounting it, survives an unrelated property re-resolve, but yields to a genuine property change', async () => {
    widget.render({ properties: { visibility: binding('{{true}}') } });
    await waitFor(() => expect(card()).toHaveStyle({ display: 'flex' }));

    // CSA hides the card while the visibility property stays true.
    await widget.act('setVisibility', false);
    await waitFor(() => expect(card()).toHaveStyle({ display: 'none' }));
    expect(card()).toBeInTheDocument();
    expect(exposed('isVisible')).toBe(false);

    // Unrelated re-resolve: visibility property is UNCHANGED (still true); a
    // naive implementation that resyncs on every render would wrongly reveal
    // the card here.
    widget.render({ properties: { visibility: binding('{{true}}'), primaryValueLabel: binding('changed label') } });
    await waitFor(() => expect(screen.getByText('changed label')).toBeInTheDocument());
    expect(card()).toHaveStyle({ display: 'none' });

    // Genuine change #1: visibility actually flips true -> false.
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await waitFor(() => expect(card()).toHaveStyle({ display: 'none' }));

    // Genuine change #2: visibility actually flips false -> true. Discriminating
    // assertion, same reasoning as CSA-003.
    widget.render({ properties: { visibility: binding('{{true}}') } });
    await waitFor(() => expect(card()).toHaveStyle({ display: 'flex' }));
  });
});

describe('Statistics: exposed variables', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Statistics-VAR-001] primaryLabel, secondaryLabel, and secondarySignDisplay exposed variables track their properties', async () => {
    widget.render();
    await waitFor(() => expect(exposed('primaryLabel')).toBe('This months earnings'));
    expect(exposed('secondaryLabel')).toBe('Last month');
    expect(exposed('secondarySignDisplay')).toBe('positive');

    widget.render({
      properties: {
        primaryValueLabel: binding('new primary label'),
        secondaryValueLabel: binding('new secondary label'),
        secondarySignDisplay: binding('negative'),
      },
    });

    await waitFor(() => expect(exposed('primaryLabel')).toBe('new primary label'));
    expect(exposed('secondaryLabel')).toBe('new secondary label');
    expect(exposed('secondarySignDisplay')).toBe('negative');
  });
});
