/**
 * Kanban: the approved contract in
 * frontend/ee/test/app-builder/widgets/Kanban/TESTING.md, exercised through the
 * real store and the real RenderWidget. Shared setup lives in
 * Widgets/widgetHarness.js.
 *
 * Real store, real RenderWidget, real Kanban + KanbanBoard + dnd-kit context +
 * AppCanvas/Container rendering real child widgets on every card. Nothing about
 * the widget is mocked.
 *
 * Why the RTL layer: this widget's product is a board whose state four CSAs
 * mutate and six events report. What a mutation actually does to the rendered
 * board, to `updatedCardData`, and to the last-added/removed/moved/selected
 * variables is only answerable by driving the real thing.
 *
 * Deliberately NOT covered here: dragging a card between columns, reordering
 * within a column, drop-to-delete, and the blocking half of `disabledState` —
 * dnd-kit pointer geometry and real `inert`, neither of which jsdom provides
 * (Kanban-BRW-001..003, QA-owned). The same card mutations are covered through
 * the CSA paths, where the assertions are about product state rather than
 * fabricated geometry.
 *
 * Test titles carry their approved scenario ID as a `[Kanban-FAMILY-NNN]`
 * prefix, per the widget-testing-contract validator.
 */
import { waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { componentDefinition } from '@/test/app-builder';

const ID = 'kb1';
const NAME = 'kanban1';

const COLUMNS = `{{[{ id: 'r1', title: 'To Do' }, { id: 'r2', title: 'Done' }]}}`;
const CARDS =
  `{{[{ id: 'c1', title: 'Card One', description: 'D1', columnId: 'r1' },` +
  ` { id: 'c2', title: 'Card Two', description: 'D2', columnId: 'r2' }]}}`;

/**
 * The card template. `others.showOnDesktop` is load-bearing: WidgetWrapper hides
 * a component whose device flags are absent, so a card child seeded without it
 * renders nothing and every per-card assertion would pass against empty cards.
 */
function cardChild() {
  const definition = componentDefinition('txt1', 'text1', 'Text', { text: binding('{{cardData.title}}') });
  definition.component.parent = ID;
  definition.component.definition.styles = {};
  definition.component.definition.others = {
    showOnDesktop: binding('{{true}}'),
    showOnMobile: binding('{{false}}'),
  };
  return definition;
}

// Baseline is `kanban.js`'s own `definition`, copied rather than invented —
// including the fact that `visibility`/`disabledState` live under STYLES for
// this widget, unlike every sibling.
const defaultProperties = {
  columnData: binding(COLUMNS),
  cardData: binding(CARDS),
  cardWidth: binding('{{302}}'),
  cardHeight: binding('{{100}}'),
  enableAddCard: binding('{{true}}'),
  showDeleteButton: binding('{{true}}'),
  deleteLabel: binding('Drop here to delete'),
  openModalOnCardClick: binding('{{true}}'),
  size: binding('lg'),
  modalHeight: binding('{{400}}'),
  collapseWhenHidden: binding('{{false}}'),
  tooltip: binding(''),
  tooltipFormat: binding('plainText'),
};
const defaultStyles = {
  visibility: binding('{{true}}'),
  disabledState: binding('{{false}}'),
  accentColor: binding('#4d72fa'),
};

const widget = createWidgetHarness({
  componentType: 'Kanban',
  handle: NAME,
  id: ID,
  defaultProperties,
  defaultStyles,
  defaultExtraComponents: { txt1: cardChild() },
  capabilities: { dnd: true },
  widgetHeight: 490,
  widgetWidth: 800,
});

const user = () => widget.session.user;
const board = () => document.getElementById(ID);
const columns = () => [...document.querySelectorAll('.kanban-container')];
const columnTitles = () => [...document.querySelectorAll('.container-name')].map((node) => node.textContent);
const cards = () => [...document.querySelectorAll('.kanban-item')];
const cardTexts = () => cards().map((node) => node.textContent);
const cardsIn = (columnIndex) => [...columns()[columnIndex].querySelectorAll('.kanban-item')].map((n) => n.textContent);
const addCardButton = () => document.querySelector('.kanban-add-card-button');
const deleteZone = () => [...document.querySelectorAll('div')].find((n) => n.textContent === 'Drop here to delete');
const modalBody = () => document.getElementById(`${ID}-modal`);
const exposed = (key) => widget.exposed()?.[key];

async function mount(options = {}) {
  widget.render({ currentMode: 'view', ...options });
  await waitFor(() => expect(board()).toBeInTheDocument());
}

const counting = (eventId, key) => ({
  id: `evt-${eventId}`,
  index: 0,
  sourceId: ID,
  name: `evt-${eventId}`,
  target: 'component',
  event: { eventId, actionId: 'set-custom-variable', key, value: `{{(variables.${key} ?? 0) + 1}}` },
});
const ALL_EVENTS = [
  counting('onCardAdded', 'added'),
  counting('onCardRemoved', 'removed'),
  counting('onCardMoved', 'moved'),
  counting('onUpdate', 'updated'),
  counting('onCardSelected', 'selected'),
  counting('onAddCardClick', 'addClicked'),
];
const fired = (key) => store().getVariable(key, MODULE_ID) ?? 0;

describe('Kanban: board data', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Kanban-DATA-001] renders one column per entry in Column data, with its title', async () => {
    // Break this catches: rendering columns from the card data instead of the
    // column data, or dropping the column titles.
    await mount();

    await waitFor(() => expect(columns()).toHaveLength(2));
    expect(columnTitles()).toEqual(['To Do', 'Done']);
  });

  test('[Kanban-DATA-002] cards render in the column their columnId points at', async () => {
    // Break this catches: bucketing every card into the first column, which is
    // what makes a Kanban a Kanban.
    await mount();

    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(cardsIn(0)).toEqual(['Card One']);
    expect(cardsIn(1)).toEqual(['Card Two']);
  });

  test('[Kanban-DATA-003] publishes every card, with a dataIndex, as `updatedCardData` from load onwards', async () => {
    // Break this catches: publishing the variable only after a mutation (the
    // docs say it holds the latest values of all cards), or dropping dataIndex.
    await mount();
    await waitFor(() => expect(cards()).toHaveLength(2));

    await waitFor(() => expect(exposed('updatedCardData')).toHaveLength(2));
    expect(exposed('updatedCardData')[0]).toMatchObject({ id: 'c1', title: 'Card One', dataIndex: 0 });
    expect(exposed('updatedCardData')[1]).toMatchObject({ id: 'c2', title: 'Card Two', dataIndex: 1 });
  });

  test('[Kanban-DATA-004] a `{{cardData.x}}` binding inside a card resolves to that card s record', async () => {
    // Break this catches: the per-card scope regression — every card rendering
    // the first card's values, or `undefined`.
    await mount();

    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(cardTexts()).toEqual(['Card One', 'Card Two']);
  });

  test('[Kanban-DATA-005] column or card data that is not an array renders an empty board, not a crash', async () => {
    // Break this catches: removing the normalize/isArray guards, so a
    // still-loading query binding takes the canvas down.
    await mount({ properties: { columnData: binding('{{null}}'), cardData: binding('{{null}}') } });

    expect(board()).toBeInTheDocument();
    expect(cards()).toHaveLength(0);
    expect(columns()).toHaveLength(0);
  });

  test('[Kanban-DATA-006] a card whose column does not exist is not rendered, but is still reported', async () => {
    // Break this catches: silently inventing a column for an orphan card, or
    // dropping it from `updatedCardData` too — leaving an app with no way to
    // detect that a record disappeared from the board.
    await mount({
      properties: {
        cardData: binding(
          `{{[{ id: 'c1', title: 'Card One', columnId: 'r1' }, { id: 'orphan', title: 'Orphan', columnId: 'nope' }]}}`
        ),
      },
    });

    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(cardTexts()).toEqual(['Card One']);
    expect(exposed('updatedCardData').map((card) => card.id)).toContain('orphan');
  });

  test('[Kanban-DATA-007] rebinding the card data re-derives the board, discarding CSA-only changes', async () => {
    // Break this catches: letting CSA state win over the binding, so a refreshed
    // query silently leaves phantom cards on the board.
    await mount();
    await waitFor(() => expect(cards()).toHaveLength(2));
    await widget.act('addCard', { id: 'c3', title: 'From CSA', description: 'D3', columnId: 'r1' });
    await waitFor(() => expect(cards()).toHaveLength(3));

    await widget.session.store.act(async () => {
      widget.setComponentProperty(ID, 'cardData', `{{[{ id: 'c9', title: 'Rebound', columnId: 'r1' }]}}`, 'properties');
    });

    await waitFor(() => expect(cardTexts()).toEqual(['Rebound']));
  });
});

describe('Kanban: cards and the modal', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Kanban-CARD-001] card width and height size the card', async () => {
    // Break this catches: reading the size from the wrong property, which
    // collapses every card on every board.
    await mount({ properties: { cardWidth: binding('{{250}}'), cardHeight: binding('{{80}}') } });

    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(cards()[0].style.width).toBe('250px');
    expect(cards()[0].style.height).toBe('80px');
  });

  test('[Kanban-CARD-002] clicking a card publishes `lastSelectedCard`, fires Card selected once, and opens the modal', async () => {
    // Break this catches: a second path into fireEvent('onCardSelected'), or
    // opening the modal without telling the app which card it shows.
    await mount({ events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));

    await user().click(cards()[0]);

    await waitFor(() => expect(fired('selected')).toBe(1));
    expect(exposed('lastSelectedCard')).toMatchObject({ id: 'c1', title: 'Card One', columnId: 'r1' });
    expect(modalBody()).toBeInTheDocument();
  });

  test('[Kanban-CARD-003] with Open modal on card click off, a card click does nothing', async () => {
    // Break this catches: dropping the guard, so a board configured for
    // read-only cards still opens a modal and runs the builder's handler.
    await mount({ properties: { openModalOnCardClick: binding('{{false}}') }, events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));

    await user().click(cards()[0]);

    expect(fired('selected')).toBe(0);
    expect(exposed('lastSelectedCard')).toEqual({});
    expect(modalBody()).toBeNull();
  });

  test('[Kanban-CARD-004] card width and height apply to cards in every column', async () => {
    // Break this catches: sizing only the first column's cards (each column
    // renders its own SortableContext), which reads as a broken board.
    await mount({ properties: { cardWidth: binding('{{250}}'), cardHeight: binding('{{80}}') } });
    await waitFor(() => expect(cards()).toHaveLength(2));

    const [firstColumnCard] = columns()[0].querySelectorAll('.kanban-item');
    const [secondColumnCard] = columns()[1].querySelectorAll('.kanban-item');

    expect(firstColumnCard.style.width).toBe('250px');
    expect(secondColumnCard.style.width).toBe('250px');
    expect(secondColumnCard.style.height).toBe('80px');
  });

  test('[Kanban-MODAL-001] the card modal renders at the configured size and height', async () => {
    // Break this catches: ignoring the configured modal size/height, which the
    // modal-configuration commits added deliberately.
    await mount({ properties: { size: binding('sm'), modalHeight: binding('{{250}}') } });
    await waitFor(() => expect(cards()).toHaveLength(2));

    await user().click(cards()[0]);

    await waitFor(() => expect(modalBody()).toBeInTheDocument());
    expect(modalBody().style.height).toBe('250px');
    expect(document.querySelector('.modal-sm')).toBeTruthy();
  });
});

describe('Kanban: add card and delete zone', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Kanban-ADD-001] clicking Add Card fires On add card click once and adds no card by itself', async () => {
    // Break this catches: the widget adding a card on its own (the event exists
    // precisely so the builder decides), or a double fire.
    await mount({ events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));

    await user().click(addCardButton());

    await waitFor(() => expect(fired('addClicked')).toBe(1));
    expect(cards()).toHaveLength(2);
  });

  test('[Kanban-ADD-002] with Enable adding card off, the button is hidden and fires nothing', async () => {
    // Break this catches: dropping either half of the gate — the button stays
    // mounted, so hiding it without gating the handler leaves it clickable.
    await mount({ properties: { enableAddCard: binding('{{false}}') }, events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));

    expect(addCardButton().className).toContain('invisible');
    await user().click(addCardButton());

    expect(fired('addClicked')).toBe(0);
  });

  test('[Kanban-DEL-001] the delete zone renders with its label only when enabled', async () => {
    // Break this catches: rendering the drop-to-delete zone on a board whose
    // builder turned it off — a destructive affordance appearing uninvited.
    await mount({ properties: { deleteLabel: binding('Drop here to delete') } });
    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(deleteZone()).toBeTruthy();

    await mount({ properties: { showDeleteButton: binding('{{false}}') } });

    await waitFor(() => expect(cards()).toHaveLength(2));
    expect(deleteZone()).toBeFalsy();
  });
});

describe('Kanban: component-specific actions', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Kanban-ACT-001] `addCard` adds the card, publishes it, and fires Card added once', async () => {
    // Break this catches: adding the card to the board without reporting it, or
    // firing the event twice for one call.
    await mount({ events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));

    await widget.act('addCard', { id: 'c3', title: 'Card Three', description: 'D3', columnId: 'r1' });

    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(cardsIn(0)).toEqual(['Card One', 'Card Three']);
    expect(exposed('lastAddedCard')).toMatchObject({ id: 'c3', title: 'Card Three', columnId: 'r1' });
    expect(exposed('updatedCardData').map((card) => card.id)).toContain('c3');
    expect(fired('added')).toBe(1);
  });

  test('[Kanban-ACT-002] `moveCard` moves the card and publishes `lastCardMovement`', async () => {
    // Break this catches: renaming or dropping a field of the movement report —
    // `destinationIndex` is the published name, NOT the documented
    // `destinationCardIndex` (contract D-01) — or moving without reporting.
    await mount({ events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));

    await widget.act('moveCard', 'c1', 'r2');

    await waitFor(() => expect(cardsIn(1)).toEqual(['Card One', 'Card Two']));
    expect(cardsIn(0)).toEqual([]);
    expect(exposed('lastCardMovement')).toMatchObject({
      originColumnId: 'r1',
      destinationColumnId: 'r2',
      originCardIndex: 0,
      destinationIndex: 0,
    });
    expect(exposed('lastCardMovement').cardDetails).toMatchObject({ id: 'c1', columnId: 'r2' });
    expect(exposed('lastCardMovement').destinationCardIndex).toBeUndefined();
    expect(fired('moved')).toBe(1);
  });

  test('[Kanban-ACT-003] `deleteCard` removes the card, publishes it, and fires Card removed once', async () => {
    // Break this catches: removing the card from the board without reporting
    // what was deleted, which is the only record an app has of it.
    await mount({ events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));

    await widget.act('deleteCard', 'c2');

    await waitFor(() => expect(cards()).toHaveLength(1));
    expect(cardTexts()).toEqual(['Card One']);
    expect(exposed('lastRemovedCard')).toMatchObject({ id: 'c2', title: 'Card Two' });
    expect(exposed('updatedCardData').map((card) => card.id)).not.toContain('c2');
    expect(fired('removed')).toBe(1);
  });

  test('[Kanban-ACT-004] `updateCardData` on the selected card publishes the update and fires On update once', async () => {
    // Break this catches: losing the old/new pairs in `lastCardUpdate`, or not
    // refreshing the card the user currently has open.
    await mount({ events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));
    await user().click(cards()[0]);
    await waitFor(() => expect(exposed('lastSelectedCard')?.id).toBe('c1'));

    await widget.act('updateCardData', 'c1', { title: 'Renamed' });

    await waitFor(() => expect(fired('updated')).toBe(1));
    expect(exposed('lastUpdatedCard')).toMatchObject({ id: 'c1', title: 'Renamed' });
    // The changed property's old/new pair is reported. That the array ALSO
    // carries an entry per untouched field is Kanban-BUG-002, not this
    // scenario's guarantee.
    expect(exposed('lastCardUpdate')).toContainEqual({ title: { oldValue: 'Card One', newValue: 'Renamed' } });
    expect(exposed('updatedCardData')[0]).toMatchObject({ id: 'c1', title: 'Renamed' });
  });

  test('[Kanban-ACT-005] `addCard` rejects a duplicate id or an unknown column without changing the board', async () => {
    // Break this catches: dropping either guard — a duplicate id silently
    // overwrites a card, an unknown column drops the card into nowhere.
    await mount({ events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));

    await widget.act('addCard', { id: 'c1', title: 'Duplicate', columnId: 'r1' });
    await widget.act('addCard', { id: 'cX', title: 'No column', columnId: 'does-not-exist' });

    expect(cards()).toHaveLength(2);
    expect(cardTexts()).toEqual(['Card One', 'Card Two']);
    expect(fired('added')).toBe(0);
  });

  test('[Kanban-ACT-006] the mutating CSAs reject an unknown card, and `moveCard` rejects a no-op move', async () => {
    // Break this catches: acting on `undefined` (a crash, or a phantom card
    // appearing), and firing movement events for a move that never happened.
    await mount({ events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));

    await widget.act('deleteCard', 'nope');
    await widget.act('moveCard', 'nope', 'r2');
    await widget.act('updateCardData', 'nope', { title: 'x' });
    await widget.act('moveCard', 'c1', 'r1');

    expect(cards()).toHaveLength(2);
    expect(cardTexts()).toEqual(['Card One', 'Card Two']);
    expect(fired('removed')).toBe(0);
    expect(fired('moved')).toBe(0);
    expect(fired('updated')).toBe(0);
  });
});

describe('Kanban: states and styles', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[Kanban-STATE-001] the board renders its columns, cards and affordances with the shipped defaults', async () => {
    // Break this catches: a default that stops the board rendering out of the
    // box — the first thing a builder sees after dropping the widget.
    await mount();

    await waitFor(() => expect(columns()).toHaveLength(2));
    expect(cards()).toHaveLength(2);
    expect(addCardButton()).toBeTruthy();
    expect(deleteZone()).toBeTruthy();
  });

  test('[Kanban-STATE-002] Visibility off hides the board', async () => {
    // Break this catches: publishing a hidden board that is still on screen.
    await mount({ styles: { ...defaultStyles, visibility: binding('{{false}}') } });

    expect(board()).toHaveStyle({ display: 'none' });
  });

  test('[Kanban-STATE-003] Disable marks the board disabled and inert', async () => {
    // Break this catches: dropping the `inert` property (the mechanism that
    // takes cards and buttons out of the tab order and blocks pointer input in
    // a browser) or the `data-disabled` marker styling depends on. Whether the
    // browser then blocks the interaction is Kanban-BRW-003.
    await mount({ styles: { ...defaultStyles, disabledState: binding('{{true}}') } });

    expect(board()).toHaveAttribute('data-disabled', 'true');
    expect(board().inert).toBe(true);
  });

  test('[Kanban-STYLE-001] Accent colour styles the column headers and the Add Card button', async () => {
    // Break this catches: reading the accent from the wrong style key, so a
    // themed board renders with the hardcoded fallback blue.
    await mount({ styles: { ...defaultStyles, accentColor: binding('#102030') } });
    await waitFor(() => expect(columns()).toHaveLength(2));

    expect(addCardButton().style.backgroundColor).toBe('rgb(16, 32, 48)');
    expect(document.querySelector('.container-name').style.color).toBe('rgb(16, 32, 48)');
  });

  test('[Kanban-COMPAT-001] a definition predating the modal settings and delete label still renders and accepts CSAs', async () => {
    // Break this catches: treating any of the newer keys as required, which
    // would break every board saved before they existed.
    legacyWidget.setup();
    legacyWidget.render({ currentMode: 'view' });
    await waitFor(() => expect(board()).toBeInTheDocument());
    await waitFor(() => expect(cards()).toHaveLength(2));

    await legacyWidget.act('addCard', { id: 'c3', title: 'Card Three', columnId: 'r1' });

    await waitFor(() => expect(cards()).toHaveLength(3));
    legacyWidget.teardown();
  });
});

/**
 * A definition saved before `openModalOnCardClick`/`size`/`modalHeight`/
 * `deleteLabel` existed: those keys are ABSENT, not falsy.
 */
const legacyWidget = createWidgetHarness({
  componentType: 'Kanban',
  handle: NAME,
  id: ID,
  defaultProperties: {
    columnData: binding(COLUMNS),
    cardData: binding(CARDS),
    cardWidth: binding('{{302}}'),
    cardHeight: binding('{{100}}'),
    enableAddCard: binding('{{true}}'),
    showDeleteButton: binding('{{true}}'),
  },
  defaultStyles,
  defaultExtraComponents: { txt1: cardChild() },
  capabilities: { dnd: true },
  widgetHeight: 490,
  widgetWidth: 800,
});

describe('Kanban: known unfixed bugs', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  // BUG (unfixed, contract D-02): `updateCardData` publishes `lastUpdatedCard`
  // and `lastCardUpdate` only inside the `lastSelectedCard?.id === cardId`
  // branch, so a purely programmatic update — the documented use of the CSA —
  // fires onUpdate and refreshes `updatedCardData` while leaving both
  // documented variables stale. Fix: publish them from both branches.
  test.failing(
    '[Kanban-BUG-001] any card updated through `updateCardData` publishes the update variables',
    async () => {
      await mount({ events: ALL_EVENTS });
      await waitFor(() => expect(cards()).toHaveLength(2));

      await widget.act('updateCardData', 'c2', { title: 'Renamed' });

      await waitFor(() => expect(fired('updated')).toBe(1));
      expect(exposed('lastUpdatedCard')).toMatchObject({ id: 'c2', title: 'Renamed' });
      expect(exposed('lastCardUpdate')).toEqual([{ title: { oldValue: 'Card Two', newValue: 'Renamed' } }]);
    }
  );

  // BUG (unfixed, contract D-04): `lastCardUpdate` diffs the existing card
  // against the PARTIAL update payload, so every field the caller did not pass
  // is reported as a change with `newValue: undefined`, and the genuinely
  // changed field's position in the array depends on key order — the docs'
  // `lastCardUpdate[0].title.oldValue` example only works by luck. Fix: diff the
  // old card against the merged card instead of against the payload.
  test.failing('[Kanban-BUG-002] `lastCardUpdate` reports only the properties that actually changed', async () => {
    await mount({ events: ALL_EVENTS });
    await waitFor(() => expect(cards()).toHaveLength(2));
    await user().click(cards()[0]);
    await waitFor(() => expect(exposed('lastSelectedCard')?.id).toBe('c1'));

    await widget.act('updateCardData', 'c1', { title: 'Renamed' });

    await waitFor(() => expect(fired('updated')).toBe(1));
    expect(exposed('lastCardUpdate')).toEqual([{ title: { oldValue: 'Card One', newValue: 'Renamed' } }]);
  });
});
