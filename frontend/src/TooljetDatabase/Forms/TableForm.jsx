import React, { useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import CreateColumnsForm from './ColumnsForm';
import { tooljetDatabaseService, authenticationService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import _, { isEmpty } from 'lodash';
import { BreadCrumbContext } from '@/App/App';
import WarningInfo from '../Icons/Edit-information.svg';
// import ArrowRight from '../Icons/ArrowRight.svg';
import { serialDataType, ChangesComponent } from '../constants';
import cx from 'classnames';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import useMigrationModal from '../MigrationConfirmModal/useMigrationModal';

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

  const [createForeignKeyInEdit, setCreateForeignKeyInEdit] = useState(false);
  const [tableName, setTableName] = useState(selectedTable.table_name);
  const { organizationId, foreignKeys, setForeignKeys, configurations } = useContext(TooljetDatabaseContext);
  const { runMigration, modal: migrationModal } = useMigrationModal();

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

  const getTableNameHelperText = () => {
    if (!tableName || tableName.length === 0) {
      return 'Table name can contain letters, numbers and underscores and must be within 32 characters';
    }
    if (tableName.length > 32) {
      return 'Table name must be maximum 32 characters';
    }
    if (/^[0-9]/.test(tableName)) {
      return 'Table name cannot start with a number';
    }
    const tableNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!tableNameRegex.test(tableName)) {
      return 'Table name can only contain letters, numbers and underscores';
    }
    return 'Table name can contain letters, numbers and underscores and must be within 32 characters';
  };

  const helperText = getTableNameHelperText();
  const isErrorText =
    helperText !== 'Table name can contain letters, numbers and underscores and must be within 32 characters';

  const handleCreate = () => {
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

    runMigration({
      titlePlaceholder: `Create table "${tableName}"`,
      // Every column is new - a create has no prior shape to diff against.
      changes: Object.values(columns).map((column) => ({ type: '+', label: `Add column "${column.column_name}"` })),
      showSqlEditor: true,
      run: (migrationName) =>
        tooljetDatabaseService.createTable(
          organizationId,
          tableName,
          Object.values(columns),
          foreignKeyDetails,
          checkingValues,
          migrationName
        ),
      onSuccess: (resultData) => {
        toast.success(`${tableName} created successfully`);
        onCreate && onCreate({ id: resultData.result.id, table_name: tableName });
        posthogHelper.captureEvent('click_create_tooljet_table', {
          workspace_id:
            authenticationService?.currentUserValue?.organization_id ||
            authenticationService?.currentSessionValue?.current_organization_id,
          datasource: 'tooljet_db',
        });
        setCreateForeignKeyInEdit(false);
      },
    });
  };

  const handleEdit = () => {
    if (!validateTableName()) return;

    if (disabledCreateButton) {
      toast.error('Invalid JSON syntax for JSONB type column');
      return;
    }

    runMigration({
      titlePlaceholder: `Edit table "${selectedTable.table_name}"`,
      // edit_table's request IS the diff: + -> isEmpty(old_column), - -> isEmpty(new_column),
      // otherwise both present -> an edit.
      changes: data.map(({ old_column, new_column }) => {
        if (isEmpty(old_column)) return { type: '+', label: `Add column "${new_column.column_name}"` };
        if (isEmpty(new_column)) return { type: '-', label: `Drop column "${old_column.column_name}"` };
        return { type: '✎', label: `Edit column "${old_column.column_name}"` };
      }),
      tableId: selectedTable.id,
      showSqlEditor: true,
      // Folded in from the old PK-change ConfirmDialog: same warning, same visual, one modal
      // instead of two chained ones.
      banner:
        newPrimaryKeyChanges.length > 0 ? (
          <div className="mb-3">
            <div className={cx('form-label', { 'form-label-light': !darkMode })}>Change in primary key</div>
            <div className="tw-text-muted tw-mb-2" style={{ fontSize: '13px' }}>
              Updating the table will drop the current primary key constraints and add the new one. This action cannot
              be reversed.
            </div>
            <ChangesComponent currentPrimaryKeyIcons={currentPrimaryKeyIcons} newPrimaryKeyIcons={newPrimaryKeyIcons} />
          </div>
        ) : null,
      run: (migrationName) =>
        tooljetDatabaseService.renameTable(organizationId, selectedTable.table_name, tableName, data, migrationName),
      onSuccess: () => {
        toast.success(`${tableName} updated successfully`);
        updateSidebarNAV(tableName);
        updateSelectedTable({ ...selectedTable, table_name: tableName });
        onEdit && onEdit(tableName);
        setCreateForeignKeyInEdit(false);
      },
    });
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
              <div className={cx('mt-1', isErrorText ? 'text-danger' : 'text-muted')} style={{ fontSize: '11px' }}>
                {helperText}
              </div>
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
        isEditMode={isEditMode}
        onClose={onClose}
        onEdit={handleEdit}
        onCreate={handleCreate}
        shouldDisableCreateBtn={
          isErrorText ||
          isEmpty(tableName) ||
          tableName.trim().length === 0 ||
          (!isEditMode && !Object.values(columns).every(isRequiredFieldsExistForCreateTableOperation)) ||
          isEmpty(columns) ||
          hasPrimaryKey !== true ||
          (isEditMode && !Object.values(columns).every(isRequiredFieldsExistForCreateTableOperation))
        }
        showToolTipForFkOnReadDocsSection={true}
        initiator={initiator}
      />
      {migrationModal}
    </div>
  );
};

export default TableForm;
