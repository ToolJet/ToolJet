import React, { useState, useContext } from 'react';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { ListItemPopover } from './ActionsPopover';
import Drawer from '@/_ui/Drawer';
import EditTableForm from '../../Forms/CreateTableForm';
import { TooljetDatabaseContext } from '../../index';

export const ListItem = ({ active, onClick, text = '', onDeleteCallback }) => {
  const { organizationId, setTables } = useContext(TooljetDatabaseContext);
  const [isEditTableDrawerOpen, setIsEditTableDrawerOpen] = useState(false);

  const handleDelete = async () => {
    const { error } = await tooljetDatabaseService.deleteTable(organizationId, text);

    if (error) {
      toast.error(error?.message ?? `Failed to delete table "${text}"`);
      return;
    }

    toast.success(`${text} deleted successfully`);
    onDeleteCallback && onDeleteCallback();
  };

  const handleEdit = async (tableName) => {
    // const { error } = await tooljetDatabaseService.updateTable(organizationId, selectedTable, tableName);
    // if (error) {
    //   toast.error(error?.message ?? `Error editing table "${selectedTable}"`);
    //   return;
    // }
    // toast.success(`Edited table "${selectedTable}"`);
  };

  return (
    <div
      className={cx('list-group-item cursor-pointer list-group-item-action text-capitalize', { active })}
      onClick={onClick}
    >
      {text}
      <div className="float-right cursor-pointer">
        <ListItemPopover onEdit={() => setIsEditTableDrawerOpen(true)} onDelete={handleDelete} />
      </div>
      <Drawer isOpen={isEditTableDrawerOpen} onClose={() => setIsEditTableDrawerOpen(false)} position="right">
        <EditTableForm
          onCreate={() => {
            tooljetDatabaseService.findAll(organizationId).then(({ data = [] }) => {
              if (Array.isArray(data?.result) && data.result.length > 0) {
                setTables(data.result || []);
              }
            });
            setIsEditTableDrawerOpen(false);
          }}
          onClose={() => setIsEditTableDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
};
