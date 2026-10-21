import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// ListView's Visibility / Disable / Loading already live in Additional Actions; these scenarios cover
// their CSAs (setVisibility / setDisable / setLoading) and exposed variables (isVisible / isDisabled /
// isLoading).

const ID = 'listview1';

const widget = createWidgetHarness({
  componentType: 'Listview',
  handle: ID,
  id: ID,
  defaultProperties: {
    dataSourceSelector: binding('rawJson'),
    data: binding("{{[{ text: 'one' }, { text: 'two' }]}}"),
    mode: binding('list'),
    columns: binding('{{3}}'),
    rowHeight: binding('{{100}}'),
    loadingState: binding('{{false}}'),
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
    collapseWhenHidden: binding('{{false}}'),
  },
  defaultStyles: {},
  // Rows render through the real subcontainer, which needs the react-dnd provider.
  capabilities: { dnd: true },
});

const exposed = () => store().getExposedValueOfComponent(ID, MODULE_ID);
const root = () => document.querySelector('.listview-scroll-container');
const mounted = () => waitFor(() => expect(root()).toBeInTheDocument());

async function setProperty(property, value) {
  await widget.session.store.act(() => widget.setComponentProperty(ID, property, value, 'properties'));
}

describe('Listview widget: additional actions', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Listview-CSA-001] setVisibility hides and restores the list and publishes isVisible', async () => {
    // Break this catches: the CSA not being registered on mount, or toggling the DOM without publishing isVisible.
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isVisible: true }));

    await widget.act('setVisibility', false);
    await waitFor(() => expect(root()).toHaveStyle({ display: 'none' }));
    expect(exposed()).toMatchObject({ isVisible: false });

    await widget.act('setVisibility', true);
    await waitFor(() => expect(root()).toHaveStyle({ display: 'flex' }));
    expect(exposed()).toMatchObject({ isVisible: true });
  });

  test('[Listview-CSA-002] setDisable toggles data-disabled, inert and isDisabled', async () => {
    // Break this catches: the CSA not being registered, or the list staying interactive while disabled.
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

  test('[Listview-CSA-003] setLoading swaps the rows for the spinner and publishes isLoading', async () => {
    // Break this catches: no setLoading CSA, or the loading class / spinner not following it.
    widget.render({});
    await mounted();
    await waitFor(() => expect(exposed()).toMatchObject({ isLoading: false }));
    expect(root()).not.toHaveClass('jet-container-loading');

    await widget.act('setLoading', true);
    await waitFor(() => expect(root()).toHaveClass('jet-container-loading'));
    expect(exposed()).toMatchObject({ isLoading: true });

    await widget.act('setLoading', false);
    await waitFor(() => expect(root()).not.toHaveClass('jet-container-loading'));
    expect(exposed()).toMatchObject({ isLoading: false });
  });

  test('[Listview-CSA-004] changed properties override earlier CSA calls', async () => {
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

    await waitFor(() => expect(root()).toHaveStyle({ display: 'flex' }));
    expect(root()).toHaveAttribute('data-disabled', 'false');
    expect(root()).not.toHaveClass('jet-container-loading');
    expect(exposed()).toMatchObject({ isVisible: true, isDisabled: false, isLoading: false });
  });
});
