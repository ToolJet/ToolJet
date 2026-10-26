import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';

installBrowserStubs();

// The MUI pack's card grid (role cardgrid, the Ant and shadcn grids' data contract: the build compiler fell back to the
// MUI List without it, a single tall column of recipe rows) and the List's row surface (ListItemButton rows with an
// avatar, inset dividers, the outlined card look, components rows on the same surface). The pack components, the
// inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const MUI = require('../../../../../../../packs/mui/src/index.ts');
const PACK = require('../../../../../../../packs/mui/pack.json');

let mounts = 0;
const mount = async (name, props = {}, styles = {}, hostExtra = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: MUI[name] });
  mounts += 1;
  const exposed = {};
  const events = [];
  let state = { props, styles };
  const element = () => (
    <InlineLibraryComponent
      bundleUrl={`mcg-${mounts}.js`}
      cssUrl={`mcg-${mounts}.css`}
      cacheKey={`mui-cardgrid-list-${name}-${mounts}`}
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
      dataCy="mcg-widget"
    />
  );
  let view;
  await act(async () => {
    view = render(element());
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const root = () => view.container.querySelector('[data-cy="mcg-widget"]').shadowRoot;
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

const recipes = (n) =>
  Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    title: `Recipe ${i + 1}`,
    category: i % 2 ? 'Dinner' : 'Breakfast',
    status: i % 3 ? 'Published' : 'Draft',
    description: `Note ${i + 1}`,
    prep: 10 + i,
  }));

describe('MUI CardGrid', () => {
  test('pack.json gives it the cardgrid role with the Ant card grid mappings', () => {
    const entry = PACK.components.CardGrid;
    expect(entry.role).toBe('cardgrid');
    expect(entry.roleProps).toEqual({ data: 'dataSource', cardStyle: 'variant' });
    expect(entry.roleValues.variant.outline).toBe('outlined');
    expect(entry.roleValues.variant.flat).toEqual({ variant: 'elevation', elevation: 0 });
  });

  test('draws one MUI Card per record with its title, chips, description and meta', async () => {
    const c = await mount('CardGrid', {
      dataSource: recipes(26),
      badgeFields: ['status'],
      metaFields: ['prep:{} min'],
      columns: 4,
    });
    const cards = c.root().querySelectorAll('.tj-mui-gridcard');
    expect(cards).toHaveLength(26);
    expect(c.root().querySelector('.MuiGrid-container')).not.toBeNull();
    const first = cards[0];
    expect(first.classList.contains('MuiCard-root')).toBe(true);
    expect(first.querySelector('.MuiCardActionArea-root')).not.toBeNull();
    expect(first.textContent).toContain('Recipe 1');
    expect(first.textContent).toContain('Note 1');
    expect(first.textContent).toContain('10 min');
    expect([...first.querySelectorAll('.MuiChip-root')].map((ch) => ch.textContent)).toEqual(['Breakfast', 'Draft']);
    // A status word takes its tone: Draft reads as a warning.
    expect(first.querySelectorAll('.MuiChip-colorWarning')).toHaveLength(1);
    // No image field: no picture area on any card.
    expect(c.root().querySelector('.MuiCardMedia-root, .tj-mui-cardgrid__placeholder')).toBeNull();
  });

  test('a click exposes the record, its id and index, fires onCardClicked and marks the card', async () => {
    const c = await mount('CardGrid', { dataSource: recipes(5) });
    fireEvent.click(c.root().querySelectorAll('.MuiCardActionArea-root')[2]);
    await settle();
    expect(c.exposed.selectedItem).toEqual(recipes(5)[2]);
    expect(c.exposed.selectedItemId).toBe(3);
    expect(c.exposed.selectedItemIndex).toBe(2);
    expect(c.events).toEqual(['onCardClicked']);
    const cards = c.root().querySelectorAll('.tj-mui-gridcard');
    expect(cards[2].classList.contains('is-selected')).toBe(true);
    expect(cards[2].querySelector('[data-active]')).not.toBeNull();
    // A refresh that moves the record keeps it selected by id, at its new index, without another click event.
    await c.update({ dataSource: [...recipes(5)].reverse() });
    await settle();
    expect(c.exposed.selectedItemIndex).toBe(2);
    expect(c.exposed.selectedItemId).toBe(3);
    await c.update({ dataSource: recipes(2) });
    await settle();
    expect(c.exposed.selectedItem).toEqual({});
    expect(c.exposed.selectedItemIndex).toBe(-1);
    expect(c.events).toEqual(['onCardClicked']);
  });

  test('an image field draws CardMedia, and a row without an image keeps the picture box', async () => {
    const data = [
      { id: 1, title: 'With photo', photo: 'https://example.com/a.jpg' },
      { id: 2, title: 'No photo', photo: '' },
    ];
    const c = await mount('CardGrid', { dataSource: data, imageField: 'photo', badgeField: '' });
    expect(c.root().querySelectorAll('img.MuiCardMedia-root')).toHaveLength(1);
    expect(c.root().querySelector('.tj-mui-cardgrid__placeholder').textContent).toBe('NP');
  });

  test('empty data shows the empty text', async () => {
    const c = await mount('CardGrid', { dataSource: [], emptyText: 'No recipes yet' });
    expect(c.root().querySelectorAll('.tj-mui-gridcard')).toHaveLength(0);
    expect(c.root().querySelector('.tj-mui-cardgrid__empty').textContent).toBe('No recipes yet');
  });

  test('loading draws skeleton cards over the hidden grid', async () => {
    const c = await mount('CardGrid', { dataSource: recipes(3) }, {}, { loading: true });
    const look = c.root().querySelector('.tj-mui-loading__look');
    expect(look).not.toBeNull();
    expect(look.querySelectorAll('.MuiCard-root')).toHaveLength(3);
    expect(look.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
    // The cards stay mounted under it, so the box keeps its size.
    expect(c.root().querySelectorAll('.tj-mui-gridcard')).toHaveLength(3);
  });

  test('big data draws 48 cards, then 48 more each time the end scrolls into view', async () => {
    fakeIntersection();
    const c = await mount('CardGrid', { dataSource: recipes(200) });
    const cards = () => c.root().querySelectorAll('.tj-mui-gridcard');
    expect(cards()).toHaveLength(48);
    await act(async () => sentinel().fire());
    await settle();
    expect(cards()).toHaveLength(96);
    fireEvent.click(cards()[60].querySelector('.MuiCardActionArea-root'));
    await settle();
    expect(c.exposed.selectedItem).toMatchObject({ id: 61 });
  });
});

const people = [
  { id: 1, title: 'Maya Chen', description: 'maya@example.com', photo: 'https://example.com/m.png' },
  { id: 2, title: 'Owen Hart', description: 'owen@example.com', photo: 'Owen Hart' },
  { id: 3, title: 'Priya Nair', description: 'priya@example.com', photo: '' },
];

describe('MUI List rows', () => {
  test('field rows are padded ListItemButtons with an avatar, primary and secondary text, and inset dividers', async () => {
    const c = await mount('List', { items: people, avatarField: 'photo' });
    const buttons = c.root().querySelectorAll('.tj-mui-list__item > .MuiListItemButton-root');
    expect(buttons).toHaveLength(3);
    expect(buttons[0].querySelector('.MuiListItemAvatar-root img')).not.toBeNull();
    // A name, not a URL, draws its initials (it was used as the image source, a broken picture).
    expect(buttons[1].querySelector('.MuiAvatar-root').textContent).toBe('OH');
    expect(buttons[1].querySelector('.MuiAvatar-root img')).toBeNull();
    expect(buttons[0].querySelector('.MuiListItemText-primary').textContent).toBe('Maya Chen');
    expect(buttons[0].querySelector('.MuiListItemText-secondary').textContent).toBe('maya@example.com');
    const dividers = c.root().querySelectorAll('li.MuiDivider-root');
    expect(dividers).toHaveLength(2);
    expect(dividers[0].classList.contains('MuiDivider-inset')).toBe(true);
    fireEvent.click(buttons[1]);
    await settle();
    expect(c.exposed.selectedItem).toEqual(people[1]);
    expect(buttons[1].classList.contains('Mui-selected')).toBe(true);
  });

  test('without an avatar the dividers sit inside the row padding', async () => {
    const c = await mount('List', { items: people });
    expect(c.root().querySelector('.MuiListItemAvatar-root')).toBeNull();
    expect([...c.root().querySelectorAll('li.MuiDivider-root')].every((d) => d.classList.contains('MuiDivider-middle'))).toBe(true);
  });

  test('divider off draws no lines', async () => {
    const c = await mount('List', { items: people, divider: false });
    expect(c.root().querySelectorAll('li.MuiDivider-root')).toHaveLength(0);
  });

  test("itemVariant 'outline' (UI 2.0's name) draws each row as its own card, without dividers", async () => {
    const c = await mount('List', { items: people }, { itemVariant: 'outline' });
    expect(c.root().querySelector('.tj-mui-list--outlined')).not.toBeNull();
    expect(c.root().querySelectorAll('li.MuiDivider-root')).toHaveLength(0);
    expect(c.root().querySelectorAll('.tj-mui-list__item')).toHaveLength(3);
  });

  test('components rows sit on a row surface that takes the selection', async () => {
    const c = await mount('List', { items: people, renderItem: 'components', rowHeight: 48 });
    const rows = c.root().querySelectorAll('.tj-mui-list__row');
    expect(rows).toHaveLength(3);
    fireEvent.click(rows[2]);
    await settle();
    expect(c.exposed.selectedItem).toEqual(people[2]);
    expect(rows[2].classList.contains('Mui-selected')).toBe(true);
    expect(c.root().querySelectorAll('li.MuiDivider-root')).toHaveLength(2);
  });

  test('pageSize pages the rows with MUI Pagination under the list', async () => {
    const c = await mount('List', { items: recipes(12), pageSize: 5 });
    expect(c.root().querySelectorAll('.tj-mui-list__item')).toHaveLength(5);
    expect(c.root().querySelector('.tj-mui-list__pagination .MuiPagination-root')).not.toBeNull();
  });
});

// The recipes round (wm6, MUI 1.4.23): the grid's saved props, and every shape the Ant and shadcn grids take for them.
const MODEL = require('../../../../../../../packs/mui/src/lib/ui2/display/lists/model.ts');
const CUISINES = ['Italian', 'British', 'American', 'Indian', 'Mexican', 'Thai', 'French'];
const LEVELS = ['Easy', 'Medium', 'Hard'];
const book = Array.from({ length: 28 }, (_, i) => ({
  id: i + 1,
  title: `Dish ${i + 1}`,
  cuisine: CUISINES[i % CUISINES.length],
  difficulty: LEVELS[i % LEVELS.length],
  description: `A short note on dish ${i + 1}.`,
  ingredients: (i % 5) + 2,
  prep: 15 + i,
  serves: 4,
}));
const RECIPES_GRID = {
  dataSource: book,
  titleField: 'title',
  subtitleField: '',
  imageField: '',
  badgeField: 'difficulty',
  badgeFields: [],
  eyebrowField: 'cuisine',
  avatarField: '',
  descriptionField: 'description',
  progressField: '',
  metaFields: 'ingredients:{} ingredients,prep:{} min',
  idField: 'id',
  layout: 'stacked',
  columns: 4,
  minCardWidth: 230,
  imageAspect: '16/9',
  showImage: false,
  variant: 'outlined',
  elevation: 1,
  highlightSelected: true,
  emptyText: 'No recipes match that search.',
  dynamicHeight: true,
};
const cardShape = (c) =>
  [...c.root().querySelectorAll('.tj-mui-gridcard')].map((card) => ({
    eyebrow: card.querySelector('.MuiTypography-overline')?.textContent,
    chips: [...card.querySelectorAll('.MuiChip-root')].map((ch) => ch.textContent),
    meta: card.querySelector('.MuiTypography-caption')?.textContent,
  }));

describe('MUI CardGrid with the recipes round props', () => {
  test('the saved recipesGrid props draw all 28 cards, each with its cuisine eyebrow, difficulty chip and meta', async () => {
    const c = await mount('CardGrid', RECIPES_GRID);
    const shape = cardShape(c);
    expect(shape).toHaveLength(28);
    expect(shape[0]).toEqual({ eyebrow: 'Italian', chips: ['Easy'], meta: '2 ingredients · 15 min' });
    expect(shape[27]).toEqual({ eyebrow: 'French', chips: ['Easy'], meta: '4 ingredients · 42 min' });
    // Four columns where four 230px cards fit (the 1257px box of the app), fewer where they do not.
    expect(MODEL.gridColumns(4, 1257, 230)).toBe(4);
    expect(MODEL.gridColumns(4, 600, 230)).toBe(2);
  });

  test.each([
    ['an array', book],
    ['its JSON text', JSON.stringify(book)],
    ['a query result with data', { data: book }],
    ['a query result with rows', { rows: book, count: 28 }],
    ['a query result with items', { items: book }],
  ])('dataSource as %s draws every card', async (_, dataSource) => {
    const c = await mount('CardGrid', { ...RECIPES_GRID, dataSource });
    expect(cardShape(c)).toHaveLength(28);
  });

  test.each([
    ['an empty list', [], ['Easy']],
    ['empty text', '', ['Easy']],
    ['a comma list', 'difficulty, cuisine', ['Easy', 'Italian']],
    ['a list', ['difficulty', 'cuisine'], ['Easy', 'Italian']],
  ])('badgeFields as %s adds to the badge field chip', async (_, badgeFields, chips) => {
    const c = await mount('CardGrid', { ...RECIPES_GRID, badgeFields });
    expect(cardShape(c)[0].chips).toEqual(chips);
  });

  test('metaFields as a list reads as the comma text does', async () => {
    const c = await mount('CardGrid', { ...RECIPES_GRID, metaFields: ['ingredients:{} ingredients', 'prep:{} min'] });
    expect(cardShape(c)[0].meta).toBe('2 ingredients · 15 min');
  });

  test('columns and minCardWidth written as text count as their numbers; auto and 0 fit the width', () => {
    expect(MODEL.gridColumns('4', 1257, '230')).toBe(4);
    expect(MODEL.gridColumns(4, 1257, '230px')).toBe(4);
    expect(MODEL.gridColumns(4, 1257, '300px')).toBe(4);
    expect(MODEL.gridColumns(4, 1000, '300px')).toBe(3);
    expect(MODEL.gridColumns('auto', 1257, 230)).toBe(5);
    expect(MODEL.gridColumns(0, 1257, 230)).toBe(5);
    expect(MODEL.gridColumns(undefined, 1257, undefined)).toBe(5);
  });
});
