import React from 'react';
import fs from 'fs';
import path from 'path';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';

installBrowserStubs();

// The MUI pack's Record list, Progress list, Timeline and Key-value list: the UI 2.0 widgets the build compiler maps
// onto a pack by role (recordlist, progresslist, timeline, keyvalue). MUI builds without them asked for widgets the
// pack did not have. They take UI 2.0's property, event and exposed value names, so the compiler needs no renames. The
// pack components, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const MUI = require('../../../../../../../packs/mui/src/index.ts');
const PACK = require('../../../../../../../packs/mui/pack.json');
const PACKS_DIR = path.resolve(__dirname, '../../../../../../../packs');
const NAMES = ['RecordList', 'ProgressList', 'Timeline', 'KeyValue'];

let mounts = 0;
const mount = async (name, props = {}, styles = {}, hostExtra = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: MUI[name] });
  mounts += 1;
  const exposed = {};
  const events = [];
  let state = { props, styles };
  const element = () => (
    <InlineLibraryComponent
      bundleUrl={`mls-${mounts}.js`}
      cssUrl={`mls-${mounts}.css`}
      cacheKey={`mui-lists-${name}-${mounts}`}
      componentName={name}
      componentProps={state.props}
      componentStyles={state.styles}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={new Map()}
      host={{ ...makeHost(name, {}), ...hostExtra }}
      dataCy="mls-widget"
    />
  );
  let view;
  await act(async () => {
    view = render(element());
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const root = () => view.container.querySelector('[data-cy="mls-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-mui-root')?.childElementCount).toBeGreaterThan(0));
  const update = (next) =>
    act(async () => {
      state = { ...state, props: { ...state.props, ...next } };
      view.rerender(element());
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  return { root, exposed, events, update };
};
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 30)));
const texts = (nodes) => [...nodes].map((n) => n.textContent);

const RealIO = window.IntersectionObserver;
let observed = [];
const fakeIntersection = () => {
  observed = [];
  window.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe(el) {
      observed.push({ el, by: this, fire: () => this.cb([{ target: el, isIntersecting: true }], this) });
    }
    unobserve() {}
    disconnect() {
      observed = observed.filter((o) => o.by !== this);
    }
  };
};
const sentinel = () => [...observed].reverse().find((o) => o.el.classList?.contains('tj-mui-grow-sentinel'));
afterEach(() => {
  window.IntersectionObserver = RealIO;
  document.body.innerHTML = '';
});

const JUNK = [null, 7, 'text', NaN, { a: 1 }, [null, 1, 'a', {}, [], NaN], '{{queries.missing.data}}'];

describe('MUI list widgets: the compiler contract', () => {
  test('pack.json gives each its UI 2.0 role, with no renames to map', () => {
    expect(PACK.components.RecordList.role).toBe('recordlist');
    expect(PACK.components.ProgressList.role).toBe('progresslist');
    expect(PACK.components.Timeline.role).toBe('timeline');
    expect(PACK.components.KeyValue.role).toBe('keyvalue');
    for (const name of NAMES) {
      expect(PACK.components[name].roleProps).toBeUndefined();
      expect(PACK.components[name].roleEvents).toBeUndefined();
      expect(PACK.components[name].loading).toBe('own');
    }
  });

  const built = ['mui', 'shadcn'].every((p) => fs.existsSync(path.join(PACKS_DIR, p, 'dist/manifest.json')));
  (built ? test : test.skip)("the built manifest has the shadcn widgets' props, enum values and events", () => {
    const read = (p) => JSON.parse(fs.readFileSync(path.join(PACKS_DIR, p, 'dist/manifest.json'), 'utf8')).components;
    const mui = read('mui');
    const shad = read('shadcn');
    for (const name of NAMES) {
      const own = Object.fromEntries(mui[name].props.map((p) => [p.name, p]));
      // shadcn's loadingIndicator picks its own loading look; MUI draws its Skeleton.
      const theirs = shad[name].props.filter((p) => p.name !== 'loadingIndicator');
      expect(Object.keys(own).sort()).toEqual(theirs.map((p) => p.name).sort());
      for (const p of theirs) {
        expect(own[p.name].type).toBe(p.type);
        if (p.enumDefinition) expect(own[p.name].enumDefinition).toEqual(p.enumDefinition);
      }
      expect(mui[name].events.map((e) => e.name ?? e)).toEqual(shad[name].events.map((e) => e.name ?? e));
    }
  });
});

const invoices = [
  { id: 1, customer: 'Harbor Bistro', contact: 'Maya Chen', due: '2026-10-14', status: 'Paid', total: 1240 },
  { id: 2, customer: 'Northwind Florists', contact: 'Owen Hart', due: '2026-10-16', status: 'Pending', total: 386.5 },
  { id: 3, customer: 'Juniper Dental', contact: 'Priya Nair', due: '2026-10-09', status: 'Overdue', total: 2915 },
];

describe('MUI RecordList', () => {
  test('draws a ListItemButton a record: avatar initials, title, meta line, a toned status Chip and the value', async () => {
    const c = await mount('RecordList', {
      data: invoices,
      titleField: 'customer',
      metaFields: 'contact, total|currency',
      statusField: 'status',
      valueField: 'total',
      valueFormat: 'currency',
    });
    const rows = c.root().querySelectorAll('.tj-mui-recordlist__item > .MuiListItemButton-root');
    expect(rows).toHaveLength(3);
    expect(rows[0].querySelector('.MuiAvatar-root').textContent).toBe('HB');
    expect(rows[0].querySelector('.MuiListItemText-primary').textContent).toBe('Harbor Bistro');
    expect(rows[0].querySelector('.MuiListItemText-secondary').textContent).toBe('Maya Chen · $1,240');
    expect(texts(c.root().querySelectorAll('.tj-mui-recordlist__value'))).toEqual(['$1,240', '$386.50', '$2,915']);
    expect(rows[0].querySelector('.MuiChip-colorSuccess').textContent).toBe('Paid');
    expect(rows[1].querySelector('.MuiChip-colorWarning').textContent).toBe('Pending');
    expect(rows[2].querySelector('.MuiChip-colorError').textContent).toBe('Overdue');
    // Dividers between rows, none after the last.
    const items = c.root().querySelectorAll('.tj-mui-recordlist__item');
    expect([...items].map((li) => li.classList.contains('MuiListItem-divider'))).toEqual([true, true, false]);
  });

  test('a metaFields list, a statusColors colour, a progress bar and no avatar', async () => {
    const c = await mount('RecordList', {
      data: [{ id: 'a', name: 'Spring launch', owner: 'Ada', state: 'Blocked', done: 64 }],
      titleField: 'name',
      metaFields: ['owner'],
      statusField: 'state',
      statusColors: { Blocked: '#7b1fa2' },
      progressField: 'done',
      valueField: '',
      showAvatar: false,
    });
    expect(c.root().querySelector('.MuiAvatar-root')).toBeNull();
    expect(c.root().querySelector('.MuiListItemText-secondary').textContent).toBe('Ada');
    const chip = c.root().querySelector('.MuiChip-root');
    expect(chip.textContent).toBe('Blocked');
    expect(chip.classList.contains('MuiChip-colorError')).toBe(false);
    expect(c.root().querySelector('.MuiLinearProgress-root').getAttribute('aria-valuenow')).toBe('64');
    expect(c.root().querySelector('.tj-mui-recordlist__value')).toBeNull();
  });

  test('takes a query result whole ({ rows }, { data }) and JSON text', async () => {
    for (const data of [{ rows: invoices }, { data: invoices, count: 3 }, JSON.stringify(invoices)]) {
      const c = await mount('RecordList', { data });
      expect(c.root().querySelectorAll('.tj-mui-recordlist__item')).toHaveLength(3);
    }
  });

  test('empty and junk data show the empty text and never throw', async () => {
    const c = await mount('RecordList', { data: [], emptyText: 'No invoices' });
    expect(c.root().querySelector('.tj-mui-lists__empty').textContent).toBe('No invoices');
    for (const data of JUNK) {
      await c.update({ data });
      expect(c.root().querySelector('.tj-mui-lists__frame')).not.toBeNull();
    }
    for (const junk of JUNK)
      await c.update({
        data: invoices,
        titleField: junk,
        metaFields: junk,
        valueFormat: junk,
        currency: junk,
        locale: junk,
      });
    expect(c.root().querySelectorAll('.tj-mui-recordlist__item')).toHaveLength(3);
  });

  test('figures follow the currency and locale (BRL writes pt-BR; an author locale wins)', async () => {
    const c = await mount('RecordList', {
      data: invoices,
      valueField: 'total',
      valueFormat: 'currency',
      currency: 'BRL',
    });
    expect(c.root().querySelector('.tj-mui-recordlist__value').textContent.replace(/\s/g, ' ')).toBe('R$ 1.240,00');
    await c.update({ currency: 'EUR', locale: 'en-IE' });
    expect(c.root().querySelector('.tj-mui-recordlist__value').textContent).toBe('€1,240');
    await c.update({ valueFormat: 'date', valueField: 'due', locale: '' });
    expect(c.root().querySelector('.tj-mui-recordlist__value').textContent).toMatch(/Oct 14|14 Oct/);
  });

  test('a click exposes the record, its id and index, fires onItemClicked and follows the record on refresh', async () => {
    const c = await mount('RecordList', { data: invoices });
    fireEvent.click(c.root().querySelectorAll('.MuiListItemButton-root')[1]);
    await settle();
    expect(c.exposed.selectedItem).toEqual(invoices[1]);
    expect(c.exposed.selectedItemId).toBe(2);
    expect(c.exposed.selectedItemIndex).toBe(1);
    expect(c.events).toEqual(['onItemClicked']);
    expect(c.root().querySelectorAll('.MuiListItemButton-root')[1].classList.contains('Mui-selected')).toBe(true);
    await c.update({ data: [...invoices].reverse() });
    await settle();
    expect(c.exposed.selectedItemIndex).toBe(1);
    await c.update({ data: [invoices[0]] });
    await settle();
    expect(c.exposed.selectedItem).toEqual({});
    expect(c.exposed.selectedItemIndex).toBe(-1);
    expect(c.events).toEqual(['onItemClicked']);
  });

  test('big data draws 48 rows, then more as the end scrolls into view', async () => {
    fakeIntersection();
    const many = Array.from({ length: 300 }, (_, i) => ({ id: i + 1, customer: `Customer ${i + 1}`, total: i }));
    const c = await mount('RecordList', { data: many });
    expect(c.root().querySelectorAll('.tj-mui-recordlist__item')).toHaveLength(48);
    await act(async () => sentinel().fire());
    await settle();
    expect(c.root().querySelectorAll('.tj-mui-recordlist__item')).toHaveLength(96);
  });

  test('loading draws skeleton rows over the hidden list', async () => {
    const c = await mount('RecordList', { data: invoices }, {}, { loading: true });
    expect(c.root().querySelectorAll('.tj-mui-loading__look .MuiSkeleton-circular')).toHaveLength(3);
  });
});

const budgets = [
  { id: 1, label: 'Marketing', spent: 18400, budget: 25000, status: 'On track', note: '12 days left' },
  { id: 2, label: 'Travel', spent: 7600, budget: 6000, status: 'Over budget', note: '' },
  { id: 3, label: 'Training', spent: 1200, budget: 5000, status: '', note: '' },
];

describe('MUI ProgressList', () => {
  test('a row a record: label, value of target, percentage, a LinearProgress toned by its status, a caption', async () => {
    const c = await mount('ProgressList', { data: budgets });
    const items = c.root().querySelectorAll('.tj-mui-progresslist__item');
    expect(items).toHaveLength(3);
    expect(texts(c.root().querySelectorAll('.tj-mui-progresslist__figure'))).toEqual([
      '18,400 of 25,000',
      '7,600 of 6,000',
      '1,200 of 5,000',
    ]);
    expect(texts(c.root().querySelectorAll('.tj-mui-progresslist__pct'))).toEqual(['73.6%', '126.7%', '24%']);
    const bars = c.root().querySelectorAll('.MuiLinearProgress-root');
    expect(bars[0].classList.contains('MuiLinearProgress-colorSuccess')).toBe(true);
    expect(bars[1].classList.contains('MuiLinearProgress-colorError')).toBe(true);
    expect(bars[1].getAttribute('aria-valuenow')).toBe('100');
    expect(bars[2].classList.contains('MuiLinearProgress-colorPrimary')).toBe(true);
    expect(items[0].textContent).toContain('12 days left');
    expect(items[0].querySelector('.MuiChip-colorSuccess').textContent).toBe('On track');
  });

  test('percent text keeps its sign; currency figures follow the currency; autoTone limit warns from 80%', async () => {
    const c = await mount('ProgressList', {
      data: [
        { id: 1, label: 'Uptime', value: '99.5%' },
        { id: 2, label: 'Disk', value: 85 },
      ],
      valueField: 'value',
      targetField: '',
      captionField: '',
      statusField: '',
      autoTone: 'limit',
    });
    expect(texts(c.root().querySelectorAll('.tj-mui-progresslist__figure'))).toEqual(['99.5%', '85']);
    expect(c.root().querySelectorAll('.MuiLinearProgress-colorWarning')).toHaveLength(2);
    await c.update({
      data: budgets,
      valueField: 'spent',
      targetField: 'budget',
      valueFormat: 'currency',
      currency: 'BRL',
      autoTone: 'none',
    });
    expect(c.root().querySelector('.tj-mui-progresslist__figure').textContent.replace(/\s/g, ' ')).toBe(
      'R$ 18.400,00 of R$ 25.000,00'
    );
  });

  test('money values without a target draw shares of the largest, never printed as a percentage', async () => {
    const c = await mount('ProgressList', {
      data: [
        { id: 1, label: 'North', sales: 500 },
        { id: 2, label: 'South', sales: 250 },
      ],
      valueField: 'sales',
      targetField: '',
      captionField: '',
      statusField: '',
      valueFormat: 'currency',
    });
    expect(c.root().querySelectorAll('.tj-mui-progresslist__pct')).toHaveLength(0);
    expect(
      [...c.root().querySelectorAll('.MuiLinearProgress-root')].map((b) => b.getAttribute('aria-valuenow'))
    ).toEqual(['100', '50']);
  });

  test('a click exposes the record and fires onItemClicked; empty and junk data never throw', async () => {
    const c = await mount('ProgressList', { data: { rows: budgets } });
    fireEvent.click(c.root().querySelectorAll('.MuiListItemButton-root')[2]);
    await settle();
    expect(c.exposed.selectedItem).toEqual(budgets[2]);
    expect(c.exposed.selectedItemId).toBe(3);
    expect(c.events).toEqual(['onItemClicked']);
    await c.update({ data: [], emptyText: 'No budgets' });
    expect(c.root().querySelector('.tj-mui-lists__empty').textContent).toBe('No budgets');
    for (const data of JUNK) await c.update({ data, labelField: data, valueField: data, barSize: data });
    expect(c.root().querySelector('.tj-mui-lists__frame')).not.toBeNull();
  });
});

const events = [
  { title: 'Order placed', description: 'Ada placed #1024', time: '2026-10-14T09:12:00', status: 'done' },
  { title: 'Packed', description: '', time: '2026-10-14T11:30:00', status: 'current' },
  { title: 'Shipped', time: '', status: 'pending' },
];

describe('MUI Timeline', () => {
  test('a dot on a connector a item, the title, time and description; newestFirst reverses', async () => {
    const c = await mount('Timeline', { items: events, dateFormat: 'D MMM, HH:mm' });
    const items = c.root().querySelectorAll('.tj-mui-timeline__item');
    expect(items).toHaveLength(3);
    expect(c.root().querySelectorAll('.tj-mui-timeline__dot')).toHaveLength(3);
    // The last item has no connector below it.
    expect(c.root().querySelectorAll('.tj-mui-timeline__connector')).toHaveLength(2);
    expect(texts(c.root().querySelectorAll('.tj-mui-timeline__time'))).toEqual(['14 Oct, 09:12', '14 Oct, 11:30']);
    expect(items[0].textContent).toContain('Ada placed #1024');
    await c.update({ newestFirst: true });
    expect(c.root().querySelector('.tj-mui-timeline__item').textContent).toContain('Shipped');
  });

  test('strings are titles, times show as given without a format, icons draw in the icon marker', async () => {
    const c = await mount('Timeline', {
      items: ['Created', { title: 'Approved', time: 'Yesterday', icon: 'check' }],
      marker: 'icon',
    });
    expect(texts(c.root().querySelectorAll('.tj-mui-timeline__item .MuiTypography-body2'))).toContain('Created');
    expect(c.root().querySelector('.tj-mui-timeline__time').textContent).toBe('Yesterday');
    expect(c.root().querySelectorAll('.tj-mui-timeline__dot svg')).toHaveLength(1);
  });

  test('a click exposes the item as selectedItem and lastClickedItem and fires onItemClicked', async () => {
    const c = await mount('Timeline', { items: events });
    fireEvent.click(c.root().querySelectorAll('.tj-mui-timeline__item')[1]);
    await settle();
    expect(c.exposed.selectedItem).toMatchObject({ title: 'Packed', status: 'current' });
    expect(c.exposed.lastClickedItem).toEqual(c.exposed.selectedItem);
    expect(c.events).toEqual(['onItemClicked']);
    fireEvent.keyDown(c.root().querySelectorAll('.tj-mui-timeline__item')[0], { key: 'Enter' });
    await settle();
    expect(c.exposed.selectedItem).toMatchObject({ title: 'Order placed' });
  });

  test('empty and junk items show no activity and never throw', async () => {
    const c = await mount('Timeline', { items: [] });
    expect(c.root().querySelector('.tj-mui-lists__empty').textContent).toBe('No activity yet');
    for (const items of JUNK) await c.update({ items, dateFormat: items, statusColors: items });
    expect(c.root().querySelector('.tj-mui-timeline')).not.toBeNull();
  });

  test('big data draws 48 items, then more as the end scrolls into view', async () => {
    fakeIntersection();
    const c = await mount('Timeline', {
      items: Array.from({ length: 120 }, (_, i) => ({ id: i, title: `Step ${i}` })),
    });
    expect(c.root().querySelectorAll('.tj-mui-timeline__item')).toHaveLength(48);
    await act(async () => sentinel().fire());
    await settle();
    expect(c.root().querySelectorAll('.tj-mui-timeline__item')).toHaveLength(96);
  });
});

const details = [
  { label: 'Customer', value: 'Ada Lovelace' },
  { label: 'Email', value: 'ada@example.com', type: 'link' },
  { label: 'Status', value: 'Active', type: 'badge' },
  { label: 'Amount', value: 1250, type: 'currency' },
  { label: 'Renews', value: '2026-11-14', type: 'date' },
  { label: 'Auto renew', value: true, type: 'boolean' },
  { label: 'Notes', value: '' },
];
const values = (c) => texts(c.root().querySelectorAll('.tj-mui-keyvalue__value'));

describe('MUI KeyValue', () => {
  test('label and value rows formatted by type: link, badge Chip, currency, date, boolean, empty', async () => {
    const c = await mount('KeyValue', { data: details });
    expect(texts(c.root().querySelectorAll('.tj-mui-keyvalue__label'))).toEqual(details.map((d) => d.label));
    expect(values(c)).toEqual(['Ada Lovelace', 'ada@example.com', 'Active', '$1,250.00', '14 Nov 2026', 'Yes', '-']);
    expect(c.root().querySelector('a.MuiLink-root').getAttribute('href')).toBe('mailto:ada@example.com');
    expect(c.root().querySelector('.MuiChip-colorSuccess').textContent).toBe('Active');
  });

  test('takes an object, [label, value] pairs and Ant items; percent text keeps its sign', async () => {
    const c = await mount('KeyValue', { data: { Plan: 'Pro', Seats: 12 } });
    expect(values(c)).toEqual(['Pro', '12']);
    await c.update({
      data: [
        ['Region', 'EU'],
        ['Zone', 'b'],
      ],
    });
    expect(values(c)).toEqual(['EU', 'b']);
    await c.update({
      data: [
        { label: 'Order', children: '#1042' },
        { label: 'State', children: 'Shipped', type: 'tag' },
        { label: 'Margin', value: '12.5%', type: 'percent' },
        { label: 'Share', value: 0.25, type: 'percent' },
      ],
    });
    expect(values(c)).toEqual(['#1042', 'Shipped', '12.5%', '25%']);
    expect(c.root().querySelector('.MuiChip-root').textContent).toBe('Shipped');
  });

  test('currency rows follow the currency and locale', async () => {
    const c = await mount('KeyValue', { data: [{ label: 'Total', value: 1250, type: 'currency' }], currency: 'BRL' });
    expect(values(c)[0].replace(/\s/g, ' ')).toBe('R$ 1.250,00');
    await c.update({ currency: 'EUR', locale: 'de-DE' });
    expect(values(c)[0].replace(/\s/g, ' ')).toBe('1.250,00 €');
  });

  test('columns lay the rows out in a grid, as many as fit; stacked puts the label over the value', async () => {
    const c = await mount('KeyValue', { data: details, columns: '2', layout: 'stacked' });
    const grid = c.root().querySelector('dl');
    // jsdom measures no width, so the asked-for columns apply.
    expect(grid.style.gridTemplateColumns).toBe('repeat(2, minmax(0, 1fr))');
    expect(c.root().querySelectorAll('.tj-mui-keyvalue__row.is-stacked')).toHaveLength(details.length);
    await c.update({ columns: 9 });
    expect(grid.style.gridTemplateColumns).toBe('repeat(4, minmax(0, 1fr))');
  });

  test('a click exposes lastClickedField and fires onFieldClick; junk data shows no details and never throws', async () => {
    const c = await mount('KeyValue', { data: details });
    fireEvent.click(c.root().querySelectorAll('.tj-mui-keyvalue__row')[3]);
    await settle();
    expect(c.exposed.lastClickedField).toEqual({ label: 'Amount', value: 1250 });
    expect(c.events).toEqual(['onFieldClick']);
    await c.update({ data: [] });
    expect(c.root().querySelector('.tj-mui-lists__empty').textContent).toBe('No details');
    for (const data of JUNK) await c.update({ data, columns: data, labelWidth: data, emptyText: data, currency: data });
    expect(c.root().querySelector('.tj-mui-keyvalue')).not.toBeNull();
  });
});
