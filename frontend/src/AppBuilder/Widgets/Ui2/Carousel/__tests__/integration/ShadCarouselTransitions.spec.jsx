/**
 * UI 2.0 Carousel across changes after the user has acted: disabled or loading mid-use, new slides or a new layout
 * after a slide was picked, and new image data after an image failed (release audit 26, 46 and the position reset
 * that extends 64). Titles carry [ShadCarousel-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { binding, countInvocationsOn, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'car1';
const widget = createWidgetHarness({
  componentType: 'ShadCarousel',
  handle: 'carousel1',
  id: ID,
  widgetWidth: 700,
  widgetHeight: 300,
});
const ROWS = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon'].map((title) => ({ title, description: `${title} detail` }));
const expr = (v) => `{{${JSON.stringify(v)}}}`;
const exposed = () => widget.exposed() ?? {};
const setProperty = (key, value) => widget.setComponentProperty(ID, key, expr(value), 'properties');
const shown = () =>
  [...document.querySelectorAll('[aria-roledescription="slide"]')].filter(
    (n) => n.getAttribute('aria-hidden') !== 'true'
  );

const mount = (slides = ROWS, extra = {}) => {
  const view = widget.render({
    currentMode: 'view',
    properties: {
      slides: binding(expr(slides)),
      defaultIndex: binding('{{0}}'),
      autoplay: binding('{{false}}'),
      loop: binding('{{false}}'),
      slidesPerView: binding('{{1}}'),
      ...extra,
    },
  });
  widget.setEvents(
    [
      ...countInvocationsOn(ID, 'onSlideChanged', { key: 'changes' }),
      ...setVariableOn(ID, 'onSlideChanged', {
        key: 'snapshot',
        value: '{{({ index: components.carousel1.currentIndex, title: components.carousel1.currentSlide.title })}}',
      }),
    ].map((e, i) => ({ ...e, id: `carousel-${i}` }))
  );
  return view;
};
const pickGamma = async () => {
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' })));
  expect(exposed().currentIndex).toBe(2);
};

describe('UI 2.0 Carousel transitions', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test.each(['setDisable', 'setLoading'])(
    '[ShadCarousel-BUSY-001] after %s, the arrow keys move no slide and fire nothing',
    async (action) => {
      mount(ROWS.slice(0, 2));
      fireEvent.keyDown(screen.getByRole('region', { name: 'Carousel' }), { key: 'ArrowRight' });
      await waitFor(() => expect(exposed().currentIndex).toBe(1));
      await widget.act('goTo', 0);
      await widget.act(action, true);
      widget.setEvents(countInvocationsOn(ID, 'onSlideChanged'));
      const region = screen.queryByRole('region', { name: 'Carousel' });
      if (region) fireEvent.keyDown(region, { key: 'ArrowRight' });
      expect({ index: exposed().currentIndex, calls: widget.variables().calls || 0 }).toEqual({ index: 0, calls: 0 });
    }
  );

  test('[ShadCarousel-POS-001] slides added after the picked one keep the picked slide, with no event', async () => {
    mount();
    await pickGamma();
    setProperty('slides', [...ROWS, { title: 'Zeta' }]);
    expect(exposed()).toMatchObject({ currentIndex: 2, currentSlide: { title: 'Gamma' } });
    expect(shown()[0]).toHaveTextContent('Gamma');
    expect(widget.variables().changes).toBe(1);
  });

  test('[ShadCarousel-POS-002] a later slide removed keeps the picked slide', async () => {
    mount();
    await pickGamma();
    setProperty('slides', ROWS.slice(0, 4));
    expect(exposed()).toMatchObject({ currentIndex: 2, currentSlide: { title: 'Gamma' } });
  });

  test('[ShadCarousel-POS-003] more or fewer slides per view keep the picked slide in view', async () => {
    mount();
    await pickGamma();
    setProperty('slidesPerView', 2);
    expect(exposed()).toMatchObject({ currentIndex: 2, currentSlide: { title: 'Gamma' } });
    expect(shown().map((n) => n.textContent)).toEqual([
      expect.stringContaining('Gamma'),
      expect.stringContaining('Delta'),
    ]);
    setProperty('slidesPerView', 1);
    expect(exposed()).toMatchObject({ currentIndex: 2, currentSlide: { title: 'Gamma' } });
  });

  test('[ShadCarousel-POS-004] fewer slides than the picked position move to the last slide still there', async () => {
    mount();
    await pickGamma();
    setProperty('slides', ROWS.slice(0, 2));
    expect(exposed()).toMatchObject({ currentIndex: 1, currentSlide: { title: 'Beta' } });
  });

  test('[ShadCarousel-POS-005] a new defaultIndex still moves to it, and new titles reach the picked slide', async () => {
    mount();
    await pickGamma();
    setProperty(
      'slides',
      ROWS.map((r, i) => (i === 2 ? { ...r, title: 'Gamma updated' } : r))
    );
    expect(exposed()).toMatchObject({ currentIndex: 2, currentSlide: { title: 'Gamma updated' } });
    setProperty('defaultIndex', 1);
    expect(exposed()).toMatchObject({ currentIndex: 1, currentSlide: { title: 'Beta' } });
    expect(widget.variables().changes).toBe(1);
  });

  describe('a slide image that failed', () => {
    const bad = 'https://example.invalid/old.png';
    const good = 'https://example.invalid/new.png';
    const imageSlides = (url, title = 'Product Alpha') => [{ title, image: url }];
    const img = (url) => document.querySelector(`img[src="${url}"]`);

    test('[ShadCarousel-IMG-001] is tried again when new data brings another URL, for the same or another slide', async () => {
      mount(imageSlides(bad));
      await waitFor(() => expect(img(bad)).not.toBeNull());
      fireEvent.error(img(bad));
      expect(img(bad)).toBeNull();
      setProperty('slides', imageSlides(good));
      await waitFor(() => expect(img(good)).not.toBeNull());
      fireEvent.error(img(good));
      setProperty('slides', imageSlides(bad, 'Product Beta'));
      await waitFor(() => expect(img(bad)).not.toBeNull());
    });
  });
});
