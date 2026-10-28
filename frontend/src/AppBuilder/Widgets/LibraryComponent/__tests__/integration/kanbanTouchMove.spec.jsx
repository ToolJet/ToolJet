import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';
import { Kanban as ShadKanban } from '../../../../../../../packs/shadcn/src/components/Kanban';
import { Kanban as AntKanban } from '../../../../../../../packs/antd/src/components/Kanban';
import { Kanban as MuiKanban } from '../../../../../../../packs/mui/src/components/Kanban';

installBrowserStubs();

// Each pack's Kanban moves a card by touch (Codex 10-25 P25-01): phones fire no HTML drag from a touch, so a long press
// (400 ms, cancelled by moving more than 8px first, so a swipe still scrolls) picks the card up, the finger shows the
// drop target as a mouse drag does, and lifting it moves the card through the same move, exposed values and events.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const DATA = [
  { id: 1, title: 'Load 1', status: 'todo' },
  { id: 2, title: 'Load 2', status: 'todo' },
  { id: 3, title: 'Load 3', status: 'doing' },
];
const COLUMNS = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'Doing' },
];

let mounts = 0;
const mount = async (Kanban, dataName, props = {}, hostState = {}) => {
  loadLibraryModule.mockResolvedValue({ Kanban });
  mounts += 1;
  const exposed = {};
  const events = [];
  const host = { ...makeHost('Kanban'), ...hostState };
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey={`kanban-touch-${mounts}`}
      componentName="Kanban"
      componentProps={{ [dataName]: DATA, columns: COLUMNS, ...props }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={new Map()}
      host={host}
      dataCy="kanban-touch"
    />
  );
  const root = () => view.container.querySelector('[data-cy="kanban-touch"]')?.shadowRoot;
  await waitFor(() => expect(root()?.querySelectorAll('[data-kb-card]').length).toBe(DATA.length));
  const card = (title) => [...root().querySelectorAll('[data-kb-card]')].find((el) => el.textContent.includes(title));
  const column = (id) => root().querySelector(`[data-kb-col="${id}"]`);
  return { root, card, column, exposed, events };
};

// A touch pointer event (jsdom has no PointerEvent): composed, so it reaches the window from the shadow root.
const touch = (target, type, x, y) => {
  const e = new MouseEvent(type, { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y });
  Object.defineProperties(e, { pointerType: { value: 'touch' }, pointerId: { value: 7 }, isPrimary: { value: true } });
  act(() => {
    target.dispatchEvent(e);
  });
};
// What is under the finger: jsdom lays nothing out, so the test says.
let under = null;
beforeAll(() => {
  ShadowRoot.prototype.elementFromPoint = () => under;
  document.elementFromPoint = () => under;
});
beforeEach(() => {
  under = null;
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});
const wait = (ms) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

describe.each([
  ['shadcn', ShadKanban, 'data'],
  ['Ant Design', AntKanban, 'dataSource'],
  ['Material UI', MuiKanban, 'data'],
])('%s Kanban touch move', (_pack, Kanban, dataName) => {
  test('a long press picks a card up, the finger shows the target column and lifting it moves the card', async () => {
    jest.useRealTimers();
    const t = await mount(Kanban, dataName);
    jest.useFakeTimers();
    const card = t.card('Load 1');
    under = card;
    touch(card, 'pointerdown', 20, 20);
    wait(450);
    expect(t.card('Load 1').className).toMatch(/is-dragging/);
    under = t.column('doing');
    touch(card, 'pointermove', 220, 40);
    expect(t.column('doing').className).toMatch(/is-over/);
    expect(t.column('todo').className).not.toMatch(/is-over/);
    touch(card, 'pointerup', 220, 40);
    expect(t.exposed.lastCardMovement).toMatchObject({ cardId: 1, to: 'doing' });
    expect(t.events).toEqual(expect.arrayContaining(['onCardMoved', 'onUpdate']));
    expect(t.column('doing').textContent).toContain('Load 1');
    expect(t.column('doing').className).not.toMatch(/is-over/);
    expect(t.card('Load 1').className).not.toMatch(/is-dragging/);
  });

  test('moving before the long press is a scroll, not a pick up', async () => {
    jest.useRealTimers();
    const t = await mount(Kanban, dataName);
    jest.useFakeTimers();
    const card = t.card('Load 1');
    under = card;
    touch(card, 'pointerdown', 20, 20);
    touch(card, 'pointermove', 20, 40);
    wait(450);
    under = t.column('doing');
    touch(card, 'pointermove', 220, 40);
    touch(card, 'pointerup', 220, 40);
    expect(t.column('todo').textContent).toContain('Load 1');
    expect(t.events).not.toContain('onCardMoved');
    expect(t.card('Load 1').className).not.toMatch(/is-dragging/);
  });

  test.each([
    ['allowDrag off', { allowDrag: false }, {}],
    ['disabled', {}, { disabled: true }],
    ['loading', {}, { loading: true }],
  ])('%s: no touch move', async (_case, props, hostState) => {
    jest.useRealTimers();
    const t = await mount(Kanban, dataName, props, hostState);
    jest.useFakeTimers();
    const card = t.card('Load 1');
    under = card;
    touch(card, 'pointerdown', 20, 20);
    wait(450);
    under = t.column('doing');
    touch(card, 'pointermove', 220, 40);
    touch(card, 'pointerup', 220, 40);
    expect(t.column('todo').textContent).toContain('Load 1');
    expect(t.events).not.toContain('onCardMoved');
  });

  test('a mouse press is left to the HTML drag', async () => {
    jest.useRealTimers();
    const t = await mount(Kanban, dataName);
    jest.useFakeTimers();
    const card = t.card('Load 1');
    under = card;
    const e = new MouseEvent('pointerdown', { bubbles: true, composed: true });
    Object.defineProperties(e, {
      pointerType: { value: 'mouse' },
      pointerId: { value: 1 },
      isPrimary: { value: true },
    });
    act(() => {
      card.dispatchEvent(e);
    });
    wait(450);
    expect(t.card('Load 1').className).not.toMatch(/is-dragging/);
  });
});
