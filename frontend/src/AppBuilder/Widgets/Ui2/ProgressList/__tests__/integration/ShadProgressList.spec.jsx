/**
 * UI 2.0 Progress list: labelled bars toward a target (budgets, goals, quotas), with figures, captions and statuses.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Progress list itself does. Titles carry [ShadProgressList-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'pl1';
const widget = createWidgetHarness({
  componentType: 'ShadProgressList',
  handle: 'progress1',
  id: ID,
  widgetHeight: 400,
  widgetWidth: 520,
});

const GOALS =
  "{{[{ key: 'g1', name: 'Onboarding', done: 9, goal: 10, pct: 30, why: 'Two weeks left', state: '' }, { key: 'g2', name: 'Support', done: 12, goal: 10, pct: 120, why: '', state: 'Ahead' }]}}";
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const items = () => [...document.querySelectorAll('li')];
const item = (label) => screen.getByText(label).closest('li');
const bar = (label) => screen.getByRole('progressbar', { name: label });
const exposed = () => widget.exposed() ?? {};
const goals = (extra = {}) => ({
  data: binding(GOALS),
  labelField: binding('name'),
  valueField: binding('done'),
  targetField: binding('goal'),
  captionField: binding('why'),
  statusField: binding('state'),
  idField: binding('key'),
  valueFormat: binding('number'),
  ...extra,
});

describe('UI 2.0 Progress list', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadProgressList-DEF-001] shows the sample budgets: spent of budget in USD, a bar, the note and status', async () => {
    render();

    await waitFor(() => expect(items()).toHaveLength(4));
    const marketing = item('Marketing');
    expect(marketing).toHaveTextContent('$18,400 of $25,000');
    expect(marketing).toHaveTextContent('12 days left in the quarter');
    expect(marketing).toHaveTextContent('73.6%');
    expect(bar('Marketing')).toHaveAttribute('aria-valuenow', '74');
    // Over budget reads as danger, its bar full.
    expect(item('Travel')).toHaveAttribute('data-tone', 'danger');
    expect(bar('Travel')).toHaveAttribute('aria-valuenow', '100');
    expect(exposed().selectedItem).toEqual({});
    expect(exposed().selectedItemId).toBeNull();
  });

  test('[ShadProgressList-PROP-001] labelField, valueField, targetField, captionField and statusField fill each row', async () => {
    render({ properties: goals() });

    await waitFor(() => expect(items()).toHaveLength(2));
    expect(item('Onboarding')).toHaveTextContent('9 of 10');
    expect(item('Onboarding')).toHaveTextContent('Two weeks left');
    expect(bar('Onboarding')).toHaveAttribute('aria-valuenow', '90');
    // A status the list knows tones the row and shows as a chip.
    expect(item('Support')).toHaveAttribute('data-tone', 'success');
    expect(item('Support').querySelector('[data-tone]')).toHaveTextContent('Ahead');
  });

  test('[ShadProgressList-PROP-002] percentField sets the bar instead of value over target', async () => {
    render({ properties: goals({ percentField: binding('pct') }) });

    await waitFor(() => expect(bar('Onboarding')).toHaveAttribute('aria-valuenow', '30'));
    expect(item('Onboarding')).toHaveTextContent('30%');
  });

  test('[ShadProgressList-PROP-003] valueFormat and currency format the figures', async () => {
    render({ properties: goals({ valueFormat: binding('currency'), currency: binding('GBP') }) });

    await waitFor(() => expect(item('Onboarding')).toHaveTextContent('£9 of £10'));
  });

  test('[ShadProgressList-PROP-004] autoTone limit turns a row amber from 80% and red over 100%; goal green at 100%', async () => {
    render({ properties: goals({ statusField: binding(''), autoTone: binding('limit') }) });
    await waitFor(() => expect(item('Onboarding')).toHaveAttribute('data-tone', 'warning'));
    expect(item('Support')).toHaveAttribute('data-tone', 'danger');

    render({ properties: goals({ statusField: binding(''), autoTone: binding('goal') }) });
    await waitFor(() => expect(item('Support')).toHaveAttribute('data-tone', 'success'));
    expect(item('Onboarding')).not.toHaveAttribute('data-tone');
  });

  test('[ShadProgressList-PROP-005] showValues and showPercent hide the figure and the percentage', async () => {
    render({ properties: goals({ showValues: binding('{{false}}') }) });
    await waitFor(() => expect(items()).toHaveLength(2));
    expect(item('Onboarding')).not.toHaveTextContent('9 of 10');
    expect(item('Onboarding')).toHaveTextContent('90%');

    render({ properties: goals({ showPercent: binding('{{false}}') }) });
    await waitFor(() => expect(item('Onboarding')).toHaveTextContent('9 of 10'));
    expect(item('Onboarding')).not.toHaveTextContent('90%');
  });

  test('[ShadProgressList-PROP-006] barSize sets the bar height; listStyle plain drops the frame', async () => {
    render({ properties: goals({ barSize: binding('thick') }) });
    await waitFor(() => expect(bar('Onboarding').style.height).toBe('12px'));
    expect(items()[0].closest('ul').parentElement).toHaveClass('tw-border');

    render({ properties: goals({ barSize: binding('thin'), listStyle: binding('plain') }) });
    await waitFor(() => expect(bar('Onboarding').style.height).toBe('4px'));
    expect(items()[0].closest('ul').parentElement).not.toHaveClass('tw-border');
    expect(items()[0]).toHaveClass('tw-px-0');
  });

  test('[ShadProgressList-EVT-001] with onItemClicked wired, rows are buttons and a click exposes the row first', async () => {
    widget.setEvents(setVariableOn(ID, 'onItemClicked', { value: '{{components.progress1.selectedItem.name}}' }));
    render({ properties: goals() });

    await waitFor(() => expect(item('Support')).toHaveAttribute('role', 'button'));
    fireEvent.click(item('Support'));

    await waitFor(() => expect(widget.variables().seen).toBe('Support'));
    expect(exposed().selectedItemId).toBe('g2');
    fireEvent.keyDown(item('Onboarding'), { key: 'Enter' });
    await waitFor(() => expect(exposed().selectedItemId).toBe('g1'));
  });

  test('[ShadProgressList-PROP-007] without onItemClicked the rows are not buttons, though a click still selects', async () => {
    render({ properties: goals() });

    await waitFor(() => expect(items()).toHaveLength(2));
    expect(item('Support')).not.toHaveAttribute('role');
    fireEvent.click(item('Support'));
    await waitFor(() => expect(exposed().selectedItem).toMatchObject({ name: 'Support' }));
  });

  test('[ShadProgressList-PROP-008] emptyText shows when there is nothing to track', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('No budgets set') } });

    expect(await screen.findByText('No budgets set')).toBeInTheDocument();
  });

  test('[ShadProgressList-STY-001] colours, track, accent, radius and title typeface reach the list as CSS variables', async () => {
    const { container } = render({
      styles: {
        backgroundColor: binding('#ffffff'),
        borderColor: binding('#e5e7eb'),
        titleColor: binding('#111827'),
        textColor: binding('#6b7280'),
        accentColor: binding('#0d9488'),
        trackColor: binding('#ccfbf1'),
        borderRadius: binding('{{6}}'),
        titleFontFamily: binding('serif'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(root.style.getPropertyValue('--lk-track')).toBe('#ccfbf1'));
    expect(root.style.getPropertyValue('--lk-bg')).toBe('#ffffff');
    expect(root.style.getPropertyValue('--lk-border')).toBe('#e5e7eb');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#111827');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#6b7280');
    expect(root.style.getPropertyValue('--lk-accent')).toBe('#0d9488');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('6px');
    expect(root.style.getPropertyValue('--lk-title-font')).toMatch(/serif$/);
  });
});
