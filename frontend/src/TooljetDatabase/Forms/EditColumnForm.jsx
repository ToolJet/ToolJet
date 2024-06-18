import React, { useState, useContext } from 'react';
import Select from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel } from '../constants';
import WarningInfo from '../Icons/Edit-information.svg';
import { isEmpty } from 'lodash';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import ForeignKeyRelationIcon from '../Icons/Fk-relation.svg';
import EditIcon from '../Icons/EditColumn.svg';
import { ToolTip } from '@/_components/ToolTip';
import { ConfirmDialog } from '@/_components';
import ForeignKeyIndicator from '../Icons/ForeignKeyIndicator.svg';
import ArrowRight from '../Icons/ArrowRight.svg';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import Skeleton from 'react-loading-skeleton';

const ColumnForm = ({
  onClose,
  selectedColumn,
  setColumns,
  rows,
  isEditColumn = true,
  referencedColumnDetails,
  setReferencedColumnDetails,
  initiator,
}) => {
  const nullValue = selectedColumn?.constraints_type?.is_not_null ?? false;
  const uniqueConstraintValue = selectedColumn?.constraints_type?.is_unique ?? false;

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

  const [columnName, setColumnName] = useState(selectedColumn?.Header);
  const [defaultValue, setDefaultValue] = useState(selectedColumn?.column_default);
  const [dataType, setDataType] = useState(selectedColumn?.dataType);
  const [fetching, setFetching] = useState(false);
  const [isNotNull, setIsNotNull] = useState(nullValue);
  const [createForeignKeyInEdit, setCreateForeignKeyInEdit] = useState(false);
  const [isForeignKey, setIsForeignKey] = useState(false);
  const [isUniqueConstraint, setIsUniqueConstraint] = useState(uniqueConstraintValue);
  const [isForeignKeyDraweOpen, setIsForeignKeyDraweOpen] = useState(false);
  const [onChangeInForeignKey, setOnChangeInForeignKey] = useState(false);
  const [selectedForeignkeyIndex, setSelectedForeignKeyIndex] = useState([]);
  const [sourceColumn, setSourceColumn] = useState([]);
  const [targetTable, setTargetTable] = useState([]);
  const [targetColumn, setTargetColumn] = useState([]);
  const [onDelete, setOnDelete] = useState([]);
  const [onUpdate, setOnUpdate] = useState([]);

  //  this is for DropDownDetails component which is react select
  const [foreignKeyDefaultValue, setForeignKeyDefaultValue] = useState(() => {
    if (dataType === 'integer' || dataType === 'bigint' || dataType === 'double precision') {
      return {
        value: parseInt(selectedColumn?.column_default),
        label: parseInt(selectedColumn?.column_default),
      };
    } else if (dataType === 'booolean') {
      return {
        value: selectedColumn?.column_default === 'true' ? true : false,
        label: selectedColumn?.column_default === 'true' ? true : false,
      };
    } else {
      return {
        value: selectedColumn?.column_default,
        label: selectedColumn?.column_default,
      };
    }
  });

  const [foreignKeyDetails, setForeignKeyDetails] = useState([]);

  useEffect(() => {
    toast.dismiss();
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
  }, []);

  useEffect(() => {
    if (dataType?.value === 'boolean') {
      setIsUniqueConstraint(false);
    }
  }, [dataType]);

  useEffect(() => {
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
  }, [foreignKeys]);

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

  const existingReferencedTableName = foreignKeys[selectedForeignkeyIndex]?.referenced_table_name;
  const existingReferencedColumnName = foreignKeys[selectedForeignkeyIndex]?.referenced_column_names[0];
  const currentReferencedTableName = targetTable?.value;
  const currentReferencedColumnName = targetColumn?.value;

  const handleCreateForeignKeyinEditMode = async () => {
    const data = [
      {
        column_names: [sourceColumn?.value],
        referenced_table_name: targetTable?.value,
        referenced_column_names: [targetColumn?.value],
        on_delete: onDelete?.value,
        on_update: onUpdate?.value,
      },
    ];
    const { error } = await tooljetDatabaseService.createForeignKey(organizationId, selectedTable.table_name, data);

    if (error) {
      toast.error(error?.message ?? `Failed to edit foreign key`);
      return;
    }

    await fetchMetaDataApi();
    toast.success(`Foreign key created successfully`);
    setCreateForeignKeyInEdit(false);
    setIsForeignKeyDraweOpen(false);
  };

  const disabledDataType = dataTypes.find((e) => e.value === dataType);
  const [defaultValueLength, setDefaultValueLength] = useState(defaultValue?.length);

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
        column_default: defaultValue,
        constraints_type: {
          is_not_null: isNotNull,
        },
        ...(columnName !== selectedColumn?.Header ? { new_column_name: columnName } : {}),
      },
    };

    if (
      columnName !== selectedColumn?.Header ||
      defaultValue?.length > 0 ||
      defaultValue !== selectedColumn?.column_default ||
      nullValue !== isNotNull
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

      if (data?.result?.length > 0) {
        setColumns(
          data?.result.map(({ column_name, data_type, ...rest }) => ({
            Header: column_name,
            accessor: column_name,
            dataType: data_type,
            ...rest,
          }))
        );
      }
    });
    handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
    toast.success(`Column edited successfully`);
    onClose && onClose();
  };

  // const handleEdit = async () => {
  //   if (isEmpty(columnName)) {
  //     toast.error('Column name cannot be empty');
  //     return;
  //   }
  //   if (isEmpty(dataType?.value)) {
  //     toast.error('Data type cannot be empty');
  //     return;
  //   }
  // setFetching(true);
  // const { error } = await tooljetDatabaseService.updateColumn(
  //   organizationId,
  //   selectedTable.table_name,
  //   columnName,
  //   dataType?.value,
  //   defaultValue
  // );
  // setFetching(false);
  // if (error) {
  //   toast.error(error?.message ?? `Failed to create a new column in "${selectedTable.table_name}" table`);
  //   return;
  // }
  // toast.success(`Column created successfully`);
  //   onCreate && onCreate();
  // };

  return (
    <>
      <div className="drawer-card-wrapper ">
        <div className="drawer-card-title ">
          <h3 className="primaryKey-indication-container" data-cy="create-new-column-header">
            Edit column
            {foreignKeys.length > 0 && foreignKeys[selectedForeignkeyIndex]?.column_names[0] === columnName && (
              <ToolTip
                message={
                  <div>
                    <span>Foreign key relation</span>
                    <div className="d-flex align-item-center justify-content-between mt-2 custom-tooltip-style">
                      <span>{foreignKeys[selectedForeignkeyIndex]?.column_names[0]}</span>
                      <ArrowRight />
                      <span>{`${foreignKeys[selectedForeignkeyIndex]?.referenced_table_name}.${foreignKeys[selectedForeignkeyIndex]?.referenced_column_names[0]}`}</span>
                    </div>
                  </div>
                }
                placement="right"
                tooltipClassName="tootip-table"
              >
                <div>
                  <span className="primaryKey-indication">
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
                <span className="primaryKey-indication">
                  <SolidIcon name="primarykey" />
                </span>
              </ToolTip>
            )}
          </h3>
        </div>

        <div className="card-body edit-column-body">
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
              <div className="tj-select-text">
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
                {!isMatchingForeignKeyColumn(selectedColumn?.Header) ? (
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
                    buttonClasses="border border-end-1 foreignKeyAcces-container-drawer mb-2"
                    showPlaceHolder={true}
                    options={referenceTableDetails}
                    darkMode={darkMode}
                    emptyError={
                      <div className="dd-select-alert-error m-2 d-flex align-items-center">
                        <Information />
                        No data found
                      </div>
                    }
                    loader={
                      <div className="mx-2">
                        <Skeleton
                          height={22}
                          width={396}
                          className="skeleton"
                          style={{ margin: '15px 50px 7px 7px' }}
                        />
                        <Skeleton height={22} width={450} className="skeleton" style={{ margin: '7px 14px 7px 7px' }} />
                        <Skeleton
                          height={22}
                          width={396}
                          className="skeleton"
                          style={{ margin: '7px 50px 15px 7px' }}
                        />
                      </div>
                    }
                    isLoading={true}
                    value={foreignKeyDefaultValue}
                    foreignKeyAccessInRowForm={true}
                    disabled={
                      selectedColumn?.dataType === 'serial' || selectedColumn.constraints_type.is_primary_key === true
                    }
                    topPlaceHolder={selectedColumn?.dataType === 'serial' ? 'Auto-generated' : 'Enter a value'}
                    onChange={(value) => {
                      setForeignKeyDefaultValue(value);
                      setDefaultValue(value?.value);
                    }}
                    onAdd={true}
                    addBtnLabel={'Open referenced table'}
                    foreignKeys={foreignKeys}
                    setReferencedColumnDetails={setReferencedColumnDetails}
                    scrollEventForColumnValues={true}
                    cellColumnName={selectedColumn?.Header}
                    columnDataType={dataType}
                    isEditColumn={true}
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

          <div className="row mb-3">
            <ToolTip
              message={
                dataType === 'serial'
                  ? 'Foreign key relation cannot be created for serial type column'
                  : dataType === 'boolean'
                  ? 'Foreign key relation cannot be created for boolean type column'
                  : 'Fill in column details to create a foreign key relation'
              }
              placement="top"
              tooltipClassName="tootip-table"
              show={dataType === 'serial' || isEmpty(dataType) || isEmpty(columnName) || dataType === 'boolean'}
            >
              <div className="col-1">
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={isForeignKey}
                    onChange={(e) => {
                      if (isMatchingForeignKeyColumn(columnName)) {
                        setIsForeignKey(e.target.checked);
                        setIsForeignKeyDraweOpen(false);
                      } else {
                        setIsForeignKey(e.target.checked);
                        setIsForeignKeyDraweOpen(e.target.checked);
                        setCreateForeignKeyInEdit(e.target.checked);
                      }
                    }}
                    disabled={
                      dataType?.value === 'serial' ||
                      dataType === 'serial' ||
                      isEmpty(dataType) ||
                      isEmpty(columnName) ||
                      dataType === 'boolean'
                    }
                  />
                </label>
              </div>
            </ToolTip>
            <div className="col d-flex flex-column">
              <p className="m-0 p-0 fw-500 tj-switch-text">Foreign key relation</p>
              <p className="fw-400 secondary-text tj-text-xsm mb-2 tj-switch-text">
                Adding a foreign key relation will link this column with a column in an existing table.
              </p>
              {foreignKeyDetails?.length > 0 && isMatchingForeignKeyColumn(selectedColumn?.Header) && isForeignKey && (
                <div className="foreignKey-details mt-0">
                  <span className="foreignKey-text">
                    {isMatchingForeignKeyColumnDetails(selectedColumn?.Header)?.column_names[0]}
                  </span>
                  <div className="foreign-key-relation">
                    <ForeignKeyRelationIcon width="13" height="13" />
                  </div>
                  <span className="foreignKey-text">{`${
                    isMatchingForeignKeyColumnDetails(selectedColumn?.Header)?.referenced_table_name
                  }.${isMatchingForeignKeyColumnDetails(selectedColumn?.Header)?.referenced_column_names[0]}`}</span>
                  <div
                    className="editForeignkey"
                    onClick={() => {
                      openEditForeignKey(isMatchingForeignKeyColumnDetails(selectedColumn?.Header)?.column_names[0]);
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
              onCloseForeignKeyDrawer();
            }}
            className="tj-db-drawer"
          >
            <ForeignKeyTableForm
              tableName={selectedTable.table_name}
              columns={columns}
              onClose={() => {
                onCloseForeignKeyDrawer();
              }}
              isEditColumn={isEditColumn}
              isForeignKeyForColumnDrawer={true}
              handleCreateForeignKey={handleCreateForeignKeyinEditMode}
              setForeignKeyDetails={setForeignKeyDetails}
              foreignKeyDetails={foreignKeyDetails}
              organizationId={organizationId}
              existingForeignKeyDetails={foreignKeys}
              setSourceColumn={setSourceColumn}
              sourceColumn={sourceColumn}
              setTargetTable={setTargetTable}
              targetTable={targetTable}
              setTargetColumn={setTargetColumn}
              targetColumn={targetColumn}
              setOnDelete={setOnDelete}
              onDelete={onDelete}
              setOnUpdate={setOnUpdate}
              onUpdate={onUpdate}
              handleEditForeignKey={() =>
                newChangesInForeignKey.length > 0 ? setOnChangeInForeignKey(true) : handleEditForeignKey()
              }
              createForeignKeyInEdit={createForeignKeyInEdit}
              isForeignKeyDraweOpen={isForeignKeyDraweOpen}
              onDeletePopup={() => setOnDeletePopup(true)}
              selectedForeignkeyIndex={selectedForeignkeyIndex}
              initiator="ForeignKeyTableForm"
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
                <p className="m-0 p-0 fw-500 tj-switch-text">{isNotNull ? 'NOT NULL' : 'NULL'}</p>
                <p className="fw-400 secondary-text tj-text-xsm mb-2 tj-switch-text">
                  {isNotNull ? 'Not null constraint is added' : 'This field can accept NULL value'}
                </p>
              </div>
            </div>
          </ToolTip>
          {dataType !== 'boolean' && (
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
                      disabled={
                        selectedColumn?.dataType === 'serial' || selectedColumn?.constraints_type?.is_primary_key
                      }
                    />
                  </label>
                </div>
                <div className="col d-flex flex-column">
                  <p className="m-0 p-0 fw-500 tj-switch-text">
                    {isUniqueConstraint || (!isUniqueConstraint && selectedColumn?.constraints_type?.is_primary_key)
                      ? 'UNIQUE'
                      : 'NOT UNIQUE'}
                  </p>
                  <p className="fw-400 secondary-text tj-text-xsm tj-switch-text">
                    {isUniqueConstraint || (!isUniqueConstraint && selectedColumn?.constraints_type?.is_primary_key)
                      ? 'Unique value constraint is added'
                      : 'Unique value constraint is not added'}
                  </p>
                </div>
              </div>
            </ToolTip>
          )}
        </div>
        <DrawerFooter
          isEditMode={true}
          fetching={fetching}
          onClose={onClose}
          onEdit={() => {
            if (foreignKeyDetails?.length > 0 && !isForeignKey && isMatchingForeignKeyColumn(columnName)) {
              setOnDeletePopup(true);
            } else {
              handleEdit();
            }
          }}
          shouldDisableCreateBtn={columnName === ''}
          showToolTipForFkOnReadDocsSection={true}
          initiator={initiator}
        />
      </div>
      <ConfirmDialog
        title={'Delete foreign key relation'}
        show={onDeletePopup}
        message={'Deleting the foreign key relation cannot be reversed. Are you sure you want to continue?'}
        onConfirm={
          foreignKeyDetails?.length > 0 && !isForeignKey && isMatchingForeignKeyColumn(columnName)
            ? handleEdit
            : handleDeleteForeignKeyColumn
        }
        onCancel={() => {
          setOnDeletePopup(false);
        }}
        darkMode={darkMode}
        confirmButtonType="dangerPrimary"
        cancelButtonType="tertiary"
        onCloseIconClick={() => {
          setOnDeletePopup(false);
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
