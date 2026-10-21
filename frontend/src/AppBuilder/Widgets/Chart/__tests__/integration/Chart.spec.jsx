import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Visibility / Disable for Chart live in Properties → Additional Actions (moved from Styles by the
// MigrateVisibilityDisableTooltipForChart data migration), Loading moved from the Options section to
// Additional Actions, and each has its CSA + exposed variable.
//
// Plotly cannot draw in jsdom, so the factory is stubbed at the module boundary: the stub renders a
// marker element and records the latest onClick prop so a data-point click can be simulated.

let latestPlotProps = {};
jest.mock('plotly.js-dist-min', () => ({}));
jest.mock('react-plotly.js/factory', () => () => (props) => {
  latestPlotProps = props;
  return <div data-testid="plotly-stub" />;
});

const ID = 'chart1';

const widget = createWidgetHarness({
  componentType: 'Chart',
  handle: ID,
  id: ID,
  defaultProperties: {
    title: binding('Sales'),
    type: binding('bar'),
    data: binding('{{[{ "x": "Jan", "y": 100 }]}}'),
    plotFromJson: binding('{{false}}'),
    showAxes: binding('{{true}}'),
    showGridLines: binding('{{true}}'),
    markerColor: binding('var(--cc-primary-brand)'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
  defaultStyles: {
    backgroundColor: binding('var(--cc-surface1-surface)'),
    borderColor: binding('var(--cc-default-border)'),
    padding: binding('50'),
    borderRadius: binding('{{6}}'),
  },
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const root = () => document.querySelector(`[data-cy="${ID}"]`);
const mounted = () => waitFor(() => expect(root()).toBeInTheDocument());

async function setProperty(property, value) {
  await widget.session.store.act(() => widget.setComponentProperty(ID, property, value, 'properties'));
}

const clickPoint = () =>
  widget.session.store.act(async () => {
    latestPlotProps.onClick?.({ points: [{ x: 'Jan', y: 100, fullData: { name: 'trace' } }] });
  });

const clickCounter = () =>
  setVariableOn(ID, 'onClick', { key: 'clickCount', value: '{{(variables.clickCount ?? 0) + 1}}' });

describe('Chart widget: additional actions', () => {
  beforeEach(() => {
    latestPlotProps = {};
    widget.setup();
  });
  afterEach(() => widget.teardown());

  test('[Chart-VIS-001] visibility=false in properties hides the chart', async () => {
    // Break this catches: still reading visibility from styles after it moved to properties.
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await mounted();

    expect(root()).toHaveStyle({ display: 'none' });
  });

  test('[Chart-DIS-001] disabledState=true in properties sets data-disabled and blocks a point click', async () => {
    // Break this catches: still reading disabledState from styles, so a disabled chart stays clickable.
    widget.render({ properties: { disabledState: binding('{{true}}') }, events: clickCounter() });
    await mounted();

    expect(root()).toHaveAttribute('data-disabled', 'true');
    await clickPoint();
    expect(widget.variables().clickCount).toBeUndefined();
  });

  test('[Chart-CSA-001] setVisibility hides and restores the chart and publishes isVisible', async () => {
    // Break this catches: the CSA not being registered on mount, or toggling the DOM without publishing isVisible.
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isVisible: true }));

    await widget.act('setVisibility', false);
    await waitFor(() => expect(root()).toHaveStyle({ display: 'none' }));
    expect(exposed()).toMatchObject({ isVisible: false });

    await widget.act('setVisibility', true);
    await waitFor(() => expect(root()).not.toHaveStyle({ display: 'none' }));
    expect(exposed()).toMatchObject({ isVisible: true });
  });

  test('[Chart-CSA-002] setDisable publishes isDisabled and blocks point clicks made after it', async () => {
    // Break this catches: the CSA not being registered, not publishing isDisabled, or the disabled
    // guard no longer blocking point clicks.
    widget.render({ events: clickCounter() });
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isDisabled: false }));

    await widget.act('setDisable', true);
    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'true'));
    expect(exposed()).toMatchObject({ isDisabled: true });
    await clickPoint();
    expect(widget.variables().clickCount).toBeUndefined();

    await widget.act('setDisable', false);
    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'false'));
    await clickPoint();
    await waitFor(() => expect(widget.variables().clickCount).toBe(1));
  });

  test('[Chart-DIS-002] a chart disabled at mount accepts point clicks once it is enabled', async () => {
    // Break this catches: the memoized click handler keeping the mount-time disabled flag, so a chart
    // that starts disabled never fires onClick after being enabled (by property or by setDisable).
    widget.render({ properties: { disabledState: binding('{{true}}') }, events: clickCounter() });
    await mounted();

    await setProperty('disabledState', '{{false}}');
    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'false'));
    await clickPoint();
    await waitFor(() => expect(widget.variables().clickCount).toBe(1));

    await widget.act('setDisable', true);
    await widget.act('setDisable', false);
    await clickPoint();
    await waitFor(() => expect(widget.variables().clickCount).toBe(2));
  });

  test('[Chart-CSA-003] setLoading swaps in the loader and publishes isLoading', async () => {
    // Break this catches: no setLoading CSA, or the loader not following it.
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isLoading: false }));
    expect(screen.getByTestId('plotly-stub')).toBeInTheDocument();

    await widget.act('setLoading', true);
    await waitFor(() => expect(root().querySelector('.loader-main-container')).toBeInTheDocument());
    expect(exposed()).toMatchObject({ isLoading: true });

    await widget.act('setLoading', false);
    await waitFor(() => expect(screen.getByTestId('plotly-stub')).toBeInTheDocument());
    expect(exposed()).toMatchObject({ isLoading: false });
  });

  test('[Chart-CSA-004] changed properties override earlier CSA calls', async () => {
    // Break this catches: local CSA state no longer yielding to a later change of the owning property.
    widget.render({});
    await mounted();

    await widget.act('setVisibility', false);
    await widget.act('setDisable', true);
    await widget.act('setLoading', true);
    await setProperty('visibility', '{{false}}');
    await setProperty('disabledState', '{{true}}');
    await setProperty('loadingState', '{{true}}');
    await setProperty('visibility', '{{true}}');
    await setProperty('disabledState', '{{false}}');
    await setProperty('loadingState', '{{false}}');

    await waitFor(() => expect(root()).not.toHaveStyle({ display: 'none' }));
    expect(root()).toHaveAttribute('data-disabled', 'false');
    expect(screen.getByTestId('plotly-stub')).toBeInTheDocument();
    expect(exposed()).toMatchObject({ isVisible: true, isDisabled: false, isLoading: false });
  });

  test('[Chart-TIP-001] a tooltip set under properties is shown on hover', async () => {
    // Break this catches: RenderWidget still reading Chart's tooltip from `general`.
    widget.render({ properties: { tooltip: binding('Monthly sales') } });
    await mounted();

    await widget.session.user.hover(root());
    await waitFor(() => expect(screen.getAllByText('Monthly sales').length).toBeGreaterThan(0));
  });
});
