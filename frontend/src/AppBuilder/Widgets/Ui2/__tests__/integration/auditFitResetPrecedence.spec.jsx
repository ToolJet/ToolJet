// Release audit round 3 (Codex fixtures reviewRatingResetPrecedence, reviewSplitBoundsDefaultRefresh,
// reviewSplitQuantizationRefresh, reviewSliderSequences and reviewSplitRelatedModeTransitions, trimmed). A new default
// that arrived with new bounds or precision lost to the fit of the old value (Rating: setValue 4.5, then default 1 and
// maximum 3 together ended at 3), and a Slider whose default changed between one value and a range never reset. The
// widgets' fit effects ran in the same commit as the value hook's reset, with the value from before it.
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { binding } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { act, screen, waitFor } from '@testing-library/react';

const expression = (value) => '{{' + JSON.stringify(value) + '}}';
const harness = (componentType) =>
  createWidgetHarness({ componentType, id: 'field1', handle: 'field1', widgetHeight: 100, widgetWidth: 400 });
const rating = harness('ShadRating');
const slider = harness('ShadSlider');
const shown = () => screen.getAllByRole('slider').map((t) => Number(t.getAttribute('aria-valuenow')));

const refresh = (w, changes) =>
  act(() => {
    Object.entries(changes).forEach(([key, value]) =>
      w.setComponentProperty('field1', key, expression(value), 'properties')
    );
  });

describe('Rating', () => {
  beforeEach(() => rating.setup());
  afterEach(() => rating.teardown());
  const mount = () =>
    rating.render({
      currentMode: 'view',
      properties: { defaultValue: binding('{{2}}'), max: binding('{{5}}'), allowHalf: binding('{{true}}') },
    });

  test.each([
    ['a smaller maximum', { max: 3 }],
    ['whole stars only', { allowHalf: false }],
  ])('a new default with %s wins over fitting the old value', async (_, change) => {
    mount();
    await rating.act('setValue', 4.5);
    refresh(rating, { defaultValue: 1, ...change });
    await waitFor(() => expect(rating.exposed().value).toBe(1));
  });

  test('new bounds alone still fit the value set', async () => {
    mount();
    await rating.act('setValue', 4.5);
    refresh(rating, { max: 3 });
    expect(rating.exposed().value).toBe(3);
    refresh(rating, { max: 5 });
    expect(rating.exposed().value).toBe(3);
  });
});

describe('Slider', () => {
  beforeEach(() => slider.setup());
  afterEach(() => slider.teardown());
  const mount = (value, extra = {}) =>
    slider.render({
      currentMode: 'view',
      properties: { defaultValue: binding(expression(value)), ...extra },
    });

  test.each([
    ['a smaller maximum', 90, { defaultValue: 20, max: 50 }, 20],
    ['a smaller maximum, as a range', [70, 90], { defaultValue: [20, 40], max: 50 }, [20, 40]],
    ['a larger minimum', 10, { defaultValue: 60, min: 50 }, 60],
  ])('a new default with %s wins over fitting the old value', async (_, from, change, expected) => {
    mount(from, { max: binding('{{100}}'), min: binding('{{0}}') });
    await waitFor(() => expect(slider.exposed().value).toEqual(from));
    refresh(slider, change);
    await waitFor(() => expect(slider.exposed().value).toEqual(expected));
  });

  test.each([
    [20, [30, 80]],
    [[20, 70], 30],
  ])('a default changing from %j to %j resets the value and the thumbs', async (from, to) => {
    mount(from);
    await slider.act('setValue', 60);
    refresh(slider, { defaultValue: to });
    await waitFor(() => expect(slider.exposed().value).toEqual(to));
    expect(shown()).toEqual(Array.isArray(to) ? to : [to]);
  });
});
