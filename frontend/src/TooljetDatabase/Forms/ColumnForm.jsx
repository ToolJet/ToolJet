import React, { useState, useContext, useEffect } from 'react';
//import Select from '@/_ui/Select';
import Select, { components } from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel } from '../constants';
import Tick from '../Icons/Tick.svg';
import './styles.scss';

const ColumnForm = ({ onCreate, onClose }) => {
  const [columnName, setColumnName] = useState('');
  const [defaultValue, setDefaultValue] = useState('');
  const [dataType, setDataType] = useState();
  const [fetching, setFetching] = useState(false);
  const { organizationId, selectedTable } = useContext(TooljetDatabaseContext);
  const [isNotNull, setIsNotNull] = useState(false);
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
    setDataType(value);
  };

  const handleCreate = async () => {
    if (isEmpty(columnName)) {
      toast.error('Column name cannot be empty');
      return;
    }
    if (isEmpty(dataType?.value)) {
      toast.error('Data type cannot be empty');
      return;
    }
    setFetching(true);
    const { error } = await tooljetDatabaseService.createColumn(
      organizationId,
      selectedTable.table_name,
      columnName,
      dataType?.value,
      defaultValue,
      isNotNull
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
            placeholder="Enter default value"
            className={isNotNull === true && defaultValue.length <= 0 ? 'form-error' : 'form-control'}
            data-cy="default-value-input-field"
            autoComplete="off"
            onChange={(e) => setDefaultValue(e.target.value)}
            disabled={dataType === 'serial'}
          />
          {isNotNull === true && defaultValue.length <= 0 ? (
            <span className="form-error-message">Default value cannot be empty when NOT NULL constraint is added</span>
          ) : null}
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
      </div>
      <DrawerFooter
        fetching={fetching}
        onClose={onClose}
        onCreate={handleCreate}
        shouldDisableCreateBtn={
          isEmpty(columnName) || isEmpty(dataType) || (isNotNull === true && isEmpty(defaultValue))
        }
      />
    </div>
  );
};
export default ColumnForm;
