import React, { useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import CreateColumnsForm from './ColumnsForm';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { isEmpty } from 'lodash';
import { BreadCrumbContext } from '@/App/App';
import WarningInfo from '../Icons/Edit-information.svg';
// import ArrowRight from '../Icons/ArrowRight.svg';
import { ConfirmDialog } from '@/_components';
import { serialDataType } from '../constants';
import cx from 'classnames';

const TableForm = ({
  selectedTable = {},
  selectedColumns = { 0: { column_name: 'id', data_type: 'serial', constraints_type: { is_primary_key: true } } },
  onCreate,
  onEdit,
  onClose,
  updateSelectedTable,
  initiator,
}) => {
  const [fetching, setFetching] = useState(false);
  const [tableName, setTableName] = useState(selectedTable.table_name);
  const [columns, setColumns] = useState(selectedColumns);
  const { organizationId } = useContext(TooljetDatabaseContext);
  const isEditMode = !isEmpty(selectedTable);
  const { updateSidebarNAV } = useContext(BreadCrumbContext);

  useEffect(() => {
    toast.dismiss();
  }, []);

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

    setFetching(true);
    const { error, data } = await tooljetDatabaseService.createTable(organizationId, tableName, Object.values(columns));
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

    setFetching(true);
    const { error } = await tooljetDatabaseService.renameTable(organizationId, selectedTable.table_name, tableName);
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
              <span className="edit-warning-text">
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
        {!isEditMode && <CreateColumnsForm columns={columns} setColumns={setColumns} />}
      </div>
      <DrawerFooter
        fetching={fetching}
        isEditMode={isEditMode}
        onClose={onClose}
        onEdit={handleEdit}
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
