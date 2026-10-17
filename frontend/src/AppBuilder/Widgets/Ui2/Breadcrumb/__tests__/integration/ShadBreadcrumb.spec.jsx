/**
 * UI 2.0 Breadcrumb: the trail of pages leading to the current one, each earlier crumb a way back up.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Breadcrumb itself does. Titles carry [ShadBreadcrumb-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'bc1';
const widget = createWidgetHarness({
  componentType: 'ShadBreadcrumb',
  handle: 'breadcrumb1',
  id: ID,
  widgetHeight: 40,
  widgetWidth: 480,
  defaultProperties: { items: binding("{{['Home', 'Fleet', 'Seraphine']}}") },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
// Wiring a handler re-renders the crumbs (they become buttons), so it happens inside act.
const handle = (events) => act(async () => widget.setEvents(events));
const trail = () => within(screen.getByRole('navigation', { name: 'breadcrumb' }));
const crumbs = () => [...document.querySelectorAll('nav[aria-label=breadcrumb] li')].map((li) => li.textContent);

describe('UI 2.0 Breadcrumb', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadBreadcrumb-DEF-001] shows each of the items in order, and nothing is clicked yet', async () => {
    render();

    await waitFor(() => expect(crumbs()).toEqual(['Home', 'Fleet', 'Seraphine']));
    expect(exposed().lastClickedItem).toEqual({});
  });

  test('[ShadBreadcrumb-DEF-002] without an onItemClicked handler the crumbs are plain text, not buttons', async () => {
    render();

    await waitFor(() => expect(crumbs()).toHaveLength(3));
    expect(trail().queryAllByRole('button')).toHaveLength(0);
  });

  test('[ShadBreadcrumb-PROP-001] items may be objects, shown by their title', async () => {
    render({ properties: { items: binding("{{[{ title: 'Orders', id: 7 }, { title: 'Order 7' }]}}") } });

    await waitFor(() => expect(crumbs()).toEqual(['Orders', 'Order 7']));
  });

  // A list bound by mistake (10k rows) drew every crumb; the trail now keeps the first, an ellipsis and the last six.
  test('[ShadBreadcrumb-PROP-002] a long trail shows the first item, an ellipsis and the last six', async () => {
    const items = Array.from({ length: 12 }, (_, i) => `Page ${i}`);
    render({ properties: { items: binding(`{{${JSON.stringify(items)}}}`) } });

    await waitFor(() =>
      expect(crumbs()).toEqual(['Page 0', '…', 'Page 6', 'Page 7', 'Page 8', 'Page 9', 'Page 10', 'Page 11'])
    );
  });

  test('[ShadBreadcrumb-EVT-001] clicking a crumb fires onItemClicked, and its handler reads lastClickedItem', async () => {
    render();
    await handle(setVariableOn(ID, 'onItemClicked', { value: '{{components.breadcrumb1.lastClickedItem.title}}' }));

    const fleet = await trail().findByRole('button', { name: 'Fleet' });
    await act(async () => fireEvent.click(fleet));

    await waitFor(() => expect(widget.variables().seen).toBe('Fleet'));
    expect(exposed().lastClickedItem).toEqual({ title: 'Fleet', index: 1 });
  });

  test('[ShadBreadcrumb-EVT-002] an object crumb reports all its fields, and its index in the whole trail', async () => {
    const items = [{ title: 'Root', path: '/' }, ...Array.from({ length: 11 }, (_, i) => ({ title: `Leaf ${i}` }))];
    render({ properties: { items: binding(`{{${JSON.stringify(items)}}}`) } });
    await handle(setVariableOn(ID, 'onItemClicked', { value: '{{components.breadcrumb1.lastClickedItem.index}}' }));

    await act(async () => fireEvent.click(await trail().findByRole('button', { name: 'Leaf 7' })));
    await waitFor(() => expect(widget.variables().seen).toBe(8));

    await act(async () => fireEvent.click(trail().getByRole('button', { name: 'Root' })));
    await waitFor(() => expect(exposed().lastClickedItem).toEqual({ title: 'Root', path: '/', index: 0 }));
  });

  test('[ShadBreadcrumb-EVT-003] the ellipsis of a long trail is not a crumb: it is no button and fires nothing', async () => {
    const items = Array.from({ length: 12 }, (_, i) => `Page ${i}`);
    render({ properties: { items: binding(`{{${JSON.stringify(items)}}}`) } });
    await handle(setVariableOn(ID, 'onItemClicked'));

    const ellipsis = await trail().findByText('…');
    expect(ellipsis).not.toHaveAttribute('role', 'button');
    await act(async () => fireEvent.click(ellipsis));

    expect(widget.variables().seen).toBeUndefined();
    expect(exposed().lastClickedItem).toEqual({});
  });

  test('[ShadBreadcrumb-KBD-001] a clickable crumb is a Tab stop and Enter on it fires onItemClicked', async () => {
    render();
    await handle(setVariableOn(ID, 'onItemClicked', { value: '{{components.breadcrumb1.lastClickedItem.title}}' }));

    const home = await trail().findByRole('button', { name: 'Home' });
    expect(home).toHaveAttribute('tabindex', '0');
    await act(async () => fireEvent.keyDown(home, { key: 'Enter' }));

    await waitFor(() => expect(widget.variables().seen).toBe('Home'));
  });

  test('[ShadBreadcrumb-STY-001] text, current-crumb and separator colours reach the trail as CSS variables', async () => {
    const { container } = render({
      styles: {
        textColor: binding('#475569'),
        currentColor: binding('#e11d48'),
        separatorColor: binding('#94a3b8'),
      },
    });

    await waitFor(() => expect(crumbs()).toHaveLength(3));
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#475569');
    expect(root.style.getPropertyValue('--lk-current')).toBe('#e11d48');
    expect(root.style.getPropertyValue('--lk-sep')).toBe('#94a3b8');
    expect(trail().getByText('Seraphine').className).toContain('var(--lk-current');
  });
});
