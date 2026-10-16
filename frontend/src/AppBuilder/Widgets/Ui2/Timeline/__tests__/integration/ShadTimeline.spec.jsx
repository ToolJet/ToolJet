/**
 * UI 2.0 Timeline: a vertical list of events with markers, times and statuses.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Timeline itself does. Titles carry [ShadTimeline-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { createWidgetHarness, binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'tl1';
const ITEMS =
  "{{[{ title: 'Order placed', description: 'Order #1024', time: '2026-03-04T09:12:00', status: 'done', icon: 'shopping-cart' }, { title: 'Packed', time: '11:30', status: 'active', icon: 'package' }, { title: 'Out for delivery', time: 'Pending', status: 'pending' }]}}";
const widget = createWidgetHarness({
  componentType: 'ShadTimeline',
  handle: 'timeline1',
  id: ID,
  widgetHeight: 300,
  widgetWidth: 360,
  defaultProperties: { items: binding(ITEMS) },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const items = () => screen.getAllByRole('listitem');
const titles = () => items().map((li) => li.querySelector('.font-medium').textContent);
const marker = (li) => li.querySelector('.rounded-full');
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Timeline', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadTimeline-DEF-001] lists items in order with dot markers, descriptions and times on the right', async () => {
    render();

    await waitFor(() => expect(titles()).toEqual(['Order placed', 'Packed', 'Out for delivery']));
    expect(screen.getByText('Order #1024')).toBeInTheDocument();
    expect(screen.getByText('11:30')).toBeInTheDocument();
    expect(marker(items()[0]).style.width).toBe('10px');
    expect(items()[0]).toHaveClass('pb-6');
    // The time shares the title's line.
    expect(screen.getByText('11:30').parentElement).toHaveTextContent('Packed');
    expect(exposed().lastClickedItem).toEqual({});
  });

  test('[ShadTimeline-PROP-001] items accepts plain text entries; none shows No activity yet', async () => {
    render({ properties: { items: binding("{{['Created', 'Approved']}}") } });
    await waitFor(() => expect(titles()).toEqual(['Created', 'Approved']));

    render({ properties: { items: binding('{{[]}}') } });
    expect(await screen.findByText('No activity yet')).toBeInTheDocument();
  });

  test('[ShadTimeline-PROP-002] marker icon draws each item icon in a circle', async () => {
    render({ properties: { marker: binding('icon') } });

    await waitFor(() => expect(items()[0].querySelector('svg')).toHaveClass('lucide-shopping-cart'));
    expect(marker(items()[0]).style.width).toBe('28px');
    // An item without an icon keeps a dot inside its circle.
    expect(items()[2].querySelector('svg')).toBeNull();
  });

  test('[ShadTimeline-PROP-003] density compact tightens the gaps and markers', async () => {
    render({ properties: { density: binding('compact') } });

    await waitFor(() => expect(items()[0]).toHaveClass('pb-3'));
    expect(marker(items()[0]).style.width).toBe('8px');
  });

  test('[ShadTimeline-PROP-004] newestFirst reverses the order', async () => {
    render({ properties: { newestFirst: binding('{{true}}') } });

    await waitFor(() => expect(titles()).toEqual(['Out for delivery', 'Packed', 'Order placed']));
  });

  test('[ShadTimeline-PROP-005] timePosition top puts the time above the title', async () => {
    render({ properties: { timePosition: binding('top') } });

    await waitFor(() => expect(screen.getByText('11:30').parentElement).toHaveClass('mb-0.5'));
    expect(screen.getByText('11:30').parentElement).not.toHaveTextContent('Packed');
  });

  test('[ShadTimeline-PROP-006] dateFormat formats times that are dates, and leaves other times as written', async () => {
    render({ properties: { dateFormat: binding('DD MMM') } });

    expect(await screen.findByText('04 Mar')).toBeInTheDocument();
    expect(screen.getByText('11:30')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('[ShadTimeline-PROP-007] statuses colour the markers, and statusColors overrides them', async () => {
    render();
    await waitFor(() => expect(items()[0].style.getPropertyValue('--tl-c')).toBe('var(--sc-success)'));
    expect(items()[2].style.getPropertyValue('--tl-c')).toBe('var(--sc-warning)');

    render({ properties: { statusColors: binding("{{{ done: '#e11d48' }}}") } });
    await waitFor(() => expect(items()[0].style.getPropertyValue('--tl-c')).toBe('#e11d48'));
  });

  test('[ShadTimeline-EVT-001] clicking an item fires onItemClicked, and its handler reads lastClickedItem', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onItemClicked', { value: '{{components.timeline1.lastClickedItem.title}}' }));

    await waitFor(() => expect(items()[1]).toHaveClass('cursor-pointer'));
    await act(async () => fireEvent.click(screen.getByText('Packed')));

    await waitFor(() => expect(widget.variables().seen).toBe('Packed'));
    expect(exposed().lastClickedItem).toMatchObject({ title: 'Packed', status: 'active', time: '11:30', index: 1 });
    expect(exposed().lastClickedItem).not.toHaveProperty('key');
  });

  test('[ShadTimeline-EVT-002] a disabled timeline ignores clicks', async () => {
    render({ properties: { disabledState: binding('{{true}}') } });
    widget.setEvents(setVariableOn(ID, 'onItemClicked'));

    await act(async () => fireEvent.click(await screen.findByText('Packed')));

    expect(widget.variables().seen).toBeUndefined();
    expect(exposed().lastClickedItem).toEqual({});
  });

  test('[ShadTimeline-STY-001] marker, line, title, description and time colours reach the timeline as CSS variables', async () => {
    const { container } = render({
      styles: {
        markerColor: binding('#4f46e5'),
        lineColor: binding('#c7d2fe'),
        titleColor: binding('#1e1b4b'),
        descriptionColor: binding('#4338ca'),
        timeColor: binding('#6366f1'),
      },
    });

    await waitFor(() => expect(items()).toHaveLength(3));
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-marker')).toBe('#4f46e5');
    expect(root.style.getPropertyValue('--lk-line')).toBe('#c7d2fe');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#1e1b4b');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#4338ca');
    expect(root.style.getPropertyValue('--lk-time')).toBe('#6366f1');
    expect(screen.getByText('11:30').className).toContain('var(--lk-time');
  });
});
