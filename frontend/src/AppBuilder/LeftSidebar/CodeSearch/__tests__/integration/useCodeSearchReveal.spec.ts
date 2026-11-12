/**
 * The contract every openable place (popover, tab, list item) signs with code search: open the item
 * when asked, and consume the request only if this instance owns it.
 */
import { renderHook, act } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { useCodeSearchReveal } from '../../useCodeSearchReveal';

const state = () => useStore.getState();

describe('useCodeSearchReveal', () => {
  test('opens and consumes a request for an item this instance owns', () => {
    const open = jest.fn((itemId) => itemId === 'ev1');
    renderHook(() => useCodeSearchReveal('event', 'button1', open));

    act(() => state().requestCodeSearchReveal({ kind: 'event', ownerId: 'button1', itemId: 'ev1' }));

    expect(open).toHaveBeenCalledWith('ev1');
    expect(state().codeSearch.revealRequest).toBeNull();
  });

  test('ignores requests for another kind or another owner', () => {
    const open = jest.fn(() => true);
    renderHook(() => useCodeSearchReveal('event', 'button1', open));

    act(() => state().requestCodeSearchReveal({ kind: 'listItem', ownerId: 'button1', itemId: 'ev1' }));
    act(() => state().requestCodeSearchReveal({ kind: 'event', ownerId: 'table1', itemId: 'ev1' }));

    expect(open).not.toHaveBeenCalled();
    expect(state().codeSearch.revealRequest).toMatchObject({ ownerId: 'table1' });
  });

  test('with several instances for one owner, only the one holding the item consumes it', () => {
    const componentEvents = jest.fn((itemId) => itemId === 'ev-component');
    const columnEvents = jest.fn((itemId) => itemId === 'ev-column');
    renderHook(() => useCodeSearchReveal('event', 'table1', componentEvents));
    renderHook(() => useCodeSearchReveal('event', 'table1', columnEvents));

    act(() => state().requestCodeSearchReveal({ kind: 'event', ownerId: 'table1', itemId: 'ev-column' }));

    expect(columnEvents).toHaveReturnedWith(true);
    expect(componentEvents).not.toHaveReturnedWith(true);
    expect(state().codeSearch.revealRequest).toBeNull();
  });

  test('a request that arrives before its item is loaded is opened once the item shows up', () => {
    let items: string[] = [];
    const open = jest.fn((itemId) => items.includes(itemId));
    const { rerender } = renderHook(({ list }) => useCodeSearchReveal('listItem', 'table1', open, [list]), {
      initialProps: { list: items },
    });

    act(() => state().requestCodeSearchReveal({ kind: 'listItem', ownerId: 'table1', itemId: 'col-1' }));
    expect(state().codeSearch.revealRequest).not.toBeNull();

    items = ['col-1'];
    rerender({ list: items });

    expect(state().codeSearch.revealRequest).toBeNull();
  });

  test('consuming a stale request leaves a newer one alone', () => {
    act(() => state().requestCodeSearchReveal({ kind: 'event', ownerId: 'a', itemId: '1' }));
    const stale = state().codeSearch.revealRequest.nonce;
    act(() => state().requestCodeSearchReveal({ kind: 'event', ownerId: 'b', itemId: '2' }));

    act(() => state().consumeCodeSearchReveal(stale));

    expect(state().codeSearch.revealRequest).toMatchObject({ ownerId: 'b' });
  });
});
