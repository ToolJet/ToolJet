import React, { useState } from 'react';
import Drawer from '@/_ui/Drawer';
import CreateRowForm from '../../Forms/RowForm';
import { useTooljetDatabaseContext } from '../../TooljetDatabaseContext';
import { useTjdbActions } from '../../_stores/tjdbStore';
import { useGuardedClose } from '../../_stores/unsavedChanges';

const CreateRowDrawer = ({
  isCreateRowDrawerOpen,
  setIsCreateRowDrawerOpen,
  referencedColumnDetails,
  setReferencedColumnDetails,
}) => {
  const { handleRefetchQuery } = useTooljetDatabaseContext();
  const { setSortFilters, setQueryFilters } = useTjdbActions();
  const [shouldResetRowForm, setShouldResetRowForm] = useState(0);
  // Backdrop, Cancel and Escape ask about unsaved input; creating the row closes through `onCreate`, unasked.
  const requestClose = useGuardedClose('createRow', () => setIsCreateRowDrawerOpen(false));

  return (
    <>
      <Drawer isOpen={isCreateRowDrawerOpen} onClose={requestClose} position="right" className="tj-db-drawer">
        <CreateRowForm
          onCreate={(shouldKeepDrawerOpen) => {
            setSortFilters({});
            setQueryFilters({});
            handleRefetchQuery();

            const tableElement = document.querySelector('[data-cy="tjdb-table-grid"]');
            if (tableElement) tableElement.scrollTop = 0;
            if (!shouldKeepDrawerOpen) setIsCreateRowDrawerOpen(false);
            setShouldResetRowForm((prev) => prev + 1);
          }}
          onClose={requestClose}
          referencedColumnDetails={referencedColumnDetails}
          setReferencedColumnDetails={setReferencedColumnDetails}
          initiator="CreateRowForm"
          shouldResetRowForm={shouldResetRowForm}
        />
      </Drawer>
    </>
  );
};

export default CreateRowDrawer;
