/**
 * The Stat's change chip in a row of KPIs an agent built (2026-10-21): raw floats ("-9.793980410868281"), an up arrow
 * for every value, chips running past the card's edge, and figures that started lower under a label that wrapped. The
 * chip is now the change in its Change format with an arrow for its sign; it keeps its width beside a label that takes
 * the rest and wraps; and the label always takes two lines' height, so figures in a row start level.
 * Real store, real RenderWidget, real widget. jsdom has no layout: the classes that make it are checked here, and the
 * drawn result in a browser (see the report).
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { screen, waitFor } from '@testing-library/react';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const widget = createWidgetHarness({ componentType: 'ShadStat', handle: 'stat1', id: 'stat1', widgetHeight: 160 });
const render = (properties) => widget.render({ currentMode: 'view', properties });
const chip = () => document.querySelector('.canvas-component [title] svg')?.closest('[title]');
const MINUS = '−';

describe('UI 2.0 Stat change chip', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test.each([
    ['{{-9.793980410868281}}', 'percent', `${MINUS}9.8%`, 'lucide-trending-down'],
    ['{{-3.2440403047431796}}', 'number', `${MINUS}3.2`, 'lucide-trending-down'],
    ['{{266.66666666666663}}', 'currency', '+$266.67', 'lucide-trending-up'],
    ['{{0}}', 'percent', '0.0%', 'lucide-minus'],
  ])('change %s as %s reads %s with its arrow', async (change, changeFormat, text, icon) => {
    // trend 'up' (the default) no longer decides a figure's arrow.
    render({ change: binding(change), changeFormat: binding(changeFormat), trend: binding('up') });
    await waitFor(() => expect(chip()).toHaveTextContent(text));
    expect(chip().querySelector('svg')).toHaveClass(icon);
  });

  test('a figure chip keeps its width; the label takes the rest of the row and wraps', async () => {
    render({ label: binding('Renewals in the next 90 days'), change: binding('{{266.66666666666663}}') });
    await waitFor(() => expect(chip()).not.toBeNull());
    expect(chip()).toHaveClass('tw-shrink-0', 'tw-max-w-full');
    expect(chip().querySelector('span')).toHaveClass('tw-whitespace-nowrap');
    const label = screen.getByText('Renewals in the next 90 days');
    expect(label).toHaveClass('tw-min-w-0', 'tw-flex-1', 'tw-break-words');
    expect(label.parentElement).toBe(chip().parentElement);
  });

  test('the label takes two lines whether it wraps or not, clamped, with the whole label as its tooltip', async () => {
    render({ label: binding('Spend'), change: binding('+2%') });
    const label = await screen.findByText('Spend');
    expect(label).toHaveClass('tw-line-clamp-2', 'tw-min-h-[2lh]');
    expect(label).toHaveAttribute('title', 'Spend');
  });

  test('the positive and negative colours follow the sign; zero stays neutral', async () => {
    const styles = { positiveColor: binding('#16a34a'), negativeColor: binding('#dc2626') };
    widget.render({ currentMode: 'view', properties: { change: binding('{{-4}}') }, styles });
    await waitFor(() => expect(chip()).not.toBeNull());
    expect(chip().getAttribute('style')).toContain('--kb-badge-fg');
    widget.render({ currentMode: 'view', properties: { change: binding('{{0}}') }, styles });
    await waitFor(() => expect(chip()).toHaveTextContent('0'));
    expect(chip().getAttribute('style') ?? '').not.toContain('--kb-badge-fg');
  });
});

describe('UI 2.0 Stat in a short box', () => {
  // The label's two-line reserve pushed the figure past the edge of a short fixed box: a 60px plain Stat showed only
  // the top of "42". The reserve is kept only where the box has room; a short box keeps the label to one line, with a
  // tighter gap and padding (in a browser the figure ends at 58px of 58 at 60px, and inside a 90px card).
  const short = (height) =>
    createWidgetHarness({ componentType: 'ShadStat', handle: 'stat1', id: 'stat1', widgetHeight: height });
  const cases = [
    [60, { card: binding('{{false}}') }, false],
    [90, { card: binding('{{false}}') }, true],
    [90, {}, false],
    [160, {}, true],
  ];
  test.each(cases)('at %ipx (%o) the label reserves two lines: %s', async (height, extra, reserves) => {
    const harness = short(height);
    await harness.setup();
    harness.render({
      currentMode: 'view',
      properties: {
        label: binding('Open tickets'),
        value: binding('{{42}}'),
        dynamicHeight: binding('{{false}}'),
        ...extra,
      },
    });
    const label = await screen.findByText('Open tickets');
    if (reserves) expect(label).toHaveClass('tw-line-clamp-2', 'tw-min-h-[2lh]');
    else expect(label).toHaveClass('tw-line-clamp-1');
    if (!reserves) expect(label).not.toHaveClass('tw-min-h-[2lh]');
    harness.teardown();
  });
});
