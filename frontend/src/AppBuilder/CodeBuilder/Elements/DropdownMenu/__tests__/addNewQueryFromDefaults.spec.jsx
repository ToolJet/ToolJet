import React from 'react';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { DropdownMenu } from '../DropdownMenu';

// DataSourceSelect pulls in the full query-editor form tree (DynamicForm, CodeEditor, ee AI
// panels, ...), which isn't relevant here: the bug under test is in DropdownMenu's own
// outside-click handling, reproducible with any content rendered through AddQueryBtn's
// (real, unmocked) react-bootstrap portal.
jest.mock('@/AppBuilder/QueryManager/Components/DataSourceSelect', () => {
  const { useEffect } = require('react');
  return function MockDataSourceSelect({ selectRef, onQueryCreate }) {
    useEffect(() => {
      if (selectRef) selectRef.current = { focus: () => {} };
    }, [selectRef]);
    return (
      <button onClick={() => onQueryCreate({ id: 'query-1', name: 'restapi1', kind: 'restapi' })}>REST API</button>
    );
  };
});

describe('DropdownMenu - Add new query - Defaults popover', () => {
  test('selecting a data source type from the "Add new query" popover creates and binds a query', async () => {
    const handleChange = jest.fn();
    render(
      <DropdownMenu
        value={undefined}
        onChange={handleChange}
        darkMode={false}
        meta={{ options: [], disableCreateQuery: false }}
      />
    );

    await userEvent.click(screen.getByText('Select a source'));
    await userEvent.hover(screen.getByText('Add new query'));
    const restApiButton = await screen.findByRole('button', { name: 'REST API' });

    await userEvent.click(restApiButton);

    expect(handleChange).toHaveBeenCalledWith('{{queries.query-1.data}}');
    expect(await screen.findByText('restapi1')).toBeInTheDocument();
  });
});
