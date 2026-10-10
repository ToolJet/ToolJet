import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import * as Display from '../ShadDisplay';
import * as configs from '../../../WidgetManager/shadcnSource.display';

// The definition's values as the app resolves them: '{{...}}' evaluated, plain strings kept.
const resolve = (value) => {
  if (typeof value !== 'string') return value;
  const m = value.match(/^\{\{([\s\S]*)\}\}$/);
  return m ? new Function(`return (${m[1]});`)() : value; // eslint-disable-line no-new-func
};
const defaultsOf = (name) => {
  const config = Object.values(configs).find((c) => c.name === name);
  return Object.fromEntries(Object.entries(config.definition.properties).map(([k, v]) => [k, resolve(v.value)]));
};

const mount = (name, properties = {}, { defaults = true, styles = {} } = {}) => {
  const Widget = Display[name];
  const exposed = {};
  const events = [];
  const props = (p) => ({
    id: 'w1',
    componentType: name,
    height: 120,
    width: 300,
    properties: { ...(defaults ? defaultsOf(name) : {}), ...p },
    styles,
    setExposedVariables: (values) => Object.assign(exposed, values),
    setExposedVariable: (key, value) => (exposed[key] = value),
    fireEvent: (event) => events.push(event),
  });
  const view = render(<Widget {...props(properties)} />);
  const rerender = (p) => view.rerender(<Widget {...props(p)} />);
  return { exposed, events, view, rerender };
};

const NAMES = [
  'ShadImage',
  'ShadIcon',
  'ShadLink',
  'ShadTags',
  'ShadCircularProgress',
  'ShadSpinner',
  'ShadKeyValue',
  'ShadTimeline',
  'ShadSteps',
  'ShadPagination',
];
const JUNK_VALUES = [null, undefined, NaN, -1, 1e12, 'junk', true, {}, [], [null, 3, 'a', {}, [1]], { a: { b: 1 } }];

describe('display widgets: robustness', () => {
  it.each(NAMES)('%s renders its defaults', (name) => {
    const { exposed } = mount(name);
    expect(exposed.isVisible).toBe(true);
  });

  it.each(NAMES)('%s renders junk in every property without throwing', (name) => {
    const keys = Object.keys(defaultsOf(name)).filter(
      (k) => !['visibility', 'loadingState', 'disabledState', 'dynamicHeight'].includes(k)
    );
    JUNK_VALUES.forEach((junk) => {
      const { view } = mount(name, Object.fromEntries(keys.map((k) => [k, junk])));
      view.unmount();
    });
    const { view } = mount(name, {}, { defaults: false });
    view.unmount();
  });

  it.each(NAMES)('%s draws a loading state and styles without throwing', (name) => {
    const { view } = mount(name, { loadingState: true }, { styles: { borderRadius: 12, textColor: '#123456' } });
    expect(view.container.querySelector('[aria-busy="true"]')).toBeTruthy();
  });
});

describe('ShadImage', () => {
  it('shows a skeleton while loading, the fallback on error, and fires onClick', () => {
    const { exposed, events, view } = mount('ShadImage', { fallback: 'initials', fallbackText: 'Ada Lovelace' });
    expect(view.container.querySelector('.animate-pulse')).toBeTruthy();
    fireEvent.error(view.container.querySelector('img'));
    expect(screen.getByText('AL')).toBeTruthy();
    expect(exposed.hasError).toBe(true);
    fireEvent.click(screen.getByText('AL'));
    expect(events).toEqual(['onClick']);
  });

  it('uses the placeholder for an empty URL and sizes by aspect ratio', () => {
    const { view } = mount('ShadImage', { source: '', alternativeText: '', aspectRatio: '16/9' });
    expect(screen.getByText('No image')).toBeTruthy();
    // The frame takes its height from the ratio, not the widget height.
    expect(view.container.querySelector('figure > div').style.height).toBe('');
  });
});

describe('ShadIcon', () => {
  it('renders known and unknown icons and fires onClick', () => {
    const { view, events } = mount('ShadIcon', { icon: 'users' });
    expect(view.container.querySelector('svg')).toBeTruthy();
    fireEvent.click(screen.getByRole('img'));
    expect(events).toEqual(['onClick']);
    const other = mount('ShadIcon', { icon: 'definitely-not-an-icon' });
    expect(other.view.container.querySelector('svg')).toBeTruthy();
  });
});

describe('ShadLink', () => {
  it('is an anchor with a target, a button without one; both fire onClick', () => {
    const { events, view } = mount('ShadLink', { linkTarget: 'https://x.dev', targetType: 'new' });
    const a = screen.getByText('View details').closest('a');
    expect(a.getAttribute('target')).toBe('_blank');
    fireEvent.click(a);
    expect(events).toEqual(['onClick']);
    view.unmount();
    const plain = mount('ShadLink', { linkTarget: '' });
    fireEvent.click(screen.getByRole('button'));
    expect(plain.events).toEqual(['onClick']);
  });
});

describe('ShadTags', () => {
  it('shows tags from a comma string, exposes the clicked tag and fires onTagClick', () => {
    const { exposed, events } = mount('ShadTags', { tags: 'Paid, Urgent', tagColors: { paid: '#16a34a' } });
    expect(exposed.tags).toEqual(['Paid', 'Urgent']);
    const paid = screen.getByText('Paid');
    expect(paid.getAttribute('style')).toContain('--tg: #16a34a');
    fireEvent.click(screen.getByText('Urgent'));
    expect(exposed.lastClickedTag).toBe('Urgent');
    expect(events).toEqual(['onTagClick']);
  });
});

describe('ShadCircularProgress', () => {
  it('clamps the value and shows it in the centre', () => {
    mount('ShadCircularProgress', { value: 150 });
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    expect(screen.getByText('100%')).toBeTruthy();
  });
});

describe('ShadSpinner', () => {
  it('renders a ring or dots with its label', () => {
    mount('ShadSpinner', { variant: 'dots', label: 'Syncing' });
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Syncing');
    expect(screen.getByText('Syncing')).toBeTruthy();
  });
});

describe('ShadKeyValue', () => {
  it('formats typed values and shows the empty text', () => {
    mount('ShadKeyValue', {
      data: [
        { label: 'Amount', value: 1250, type: 'currency' },
        { label: 'Email', value: 'ada@example.com', type: 'link' },
        { label: 'Notes', value: '' },
        { label: 'Active', value: true, type: 'boolean' },
      ],
      emptyText: 'n/a',
    });
    expect(screen.getByText('$1,250.00')).toBeTruthy();
    expect(screen.getByText('ada@example.com').closest('a').getAttribute('href')).toBe('mailto:ada@example.com');
    expect(screen.getByText('n/a')).toBeTruthy();
    expect(screen.getByText('Yes')).toBeTruthy();
  });

  it('reads an object', () => {
    mount('ShadKeyValue', { data: { Status: 'Active' } });
    expect(screen.getByText('Status')).toBeTruthy();
    expect(screen.getByText('Active')).toBeTruthy();
  });
});

describe('ShadTimeline', () => {
  it('lists items newest first and exposes the clicked item', () => {
    const { exposed, events, view } = mount('ShadTimeline', {
      items: [{ title: 'First' }, { title: 'Second', status: 'failed' }],
      newestFirst: true,
      marker: 'icon',
    });
    const titles = [...view.container.querySelectorAll('li')].map((li) => li.textContent);
    expect(titles[0]).toContain('Second');
    fireEvent.click(screen.getByText('First'));
    expect(exposed.lastClickedItem).toMatchObject({ title: 'First' });
    expect(events).toEqual(['onItemClick']);
  });
});

describe('ShadSteps', () => {
  it('selects a step, and offers the native actions', async () => {
    const { exposed, events } = mount('ShadSteps');
    expect(exposed.currentStepId).toBe(2);
    expect(screen.getByText('Billing').closest('button').getAttribute('aria-current')).toBeNull();
    fireEvent.click(screen.getByText('Billing'));
    expect(exposed.currentStepId).toBe(3);
    expect(events).toEqual(['onSelect']);
    await act(() => exposed.nextStep());
    expect(exposed.currentStepId).toBe(4);
    await act(() => exposed.resetSteps());
    expect(exposed.currentStepId).toBe(1);
    await act(() => exposed.setStep(3));
    expect(exposed.currentStepId).toBe(3);
    await act(() => exposed.setStepVisible(2, false));
    expect(screen.queryByText('Company')).toBeNull();
    await act(() => exposed.setStepDisable(4, true));
    expect(screen.getByText('Done').closest('button').disabled).toBe(true);
    expect(exposed.steps.find((s) => s.id === 4).disabled).toBe(true);
  });

  it('ignores clicks when steps are not selectable', () => {
    const { events } = mount('ShadSteps', { stepsSelectable: false, orientation: 'vertical' });
    fireEvent.click(screen.getByText('Billing'));
    expect(events).toEqual([]);
  });
});

describe('ShadPagination', () => {
  it('changes page by click and by setPage, clamped, firing onPageChange', async () => {
    const { exposed, events } = mount('ShadPagination', { numberOfPages: 10, defaultPageIndex: 1 });
    expect(exposed).toMatchObject({ totalPages: 10, currentPageIndex: 1 });
    fireEvent.click(screen.getByLabelText('Page 2'));
    expect(exposed.currentPageIndex).toBe(2);
    expect(events).toEqual(['onPageChange']);
    await act(() => exposed.setPage(99));
    expect(exposed.currentPageIndex).toBe(10);
    expect(screen.getByLabelText('Go to next page').disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Go to previous page'));
    expect(exposed.currentPageIndex).toBe(9);
  });

  it('counts pages from total records and clamps when they shrink', () => {
    const { exposed, rerender } = mount('ShadPagination', { totalRecords: 95, pageSize: 10, defaultPageIndex: 10 });
    expect(exposed).toMatchObject({ totalPages: 10, currentPageIndex: 10 });
    rerender({ totalRecords: 30, pageSize: 10, defaultPageIndex: 10 });
    expect(exposed).toMatchObject({ totalPages: 3, currentPageIndex: 3 });
  });
});
