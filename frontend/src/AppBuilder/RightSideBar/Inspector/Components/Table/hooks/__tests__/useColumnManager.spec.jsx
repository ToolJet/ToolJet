import { renderHook, act } from '@testing-library/react';
import { useColumnManager } from '../useColumnManager';

describe('useColumnManager - setAllColumnsEditable', () => {
  const buildComponent = (columns) => ({
    component: {
      name: 'table1',
      definition: {
        properties: {
          columns: { value: columns },
        },
      },
    },
  });

  test('excludes image and button columns when "make all columns editable" is enabled', () => {
    const columns = [
      { name: 'name', columnType: 'string', isEditable: false },
      { name: 'photo', columnType: 'image', isEditable: false },
      { name: 'actions', columnType: 'button', isEditable: false },
    ];
    const paramUpdated = jest.fn();
    const component = buildComponent(columns);

    const { result } = renderHook(() => useColumnManager({ component, paramUpdated, currentState: {} }));

    act(() => {
      result.current.setAllColumnsEditable(true);
    });

    const updatedColumns = paramUpdated.mock.calls[0][2];
    const byType = (type) => updatedColumns.find((c) => c.columnType === type);

    expect(byType('string').isEditable).toBe(true);
    expect(byType('image').isEditable).toBe('{{false}}');
    expect(byType('button').isEditable).toBe('{{false}}');
  });
});
