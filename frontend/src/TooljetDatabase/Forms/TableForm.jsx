import React, { useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import CreateColumnsForm from './ColumnsForm';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import _, { isEmpty } from 'lodash';
import { BreadCrumbContext } from '@/App/App';
import WarningInfo from '../Icons/Edit-information.svg';
// import ArrowRight from '../Icons/ArrowRight.svg';
import { ConfirmDialog } from '@/_components';

const TableForm = ({
  selectedTable = {},
  selectedColumns = {
    0: {
      column_name: 'id',
      data_type: 'serial',
      constraints_type: { is_primary_key: true, is_not_null: true, is_unique: true },
    },
  },
  selectedTableData = {},
  onCreate,
  onEdit,
  onClose,
  updateSelectedTable,
}) => {
  const isEditMode = !isEmpty(selectedTable);
  const selectedTableColumns = isEditMode ? selectedTableData : selectedColumns;
  const arrayOfTableColumns = Object.values(selectedTableColumns);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const [fetching, setFetching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [tableName, setTableName] = useState(selectedTable.table_name);
  const [columns, setColumns] = useState(_.cloneDeep(selectedTableColumns));
  const { organizationId } = useContext(TooljetDatabaseContext);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  useEffect(() => {
    toast.dismiss();
  }, []);

  function bodyColumns(columns, arrayOfTableColumns) {
    let newArray = [];

    for (const key in columns) {
      if (columns.hasOwnProperty(key)) {
        let newColumn = {};
        let oldColumn = {};

        newColumn = columns[key];
        oldColumn = arrayOfTableColumns[key];

        if (oldColumn !== undefined) {
          if (newColumn.data_type === 'serial') {
            delete newColumn['column_default'];
          }
          if (oldColumn.data_type === 'serial') {
            delete oldColumn['column_default'];
          }
          // delete newColumn['dataTypeDetails'];
          // delete oldColumn['dataTypeDetails'];
          newArray.push({ newColumn, oldColumn });
        } else {
          newArray.push({ newColumn });
        }
      }
    }

    arrayOfTableColumns.forEach((col, index) => {
      if (!columns.hasOwnProperty(index)) {
        let oldColumn = {};
        oldColumn = col;
        newArray.push({ oldColumn });
      }
    });

    Object.values(columns).forEach((col, index) => {
      if (!arrayOfTableColumns.hasOwnProperty(index)) {
        let newColumn = col;
        if (!newArray.some((item) => JSON.stringify(item.newColumn) === JSON.stringify(newColumn))) {
          if (newColumn.data_type === 'serial') {
            delete newColumn['column_default'];
          }
          // delete newColumn['dataTypeDetails'];
          newArray.push({ newColumn });
        }
      }
    });
    return newArray;
  }

  let data = bodyColumns(columns, arrayOfTableColumns);

  const validateTableName = () => {
    if (isEmpty(tableName)) {
      toast.error('Table name cannot be empty');
      return false;
    }

    if (tableName.length > 255) {
      toast.error('Table name cannot be more than 255 characters');
      return false;
    }

    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName)) {
      toast.error('Table name can only contain alphabets, numbers and underscores');
      return false;
    }

    return true;
  };

  const handleCreate = async () => {
    if (!validateTableName()) return;

    const columnNames = Object.values(columns).map((column) => column.column_name);
    if (columnNames.some((columnName) => isEmpty(columnName))) {
      toast.error('Column names cannot be empty');
      return;
    }

    setFetching(true);
    const { error, data } = await tooljetDatabaseService.createTable(organizationId, tableName, Object.values(columns));
    setFetching(false);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new table "${tableName}"`);
      return;
    }

    toast.success(`${tableName} created successfully`);
    onCreate && onCreate({ id: data.result.id, table_name: tableName });
  };

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!isEditMode) handleCreate(e);
      if (isEditMode && selectedTable.table_name !== tableName) handleEdit();
    }
  }

  const handleEdit = async () => {
    if (!validateTableName()) return;

    setFetching(true);
    const { error } = await tooljetDatabaseService.renameTable(
      organizationId,
      selectedTable.table_name,
      tableName,
      data
    );
    setFetching(false);

    if (error) {
      toast.error(error?.message ?? `Failed to edit table "${tableName}"`);
      return;
    }

    toast.success(`${tableName} edited successfully`);
    updateSidebarNAV(tableName);
    updateSelectedTable({ ...selectedTable, table_name: tableName });

    onEdit && onEdit();
  };

  const isRequiredFieldsExistForCreateTableOperation = (columnDetails) => {
    if (
      !columnDetails.column_name ||
      !columnDetails.data_type ||
      isEmpty(columnDetails?.column_name.trim()) ||
      isEmpty(columnDetails?.data_type)
    )
      return false;
    return true;
  };

  const footerStyle = {
    borderTop: '1px solid var(--slate5)',
    paddingTop: '12px',
    marginTop: '0px',
  };

  const hasPrimaryKey = Object.values(columns).some((e) => e?.constraints_type?.is_primary_key === true);

  const existingPrimaryKeyObjects = arrayOfTableColumns.filter((item) => item.constraints_type.is_primary_key);

  const primaryKeyObjects = Object.values(columns).filter((item) => item.constraints_type?.is_primary_key === true);

  const newPrimaryKeyChanges = Object.values(columns).filter((item) => {
    if (item.constraints_type?.is_primary_key === true) {
      return !existingPrimaryKeyObjects.some((obj) => obj.column_name === item.column_name);
    } else {
      return existingPrimaryKeyObjects.some((obj) => obj.column_name === item.column_name);
    }
  });

  const currentPrimaryKeyIcons = existingPrimaryKeyObjects?.map((item, index) => {
    return {
      columnName: item.column_name,
      icon: item.data_type,
    };
  });

  const newPrimaryKeyIcons = primaryKeyObjects?.map((item, index) => {
    return {
      columnName: item.column_name,
      icon: item.data_type,
    };
  });

  return (
    <div className="drawer-card-wrapper">
      <div className="card-header">
        {!isEditMode && (
          <h3 className="card-title" data-cy="create-new-table-header">
            Create a new table
          </h3>
        )}
        {isEditMode && (
          <h3 className="card-title" data-cy="edit-table-header">
            Edit table
          </h3>
        )}
      </div>
      <div>
        <div className="card-body">
          {isEditMode && (
            <div className="edit-warning-info mb-3">
              <div className="edit-warning-icon">
                <WarningInfo />
              </div>
              <span className="edit-warning-text" style={{ marginTop: '0.1rem' }}>
                Editing the table name could break queries and apps connected with this table.
              </span>
            </div>
          )}
          <div className="">
            <div className="form-label" data-cy="table-name-label">
              Table name
            </div>
            <div className="tj-app-input">
              <input
                type="text"
                placeholder="Enter table name"
                name="table-name"
                className="form-control"
                data-cy="table-name-input-field"
                autoComplete="off"
                value={tableName}
                onChange={(e) => {
                  setTableName(e.target.value);
                }}
                autoFocus
                onKeyPress={handleKeyPress}
              />
            </div>
          </div>
        </div>
        <CreateColumnsForm columns={columns} setColumns={setColumns} isEditMode={isEditMode} />
      </div>
      <DrawerFooter
        fetching={fetching}
        isEditMode={isEditMode}
        onClose={onClose}
        onEdit={() => {
          if (newPrimaryKeyChanges.length > 0) {
            setShowModal(true);
          } else {
            handleEdit();
          }
        }}
        onCreate={handleCreate}
        shouldDisableCreateBtn={
          isEmpty(tableName) ||
          (!isEditMode && !Object.values(columns).every(isRequiredFieldsExistForCreateTableOperation)) ||
          isEmpty(columns) ||
          hasPrimaryKey !== true ||
          (isEditMode && !Object.values(columns).every(isRequiredFieldsExistForCreateTableOperation))
        }
      />
      <ConfirmDialog
        title={'Change in primary key'}
        show={showModal}
        message={
          'Updating the table will drop the current primary key contraints and add the new one. This action is cannot be reversed. Are you sure you want to continue?'
        }
        onConfirm={handleEdit}
        onCancel={() => setShowModal(false)}
        darkMode={darkMode}
        confirmButtonType="primary"
        cancelButtonType="tertiary"
        onCloseIconClick={() => setShowModal(false)}
        confirmButtonText={'Continue'}
        cancelButtonText={'Cancel'}
        footerStyle={footerStyle}
        currentPrimaryKeyIcons={currentPrimaryKeyIcons}
        newPrimaryKeyIcons={newPrimaryKeyIcons}
        isEditToolJetDbTable={true}
      />
    </div>
  );
};

export default TableForm;
