import { screen, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Contract: frontend/ee/test/app-builder/widgets/BoundedBox/TESTING.md.
// Visibility / Disable for BoundedBox live in Properties → Additional Actions (moved from Styles by the
// MigrateVisibilityDisableTooltipForBoundedBox data migration), each with its CSA and exposed variable.

const ID = 'boundedbox1';

const widget = createWidgetHarness({
  componentType: 'BoundedBox',
  handle: ID,
  id: ID,
  defaultProperties: {
    imageUrl: binding('https://example.com/cars.jpg'),
    defaultValue: binding('{{[]}}'),
    selector: binding('RECTANGLE'),
    labels: binding("{{['Car']}}"),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    collapseWhenHidden: binding('{{false}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
  defaultStyles: {},
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const root = () => document.querySelector('.bounded-box');
const canvasNode = () => document.querySelector(`[data-cy="draggable-widget-${ID}"]`);
const mounted = () => waitFor(() => expect(root()).toBeInTheDocument());

async function setProperty(property, value) {
  await widget.session.store.act(() => widget.setComponentProperty(ID, property, value, 'properties'));
}

describe('BoundedBox widget: additional actions', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[BoundedBox-VIS-002] visibility=false in properties hides the box', async () => {
    // Break this catches: still reading visibility from styles after it moved to properties.
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await mounted();

    expect(root()).toHaveStyle({ display: 'none' });
  });

  test('[BoundedBox-DIS-002] disabledState=true in properties publishes isDisabled and disables the canvas node', async () => {
    // Break this catches: still reading disabledState from styles after it moved to properties.
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await mounted();

    await waitFor(() => expect(exposed()).toMatchObject({ isDisabled: true }));
    expect(canvasNode()).toHaveClass('disabled');
  });

  test('[BoundedBox-CSA-001] setVisibility hides and restores the box and publishes isVisible', async () => {
    // Break this catches: the CSA not being registered on mount, or toggling the DOM without publishing isVisible.
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isVisible: true }));

    await widget.act('setVisibility', false);
    await waitFor(() => expect(root()).toHaveStyle({ display: 'none' }));
    expect(exposed()).toMatchObject({ isVisible: false });

    await widget.act('setVisibility', true);
    await waitFor(() => expect(root()).toHaveStyle({ display: 'block' }));
    expect(exposed()).toMatchObject({ isVisible: true });
  });

  test('[BoundedBox-CSA-002] setDisable publishes isDisabled and toggles the canvas disabled class', async () => {
    // Break this catches: the CSA not being registered, or not publishing isDisabled (which drives
    // RenderWidget's `disabled` canvas class).
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isDisabled: false }));

    await widget.act('setDisable', true);
    await waitFor(() => expect(canvasNode()).toHaveClass('disabled'));
    expect(exposed()).toMatchObject({ isDisabled: true });

    await widget.act('setDisable', false);
    await waitFor(() => expect(canvasNode()).not.toHaveClass('disabled'));
    expect(exposed()).toMatchObject({ isDisabled: false });
  });

  test('[BoundedBox-CSA-003] changed visibility/disabledState properties override earlier CSA calls', async () => {
    // Break this catches: local CSA state no longer yielding to a later change of the owning property.
    widget.render({});
    await mounted();

    await widget.act('setVisibility', false);
    await widget.act('setDisable', true);
    await setProperty('visibility', '{{false}}');
    await setProperty('disabledState', '{{true}}');
    await setProperty('visibility', '{{true}}');
    await setProperty('disabledState', '{{false}}');

    await waitFor(() => expect(root()).toHaveStyle({ display: 'block' }));
    expect(canvasNode()).not.toHaveClass('disabled');
    expect(exposed()).toMatchObject({ isVisible: true, isDisabled: false });
  });

  test('[BoundedBox-TIP-001] a tooltip set under properties is shown on hover', async () => {
    // Break this catches: RenderWidget still reading BoundedBox's tooltip from `general`.
    widget.render({ properties: { tooltip: binding('Draw a box around each car') } });
    await mounted();

    await widget.session.user.hover(root());
    await waitFor(() => expect(screen.getAllByText('Draw a box around each car').length).toBeGreaterThan(0));
  });
});
