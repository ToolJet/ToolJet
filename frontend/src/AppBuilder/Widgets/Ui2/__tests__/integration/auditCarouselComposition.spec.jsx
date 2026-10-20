import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * UI 2.0 Carousel: a slide that does something when clicked can be reached and activated from the keyboard, and
 * autoplay stops while a panel around the carousel takes no input (a retained Tabs pane switched away, hidden, loading
 * or disabled).
 *
 * Release audit (16 Oct), Codex's CAROUSEL-COMPOSITION-ACCEPTANCE-016: a slide's onSlideClicked and link were on a
 * clickable div, with no tab stop or key handler, so keyboard users could only move between slides. Autoplay checked
 * only the carousel's own visibility, so a carousel in a retained, hidden Tabs pane kept moving and firing
 * onSlideChanged every interval.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, countInvocationsOn, setVariableOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const region = () => screen.getByRole('region', { name: 'Carousel' });

describe('slide activation', () => {
  const w = createWidgetHarness({
    componentType: 'ShadCarousel',
    id: 'car1',
    handle: 'car1',
    widgetWidth: 600,
    widgetHeight: 300,
  });
  beforeEach(() => w.setup());
  afterEach(() => w.teardown());

  const mount = async ({ link = false, perView = 1, disabled = false } = {}) => {
    const slides = [
      { title: 'Alpha', ...(link ? { link: 'https://example.com/alpha' } : {}) },
      { title: 'Beta' },
      { title: 'Gamma' },
    ];
    w.render({
      currentMode: 'view',
      properties: {
        slides: binding(`{{${JSON.stringify(slides)}}}`),
        autoplay: binding('{{false}}'),
        slidesPerView: binding(`{{${perView}}}`),
        disabledState: binding(`{{${disabled}}}`),
      },
    });
    await waitFor(() => expect(region()).toBeInTheDocument());
    await act(async () =>
      w.setEvents(
        setVariableOn('car1', 'onSlideClicked', {
          key: 'clicks',
          value:
            '{{[...(variables.clicks||[]), {title:components.car1.clickedSlide.title,index:components.car1.clickedSlide.index}]}}',
        })
      )
    );
  };
  const slide = (name) => screen.getByRole('group', { name });
  const action = (name) => within(slide(name)).getByRole('button');

  test('a click fires one onSlideClicked with the slide (control)', async () => {
    await mount();
    await act(async () => fireEvent.click(within(slide('1 of 3')).getByText('Alpha')));
    await waitFor(() => expect(w.variables().clicks).toEqual([{ title: 'Alpha', index: 0 }]));
  });

  test('ArrowRight moves to the next slide without activating it (control)', async () => {
    await mount();
    await act(async () => {
      region().focus();
      fireEvent.keyDown(region(), { key: 'ArrowRight' });
    });
    await waitFor(() => expect(w.exposed().currentIndex).toBe(1));
    expect(w.variables().clicks).toBeUndefined();
  });

  test.each([
    ['a workflow slide', { perView: 1 }],
    ['a link slide', { link: true, perView: 1 }],
    ['two visible slides', { perView: 2 }],
  ])('every visible slide of %s is a button in the tab order', async (_name, options) => {
    await mount(options);
    const visible = screen.getAllByRole('group');
    expect(visible).toHaveLength(options.perView);
    visible.forEach((g) => expect(within(g).getByRole('button').tabIndex).toBe(0));
  });

  test.each(['Enter', ' '])('%p on a slide fires onSlideClicked once with that slide', async (key) => {
    await mount({ perView: 2 });
    await act(async () => {
      action('2 of 3').focus();
      fireEvent.keyDown(action('2 of 3'), { key });
    });
    await waitFor(() => expect(w.variables().clicks).toEqual([{ title: 'Beta', index: 1 }]));
    expect(w.exposed().currentIndex).toBe(0);
  });

  test('Enter on a link slide opens the link and fires onSlideClicked', async () => {
    const open = jest.spyOn(window, 'open').mockImplementation(() => null);
    try {
      await mount({ link: true });
      await act(async () => fireEvent.keyDown(action('1 of 3'), { key: 'Enter' }));
      expect(open).toHaveBeenCalledWith('https://example.com/alpha', '_blank', 'noopener,noreferrer');
      await waitFor(() => expect(w.variables().clicks).toEqual([{ title: 'Alpha', index: 0 }]));
    } finally {
      open.mockRestore();
    }
  });

  test('a slide scrolled out of view is out of the tab order', async () => {
    await mount();
    const hidden = document.querySelector('[aria-roledescription="slide"][aria-label="2 of 3"]');
    expect(hidden).toHaveAttribute('aria-hidden', 'true');
    expect(within(hidden).getByRole('button', { hidden: true }).tabIndex).toBe(-1);
  });

  test('disabled, a slide is no button and takes no click, key or arrow', async () => {
    await mount({ disabled: true });
    expect(within(slide('1 of 3')).queryByRole('button')).toBeNull();
    await act(async () => fireEvent.click(within(slide('1 of 3')).getByText('Alpha')));
    await act(async () => fireEvent.keyDown(within(slide('1 of 3')).getByText('Alpha'), { key: 'Enter' }));
    await act(async () => fireEvent.keyDown(region(), { key: 'ArrowRight' }));
    expect(w.variables().clicks).toBeUndefined();
    expect(w.exposed().currentIndex).toBe(0);
  });
});

describe('autoplay in Tabs', () => {
  const w = createWidgetHarness({
    componentType: 'ShadTabs',
    id: 'tabs1',
    handle: 'tabs1',
    widgetWidth: 700,
    widgetHeight: 450,
    capabilities: { dnd: true },
    preload: ['ShadCarousel'],
  });
  beforeEach(() => {
    w.setup();
    jest.useFakeTimers();
  });
  afterEach(() => {
    w.teardown();
    jest.useRealTimers();
  });
  const tick = (ms) => act(async () => jest.advanceTimersByTime(ms));
  const calls = () => w.variables().calls || 0;

  const mount = async (onlyActive = false) => {
    const car = componentDefinition('car1', 'car1', 'ShadCarousel', {
      slides: binding('{{[{title:"First"},{title:"Second"},{title:"Third"}]}}'),
      autoplay: binding('{{true}}'),
      interval: binding('{{1000}}'),
    });
    car.component.parent = 'tabs1-t0';
    car.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
    car.layouts = { desktop: { top: 0, left: 0, width: 30, height: 240 } };
    w.render({
      currentMode: 'view',
      extraComponents: { car1: car },
      properties: { renderOnlyActiveTab: binding(`{{${onlyActive}}}`) },
    });
    await waitFor(() => expect(region()).toBeVisible());
    w.setEvents(countInvocationsOn('car1', 'onSlideChanged'));
    await tick(1000);
    expect(calls()).toBe(1);
    expect(w.exposed('car1').currentIndex).toBe(1);
  };

  test.each([
    ['an inactive retained tab', () => act(async () => fireEvent.click(screen.getByRole('tab', { name: 'Activity' })))],
    ['a hidden Tabs widget', () => w.act('setVisibility', false)],
    ['a loading tab', () => w.act('setTabLoading', 't0', true)],
    ['a disabled tab', () => w.act('setTabDisable', 't0', true)],
    ['a disabled Tabs widget', () => w.act('setDisable', true)],
  ])('in %s, autoplay stops and fires nothing', async (_name, change) => {
    await mount();
    const carousel = region();
    await change();
    expect(carousel.isConnected).toBe(true);
    const before = calls();
    await tick(10000);
    expect(calls()).toBe(before);
  });

  test('back in the active tab, autoplay goes on once per interval', async () => {
    await mount();
    await act(async () => fireEvent.click(screen.getByRole('tab', { name: 'Activity' })));
    await tick(5000);
    expect(calls()).toBe(1);
    await act(async () => fireEvent.click(screen.getAllByRole('tab')[0]));
    await tick(3000);
    expect(calls()).toBe(4);
  });

  test('render-only-active mode removes the carousel and its timer (control)', async () => {
    await mount(true);
    await act(async () => fireEvent.click(screen.getByRole('tab', { name: 'Activity' })));
    expect(screen.queryByRole('region', { name: 'Carousel', hidden: true })).not.toBeInTheDocument();
    await tick(10000);
    expect(calls()).toBe(1);
  });

  test("the carousel's own setVisibility pauses and resumes it (control)", async () => {
    await mount();
    await act(async () => w.exposed('car1').setVisibility(false));
    await tick(10000);
    expect(calls()).toBe(1);
    await act(async () => w.exposed('car1').setVisibility(true));
    await tick(1000);
    expect(calls()).toBe(2);
  });

  test('in the active tab, autoplay fires once per interval (control)', async () => {
    await mount();
    for (let i = 0; i < 10; i++) await tick(1000);
    expect(calls()).toBe(11);
  });
});
