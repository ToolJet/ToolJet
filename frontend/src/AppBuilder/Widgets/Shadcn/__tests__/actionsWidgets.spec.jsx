import React from 'react';
import dayjs from 'dayjs';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { ShadButtonGroup, ShadCalendar, ShadCarousel, ShadDropdownMenu, ShadNavigation } from '../ShadActions';
import {
  shadButtonGroupConfig,
  shadCalendarConfig,
  shadCarouselConfig,
  shadDropdownMenuConfig,
  shadNavigationConfig,
} from '../../../WidgetManager/shadcnSource.actions';

// Radix popper measures its anchor; jsdom has no ResizeObserver.
beforeAll(() => {
  global.ResizeObserver =
    global.ResizeObserver ||
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
});

// A config's defaults as the resolved properties a widget receives ('{{true}}' -> true, '{{[...]}}' -> the array).
const resolve = (value) => {
  if (typeof value !== 'string') return value;
  const m = value.match(/^\{\{([\s\S]*)\}\}$/);
  if (!m) return value;
  const moment = () => ({ format: () => '2026-10-09', add: () => ({ format: () => '2026-10-12' }) });
  // eslint-disable-next-line no-new-func
  return new Function('moment', `return (${m[1]});`)(moment);
};
const defaultsOf = (config) =>
  Object.fromEntries(Object.entries(config.definition.properties).map(([k, v]) => [k, resolve(v.value)]));

const mount = (Widget, componentType, properties, extra = {}) => {
  const exposed = {};
  const events = [];
  const utils = render(
    <Widget
      id="w1"
      componentType={componentType}
      properties={properties}
      styles={{}}
      validation={{}}
      validate={() => ({ isValid: true })}
      height={320}
      width={400}
      setExposedVariables={(values) => Object.assign(exposed, values)}
      setExposedVariable={(key, value) => (exposed[key] = value)}
      fireEvent={(name) => events.push(name)}
      {...extra}
    />
  );
  return { exposed, events, ...utils };
};

const JUNK = {
  items: [null, 3, { label: {} }, [1], { value: { a: 1 } }],
  buttons: 'nope',
  defaultValue: { weird: true },
  markers: [null, { date: 'junk' }],
  slides: [null, 5, {}],
  numberOfMonths: 'x',
  slidesPerView: 99,
  mode: 'bogus',
  orientation: 7,
  disabledDates: 'x',
  minDate: {},
};

const CASES = [
  [ShadDropdownMenu, 'ShadDropdownMenu', shadDropdownMenuConfig],
  [ShadButtonGroup, 'ShadButtonGroup', shadButtonGroupConfig],
  [ShadNavigation, 'ShadNavigation', shadNavigationConfig],
  [ShadCalendar, 'ShadCalendar', shadCalendarConfig],
  [ShadCarousel, 'ShadCarousel', shadCarouselConfig],
];

describe('actions widgets render', () => {
  it.each(CASES)('%p renders with its defaults, with junk, empty and loading', (Widget, type, config) => {
    const defaults = defaultsOf(config);
    expect(() => mount(Widget, type, defaults).unmount()).not.toThrow();
    expect(() => mount(Widget, type, { ...defaults, ...JUNK }).unmount()).not.toThrow();
    expect(() => mount(Widget, type, {}).unmount()).not.toThrow();
    expect(() => mount(Widget, type, { ...defaults, loadingState: true }).unmount()).not.toThrow();
  });
});

describe('ShadDropdownMenu', () => {
  it('opens from the keyboard and reports the picked option', async () => {
    const { exposed, events } = mount(ShadDropdownMenu, 'ShadDropdownMenu', {
      ...defaultsOf(shadDropdownMenuConfig),
      items: [
        { label: 'Edit', value: 'edit', description: 'Change it' },
        { label: 'Locked', value: 'locked', disabled: true },
        { label: 'Delete', value: 'delete', destructive: true },
      ],
    });
    expect(exposed.lastClickedOption).toBeNull();
    const trigger = screen.getByRole('button', { name: /Actions/ });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(events).toContain('onOpen');
    expect(exposed.isOpen).toBe(true);
    const item = await screen.findByRole('menuitem', { name: /Delete/ });
    fireEvent.click(item);
    expect(exposed.lastClickedOption).toEqual({ label: 'Delete', value: 'delete', description: '' });
    expect(events).toContain('onSelect');
  });

  it('does not open while disabled, and offers open and close actions', async () => {
    const disabled = mount(ShadDropdownMenu, 'ShadDropdownMenu', {
      ...defaultsOf(shadDropdownMenuConfig),
      disabledState: true,
    });
    fireEvent.keyDown(screen.getByRole('button', { name: /Actions/ }), { key: 'Enter' });
    await act(() => disabled.exposed.open());
    expect(screen.queryByRole('menuitem')).toBeNull();
    disabled.unmount();
    const { exposed } = mount(ShadDropdownMenu, 'ShadDropdownMenu', {
      ...defaultsOf(shadDropdownMenuConfig),
      triggerType: 'icon',
    });
    expect(screen.getByRole('button', { name: 'Actions' })).toBeTruthy();
    await act(() => exposed.open());
    expect(await screen.findAllByRole('menuitem')).toHaveLength(4);
    await act(() => exposed.close());
  });
});

describe('ShadButtonGroup', () => {
  it('selects one in single mode and fires onClick then onChange', () => {
    const { exposed, events } = mount(ShadButtonGroup, 'ShadButtonGroup', defaultsOf(shadButtonGroupConfig));
    expect(exposed).toMatchObject({ value: 'week', values: ['week'], selected: ['week'] });
    fireEvent.click(screen.getByRole('button', { name: 'Month' }));
    expect(exposed).toMatchObject({
      value: 'month',
      values: ['month'],
      lastClicked: { label: 'Month', value: 'month' },
    });
    expect(events).toEqual(['onClick', 'onChange']);
    fireEvent.click(screen.getByRole('button', { name: 'Month' }));
    expect(events).toEqual(['onClick', 'onChange', 'onClick']);
    expect(screen.getByRole('button', { name: 'Month' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('toggles in multiple mode and takes setSelected and clear', async () => {
    const { exposed } = mount(ShadButtonGroup, 'ShadButtonGroup', {
      ...defaultsOf(shadButtonGroupConfig),
      mode: 'multiple',
      defaultValue: ['day'],
    });
    fireEvent.click(screen.getByRole('button', { name: 'Week' }));
    expect(exposed.value).toEqual(['day', 'week']);
    await act(() => exposed.setSelected(['month', 'nope']));
    expect(exposed.values).toEqual(['month']);
    await act(() => exposed.clear());
    expect(exposed.values).toEqual([]);
  });

  it('only reports clicks in actions mode', () => {
    const { exposed, events } = mount(ShadButtonGroup, 'ShadButtonGroup', {
      ...defaultsOf(shadButtonGroupConfig),
      mode: 'actions',
    });
    fireEvent.click(screen.getByRole('button', { name: 'Day' }));
    expect(exposed.lastClicked).toEqual({ label: 'Day', value: 'day' });
    expect(exposed.value).toBe('');
    expect(events).toEqual(['onClick']);
  });
});

describe('ShadNavigation', () => {
  it('marks the default active, selects on click and opens a sidebar group', async () => {
    const { exposed, events } = mount(ShadNavigation, 'ShadNavigation', defaultsOf(shadNavigationConfig));
    expect(exposed.value).toBe('dashboard');
    expect(screen.getByRole('button', { name: /Dashboard/ }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(screen.getByRole('button', { name: /Orders/ }));
    expect(exposed.value).toBe('orders');
    expect(exposed.activeItem).toEqual({ label: 'Orders', value: 'orders', parentLabel: null, parentValue: null });
    expect(events).toEqual(['onSelect']);
    fireEvent.click(screen.getByRole('button', { name: /Reports/ }));
    fireEvent.click(screen.getByRole('button', { name: /Sales/ }));
    expect(exposed.activeItem).toMatchObject({ value: 'sales', parentValue: 'reports' });
    await act(() => exposed.setActive('settings'));
    expect(exposed.value).toBe('settings');
    expect(events).toEqual(['onSelect', 'onSelect']);
    expect(screen.getByText('Workspace')).toBeTruthy();
  });

  it('renders a top bar with children in a dropdown, and an icon rail', async () => {
    const { exposed } = mount(ShadNavigation, 'ShadNavigation', {
      ...defaultsOf(shadNavigationConfig),
      orientation: 'horizontal',
      variant: 'underline',
    });
    const reports = screen.getByRole('button', { name: /Reports/ });
    fireEvent.keyDown(reports, { key: 'Enter' });
    fireEvent.click(await screen.findByRole('menuitem', { name: /Traffic/ }));
    expect(exposed.activeItem).toMatchObject({ value: 'traffic', parentLabel: 'Reports' });
    await act(() => exposed.setCollapsed(true));
    expect(exposed.isCollapsed).toBe(true);
  });
});

describe('ShadCalendar', () => {
  const props = { ...defaultsOf(shadCalendarConfig), defaultValue: '2026-10-09' };

  it('selects a day, fires onSelect and shows markers', () => {
    const { exposed, events } = mount(ShadCalendar, 'ShadCalendar', {
      ...props,
      markers: [{ date: '2026-10-12', label: 'Release' }],
    });
    expect(exposed).toMatchObject({ value: '2026-10-09', visibleMonth: '2026-10' });
    expect(screen.getByTitle('Release')).toBeTruthy();
    fireEvent.click(screen.getByTitle('Release'));
    expect(exposed.value).toBe('2026-10-12');
    expect(events).toEqual(['onSelect']);
  });

  it('changes month, and takes selectDate, setMonth and clear', async () => {
    const { exposed, events } = mount(ShadCalendar, 'ShadCalendar', { ...props, mode: 'range', defaultValue: [] });
    fireEvent.click(screen.getByRole('button', { name: /next month/i }));
    expect(exposed.visibleMonth).toBe(dayjs().add(1, 'month').format('YYYY-MM'));
    expect(events).toEqual(['onMonthChange']);
    await act(() => exposed.selectDate('2026-03-02', '2026-03-05'));
    expect(exposed).toMatchObject({ startDate: '2026-03-02', endDate: '2026-03-05', visibleMonth: '2026-03' });
    await act(() => exposed.setMonth('2027-01-15'));
    expect(exposed.visibleStart).toBe('2027-01-01');
    await act(() => exposed.clear());
    expect(exposed.value).toEqual(['', '']);
  });
});

describe('ShadCarousel', () => {
  const props = defaultsOf(shadCarouselConfig);

  it('moves with arrows, dots and keys, firing onSlideChange', async () => {
    const { exposed, events } = mount(ShadCarousel, 'ShadCarousel', props);
    expect(exposed.currentIndex).toBe(0);
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(exposed.currentIndex).toBe(1);
    expect(exposed.currentSlide.title).toBe('City hubs');
    fireEvent.click(screen.getByRole('button', { name: 'Go to slide 3' }));
    expect(exposed.currentIndex).toBe(2);
    fireEvent.keyDown(screen.getByRole('region'), { key: 'ArrowRight' });
    expect(exposed.currentIndex).toBe(0);
    expect(events).toEqual(['onSlideChange', 'onSlideChange', 'onSlideChange']);
    await act(() => exposed.goTo(1));
    expect(exposed.currentIndex).toBe(1);
    await act(() => exposed.previous());
    expect(exposed.currentIndex).toBe(0);
  });

  it('stops at the ends without loop, and reports slide clicks', () => {
    const { exposed, events } = mount(ShadCarousel, 'ShadCarousel', { ...props, loop: false });
    expect(screen.getByRole('button', { name: 'Previous slide' }).disabled).toBe(true);
    const slide = within(screen.getAllByRole('group')[0]).getByRole('img');
    fireEvent.click(slide);
    expect(events).toEqual(['onSlideClick']);
    expect(exposed.clickedSlide).toMatchObject({ title: 'Coastal routes', index: 0 });
  });

  it('autoplays and pauses on hover', () => {
    jest.useFakeTimers();
    try {
      const { exposed } = mount(ShadCarousel, 'ShadCarousel', { ...props, autoplay: true, interval: 1000 });
      act(() => jest.advanceTimersByTime(1000));
      expect(exposed.currentIndex).toBe(1);
      fireEvent.mouseEnter(screen.getByRole('region'));
      act(() => jest.advanceTimersByTime(3000));
      expect(exposed.currentIndex).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
