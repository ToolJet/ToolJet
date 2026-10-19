/**
 * UI 2.0 Carousel: autoplay stops while the carousel is hidden or keyboard focus is in it, a swipe belongs to the
 * pointer that started it, and the slides are not rebuilt on every render.
 *
 * Release audit (18 Oct), Codex's reviewAutoplayLifecycle, reviewCarouselFocusPause, reviewCarouselPointerOwnership
 * and reviewCollectionModelWork (Carousel case): a hidden Carousel kept advancing and firing onSlideChanged; focus in
 * the carousel did not pause it (WCAG 2.2.2, only hover did); a second finger's pointerdown replaced the swipe's start,
 * so lifting the first finger in place moved a slide; and every render re-normalised the slides.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn, store } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import * as actionsModel from '@/AppBuilder/Widgets/Ui2/_actions/actionsModel';

const ID = 'car1';
const w = createWidgetHarness({
  componentType: 'ShadCarousel',
  id: ID,
  handle: 'carousel1',
  widgetWidth: 480,
  widgetHeight: 240,
});
const expr = (v) => `{{${JSON.stringify(v)}}}`;
const SLIDES = [{ title: 'Alpha' }, { title: 'Beta' }, { title: 'Gamma' }];
const calls = () => w.variables().calls || 0;
const region = () => screen.getByRole('region', { name: 'Carousel' });

const mount = async (extra = {}) => {
  w.render({
    currentMode: 'view',
    properties: {
      slides: binding(expr(SLIDES)),
      interval: binding('{{1000}}'),
      pauseOnHover: binding('{{true}}'),
      ...extra,
    },
  });
  await waitFor(() => expect(w.exposed().currentIndex).toBe(0));
  w.setEvents(countInvocationsOn(ID, 'onSlideChanged'));
};

describe('autoplay', () => {
  beforeEach(async () => {
    await w.setup();
    jest.useFakeTimers();
  });
  afterEach(() => {
    w.teardown();
    jest.useRealTimers();
  });
  const tick = (ms = 1000) => act(async () => jest.advanceTimersByTime(ms));

  test.each([
    ['loading', 'setLoading', true, false],
    ['hidden', 'setVisibility', false, true],
  ])('%s pauses autoplay, which resumes once after', async (_label, action, off, on) => {
    await mount({ autoplay: binding('{{true}}') });
    await tick();
    expect(calls()).toBe(1);
    await w.act(action, off);
    await tick(60000);
    expect(calls()).toBe(1);
    await w.act(action, on);
    await tick();
    expect(calls()).toBe(2);
  });

  test.each(['focus on the region', 'focus on the next button', 'the pointer over it', 'nothing'])(
    'autoplay with %s',
    async (mode) => {
      await mount({ autoplay: binding('{{true}}') });
      await tick();
      expect(w.exposed().currentIndex).toBe(1);
      if (mode === 'focus on the region') act(() => region().focus());
      if (mode === 'focus on the next button') act(() => screen.getByRole('button', { name: 'Next slide' }).focus());
      if (mode === 'the pointer over it') fireEvent.mouseEnter(region());
      await tick();
      const paused = mode !== 'nothing';
      expect({ index: w.exposed().currentIndex, calls: calls() }).toEqual(
        paused ? { index: 1, calls: 1 } : { index: 2, calls: 2 }
      );
    }
  );

  test('focus a click brings does not stop autoplay; a key pressed then does', async () => {
    await mount({ autoplay: binding('{{true}}'), pauseOnHover: binding('{{false}}') });
    const next = screen.getByRole('button', { name: 'Next slide' });
    fireEvent.pointerDown(next, { pointerId: 1, isPrimary: true });
    act(() => next.focus());
    fireEvent.pointerUp(next, { pointerId: 1, isPrimary: true });
    await tick();
    expect(calls()).toBe(1);
    fireEvent.keyDown(next, { key: 'Shift' });
    await tick(5000);
    expect(calls()).toBe(1);
  });

  test('autoplay resumes once focus leaves the carousel', async () => {
    await mount({ autoplay: binding('{{true}}') });
    const next = screen.getByRole('button', { name: 'Next slide' });
    act(() => next.focus());
    await tick(5000);
    expect(calls()).toBe(0);
    act(() => next.blur());
    await tick();
    expect(calls()).toBe(1);
  });
});

describe('swipes', () => {
  beforeEach(() => w.setup());
  afterEach(w.teardown);

  test.each(['matching', 'second pointer', 'short swipe'])('a swipe with %s', async (mode) => {
    await mount({ autoplay: binding('{{false}}') });
    fireEvent.pointerDown(region(), { pointerId: 1, clientX: 100, pointerType: 'touch', isPrimary: true });
    // A second finger lands far to the left; lifting the first in place is no swipe.
    if (mode === 'second pointer') {
      fireEvent.pointerDown(region(), { pointerId: 2, clientX: 0, pointerType: 'touch', isPrimary: false });
    }
    const upAt = { matching: 0, 'second pointer': 100, 'short swipe': 80 }[mode];
    fireEvent.pointerUp(region(), { pointerId: 1, clientX: upAt, pointerType: 'touch', isPrimary: true });
    const moved = mode === 'matching';
    expect({ index: w.exposed().currentIndex, events: calls() }).toEqual({
      index: moved ? 1 : 0,
      events: moved ? 1 : 0,
    });
  });
});

describe('slide normalisation', () => {
  let spy;
  beforeEach(async () => {
    await w.setup();
    spy = jest.spyOn(actionsModel, 'carouselSlides');
    await mount({ autoplay: binding('{{false}}'), loop: binding('{{false}}') });
    expect(spy).toHaveBeenCalled();
    spy.mockClear();
  });
  afterEach(() => {
    spy.mockRestore();
    w.teardown();
  });

  test('unrelated variable updates and disabled-state changes do not rebuild the slides', async () => {
    for (let i = 0; i < 10; i++) await act(async () => store().setVariable('unrelated', i));
    for (let i = 0; i < 4; i++) await w.act('setDisable', i % 2 === 0);
    expect(spy).not.toHaveBeenCalled();
  });

  test('new slides are normalised and shown', async () => {
    w.setComponentProperty(ID, 'slides', expr([{ title: 'Fresh' }, ...SLIDES]), 'properties');
    await waitFor(() => expect(document.body.textContent).toContain('Fresh'));
    expect(spy).toHaveBeenCalled();
  });
});
