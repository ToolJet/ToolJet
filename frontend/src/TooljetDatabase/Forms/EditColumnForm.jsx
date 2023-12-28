import React, { useState, useContext, useEffect } from 'react';
//import Select from '@/_ui/Select';
import Select, { components } from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { isEmpty } from 'lodash';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import { dataTypes, formatOptionLabel } from '../constants';
import Tick from '../Icons/Toggle.svg';

const ColumnForm = ({ onCreate, onClose, selectedColumn }) => {
  const [columnName, setColumnName] = useState(selectedColumn?.Header);
  const [defaultValue, setDefaultValue] = useState(selectedColumn?.column_default);
  const [dataType, setDataType] = useState(selectedColumn?.dataType);
  const [fetching, setFetching] = useState(false);
  const { organizationId, selectedTable } = useContext(TooljetDatabaseContext);
  const disabledDataType = dataTypes.find((e) => e.value === dataType);

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const handleTypeChange = (value) => {
    setDataType(value);
  };

  const handleCreate = async () => {
    if (isEmpty(columnName)) {
      toast.error('Column name cannot be empty');
      return;
    }
    if (isEmpty(dataType)) {
      toast.error('Data type cannot be empty');
      return;
    }
  };

  const CustomStyle = {
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#F0F4FF' : 'transparent',
      ':hover': {
        backgroundColor: state.isFocused ? '#F0F4FF' : '',
      },
    }),
    control: (provided, state) => ({
      ...provided,
      background: state.isDisabled && darkMode ? '#1f2936' : '#f4f6fa',
      borderColor: darkMode ? '#3a3f42 !important' : state.isFocused && !darkMode ? '#3e63dd !important' : '#dadcde',
      boxShadow: state.isFocused ? 'none' : 'none',
      height: '36px !important',
      minHeight: '36px',
    }),
    menuList: (provided, state) => ({
      ...provided,
      padding: '8px',
    }),
    menu: (base) => ({
      ...base,
      width: '100%',
    }),
  };

  // const handleCreate = async () => {
  //   if (isEmpty(columnName)) {
  //     toast.error('Column name cannot be empty');
  //     return;
  //   }
  //   if (isEmpty(dataType?.value)) {
  //     toast.error('Data type cannot be empty');
  //     return;
  //   }
  //   setFetching(true);
  //   const { error } = await tooljetDatabaseService.createColumn(
  //     organizationId,
  //     selectedTable.table_name,
  //     columnName,
  //     dataType?.value,
  //     defaultValue
  //   );
  //   setFetching(false);
  //   if (error) {
  //     toast.error(error?.message ?? `Failed to create a new column in "${selectedTable.table_name}" table`);
  //     return;
  //   }
  //   toast.success(`Column created successfully`);
  //   onCreate && onCreate();
  // };

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
            isDisabled={true}
            defaultValue={disabledDataType}
            formatOptionLabel={formatOptionLabel}
            options={dataTypes}
            onChange={handleTypeChange}
            components={{ IndicatorSeparator: () => null }}
            styles={CustomStyle}
            isSearchable={false}
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
      </div>
      <DrawerFooter fetching={fetching} onClose={onClose} onCreate={handleCreate} />
    </div>
  );
};
export default ColumnForm;
