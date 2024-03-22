import React, { useState, useContext, useCallback, useEffect } from 'react';
import cx from 'classnames';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService, appsService } from '@/_services';
import { ListItemPopover } from './ActionsPopover';
import { TooljetDatabaseContext } from '../index';
import { ToolTip } from '@/_components';
import Drawer from '@/_ui/Drawer';
import EditTableForm from '../Forms/TableForm';
import CreateColumnDrawer from '../Drawers/CreateColumnDrawer';
import { dataTypes } from '../constants';

export const ListItem = ({ active, onClick, text = '', onDeleteCallback }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { organizationId, columns, selectedTable, setSelectedTable, selectedTableData } =
    useContext(TooljetDatabaseContext);
  const [isEditTableDrawerOpen, setIsEditTableDrawerOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDropDownMenu, setShowDropDownMenu] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isAddNewColumnDrawerOpen, setIsAddNewColumnDrawerOpen] = useState(false);

  function updateSelectedTable(tableObj) {
    setSelectedTable(tableObj);
  }

  const handleExportTable = () => {
    appsService
      .exportResource({
        tooljet_database: [{ table_id: selectedTable.id }],
        organization_id: organizationId,
      })
      .then((data) => {
        const tableName = selectedTable.table_name.replace(/\s+/g, '-').toLowerCase();
        const fileName = `${tableName}-export-${new Date().getTime()}`;
        // simulate link click download
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch(() => {
        toast.error('Could not export table.', {
          position: 'top-center',
        });
      });
  };

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

  const onMenuToggle = useCallback(
    (status) => {
      setShowDropDownMenu(!!status);
      !status && !isHovered && setFocused(false);
    },
    [isHovered]
  );

  useEffect(() => {
    !showDropDownMenu && setFocused(!!isHovered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered]);

  const filterObjectsByDataType = (dataTypes, col) => {
    const filteredDataTypes = dataTypes.filter((dataType) => {
      return col.some((obj) => obj.dataType === dataType.value);
    });

    return filteredDataTypes;
  };

  // const primarKeyObjectsByDataType = (dataTypes, col) => {
  //   const filteredDataTypes = col.filter((item) => {
  //     return dataTypes.some((obj) => obj.value === item.dataType && item?.constraints_type?.is_primary_key);
  //   });

  //   return filteredDataTypes;
  // };

  const selectedColumnDetails = columns.map((item, index) => {
    const matchedDataTypes = filterObjectsByDataType(dataTypes, [item]); // Get all matched data type objects
    // const primary = primarKeyObjectsByDataType(dataTypes, [item]);
    return {
      [index]: {
        column_name: item.Header,
        data_type: item.dataType,
        constraints_type: item.constraints_type,
        dataTypeDetails: matchedDataTypes.length > 0 ? matchedDataTypes : null, // Add matched data types or null if no match found
        column_default: item.column_default,
        // primary: primary.length > 0 ? primary : null,
      },
    };
  });

  const selectedTableDetails = Object.assign({}, ...selectedColumnDetails);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cx(
        'table-list-item mb-1 rounded-3 d-inline-flex align-items-center justify-content-between h-4 list-group-item cursor-pointer list-group-item-action border-0 py-1',
        {
          'bg-light-indigo': !darkMode && active,
          'bg-dark-indigo': darkMode && active,
        }
      )}
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
      {focused && (
        <div>
          <ListItemPopover
            onEdit={() => {
              setShowDropDownMenu(false);
              setIsEditTableDrawerOpen(true);
            }}
            onDelete={handleDeleteTable}
            darkMode={darkMode}
            handleExportTable={handleExportTable}
            onMenuToggle={onMenuToggle}
            onAddNewColumnBtnClick={() => {
              setShowDropDownMenu(false);
              setIsAddNewColumnDrawerOpen(true);
            }}
          />
        </div>
      )}

      <Drawer
        disableFocus={true}
        isOpen={isEditTableDrawerOpen}
        onClose={() => setIsEditTableDrawerOpen(false)}
        position="right"
        drawerStyle={{ width: '630px' }}
      >
        <EditTableForm
          selectedColumns={formColumns}
          selectedTable={selectedTable}
          selectedTableData={selectedTableDetails}
          selectedTableDetails={selectedTableDetails}
          updateSelectedTable={updateSelectedTable}
          onEdit={() => setIsEditTableDrawerOpen(false)}
          onClose={() => setIsEditTableDrawerOpen(false)}
        />
      </Drawer>
      <CreateColumnDrawer
        isCreateColumnDrawerOpen={isAddNewColumnDrawerOpen}
        setIsCreateColumnDrawerOpen={setIsAddNewColumnDrawerOpen}
        rows={selectedTableData}
      />
    </div>
  );
};
