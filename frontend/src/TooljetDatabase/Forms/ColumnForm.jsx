import React, { useState, useContext, useEffect, useMemo } from 'react';
import cx from 'classnames';
import Select, { components } from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel } from '../constants';
import Drawer from '@/_ui/Drawer';
import ForeignKeyTableForm from './ForeignKeyTableForm';
import Tick from '../Icons/Tick.svg';
import ForeignKeyRelationIcon from '../Icons/Fk-relation.svg';
import EditIcon from '../Icons/EditColumn.svg';
import { ConfirmDialog } from '@/_components';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import { ToolTip } from '@/_components/ToolTip';
import Information from '@/_ui/Icon/solidIcons/Information';
import './styles.scss';
import Skeleton from 'react-loading-skeleton';
import DateTimePicker from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/DateTimePicker';
import { getLocalTimeZone, timeZonesWithOffsets } from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/util';
import defaultStyles from '@/_ui/Select/styles';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';

const ColumnForm = ({
  onCreate,
  onClose,
  rows,
  isEditColumn = false,
  referencedColumnDetails,
  setReferencedColumnDetails,
  initiator,
}) => {
  const [columnName, setColumnName] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [dataType, setDataType] = useState();
  const [fetching, setFetching] = useState(false);

  const { organizationId, selectedTable, foreignKeys } = useContext(TooljetDatabaseContext);
  const [timezone, setTimezone] = useState(getLocalTimeZone());
  const [onDeletePopup, setOnDeletePopup] = useState(false);
  const [isNotNull, setIsNotNull] = useState(false);
  const [isForeignKey, setIsForeignKey] = useState(false);
  const [isUniqueConstraint, setIsUniqueConstraint] = useState(false);
  const [isForeignKeyDraweOpen, setIsForeignKeyDraweOpen] = useState(false);
  const [sourceColumn, setSourceColumn] = useState([]);
  const [targetTable, setTargetTable] = useState([]);
  const [targetColumn, setTargetColumn] = useState([]);
  const [onDelete, setOnDelete] = useState([]);
  const [onUpdate, setOnUpdate] = useState([]);

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { Option } = components;
  //  this is for DropDownDetails component which is react select
  const [foreignKeyDefaultValue, setForeignKeyDefaultValue] = useState({
    value: '',
    label: '',
  });
  const isTimestamp = dataType?.value === 'timestamp with time zone';
  const isJsonbColumnType = dataType?.value === 'jsonb';

  const tzOptions = useMemo(() => timeZonesWithOffsets(), []);

  const tzDictionary = useMemo(() => {
    const dict = {};
    tzOptions.forEach((option) => {
      dict[option.value] = option;
    });
    return dict;
  }, []);

  const [foreignKeyDetails, setForeignKeyDetails] = useState({
    column_names: [],
    referenced_table_name: [],
    referenced_column_names: [],
    on_delete: [],
    on_update: [],
  });

  const columns = {
    column_name: columnName,
    data_type: dataType?.value,
    constraints_type: {
      is_not_null: isNotNull,
      is_primary_key: false,
      is_unique: isUniqueConstraint,
    },
    dataTypeDetails: dataTypes.filter((item) => item.value === dataType),
    column_default: defaultValue,
  };

  const darkDisabledBackground = '#1f2936';
  const lightDisabledBackground = '#f4f6fa';
  const lightFocussedBackground = '#f8faff';
  const darkFocussedBackground = '#15192d';
  const lightBackground = 'transparent';
  const darkBackground = 'transparent';

  const darkBorderHover = '#4c5155';
  const lightBorderHover = '#c1c8cd';

  const darkDisabledBorder = '#3a3f42';
  const lightDisabledBorder = '#dadcde';
  const lightFocussedBorder = '#3e63dd !important';
  const darkFocussedBorder = '#3e63dd !important';
  const lightBorder = '#dadcde';
  const darkBorder = '#3a3f42';
  const dropdownContainerWidth = '100%';

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

  useEffect(() => {
    toast.dismiss();
  }, []);

  useEffect(() => {
    if (dataType?.value === 'boolean') {
      setIsUniqueConstraint(false);
    }
  }, [dataType]);

  const handleTypeChange = (value) => {
    if (value.value === 'serial') {
      setIsUniqueConstraint(true);
      setIsNotNull(true);
    }
    setDataType(value);
  };

  const handleCreate = async () => {
    const isSerialType = dataType.value === 'serial' ? true : false;
    if (isEmpty(columnName)) {
      toast.error('Column name cannot be empty');
      return;
    }
    if (isEmpty(dataType.value)) {
      toast.error('Data type cannot be empty');
      return;
    }

    const isCheckingValues = foreignKeyDetails?.length > 0 && isForeignKey ? true : false;

    setFetching(true);
    const reqConfigurations = {};
    if (dataType.value === 'timestamp with time zone') reqConfigurations['timezone'] = timezone;

    const { error } = await tooljetDatabaseService.createColumn(
      organizationId,
      selectedTable.table_name,
      columnName,
      dataType.value,
      defaultValue,
      isNotNull,
      isUniqueConstraint,
      isSerialType,
      isCheckingValues,
      foreignKeyDetails,
      reqConfigurations
    );
    setFetching(false);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new column in "${selectedTable.table_name}" table`);
      return;
    }
    toast.success(`Column created successfully`);
    onCreate && onCreate();
  };

  const handleCreateForeignKey = () => {
    setIsForeignKeyDraweOpen(false);
    // toast.success(`Foreign key Added successfully for selected column`);
  };

  const referenceTableDetails = referencedColumnDetails?.map((item) => {
    const [key, _value] = Object.entries(item);
    return {
      label: key[1],
      value: key[1],
    };
  });

  function isMatchingForeignKeyColumn(columnName) {
    return (
      foreignKeyDetails?.length > 0 &&
      foreignKeyDetails?.some((foreignKey) => foreignKey.column_names[0] === columnName)
    );
  }

  const handleDeleteForeignKeyRelationInCreate = () => {
    const newForeignKeyDetails = [...foreignKeyDetails]; // Make a copy of the existing array
    newForeignKeyDetails.splice(0, 1); // Remove the item at the specified index
    setForeignKeyDetails(newForeignKeyDetails);
    setIsForeignKeyDraweOpen(false);
    setIsForeignKey(false);
    setOnDeletePopup(false);
  };

  const footerStyle = {
    borderTop: '1px solid var(--slate5)',
    paddingTop: '12px',
    marginTop: '0px',
  };

  const handleOpenDeletePopup = () => {
    setOnDeletePopup(true);
  };

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
    <div className="drawer-card-wrapper ">
      <div className="drawer-card-title ">
        <h3 className="" data-cy="create-new-column-header">
          Create a new column
        </h3>
      </div>
      <div className="card-body create-drawer-body">
        <div className="mb-3 tj-app-input">
          <div className="form-label" data-cy="column-name-input-field-label">
            Column name
          </div>
          <input
            value={columnName}
            type="text"
            placeholder="Enter column name"
            className="form-control"
            data-cy="column-name-input-field"
            autoComplete="off"
            onChange={(e) => {
              if (isForeignKey && foreignKeyDetails.length)
                setForeignKeyDetails((prevFkDetails) => {
                  const fkDetailsRef = prevFkDetails[0];
                  return [{ ...fkDetailsRef, column_names: [e.target.value] }];
                });
              setColumnName(e.target.value);
            }}
            autoFocus
          />
        </div>
        <div className="column-datatype-selector mb-3 data-type-dropdown-section" data-cy="data-type-dropdown-section">
          <div className="form-label" data-cy="data-type-input-field-label">
            Data type
          </div>
          <Select
            //useMenuPortal={false}
            placeholder="Select data type"
            value={dataType}
            formatOptionLabel={formatOptionLabel}
            options={dataTypes}
            onChange={handleTypeChange}
            components={{ Option: CustomSelectOption, IndicatorSeparator: () => null }}
            styles={customStyles}
          />
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
              components={{ Option: CustomSelectOption, IndicatorSeparator: () => null }}
              styles={defaultStyles(darkMode, '100%')}
            />
          </div>
        )}
        <div className="mb-3 tj-app-input">
          <div className="form-label" data-cy="default-value-input-field-label">
            Default value
          </div>
          <ToolTip
            message={dataType === 'serial' ? 'Serial data type values cannot be modified' : null}
            placement="top"
            tooltipClassName="tootip-table"
            show={dataType === 'serial'}
          >
            <div>
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
              ) : !foreignKeyDetails?.length > 0 && !isForeignKey ? (
                <input
                  value={defaultValue}
                  type="text"
                  placeholder={dataType?.value === 'serial' ? 'Auto-generated' : 'Enter default value'}
                  className={cx({
                    'form-error':
                      dataType?.value !== 'serial' && isNotNull === true && defaultValue.length <= 0 && rows.length > 0,
                    'form-control': true,
                  })}
                  data-cy="default-value-input-field"
                  autoComplete="off"
                  onChange={(e) => setDefaultValue(e.target.value)}
                  disabled={dataType?.value === 'serial'}
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
                    <>
                      <Skeleton height={22} width={396} className="skeleton" style={{ margin: '15px 50px 7px 7px' }} />
                      <Skeleton height={22} width={450} className="skeleton" style={{ margin: '7px 14px 7px 7px' }} />
                      <Skeleton height={22} width={396} className="skeleton" style={{ margin: '7px 50px 15px 7px' }} />
                    </>
                  }
                  isLoading={true}
                  value={foreignKeyDefaultValue}
                  foreignKeyAccessInRowForm={true}
                  disabled={dataType === 'serial'}
                  topPlaceHolder={dataType === 'serial' ? 'Auto-generated' : 'Enter a value'}
                  onChange={(value) => {
                    setForeignKeyDefaultValue(value);
                    setDefaultValue(value?.value);
                  }}
                  onAdd={true}
                  addBtnLabel={'Open referenced table'}
                  foreignKeys={foreignKeyDetails}
                  setReferencedColumnDetails={setReferencedColumnDetails}
                  scrollEventForColumnValues={true}
                  cellColumnName={columnName}
                  columnDataType={dataType?.value}
                  isCreateColumn={true}
                />
              )}
            </div>
          </ToolTip>
          {isNotNull === true && dataType?.value !== 'serial' && rows.length > 0 && defaultValue.length <= 0 ? (
            <span className="form-error-message">
              Default value is required to populate this field in existing rows as NOT NULL constraint is added
            </span>
          ) : null}
        </div>
        <div className="row mb-3">
          <ToolTip
            message={
              dataType?.value === 'serial'
                ? 'Foreign key relation cannot be created for serial type column'
                : dataType?.value === 'boolean'
                ? 'Foreign key relation cannot be created for boolean type column'
                : dataType?.value === 'timestamp with time zone'
                ? 'Foreign key relation cannot be created with this data type'
                : isJsonbColumnType
                ? 'Foreign key relation cannot be created for jsonb type column'
                : 'Fill in column details to create a foreign key relation'
            }
            placement="top"
            tooltipClassName="tootip-table"
            show={
              isEmpty(dataType) ||
              isEmpty(columnName) ||
              ['boolean', 'serial', 'timestamp with time zone', 'jsonb'].includes(dataType?.value)
            }
          >
            <div className="col-1">
              <label className={`form-switch`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={isForeignKey}
                  onChange={(e) => {
                    if (foreignKeyDetails?.length > 0) {
                      setIsForeignKey(e.target.checked);
                      setIsForeignKeyDraweOpen(false);
                    } else {
                      setIsForeignKey(e.target.checked);
                      setIsForeignKeyDraweOpen(e.target.checked);
                    }
                  }}
                  disabled={
                    isEmpty(dataType) ||
                    isEmpty(columnName) ||
                    ['serial', 'boolean', 'timestamp with time zone', 'jsonb'].includes(dataType?.value)
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
            {foreignKeyDetails?.length > 0 &&
              isForeignKey &&
              foreignKeyDetails?.map((detail, index) => (
                <div className="foreignKey-details mt-0" key={index} onClick={() => {}}>
                  <span className="foreignKey-text">{detail.column_names[0]}</span>
                  <div className="foreign-key-relation">
                    <ForeignKeyRelationIcon width="13" height="13" />
                  </div>
                  <span className="foreignKey-text">{`${detail.referenced_table_name}.${detail.referenced_column_names[0]}`}</span>
                  <div
                    className="editForeignkey"
                    onClick={() => {
                      setIsForeignKeyDraweOpen(true);
                    }}
                  >
                    <EditIcon width="17" height="18" />
                  </div>
                </div>
              ))}
            {/* {foreignKeyDetails?.length > 0 && (
              <p className="fw-400 secondary-text tj-text-xsm mb-2">Create column to add foreign key relation</p>
            )} */}
          </div>
        </div>
        <Drawer
          isOpen={isForeignKeyDraweOpen}
          position="right"
          drawerStyle={{ width: '560px' }}
          isForeignKeyRelation={true}
          onClose={() => {
            setIsForeignKeyDraweOpen(false);
          }}
          className="tj-db-drawer"
        >
          <ForeignKeyTableForm
            tableName={selectedTable.table_name}
            columns={columns}
            onClose={() => {
              setIsForeignKeyDraweOpen(false);
            }}
            isCreateColumn={true}
            isForeignKeyForColumnDrawer={true}
            handleCreateForeignKey={handleCreateForeignKey}
            setForeignKeyDetails={setForeignKeyDetails}
            // isRequiredFieldsExistForCreateTableOperation={isRequiredFieldsExistForCreateTableOperation}
            foreignKeyDetails={foreignKeyDetails}
            organizationId={organizationId}
            existingForeignKeyDetails={foreignKeys}
            onDeletePopup={handleOpenDeletePopup}
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
            initiator="ForeignKeyTableForm"
          />
        </Drawer>
        <div className="row mb-3">
          <div className="col-1">
            <label className={`form-switch`}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={isNotNull}
                onChange={(e) => {
                  setIsNotNull(e.target.checked);
                }}
                disabled={dataType?.value === 'serial'}
              />
            </label>
          </div>
          <div className="col d-flex flex-column">
            <p className="m-0 p-0 fw-500 tj-switch-text">{'NOT NULL'}</p>
            <p className="fw-400 secondary-text tj-text-xsm mb-2 tj-switch-text">
              This constraint will restrict entry of NULL values in this column.
            </p>
          </div>
        </div>
        <div className="row mb-3">
          <ToolTip
            message={
              dataType?.value === 'boolean'
                ? 'Unique constraint cannot be added for boolean type column'
                : dataType?.value === 'timestamp with time zone'
                ? 'Unique constraint cannot be added for this type column'
                : isJsonbColumnType
                ? 'Unique constraint cannot be added for JSON type column'
                : ''
            }
            placement="top"
            tooltipClassName="tootip-table"
            show={['boolean', 'timestamp with time zone', 'jsonb'].includes(dataType?.value)}
          >
            <div className="col-1">
              <label className={`form-switch`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={isUniqueConstraint}
                  onChange={(e) => {
                    setIsUniqueConstraint(e.target.checked);
                  }}
                  disabled={['serial', 'boolean', 'timestamp with time zone', 'jsonb'].includes(dataType?.value)}
                />
              </label>
            </div>
          </ToolTip>
          <div className="col d-flex flex-column">
            <p className="m-0 p-0 fw-500 tj-switch-text">{'UNIQUE'}</p>
            <p className="fw-400 secondary-text tj-text-xsm">
              This constraint restricts entry of duplicate values in this column.
            </p>
          </div>
        </div>
      </div>
      <DrawerFooter
        fetching={fetching}
        onClose={onClose}
        onCreate={handleCreate}
        shouldDisableCreateBtn={
          isEmpty(columnName) ||
          isEmpty(dataType) ||
          (isNotNull === true && rows.length > 0 && isEmpty(defaultValue) && dataType?.value !== 'serial') ||
          disabledSaveButton
        }
        showToolTipForFkOnReadDocsSection={true}
        initiator={initiator}
      />
      <ConfirmDialog
        title={'Delete foreign key relation'}
        show={onDeletePopup}
        message={'Deleting the foreign key relation cannot be reversed. Are you sure you want to continue?'}
        onConfirm={() => {
          handleDeleteForeignKeyRelationInCreate();
        }}
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
    </div>
  );
};
export default ColumnForm;
