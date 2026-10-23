/**
 * UI 2.0 Card grid: rows drawn as cards (picture, eyebrow, title, badges, description, progress and a meta line).
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Card grid itself does. Titles carry [ShadCardGrid-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { binding, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'grid1';
const widget = createWidgetHarness({
  componentType: 'ShadCardGrid',
  handle: 'grid1',
  id: ID,
  widgetHeight: 600,
  widgetWidth: 900,
});

const ROOMS =
  "{{[{ id: 1, code: 'R-1', name: 'Harbour suite', kind: 'Suite', floor: 'Floor 3', host: 'Maya Chen', photo: 'https://example.com/a.jpg', done: 45, tags: 'Sea view', seats: 4 }, { id: 2, code: 'R-2', name: 'Garden room', kind: 'Double', floor: 'Floor 1', host: 'https://example.com/owen.png', photo: '', done: '80%', tags: 'Quiet', seats: 2 }]}}";
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const cards = () => [...document.querySelectorAll('[role=button][tabindex="0"]')];
const card = (title) => screen.getByText(title).closest('[role=button]');
const exposed = () => widget.exposed() ?? {};
const rows = (n) => `{{Array.from({ length: ${n} }, (_, i) => ({ id: i + 1, name: 'Customer ' + (i + 1) }))}}`;

describe('UI 2.0 Card grid', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadCardGrid-DEF-001] draws the sample recipes as cards with a badge, a note and a meta line, nothing selected', async () => {
    render();

    await waitFor(() => expect(cards()).toHaveLength(3));
    const first = card('Lemon herb roast chicken');
    expect(first).toHaveTextContent('Dinner');
    expect(first).toHaveTextContent('Crisp skin, bright pan sauce');
    expect(first).toHaveTextContent('20 min · Serves 4');
    // No image field mapped: no picture area and no initials panel.
    expect(document.querySelector('[data-fallback="initials"]')).toBeNull();
    expect(exposed().selectedItem).toEqual({});
    expect(exposed().selectedItemId).toBeNull();
  });

  test('[ShadCardGrid-PROP-001] data with titleField, subtitleField, eyebrowField and descriptionField fills each card', async () => {
    render({
      properties: {
        data: binding(ROOMS),
        titleField: binding('name'),
        subtitleField: binding('floor'),
        eyebrowField: binding('code'),
        descriptionField: binding('tags'),
        badgeField: binding(''),
        metaFields: binding(''),
      },
    });

    await waitFor(() => expect(cards()).toHaveLength(2));
    const first = card('Harbour suite');
    expect(first.querySelector('[data-part="eyebrow"]')).toHaveTextContent('R-1');
    expect(first).toHaveTextContent('Floor 3');
    expect(first.querySelector('p')).toHaveTextContent('Sea view');
  });

  test('[ShadCardGrid-PROP-002] badgeField and badgeFields add chips toned by their words, in a row when there are several', async () => {
    render({
      properties: {
        data: binding("{{[{ id: 1, name: 'Order 7', state: 'Paid', due: 'Overdue' }]}}"),
        titleField: binding('name'),
        badgeField: binding('state'),
        badgeFields: binding('due'),
      },
    });

    await waitFor(() => expect(cards()).toHaveLength(1));
    const chips = [...document.querySelectorAll('[data-tone]')];
    expect(chips.map((c) => [c.textContent, c.getAttribute('data-tone')])).toEqual([
      ['Paid', 'success'],
      ['Overdue', 'danger'],
    ]);
  });

  test('[ShadCardGrid-PROP-003] imageField draws the picture at imageAspect, initials for a missing one; showImage off hides it', async () => {
    render({
      properties: {
        data: binding(ROOMS),
        titleField: binding('name'),
        imageField: binding('photo'),
        badgeField: binding('kind'),
      },
    });

    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(card('Harbour suite').querySelector('img')).toHaveAttribute('src', 'https://example.com/a.jpg');
    expect(card('Garden room').querySelector('[data-fallback="initials"]')).toHaveTextContent('GR');
    // The badge sits over the picture.
    expect(card('Harbour suite').querySelector('[data-image-layout="top"] [data-tone]')).toHaveTextContent('Suite');

    render({
      properties: {
        data: binding(ROOMS),
        titleField: binding('name'),
        imageField: binding('photo'),
        imageAspect: binding('1/1'),
      },
    });
    await waitFor(() => expect(document.querySelector('[data-image-layout="top"]').style.aspectRatio).toBe('1 / 1'));

    render({
      properties: {
        data: binding(ROOMS),
        titleField: binding('name'),
        imageField: binding('photo'),
        showImage: binding('{{false}}'),
      },
    });
    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(document.querySelector('[data-image-layout]')).toBeNull();
  });

  test('[ShadCardGrid-PROP-004] layout row puts the picture beside the text', async () => {
    render({
      properties: {
        data: binding(ROOMS),
        titleField: binding('name'),
        imageField: binding('photo'),
        layout: binding('row'),
      },
    });

    await waitFor(() => expect(cards()[0]).toHaveAttribute('data-layout', 'row'));
    expect(cards()[0]).toHaveClass('tw-flex-row');
    expect(cards()[0].querySelector('[data-image-layout="side"]')).toBeTruthy();
  });

  test('[ShadCardGrid-PROP-005] avatarField shows a photo for a URL and initials for a name', async () => {
    render({ properties: { data: binding(ROOMS), titleField: binding('name'), avatarField: binding('host') } });

    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(card('Harbour suite')).toHaveTextContent('MC');
    expect(card('Garden room').querySelector('img')).toHaveAttribute('src', 'https://example.com/owen.png');
  });

  test('[ShadCardGrid-PROP-006] progressField draws a bar with its percentage, from a number or text', async () => {
    render({ properties: { data: binding(ROOMS), titleField: binding('name'), progressField: binding('done') } });

    await waitFor(() => expect(screen.getAllByRole('progressbar')).toHaveLength(2));
    expect(screen.getAllByRole('progressbar').map((bar) => bar.getAttribute('aria-valuenow'))).toEqual(['45', '80']);
    expect(card('Harbour suite')).toHaveTextContent('45%');
  });

  test('[ShadCardGrid-PROP-007] metaFields takes a list, labels with {} placeholders, and skips empty values', async () => {
    render({
      properties: {
        data: binding(ROOMS),
        titleField: binding('name'),
        metaFields: binding("{{['seats:{} seats', 'kind:Type', 'missing']}}"),
      },
    });

    await waitFor(() => expect(card('Harbour suite')).toHaveTextContent('4 seats · Type Suite'));
  });

  test('[ShadCardGrid-PROP-008] columns caps the grid; minCardWidth narrows it to what fits', async () => {
    const template = () => document.querySelector('.tw-grid').style.gridTemplateColumns;
    render();
    await waitFor(() => expect(template()).toBe('repeat(3, minmax(0, 1fr))'));

    render({ properties: { columns: binding('{{1}}') } });
    await waitFor(() => expect(template()).toBe('repeat(1, minmax(0, 1fr))'));

    // 900px at 400px a card fits two, whatever columns asks for.
    render({ properties: { columns: binding('{{4}}'), minCardWidth: binding('{{400}}') } });
    await waitFor(() => expect(template()).toBe('repeat(2, minmax(0, 1fr))'));
  });

  test('[ShadCardGrid-PROP-009] cardStyle draws elevated, outlined or flat cards', async () => {
    render();
    await waitFor(() => expect(cards()[0]).toHaveClass('tw-shadow-sm', 'tw-border'));

    render({ properties: { cardStyle: binding('outline') } });
    await waitFor(() => expect(cards()[0]).not.toHaveClass('tw-shadow-sm'));
    expect(cards()[0]).toHaveClass('tw-border');

    render({ properties: { cardStyle: binding('flat') } });
    await waitFor(() => expect(cards()[0]).toHaveClass('tw-border-0'));
  });

  test('[ShadCardGrid-EVT-001] clicking a card fires onCardClicked with selectedItem and selectedItemId already set', async () => {
    render({ properties: { data: binding(ROOMS), titleField: binding('name'), idField: binding('code') } });
    widget.setEvents(setVariableOn(ID, 'onCardClicked', { value: '{{components.grid1.selectedItem.name}}' }));

    await waitFor(() => expect(cards()).toHaveLength(2));
    fireEvent.click(card('Garden room'));

    await waitFor(() => expect(widget.variables().seen).toBe('Garden room'));
    expect(exposed().selectedItemId).toBe('R-2');
    // selectedItemIndex: its position in the data (two cards may share an id; integration/duplicateItemIds.spec.jsx).
    expect(exposed().selectedItemIndex).toBe(1);
    expect(card('Garden room')).toHaveAttribute('data-selected', 'true');
  });

  test('[ShadCardGrid-KBD-001] Enter on a focused card selects it like a click', async () => {
    render();
    widget.setEvents(setVariableOn(ID, 'onCardClicked', { value: '{{components.grid1.selectedItemId}}' }));

    await waitFor(() => expect(cards()).toHaveLength(3));
    fireEvent.keyDown(card('Blueberry oat pancakes'), { key: 'Enter' });
    await waitFor(() => expect(widget.variables().seen).toBe(3));
  });

  test('[ShadCardGrid-PROP-010] highlightSelected off selects without marking the card', async () => {
    render({ properties: { highlightSelected: binding('{{false}}') } });

    await waitFor(() => expect(cards()).toHaveLength(3));
    fireEvent.click(card('Miso glazed salmon'));
    await waitFor(() => expect(exposed().selectedItemId).toBe(2));
    expect(card('Miso glazed salmon')).not.toHaveAttribute('data-selected');
  });

  test('[ShadCardGrid-PROP-011] emptyText shows when there are no rows', async () => {
    render({ properties: { data: binding('{{[]}}'), emptyText: binding('No recipes yet') } });

    expect(await screen.findByText('No recipes yet')).toBeInTheDocument();
    expect(cards()).toHaveLength(0);
  });

  // A Card grid bound to 10,000 rows drew every card (over 100,000 elements) and froze the page.
  test('[ShadCardGrid-DEF-002] draws the first 48 cards of a big binding, and 48 more per press', async () => {
    render({ properties: { data: binding(rows(10000)), titleField: binding('name'), badgeField: binding('') } });

    await waitFor(() => expect(cards()).toHaveLength(48));
    fireEvent.click(screen.getByRole('button', { name: 'Show 48 more of 9952' }));
    await waitFor(() => expect(cards()).toHaveLength(96));
  });

  test('[ShadCardGrid-DEF-003] a small binding has no Show more, and new data starts over at 48', async () => {
    render({ properties: { data: binding(rows(20)), titleField: binding('name') } });
    await waitFor(() => expect(cards()).toHaveLength(20));
    expect(screen.queryByText(/more of/)).toBeNull();

    widget.setComponentProperty(ID, 'data', rows(100), 'properties');
    fireEvent.click(await screen.findByText('Show 48 more of 52'));
    await waitFor(() => expect(cards()).toHaveLength(96));
    widget.setComponentProperty(ID, 'data', rows(200), 'properties');
    await waitFor(() => expect(cards()).toHaveLength(48));
  });

  // A long badge beside the title ("-$19,305.50 vs last week" on a 185px card) was cut off hard: the chip was a flex
  // box, which clips its text but never draws an ellipsis. jsdom has no layout, so this pins the structure.
  test('[ShadCardGrid-DEF-004] a long badge wraps under the title and ends in an ellipsis with its text as a tooltip', async () => {
    const badge = '-$19,305.50 vs last week';
    render({
      properties: {
        data: binding(`{{[{ id: 1, label: 'Revenue', comparison: '${badge}' }]}}`),
        titleField: binding('label'),
        badgeField: binding('comparison'),
      },
    });

    const chip = await screen.findByText(badge);
    expect(chip).toHaveAttribute('title', badge);
    expect(chip).toHaveClass('tw-truncate');
    expect(chip).not.toHaveClass('tw-inline-flex');
    expect(chip.closest('.tw-flex-wrap')).toHaveTextContent('Revenue');
  });

  test('[ShadCardGrid-STY-001] card colours, accent, radius and title typeface reach the grid as CSS variables', async () => {
    const { container } = render({
      styles: {
        cardBackground: binding('#fffbeb'),
        borderColor: binding('#d6d3d1'),
        titleColor: binding('#1c1917'),
        textColor: binding('#57534e'),
        accentColor: binding('#b45309'),
        borderRadius: binding('{{14}}'),
        titleFontFamily: binding('mono'),
      },
    });

    const root = container.querySelector('.tj-shadcn');
    await waitFor(() => expect(root.style.getPropertyValue('--lk-bg')).toBe('#fffbeb'));
    expect(root.style.getPropertyValue('--lk-border')).toBe('#d6d3d1');
    expect(root.style.getPropertyValue('--lk-title')).toBe('#1c1917');
    expect(root.style.getPropertyValue('--lk-fg')).toBe('#57534e');
    expect(root.style.getPropertyValue('--lk-accent')).toBe('#b45309');
    expect(root.style.getPropertyValue('--lk-radius')).toBe('14px');
    expect(root.style.getPropertyValue('--lk-title-font')).toMatch(/monospace$/);
  });
});
