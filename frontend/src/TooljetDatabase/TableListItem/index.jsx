import React, { useState, useContext } from 'react';
import cx from 'classnames';

import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { ListItemPopover } from './ActionsPopover';
import { TooljetDatabaseContext } from '../index';
import { ToolTip } from '@/_components';

import Drawer from '@/_ui/Drawer';
import EditTableForm from '../Forms/TableForm';

export const ListItem = ({ active, onClick, text = '', onDeleteCallback }) => {
  const { organizationId, columns, selectedTable, setTables, setSelectedTable } = useContext(TooljetDatabaseContext);
  const [isEditTableDrawerOpen, setIsEditTableDrawerOpen] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  function updateSelectedTable(tableObj) {
    setSelectedTable(tableObj);
  }

  const handleDeleteTable = async () => {
    const shouldDelete = confirm(`Are you sure you want to delete the table "${text}"?`);
    if (shouldDelete) {
      const { error } = await tooljetDatabaseService.deleteTable(organizationId, text);

      if (error) {
        toast.error(error?.message ?? `Failed to delete table "${text}"`);
        return;
      }

      toast.success(`Table "${text}" deleted successfully`);
      onDeleteCallback && onDeleteCallback();
    }
  };

  const formColumns = columns.reduce((acc, column, currentIndex) => {
    acc[currentIndex] = { column_name: column.Header, data_type: column.dataType };
    return acc;
  }, {});

  return (
    <div
      className={cx('tj-list-item cursor-pointer', {
        'tj-list-item-selected': active,
      })}
      data-cy={`${String(text).toLowerCase().replace(/\s+/g, '-')}-table`}
      onClick={onClick}
    >
      <ToolTip message={text}>
        <span
          className="table-name tj-text-xsm"
          data-cy={`${String(text).toLowerCase().replace(/\s+/g, '-')}-table-name`}
        >
          {text}
        </span>
      </ToolTip>
      <ListItemPopover onEdit={() => setIsEditTableDrawerOpen(true)} onDelete={handleDeleteTable} darkMode={darkMode} />
      <Drawer
        disableFocus={true}
        isOpen={isEditTableDrawerOpen}
        onClose={() => setIsEditTableDrawerOpen(false)}
        position="right"
      >
        <EditTableForm
          selectedColumns={formColumns}
          selectedTable={selectedTable}
          updateSelectedTable={updateSelectedTable}
          onEdit={() => setIsEditTableDrawerOpen(false)}
          onClose={() => setIsEditTableDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
};
