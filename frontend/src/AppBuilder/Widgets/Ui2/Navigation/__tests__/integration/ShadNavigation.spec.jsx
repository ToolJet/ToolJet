/**
 * UI 2.0 Navigation: an app's menu, as a sidebar (with groups, badges and nested items), a top bar or an icon rail.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Navigation itself does. Titles carry [ShadNavigation-<AREA>-<NNN>] scenario ids.
 * The registered defaults apply: Dashboard (active), Orders (badge 12), Customers, Reports (Sales and Traffic under
 * it) and Settings in a Workspace group.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'nav1';
const widget = createWidgetHarness({
  componentType: 'ShadNavigation',
  handle: 'nav1',
  id: ID,
  widgetHeight: 360,
  widgetWidth: 240,
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const handle = (events) => act(async () => widget.setEvents(events));
const item = (name) => screen.getByRole('button', { name: new RegExp(`^${name}`) });
const press = async (name) => {
  await act(async () => fireEvent.click(item(name)));
};
const active = () => document.querySelector('nav [aria-current]');

describe('UI 2.0 Navigation', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadNavigation-DEF-001] a sidebar with the default item active, badges and group headings', async () => {
    render();

    await waitFor(() => expect(active()).toHaveTextContent('Dashboard'));
    expect(active()).toHaveAttribute('aria-current', 'page');
    expect(item('Orders')).toHaveTextContent('12');
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    await waitFor(() => expect(exposed().value).toBe('dashboard'));
    expect(exposed()).toMatchObject({
      selectedItem: { label: 'Dashboard', value: 'dashboard', parentLabel: null, parentValue: null },
      previousSelectedItem: null,
      isCollapsed: false,
    });
  });

  test('[ShadNavigation-PROP-001] items with children open as a nested list in the sidebar, and a child can be picked', async () => {
    render();
    await screen.findByRole('button', { name: /^Reports/ });
    expect(item('Reports')).toHaveAttribute('aria-expanded', 'false');

    await press('Reports');
    expect(item('Reports')).toHaveAttribute('aria-expanded', 'true');
    await press('Sales');

    await waitFor(() => expect(exposed().value).toBe('sales'));
    expect(exposed().selectedItem).toEqual({
      label: 'Sales',
      value: 'sales',
      parentLabel: 'Reports',
      parentValue: 'reports',
    });
  });

  test('[ShadNavigation-PROP-002] defaultValue names the active item, and a child opens its parent', async () => {
    render({ properties: { defaultValue: binding('traffic') } });

    await waitFor(() => expect(active()).toHaveTextContent('Traffic'));
    expect(item('Reports')).toHaveAttribute('aria-expanded', 'true');
    expect(exposed().selectedItem).toMatchObject({ value: 'traffic', parentValue: 'reports' });
  });

  test('[ShadNavigation-PROP-003] orientation horizontal is a top bar whose parents open their children in a menu', async () => {
    render({ properties: { orientation: binding('horizontal') } });
    await screen.findByRole('button', { name: /^Reports/ });

    await act(async () => fireEvent.keyDown(item('Reports'), { key: 'Enter' }));
    await act(async () => fireEvent.click(screen.getByRole('menuitem', { name: /Traffic/ })));

    await waitFor(() => expect(exposed().selectedItem).toMatchObject({ value: 'traffic', parentLabel: 'Reports' }));
    expect(screen.getByRole('navigation')).not.toHaveClass('flex-col');
  });

  test('[ShadNavigation-PROP-004] variant, size and align shape the items and the bar', async () => {
    render({
      properties: { orientation: binding('horizontal'), variant: binding('underline'), align: binding('center') },
    });

    await waitFor(() => expect(active()).toHaveTextContent('Dashboard'));
    expect(active()).toHaveClass('border-b-2');
    expect(screen.getByRole('navigation')).toHaveClass('justify-center');

    // (An underline top bar keeps its 40px tabs whatever the size; pills follow it.)
    await act(async () => render({ properties: { orientation: binding('horizontal'), size: binding('sm') } }));
    expect(item('Orders')).toHaveClass('h-8');

    await act(async () => render({ properties: { orientation: binding('horizontal'), align: binding('stretch') } }));
    expect(item('Orders')).toHaveClass('flex-1');
  });

  test('[ShadNavigation-PROP-005] collapsed draws an icon rail: labels hidden but still naming the items', async () => {
    render({ properties: { collapsed: binding('{{true}}') } });

    await waitFor(() => expect(exposed().isCollapsed).toBe(true));
    expect(item('Orders')).toHaveAttribute('title', 'Orders');
    expect(screen.getByText('Orders')).toHaveClass('sr-only');
    expect(screen.queryByText('Workspace')).not.toBeInTheDocument();
  });

  test('[ShadNavigation-EVT-001] clicking an item fires onClick, whose handler reads the new and previous items', async () => {
    render();
    await handle(setVariableOn(ID, 'onClick', { value: '{{components.nav1.selectedItem.value}}' }));
    await screen.findByRole('button', { name: /^Orders/ });

    await press('Orders');

    await waitFor(() => expect(widget.variables().seen).toBe('orders'));
    expect(exposed().value).toBe('orders');
    expect(exposed().previousSelectedItem).toMatchObject({ value: 'dashboard' });
    expect(active()).toHaveTextContent('Orders');
  });

  test('[ShadNavigation-ACT-001] selectItem makes an item active without firing onClick', async () => {
    render();
    await handle(countInvocationsOn(ID, 'onClick'));

    await widget.act('selectItem', 'customers');

    await waitFor(() => expect(exposed().value).toBe('customers'));
    expect(active()).toHaveTextContent('Customers');
    expect(exposed().previousSelectedItem).toMatchObject({ value: 'dashboard' });
    expect(widget.variables().calls).toBeUndefined();
  });

  test('[ShadNavigation-ACT-002] setItemVisibility hides an item; setItemDisable makes one unclickable', async () => {
    render();
    await handle(countInvocationsOn(ID, 'onClick'));

    await widget.act('setItemVisibility', 'orders', false);
    await waitFor(() => expect(screen.queryByRole('button', { name: /^Orders/ })).not.toBeInTheDocument());
    await widget.act('setItemDisable', 'customers', true);
    await waitFor(() => expect(item('Customers')).toBeDisabled());
    await press('Customers');
    expect(exposed().value).toBe('dashboard');
    expect(widget.variables().calls).toBeUndefined();

    await widget.act('setItemVisibility', 'orders', true);
    expect(await screen.findByRole('button', { name: /^Orders/ })).toBeInTheDocument();
  });

  test('[ShadNavigation-ACT-003] setCollapsed folds the sidebar to an icon rail and back', async () => {
    render();

    await widget.act('setCollapsed', true);
    await waitFor(() => expect(exposed().isCollapsed).toBe(true));
    expect(screen.getByText('Orders')).toHaveClass('sr-only');

    await widget.act('setCollapsed', false);
    await waitFor(() => expect(exposed().isCollapsed).toBe(false));
    expect(screen.getByText('Orders')).not.toHaveClass('sr-only');
  });

  test('[ShadNavigation-STY-001] colour and radius styles reach the menu as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#0f172a'),
        textColor: binding('#cbd5e1'),
        iconColor: binding('#94a3b8'),
        hoverBackgroundColor: binding('#1e293b'),
        activeBackgroundColor: binding('#e11d48'),
        activeTextColor: binding('#ffffff'),
        indicatorColor: binding('#f43f5e'),
        badgeBackgroundColor: binding('#334155'),
        badgeTextColor: binding('#f8fafc'),
        groupLabelColor: binding('#64748b'),
        separatorColor: binding('#475569'),
        itemRadius: binding('{{12}}'),
      },
    });

    await waitFor(() => expect(active()).toHaveTextContent('Dashboard'));
    const root = container.querySelector('.tj-shadcn');
    const vars = {
      '--lk-bg': '#0f172a',
      '--lk-fg': '#cbd5e1',
      '--lk-icon': '#94a3b8',
      '--lk-hover': '#1e293b',
      '--lk-active-bg': '#e11d48',
      '--lk-active-fg': '#ffffff',
      '--lk-indicator': '#f43f5e',
      '--lk-badge-bg': '#334155',
      '--lk-badge-fg': '#f8fafc',
      '--lk-group': '#64748b',
      '--lk-sep': '#475569',
      '--lk-radius': '12px',
    };
    Object.entries(vars).forEach(([name, value]) => expect(root.style.getPropertyValue(name)).toBe(value));
    expect(active().className).toContain('var(--lk-active-bg');
  });
});
