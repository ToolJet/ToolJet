import { renderHook, act } from '@testing-library/react';
import { useButtonManager } from '../useButtonManager';

describe('useButtonManager - addButton defaults', () => {
  test('[Table-BUG-013] a new button defaults to a solid buttonType with a white icon color, matching its default label color', () => {
    const onColumnItemChange = jest.fn();
    const { result } = renderHook(() => useButtonManager({ column: { buttons: [] }, index: 0, onColumnItemChange }));

    act(() => {
      result.current.addButton();
    });

    const newButton = onColumnItemChange.mock.calls[0][2][0];
    expect(newButton.buttonType).toBe('solid');
    expect(newButton.buttonIconColor).toBe('#FFFFFF');
    expect(newButton.buttonLabelColor).toBe('#FFFFFF');
  });
});
