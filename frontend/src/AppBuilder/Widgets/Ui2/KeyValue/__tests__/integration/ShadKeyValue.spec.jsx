/**
 * UI 2.0 Key value: a list of labelled, typed values (text, number, currency, date, badge, link, boolean).
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Key value itself does. Titles carry [ShadKeyValue-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'kv1';
const DATA =
  "{{[{ label: 'Customer', value: 'Ada Lovelace' }, { label: 'Email', value: 'ada@example.com', type: 'link' }, { label: 'Status', value: 'Active', type: 'badge' }, { label: 'Amount', value: 1250, type: 'currency' }, { label: 'Renews', value: '2026-11-14', type: 'date' }, { label: 'Notes', value: '' }, { label: 'Autopay', value: true, type: 'boolean' }]}}";
const widget = createWidgetHarness({
  componentType: 'ShadKeyValue',
  handle: 'keyValue1',
  id: ID,
  widgetHeight: 320,
  widgetWidth: 400,
  defaultProperties: { data: binding(DATA), badgeColors: binding('{{{}}}') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const rows = (container) => [...container.querySelectorAll('dl > div')];
const valueOf = (label) => screen.getByText(label, { selector: 'dt' }).nextSibling;
const grid = (container) => container.querySelector('dl').style.gridTemplateColumns;
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Key value', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadKeyValue-DEF-001] formats each value by its type, inline beside its label, and exposes data', async () => {
    const { container } = render();

    await waitFor(() => expect(rows(container)).toHaveLength(7));
    expect(valueOf('Customer')).toHaveTextContent('Ada Lovelace');
    expect(valueOf('Email').querySelector('a')).toHaveAttribute('href', 'mailto:ada@example.com');
    expect(valueOf('Status')).toHaveTextContent('Active');
    expect(valueOf('Amount')).toHaveTextContent('$1,250.00');
    expect(valueOf('Renews')).toHaveTextContent('14 Nov 2026');
    expect(valueOf('Notes')).toHaveTextContent('—');
    expect(valueOf('Autopay')).toHaveTextContent('Yes');
    expect(rows(container)[0]).toHaveClass('tw-flex-row');
    expect(exposed().data[0]).toEqual({ label: 'Customer', value: 'Ada Lovelace' });
    expect(exposed().data).toHaveLength(7);
    expect(exposed().lastClickedField).toEqual({});
  });

  test('[ShadKeyValue-PROP-001] data also reads a plain object or [label, value] pairs; none shows No details', async () => {
    render({ properties: { data: binding("{{{ Status: 'Active', Plan: 'Pro' }}}") } });
    await waitFor(() => expect(valueOf('Plan')).toHaveTextContent('Pro'));

    render({ properties: { data: binding("{{[['Region', 'EU']]}}") } });
    await waitFor(() => expect(valueOf('Region')).toHaveTextContent('EU'));

    render({ properties: { data: binding('{{[]}}') } });
    expect(await screen.findByText('No details')).toBeInTheDocument();
  });

  // Two inline columns in a 400px card cut a claim's values to "PO 88" and "$8," (2026-10-14): columns that do not fit
  // the width fold into fewer (an inline pair needs about 300px, a stacked one 160px).
  test('[ShadKeyValue-PROP-002] columns lays the rows out side by side, folding into what the width fits', async () => {
    const { container } = render({ properties: { columns: binding('2') } });
    await waitFor(() => expect(grid(container)).toBe('repeat(1, minmax(0, 1fr))'));

    render({ properties: { columns: binding('2'), layout: binding('stacked') } });
    await waitFor(() => expect(grid(container)).toBe('repeat(2, minmax(0, 1fr))'));
  });

  test('[ShadKeyValue-PROP-003] layout stacked puts each label above its value; labelWidth sizes inline labels', async () => {
    const { container } = render({ properties: { labelWidth: binding('120px') } });
    await waitFor(() => expect(screen.getByText('Customer', { selector: 'dt' }).style.width).toBe('120px'));

    render({ properties: { layout: binding('stacked'), labelWidth: binding('120px') } });
    await waitFor(() => expect(rows(container)[0]).toHaveClass('tw-flex-col'));
    expect(screen.getByText('Customer', { selector: 'dt' }).style.width).toBe('');
  });

  test('[ShadKeyValue-PROP-004] dividers rule off every row but the last, and can be turned off', async () => {
    const { container } = render();
    await waitFor(() => expect(rows(container)[0]).toHaveClass('tw-border-b'));
    expect(rows(container)[6]).not.toHaveClass('tw-border-b');

    render({ properties: { dividers: binding('{{false}}') } });
    await waitFor(() => expect(rows(container)[0]).not.toHaveClass('tw-border-b'));
  });

  test('[ShadKeyValue-PROP-005] emptyText replaces the dash shown for an empty value', async () => {
    render({ properties: { emptyText: binding('n/a') } });

    await waitFor(() => expect(valueOf('Notes')).toHaveTextContent('n/a'));
  });

  test('[ShadKeyValue-PROP-006] currency, locale and dateFormat set how money and dates read', async () => {
    render({
      properties: { currency: binding('EUR'), locale: binding('de-DE'), dateFormat: binding('YYYY/MM/DD') },
    });

    await waitFor(() => expect(valueOf('Amount').textContent).toMatch(/1\.250,00\s€/));
    expect(valueOf('Renews')).toHaveTextContent('2026/11/14');
  });

  test('[ShadKeyValue-PROP-007] badgeColors colours the badge values it names', async () => {
    render({ properties: { badgeColors: binding("{{{ Active: '#16a34a' }}}") } });

    await waitFor(() => expect(screen.getByText('Active').style.getPropertyValue('--tg')).toBe('#16a34a'));
  });

  test('[ShadKeyValue-PROP-008] allowCopy adds a copy button that puts the shown value on the clipboard', async () => {
    const writeText = jest.fn();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render({ properties: { allowCopy: binding('{{true}}') } });

    const buttons = await screen.findAllByRole('button', { name: 'Copy value' });
    // Not for the empty Notes row.
    expect(buttons).toHaveLength(6);
    await act(async () => fireEvent.click(valueOf('Amount').querySelector('button')));
    expect(writeText).toHaveBeenCalledWith('$1,250.00');
    delete navigator.clipboard;
  });

  test('[ShadKeyValue-EVT-001] clicking a row fires onFieldClick, and its handler reads lastClickedField', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onFieldClick', { value: '{{components.keyValue1.lastClickedField.label}}' }));

    const rowButtons = await screen.findAllByRole('button');
    expect(rowButtons).toHaveLength(7);
    await act(async () => fireEvent.click(rowButtons[3]));

    await waitFor(() => expect(widget.variables().seen).toBe('Amount'));
    expect(exposed().lastClickedField).toEqual({ label: 'Amount', value: 1250 });
  });

  test('[ShadKeyValue-KBD-001] with onFieldClick wired, Enter on a focused row fires it', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onFieldClick', { value: '{{components.keyValue1.lastClickedField.value}}' }));

    const row = (await screen.findAllByRole('button'))[0];
    expect(row).toHaveAttribute('tabindex', '0');
    await act(async () => fireEvent.keyDown(row, { key: 'Enter' }));

    await waitFor(() => expect(widget.variables().seen).toBe('Ada Lovelace'));
  });

  test('[ShadKeyValue-STY-001] label, value, divider and link colours reach the list as CSS variables it reads', async () => {
    const { container } = render({
      styles: {
        labelColor: binding('#64748b'),
        valueColor: binding('#0f172a'),
        dividerColor: binding('#e2e8f0'),
        linkColor: binding('#2563eb'),
      },
    });

    await waitFor(() => expect(rows(container)).toHaveLength(7));
    const root = container.querySelector('.tj-shadcn');
    expect(root.style.getPropertyValue('--lk-label')).toBe('#64748b');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#0f172a');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#e2e8f0');
    expect(root.style.getPropertyValue('--lk-link')).toBe('#2563eb');
    expect(valueOf('Email').querySelector('a').className).toContain('var(--lk-link');
  });
});
