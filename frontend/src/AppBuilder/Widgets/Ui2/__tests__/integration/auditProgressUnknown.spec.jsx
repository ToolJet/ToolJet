// Release audit round 3 (Codex fixture reviewProgressNumericBoundaries, trimmed): a Progress list row whose progress
// is unknown (no value, or a target of 0 or less) told assistive tech it was at 0% (aria-valuenow="0"), though it shows
// no percentage. Its bar now leaves aria-valuenow out (indeterminate); known values are the controls.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { screen } from '@testing-library/react';

const w = createWidgetHarness({
  componentType: 'ShadProgressList',
  id: 'progress1',
  handle: 'progress1',
  widgetWidth: 600,
  widgetHeight: 500,
});
beforeEach(() => w.setup());
afterEach(w.teardown);

const mount = (row) => {
  w.render({
    currentMode: 'view',
    properties: {
      data: binding(`{{${JSON.stringify([{ id: 'a', name: 'Goal', ...row }])}}}`),
      labelField: binding('name'),
      valueField: binding('value'),
      targetField: binding('target'),
      percentField: binding('pct'),
      statusField: binding(''),
      captionField: binding(''),
      valueFormat: binding('number'),
    },
  });
  return screen.findByRole('progressbar', { name: 'Goal' });
};

test.each([
  ['no value', {}],
  ['a zero target', { value: 5, target: 0 }],
  ['a negative target', { value: 5, target: -1 }],
])('a row with %s has no current value', async (_, row) => {
  const bar = await mount(row);
  expect(bar).not.toHaveAttribute('aria-valuenow');
  expect(bar.firstChild.style.width).toBe('0%');
  expect(screen.queryByText('0%')).not.toBeInTheDocument();
});

test.each([
  ['zero', { value: 0, target: 100 }, '0'],
  ['over the target', { value: 150, target: 100 }, '100'],
  ['negative', { value: -10, target: 100 }, '0'],
  ['an explicit percentage', { value: 50, target: 100, pct: 25 }, '25'],
])('a known value (%s) is announced, bounded to the bar', async (_, row, now) => {
  const bar = await mount(row);
  expect(bar).toHaveAttribute('aria-valuenow', now);
});
