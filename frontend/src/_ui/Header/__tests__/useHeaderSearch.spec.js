import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { act, renderHook } from '@testing-library/react';
import { useSearchStore } from '@/_stores/searchStore';
import { useHeaderSearch } from '../useHeaderSearch';

const wrapper = ({ children }) => <MemoryRouter>{children}</MemoryRouter>;
const debounced = () => useSearchStore.getState().debouncedSearchQuery;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useHeaderSearch', () => {
  it('hands the typed query to the page only once typing has paused', () => {
    const { result } = renderHook(() => useHeaderSearch(), { wrapper });
    act(() => result.current.onChange('abc'));
    act(() => jest.advanceTimersByTime(299));
    expect(debounced()).toBe('');
    act(() => jest.advanceTimersByTime(1));
    expect(debounced()).toBe('abc');
  });

  it('never hands over a query that was typed over before the pause', () => {
    const { result } = renderHook(() => useHeaderSearch(), { wrapper });
    act(() => result.current.onChange('a'));
    act(() => jest.advanceTimersByTime(200));
    act(() => result.current.onChange('ab'));
    act(() => jest.advanceTimersByTime(200));
    expect(debounced()).toBe('');
    act(() => jest.advanceTimersByTime(100));
    expect(debounced()).toBe('ab');
  });

  it('uses the page-configured delay', () => {
    useSearchStore.getState().setSearchConfig({ debounceMs: 50 });
    const { result } = renderHook(() => useHeaderSearch(), { wrapper });
    act(() => result.current.onChange('abc'));
    act(() => jest.advanceTimersByTime(50));
    expect(debounced()).toBe('abc');
  });

  it('follows the typed query at once when the page turns the delay off', () => {
    useSearchStore.getState().setSearchConfig({ debounceMs: 0 });
    const { result } = renderHook(() => useHeaderSearch(), { wrapper });
    act(() => result.current.onChange('abc'));
    expect(debounced()).toBe('abc');
  });

  it('applies a query typed again right after a clear', () => {
    const { result } = renderHook(() => useHeaderSearch(), { wrapper });
    act(() => result.current.onChange('abc'));
    act(() => jest.advanceTimersByTime(300));
    act(() => result.current.onClear());
    act(() => result.current.onChange('abc'));
    act(() => jest.advanceTimersByTime(300));
    expect(debounced()).toBe('abc');
  });
});
