import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { CardGrid } from '../../../../../../../packs/shadcn/src/components/CardGrid';
import { RecordList } from '../../../../../../../packs/shadcn/src/components/RecordList';
import { ProgressList } from '../../../../../../../packs/shadcn/src/components/ProgressList';
import { AccordionContainer } from '../../../../../../../packs/shadcn/src/components/AccordionContainer';
import { Stepper } from '../../../../../../../packs/shadcn/src/components/Stepper';
import { TabsContainer } from '../../../../../../../packs/shadcn/src/components/TabsContainer';
import { Carousel } from '../../../../../../../packs/shadcn/src/components/Carousel';
import { Card } from '../../../../../../../packs/shadcn/src/components/Card';
import { Form } from '../../../../../../../packs/shadcn/src/components/Form';
import { Separator } from '../../../../../../../packs/shadcn/src/components/Separator';
import { Image } from '../../../../../../../packs/shadcn/src/components/Image';
import { Kanban } from '../../../../../../../packs/shadcn/src/components/Kanban';
import { slotNames, toSlotName } from '../../../../../../../packs/shadcn/src/lib/slots';

// The shadcn pack's record lists, section containers, Carousel, Image and text displays after the pack audit
// (SP-02/03/09/18/19/20/31/32, 2026-10-23). The pack components, the inline SDK and the host renderer are the real
// ones; only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const HOST = { disabled: false, loading: false };
const COMPONENTS = { CardGrid, RecordList, ProgressList, AccordionContainer, Stepper, TabsContainer, Carousel, Card, Form, Separator, Image, Kanban };
let mounts = 0;

// One pack widget on the inline host. `update` re-renders it with new properties (a binding resolving again), a new
// host state, or a new wrapper around it (a parent turning inert).
const mount = async (name, props, { host = HOST, wrapper = {} } = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: COMPONENTS[name] });
  const exposed = {};
  const events = [];
  const slots = [];
  const cacheKey = `collections-${name}-${(mounts += 1)}`;
  const make = (p, h, w) => (
    <div {...w}>
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey={cacheKey}
        componentName={name}
        componentProps={p}
        componentStyles={{}}
        renderSlot={(slot) => {
          slots.push(slot);
          return null;
        }}
        setExposedVariable={(key, value) => {
          exposed[key] = value;
        }}
        fireEvent={(event) => events.push(event)}
        actions={new Map()}
        host={h}
        dataCy="pack-widget"
      />
    </div>
  );
  let current = { props, host, wrapper };
  const view = render(make(props, host, wrapper));
  const root = () => view.container.querySelector('[data-cy="pack-widget"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  const update = (next) => {
    current = { ...current, ...next };
    view.rerender(make(current.props, current.host, current.wrapper));
  };
  return { view, root, exposed, events, update };
};

const alpha = { id: 1, name: 'Alpha', label: 'Alpha', status: 'Pending', total: 10, spent: 10, budget: 100 };
const beta = { id: 2, name: 'Beta', label: 'Beta', status: 'Paid', total: 20, spent: 20, budget: 100 };
const LISTS = [
  ['CardGrid', '.u2l-card', 'onCardClicked', { titleField: 'name', metaFields: '', badgeField: 'status', idField: 'id', showImage: false }],
  ['RecordList', '.u2l-record', 'onItemClicked', { titleField: 'name', metaFields: '', idField: 'id' }],
  ['ProgressList', '.ui2-plist-row', 'onItemClicked', {}],
];

describe.each(LISTS)('%s selection follows the selected record', (name, rowSelector, clickEvent, fields) => {
  const pickAlpha = async () => {
    const t = await mount(name, { ...fields, data: [alpha, beta] });
    fireEvent.click(t.root().querySelectorAll(rowSelector)[0]);
    expect(t.exposed.selectedItem).toEqual(alpha);
    expect(t.exposed.selectedItemIndex).toBe(0);
    expect(t.events).toEqual([clickEvent]);
    return t;
  };

  test('a click publishes the record with its id field value, a number staying a number', async () => {
    const t = await pickAlpha();
    expect(t.exposed.selectedItemId).toBe(1);
  });

  test('a refresh republishes the record fresh, without another click event', async () => {
    const t = await pickAlpha();
    const fresh = { ...alpha, name: 'Alpha updated', label: 'Alpha updated', total: 99 };
    t.update({ props: { ...fields, data: [fresh, beta] } });
    await waitFor(() => expect(t.exposed.selectedItem).toEqual(fresh));
    expect(t.events).toHaveLength(1);
  });

  test('a reorder publishes the record at its new index', async () => {
    const t = await pickAlpha();
    t.update({ props: { ...fields, data: [beta, alpha] } });
    await waitFor(() => expect(t.exposed.selectedItemIndex).toBe(1));
    expect(t.exposed.selectedItem).toEqual(alpha);
    expect(t.exposed.selectedItemId).toBe(1);
    expect(t.events).toHaveLength(1);
  });

  test('a removal clears the selection, and it stays cleared when the record comes back', async () => {
    const t = await pickAlpha();
    t.update({ props: { ...fields, data: [beta] } });
    await waitFor(() => expect(t.exposed.selectedItem).toEqual({}));
    expect(t.exposed.selectedItemId).toBeNull();
    expect(t.exposed.selectedItemIndex).toBe(-1);
    expect(t.root().querySelector('[data-selected="true"]')).toBeNull();
    t.update({ props: { ...fields, data: [alpha, beta] } });
    await waitFor(() => expect(t.root().querySelectorAll(rowSelector)).toHaveLength(2));
    expect(t.exposed.selectedItem).toEqual({});
    expect(t.events).toHaveLength(1);
  });

  test('of two records sharing an id, the second one picked stays selected', async () => {
    const twin = { ...alpha, name: 'Alpha twin', label: 'Alpha twin', total: 11 };
    const t = await mount(name, { ...fields, data: [alpha, twin] });
    fireEvent.click(t.root().querySelectorAll(rowSelector)[1]);
    expect(t.exposed.selectedItem).toEqual(twin);
    t.update({ props: { ...fields, data: [alpha, { ...twin, total: 12 }] } });
    await waitFor(() => expect(t.exposed.selectedItem.total).toBe(12));
    expect(t.exposed.selectedItemIndex).toBe(1);
  });
});

test('ProgressList keeps a numeric 0 id and a string id as they are', async () => {
  const t = await mount('ProgressList', { data: [{ ...alpha, id: 0 }, { ...beta, id: 'b-2' }] });
  const rows = () => t.root().querySelectorAll('.ui2-plist-row');
  fireEvent.click(rows()[0]);
  expect(t.exposed.selectedItemId).toBe(0);
  fireEvent.click(rows()[1]);
  expect(t.exposed.selectedItemId).toBe('b-2');
});

describe('section slot names', () => {
  test('ids in slot characters keep the names saved apps use', () => {
    const names = slotNames('tab', ['details', 'activity', 'step_2']);
    expect([...names.values()]).toEqual(['tab_details', 'tab_activity', 'tab_step_2']);
  });

  test('a lone id with other characters keeps its folded name', () => {
    expect(slotNames('tab', ['a-b', 'other']).get('a-b')).toBe(toSlotName('tab', 'a-b'));
  });

  test.each(['tab', 'section', 'step'])('%s: ids that fold to the same characters get distinct names', (prefix) => {
    const ids = ['a-b', 'a_b', 'a.b', 'café', 'cafè'];
    const names = slotNames(prefix, ids);
    expect(new Set(names.values()).size).toBe(ids.length);
    expect(names.get('a_b')).toBe(`${prefix}_a_b`);
    for (const name of names.values()) expect(name).toMatch(/^\w+$/);
  });

  test('the names do not depend on the order of the items', () => {
    const one = slotNames('tab', ['a-b', 'a_b', 'a.b']);
    const two = slotNames('tab', ['a.b', 'a_b', 'a-b']);
    expect([...two.entries()].sort()).toEqual([...one.entries()].sort());
  });

  test('a repeated id is one item with one name', () => {
    expect(slotNames('tab', ['x', 'x']).size).toBe(1);
  });

  test('TabsContainer draws one canvas per tab for colliding ids', async () => {
    const t = await mount('TabsContainer', {
      tabs: [
        { id: 'a-b', label: 'Hyphen ID' },
        { id: 'a_b', label: 'Underscore ID' },
      ],
      currentTab: 'a-b',
    });
    const names = [...t.root().querySelectorAll('[data-tj-slot]')].map((el) => el.getAttribute('data-tj-slot'));
    expect(names).toHaveLength(2);
    expect(new Set(names).size).toBe(2);
    expect(names).toContain('tab_a_b');
  });
});

describe('section containers publish the sections drawn', () => {
  const sections = (list) => list.map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1) }));

  test('Accordion openIndexes follows a same-length reorder', async () => {
    const t = await mount('AccordionContainer', { sections: sections(['alpha', 'beta']), openSections: ['alpha'] });
    await waitFor(() => expect(t.exposed.openIndexes).toEqual([0]));
    t.update({ props: { sections: sections(['beta', 'alpha']), openSections: ['alpha'] } });
    await waitFor(() => expect(t.exposed.openIndexes).toEqual([1]));
    expect(t.exposed.isExpanded).toBe(true);
  });

  test('Accordion is not expanded once its open section is gone, and is again when it comes back', async () => {
    const t = await mount('AccordionContainer', { sections: sections(['alpha', 'beta']), openSections: ['alpha'] });
    await waitFor(() => expect(t.exposed.isExpanded).toBe(true));
    t.update({ props: { sections: [], openSections: ['alpha'] } });
    await waitFor(() => expect(t.exposed.isExpanded).toBe(false));
    expect(t.exposed.openIndexes).toEqual([]);
    t.update({ props: { sections: sections(['beta', 'alpha']), openSections: ['alpha'] } });
    await waitFor(() => expect(t.exposed.openIndexes).toEqual([1]));
    expect(t.exposed.isExpanded).toBe(true);
  });

  test('Stepper exposes the step it falls back to when the current one is removed, with no event', async () => {
    const t = await mount('Stepper', { steps: sections(['alpha', 'beta']), currentStep: 'alpha' });
    await waitFor(() => expect(t.exposed.currentStepIndex).toBe(0));
    t.update({ props: { steps: sections(['beta']), currentStep: 'alpha' } });
    await waitFor(() => expect(t.exposed.currentStep).toBe('beta'));
    expect(t.exposed.currentStepIndex).toBe(0);
    expect(t.exposed.isLastStep).toBe(true);
    expect(t.events).toEqual([]);
  });

  test('Stepper keeps a current step that exists', async () => {
    const t = await mount('Stepper', { steps: sections(['alpha', 'beta']), currentStep: 'beta' });
    await waitFor(() => expect(t.exposed.currentStepIndex).toBe(1));
    expect(t.exposed.currentStep).toBe('beta');
  });
});

describe('Carousel autoplay', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const slides = Array.from({ length: 4 }, (_, i) => ({ image: `https://example.test/${i}.png`, title: `Slide ${i}` }));
  const changes = (t) => t.events.filter((e) => e === 'onSlideChanged').length;

  test.each([
    ['inert', { inert: '' }],
    ['aria-disabled', { 'aria-disabled': 'true' }],
  ])('pauses while a parent is %s and resumes after', async (_, blocked) => {
    const t = await mount('Carousel', { slides, autoplay: true, interval: 1000, pauseOnHover: false });
    act(() => jest.advanceTimersByTime(2100));
    expect(changes(t)).toBe(2);
    t.update({ wrapper: blocked });
    act(() => jest.advanceTimersByTime(3100));
    expect(changes(t)).toBe(2);
    t.update({ wrapper: {} });
    act(() => jest.advanceTimersByTime(1100));
    expect(changes(t)).toBe(3);
  });
});

describe('Image lightbox', () => {
  const props = { source: 'https://example.test/photo.png', alternativeText: 'Photo', zoomOnClick: true };
  const dialog = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot?.querySelector('[role="dialog"]');
  const open = async (t) => {
    fireEvent.load(t.root().querySelector('img'));
    fireEvent.click(t.root().querySelector('[role="button"]'));
    await waitFor(() => expect(dialog()).toBeTruthy());
  };

  test('stays open while the image is enabled', async () => {
    const t = await mount('Image', props);
    await open(t);
    t.update({ props: { ...props } });
    expect(dialog()).toBeTruthy();
  });

  test.each([
    ['disabled', { disabled: true, loading: false }],
    ['loading', { disabled: false, loading: true }],
  ])('closes once the image is %s', async (_, host) => {
    const t = await mount('Image', props);
    await open(t);
    t.update({ host });
    await waitFor(() => expect(dialog()).toBeFalsy());
  });
});

describe('text properties bound to objects or records', () => {
  const RECORDS = [{ name: 'Customer A' }];
  test.each([
    ['Card', { title: RECORDS, description: { note: 'x' } }],
    ['Form', { title: RECORDS, submitLabel: { text: 'Go' }, fields: [{ name: 'a', label: { text: 'A' }, placeholder: RECORDS }] }],
    ['Separator', { label: RECORDS }],
  ])('%s draws nothing for them instead of failing', async (name, props) => {
    const t = await mount(name, props);
    expect(t.root().textContent).not.toContain('[object Object]');
    expect(t.root().textContent).not.toContain('Customer A');
  });

  test.each([
    ['Card', { title: 42 }, '42'],
    ['Separator', { label: 7 }, '7'],
    ['Form', { title: 'Contact', submitLabel: 3 }, '3'],
  ])('%s still draws numbers and text', async (name, props, shown) => {
    const t = await mount(name, props);
    expect(t.root().textContent).toContain(shown);
  });
});

describe('a keyboard move into a long Kanban column', () => {
  // The destination draws only its first 100 cards: the moved card landed past the window, unmounted and focus fell
  // to the page (the Ant and MUI packs' AM-10).
  test('the moved card stays drawn past the "Show more" window and keeps keyboard focus', async () => {
    const data = [
      { id: 1, title: 'Mover', status: 'todo' },
      ...Array.from({ length: 150 }, (_, i) => ({ id: i + 2, title: `Card ${i + 1}`, status: 'doing' })),
    ];
    const columns = [
      { id: 'todo', title: 'To do' },
      { id: 'doing', title: 'Doing' },
    ];
    // Kanban registers its card rows (custom content) with the host.
    const t = await mount('Kanban', { data, columns }, { host: { ...HOST, setRows: () => {} } });
    const card = () => [...t.root().querySelectorAll('[aria-roledescription="Draggable card"]')].find((el) => el.textContent.includes('Mover'));
    act(() => card().focus());
    fireEvent.keyDown(card(), { key: ' ' });
    fireEvent.keyDown(card(), { key: 'ArrowRight' });
    fireEvent.keyDown(card(), { key: 'Enter' });
    expect(t.exposed.lastCardMovement).toMatchObject({ cardId: 1, to: 'doing', toIndex: 150 });
    expect(card()).toBeTruthy();
    expect(t.root().activeElement).toBe(card());
  });
});
