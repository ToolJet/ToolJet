import React, { useState, useContext, useEffect } from 'react';
import cx from 'classnames';
import Select, { components } from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel } from '../constants';
import Tick from '../Icons/Tick.svg';
import ForeignKeyRelationIcon from '../Icons/Fk-relation.svg';
import EditIcon from '../Icons/EditColumn.svg';
import './styles.scss';

const ColumnForm = ({ onCreate, onClose, rows }) => {
  const [columnName, setColumnName] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [dataType, setDataType] = useState();
  const [fetching, setFetching] = useState(false);
  const { organizationId, selectedTable } = useContext(TooljetDatabaseContext);
  const [isNotNull, setIsNotNull] = useState(false);
  const [isForeignKey, setIsForeignKey] = useState(false);
  const [isUniqueConstraint, setIsUniqueConstraint] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { Option } = components;

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

  const handleTypeChange = (value) => {
    if (value.value === 'serial') {
      setIsUniqueConstraint(true);
      setIsNotNull(true);
    } else {
      setIsUniqueConstraint(false);
      setIsNotNull(false);
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
    setFetching(true);
    const { error } = await tooljetDatabaseService.createColumn(
      organizationId,
      selectedTable.table_name,
      columnName,
      dataType.value,
      defaultValue,
      isNotNull,
      isUniqueConstraint,
      isSerialType
    );
    setFetching(false);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new column in "${selectedTable.table_name}" table`);
      return;
    }
    toast.success(`Column created successfully`);
    onCreate && onCreate();
  };

  return (
    <div className="drawer-card-wrapper ">
      <div className="drawer-card-title ">
        <h3 className="" data-cy="create-new-column-header">
          Create a new column
        </h3>
      </div>
      <div className="card-body">
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
            onChange={(e) => setColumnName(e.target.value)}
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
        <div className="mb-3 tj-app-input">
          <div className="form-label" data-cy="default-value-input-field-label">
            Default value
          </div>
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
          {isNotNull === true && dataType?.value !== 'serial' && rows.length > 0 && defaultValue.length <= 0 ? (
            <span className="form-error-message">
              Default value is required to populate this field in existing rows as NOT NULL constraint is added
            </span>
          ) : null}
        </div>

        <div className="row mb-3">
          <div className="col-1">
            <label className={`form-switch`}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={isForeignKey}
                onChange={(e) => {
                  setIsForeignKey(e.target.checked);
                }}
                disabled={dataType?.value === 'serial'}
              />
            </label>
          </div>
          <div className="col d-flex flex-column">
            <p className="m-0 p-0 fw-500">Foreign Key relation</p>
            {!isForeignKey ? (
              <p className="fw-400 secondary-text">Add foreign key to check referral integrity</p>
            ) : (
              <div className="foreignKey-details" onClick={() => {}}>
                <span className="foreignKey-text">Name</span>
                <div className="foreign-key-relation">
                  <ForeignKeyRelationIcon width="13" height="13" />
                </div>
                <span className="foreignKey-text">table2.column4</span>
                <div className="editForeignkey" onClick={() => {}}>
                  <EditIcon width="17" height="18" />
                </div>
              </div>
            )}
          </div>
        </div>

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
            <p className="m-0 p-0 fw-500">{isNotNull ? 'NOT NULL' : 'NULL'}</p>
            <p className="fw-400 secondary-text">
              {isNotNull ? 'Not null constraint is added' : 'This field can accept NULL value'}
            </p>
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-1">
            <label className={`form-switch`}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={isUniqueConstraint}
                onChange={(e) => {
                  setIsUniqueConstraint(e.target.checked);
                }}
                disabled={dataType?.value === 'serial'}
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
      </div>
      <DrawerFooter
        fetching={fetching}
        onClose={onClose}
        onCreate={handleCreate}
        shouldDisableCreateBtn={
          isEmpty(columnName) ||
          isEmpty(dataType) ||
          (isNotNull === true && rows.length > 0 && isEmpty(defaultValue) && dataType?.value !== 'serial')
        }
      />
    </div>
  );
};
export default ColumnForm;
