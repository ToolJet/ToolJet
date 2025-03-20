import React, { useState, useContext, useEffect, useMemo } from 'react';
import Select, { components } from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import defaultStyles from '@/_ui/Select/styles';
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
import Skeleton from 'react-loading-skeleton';
import Tick from '@/_ui/Icon/bulkIcons/Tick';
import DateTimePicker from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/DateTimePicker';
import { getLocalTimeZone, timeZonesWithOffsets } from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/util';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';
import Switch from '@/AppBuilder/CodeBuilder/Elements/Switch';

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
    configurations,
    setConfigurations,
  } = useContext(TooljetDatabaseContext);

  const [columnName, setColumnName] = useState(selectedColumn?.Header);
  const [defaultValue, setDefaultValue] = useState(selectedColumn?.column_default);
  const [dataType, setDataType] = useState(selectedColumn?.dataType);
  const [onDeletePopup, setOnDeletePopup] = useState(false);
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
  const isTimestamp = dataType === 'timestamp with time zone';
  const isJsonbColumnType = dataType === 'jsonb';
  const { Option } = components;

  //  this is for DropDownDetails component which is react select
  const [foreignKeyDefaultValue, setForeignKeyDefaultValue] = useState(() => {
    console.log('manish :: foreignKeyDefaultValue state', { dataType, selectedColumn });
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

  const columnUuid = configurations?.columns?.column_names?.[selectedColumn?.Header];
  const columnConfigurations = configurations?.columns?.configurations?.[columnUuid] || {};
  const [timezone, setTimezone] = useState(columnConfigurations?.timezone || getLocalTimeZone());

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

  const CustomSelectOption = (props) => (
    <Option {...props}>
      <div className="selected-dropdownStyle d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center justify-content-start">
          <div>{props.data.icon}</div>
          <span className="dataType-dropdown-label">{props.data.label}</span>
          <span className="dataType-dropdown-value">{props.data.name}</span>
        </div>
        <div>
          {dataType?.value === props.data.value ? (
            <div>
              <Tick width="16" height="16" />
            </div>
          ) : null}
        </div>
      </div>
    </Option>
  );

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

  const fetchMetaDataApi = async () => {
    tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
      if (error) {
        toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
        return;
      }

      const { foreign_keys = [] } = data?.result || {};
      setConfigurations(data?.result?.configurations || {});
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
  };

  const onCloseForeignKeyDrawer = () => {
    setIsForeignKeyDraweOpen(false);
    setCreateForeignKeyInEdit(false);
    setSourceColumn([]);
    setTargetTable([]);
    setTargetColumn([]);
    setOnDelete([]);
    setOnUpdate([]);
  };

  const getForeignKeyColumnDetails = foreignKeys?.filter((item) => item.column_names[0] === selectedColumn?.Header); // this is for getting current foreign key column

  const handleEdit = async () => {
    console.log('manish :: handleEdit', { selectedColumn, defaultValue });
    const reqConfigurations = {};
    if (selectedColumn?.dataType === 'timestamp with time zone') reqConfigurations['timezone'] = timezone;

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
        configurations: { ...columnConfigurations, ...reqConfigurations },
        ...(columnName !== selectedColumn?.Header ? { new_column_name: columnName } : {}),
      },

      ...(isForeignKey === false && { foreignKeyIdToDelete: getForeignKeyColumnDetails[0]?.constraint_name }),
    };

    if (
      columnName !== selectedColumn?.Header ||
      defaultValue?.length > 0 ||
      defaultValue !== selectedColumn?.column_default ||
      nullValue !== isNotNull ||
      uniqueConstraintValue !== isUniqueConstraint ||
      !isForeignKey
    ) {
      setFetching(true);
      const { error } = await tooljetDatabaseService.updateColumn(organizationId, selectedTable.table_name, colDetails);
      setFetching(false);
      if (error) {
        toast.error(error?.message ?? `Failed to edit a column in "${selectedTable.table_name}" table`);
        return;
      }
    }

    fetchMetaDataApi();
    handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
    toast.success(`Column edited successfully`);
    onClose && onClose();
  };

  const toolTipPlacementStyle = {
    width: '126px',
  };

  const handleDeleteForeignKeyColumn = async () => {
    const id = foreignKeys[selectedForeignkeyIndex]?.constraint_name;
    const { error } = await tooljetDatabaseService.deleteForeignKey(organizationId, selectedTable.table_name, id);

    if (error) {
      toast.error(error?.message ?? `Failed to delete foreign key`);
      return;
    }

    fetchMetaDataApi();
    setOnDeletePopup(false);
    setIsForeignKey(false);
    setForeignKeyDetails([]);
    onCloseForeignKeyDrawer();
    toast.success(`Foreign key deleted successfully`);
  };

  const footerStyle = {
    borderTop: '1px solid var(--slate5)',
    paddingTop: '12px',
    marginTop: '0px',
  };

  const handleEditForeignKey = async () => {
    const id = foreignKeys[selectedForeignkeyIndex]?.constraint_name;
    const data = [
      {
        column_names: [sourceColumn?.value],
        referenced_table_name: targetTable?.value,
        referenced_column_names: [targetColumn?.value],
        on_delete: onDelete?.value,
        on_update: onUpdate?.value,
      },
    ];

    const { error } = await tooljetDatabaseService.editForeignKey(organizationId, selectedTable.table_name, id, data);

    if (error) {
      toast.error(error?.message ?? `Failed to edit foreign key`);
      return;
    }

    fetchMetaDataApi();
    onCloseForeignKeyDrawer();
    toast.success(`Foreign key edited successfully`);
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

  const tzOptions = useMemo(() => timeZonesWithOffsets(), []);

  const tzDictionary = useMemo(() => {
    const dict = {};
    tzOptions.forEach((option) => {
      dict[option.value] = option;
    });
    return dict;
  }, []);

  const newChangesInForeignKey = changesInForeignKey();

  const referenceTableDetails = referencedColumnDetails.map((item) => {
    const [key, value] = Object.entries(item);
    return {
      label: key[1],
      value: key[1],
    };
  });

  const openEditForeignKey = (sourceColumnName) => {
    setIsForeignKeyDraweOpen(true);
    const existingForeignKeyColumn = foreignKeyDetails?.filter((obj) => obj.column_names[0] === sourceColumnName);
    const existingForeignKeyIndex = foreignKeyDetails?.findIndex((obj) => obj.column_names[0] === sourceColumnName);
    setSelectedForeignKeyIndex(existingForeignKeyIndex);
    setSourceColumn({
      value: existingForeignKeyColumn[0]?.column_names[0],
      label: existingForeignKeyColumn[0]?.column_names[0],
      dataType: selectedColumn?.dataType,
    });
    setTargetTable({
      value: existingForeignKeyColumn[0]?.referenced_table_name,
      label: existingForeignKeyColumn[0]?.referenced_table_name,
    });
    setTargetColumn({
      value: existingForeignKeyColumn[0]?.referenced_column_names[0],
      label: existingForeignKeyColumn[0]?.referenced_column_names[0],
      dataType: selectedColumn?.dataType,
    });
    setOnDelete({
      value: existingForeignKeyColumn[0]?.on_delete,
      label: existingForeignKeyColumn[0]?.on_delete,
    });
    setOnUpdate({
      value: existingForeignKeyColumn[0]?.on_update,
      label: existingForeignKeyColumn[0]?.on_update,
    });
  };

  useEffect(() => {
    const existingForeignKeyIndex = foreignKeyDetails?.findIndex((obj) => obj.column_names[0] === columnName);
    setSelectedForeignKeyIndex(existingForeignKeyIndex);
    isMatchingForeignKeyColumn(columnName) ? setIsForeignKey(true) : setIsForeignKey(false);
  }, []);

  function isMatchingForeignKeyColumn(columnName) {
    return foreignKeys.some((foreignKey) => foreignKey.column_names[0] === columnName);
  }

  function isMatchingForeignKeyColumnDetails(columnName) {
    const matchingColumn = foreignKeyDetails.find((foreignKey) => foreignKey.column_names[0] === columnName);
    return matchingColumn;
  }

  const [disabledSaveButton, setDisabledSaveButton] = useState(true);

  useEffect(() => {
    setDisabledSaveButton(columnName === '');
  }, [columnName]);

  const handleInputError = (bool = false) => {
    setDisabledSaveButton(bool);
  };

  const codehinterCallback = React.useCallback(() => {
    return (
      <CodeHinter
        type="tjdbHinter"
        inEditor={false}
        initialValue={defaultValue ? JSON.stringify(defaultValue) : ''}
        lang="javascript"
        onChange={(value) => {
          const [_, __, resolvedValue] = resolveReferences(`{{${value}}}`);
          setDefaultValue(resolvedValue);
        }}
        componentName={`{} ${columnName}`}
        errorCallback={handleInputError}
        lineNumbers={false}
        placeholder="{}"
        columnName={columnName}
        showErrorMessage={true}
      />
    );
  }, [defaultValue]);

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
              onChange={(e) => {
                setForeignKeyDetails((prevState) => {
                  return prevState.map((item) => {
                    return {
                      ...item,
                      column_names: item.column_names.map((col) => {
                        return col === columnName ? e.target.value : col;
                      }),
                    };
                  });
                });
                setColumnName(e.target.value);
              }}
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
          {isTimestamp && (
            <div
              className="column-datatype-selector mb-3 data-type-dropdown-section"
              data-cy="timezone-type-dropdown-section"
            >
              <div className="form-label" data-cy="data-type-input-field-label">
                Display time
              </div>
              <Select
                //useMenuPortal={false}
                placeholder="Select Timezone"
                value={tzDictionary[timezone]}
                formatOptionLabel={formatOptionLabel}
                options={tzOptions}
                onChange={(option) => {
                  setTimezone(option.value);
                }}
                styles={defaultStyles(darkMode, '100%')}
                components={{ Option: CustomSelectOption, IndicatorSeparator: () => null }}
              />
            </div>
          )}
          <div className="mb-3 tj-app-input">
            <div className="d-flex align-items-center justify-content-between">
              <div className="form-label" data-cy="default-value-input-field-label">
                Default value
              </div>
              {isMatchingForeignKeyColumn(selectedColumn?.Header) && (
                <ToolTip
                  message={'Set the default value for the column to Null'}
                  placement="top"
                  tooltipClassName="tootip-table"
                  show={isMatchingForeignKeyColumn(selectedColumn?.Header)}
                >
                  <div className="d-flex align-items-center custom-gap-4">
                    <span className="form-label">Set to Null</span>
                    <label className={`form-switch`}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={defaultValue === null}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForeignKeyDefaultValue({ label: null, value: null });
                            setDefaultValue(null);
                          } else {
                            setForeignKeyDefaultValue({ label: '', value: '' });
                            setDefaultValue('');
                          }
                        }}
                      />
                    </label>
                  </div>
                </ToolTip>
              )}
            </div>

            <ToolTip
              message={selectedColumn?.dataType === 'serial' ? 'Serial data type values cannot be modified' : null}
              placement="top"
              tooltipClassName="tootip-table"
              show={selectedColumn?.dataType === 'serial'}
            >
              <div style={{ position: 'relative' }}>
                {isTimestamp ? (
                  <DateTimePicker
                    timestamp={defaultValue}
                    setTimestamp={setDefaultValue}
                    timezone={timezone}
                    isClearable={true}
                    isPlaceholderEnabled={true}
                  />
                ) : isJsonbColumnType ? (
                  <div className="tjdb-codehinter-wrapper-drawer" onKeyDown={(e) => e.stopPropagation()}>
                    {codehinterCallback()}
                  </div>
                ) : !isMatchingForeignKeyColumn(selectedColumn?.Header) ? (
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
                  <>
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
                        <>
                          <Skeleton
                            height={22}
                            width={396}
                            className="skeleton"
                            style={{ margin: '15px 50px 7px 7px' }}
                          />
                          <Skeleton
                            height={22}
                            width={450}
                            className="skeleton"
                            style={{ margin: '7px 14px 7px 7px' }}
                          />
                          <Skeleton
                            height={22}
                            width={396}
                            className="skeleton"
                            style={{ margin: '7px 50px 15px 7px' }}
                          />
                        </>
                      }
                      isLoading={true}
                      value={foreignKeyDefaultValue}
                      foreignKeyAccessInRowForm={true}
                      disabled={
                        selectedColumn?.dataType === 'serial' || selectedColumn.constraints_type.is_primary_key === true
                      }
                      topPlaceHolder={
                        selectedColumn?.dataType === 'serial'
                          ? 'Auto-generated'
                          : foreignKeyDefaultValue?.value === null
                          ? 'Null'
                          : 'Enter a value'
                      }
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
                    {defaultValue === null && <p className={darkMode === true ? 'null-tag-dark' : 'null-tag'}>Null</p>}
                  </>
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
                  : dataType === 'timestamp with time zone'
                  ? 'Foreign key relation cannot be created for this data type'
                  : dataType === 'jsonb'
                  ? 'Foreign key relation cannot be created for JSON data type'
                  : 'Fill in column details to create a foreign key relation'
              }
              placement="top"
              tooltipClassName="tootip-table"
              show={
                isEmpty(dataType) ||
                isEmpty(columnName) ||
                ['boolean', 'serial', 'timestamp with time zone', 'jsonb'].includes(dataType)
              }
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
                      isEmpty(dataType) ||
                      isEmpty(columnName) ||
                      ['boolean', 'serial', 'timestamp with time zone', 'jsonb'].includes(dataType)
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
                    {isMatchingForeignKeyColumnDetails(columnName)?.column_names[0]}
                  </span>
                  <div className="foreign-key-relation">
                    <ForeignKeyRelationIcon width="13" height="13" />
                  </div>
                  <span className="foreignKey-text">{`${
                    isMatchingForeignKeyColumnDetails(columnName)?.referenced_table_name
                  }.${isMatchingForeignKeyColumnDetails(columnName)?.referenced_column_names[0]}`}</span>
                  <div
                    className="editForeignkey"
                    onClick={() => {
                      openEditForeignKey(isMatchingForeignKeyColumnDetails(columnName)?.column_names[0]);
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
                <p className="m-0 p-0 fw-500 tj-switch-text">NOT NULL</p>
                <p className="fw-400 secondary-text tj-text-xsm mb-2 tj-switch-text">
                  This constraint will restrict entry of NULL values in this column.
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
                : selectedColumn.dataType === 'boolean'
                ? 'Unique constraint cannot be added for boolean type column'
                : selectedColumn.dataType === 'timestamp with time zone'
                ? 'Unique constraint cannot be added for this type column'
                : selectedColumn.dataType === 'jsonb'
                ? 'Unique constraint cannot be added for JSON type column'
                : null
            }
            placement="top"
            tooltipClassName="tooltip-table-edit-column"
            style={toolTipPlacementStyle}
            show={
              selectedColumn.constraints_type?.is_primary_key === true ||
              (selectedColumn.dataType === 'serial' &&
                (selectedColumn.constraints_type.is_primary_key !== true ||
                  selectedColumn.constraints_type.is_primary_key === true)) ||
              ['boolean', 'timestamp with time zone', 'jsonb'].includes(selectedColumn.dataType)
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
                      ['serial', 'boolean', 'timestamp with time zone', 'jsonb'].includes(selectedColumn?.dataType) ||
                      selectedColumn?.constraints_type?.is_primary_key
                    }
                  />
                </label>
              </div>
              <div className="col d-flex flex-column">
                <p className="m-0 p-0 fw-500 tj-switch-text">{'UNIQUE'}</p>
                <p className="fw-400 secondary-text tj-text-xsm tj-switch-text">
                  This constraint restricts entry of duplicate values in this column.
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
          shouldDisableCreateBtn={disabledSaveButton}
          showToolTipForFkOnReadDocsSection={true}
          initiator={initiator}
        />
      </div>
      <ConfirmDialog
        title={'Delete foreign key'}
        show={onDeletePopup}
        message={'Deleting the foreign key relation cannot be reversed. Are you sure you want to continue?'}
        onConfirm={handleDeleteForeignKeyColumn}
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
