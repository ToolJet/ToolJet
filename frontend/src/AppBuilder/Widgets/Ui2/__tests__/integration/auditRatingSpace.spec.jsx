// Release audit round 3 (Codex fixture reviewRatingSpace, kept close to as written): Space on a focused star did
// nothing, though arrows and clicks rated. A star is a radio, and Space checks the focused radio.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const w = createWidgetHarness({
  componentType: 'ShadRating',
  id: 'rating1',
  handle: 'rating1',
  widgetWidth: 400,
  widgetHeight: 100,
});
beforeEach(() => w.setup());
afterEach(() => w.teardown());

const mount = (value) => {
  w.render({ currentMode: 'view', properties: { defaultValue: binding(`{{${value}}}`), max: binding('{{5}}') } });
  w.setEvents(countInvocationsOn('rating1', 'onChange'));
};

test.each([
  ['Space', ' '],
  ['ArrowRight', '{ArrowRight}'],
])('%s on the first star of an empty rating rates it 1', async (_, keys) => {
  mount(0);
  const first = screen.getAllByRole('radio')[0];
  act(() => first.focus());
  await userEvent.setup({ delay: null }).keyboard(keys);
  expect(w.exposed().value).toBe(1);
  expect(first).toHaveAttribute('aria-checked', 'true');
  expect(w.variables().calls).toBe(1);
});

test('Space on the checked star keeps the rating', async () => {
  mount(3);
  const third = screen.getAllByRole('radio')[2];
  act(() => third.focus());
  await userEvent.setup({ delay: null }).keyboard(' ');
  expect(w.exposed().value).toBe(3);
  expect(w.variables().calls || 0).toBe(0);
});
