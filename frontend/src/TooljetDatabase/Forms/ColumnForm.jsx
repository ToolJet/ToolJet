import React, { useState, useContext, useEffect } from 'react';
//import Select from '@/_ui/Select';
import Select, { components } from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { dataTypes, formatOptionLabel } from '../constants';
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

  const CustomStyle = {
    option: (base, state) => ({
      ...base,
      backgroundColor:
        state.isSelected && !darkMode ? '#F0F4FF' : state.isSelected && darkMode ? '#323C4B' : 'transparent',
      ':hover': {
        backgroundColor: state.isFocused && !darkMode ? '#F0F4FF' : '#323C4B',
      },
      color: darkMode ? '#fff' : '#232e3c',
      cursor: 'pointer',
    }),
    control: (provided, state) => ({
      ...provided,
      background:
        state.isDisabled && darkMode
          ? '#1f2936'
          : state.isDisabled && !darkMode
          ? '#f4f6fa'
          : state.isFocused && !darkMode
          ? '#f8faff'
          : state.isFocused && darkMode
          ? '#15192d !important'
          : 'transparent',
      borderColor:
        state.isFocused && !darkMode
          ? '#3e63dd !important'
          : state.isFocused && darkMode
          ? '#3e63dd !important'
          : darkMode
          ? '#3a3f42'
          : '#dadcde',
      '&:hover': {
        borderColor: darkMode ? '#4c5155' : '#c1c8cd',
      },
      boxShadow: state.isFocused ? 'none' : 'none',
      height: '36px !important',
      minHeight: '36px',
    }),
    menuList: (provided, _state) => ({
      ...provided,
      padding: '8px',
      color: darkMode ? '#fff' : '#232e3c',
    }),
    menu: (base) => ({
      ...base,
      width: '100%',
      background: darkMode ? 'rgb(31,40,55)' : 'white',
      borderColor: darkMode ? '#4c5155' : '#c1c8cd',
    }),
  };

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
            styles={CustomStyle}
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
            className="form-control"
            data-cy="default-value-input-field"
            autoComplete="off"
            onChange={(e) => setDefaultValue(e.target.value)}
            disabled={dataType === 'serial'}
          />
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
        shouldDisableCreateBtn={isEmpty(columnName) || isEmpty(dataType)}
      />
    </div>
  );
};
export default ColumnForm;
