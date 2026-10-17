/**
 * UI 2.0 Stat: a KPI card with a label, a figure, a change chip, and optional icon, footnote, trend line and progress.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Stat itself does. Titles carry [ShadStat-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { FONT_STACKS } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';

const widget = createWidgetHarness({
  componentType: 'ShadStat',
  handle: 'stat1',
  id: 'stat1',
  widgetHeight: 160,
  widgetWidth: 300,
  defaultProperties: { label: binding('Revenue'), value: binding('$12,400') },
});

const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const root = (container) => container.querySelector('.tj-shadcn');
const figure = () => screen.getByText('Revenue').parentElement.nextSibling.firstChild;
/** The change chip: it carries the whole change as its title. */
const chip = (change) => screen.getByTitle(change);
const exposed = () => widget.exposed() ?? {};

describe('UI 2.0 Stat', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadStat-DEF-001] is a card with the label and the figure, and exposes them as the primary pair', async () => {
    const { container } = render();

    expect(await screen.findByText('$12,400')).toBeInTheDocument();
    expect(figure()).toHaveClass('tw-text-2xl');
    expect(root(container).firstChild).toHaveClass('tw-px-6', 'tw-py-5');
    // A plain figure: no chip, trend line or progress bar.
    expect(container.querySelector('svg')).toBeNull();
    expect(exposed()).toMatchObject({
      primaryLabel: 'Revenue',
      primaryValue: '$12,400',
      secondaryLabel: '',
      secondaryValue: '',
    });
  });

  // A Stat without a value (data still loading, an empty binding) drew its label and nothing under it, an empty-looking
  // card; it shows a dash, as the Summary strip does.
  test('[ShadStat-PROP-001] value shows as written, and an empty or non-finite value shows a dash', async () => {
    for (const value of ['', '{{1/0}}']) {
      const { container } = render({ properties: { value: binding(value) } });
      await waitFor(() => expect(figure()).toHaveTextContent('–'));
      expect(container.textContent).not.toMatch(/Infinity|NaN/);
    }
  });

  test('[ShadStat-PROP-002] valueFormat and currency format a numeric value', async () => {
    render({ properties: { value: binding('{{947.37}}') } });
    await waitFor(() => expect(figure()).toHaveTextContent('947.37'));
    expect(figure()).not.toHaveTextContent('$');
    expect(exposed().primaryValue).toBe(947.37);

    render({ properties: { value: binding('{{947.37}}'), valueFormat: binding('currency') } });
    await waitFor(() => expect(figure()).toHaveTextContent('$947.37'));

    render({
      properties: { value: binding('{{947.37}}'), valueFormat: binding('currency'), currency: binding('EUR') },
    });
    await waitFor(() => expect(figure()).toHaveTextContent('€947.37'));

    render({ properties: { value: binding('{{1250000}}'), valueFormat: binding('compact') } });
    await waitFor(() => expect(figure()).toHaveTextContent('1.3M'));
  });

  test('[ShadStat-PROP-003] change shows a chip with the trend arrow; trend down and neutral change the arrow', async () => {
    render({ properties: { change: binding('+12%') } });
    await waitFor(() => expect(chip('+12%').querySelector('svg')).toHaveClass('lucide-trending-up'));
    expect(exposed().secondaryValue).toBe('+12%');

    render({ properties: { change: binding('-3%'), trend: binding('down') } });
    await waitFor(() => expect(chip('-3%').querySelector('svg')).toHaveClass('lucide-trending-down'));

    render({ properties: { change: binding('0%'), trend: binding('neutral') } });
    await waitFor(() => expect(chip('0%').querySelector('svg')).toBeNull());
  });

  // "+8 vs semana passada" in the chip, capped at 60% of the row, read "+8 vs semana pa..." (a clinic app, 2026-10-13).
  test('[ShadStat-PROP-004] changeLabel is a context line beside the chip, and a change with words splits into it', async () => {
    render({ properties: { change: binding('+8 vs last week'), changeLabel: binding('all clinics') } });

    expect(await screen.findByText('vs last week · all clinics')).toBeInTheDocument();
    expect(chip('+8 vs last week')).toHaveTextContent('+8');
    expect(exposed().secondaryLabel).toBe('all clinics');
  });

  test('[ShadStat-PROP-005] footnote shows under the figure in full while the card grows with its content', async () => {
    render({ properties: { footnote: binding('Includes refunds issued this month') } });

    const note = await screen.findByText('Includes refunds issued this month');
    expect(note).not.toHaveClass('tw-line-clamp-2');
  });

  // A footnote that wrapped past a fixed box cut the card's bottom edge off: with dynamic height off the card fills the
  // box, the footnote keeps two lines (the rest in its title) and the change context one.
  test('[ShadStat-PROP-012] in a fixed box the card fills it and clamps the footnote and the context line', async () => {
    const { container } = render({
      properties: {
        dynamicHeight: binding('{{false}}'),
        footnote: binding('Includes refunds issued this month'),
        change: binding('+8 vs last week'),
      },
    });

    const note = await screen.findByText('Includes refunds issued this month');
    expect(note).toHaveClass('tw-line-clamp-2');
    expect(note).toHaveAttribute('title', 'Includes refunds issued this month');
    expect(screen.getByText('vs last week')).toHaveClass('tw-line-clamp-1');
    // The height RenderWidget gives it: the widget's 160px less the wrapper's 2px padding on each side.
    expect(root(container).firstChild.style.height).toBe('156px');
  });

  test('[ShadStat-PROP-006] icon draws the named icon in a square tile at the right of the label', async () => {
    const { container } = render({ properties: { icon: binding('wallet') } });

    await waitFor(() => expect(container.querySelector('.lucide-wallet')).toBeInTheDocument());
    const tile = container.querySelector('.lucide-wallet').parentElement;
    expect(tile.parentElement).toBe(screen.getByText('Revenue').parentElement);
    expect(tile.className).toContain('tw-rounded-[calc(var(--sc-radius)-2px)]');
  });

  test('[ShadStat-PROP-007] with the icon at the right the change chip moves beside the figure', async () => {
    render({ properties: { value: binding('42'), change: binding('+3'), icon: binding('users') } });

    await waitFor(() => expect(chip('+3').parentElement).toHaveTextContent('42'));
    expect(chip('+3').parentElement).not.toHaveTextContent('Revenue');
  });

  test('[ShadStat-PROP-008] iconPosition top and left move the tile; iconStyle circle and none reshape it', async () => {
    const { container } = render({
      properties: { icon: binding('wallet'), iconPosition: binding('top'), iconStyle: binding('circle') },
    });
    await waitFor(() => expect(container.querySelector('.lucide-wallet')).toBeInTheDocument());
    const tile = () => container.querySelector('.lucide-wallet').parentElement;
    expect(tile()).toHaveClass('tw-rounded-full');
    expect(tile().parentElement).toHaveClass('tw-mb-1');

    render({ properties: { icon: binding('wallet'), iconPosition: binding('left'), iconStyle: binding('none') } });
    await waitFor(() => expect(tile().parentElement).toHaveClass('tw-items-start', 'tw-gap-3'));
    expect(tile().className).not.toContain('var(--lk-chip');
  });

  test('[ShadStat-PROP-009] trendData draws a filled trend line, and sparklineType line drops the fill', async () => {
    const { container } = render({ properties: { trendData: binding('{{[3, 5, 4, 8, 9]}}') } });
    await waitFor(() => expect(container.querySelectorAll('svg path')).toHaveLength(2));

    render({ properties: { trendData: binding('{{[3, 5, 4, 8, 9]}}'), sparklineType: binding('line') } });
    await waitFor(() => expect(container.querySelectorAll('svg path')).toHaveLength(1));

    render({ properties: { trendData: binding('a,b') } });
    await waitFor(() => expect(container.querySelector('svg')).toBeNull());
  });

  test('[ShadStat-PROP-010] progress draws a bar to that percentage with progressLabel under it', async () => {
    const { container } = render({
      properties: { progress: binding('{{64}}'), progressLabel: binding('64% of target') },
    });

    expect(await screen.findByText('64% of target')).toBeInTheDocument();
    expect(container.querySelector('[style*="width: 64%"]')).toBeInTheDocument();

    render({ properties: { progress: binding('lots'), progressLabel: binding('64% of target') } });
    await waitFor(() => expect(screen.queryByText('64% of target')).toBeNull());
  });

  test('[ShadStat-PROP-011] size sm and lg shrink and grow the figure; card off drops the card', async () => {
    const { container } = render({ properties: { size: binding('lg') } });
    await waitFor(() => expect(figure()).toHaveClass('tw-text-4xl'));

    render({ properties: { size: binding('sm'), card: binding('{{false}}') } });
    await waitFor(() => expect(figure()).toHaveClass('tw-text-ui2-xl'));
    expect(root(container).querySelector('.tw-px-6')).toBeNull();
  });

  test('[ShadStat-ACT-001] setPrimaryValue and setSecondaryValue change the figure and the chip until those properties change', async () => {
    render({ properties: { change: binding('+1%') } });

    await widget.act('setPrimaryValue', '$9,999.00');
    await widget.act('setSecondaryValue', '+3.2%');
    await waitFor(() => expect(figure()).toHaveTextContent('$9,999.00'));
    expect(chip('+3.2%')).toBeInTheDocument();
    expect(exposed()).toMatchObject({ primaryValue: '$9,999.00', secondaryValue: '+3.2%' });

    render({ properties: { value: binding('$1'), change: binding('+2%') } });
    await waitFor(() => expect(exposed().primaryValue).toBe('$1'));
    expect(exposed().secondaryValue).toBe('+2%');
  });

  test('[ShadStat-STY-001] card, text, chip, trend and progress colours reach the card as CSS variables', async () => {
    const { container } = render({
      properties: { icon: binding('wallet'), trendData: binding('{{[1, 2]}}'), progress: binding('{{50}}') },
      styles: {
        backgroundColor: binding('#fafaf9'),
        borderColor: binding('#e7e5e4'),
        borderRadius: binding('{{20}}'),
        labelColor: binding('#78716c'),
        valueColor: binding('#1c1917'),
        footnoteColor: binding('#a8a29e'),
        iconColor: binding('#b45309'),
        chipColor: binding('#fef3c7'),
        sparklineColor: binding('#0d9488'),
        progressColor: binding('#2563eb'),
      },
    });

    await screen.findByText('$12,400');
    const vars = root(container).style;
    expect(vars.getPropertyValue('--lk-bg')).toBe('#fafaf9');
    expect(vars.getPropertyValue('--lk-border')).toBe('#e7e5e4');
    expect(vars.getPropertyValue('--lk-radius')).toBe('20px');
    expect(vars.getPropertyValue('--lk-label')).toBe('#78716c');
    expect(vars.getPropertyValue('--lk-value')).toBe('#1c1917');
    expect(vars.getPropertyValue('--lk-help')).toBe('#a8a29e');
    expect(vars.getPropertyValue('--lk-icon')).toBe('#b45309');
    expect(vars.getPropertyValue('--lk-chip')).toBe('#fef3c7');
    expect(vars.getPropertyValue('--lk-spark')).toBe('#0d9488');
    expect(vars.getPropertyValue('--lk-progress')).toBe('#2563eb');
  });

  test('[ShadStat-STY-002] positiveColor and negativeColor tint the change chip by its trend', async () => {
    render({
      properties: { change: binding('+12%'), trend: binding('up') },
      styles: { positiveColor: binding('#16a34a'), negativeColor: binding('#dc2626') },
    });
    await waitFor(() => expect(chip('+12%').style.getPropertyValue('--kb-badge-fg')).toBe('#16a34a'));

    render({
      properties: { change: binding('-3%'), trend: binding('down') },
      styles: { positiveColor: binding('#16a34a'), negativeColor: binding('#dc2626') },
    });
    await waitFor(() => expect(chip('-3%').style.getPropertyValue('--kb-badge-fg')).toBe('#dc2626'));
  });

  test('[ShadStat-STY-003] valueFontFamily, labelTextTransform and labelLetterSpacing style the figure and label apart', async () => {
    const { container } = render({
      properties: { value: binding('€5,904,000') },
      styles: {
        valueFontFamily: binding('display'),
        labelTextTransform: binding('uppercase'),
        labelLetterSpacing: binding('0.1em'),
      },
    });

    expect(await screen.findByText('€5,904,000')).toHaveClass('lk-value-font');
    expect(screen.getByText('Revenue')).toHaveClass('lk-label-case', 'lk-label-tracking');
    expect(root(container).style.getPropertyValue('--lk-value-font')).toBe(FONT_STACKS.display);
    expect(root(container).style.getPropertyValue('--lk-label-case')).toBe('uppercase');
    expect(root(container).style.getPropertyValue('--lk-label-tracking')).toBe('0.1em');
    expect(container.innerHTML).not.toMatch(/undefined/);
  });
});
