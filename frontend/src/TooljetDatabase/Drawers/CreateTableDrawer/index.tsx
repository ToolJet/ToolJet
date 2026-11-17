import React from 'react';
import { toast } from 'react-hot-toast';
import Drawer from '@/_ui/Drawer';
import { tooljetDatabaseService } from '@/_services/tooljetDatabase.service';
import CreateTableForm from '../../Forms/TableForm';
import { useTooljetDatabaseContext, type TjdbTable } from '../../TooljetDatabaseContext';

export interface CreateTableDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Controlled: whoever has a "Create new table" button owns the open state. A created table becomes the open one.
export default function CreateTableDrawer({ isOpen, onClose }: CreateTableDrawerProps) {
  const { organizationId, setSelectedTable, setTables } = useTooljetDatabaseContext();

  const handleCreated = (tableInfo: TjdbTable) => {
    tooljetDatabaseService
      .findAll(organizationId)
      .then(({ data, error }: { data?: { result?: TjdbTable[] }; error?: Error }) => {
        if (error) {
          toast.error(error?.message ?? 'Failed to fetch tables');
          return;
        }
        if (Array.isArray(data?.result) && data.result.length > 0) {
          setSelectedTable({ table_name: tableInfo.table_name, id: tableInfo.id });
          setTables(data.result);
        }
      });
    onClose();
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      position="right"
      drawerStyle={{ width: '640px' }}
      className="tj-db-drawer"
    >
      <CreateTableForm onCreate={handleCreated} onClose={onClose} initiator="CreateTableForm" />
    </Drawer>
  );
}
