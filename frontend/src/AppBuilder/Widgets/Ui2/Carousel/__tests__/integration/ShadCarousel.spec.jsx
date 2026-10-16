/**
 * UI 2.0 Carousel: slides of images with captions, moved by arrows, dots, keys, swipes or a timer.
 *
 * Real store, real RenderWidget, real widget; nothing about the widget is mocked. Standard control behaviour
 * (visibility, disabled, loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx;
 * this file covers what the Carousel itself does. Titles carry [ShadCarousel-<AREA>-<NNN>] scenario ids.
 */
import { act, screen, waitFor, fireEvent, within } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  countInvocationsOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'car1';
const SLIDES =
  "{{[{ image: 'https://example.com/coast.png', title: 'Coastal routes', description: 'Along the shore' }, { image: 'https://example.com/city.png', title: 'City hubs', link: 'https://example.com/hubs' }, { title: 'Mountain passes', description: 'Seasonal schedules' }]}}";
const widget = createWidgetHarness({
  componentType: 'ShadCarousel',
  handle: 'carousel1',
  id: ID,
  widgetHeight: 300,
  widgetWidth: 480,
  defaultProperties: { slides: binding(SLIDES) },
});

// Interactions are tested as an app user meets them: in view mode, where the editor's canvas does not take presses.
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const exposed = () => widget.exposed() ?? {};
const handle = (events) => act(async () => widget.setEvents(events));
const region = () => screen.getByRole('region', { name: 'Carousel' });
const slides = () => screen.getAllByRole('group', { hidden: true });
const shown = () =>
  slides()
    .filter((s) => !s.getAttribute('aria-hidden'))
    .map((s) => s.getAttribute('aria-label'));
const press = async (name) => {
  await act(async () => fireEvent.click(screen.getByRole('button', { name })));
};
const wait = (ms) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));

describe('UI 2.0 Carousel', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadCarousel-DEF-001] shows the first slide with its caption, arrows and a dot per slide', async () => {
    render();

    await waitFor(() => expect(shown()).toEqual(['1 of 3']));
    expect(within(slides()[0]).getByRole('img', { name: 'Coastal routes' })).toBeInTheDocument();
    expect(within(slides()[0]).getByText('Along the shore')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Go to slide/ })).toHaveLength(3);
    expect(exposed().currentIndex).toBe(0);
    expect(exposed().currentSlide).toMatchObject({ title: 'Coastal routes' });
    expect(exposed().clickedSlide).toEqual({});
  });

  test('[ShadCarousel-DEF-002] a slide without an image shows its title and description as text', async () => {
    render({ properties: { defaultIndex: binding('{{2}}') } });

    await waitFor(() => expect(shown()).toEqual(['3 of 3']));
    expect(within(slides()[2]).queryByRole('img')).not.toBeInTheDocument();
    expect(within(slides()[2]).getByText('Seasonal schedules')).toBeInTheDocument();
  });

  test('[ShadCarousel-PROP-001] defaultIndex starts on that slide', async () => {
    render({ properties: { defaultIndex: binding('{{1}}') } });

    await waitFor(() => expect(shown()).toEqual(['2 of 3']));
    expect(screen.getByRole('button', { name: 'Go to slide 2' })).toHaveAttribute('aria-current', 'true');
    expect(exposed()).toMatchObject({ currentIndex: 1, currentSlide: { title: 'City hubs' } });
  });

  test('[ShadCarousel-PROP-002] aspectRatio sets the slide shape (fill: the widget height); imageFit contain fits whole images', async () => {
    render({ properties: { aspectRatio: binding('fill'), imageFit: binding('contain') } });

    // (The widget's height less the box's padding.)
    await waitFor(() => expect(region().style.height).toBe('296px'));
    expect(within(slides()[0]).getByRole('img')).toHaveClass('object-contain');

    await act(async () => render({ properties: { aspectRatio: binding('1/1') } }));
    expect(region().style.height).toBe('');
    expect(slides()[0].querySelector('.cursor-pointer').style.aspectRatio).toBe('1');
    expect(within(slides()[0]).getByRole('img')).toHaveClass('object-cover');
  });

  test('[ShadCarousel-PROP-003] captionPosition below puts the caption under the image, none leaves it out', async () => {
    render({ properties: { captionPosition: binding('below') } });
    const caption = await within(slides()[0]).findByText('Along the shore');
    expect(caption.closest('.cursor-pointer')).toBeNull();

    await act(async () => render({ properties: { captionPosition: binding('none') } }));
    expect(within(slides()[0]).queryByText('Along the shore')).not.toBeInTheDocument();
  });

  test('[ShadCarousel-PROP-004] slidesPerView shows several slides at once, with a dot per resting place', async () => {
    render({ properties: { slidesPerView: binding('{{2}}') } });

    await waitFor(() => expect(shown()).toEqual(['1 of 3', '2 of 3']));
    expect(screen.getAllByRole('button', { name: /^Go to slide/ })).toHaveLength(2);
  });

  test('[ShadCarousel-PROP-005] showArrows and showDots off leave only the slides', async () => {
    render({ properties: { showArrows: binding('{{false}}'), showDots: binding('{{false}}') } });

    await waitFor(() => expect(shown()).toEqual(['1 of 3']));
    expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Go to slide/ })).not.toBeInTheDocument();
  });

  test('[ShadCarousel-PROP-006] loop off stops at the ends; by default the last slide wraps round to the first', async () => {
    render({ properties: { loop: binding('{{false}}'), defaultIndex: binding('{{2}}') } });
    await waitFor(() => expect(shown()).toEqual(['3 of 3']));
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeDisabled();

    await act(async () => render({ properties: { defaultIndex: binding('{{2}}') } }));
    await press('Next slide');
    await waitFor(() => expect(exposed().currentIndex).toBe(0));
  });

  test('[ShadCarousel-PROP-007] autoplay moves on every interval, and pauses while the pointer is over it', async () => {
    render({ properties: { autoplay: binding('{{true}}'), interval: binding('{{1000}}') } });

    await waitFor(() => expect(exposed().currentIndex).toBe(1), { timeout: 2500 });
    await act(async () => fireEvent.mouseEnter(region()));
    await wait(1500);
    expect(exposed().currentIndex).toBe(1);
  }, 10000);

  test('[ShadCarousel-PROP-008] pauseOnHover off keeps autoplay moving under the pointer', async () => {
    render({
      properties: { autoplay: binding('{{true}}'), interval: binding('{{1000}}'), pauseOnHover: binding('{{false}}') },
    });
    await waitFor(() => expect(region()).toBeInTheDocument());

    await act(async () => fireEvent.mouseEnter(region()));

    await waitFor(() => expect(exposed().currentIndex).toBe(1), { timeout: 2500 });
  }, 10000);

  test('[ShadCarousel-EVT-001] the arrows and dots move the slide and fire onSlideChanged, whose handler reads the new slide', async () => {
    render();
    await handle(setVariableOn(ID, 'onSlideChanged', { value: '{{components.carousel1.currentSlide.title}}' }));
    await waitFor(() => expect(shown()).toEqual(['1 of 3']));

    await press('Next slide');
    await waitFor(() => expect(widget.variables().seen).toBe('City hubs'));
    await press('Go to slide 3');
    await waitFor(() => expect(widget.variables().seen).toBe('Mountain passes'));
    await press('Previous slide');

    await waitFor(() => expect(exposed().currentIndex).toBe(1));
    expect(shown()).toEqual(['2 of 3']);
  });

  test('[ShadCarousel-EVT-002] clicking a slide fires onSlideClicked with clickedSlide, and opens its link', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    try {
      render({ properties: { defaultIndex: binding('{{1}}') } });
      await handle(setVariableOn(ID, 'onSlideClicked', { value: '{{components.carousel1.clickedSlide.index}}' }));

      await waitFor(() => expect(shown()).toEqual(['2 of 3']));
      await act(async () => fireEvent.click(slides()[1].querySelector('.cursor-pointer')));

      await waitFor(() => expect(widget.variables().seen).toBe(1));
      expect(exposed().clickedSlide).toMatchObject({ title: 'City hubs', index: 1 });
      expect(open).toHaveBeenCalledWith('https://example.com/hubs', '_blank', 'noopener,noreferrer');
    } finally {
      open.mockRestore();
    }
  });

  test('[ShadCarousel-EVT-003] a horizontal swipe moves a slide and is not taken as a click', async () => {
    render();
    await handle(countInvocationsOn(ID, 'onSlideClicked'));
    await waitFor(() => expect(shown()).toEqual(['1 of 3']));

    await act(async () => {
      fireEvent.pointerDown(region(), { clientX: 300 });
      fireEvent.pointerUp(region(), { clientX: 200 });
      fireEvent.click(slides()[0].querySelector('.cursor-pointer'));
    });

    await waitFor(() => expect(exposed().currentIndex).toBe(1));
    expect(widget.variables().calls).toBeUndefined();
  });

  test('[ShadCarousel-KBD-001] the carousel is focusable and the arrow keys move between slides', async () => {
    render();
    await waitFor(() => expect(region()).toHaveAttribute('tabindex', '0'));

    await act(async () => fireEvent.keyDown(region(), { key: 'ArrowRight' }));
    await waitFor(() => expect(exposed().currentIndex).toBe(1));
    await act(async () => fireEvent.keyDown(region(), { key: 'ArrowLeft' }));
    await act(async () => fireEvent.keyDown(region(), { key: 'ArrowLeft' }));

    await waitFor(() => expect(exposed().currentIndex).toBe(2));
  });

  test('[ShadCarousel-ACT-001] next, previous and goTo move the carousel and fire onSlideChanged', async () => {
    render();
    await handle(countInvocationsOn(ID, 'onSlideChanged'));

    await widget.act('next');
    await waitFor(() => expect(exposed().currentIndex).toBe(1));
    await widget.act('goTo', 2);
    await waitFor(() => expect(shown()).toEqual(['3 of 3']));
    await widget.act('previous');
    await waitFor(() => expect(exposed()).toMatchObject({ currentIndex: 1, currentSlide: { title: 'City hubs' } }));
    expect(widget.variables().calls).toBe(3);
  });

  test('[ShadCarousel-STY-001] slide, arrow, dot, caption and spacing styles reach the carousel as CSS variables', async () => {
    const { container } = render({
      styles: {
        slideBackgroundColor: binding('#0f172a'),
        arrowBackgroundColor: binding('#ffffff'),
        arrowColor: binding('#111827'),
        dotColor: binding('#cbd5e1'),
        activeDotColor: binding('#e11d48'),
        captionBackgroundColor: binding('#00000080'),
        captionTextColor: binding('#fafafa'),
        titleColor: binding('#1e293b'),
        descriptionColor: binding('#64748b'),
        borderRadius: binding('{{16}}'),
        gap: binding('{{8}}'),
      },
    });

    await waitFor(() => expect(shown()).toEqual(['1 of 3']));
    const root = container.querySelector('.tj-shadcn');
    const vars = {
      '--lk-slide-bg': '#0f172a',
      '--lk-arrow-bg': '#ffffff',
      '--lk-arrow-fg': '#111827',
      '--lk-dot': '#cbd5e1',
      '--lk-dot-active': '#e11d48',
      '--lk-caption-bg': '#00000080',
      '--lk-caption-fg': '#fafafa',
      '--lk-title': '#1e293b',
      '--lk-desc': '#64748b',
      '--lk-radius': '16px',
      '--lk-gap': '8px',
    };
    Object.entries(vars).forEach(([name, value]) => expect(root.style.getPropertyValue(name)).toBe(value));
    expect(screen.getByRole('button', { name: 'Go to slide 1' }).className).toContain('var(--lk-dot-active');
  });
});
