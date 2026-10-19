import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Visibility / Disable for Kanban live in Properties → Additional Actions (moved from Styles by the
// MigrateVisibilityDisableForKanban data migration), each with its CSA and exposed variable.

const ID = 'kanban1';

const widget = createWidgetHarness({
  componentType: 'Kanban',
  handle: ID,
  id: ID,
  defaultProperties: {
    columnData: binding("{{[{ id: 'c1', title: 'To do' }]}}"),
    // No cards: these scenarios only exercise the board root, and card rendering needs dnd-kit sensors.
    cardData: binding('{{[]}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    collapseWhenHidden: binding('{{false}}'),
    tooltip: binding(''),
    tooltipFormat: binding('plainText'),
  },
  defaultStyles: {
    accentColor: binding('var(--cc-primary-brand)'),
  },
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const root = () => document.querySelector(`[data-cy="${ID}"]`);
const mounted = () => waitFor(() => expect(root()).toBeInTheDocument());

async function setProperty(property, value) {
  await widget.session.store.act(() => widget.setComponentProperty(ID, property, value, 'properties'));
}

describe('Kanban widget: additional actions', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Kanban-VIS-001] visibility=false in properties hides the board', async () => {
    // Break this catches: still reading visibility from styles after it moved to properties.
    widget.render({ properties: { visibility: binding('{{false}}') } });
    await mounted();

    expect(root()).toHaveStyle({ display: 'none' });
  });

  test('[Kanban-DIS-001] disabledState=true in properties blocks the board (data-disabled + inert)', async () => {
    // Break this catches: still reading disabledState from styles after it moved to properties.
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await mounted();

    expect(root()).toHaveAttribute('data-disabled', 'true');
    expect(root().inert).toBe(true);
  });

  test('[Kanban-CSA-001] setVisibility hides and restores the board and publishes isVisible', async () => {
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

  test('[Kanban-CSA-002] setDisable toggles data-disabled, inert and isDisabled', async () => {
    // Break this catches: the CSA not being registered, or the board staying interactive while disabled.
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isDisabled: false }));

    await widget.act('setDisable', true);
    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'true'));
    expect(root().inert).toBe(true);
    expect(exposed()).toMatchObject({ isDisabled: true });

    await widget.act('setDisable', false);
    await waitFor(() => expect(root()).toHaveAttribute('data-disabled', 'false'));
    expect(root().inert).toBe(false);
    expect(exposed()).toMatchObject({ isDisabled: false });
  });

  test('[Kanban-CSA-003] changed visibility/disabledState properties override earlier CSA calls', async () => {
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
    expect(root()).toHaveAttribute('data-disabled', 'false');
    expect(exposed()).toMatchObject({ isVisible: true, isDisabled: false });
  });
});
