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
import { serialDataType } from '../constants';
import cx from 'classnames';
import { deepClone } from '@/_helpers/utilities/utils.helpers';

const TableForm = ({
  selectedTable = {},
  selectedColumns = {
    0: {
      column_name: 'id',
      data_type: 'serial',
      constraints_type: { is_primary_key: true, is_not_null: true, is_unique: false },
      dataTypeDetails: serialDataType,
    },
  },
  selectedTableData = {},
  onCreate,
  onEdit,
  onClose,
  updateSelectedTable,
  initiator,
}) => {
  const isEditMode = !isEmpty(selectedTable);
  const selectedTableColumns = isEditMode ? selectedTableData : selectedColumns;
  const selectedTableColumnDetails = Object.values(selectedTableColumns);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  //Following state and handleInputError is to disable footer if JSON value is invalid for JSON column type
  const [disabledCreateButton, setDisabledCreateButton] = useState(false);
  const handleInputError = (bool = false) => {
    setDisabledCreateButton(bool);
  };

  const [fetching, setFetching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [createForeignKeyInEdit, setCreateForeignKeyInEdit] = useState(false);
  const [tableName, setTableName] = useState(selectedTable.table_name);
  const { organizationId, foreignKeys, setForeignKeys, configurations } = useContext(TooljetDatabaseContext);

  const [columns, setColumns] = useState(
    (() => {
      const clonedColumns = _.cloneDeep(selectedTableColumns) || {};
      const transformedColumns = Object.values(clonedColumns).map((column) => {
        const columnUuid = configurations?.columns?.column_names?.[column.column_name];
        const columnConfigurations = configurations?.columns?.configurations?.[columnUuid] || {};
        return {
          ...column,
          configurations: {
            ...columnConfigurations,
          },
        };
      });
      return transformedColumns;
    })()
  );
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  const [foreignKeyDetails, setForeignKeyDetails] = useState([]);

  useEffect(() => {
    toast.dismiss();
    if (isEditMode) {
      setForeignKeyDetails(
        foreignKeys?.map((item) => {
          return {
            column_names: item.column_names,
            referenced_table_name: item.referenced_table_name,
            referenced_table_id: item.referenced_table_id,
            referenced_column_names: item.referenced_column_names,
            on_delete: item.on_delete,
            on_update: item.on_update,
          };
        })
      );
    }
  }, []);

  useEffect(() => {
    if (isEditMode) {
      setForeignKeyDetails(
        foreignKeys?.map((item) => {
          return {
            column_names: item.column_names,
            referenced_table_name: item.referenced_table_name,
            referenced_table_id: item.referenced_table_id,
            referenced_column_names: item.referenced_column_names,
            on_delete: item.on_delete,
            on_update: item.on_update,
          };
        })
      );
    }
  }, [foreignKeys]);

  function bodyColumns(columns, selectedTableColumnDetails) {
    let newArray = [];

    for (const key in columns) {
      if (columns.hasOwnProperty(key)) {
        let new_column = {};
        let old_column = {};

        new_column = columns[key];
        old_column = selectedTableColumnDetails[key];

        if (old_column !== undefined) {
          newArray.push({ new_column, old_column });
        } else {
          newArray.push({ new_column });
        }
      }
    }

    selectedTableColumnDetails.forEach((col, index) => {
      if (!columns.hasOwnProperty(index)) {
        let old_column = {};
        old_column = col;
        newArray.push({ old_column });
      }
    });

    Object.values(columns).forEach((col, index) => {
      if (!selectedTableColumnDetails.hasOwnProperty(index)) {
        let new_column = col;
        if (!newArray.some((item) => JSON.stringify(item.new_column) === JSON.stringify(new_column))) {
          newArray.push({ new_column });
        }
      }
    });
    return newArray;
  }

  let data = bodyColumns(columns, selectedTableColumnDetails);

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
      toast.error(
        'Unexpected character found in table name. Table name can only contain alphabets, numbers and underscores.'
      );
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
    if (disabledCreateButton) {
      toast.error('Invalid JSON syntax for JSONB type column');
      return;
    }

    const checkingValues = isEmpty(foreignKeyDetails) ? false : true;

    setFetching(true);
    const { error, data } = await tooljetDatabaseService.createTable(
      organizationId,
      tableName,
      Object.values(columns),
      foreignKeyDetails,
      checkingValues
    );
    setFetching(false);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new table "${tableName}"`);
      return;
    }

    toast.success(`${tableName} created successfully`);
    onCreate && onCreate({ id: data.result.id, table_name: tableName });
    setCreateForeignKeyInEdit(false);
  };

  const handleEdit = async () => {
    if (!validateTableName()) return;

    if (disabledCreateButton) {
      toast.error('Invalid JSON syntax for JSONB type column');
      return;
    }

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

    toast.success(`${tableName} updated successfully`);
    updateSidebarNAV(tableName);
    updateSelectedTable({ ...selectedTable, table_name: tableName });

    onEdit && onEdit(tableName);
    setCreateForeignKeyInEdit(false);
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

  const existingPrimaryKeyObjects = selectedTableColumnDetails.filter((item) => item.constraints_type.is_primary_key);

  const primaryKeyObjects = Object.values(columns).filter((item) => item.constraints_type?.is_primary_key === true);

  const newPrimaryKeyChanges = Object.values(columns).filter((item) => {
    if (item.constraints_type?.is_primary_key === true) {
      return !existingPrimaryKeyObjects.some((obj) => obj.column_name === item.column_name);
    } else {
      return existingPrimaryKeyObjects.some((obj) => obj.column_name === item.column_name);
    }
  });

  const currentPrimaryKeyIcons = existingPrimaryKeyObjects?.map((item) => {
    return {
      columnName: item.column_name,
      icon: item.data_type,
    };
  });

  const newPrimaryKeyIcons = primaryKeyObjects?.map((item) => {
    return {
      columnName: item.column_name,
      icon: item.data_type,
    };
  });

  return (
    <div className="drawer-card-wrapper">
      <div className="card-header">
        {!isEditMode && (
          <h3 className={cx('card-title', { 'card-title-light': !darkMode })} data-cy="create-new-table-header">
            Create a new table
          </h3>
        )}
        {isEditMode && (
          <h3 className={cx('card-title', { 'card-title-light': !darkMode })} data-cy="edit-table-header">
            Edit table
          </h3>
        )}
      </div>
      <div className="card-body-wrapper">
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
            <div className={cx('form-label', { 'form-label-light': !darkMode })} data-cy="table-name-label">
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
              />
            </div>
          </div>
        </div>
        <CreateColumnsForm
          columns={columns}
          setColumns={setColumns}
          isEditMode={isEditMode}
          editColumns={columns}
          tableName={tableName}
          setForeignKeyDetails={setForeignKeyDetails}
          isRequiredFieldsExistForCreateTableOperation={isRequiredFieldsExistForCreateTableOperation}
          foreignKeyDetails={foreignKeyDetails}
          organizationId={organizationId}
          existingForeignKeyDetails={foreignKeys}
          setCreateForeignKeyInEdit={setCreateForeignKeyInEdit}
          createForeignKeyInEdit={createForeignKeyInEdit}
          selectedTable={selectedTable}
          setForeignKeys={setForeignKeys}
          handleInputError={handleInputError}
        />
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
        showToolTipForFkOnReadDocsSection={true}
        initiator={initiator}
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
