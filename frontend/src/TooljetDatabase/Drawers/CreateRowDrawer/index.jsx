import React from 'react';
import Drawer from '@/_ui/Drawer';
import { CreateRowForm } from '../RowDrawer/CreateRowForm';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { useTjdbActions } from '../../_stores/tjdbStore';
import { useGuardedClose } from '../../_stores/unsavedChanges';

const CreateRowDrawer = ({ isCreateRowDrawerOpen, setIsCreateRowDrawerOpen }) => {
  const { handleRefetchQuery, selectedTable } = useTooljetDatabaseContext();
  const { setSortFilters, setQueryFilters } = useTjdbActions();
  // Backdrop, Cancel and Escape ask about unsaved input; creating the row closes through `onCreate`, unasked.
  const requestClose = useGuardedClose('createRow', () => setIsCreateRowDrawerOpen(false));

  return (
    <Drawer
      isOpen={isCreateRowDrawerOpen}
      onClose={requestClose}
      position="right"
      drawerStyle={{ width: '480px' }}
      className="tj-db-drawer"
    >
      <CreateRowForm
        // The form reads the table's columns once, so a different table is a new form.
        key={selectedTable?.id}
        onCreate={(shouldKeepDrawerOpen) => {
          setSortFilters({});
          setQueryFilters({});
          handleRefetchQuery();

          const tableElement = document.querySelector('[data-cy="tjdb-table-grid"]');
          if (tableElement) tableElement.scrollTop = 0;
          if (!shouldKeepDrawerOpen) setIsCreateRowDrawerOpen(false);
        }}
        onClose={requestClose}
      />
    </Drawer>
  );
};

export default CreateRowDrawer;
