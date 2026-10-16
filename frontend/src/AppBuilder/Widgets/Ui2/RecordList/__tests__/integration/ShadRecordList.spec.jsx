/**
 * UI 2.0 Record list: rows with an avatar, a title, a meta line, a status chip and a trailing value.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Record list itself does. Titles carry [ShadRecordList-<AREA>-<NNN>] scenario ids.
 */
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { createWidgetHarness, binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'list1';
const widget = createWidgetHarness({
  componentType: 'ShadRecordList',
  handle: 'list1',
  id: ID,
  widgetHeight: 400,
  widgetWidth: 520,
});

const PEOPLE =
  "{{[{ ref: 'A-1', name: 'Union Square Hotel', owner: 'Maya Chen', photo: 'https://example.com/maya.png', city: 'Oslo', done: 40, amount: 1250.5, state: 'Paid' }, { ref: 'A-2', name: 'Oakland Ice Rink', owner: 'Owen Hart', photo: '', city: 'Bergen', done: '75%', amount: 980, state: 'Overdue' }]}}";
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const rows = () => [...document.querySelectorAll('li[role=button]')];
const row = (title) => screen.getByText(title).closest('li');
const exposed = () => widget.exposed() ?? {};
const people = (extra = {}) => ({
  data: binding(PEOPLE),
  titleField: binding('name'),
  metaFields: binding('city'),
  statusField: binding('state'),
  valueField: binding('amount'),
  idField: binding('ref'),
  ...extra,
});

describe('UI 2.0 Record list', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadRecordList-DEF-001] lists the sample invoices with initials, a meta line, a status chip and the total in USD', async () => {
    render();

    await waitFor(() => expect(rows()).toHaveLength(4));
    const first = row('Harbor Bistro');
    expect(first.querySelector('[data-fallback="initials"]')).toHaveTextContent('HB');
    expect(first).toHaveTextContent('Maya Chen');
    expect(first).toHaveTextContent(/Due Oct 14/);
    expect(first.querySelector('[data-tone]')).toHaveTextContent('Paid');
    expect(first).toHaveTextContent('$1,240');
    expect(exposed().selectedItem).toEqual({});
    expect(exposed().selectedItemId).toBeNull();
  });

  test('[ShadRecordList-PROP-001] titleField, metaFields, statusField and valueField pick what each row shows', async () => {
    render({ properties: people({ metaFields: binding('owner, city:In {}'), valueFormat: binding('number') }) });

    await waitFor(() => expect(rows()).toHaveLength(2));
    const first = row('Union Square Hotel');
    expect(first).toHaveTextContent('Maya Chen · In Oslo');
    expect(first.querySelector('[data-tone]')).toHaveAttribute('data-tone', 'success');
    expect(row('Oakland Ice Rink').querySelector('[data-tone]')).toHaveAttribute('data-tone', 'danger');
    expect(first).toHaveTextContent('1,250.5');
  });

  test('[ShadRecordList-PROP-002] valueFormat currency uses the currency code', async () => {
    render({ properties: people({ valueFormat: binding('currency'), currency: binding('EUR') }) });

    await waitFor(() => expect(row('Union Square Hotel')).toHaveTextContent('€1,250.50'));
  });

  test('[ShadRecordList-PROP-003] avatarField shows a photo for a URL, initials otherwise; avatarShape and showAvatar', async () => {
    render({ properties: people({ avatarField: binding('photo'), avatarShape: binding('rounded') }) });

    await waitFor(() => expect(row('Union Square Hotel').querySelector('img')).toBeTruthy());
    expect(row('Union Square Hotel').querySelector('img')).toHaveAttribute('src', 'https://example.com/maya.png');
    expect(row('Union Square Hotel').querySelector('img')).toHaveClass('tw-rounded-ui2-lg');
    // An empty avatar value falls back to the title's initials.
    expect(row('Oakland Ice Rink').querySelector('[data-fallback="initials"]')).toHaveTextContent('OR');

    render({ properties: people({ avatarField: binding('owner') }) });
    await waitFor(() => expect(row('Union Square Hotel').querySelector('[data-fallback]')).toHaveTextContent('MC'));
    expect(row('Union Square Hotel').querySelector('[data-fallback]')).toHaveClass('tw-rounded-full');

    render({ properties: people({ showAvatar: binding('{{false}}') }) });
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(document.querySelector('[data-fallback="initials"]')).toBeNull();
  });

  test('[ShadRecordList-PROP-004] progressField draws a bar under the title', async () => {
    render({ properties: people({ progressField: binding('done') }) });

    await waitFor(() => expect(screen.getAllByRole('progressbar')).toHaveLength(2));
    expect(screen.getAllByRole('progressbar').map((b) => b.getAttribute('aria-valuenow'))).toEqual(['40', '75']);
  });

  test('[ShadRecordList-PROP-005] density sets the row padding and avatar size; showDividers draws lines between rows', async () => {
    render({ properties: people({ density: binding('compact') }) });
    await waitFor(() => expect(rows()[0]).toHaveClass('tw-py-2'));
    expect(rows()[0].querySelector('[data-fallback]').style.width).toBe('28px');

    render({ properties: people({ density: binding('comfortable') }) });
    await waitFor(() => expect(rows()[0]).toHaveClass('tw-py-4'));
    expect(rows()[1]).toHaveClass('tw-border-t');

    render({ properties: people({ showDividers: binding('{{false}}') }) });
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()[1]).not.toHaveClass('tw-border-t');
  });

  // The pack's preflight sets every border width to 0 with !important: an inline border drew nothing in a browser.
  test('[ShadRecordList-PROP-006] listStyle card draws a framed list with border classes; plain drops the frame', async () => {
    render({ properties: people() });
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()[0].className).not.toMatch(/border-t/);
    expect(rows()[1]).toHaveClass('tw-border-t');
    expect(rows()[1].closest('ul').parentElement).toHaveClass('tw-border');
    expect(document.querySelector('[style*="border-top"]')).toBeNull();

    render({ properties: people({ listStyle: binding('plain') }) });
    await waitFor(() => expect(rows()[1].closest('ul').parentElement).not.toHaveClass('tw-border'));
  });

  // A plain list's selected row drew its 3px accent bar against the title: rows had 4px of side padding (2026-10-13).
  test('[ShadRecordList-PROP-007] a selectable plain list pads rows 12px for the selection bar; highlightSelected off 4px', async () => {
    render({ properties: people({ listStyle: binding('plain') }) });
    await waitFor(() => expect(rows()[0]).toHaveClass('tw-px-3'));

    render({ properties: people({ listStyle: binding('plain'), highlightSelected: binding('{{false}}') }) });
    await waitFor(() => expect(rows()[0]).toHaveClass('tw-px-1'));
    fireEvent.click(rows()[0]);
    await waitFor(() => expect(exposed().selectedItemId).toBe('A-1'));
    expect(rows()[0]).not.toHaveAttribute('data-selected');
  });

  test('[ShadRecordList-EVT-001] clicking a row fires onItemClicked with selectedItem and selectedItemId already set', async () => {
    render({ properties: people() });
    widget.setEvents(setVariableOn(ID, 'onItemClicked', { value: '{{components.list1.selectedItem.owner}}' }));

    await waitFor(() => expect(rows()).toHaveLength(2));
    fireEvent.click(row('Oakland Ice Rink'));

    await waitFor(() => expect(widget.variables().seen).toBe('Owen Hart'));
    expect(exposed().selectedItemId).toBe('A-2');
    expect(row('Oakland Ice Rink')).toHaveAttribute('data-selected', 'true');
  });

  test('[ShadRecordList-KBD-001] Enter or Space on a focused row selects it', async () => {
    render({ properties: people() });

    await waitFor(() => expect(rows()).toHaveLength(2));
    fireEvent.keyDown(row('Union Square Hotel'), { key: ' ' });
    await waitFor(() => expect(exposed().selectedItemId).toBe('A-1'));
    fireEvent.keyDown(row('Oakland Ice Rink'), { key: 'Enter' });
    await waitFor(() => expect(exposed().selectedItemId).toBe('A-2'));
  });

  test('[ShadRecordList-PROP-008] emptyText shows when there are no rows', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('No invoices this week') } });

    expect(await screen.findByText('No invoices this week')).toBeInTheDocument();
  });

  test('[ShadRecordList-DEF-002] draws 100 rows of a big binding, then 100 more per press', async () => {
    render({
      properties: {
        data: binding("{{Array.from({ length: 250 }, (_, i) => ({ id: i, name: 'Row ' + i }))}}"),
        titleField: binding('name'),
      },
    });

    await waitFor(() => expect(rows()).toHaveLength(100));
    fireEvent.click(screen.getByRole('button', { name: 'Show 100 more of 150' }));
    await waitFor(() => expect(rows()).toHaveLength(200));
  });

  test('[ShadRecordList-STY-001] colours, accent, radius and title typeface reach the list as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#f8fafc'),
        borderColor: binding('#cbd5e1'),
        titleColor: binding('#0f172a'),
        textColor: binding('#64748b'),
        accentColor: binding('#7c3aed'),
        borderRadius: binding('{{10}}'),
        titleFontFamily: binding('display'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(root.style.getPropertyValue('--lk-accent')).toBe('#7c3aed'));
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#f8fafc');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#cbd5e1');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#0f172a');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#64748b');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('10px');
    expect(root.style.getPropertyValue('--lk-title-font')).toMatch(/^Didot/);
  });
});
