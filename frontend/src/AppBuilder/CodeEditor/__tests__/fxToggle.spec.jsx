/**
 * Issue #5255: with fx switched off, the code written for the field kept resolving and still drove
 * the property.
 *
 * The runtime resolves whatever string is stored for the property and ignores the fx flag, so the
 * only thing that stops the code being applied is the stored value no longer holding it.
 */
import React, { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { useListItemManager } from '@/AppBuilder/RightSideBar/Inspector/Components/shared/hooks';
import { ProgramaticallyHandleProperties } from '@/AppBuilder/RightSideBar/Inspector/Components/Table/ProgramaticallyHandleProperties';

// The editor's preview box observes visibility; jsdom ships neither observer.
beforeAll(() => {
  const NoopObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  global.IntersectionObserver = global.IntersectionObserver ?? NoopObserver;
  global.ResizeObserver = global.ResizeObserver ?? NoopObserver;
});

/** Stands in for the Table column inspector, using the writer the inspector itself uses. */
function ColumnVisibilityField({ initialColumn }) {
  const [columns, setColumns] = useState([initialColumn]);
  const component = {
    id: 'table-1',
    component: {
      name: 'table1',
      component: 'Table',
      definition: { properties: { columns: { value: columns } } },
    },
  };

  const { updateProperty, updateProperties } = useListItemManager({
    component,
    paramUpdated: (_param, _attr, value) => setColumns(value),
    currentState: {},
    config: { propertyName: 'columns', typeProp: 'columnType' },
  });

  return (
    <>
      <pre data-testid="stored-column">{JSON.stringify(columns[0])}</pre>
      <ProgramaticallyHandleProperties
        index={0}
        property="columnVisibility"
        props={columns[0]}
        callbackFunction={updateProperty}
        multiCallbackFunction={updateProperties}
        component={component}
        paramMeta={{ type: 'toggle', displayName: 'Visibility' }}
        paramType="properties"
      />
    </>
  );
}

it('stops applying the code once fx is switched off', async () => {
  render(
    <MemoryRouter>
      <ColumnVisibilityField
        initialColumn={{
          id: 'col-name',
          name: 'Name',
          key: 'name',
          columnType: 'string',
          columnVisibility: '{{2 > 1}}',
          fxActiveFields: ['columnVisibility'],
        }}
      />
    </MemoryRouter>
  );

  await userEvent.click(screen.getByTitle(/Use fx for property/i));

  await waitFor(() => {
    const storedColumn = JSON.parse(screen.getByTestId('stored-column').textContent);
    expect(storedColumn.columnVisibility).not.toContain('2 > 1');
  });
});
