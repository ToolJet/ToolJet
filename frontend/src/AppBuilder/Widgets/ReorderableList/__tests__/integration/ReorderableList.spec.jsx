/**
 * ReorderableList's approved Engineering contract.
 *
 * Contract: frontend/ee/test/app-builder/widgets/ReorderableList/TESTING.md
 * Drag seam (D-02): react-beautiful-dnd's keyboard sensor on the real drag handle under RenderWidget.
 */
import React from 'react';
import { act, fireEvent, renderHook, waitFor, within } from '@testing-library/react';
import { reorderableListConfig } from '@tooljet/widget-definitions';
import { componentDefinition } from '@/test/app-builder';
import {
  binding,
  countInvocationsOn,
  createWidgetHarness,
  setVariableOn,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';
import { useOptionsManager } from '@/AppBuilder/RightSideBar/Inspector/Components/PopoverMenu/hooks/useOptionsManager';

const ID = 'rl1';
const NAME = 'reorderablelist1';

const SPACE = 32;
const ESCAPE = 27;
const UP = 38;
const DOWN = 40;

const widget = createWidgetHarness({
  componentType: 'ReorderableList',
  handle: NAME,
  id: ID,
  widgetHeight: 200,
  widgetWidth: 300,
  preload: ['Button'],
});

const schemaOf = (items) => binding(`{{${JSON.stringify(items)}}}`);
const dynamic = (items) => ({ advanced: binding('{{true}}'), schema: schemaOf(items) });

const wrapperOf = (name = NAME) => document.querySelector(`.canvas-component._tooljet-${name}`);
const list = (name = NAME) => within(wrapperOf(name)).getByRole('list', { hidden: true });
const cards = (name = NAME) => within(list(name)).queryAllByRole('listitem', { hidden: true });
const cardTexts = (name = NAME) => cards(name).map((card) => card.textContent);
const card = (text, name = NAME) => cards(name).find((item) => item.textContent === text);

const frame = () => act(() => new Promise((resolve) => requestAnimationFrame(resolve)));

/** Lifts the card with the keyboard, presses each move key, then drops (or cancels). */
async function keyboardDrag(cardElement, moves, { cancel = false, beforeDrop } = {}) {
  const contextId = cardElement.getAttribute('data-rbd-draggable-context-id');
  const draggableId = cardElement.getAttribute('data-rbd-draggable-id');
  // The lifted card re-mounts inside the body portal, so the node is re-queried after every key.
  const handle = () =>
    document.querySelector(
      `[data-rbd-draggable-context-id="${contextId}"][data-rbd-draggable-id="${CSS.escape(draggableId)}"]`
    ) ?? cardElement;
  handle().focus();
  fireEvent.keyDown(handle(), { keyCode: SPACE });
  await frame();
  for (const key of moves) {
    fireEvent.keyDown(handle(), { keyCode: key });
    await frame();
  }
  beforeDrop?.(handle());
  fireEvent.keyDown(handle(), { keyCode: cancel ? ESCAPE : SPACE });
  await frame();
}

const down = (count) => Array.from({ length: count }, () => DOWN);

async function setProperty(name, value, paramType = 'properties') {
  await widget.session.store.act(() => widget.setComponentProperty(ID, name, value, paramType));
}

const onChangeCounter = (sourceId, key, id) => ({
  ...countInvocationsOn(sourceId, 'onChange', { key })[0],
  id,
  name: id,
});

const exposedKeys = (options) => options.map((item) => Object.keys(item).sort());

describe('ReorderableList', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('[ReorderableList-DEF-001] default mount renders Card1-Card3, exposes initial state, and registers every exposed variable', async () => {
    // Break this catches: a dropped exposed variable at mount, or registration missing a documented runtime variable.
    widget.render();

    await waitFor(() => expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']));
    await waitFor(() =>
      expect(widget.exposed()).toMatchObject({
        options: [
          { label: 'Card1', value: '1', format: 'plain' },
          { label: 'Card2', value: '2', format: 'plain' },
          { label: 'Card3', value: '3', format: 'plain' },
        ],
        values: ['1', '2', '3'],
        isVisible: true,
        isDisabled: false,
        isLoading: false,
      })
    );
    expect(exposedKeys(widget.exposed().options)).toEqual([
      ['format', 'label', 'value'],
      ['format', 'label', 'value'],
      ['format', 'label', 'value'],
    ]);
    expect(Object.keys(reorderableListConfig.exposedVariables).sort()).toEqual([
      'isDisabled',
      'isLoading',
      'isVisible',
      'options',
      'values',
    ]);
    expect(reorderableListConfig.exposedVariables.values).toEqual([]);
  });

  test('[ReorderableList-OPT-001] static options with inspector extras expose only label, value and format', async () => {
    // Break this catches: spreading saved inspector keys into exposed options, or losing the plain default.
    widget.render({
      properties: {
        options: {
          value: [
            {
              label: 'Alpha',
              value: 'a',
              format: 'plain',
              icon: { value: 'IconStar' },
              description: 'd',
              visible: { value: '{{true}}' },
              disable: { value: '{{false}}' },
            },
            { label: 'Beta', value: 'b' },
          ],
        },
      },
    });

    await waitFor(() => expect(cardTexts()).toEqual(['Alpha', 'Beta']));
    await waitFor(() =>
      expect(widget.exposed().options).toEqual([
        { label: 'Alpha', value: 'a', format: 'plain' },
        { label: 'Beta', value: 'b', format: 'plain' },
      ])
    );
    expect(widget.exposed().values).toEqual(['a', 'b']);
  });

  test('[ReorderableList-OPT-002] the dynamic options toggle switches the source between schema and static options', async () => {
    // Break this catches: reading only one source or not re-syncing when `advanced` flips.
    widget.render({ properties: dynamic([{ label: 'S1', value: 's1' }]) });

    await waitFor(() => expect(cardTexts()).toEqual(['S1']));
    await waitFor(() => expect(widget.exposed().values).toEqual(['s1']));

    await setProperty('advanced', '{{false}}');
    await waitFor(() => expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']));
    expect(widget.exposed().values).toEqual(['1', '2', '3']);
    expect(widget.exposed().options[0]).toEqual({ label: 'Card1', value: '1', format: 'plain' });

    await setProperty('advanced', '{{true}}');
    await waitFor(() => expect(cardTexts()).toEqual(['S1']));
    expect(widget.exposed().options).toEqual([{ label: 'S1', value: 's1', format: 'plain' }]);
  });

  test('[ReorderableList-OPT-003] empty or non-array data shows "No items" and exposes empty arrays', async () => {
    // Break this catches: crashing on a non-array schema or exposing the stale previous list.
    widget.render({ properties: dynamic([]) });

    expect(await within(list()).findByText('No items')).toBeInTheDocument();
    await waitFor(() => expect(widget.exposed().options).toEqual([]));
    expect(widget.exposed().values).toEqual([]);

    await setProperty('schema', '{{[{"label":"X","value":"x"}]}}');
    await waitFor(() => expect(cardTexts()).toEqual(['X']));
    await setProperty('schema', '{{"not a list"}}');
    expect(await within(list()).findByText('No items')).toBeInTheDocument();
    expect(widget.exposed().values).toEqual([]);

    await setProperty('advanced', '{{false}}');
    await waitFor(() => expect(cardTexts()).toHaveLength(3));
    await widget.session.store.act(() => widget.setComponentProperty(ID, 'options', [], 'properties'));
    expect(await within(list()).findByText('No items')).toBeInTheDocument();
    expect(widget.exposed().options).toEqual([]);
  });

  test('[ReorderableList-LBL-001] plain, markdown, html, object and unknown-format labels render', async () => {
    // Break this catches: a format branch rendering raw text, or an object label crashing render.
    widget.render({
      properties: dynamic([
        { label: '**plain**', value: 'p', format: 'plain' },
        { label: '**Bold**', value: 'm', format: 'markdown' },
        { label: '<em>Lean</em>', value: 'h', format: 'html' },
        { label: { a: 1 }, value: 'o' },
        { label: 'Odd', value: 'u', format: 'weird' },
      ]),
    });

    await waitFor(() => expect(cards()).toHaveLength(5));
    const [plain, markdown, html, object, unknown] = cards();
    expect(plain).toHaveTextContent('**plain**');
    expect(plain.querySelector('strong')).toBeNull();
    // react-markdown is stubbed repo-wide in Jest (jest.config.js), so this proves routing, not parsing.
    expect(markdown.querySelector('[data-testid="react-markdown"]')).toHaveTextContent('**Bold**');
    expect(html.querySelector('em')).toHaveTextContent('Lean');
    expect(object).toHaveTextContent('{"a":1}');
    expect(unknown).toHaveTextContent('Odd');
  });

  test('[ReorderableList-LBL-002] a numeric 0 label renders "0"', async () => {
    // Break this catches: a truthiness check treating label 0 as missing.
    widget.render({
      properties: dynamic([
        { label: 0, value: 'zero' },
        { label: 0, value: '' },
        { label: 'One', value: 'one' },
        { value: 0 },
      ]),
    });

    await waitFor(() => expect(cardTexts()).toEqual(['0', '0', 'One', '0']));
  });

  test('[ReorderableList-LBL-003] null, undefined and empty-string labels fall back to the value', async () => {
    // Break this catches: rendering a blank card when the label is absent or empty.
    widget.render({
      properties: dynamic([{ label: null, value: 'n' }, { value: 'u' }, { label: '', value: 'e' }]),
    });

    await waitFor(() => expect(cardTexts()).toEqual(['n', 'u', 'e']));
  });

  test('[ReorderableList-SEC-001] html labels are sanitized and markdown does not render raw html', async () => {
    // Break this catches: dropping DOMPurify or enabling raw html in markdown.
    widget.render({
      properties: dynamic([
        {
          label: '<img src="x" onerror="window.__rlXss=1"><script>window.__rlXss=2</script><b>safe</b>',
          value: 'h',
          format: 'html',
        },
        { label: 'md <img src="y" onerror="window.__rlXss=3">', value: 'm', format: 'markdown' },
      ]),
    });

    await waitFor(() => expect(cards()).toHaveLength(2));
    const [html, markdown] = cards();
    expect(html.querySelector('b')).toHaveTextContent('safe');
    expect(html.querySelector('script')).toBeNull();
    expect(html.querySelector('[onerror]')).toBeNull();
    expect(markdown.querySelector('[data-testid="react-markdown"]')).toBeInTheDocument();
    expect(markdown.querySelector('img')).toBeNull();
    expect(window.__rlXss).toBeUndefined();
  });

  test('[ReorderableList-ORD-001] keyboard drag reorders, updates options and values, and fires onChange once', async () => {
    // Break this catches: reordering the DOM without publishing, or firing onChange more than once per drop.
    widget.render({ events: countInvocationsOn(ID, 'onChange') });
    await waitFor(() => expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']));

    await keyboardDrag(card('Card1'), down(1));

    await waitFor(() => expect(widget.exposed().values).toEqual(['2', '1', '3']));
    expect(cardTexts()).toEqual(['Card2', 'Card1', 'Card3']);
    expect(widget.exposed().options).toEqual([
      { label: 'Card2', value: '2', format: 'plain' },
      { label: 'Card1', value: '1', format: 'plain' },
      { label: 'Card3', value: '3', format: 'plain' },
    ]);
    await waitFor(() => expect(widget.variables().calls).toBe(1));
  });

  test('[ReorderableList-ORD-002] a cancelled drag or a same-index drop changes nothing', async () => {
    // Break this catches: a missing destination/same-index guard publishing a no-op reorder.
    widget.render({ events: countInvocationsOn(ID, 'onChange') });
    await waitFor(() => expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']));

    await keyboardDrag(card('Card1'), down(1), { cancel: true });
    await keyboardDrag(card('Card2'), [DOWN, UP]);

    expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']);
    expect(widget.exposed().values).toEqual(['1', '2', '3']);
    expect(widget.variables().calls).toBeUndefined();
  });

  test('[ReorderableList-ORD-003] a disabled list cannot be reordered by property or setDisable', async () => {
    // Break this catches: isDragDisabled not wired to the effective disabled state.
    widget.render({ properties: { disabledState: binding('{{true}}') }, events: countInvocationsOn(ID, 'onChange') });
    await waitFor(() => expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']));

    await keyboardDrag(card('Card1'), down(1));
    expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']);

    await setProperty('disabledState', '{{false}}');
    await widget.act('setDisable', true);
    await keyboardDrag(card('Card1'), down(1));

    expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']);
    expect(widget.exposed().values).toEqual(['1', '2', '3']);
    expect(widget.variables().calls).toBeUndefined();
  });

  test('[ReorderableList-ID-001] falsy values keep distinct identity during drag', async () => {
    // Break this catches: deriving drag identity from `value || index`, so value 0 collides with index 1.
    widget.render({
      properties: dynamic([
        { label: 'One', value: 1 },
        { label: 'Zero', value: 0 },
        { label: 'Two', value: 2 },
      ]),
    });
    await waitFor(() => expect(cardTexts()).toEqual(['One', 'Zero', 'Two']));

    await keyboardDrag(card('One'), down(2));

    await waitFor(() => expect(cardTexts()).toEqual(['Zero', 'Two', 'One']));
    expect(widget.exposed().values).toEqual([0, 2, 1]);
  });

  test('[ReorderableList-ID-002] duplicate or missing values move as themselves and the drag identity never leaks', async () => {
    // Break this catches: keying cards by value (duplicates) or by index (a missing value colliding with value "3").
    widget.render({
      properties: dynamic([
        { label: 'A', value: 'x' },
        { label: 'B', value: 'x' },
        { label: 'C', value: '3' },
        { label: 'D' },
      ]),
    });
    await waitFor(() => expect(cardTexts()).toEqual(['A', 'B', 'C', 'D']));

    await keyboardDrag(card('A'), down(1));
    await waitFor(() => expect(cardTexts()).toEqual(['B', 'A', 'C', 'D']));

    await keyboardDrag(card('D'), [UP]);
    await waitFor(() => expect(cardTexts()).toEqual(['B', 'A', 'D', 'C']));
    expect(widget.exposed().options).toEqual([
      { label: 'B', value: 'x', format: 'plain' },
      { label: 'A', value: 'x', format: 'plain' },
      { label: 'D', value: undefined, format: 'plain' },
      { label: 'C', value: '3', format: 'plain' },
    ]);
    expect(exposedKeys(widget.exposed().options).every((keys) => keys.join() === 'format,label,value')).toBe(true);
    expect(widget.exposed().values).toEqual(['x', 'x', undefined, '3']);
  });

  test('[ReorderableList-BND-001] a genuinely changed schema re-syncs the list in its own order', async () => {
    // Break this catches: keeping the user's local order after the bound data really changed.
    widget.render({
      properties: dynamic([
        { label: 'A', value: 'a' },
        { label: 'B', value: 'b' },
      ]),
    });
    await waitFor(() => expect(cardTexts()).toEqual(['A', 'B']));
    await keyboardDrag(card('A'), down(1));
    await waitFor(() => expect(cardTexts()).toEqual(['B', 'A']));

    await setProperty('schema', '{{[{"label":"P","value":"p"},{"label":"A","value":"a"},{"label":"B","value":"b"}]}}');

    await waitFor(() => expect(cardTexts()).toEqual(['P', 'A', 'B']));
    expect(widget.exposed().values).toEqual(['p', 'a', 'b']);
  });

  test('[ReorderableList-BND-002] resetting bound data to identical content keeps the user order without onChange', async () => {
    // Break this catches: re-syncing on a new array reference with equal content, discarding the user's order.
    const items = '{{[{"label":"A","value":"a"},{"label":"B","value":"b"},{"label":"C","value":"c"}]}}';
    const { container } = widget.render({
      properties: { advanced: binding('{{true}}'), schema: binding('{{variables.items ?? []}}') },
      extraComponents: { btn1: componentDefinition('btn1', 'button1', 'Button', { text: binding('Reload') }) },
      also: [{ id: 'btn1', componentType: 'Button' }],
      events: [
        ...countInvocationsOn(ID, 'onChange'),
        ...setVariableOn('btn1', 'onClick', { key: 'items', value: items }),
      ],
    });
    const reload = () => widget.session.user.click(container.querySelector('button.jet-btn'));

    await reload();
    await waitFor(() => expect(cardTexts()).toEqual(['A', 'B', 'C']));
    await keyboardDrag(card('A'), down(1));
    await waitFor(() => expect(cardTexts()).toEqual(['B', 'A', 'C']));
    await waitFor(() => expect(widget.variables().calls).toBe(1));

    await reload();
    await waitFor(() => expect(widget.variables().items).toHaveLength(3));
    await frame();

    expect(cardTexts()).toEqual(['B', 'A', 'C']);
    expect(widget.exposed().values).toEqual(['b', 'a', 'c']);
    expect(widget.variables().calls).toBe(1);
  });

  test('[ReorderableList-EVT-001] onChange runs its action once per successful reorder', async () => {
    // Break this catches: an extra dispatch per drop or a missing dispatch on later drops.
    widget.render({ events: countInvocationsOn(ID, 'onChange') });
    await waitFor(() => expect(cardTexts()).toHaveLength(3));

    await keyboardDrag(card('Card1'), down(1));
    await waitFor(() => expect(widget.variables().calls).toBe(1));

    await keyboardDrag(card('Card3'), [UP]);
    await waitFor(() => expect(widget.exposed().values).toEqual(['2', '3', '1']));
    await waitFor(() => expect(widget.variables().calls).toBe(2));
  });

  test('[ReorderableList-EVT-002] data re-sync and state actions do not fire onChange', async () => {
    // Break this catches: routing a data re-sync or a CSA through the onChange event.
    widget.render({ events: countInvocationsOn(ID, 'onChange') });
    await waitFor(() => expect(cardTexts()).toHaveLength(3));

    await setProperty('advanced', '{{true}}');
    await waitFor(() => expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']));
    await setProperty('schema', '{{[{"label":"Z","value":"z"}]}}');
    await waitFor(() => expect(cardTexts()).toEqual(['Z']));
    await setProperty('advanced', '{{false}}');
    await waitFor(() => expect(cardTexts()).toHaveLength(3));
    await widget.act('setDisable', true);
    await widget.act('setLoading', true);
    await widget.act('setLoading', false);
    await widget.act('setVisibility', false);
    await widget.act('setVisibility', true);
    await frame();

    expect(widget.variables().calls).toBeUndefined();
  });

  test('[ReorderableList-STATE-001] visibility property and setVisibility hide and show the list', async () => {
    // Break this catches: ignoring the visibility property or the CSA not restoring display.
    widget.render({ properties: { visibility: binding('{{false}}') } });

    await waitFor(() => expect(widget.exposed().isVisible).toBe(false));
    expect(list()).not.toBeVisible();

    await widget.act('setVisibility', true);
    await waitFor(() => expect(list()).toBeVisible());
    expect(widget.exposed().isVisible).toBe(true);
  });

  test('[ReorderableList-STATE-002] loading shows the loader instead of cards', async () => {
    // Break this catches: rendering cards while loading or not restoring them afterwards.
    widget.render({ properties: { loadingState: binding('{{true}}') } });

    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
    expect(cards()).toHaveLength(0);

    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']));
    expect(widget.exposed().isLoading).toBe(false);

    await widget.act('setLoading', true);
    await waitFor(() => expect(cards()).toHaveLength(0));
    expect(widget.exposed().isLoading).toBe(true);
    await widget.act('setLoading', false);
    await waitFor(() => expect(cards()).toHaveLength(3));
  });

  test('[ReorderableList-STATE-003] a list mounted while loading becomes enabled when loading ends', async () => {
    // Break this catches: seeding isDisabled from loading at mount and never recomputing it.
    widget.render({ properties: { loadingState: binding('{{true}}') }, events: countInvocationsOn(ID, 'onChange') });
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));

    await setProperty('loadingState', '{{false}}');

    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));
    await waitFor(() => expect(wrapperOf()).not.toHaveClass('disabled'));
    await keyboardDrag(card('Card1'), down(1));
    await waitFor(() => expect(widget.exposed().values).toEqual(['2', '1', '3']));
  });

  test('[ReorderableList-STATE-003] setLoading(false) after a loading mount also re-enables; a disabled list stays disabled', async () => {
    // Break this catches: only the property path recomputing isDisabled, or loading-end clearing a real disable.
    widget.render({ properties: { loadingState: binding('{{true}}') } });
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
    await widget.act('setLoading', false);
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));

    widget.session.render(<></>);
    widget.render({ properties: { loadingState: binding('{{true}}'), disabledState: binding('{{true}}') } });
    await waitFor(() => expect(widget.exposed().isLoading).toBe(true));
    await setProperty('loadingState', '{{false}}');
    await waitFor(() => expect(widget.exposed().isLoading).toBe(false));
    expect(widget.exposed().isDisabled).toBe(true);
  });

  test('[ReorderableList-STATE-003] runtime loading does not change isDisabled', async () => {
    // Break this catches: a loading toggle overwriting the disable control in either direction.
    widget.render();
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));

    await widget.act('setLoading', true);
    await setProperty('loadingState', '{{true}}');
    expect(widget.exposed().isDisabled).toBe(false);
    await setProperty('loadingState', '{{false}}');
    await widget.act('setLoading', false);
    expect(widget.exposed().isDisabled).toBe(false);
  });

  test('[ReorderableList-STATE-004] disable property and setDisable survive unrelated re-resolution and yield to a changed property', async () => {
    // Break this catches: re-applying the property on any re-render, or the action never yielding.
    widget.render();
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));

    await widget.act('setDisable', true);
    expect(widget.exposed().isDisabled).toBe(true);
    await setProperty('tooltip', 'unrelated');
    await setProperty('textColor', 'rgb(1, 2, 3)', 'styles');
    await frame();
    expect(widget.exposed().isDisabled).toBe(true);

    await setProperty('disabledState', '{{true}}');
    await setProperty('disabledState', '{{false}}');
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(false));
  });

  test('[ReorderableList-STATE-005] disabled styling follows the effective disabled state', async () => {
    // Break this catches: the list's disabled class reading the property instead of the effective state.
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(list()).toHaveClass('is-disabled'));

    await widget.act('setDisable', false);
    await waitFor(() => expect(list()).not.toHaveClass('is-disabled'));
    expect(list()).not.toHaveAttribute('aria-disabled');

    widget.session.render(<></>);
    widget.render();
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(list()).not.toHaveClass('is-disabled');
    await widget.act('setDisable', true);
    await waitFor(() => expect(list()).toHaveClass('is-disabled'));
    expect(list()).toHaveAttribute('aria-disabled', 'true');
  });

  test('[ReorderableList-STYLE-001] text color applies to every card, also while dragging, and padding follows its style', async () => {
    // Break this catches: textColor dropped from the portaled drag card, or padding ignored.
    widget.render({ styles: { textColor: binding('rgb(1, 2, 3)'), padding: binding('none') } });
    await waitFor(() => expect(cards()).toHaveLength(3));

    cards().forEach((item) => expect(item.style.color).toBe('rgb(1, 2, 3)'));
    expect(wrapperOf().style.padding).toBe('0px');

    let draggedColor;
    await keyboardDrag(card('Card1'), down(1), {
      cancel: true,
      beforeDrop: (handle) => {
        draggedColor = handle.closest('[data-reorderable-list-portal]') ? handle.style.color : 'not portaled';
      },
    });
    expect(draggedColor).toBe('rgb(1, 2, 3)');

    await setProperty('padding', 'default', 'styles');
    await waitFor(() => expect(wrapperOf().style.padding).toBe('2px'));
  });

  test('[ReorderableList-A11Y-001] cards expose list item and drag-handle semantics', async () => {
    // Break this catches: overriding or dropping the drag handle's roledescription and instructions.
    widget.render();
    await waitFor(() => expect(cards()).toHaveLength(3));

    for (const item of cards()) {
      expect(item).toHaveAttribute('tabindex', '0');
      expect(item).toHaveAttribute('aria-roledescription', 'draggable item');
      const instructions = document.getElementById(item.getAttribute('aria-describedby'));
      expect(instructions).toHaveTextContent(/space bar/i);
    }
  });

  test('[ReorderableList-A11Y-002] a disabled list exposes aria-disabled and removes cards from the tab order', async () => {
    // Break this catches: a disabled list announced as interactive.
    widget.render({ properties: { disabledState: binding('{{true}}') } });
    await waitFor(() => expect(cards()).toHaveLength(3));

    expect(list()).toHaveAttribute('aria-disabled', 'true');
    for (const item of cards()) {
      expect(item).toHaveAttribute('aria-disabled', 'true');
      expect(item).not.toHaveAttribute('tabindex', '0');
    }

    await widget.act('setDisable', false);
    await waitFor(() => expect(list()).not.toHaveAttribute('aria-disabled'));
    for (const item of cards()) {
      expect(item).not.toHaveAttribute('aria-disabled');
      expect(item).toHaveAttribute('tabindex', '0');
    }
  });

  test('[ReorderableList-LIFE-001] unmount removes the drag portal and remount leaves exactly one', async () => {
    // Break this catches: a missing effect cleanup leaking a body-level portal per mount.
    const portals = () => document.querySelectorAll(`[data-reorderable-list-portal="${ID}"]`);
    widget.render();
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(portals()).toHaveLength(1);

    widget.session.render(<></>);
    expect(portals()).toHaveLength(0);

    widget.render();
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(portals()).toHaveLength(1);
  });

  test('[ReorderableList-ISO-001] two lists reorder independently', async () => {
    // Break this catches: a shared droppable id or portal moving a card between instances.
    widget.render({
      extraComponents: {
        rl2: componentDefinition(
          'rl2',
          'reorderablelist2',
          'ReorderableList',
          dynamic([
            { label: 'X', value: 'x' },
            { label: 'Y', value: 'y' },
          ])
        ),
      },
      also: [{ id: 'rl2', componentType: 'ReorderableList', widgetHeight: 200, widgetWidth: 300 }],
      events: [onChangeCounter(ID, 'a', 'evt-a'), onChangeCounter('rl2', 'b', 'evt-b')],
    });
    await waitFor(() => expect(cardTexts('reorderablelist2')).toEqual(['X', 'Y']));
    expect(cardTexts()).toEqual(['Card1', 'Card2', 'Card3']);

    await keyboardDrag(card('Card1'), down(1));

    await waitFor(() => expect(widget.exposed().values).toEqual(['2', '1', '3']));
    await waitFor(() => expect(widget.variables().a).toBe(1));
    expect(widget.exposed('rl2').values).toEqual(['x', 'y']);
    expect(cardTexts('reorderablelist2')).toEqual(['X', 'Y']);
    expect(cardTexts()).toEqual(['Card2', 'Card1', 'Card3']);
    expect(widget.variables().b).toBeUndefined();
  });

  test('[ReorderableList-INS-001] inspector "Add new option" picks a value no option uses', async () => {
    // Break this catches: checking only label uniqueness, so a relabelled option's value is reused.
    widget.render();
    const component = (options) => ({
      component: {
        component: 'ReorderableList',
        definition: { properties: { advanced: { value: '{{false}}' }, options: { value: options } } },
      },
    });
    const paramUpdated = jest.fn();
    const added = () => paramUpdated.mock.calls.at(-1)[2].at(-1);

    const collided = renderHook(() =>
      useOptionsManager(
        component([
          { label: 'Card2', value: '2', format: 'plain' },
          { label: 'Done', value: '3', format: 'plain' },
        ]),
        paramUpdated,
        'Card'
      )
    );
    await waitFor(() => expect(collided.result.current.options).toHaveLength(2));
    act(() => collided.result.current.handleAddOption());
    expect(added()).toMatchObject({ label: 'Card4', value: '4' });

    const sequential = renderHook(() =>
      useOptionsManager(
        component([
          { label: 'Card1', value: '1', format: 'plain' },
          { label: 'Card2', value: '2', format: 'plain' },
        ]),
        paramUpdated,
        'Card'
      )
    );
    await waitFor(() => expect(sequential.result.current.options).toHaveLength(2));
    act(() => sequential.result.current.handleAddOption());
    expect(added()).toMatchObject({ label: 'Card3', value: '3' });
  });
});
