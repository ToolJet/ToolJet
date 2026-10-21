/**
 * A UI 2.0 widget loading with the Skeleton look kept shrinking: the Summary strip drew 4 short skeleton cells (48px)
 * in place of its 70px figure rows, the Card grid one row of cards, the Record list 4 rows whatever its data, and the
 * box followed the skeleton down and back up when the data came. The strip's skeleton now has its figures' cell count
 * and line heights; the lists and grid keep their item count; and with dynamic height on, the box keeps its last fitted
 * height while a skeleton shows (packHooks useAutoHeight; covered in _shared/__tests__/autoHeightSkeleton.spec.jsx).
 * Real store, real RenderWidget, real widgets.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const SKELETON = { loadingState: binding('{{true}}'), loadingIndicator: binding('skeleton') };
const harness = (componentType, height) =>
  createWidgetHarness({ componentType, handle: 'w1', id: 'w1', widgetHeight: height, widgetWidth: 900 });
const strip = harness('ShadSummaryStrip', 200);
const grid = harness('ShadCardGrid', 300);
const records = harness('ShadRecordList', 340);
const SIX = binding(
  "{{Array.from({ length: 6 }, (_, i) => ({ label: 'Metric ' + i, value: i * 100, delta: 5, caption: 'vs last week' }))}}"
);

describe('A skeleton keeps the loaded height', () => {
  beforeEach(() => Promise.all([strip, grid, records].map((w) => w.setup())));
  afterEach(() => [strip, grid, records].forEach((w) => w.teardown()));

  test('[Skeleton-001] the Summary strip draws a skeleton cell per figure, from the loaded cell line boxes', () => {
    strip.render({ currentMode: 'view', properties: { items: SIX, size: binding('lg') } });
    const loaded = [...document.querySelectorAll('dl > div')];
    expect(loaded).toHaveLength(6);
    strip.render({ currentMode: 'view', properties: { items: SIX, size: binding('lg'), ...SKELETON } });
    const cells = [...document.querySelectorAll('dl > div')];
    expect(cells).toHaveLength(6);
    cells.forEach((cell, i) => {
      expect(cell.className).toBe(loaded[i].className);
      const lines = [...cell.children];
      // The label line, the figure line at the strip's figure size, and the caption line.
      expect(lines).toHaveLength(3);
      expect(lines[0]).toHaveClass('tw-text-xs', 'tw-flex-1');
      expect(lines[1]).toHaveClass('tw-text-3xl');
      expect(lines[2]).toHaveClass('tw-text-xs');
      lines.forEach((line) => expect(line.querySelector('.tw-absolute')).not.toBeNull());
    });
  });

  test('[Skeleton-002] before the first data the strip draws four cells, without a caption line', () => {
    strip.render({ currentMode: 'view', properties: { items: binding('{{[]}}'), ...SKELETON } });
    const cells = [...document.querySelectorAll('dl > div')];
    expect(cells).toHaveLength(4);
    cells.forEach((cell) => expect(cell.children).toHaveLength(2));
  });

  test('[Skeleton-003] the Card grid draws a skeleton card per card it shows', () => {
    const cards = binding("{{Array.from({ length: 5 }, (_, i) => ({ id: i, title: 'Card ' + i }))}}");
    grid.render({ currentMode: 'view', properties: { data: cards, titleField: binding('title'), ...SKELETON } });
    expect(document.querySelectorAll('.tj-shadcn .tw-grid > div')).toHaveLength(5);
  });

  test('[Skeleton-004] the Record list draws a skeleton row per record', () => {
    const rows = binding("{{Array.from({ length: 7 }, (_, i) => ({ id: i, customer: 'C' + i }))}}");
    records.render({ currentMode: 'view', properties: { data: rows, ...SKELETON } });
    expect(document.querySelectorAll('.tj-shadcn .tw-overflow-hidden > div')).toHaveLength(7);
  });
});
