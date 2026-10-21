import { screen, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Visibility / Disable for Timer live in Properties → Additional Actions (moved from Styles by the
// MigrateVisibilityDisableTooltipForTimer data migration), each with its CSA and exposed variable.

const ID = 'timer1';

const widget = createWidgetHarness({
  componentType: 'Timer',
  handle: ID,
  id: ID,
  defaultProperties: {
    value: binding('00:00:00:000'),
    type: binding('countUp'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    collapseWhenHidden: binding('{{false}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
  defaultStyles: {},
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const root = () => document.querySelector(`[data-cy="${ID}"]`);
const startButton = () => screen.getByText('Start');
const resetButton = () => screen.getByText('Reset');
const mounted = () => waitFor(() => expect(root()).toBeInTheDocument());

async function setProperty(property, value) {
  await widget.session.store.act(() => widget.setComponentProperty(ID, property, value, 'properties'));
}

describe('Timer widget: additional actions', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Timer-VIS-001] visibility=false in properties hides the timer', async () => {
    // Break this catches: still reading visibility from styles after it moved to properties.
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await mounted();

    expect(root()).toHaveStyle({ display: 'none' });
  });

  test('[Timer-DIS-001] disabledState=true in properties disables the timer buttons', async () => {
    // Break this catches: still reading disabledState from styles after it moved to properties.
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await mounted();

    expect(startButton()).toHaveClass('disabled');
    expect(resetButton()).toHaveClass('disabled');
  });

  test('[Timer-CSA-001] setVisibility hides and restores the timer and publishes isVisible', async () => {
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

  test('[Timer-CSA-002] setDisable toggles the disabled buttons and publishes isDisabled', async () => {
    // Break this catches: the CSA not being registered, or the buttons staying clickable while disabled.
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isDisabled: false }));
    expect(startButton()).not.toHaveClass('disabled');

    await widget.act('setDisable', true);
    await waitFor(() => expect(startButton()).toHaveClass('disabled'));
    expect(resetButton()).toHaveClass('disabled');
    expect(exposed()).toMatchObject({ isDisabled: true });

    await widget.act('setDisable', false);
    await waitFor(() => expect(startButton()).not.toHaveClass('disabled'));
    expect(exposed()).toMatchObject({ isDisabled: false });
  });

  test('[Timer-CSA-003] changed visibility/disabledState properties override earlier CSA calls', async () => {
    // Break this catches: local CSA state no longer yielding to a later change of the owning property.
    widget.render({});
    await mounted();

    await widget.act('setVisibility', false);
    await widget.act('setDisable', true);
    await setProperty('visibility', '{{false}}');
    await setProperty('disabledState', '{{true}}');
    await setProperty('visibility', '{{true}}');
    await setProperty('disabledState', '{{false}}');

    await waitFor(() => expect(root()).not.toHaveStyle({ display: 'none' }));
    expect(startButton()).not.toHaveClass('disabled');
    expect(exposed()).toMatchObject({ isVisible: true, isDisabled: false });
  });

  test('[Timer-TIP-001] a tooltip set under properties is shown on hover', async () => {
    // Break this catches: RenderWidget still reading Timer's tooltip from `general`.
    widget.render({ properties: { tooltip: binding('Time left in the round') } });
    await mounted();

    await widget.session.user.hover(root());
    await waitFor(() => expect(screen.getAllByText('Time left in the round').length).toBeGreaterThan(0));
  });
});
