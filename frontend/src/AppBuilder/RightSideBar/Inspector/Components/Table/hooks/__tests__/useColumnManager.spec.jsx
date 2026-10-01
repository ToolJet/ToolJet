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

describe('useColumnManager - handlePropertyChange columnType=json', () => {
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

  test('[Table-COLTYPE-JSON-002] seeds jsonIndentation: true when a column is switched to columnType json', () => {
    const columns = [{ name: 'payload', columnType: 'string' }];
    const paramUpdated = jest.fn();
    const component = buildComponent(columns);

    const { result } = renderHook(() => useColumnManager({ component, paramUpdated, currentState: {} }));

    act(() => {
      result.current.updateColumnProperty(0, 'columnType', 'json');
    });

    const updatedColumns = paramUpdated.mock.calls[0][2];
    expect(updatedColumns[0].jsonIndentation).toBe(true);
  });
});

describe('useColumnManager - handlePropertyChange columnType=select/newMultiSelect/tagsV2 options seeding', () => {
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

  test.each(['select', 'newMultiSelect', 'tagsV2'])(
    '[Table-BUG-023] does not seed default sample options when a column with no existing options is switched to columnType %s',
    (columnType) => {
      const columns = [{ name: 'category', columnType: 'string' }];
      const paramUpdated = jest.fn();
      const component = buildComponent(columns);

      const { result } = renderHook(() => useColumnManager({ component, paramUpdated, currentState: {} }));

      act(() => {
        result.current.updateColumnProperty(0, 'columnType', columnType);
      });

      const updatedColumns = paramUpdated.mock.calls[0][2];
      expect(updatedColumns[0].options).toEqual([]);
    }
  );

  test("[Table-BUG-023] preserves a column's existing options (minus makeDefaultOption) when switched to columnType select", () => {
    const columns = [
      {
        name: 'category',
        columnType: 'string',
        options: [{ label: 'A', value: 'A', makeDefaultOption: true }],
      },
    ];
    const paramUpdated = jest.fn();
    const component = buildComponent(columns);

    const { result } = renderHook(() => useColumnManager({ component, paramUpdated, currentState: {} }));

    act(() => {
      result.current.updateColumnProperty(0, 'columnType', 'select');
    });

    const updatedColumns = paramUpdated.mock.calls[0][2];
    expect(updatedColumns[0].options).toEqual([{ label: 'A', value: 'A' }]);
  });
});
