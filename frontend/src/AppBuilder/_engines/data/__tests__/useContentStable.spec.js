import { renderHook } from '@testing-library/react';
import { useContentStable } from '../useContentStable';

describe('useContentStable', () => {
  test('keeps the previous value while the content is equal', () => {
    const first = [{ id: 1 }];
    const { result, rerender } = renderHook(({ value }) => useContentStable(value), { initialProps: { value: first } });
    rerender({ value: [{ id: 1 }] });
    expect(result.current).toBe(first);
  });

  test('changes when the content does', () => {
    const { result, rerender } = renderHook(({ value }) => useContentStable(value), { initialProps: { value: [1] } });
    const next = [1, 2];
    rerender({ value: next });
    expect(result.current).toBe(next);
  });
});
