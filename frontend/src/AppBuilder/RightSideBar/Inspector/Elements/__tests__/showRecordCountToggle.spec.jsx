/**
 * What the "Show record count" toggle shows in the Table Inspector.
 * A Table saved before the property existed has no key: the toggle mirrors pagination, as the count does.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { tableConfig } from '@/AppBuilder/WidgetManager/widgets/table';
import { Code } from '../Code';

const inspectorComponent = (properties) => ({
  id: 't1',
  component: { name: 'table1', component: 'Table', properties: {}, definition: { properties, styles: {} } },
});

const renderToggle = (properties) => {
  render(
    <Code
      param={{ name: 'showRecordCount' }}
      definition={properties.showRecordCount ?? {}}
      onChange={jest.fn()}
      paramType="properties"
      componentMeta={tableConfig}
      componentName="table1"
      onFxPress={jest.fn()}
      fxActive={false}
      component={inspectorComponent(properties)}
    />
  );
  return screen.getByRole('checkbox');
};

describe('Table-RECCOUNT Show record count toggle in the Inspector', () => {
  test.each([
    ['{{true}}', true],
    ['{{false}}', false],
  ])('Table-RECCOUNT-009 no saved value: pagination %s shows the toggle as %s', (pagination, checked) => {
    const toggle = renderToggle({ enablePagination: { value: pagination } });
    expect(toggle.checked).toBe(checked);
  });

  test('Table-RECCOUNT-010 no saved value and no pagination key: old client-side paging shows the toggle on', () => {
    const toggle = renderToggle({ clientSidePagination: { value: '{{true}}' } });
    expect(toggle.checked).toBe(true);
  });

  // The old count rule reads these keys without checking enablePagination, so the toggle must too
  test.each([
    ['old client-side key on', { clientSidePagination: { value: '{{true}}' } }, true],
    [
      'old server-side key on',
      { serverSidePagination: { value: '{{true}}' }, totalRecords: { value: '{{42}}' } },
      true,
    ],
    [
      'old server-side key on, Total records 0',
      { serverSidePagination: { value: '{{true}}' }, totalRecords: { value: '{{0}}' } },
      false,
    ],
  ])('Table-RECCOUNT-012 pagination off, %s: toggle matches the count', (_label, oldKeys, checked) => {
    const toggle = renderToggle({ enablePagination: { value: '{{false}}' }, ...oldKeys });
    expect(toggle.checked).toBe(checked);
  });

  test('Table-RECCOUNT-011 a saved value wins over pagination', () => {
    const toggle = renderToggle({ enablePagination: { value: '{{true}}' }, showRecordCount: { value: '{{false}}' } });
    expect(toggle.checked).toBe(false);
  });
});
