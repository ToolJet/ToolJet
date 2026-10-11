/**
 * Statistics' shipped defaults, asserted against the rendered DOM rather than the config values.
 * Behaviour beyond the defaults is covered by ./statistics.spec.jsx.
 */
import { screen, waitFor } from '@testing-library/react';
import { statisticsConfig } from '@/AppBuilder/WidgetManager/widgets/statistics';
import { createWidgetHarness } from './widgetHarness';

const widget = createWidgetHarness({
  componentType: 'Statistics',
  handle: 'statistics1',
  id: 'stat',
  defaultProperties: statisticsConfig.definition.properties,
  defaultStyles: statisticsConfig.definition.styles,
  widgetHeight: 152,
  widgetWidth: 300,
});

const primaryLabel = () => screen.findByText('This months earnings');
const primaryValue = () => screen.findByText('682.3');

describe('Statistics shipped defaults', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('primary label renders at 12px', async () => {
    widget.render();
    expect(await primaryLabel()).toHaveStyle({ fontSize: '12px' });
  });

  test('primary value renders at 16px', async () => {
    widget.render();
    expect(await primaryValue()).toHaveStyle({ fontSize: '16px' });
  });

  test('the secondary value is hidden', async () => {
    widget.render();
    await waitFor(() => expect(screen.getByText('682.3')).toBeInTheDocument());

    expect(screen.queryByText('Last month')).not.toBeInTheDocument();
    expect(screen.queryByText('2.85')).not.toBeInTheDocument();
  });

  test('data is left aligned', async () => {
    widget.render();
    expect(await primaryValue()).toHaveStyle({ textAlign: 'left' });
  });

  // Not the server-side merge that caused the regression — that lives in
  // server/test/modules/apps/unit/apps-statistics-hide-secondary.spec.ts.
  test('the renderer shows the secondary value when hideSecondary is absent', async () => {
    const { hideSecondary: _omitted, ...propertiesAsSavedBefore } = statisticsConfig.definition.properties;
    widget.render({ properties: { ...propertiesAsSavedBefore, hideSecondary: undefined } });

    expect(await screen.findByText('Last month')).toBeInTheDocument();
    expect(await screen.findByText('2.85')).toBeInTheDocument();
  });

  // Without this, the suite could not tell a default from a forced value.
  test('a saved value wins over every one of those defaults', async () => {
    widget.render({
      properties: { hideSecondary: { value: '{{false}}' }, dataAlignment: { value: 'center' } },
      styles: { primaryLabelSize: { value: '{{14}}' }, primaryValueSize: { value: '{{34}}' } },
    });

    expect(await primaryLabel()).toHaveStyle({ fontSize: '14px' });
    expect(await primaryValue()).toHaveStyle({ fontSize: '34px', textAlign: 'center' });
    expect(await screen.findByText('Last month')).toBeInTheDocument();
    expect(await screen.findByText('2.85')).toBeInTheDocument();
  });
});
