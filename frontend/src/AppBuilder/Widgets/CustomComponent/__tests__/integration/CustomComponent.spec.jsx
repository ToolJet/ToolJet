import { screen, waitFor } from '@testing-library/react';
import { createWidgetHarness, binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

// Visibility for CustomComponent lives in Properties → Additional Actions (moved from Styles by the
// MigrateVisibilityTooltipForCustomComponent data migration), with a setVisibility CSA and isVisible.
// Its tooltip moved from the universal `general.tooltip` to properties (tooltip + tooltipFormat) in the same migration.

const ID = 'customcomponent1';

const defaultProperties = {
  data: binding("{{{ title: 'Hi! There' }}}"),
  code: binding(''),
  visibility: binding('{{true}}'),
  tooltip: binding(''),
  tooltipFormat: binding('plainText'),
};

const defaultStyles = {
  borderRadius: binding('{{6}}'),
  borderColor: binding('var(--cc-weak-border)'),
  boxShadow: binding('0px 0px 0px 0px #00000040'),
};

const widget = createWidgetHarness({
  componentType: 'CustomComponent',
  handle: ID,
  id: ID,
  defaultProperties,
  defaultStyles,
});

const root = (container) => container.querySelector(`[data-cy="${ID}"]`);

async function setProperty(property, value) {
  await widget.session.store.act(() => widget.setComponentProperty(ID, property, value, 'properties'));
}

const mounted = async (container) =>
  waitFor(() => {
    const node = root(container);
    expect(node).toBeInTheDocument();
    return node;
  });

describe('CustomComponent widget: visibility', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[CustomComponent-VIS-001] visibility=false in properties hides the card', async () => {
    // Break this catches: still reading visibility from styles after it moved to properties.
    const { container } = widget.render({ properties: { visibility: binding('{{false}}') } });
    const card = await mounted(container);

    expect(card).toHaveStyle({ display: 'none' });
  });

  test('[CustomComponent-CSA-001] setVisibility hides and restores the card and publishes isVisible', async () => {
    // Break this catches: the CSA not being registered on mount, or toggling the DOM without publishing isVisible.
    const { container } = widget.render();
    const card = await mounted(container);
    await waitFor(() => expect(widget.exposed()).toMatchObject({ isVisible: true }));

    await widget.act('setVisibility', false);
    await waitFor(() => expect(card).toHaveStyle({ display: 'none' }));
    expect(widget.exposed()).toMatchObject({ isVisible: false });

    await widget.act('setVisibility', true);
    await waitFor(() => expect(card).not.toHaveStyle({ display: 'none' }));
    expect(widget.exposed()).toMatchObject({ isVisible: true });
  });

  test('[CustomComponent-CSA-002] a visibility property change overrides an earlier setVisibility', async () => {
    // Break this catches: local CSA state no longer yielding to a later change of the Visibility property.
    const { container } = widget.render();
    const card = await mounted(container);

    await widget.act('setVisibility', false);
    await waitFor(() => expect(card).toHaveStyle({ display: 'none' }));

    await setProperty('visibility', '{{false}}');
    await setProperty('visibility', '{{true}}');
    await waitFor(() => expect(card).not.toHaveStyle({ display: 'none' }));
    expect(widget.exposed()).toMatchObject({ isVisible: true });
  });
});

describe('CustomComponent widget: tooltip', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[CustomComponent-TIP-001] a tooltip set under properties is shown on hover', async () => {
    // Break this catches: RenderWidget still reading CustomComponent's tooltip from `general`
    // after it moved to properties (SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY).
    const { container } = widget.render({ properties: { tooltip: binding('Open the chart') } });
    const card = await mounted(container);

    await widget.session.user.hover(card);
    await waitFor(() => expect(screen.getAllByText('Open the chart').length).toBeGreaterThan(0));
  });
});
