import React, { useState, useContext, useEffect } from 'react';
import Select from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import tjdbDropdownStyles, {
  dataTypes,
  formatOptionLabel,
  serialDataType,
  getColumnDataType,
  renderDatatypeIcon,
} from '../constants';
import Drawer from '@/_ui/Drawer';
import ForeignKeyTableForm from './ForeignKeyTableForm';
import WarningInfo from '../Icons/Edit-information.svg';
import Information from '@/_ui/Icon/solidIcons/Information';
import { isEmpty } from 'lodash';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import ForeignKeyRelationIcon from '../Icons/Fk-relation.svg';
import EditIcon from '../Icons/EditColumn.svg';
import { ToolTip } from '@/_components/ToolTip';
import { ConfirmDialog } from '@/_components';
import ForeignKeyIndicator from '../Icons/ForeignKeyIndicator.svg';
import ArrowRight from '../Icons/ArrowRight.svg';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';

const ColumnForm = ({
  onClose,
  selectedColumn,
  setColumns,
  rows,
  isEditColumn,
  referencedColumnDetails,
  setReferencedColumnDetails,
}) => {
  const nullValue = selectedColumn?.constraints_type?.is_not_null ?? false;
  const uniqueConstraintValue = selectedColumn?.constraints_type?.is_unique ?? false;

  const [columnName, setColumnName] = useState(selectedColumn?.Header);
  const [defaultValue, setDefaultValue] = useState(selectedColumn?.column_default);
  const [dataType, setDataType] = useState(selectedColumn?.dataType);
  const [onDelete, setOnDelete] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [isNotNull, setIsNotNull] = useState(nullValue);
  const [createForeignKeyInEdit, setCreateForeignKeyInEdit] = useState(false);
  const [isForeignKey, setIsForeignKey] = useState(false);
  const [isUniqueConstraint, setIsUniqueConstraint] = useState(uniqueConstraintValue);
  const [isForeignKeyDraweOpen, setIsForeignKeyDraweOpen] = useState(false);
  const [onChangeInForeignKey, setOnChangeInForeignKey] = useState(false);

  const {
    organizationId,
    selectedTable,
    handleRefetchQuery,
    queryFilters,
    pageCount,
    pageSize,
    sortFilters,
    setForeignKeys,
    foreignKeys,
  } = useContext(TooljetDatabaseContext);

  const columns = {
    column_name: columnName,
    data_type: dataType,
    constraints_type: {
      is_not_null: isNotNull,
      is_primary_key: selectedColumn.is_primary_key,
      is_unique: isUniqueConstraint,
    },
    dataTypeDetails: dataTypes.filter((item) => item.value === dataType),
    column_default: defaultValue,
  };

  const existingForeignKeyColumnDetails = [];

  const matchingForeignKey = foreignKeys.find(
    (obj) => obj.column_names && obj.column_names.length > 0 && columns.column_name === obj.column_names[0]
  );

  if (matchingForeignKey) {
    existingForeignKeyColumnDetails.push(columns);
  }

  const existingColumnName =
    isEditColumn &&
    existingForeignKeyColumnDetails.length > 0 &&
    existingForeignKeyColumnDetails?.map((item) => {
      return {
        name: item?.column_name,
        label: item?.column_name,
        icon: item?.dataTypeDetails[0]?.icon,
        value: item?.column_name,
        dataType: item?.data_type,
      };
    });

  const referencedColumnName =
    isEditColumn &&
    existingForeignKeyColumnDetails.length > 0 &&
    existingForeignKeyColumnDetails?.map((item) => {
      return {
        name: foreignKeys[0]?.referenced_column_names[0],
        label: foreignKeys[0]?.referenced_column_names[0],
        icon: item?.dataTypeDetails[0]?.icon,
        value: foreignKeys[0]?.referenced_column_names[0],
        dataType: item?.data_type,
      };
    });

  const [foreignKeyDetails, setForeignKeyDetails] = useState({
    column_names: isEditColumn ? (!createForeignKeyInEdit ? existingColumnName[0] : {}) : {},
    referenced_table_name: isEditColumn
      ? !createForeignKeyInEdit
        ? {
            name: foreignKeys[0]?.referenced_table_name,
            label: foreignKeys[0]?.referenced_table_name,
            value: foreignKeys[0]?.referenced_table_name,
          }
        : {}
      : {},
    referenced_column_names: isEditColumn ? (!createForeignKeyInEdit ? referencedColumnName[0] : {}) : {},
    on_delete: isEditColumn
      ? !createForeignKeyInEdit
        ? {
            name: foreignKeys[0]?.on_delete,
            label: foreignKeys[0]?.on_delete,
            value: foreignKeys[0]?.on_delete,
          }
        : {}
      : {},
    on_update: isEditColumn
      ? !createForeignKeyInEdit
        ? {
            name: foreignKeys[0]?.on_update,
            label: foreignKeys[0]?.on_update,
            value: foreignKeys[0]?.on_update,
          }
        : {}
      : {},
  });

  const existingReferencedTableName = foreignKeys[0]?.referenced_table_name;
  const existingReferencedColumnName = foreignKeys[0]?.referenced_column_names[0];
  const currentReferencedTableName = foreignKeyDetails?.referenced_table_name?.value;
  const currentReferencedColumnName = foreignKeyDetails?.referenced_column_names?.value;

  const handleCreateForeignKeyinEditMode = async () => {
    const data = [
      {
        column_names: [foreignKeyDetails?.column_names?.value],
        referenced_table_name: foreignKeyDetails?.referenced_table_name?.value,
        referenced_column_names: [foreignKeyDetails?.referenced_column_names?.value],
        on_delete: foreignKeyDetails?.on_delete?.value,
        on_update: foreignKeyDetails?.on_update?.value,
      },
    ];
    const { error } = await tooljetDatabaseService.createForeignKey(organizationId, selectedTable.table_name, data);

    if (error) {
      toast.error(error?.message ?? `Failed to edit foreign key`);
      return;
    }

    toast.success(`Foreign key created successfully`);
    setCreateForeignKeyInEdit(false);
    setIsForeignKeyDraweOpen(false);
  };

  const disabledDataType = dataTypes.find((e) => e.value === dataType);
  const [defaultValueLength] = useState(defaultValue?.length);
  const darkDisabledBackground = '#1f2936';
  const lightDisabledBackground = '#f4f6fa';
  const lightFocussedBackground = '#fff';
  const darkFocussedBackground = 'transparent';
  const lightBackground = '#fff';
  const darkBackground = 'transparent';

  const darkBorderHover = '#dadcde';
  const lightBorderHover = '#dadcde';

  const darkDisabledBorder = '#3a3f42';
  const lightDisabledBorder = '#dadcde';
  const lightFocussedBorder = '#dadcde';
  const darkFocussedBorder = '#3e63dd !important';
  const lightBorder = '#dadcde';
  const darkBorder = '#3a3f42 !important';
  const dropdownContainerWidth = '360px';

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const customStyles = tjdbDropdownStyles(
    darkMode,
    darkDisabledBackground,
    lightDisabledBackground,
    lightFocussedBackground,
    darkFocussedBackground,
    lightBackground,
    darkBackground,
    darkBorderHover,
    lightBorderHover,
    darkDisabledBorder,
    lightDisabledBorder,
    lightFocussedBorder,
    darkFocussedBorder,
    lightBorder,
    darkBorder,
    dropdownContainerWidth
  );

  const handleTypeChange = (value) => {
    setDataType(value);
  };

  const handleEdit = async () => {
    const colDetails = {
      column: {
        column_name: selectedColumn?.Header,
        data_type: selectedColumn?.dataType,
        ...(selectedColumn?.dataType !== 'serial' && { column_default: defaultValue }),
        constraints_type: {
          is_not_null: isNotNull,
          is_primary_key: selectedColumn?.constraints_type?.is_primary_key ?? false,
          is_unique: isUniqueConstraint,
        },
        ...(columnName !== selectedColumn?.Header ? { new_column_name: columnName } : {}),
      },
    };

    if (
      columnName !== selectedColumn?.Header ||
      defaultValue?.length > 0 ||
      defaultValue !== selectedColumn?.column_default ||
      nullValue !== isNotNull ||
      uniqueConstraintValue !== isUniqueConstraint
    ) {
      setFetching(true);
      const { error } = await tooljetDatabaseService.updateColumn(organizationId, selectedTable.table_name, colDetails);
      setFetching(false);
      if (error) {
        toast.error(error?.message ?? `Failed to edit a column in "${selectedTable.table_name}" table`);
        return;
      }
    }

    tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
      if (error) {
        toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
        return;
      }

      const { foreign_keys = [] } = data?.result || {};
      if (data?.result?.columns?.length > 0) {
        setColumns(
          data?.result?.columns.map(({ column_name, data_type, ...rest }) => ({
            Header: column_name,
            accessor: column_name,
            dataType: getColumnDataType({ column_default: rest.column_default, data_type }),
            ...rest,
          }))
        );
      }
      if (foreign_keys.length > 0) {
        setForeignKeys([...foreign_keys]);
      } else {
        setForeignKeys([]);
      }
    });
    handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
    toast.success(`Column edited successfully`);
    onClose && onClose();
  };

  const toolTipPlacementStyle = {
    width: '126px',
  };

  const handleDeleteColumn = async () => {
    const id = foreignKeys[0]?.constraint_name;
    const { error } = await tooljetDatabaseService.deleteForeignKey(organizationId, selectedTable.table_name, id);

    if (error) {
      toast.error(error?.message ?? `Failed to delete foreign key`);
      return;
    }

    setForeignKeyDetails({});
    setOnDelete(false);
    setIsForeignKeyDraweOpen(false);
    toast.success(`Foreign key deleted successfully`);
  };

  const footerStyle = {
    borderTop: '1px solid var(--slate5)',
    paddingTop: '12px',
    marginTop: '0px',
  };

  const handleEditForeignKey = async () => {
    const id = foreignKeys[0]?.constraint_name;
    const data = [
      {
        column_names: [foreignKeyDetails?.column_names?.value],
        referenced_table_name: foreignKeyDetails?.referenced_table_name?.value,
        referenced_column_names: [foreignKeyDetails?.referenced_column_names?.value],
        on_delete: foreignKeyDetails?.on_delete?.value,
        on_update: foreignKeyDetails?.on_update?.value,
      },
    ];
    const { error } = await tooljetDatabaseService.editForeignKey(organizationId, selectedTable.table_name, id, data);

    if (error) {
      toast.error(error?.message ?? `Failed to edit foreign key`);
      return;
    }

    toast.success(`Foreign key edited successfully`);

    setIsForeignKeyDraweOpen(false);
  };

  const changesInForeignKey = () => {
    const newForeignKeyDetails = [];

    if (
      currentReferencedColumnName !== existingReferencedColumnName ||
      currentReferencedTableName !== existingReferencedTableName
    ) {
      const newDetail = {};
      if (currentReferencedColumnName !== existingReferencedColumnName) {
        newDetail.columnName = currentReferencedColumnName;
      }
      if (currentReferencedTableName !== existingReferencedTableName) {
        newDetail.tableName = currentReferencedTableName;
      }
      newForeignKeyDetails.push(newDetail);
    }

    return newForeignKeyDetails;
  };

  const newChangesInForeignKey = changesInForeignKey();

  const referenceTableDetails = referencedColumnDetails.map((item) => {
    const [key, value] = Object.entries(item);
    return {
      label: key[1],
      value: key[1],
    };
  });

  useEffect(() => {
    !isEmpty(foreignKeyDetails?.column_names) ? setIsForeignKey(true) : setIsForeignKey(false);
  }, []);

  return (
    <>
      <div className="drawer-card-wrapper ">
        <div className="drawer-card-title ">
          <h3 className="primaryKey-indication-container" data-cy="create-new-column-header">
            Edit column
            {foreignKeys.length > 0 &&
              (foreignKeys[0]?.column_names[0] || foreignKeyDetails?.column_names?.value) === columnName && (
                <ToolTip
                  message={
                    <div>
                      <span>Foreign key relation</span>
                      <div className="d-flex align-item-center justify-content-between mt-2 custom-tooltip-style">
                        <span>{foreignKeys[0]?.column_names[0] || foreignKeyDetails?.column_names?.value}</span>
                        <ArrowRight />
                        <span>{`${
                          foreignKeys[0]?.referenced_table_name || foreignKeyDetails?.referenced_table_name?.value
                        }.${
                          foreignKeys[0]?.referenced_column_names[0] ||
                          foreignKeyDetails?.referenced_column_names?.value
                        }`}</span>
                      </div>
                    </div>
                  }
                  placement="right"
                  tooltipClassName="tootip-table"
                >
                  <div>
                    <span>
                      <ForeignKeyIndicator />
                    </span>
                  </div>
                </ToolTip>
              )}
            {selectedColumn.constraints_type.is_primary_key === true && (
              <ToolTip
                message={'Primary key'}
                placement="bottom"
                tooltipClassName="primary-key-tooltip"
                show={selectedColumn.constraints_type.is_primary_key === true}
              >
                <div className="primaryKey-indication">
                  <SolidIcon name="primarykey" />
                </div>
              </ToolTip>
            )}
          </h3>
        </div>

        <div className="card-body">
          <div className="edit-warning-info mb-3">
            <div className="edit-warning-icon">
              <WarningInfo />
            </div>
            <span className="edit-warning-text">
              Editing the column could break queries and apps connected with this table.
            </span>
          </div>
          <div className="mb-3 tj-app-input">
            <div className="form-label" data-cy="column-name-input-field-label">
              <span style={{ marginRight: '6px' }}>Column name</span>
              {selectedColumn?.constraints_type?.is_primary_key === true}
            </div>
            <input
              value={columnName}
              type="text"
              placeholder="Enter column name"
              className="form-control"
              data-cy="column-name-input-field"
              autoComplete="off"
              onChange={(e) => setColumnName(e.target.value)}
              autoFocus
            />
          </div>
          <div
            className="column-datatype-selector mb-3 data-type-dropdown-section"
            data-cy="data-type-dropdown-section"
          >
            <div className="form-label" data-cy="data-type-input-field-label">
              Data type
            </div>
            <ToolTip message={'Data type cannot be modified'} placement="top" tooltipClassName="tootip-table">
              <div>
                <Select
                  isDisabled={true}
                  defaultValue={selectedColumn?.dataType === 'serial' ? serialDataType : disabledDataType}
                  formatOptionLabel={formatOptionLabel}
                  options={dataTypes}
                  onChange={handleTypeChange}
                  components={{ IndicatorSeparator: () => null }}
                  styles={customStyles}
                  isSearchable={false}
                />
              </div>
            </ToolTip>
          </div>

          <div className="mb-3 tj-app-input">
            <div className="form-label" data-cy="default-value-input-field-label">
              Default value
            </div>
            <ToolTip
              message={selectedColumn?.dataType === 'serial' ? 'Serial data type values cannot be modified' : null}
              placement="top"
              tooltipClassName="tootip-table"
              show={selectedColumn?.dataType === 'serial'}
            >
              <div>
                {isEmpty(foreignKeyDetails?.column_names) ||
                isEmpty(foreignKeyDetails?.referenced_column_names) ||
                isEmpty(foreignKeyDetails?.referenced_table_name) ? (
                  <input
                    value={selectedColumn?.dataType !== 'serial' ? defaultValue : null}
                    type="text"
                    placeholder={selectedColumn?.dataType === 'serial' ? 'Auto-generated' : 'Enter default value'}
                    className={'form-control'}
                    data-cy="default-value-input-field"
                    autoComplete="off"
                    onChange={(e) => setDefaultValue(e.target.value)}
                    disabled={selectedColumn?.dataType === 'serial'}
                  />
                ) : (
                  <DropDownSelect
                    buttonClasses="border border-end-1 foreignKeyAcces-container mb-2"
                    showPlaceHolder={true}
                    options={referenceTableDetails}
                    darkMode={darkMode}
                    emptyError={
                      <div className="dd-select-alert-error m-2 d-flex align-items-center">
                        <Information />
                        No table selected
                      </div>
                    }
                    value={defaultValue ? { value: defaultValue, label: defaultValue } : {}}
                    foreignKeyAccessInRowForm={true}
                    disabled={
                      selectedColumn?.dataType === 'serial' || selectedColumn.constraints_type.is_primary_key === true
                    }
                    topPlaceHolder={selectedColumn?.dataType === 'serial' ? 'Auto-generated' : 'Enter a value'}
                    onChange={(value) => {
                      setDefaultValue(value?.value);
                    }}
                    onAdd={true}
                    addBtnLabel={'Open referenced table'}
                    foreignKeys={foreignKeys}
                    setReferencedColumnDetails={setReferencedColumnDetails}
                  />
                )}
              </div>
            </ToolTip>
            {isNotNull === true &&
            selectedColumn?.dataType !== 'serial' &&
            rows.length > 0 &&
            !isEmpty(defaultValue) &&
            defaultValueLength > 0 ? (
              <span className="form-warning-message">
                Changing the default value will NOT update the fields having existing default value
              </span>
            ) : null}
          </div>

          {/* foreign key toggle */}

          <div className="row">
            <div className="col-1">
              <label className={`form-switch`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={isForeignKey}
                  onChange={(e) => {
                    setIsForeignKey(e.target.checked);
                    // setIsForeignKeyDraweOpen(e.target.checked);
                    setCreateForeignKeyInEdit(e.target.checked);
                    if (
                      isEmpty(foreignKeyDetails?.column_names) ||
                      isEmpty(foreignKeyDetails?.referenced_column_names) ||
                      isEmpty(foreignKeyDetails?.referenced_table_name)
                    ) {
                      setIsForeignKeyDraweOpen(e.target.checked);
                    }
                  }}
                  disabled={dataType?.value === 'serial' || isEmpty(dataType) || isEmpty(columnName)}
                />
              </label>
            </div>
            <div className="col d-flex flex-column">
              <p className="m-0 p-0 fw-500">Foreign Key relation</p>
              <p className="fw-400 secondary-text mb-2">Add foreign key to check referral integrity</p>
              {!isEmpty(foreignKeyDetails?.column_names) &&
                !isEmpty(foreignKeyDetails?.referenced_column_names) &&
                !isEmpty(foreignKeyDetails?.referenced_table_name) &&
                !isEmpty(foreignKeyDetails?.on_delete) &&
                !isEmpty(foreignKeyDetails?.on_update) &&
                foreignKeyDetails?.column_names?.value === columnName && (
                  <div className="foreignKey-details mt-0" onClick={() => {}}>
                    <span className="foreignKey-text">{foreignKeyDetails?.column_names?.value}</span>
                    <div className="foreign-key-relation">
                      <ForeignKeyRelationIcon width="13" height="13" />
                    </div>
                    <span className="foreignKey-text">{`${foreignKeyDetails?.referenced_table_name?.value}.${foreignKeyDetails?.referenced_column_names?.value}`}</span>
                    <div
                      className="editForeignkey"
                      onClick={() => {
                        setIsForeignKeyDraweOpen(true);
                      }}
                    >
                      <EditIcon width="17" height="18" />
                    </div>
                  </div>
                )}
            </div>
          </div>

          <Drawer
            isOpen={isForeignKeyDraweOpen}
            position="right"
            drawerStyle={{ width: '560px' }}
            isForeignKeyRelation={true}
            onClose={() => {
              setIsForeignKeyDraweOpen(false);
              setIsForeignKey(false);
              setCreateForeignKeyInEdit(false);
            }}
          >
            <ForeignKeyTableForm
              tableName={selectedTable.table_name}
              columns={columns}
              onClose={() => {
                setIsForeignKeyDraweOpen(false);
                setIsForeignKey(false);
                setCreateForeignKeyInEdit(false);
              }}
              isEditColumn={isEditColumn}
              isForeignKeyForColumnDrawer={true}
              handleCreateForeignKey={handleCreateForeignKeyinEditMode}
              setForeignKeyDetails={setForeignKeyDetails}
              foreignKeyDetails={foreignKeyDetails}
              organizationId={organizationId}
              existingForeignKeyDetails={foreignKeys}
              handleEditForeignKey={() =>
                newChangesInForeignKey.length > 0 ? setOnChangeInForeignKey(true) : handleEditForeignKey()
              }
              createForeignKeyInEdit={createForeignKeyInEdit}
              isForeignKeyDraweOpen={isForeignKeyDraweOpen}
              onDeletePopup={() => setOnDelete(true)}
            />
          </Drawer>

          {/* <ForeignKeyRelation tableName={selectedTable.table_name} columns={columns} /> */}

          <ToolTip
            message={
              selectedColumn.constraints_type.is_primary_key === true
                ? 'Primary key values cannot be null'
                : selectedColumn.dataType === 'serial' &&
                  (selectedColumn.constraints_type.is_primary_key !== true ||
                    selectedColumn.constraints_type.is_primary_key === true)
                ? 'Serial data type cannot have null value'
                : null
            }
            placement="top"
            tooltipClassName="tooltip-table-edit-column"
            style={toolTipPlacementStyle}
            show={
              selectedColumn.constraints_type.is_primary_key === true ||
              (selectedColumn.dataType === 'serial' &&
                (selectedColumn.constraints_type.is_primary_key !== true ||
                  selectedColumn.constraints_type.is_primary_key === true))
            }
          >
            <div className="row mb-1">
              <div className="col-1">
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isNotNull}
                    onChange={(e) => {
                      setIsNotNull(e.target.checked);
                    }}
                    disabled={selectedColumn?.dataType === 'serial' || selectedColumn?.constraints_type?.is_primary_key}
                  />
                </label>
              </div>
              <div className="col d-flex flex-column">
                <p className="m-0 p-0 fw-500">{isNotNull ? 'NOT NULL' : 'NULL'}</p>
                <p className="fw-400 secondary-text">
                  {isNotNull ? 'Not null constraint is added' : 'This field can accept NULL value'}
                </p>
              </div>
            </div>
          </ToolTip>
          <ToolTip
            message={
              selectedColumn.constraints_type.is_primary_key === true
                ? 'Primary key values must be unique'
                : selectedColumn.dataType === 'serial' &&
                  (selectedColumn.constraints_type.is_primary_key !== true ||
                    selectedColumn.constraints_type.is_primary_key === true)
                ? 'Serial data type value must be unique'
                : null
            }
            placement="top"
            tooltipClassName="tooltip-table-edit-column"
            style={toolTipPlacementStyle}
            show={
              selectedColumn.constraints_type?.is_primary_key === true ||
              (selectedColumn.dataType === 'serial' &&
                (selectedColumn.constraints_type.is_primary_key !== true ||
                  selectedColumn.constraints_type.is_primary_key === true))
            }
          >
            <div className="row mb-1">
              <div className="col-1">
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      !isUniqueConstraint && selectedColumn?.constraints_type?.is_primary_key
                        ? true
                        : isUniqueConstraint
                    }
                    onChange={(e) => {
                      setIsUniqueConstraint(e.target.checked);
                    }}
                    disabled={selectedColumn?.dataType === 'serial' || selectedColumn?.constraints_type?.is_primary_key}
                  />
                </label>
              </div>
              <div className="col d-flex flex-column">
                <p className="m-0 p-0 fw-500">{isUniqueConstraint ? 'UNIQUE' : 'NOT UNIQUE'}</p>
                <p className="fw-400 secondary-text">
                  {isUniqueConstraint ? 'Unique value constraint is added' : 'Unique value constraint is not added'}
                </p>
              </div>
            </div>
          </ToolTip>
        </div>
        <DrawerFooter
          isEditMode={true}
          fetching={fetching}
          onClose={onClose}
          onEdit={handleEdit}
          shouldDisableCreateBtn={columnName === ''}
        />
      </div>
      <ConfirmDialog
        title={'Delete foreign key'}
        show={onDelete}
        message={'Deleting the foreign key relation cannot be reversed. Are you sure you want to continue?'}
        onConfirm={handleDeleteColumn}
        onCancel={() => {
          setOnDelete(false);
        }}
        darkMode={darkMode}
        confirmButtonType="dangerPrimary"
        cancelButtonType="tertiary"
        onCloseIconClick={() => {
          setOnDelete(false);
        }}
        confirmButtonText={'Continue'}
        cancelButtonText={'Cancel'}
        // confirmIcon={<DeleteIcon />}
        footerStyle={footerStyle}
      />
      <ConfirmDialog
        title={'Change in foreign key relation'}
        show={onChangeInForeignKey}
        message={
          <div>
            <span>
              Updating the foreign key relation will drop the current constraint and add the new one. This will also
              replace the default value set in the target table columns with those of the source table. Read docs to
              know more.
            </span>
            <p className="mt-3 mb-0">Are you sure you want to continue?</p>
          </div>
        }
        onConfirm={() => {
          handleEditForeignKey();
          setOnChangeInForeignKey(false);
        }}
        onCancel={() => setOnChangeInForeignKey(false)}
        darkMode={darkMode}
        confirmButtonType="primary"
        cancelButtonType="tertiary"
        onCloseIconClick={() => setOnChangeInForeignKey(false)}
        confirmButtonText={'Continue'}
        cancelButtonText={'Cancel'}
        footerStyle={footerStyle}
        // currentPrimaryKeyIcons={currentPrimaryKeyIcons}
        // newPrimaryKeyIcons={newPrimaryKeyIcons}
        isEditToolJetDbTable={true}
        foreignKeyChanges={newChangesInForeignKey}
        existingReferencedTableName={existingReferencedTableName}
        existingReferencedColumnName={existingReferencedColumnName}
        currentReferencedTableName={currentReferencedTableName}
        currentReferencedColumnName={currentReferencedColumnName}
      />
    </>
  );
};
export default ColumnForm;
