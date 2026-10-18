/**
 * UI 2.0 Kanban: a board built from data, columns from a status field, cards from mapped fields (or custom card
 * content), with drag, add, delete, folding columns, card details and actions that publish every change.
 *
 * Real store, real RenderWidget, real widget, real child widgets; nothing about the widget is mocked (jsdom's missing
 * layout is given a width so custom cards mount their canvas). Standard control behaviour (visibility, disabled,
 * loading, tooltip) is covered for every UI 2.0 widget in Ui2/__tests__/controlState.spec.jsx; this file covers what the
 * Kanban itself does. Titles carry [ShadKanban-<AREA>-<NNN>] scenario ids.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, screen, waitFor, fireEvent } from '@testing-library/react';
import { componentDefinition } from '@/test/app-builder';
import { binding, setVariableOn, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { columnMinimum, kanbanCollision } from '@/AppBuilder/Widgets/Ui2/Kanban/Kanban';
import useStore from '@/AppBuilder/_stores/store';
import {
  addCard,
  boardCards,
  boardColumns,
  deleteCard,
  moveCard,
  updateCard,
} from '@/AppBuilder/Widgets/Ui2/Kanban/kanbanBoard';

const ID = 'kb1';
const widget = createWidgetHarness({
  componentType: 'ShadKanban',
  handle: 'board1',
  id: ID,
  widgetHeight: 500,
  widgetWidth: 900,
  capabilities: { dnd: true },
  preload: ['ShadText'],
});

const DEALS =
  "{{[{ ref: 'D1', name: 'Northstar', stage: 'new', tier: 'Gold', note: 'Wants one report', labels: 'Q4, Renewal', pct: 40, rep: 'Maya Chen', when: 'Follow-up Oct 14, 2026', more: { 'Deal size': '$24,000' } }, { ref: 'D2', name: 'Cedar', stage: 'won', tier: 'Silver', more: { 'Deal size': '$9,500' } }]}}";
const STAGES = "{{[{ id: 'new', title: 'New' }, { id: 'won', title: 'Won' }]}}";
const render = (options = {}) => widget.render({ currentMode: 'view', ...options });
const columns = () => [...document.querySelectorAll('[data-collapsed]')];
const titles = () => columns().map((c) => c.querySelector('span').textContent);
const card = (title) => screen.getByText(title).closest('[aria-roledescription]');
const board = () => document.querySelector('[data-collapsed]').parentElement;
const exposed = () => widget.exposed() ?? {};
const text = () => document.body.textContent;
const deals = (extra = {}) => ({
  data: binding(DEALS),
  columns: binding(STAGES),
  statusField: binding('stage'),
  idField: binding('ref'),
  titleField: binding('name'),
  badgeField: binding('tier'),
  avatarField: binding(''),
  ...extra,
});
const cardChild = (id, value, visibility) => {
  const child = componentDefinition(id, id, 'ShadText', { text: { value } });
  child.component.parent = ID;
  child.component.definition.others = { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } };
  if (visibility) child.component.definition.properties.visibility = { value: visibility };
  child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 30 } };
  return child;
};

let restoreWidth;
beforeAll(() => {
  const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'clientWidth');
  Object.defineProperty(Element.prototype, 'clientWidth', { configurable: true, get: () => 600 });
  restoreWidth = () => Object.defineProperty(Element.prototype, 'clientWidth', descriptor);
});
afterAll(() => restoreWidth?.());

describe('UI 2.0 Kanban', () => {
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  test('[ShadKanban-DEF-001] draws the sample board: three columns with counts, cards with badge and owner initials', async () => {
    render();

    await waitFor(() => expect(titles()).toEqual(['To do', 'In progress', 'Done']));
    expect(columns()[0]).toHaveTextContent('1');
    expect(card('Draft the brief')).toHaveTextContent('High');
    expect(card('Draft the brief')).toHaveTextContent('AL');
    await waitFor(() => expect(exposed().updatedCardData).toHaveLength(3));
    expect(exposed()).toMatchObject({ lastSelectedCard: {}, lastCardMovement: {}, collapsedColumns: [] });
  });

  test('[ShadKanban-PROP-001] data, columns, statusField, idField and titleField build the board; an unlisted status gets a column', async () => {
    render({
      properties: deals({
        data: binding(
          "{{[{ ref: 'D1', name: 'Northstar', stage: 'new' }, { ref: 'D9', name: 'Lost one', stage: 'lost' }]}}"
        ),
      }),
    });

    await waitFor(() => expect(titles()).toEqual(['New', 'Won', 'lost']));
    expect(columns()[1]).toHaveTextContent('No cards');
    await waitFor(() => expect(exposed().updatedCardData.map((c) => c.ref)).toEqual(['D1', 'D9']));
  });

  test('[ShadKanban-PROP-002] descriptionField, tagsField, progressField, metaField and avatarField fill out a card', async () => {
    render({
      properties: deals({
        descriptionField: binding('note'),
        tagsField: binding('labels'),
        progressField: binding('pct'),
        metaField: binding('when'),
        avatarField: binding('rep'),
      }),
    });

    await waitFor(() => expect(card('Northstar')).toHaveTextContent('Wants one report'));
    expect(screen.getByText('Q4')).toBeInTheDocument();
    expect(screen.getByText('Renewal')).toBeInTheDocument();
    expect(card('Northstar')).toHaveTextContent('40%');
    expect(card('Northstar')).toHaveTextContent('MC');
    // The meta stays on one line with its full text as a tooltip; beside a wide badge the line wraps first.
    const meta = screen.getByText('Follow-up Oct 14, 2026');
    expect(meta).toHaveClass('tw-truncate');
    expect(meta).toHaveAttribute('title', 'Follow-up Oct 14, 2026');
    expect(meta.parentElement).toHaveClass('tw-flex-wrap');
  });

  test('[ShadKanban-PROP-003] stored ISO dates on a card show as short dates', async () => {
    const year = new Date().getFullYear();
    render({
      properties: deals({
        data: binding(
          `{{[{ ref: 1, name: 'Northstar', stage: 'new', next: '${year}-10-14T00:00:00', note: '${year}-03-02' }]}}`
        ),
        metaField: binding('next'),
        descriptionField: binding('note'),
      }),
    });

    await waitFor(() => expect(card('Northstar')).toHaveTextContent('Oct 14'));
    expect(card('Northstar')).toHaveTextContent('Mar 2');
    expect(text()).not.toContain(`${year}-10-14T`);
  });

  test('[ShadKanban-PROP-004] badgeColors colours a badge by its value', async () => {
    render({ properties: deals({ badgeColors: binding("{{({ gold: '#b45309' })}}") }) });

    const badge = (await screen.findByText('Gold')).closest('[class*="kb-badge"], [style]');
    expect(badge.style.getPropertyValue('--kb-badge-fg')).toBe('#b45309');
    // A value the map does not name keeps the built-in badge colours.
    expect(screen.getByText('Silver').closest('[class*="kb-badge"]')).toBeNull();
  });

  test('[ShadKanban-EVT-001] clicking a card fires onCardSelected, opening its detailsField; a second click closes them', async () => {
    render({ properties: deals({ detailsField: binding('more') }) });
    widget.setEvents(setVariableOn(ID, 'onCardSelected', { value: '{{components.board1.lastSelectedCard.name}}' }));

    await waitFor(() => expect(titles()).toEqual(['New', 'Won']));
    expect(text()).not.toContain('$24,000');
    fireEvent.click(screen.getByText('Northstar'));
    await waitFor(() => expect(widget.variables().seen).toBe('Northstar'));
    expect(text()).toContain('Deal size');
    expect(text()).toContain('$24,000');
    fireEvent.click(screen.getByText('Cedar'));
    await waitFor(() => expect(text()).toContain('$9,500'));
    expect(text()).not.toContain('$24,000');
    fireEvent.click(screen.getByText('Cedar'));
    await waitFor(() => expect(text()).not.toContain('$9,500'));
    expect(exposed().lastSelectedCard).toMatchObject({ ref: 'D2' });
  });

  // dnd-kit's keyboard sensor took Enter as well as Space to pick a card up, so the keyboard could never open a card.
  test.each([
    ['with dragging', {}],
    ['without dragging (allowDrag off)', { allowDrag: binding('{{false}}') }],
  ])('[ShadKanban-KBD-001] Enter on a focused card opens its details on a board %s', async (_, extra) => {
    render({ properties: deals({ detailsField: binding('more'), ...extra }) });

    const northstar = card(await screen.findByText('Northstar').then((n) => n.textContent));
    await act(async () => {
      northstar.focus();
      fireEvent.keyDown(northstar, { key: 'Enter', code: 'Enter' });
    });
    await waitFor(() => expect(text()).toContain('$24,000'));
    await act(async () => fireEvent.keyDown(northstar, { key: 'Enter', code: 'Enter' }));
    await waitFor(() => expect(text()).not.toContain('$24,000'));
    expect(northstar.className.includes('tw-cursor-grab')).toBe(!extra.allowDrag);
  });

  test('[ShadKanban-PROP-005] density compact tightens cards; showCount off drops the counts', async () => {
    render({ properties: deals({ density: binding('compact'), showCount: binding('{{false}}') }) });

    await waitFor(() => expect(card('Northstar')).toHaveClass('tw-p-2.5'));
    expect(columns()[0].querySelector('.tw-tabular-nums')).toBeNull();
  });

  // A folded column was a 44px sliver of vertical text, read as broken in reviews.
  test('[ShadKanban-PROP-006] collapsedColumns folds a column into a titled lane; a click opens it and collapsedColumns follows', async () => {
    render({ properties: deals({ collapsedColumns: binding("{{['won']}}") }) });

    const lane = await waitFor(() => {
      const el = document.querySelector('[data-collapsed="true"]');
      expect(el).toBeTruthy();
      return el;
    });
    expect(lane.innerHTML).not.toContain('vertical-rl');
    expect(lane).toHaveTextContent('Won');
    expect(lane).toHaveTextContent('Show cards');
    expect(parseInt(lane.style.width, 10)).toBeGreaterThanOrEqual(140);
    await waitFor(() => expect(exposed().collapsedColumns).toEqual(['won']));
    fireEvent.click(lane);
    await waitFor(() => expect(exposed().collapsedColumns).toEqual([]));
    fireEvent.click(screen.getByRole('button', { name: 'Collapse New' }));
    await waitFor(() => expect(exposed().collapsedColumns).toEqual(['new']));
  });

  test('[ShadKanban-PROP-007] collapsibleColumns off removes the fold buttons', async () => {
    render({ properties: deals({ collapsibleColumns: binding('{{false}}') }) });

    await waitFor(() => expect(titles()).toEqual(['New', 'Won']));
    expect(screen.queryByRole('button', { name: /^Collapse/ })).toBeNull();
  });

  test('[ShadKanban-PROP-008] columnWidth is a preferred width that grows to fill the board', async () => {
    render({ properties: deals({ columnWidth: binding('{{250}}') }) });

    await waitFor(() => expect(columns()[0].style.width).toBe('250px'));
    // Four 250px stages left a 165px empty strip at the right of a full-width board.
    expect(columns()[0].style.flex.startsWith('1 1')).toBe(true);
  });

  // A seventh stage was cut off at the right of a full-width board, and three stages in a 620px half page cut the third.
  test('[ShadKanban-DEF-002] columns narrow to share the board (down to 140px) before it scrolls', async () => {
    const one = "{{[{ id: 1, title: 'One', status: 'a' }]}}";
    render({ properties: { data: binding(one), columns: binding("{{['a', 'b', 'c', 'd', 'e', 'f', 'g']}}") } });
    await waitFor(() => expect(columns()).toHaveLength(7));
    // jsdom's board here is 600px wide: seven stages go to the 140px floor, three share it (16px gaps).
    expect(columns()[0].style.minWidth).toBe('140px');

    render({ properties: { data: binding(one), columns: binding("{{['a', 'b', 'c']}}") } });
    await waitFor(() => expect(columns()[0].style.minWidth).toBe(`${Math.floor((600 - 32) / 3)}px`));
    // Wider boards: 200px, or 160px from six stages.
    expect(columnMinimum(3, 620)).toBe(Math.floor((620 - 32) / 3));
    expect([columnMinimum(3, 1200), columnMinimum(3, 300), columnMinimum(7, 0)]).toEqual([200, 140, 160]);
  });

  test('[ShadKanban-PROP-009] allowAdd shows Add card per column, firing onAddCardClick with addCardColumn set', async () => {
    render({ properties: deals({ allowAdd: binding('{{true}}') }) });
    widget.setEvents(setVariableOn(ID, 'onAddCardClick', { value: '{{components.board1.addCardColumn}}' }));

    await waitFor(() => expect(screen.getAllByText('Add card')).toHaveLength(2));
    fireEvent.click(screen.getAllByText('Add card')[1]);
    await waitFor(() => expect(widget.variables().seen).toBe('won'));
  });

  test('[ShadKanban-PROP-010] allowDelete removes a card from its button, firing onCardRemoved and onUpdate', async () => {
    render({ properties: deals({ allowDelete: binding('{{true}}') }) });
    widget.setEvents([
      ...setVariableOn(ID, 'onCardRemoved', { value: '{{components.board1.lastRemovedCard.name}}' }),
      ...countInvocationsOn(ID, 'onUpdate'),
    ]);

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Delete card' })).toHaveLength(2));
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete card' })[0]);
    await waitFor(() => expect(widget.variables().seen).toBe('Northstar'));
    expect(widget.variables().calls).toBe(1);
    expect(screen.queryByText('Northstar')).toBeNull();
    expect(exposed().updatedCardData.map((c) => c.ref)).toEqual(['D2']);
  });

  // The card's content is positioned (it anchors the clamp fade), so a delete button painted before it without a
  // z-index sat under the title: a real mouse click selected the card instead. jsdom does not hit-test, so check
  // the stacking the browser uses: the button carries a z-index or comes after the content.
  test('[ShadKanban-PROP-016] the delete button paints above the card content, so a click deletes and selects nothing', async () => {
    render({ properties: deals({ allowDelete: binding('{{true}}') }) });
    widget.setEvents([
      ...setVariableOn(ID, 'onCardRemoved', { value: '{{components.board1.lastRemovedCard.name}}' }),
      ...countInvocationsOn(ID, 'onCardSelected'),
    ]);

    const button = (await screen.findAllByRole('button', { name: 'Delete card' }))[0];
    const content = card('Northstar').querySelector(':scope > .tw-relative');
    const stacked =
      /(^|\s)tw-z-/.test(button.className) ||
      Boolean(button.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_PRECEDING);
    expect(stacked).toBe(true);
    fireEvent.click(button);
    await waitFor(() => expect(widget.variables().seen).toBe('Northstar'));
    expect(widget.variables().calls).toBeUndefined();
    expect(exposed().lastSelectedCard ?? {}).toEqual({});
  });

  test('[ShadKanban-PROP-011] emptyText fills a column with no cards', async () => {
    render({ properties: deals({ data: binding('{{[]}}'), emptyText: binding('Nothing here') }) });

    await waitFor(() => expect(screen.getAllByText('Nothing here')).toHaveLength(2));
  });

  test('[ShadKanban-PROP-012] collapsedHeight clamps a taller card behind Show more', async () => {
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 333 });
    try {
      render({ properties: deals({ collapsedHeight: binding('{{40}}') }) });
      const more = await screen.findAllByRole('button', { name: 'Show more' });
      expect(more[0]).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(more[0]);
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
      );
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height);
    }
  });

  test('[ShadKanban-ACT-001] addCard adds to a column, firing onCardAdded and onUpdate with lastAddedCard set', async () => {
    render({ properties: deals() });
    widget.setEvents([
      ...setVariableOn(ID, 'onCardAdded', { value: '{{components.board1.lastAddedCard.name}}' }),
      ...countInvocationsOn(ID, 'onUpdate'),
    ]);

    await widget.act('addCard', { name: 'Fresh lead' }, 'won');
    await waitFor(() => expect(widget.variables().seen).toBe('Fresh lead'));
    expect(widget.variables().calls).toBe(1);
    expect(columns()[1]).toHaveTextContent('Fresh lead');
    expect(exposed().lastAddedCard).toMatchObject({ stage: 'won' });
    expect(exposed().updatedCardData).toHaveLength(3);
  });

  test('[ShadKanban-ACT-002] updateCardData changes a card (moving it when its status changes), firing onCardUpdated', async () => {
    render({ properties: deals() });
    widget.setEvents(setVariableOn(ID, 'onCardUpdated', { value: '{{components.board1.lastUpdatedCard.name}}' }));

    await widget.act('updateCardData', 'D1', { name: 'Northstar renewed', stage: 'won' });
    await waitFor(() => expect(widget.variables().seen).toBe('Northstar renewed'));
    expect(columns()[1]).toHaveTextContent('Northstar renewed');
    expect(columns()[0]).toHaveTextContent('No cards');
  });

  test('[ShadKanban-ACT-003] moveCard moves a card, firing onCardMoved with lastCardMovement set', async () => {
    render({ properties: deals() });
    widget.setEvents(setVariableOn(ID, 'onCardMoved', { value: '{{components.board1.lastCardMovement.to}}' }));

    await widget.act('moveCard', 'D2', 'new');
    await waitFor(() => expect(widget.variables().seen).toBe('new'));
    expect(exposed().lastCardMovement).toMatchObject({ cardId: 'D2', from: 'won', to: 'new', toIndex: 1 });
    expect(columns()[0]).toHaveTextContent('Cedar');
  });

  test("[ShadKanban-ACT-005] onCardMoved reads the native Kanban's cardDetails and destinationColumnId", async () => {
    render({ properties: deals() });
    widget.setEvents(
      setVariableOn(ID, 'onCardMoved', {
        value:
          "{{components.board1.lastCardMovement.cardDetails.name + ':' + components.board1.lastCardMovement.destinationColumnId}}",
      })
    );

    await widget.act('moveCard', 'D2', 'new');
    await waitFor(() => expect(widget.variables().seen).toBe('Cedar:new'));
  });

  test('[ShadKanban-ACT-004] deleteCard removes a card by id; an unknown id changes nothing', async () => {
    render({ properties: deals() });
    widget.setEvents(countInvocationsOn(ID, 'onCardRemoved'));

    await widget.act('deleteCard', 'nope');
    await widget.act('deleteCard', 'D2');
    await waitFor(() => expect(exposed().lastRemovedCard).toMatchObject({ ref: 'D2' }));
    expect(widget.variables().calls).toBe(1);
    expect(screen.queryByText('Cedar')).toBeNull();
  });

  // A refetch after a move swapped the board for a loading look, unmounting the drag context mid-drag.
  test('[ShadKanban-DEF-003] keeps a board with cards on screen under a spinner while it reloads', async () => {
    render({ properties: deals({ loadingState: binding('{{true}}') }) });

    await waitFor(() => expect(columns()).toHaveLength(2));
    expect(text()).toContain('Northstar');
    expect(document.querySelector('[aria-busy="true"] [role=status]')).toBeTruthy();
    expect(card('Northstar')).toHaveAttribute('aria-disabled', 'true');

    render({ properties: deals({ data: binding('{{[]}}'), loadingState: binding('{{true}}') }) });
    await waitFor(() => expect(columns()).toHaveLength(0));
    expect(document.querySelector('[role=status]')).toBeTruthy();
  });

  test('[ShadKanban-DEF-004] draws 100 cards a column, then 100 more per press; a list bound as a field name is ignored', async () => {
    const many = "{{Array.from({ length: 10000 }, (_, i) => ({ id: i, title: 'Card ' + i, status: 'todo' }))}}";
    render({ properties: { data: binding(many), columns: binding("{{['todo']}}"), titleField: binding(many) } });

    await waitFor(() => expect(text()).toContain('Card 99'));
    expect(text()).not.toContain('Card 100');
    fireEvent.click(screen.getByText('Show 100 more of 9900'));
    await waitFor(() => expect(text()).toContain('Card 199'));
  });

  // A dynamic-height board of 40 loans stood 2,274px tall (2026-10-13): it grows only up to its drawn height.
  test('[ShadKanban-DEF-005] with dynamic height a column stops at the drawn height and scrolls', async () => {
    render({
      properties: {
        data: binding("{{Array.from({ length: 40 }, (_, i) => ({ id: i, title: 'Laptop ' + i, status: 'out' }))}}"),
        columns: binding("{{[{ id: 'out', title: 'Checked out' }]}}"),
      },
    });

    // RenderWidget draws the widget 4px shorter than its 500px box.
    await waitFor(() => expect(columns()[0].style.maxHeight).toBe('496px'));
    const list = columns()[0].querySelector('.tw-overflow-y-auto');
    expect(list).toBeTruthy();
    // The selected card's ring draws outside it: the scrolling list pads every side, so no card's ring is clipped.
    expect(list).toHaveClass('-tw-m-1', 'tw-p-1');
  });

  describe('custom card content', () => {
    beforeEach(() => {
      const host = document.createElement('div');
      host.className = 'canvas-content';
      host.innerHTML = '<div class="tj-canvas-area real-canvas"></div>';
      document.body.appendChild(host);
    });
    afterEach(() => document.querySelectorAll('.canvas-content').forEach((n) => n.remove()));
    const custom = (data, extra = {}) => ({
      cardLayout: binding('custom'),
      cardHeight: binding('{{60}}'),
      columns: binding("{{['todo', 'done']}}"),
      data: binding(data),
      ...extra,
    });
    const ROWS = "{{[{ id: 1, title: 'Alpha task', status: 'todo' }, { id: 2, title: 'Beta task', status: 'done' }]}}";
    const kids = (more = {}) => ({ cardText: cardChild('cardText', '{{cardData.title}}'), ...more });

    test('[ShadKanban-PROP-013] cardLayout custom draws the card components per card at cardHeight, from data that arrives late', async () => {
      render({ properties: custom('{{[]}}'), extraComponents: kids() });
      await waitFor(() => expect(columns()).toHaveLength(2));

      widget.setComponentProperty(ID, 'data', ROWS, 'properties');
      await waitFor(() => expect(text()).toContain('Beta task'));
      expect(text()).toContain('Alpha task');
      expect(document.querySelectorAll('[data-card-canvas]')).toHaveLength(2);
      await widget.act('updateCardData', 2, { title: 'Renamed task' });
      await waitFor(() => expect(text()).toContain('Renamed task'));
      widget.setComponentProperty(ID, 'cardLayout', 'fields', 'properties');
      widget.setComponentProperty(ID, 'cardLayout', 'custom', 'properties');
      await waitFor(() => expect(text()).toContain('Alpha task'));
    });

    // Every card shared one exposed isVisible per child, written by whichever card published last.
    test('[ShadKanban-PROP-014] a card component whose visibility reads cardData shows only on the cards that ask for it', async () => {
      const data =
        "{{[{ id: 1, title: 'Open deal', status: 'todo', open: true }, { id: 2, title: 'Shut deal', status: 'todo', open: false }, { id: 3, title: 'Second open deal', status: 'todo', open: true }]}}";
      render({
        properties: custom(data),
        extraComponents: kids({ cardMore: cardChild('cardMore', 'Deal notes', '{{cardData.open}}') }),
      });

      await waitFor(() => expect(document.querySelectorAll('[data-card-canvas]')).toHaveLength(3));
      const hidden = (el, stop) => {
        for (let n = el; n && n !== stop; n = n.parentElement) if (n.style?.display === 'none') return true;
        return false;
      };
      await waitFor(() =>
        expect(
          [...document.querySelectorAll('[data-card-canvas]')].map((c) => {
            const label = [...c.querySelectorAll('*')].find(
              (n) => n.textContent === 'Deal notes' && !n.children.length
            );
            return !!label && !hidden(label, c);
          })
        ).toEqual([true, false, true])
      );
    });

    // The card fits its components as a list row does (the reflow writes each card's height); a card with part of it
    // hidden (a deal's notes on a closed deal) fits what is left, below cardHeight, rather than keeping an empty band.
    test('[ShadKanban-PROP-015] with dynamic height in an app each custom card fits its components, each card on its own', async () => {
      const data =
        "{{[{ id: 1, title: 'Open deal', status: 'todo', open: true }, { id: 2, title: 'Shut deal', status: 'todo', open: false }]}}";
      const notes = cardChild('cardMore', 'Deal notes', '{{cardData.open}}');
      notes.layouts = { desktop: { top: 60, left: 0, width: 20, height: 80 } };
      const title = cardChild('cardText', '{{cardData.title}}');
      title.layouts = { desktop: { top: 0, left: 0, width: 20, height: 50 } };
      render({ properties: custom(data), extraComponents: { cardText: title, cardMore: notes } });

      const heights = () => [...document.querySelectorAll('[data-card-canvas]')].map((c) => c.style.height);
      // Open: the notes end at 140px, plus 8px. Shut: the notes are left out, so the title's 50px plus 8px.
      await waitFor(() => expect(heights()).toEqual(['148px', '58px']));
      act(() => useStore.getState().setTemporaryLayouts({ [`${ID}-1`]: { height: 210 } }));
      await waitFor(() => expect(heights()).toEqual(['148px', '210px']));
    });
  });

  test('[ShadKanban-DEF-006] the board model survives 3000 random moves, adds, updates and deletes', () => {
    const keysOf = (cols) => cols.flatMap((c) => c.cards.map((x) => x.__key));
    let seed = 7;
    const rand = (n) => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed % n;
    };
    const statuses = ['todo', 'doing', 'done', 'gone'];
    const junk = [undefined, null, '', 'nope', 1e9, {}, [], -1];
    const rows = Array.from({ length: 40 }, (_, i) => ({ id: i % 13 === 0 ? '' : i % 7, status: statuses[i % 3] }));
    let cols = boardColumns(rows, ['todo', 'doing', 'done'], 'status', 'id');
    let count = boardCards(cols).length;
    for (let step = 0; step < 3000; step += 1) {
      const keys = keysOf(cols);
      const anyKey = () => (rand(10) === 0 ? junk[rand(junk.length)] : keys[rand(keys.length)]);
      const anyColumn = () => (rand(10) === 0 ? junk[rand(junk.length)] : statuses[rand(statuses.length)]);
      const op = rand(4);
      if (op === 0)
        cols = moveCard(cols, anyKey(), anyColumn(), rand(3) === 0 ? null : anyKey(), 'status', 'id').columns;
      else if (op === 1) {
        cols = addCard(
          cols,
          rand(4) ? { id: rand(5), status: anyColumn() } : junk[rand(junk.length)],
          undefined,
          'status',
          'id'
        ).columns;
        count += 1;
      } else if (op === 2) {
        cols = updateCard(
          cols,
          anyKey(),
          rand(3) ? { status: anyColumn(), title: 'x' } : junk[rand(junk.length)],
          'status',
          'id'
        ).columns;
      } else {
        const result = deleteCard(cols, anyKey());
        if (result.card) count -= 1;
        cols = result.columns;
      }
      expect(new Set(keysOf(cols)).size).toBe(keysOf(cols).length);
      expect(boardCards(cols)).toHaveLength(count);
    }
  });

  test('[ShadKanban-DEF-007] a drop lands on a folded column under the pointer, else on the card under it, else the nearest', () => {
    const rect = (left, top, width, height) => ({
      left,
      top,
      width,
      height,
      right: left + width,
      bottom: top + height,
    });
    const container = (id, data) => ({ id, data: { current: data } });
    const folded = kanbanCollision({
      active: { id: 'c9' },
      collisionRect: rect(250, 0, 190, 80),
      droppableRects: new Map([
        ['col-folded', rect(300, 0, 44, 600)],
        ['drop-c1', rect(100, 0, 190, 80)],
      ]),
      droppableContainers: [
        container('col-folded', { type: 'column', columnId: 'folded' }),
        container('drop-c1', { type: 'card', key: 'c1', columnId: 'open' }),
      ],
      pointerCoordinates: { x: 320, y: 300 },
    });
    expect(folded[0].id).toBe('col-folded');
    const args = {
      active: { id: 'c9' },
      collisionRect: rect(110, 20, 190, 80),
      droppableRects: new Map([
        ['col-open', rect(100, 0, 200, 600)],
        ['drop-c1', rect(105, 10, 190, 80)],
      ]),
      droppableContainers: [
        container('col-open', { type: 'column', columnId: 'open' }),
        container('drop-c1', { type: 'card', key: 'c1', columnId: 'open' }),
      ],
    };
    expect(kanbanCollision({ ...args, pointerCoordinates: { x: 150, y: 40 } })[0].id).toBe('drop-c1');
    expect(kanbanCollision({ ...args, pointerCoordinates: { x: 2000, y: 2000 } }).length).toBeGreaterThan(0);
    expect(kanbanCollision({ ...args, pointerCoordinates: null }).length).toBeGreaterThan(0);
  });

  test('[ShadKanban-STY-001] board, column, card and progress styles reach the board', async () => {
    render({
      properties: deals({ progressField: binding('pct') }),
      styles: {
        accentColor: binding('#4f46e5'),
        columnTitleColor: binding('#1e1b4b'),
        columnCountBackgroundColor: binding('#e0e7ff'),
        columnCountTextColor: binding('#3730a3'),
        cardTitleColor: binding('#111827'),
        cardTextColor: binding('#6b7280'),
        columnGap: binding('{{24}}'),
        columnBackgroundColor: binding('#f5f5f4'),
        columnBorderColor: binding('#d6d3d1'),
        columnBorderRadius: binding('{{6}}'),
        cardBackgroundColor: binding('#ffffff'),
        cardBorderColor: binding('#e5e7eb'),
        cardBorderRadius: binding('{{4}}'),
        cardShadow: binding('none'),
        progressColor: binding('#16a34a'),
      },
    });

    await waitFor(() => expect(board().style.getPropertyValue('--sc-primary')).toBe('#4f46e5'));
    expect(
      ['--kb-col-title', '--kb-count-bg', '--kb-count-fg', '--kb-card-title', '--kb-card-text', '--kb-col-gap'].map(
        (v) => board().style.getPropertyValue(v)
      )
    ).toEqual(['#1e1b4b', '#e0e7ff', '#3730a3', '#111827', '#6b7280', '24px']);
    expect(columns()[0].style.background).toBe('rgb(245, 245, 244)');
    expect(columns()[0].style.borderRadius).toBe('6px');
    expect(columns()[0]).toHaveClass('tw-border');
    expect(columns()[0].style.getPropertyValue('--kb-column-border')).toBe('#d6d3d1');
    const northstar = card('Northstar');
    expect(northstar.style.background).toBe('rgb(255, 255, 255)');
    expect(northstar.style.borderColor).toBe('#e5e7eb');
    expect(northstar.style.borderRadius).toBe('4px');
    expect(northstar.style.boxShadow).toBe('none');
    expect(northstar.querySelector('[style*="--sc-primary"]').style.getPropertyValue('--sc-primary')).toBe('#16a34a');
  });
});
