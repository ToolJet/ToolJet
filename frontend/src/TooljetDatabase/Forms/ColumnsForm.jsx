import React, { useState } from 'react';
import cx from 'classnames';
//import Select from '@/_ui/Select';
import Select, { components } from 'react-select';
import AddColumnIcon from '../Icons/AddColumnIcon.svg';
import DeleteIcon from '../Icons/DeleteIcon.svg';
import { dataTypes, primaryKeydataTypes, formatOptionLabel } from '../constants';
import Tick from '../Icons/Tick.svg';

const ColumnsForm = ({ columns, setColumns }) => {
  const [columnIndex, setColumnIndex] = useState(0);

  const handleDelete = (index) => {
    const newColumns = { ...columns };
    delete newColumns[index];
    setColumns(newColumns);
  };

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
          {columnIndex?.value === props.data.value ? (
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
      backgroundColor: state.isSelected ? '#F0F4FF' : 'transparent',
      ':hover': {
        backgroundColor: state.isFocused ? '#F0F4FF' : '',
      },
    }),
    control: (provided, state) => ({
      ...provided,
      background: state.isFocused ? '#fff' : '',
      border: state.isFocused ? '1px solid #90b5e2 !important' : '1px solid #DADCDE',
      boxShadow: state.isFocused ? 'none' : 'none',
      height: '36px',
      minHeight: '36px',
    }),
    menuList: (provided, _state) => ({
      ...provided,
      padding: '8px',
    }),
    menu: (base) => ({
      ...base,
      width: '360px',
    }),
  };

  return (
    <div className="">
      <div className="card-header">
        <h3 className="card-title" data-cy="add-columns-header">
          Add columns
        </h3>
      </div>
      <div className="card-body">
        <div
          className={cx('list-group-item', {
            'text-white': darkMode,
          })}
        >
          <div className="row align-items-center">
            <div className="col-3 m-0">
              <span data-cy="name-input-field-label">Name</span>
            </div>
            <div className="col-3 m-0">
              <span data-cy="type-input-field-label">Type</span>
            </div>
            <div className="col-3 m-0">
              <span data-cy="default-input-field-label">Default</span>
            </div>
          </div>
        </div>
        {Object.keys(columns).map((index) => (
          <div
            key={index}
            className={cx('list-group-item', {
              'bg-gray': !darkMode,
            })}
          >
            <div className="row align-items-center">
              {/* <div className="col-1">
                  <DragIcon />
                </div> */}
              <div className="col-3 m-0" data-cy="column-name-input-field">
                <input
                  onChange={(e) => {
                    e.persist();
                    const prevColumns = { ...columns };
                    prevColumns[index].column_name = e.target.value;
                    setColumns(prevColumns);
                  }}
                  value={columns[index].column_name}
                  type="text"
                  className="form-control"
                  placeholder="Enter name"
                  data-cy={`name-input-field-${columns[index].column_name}`}
                  disabled={columns[index].constraint_type === 'PRIMARY KEY'}
                />
              </div>
              <div className="col-3" data-cy="type-dropdown-field" style={{ marginRight: '16px' }}>
                <Select
                  width="120px"
                  isDisabled={columns[index].constraint_type === 'PRIMARY KEY'}
                  //useMenuPortal={false}
                  options={columns[index].constraint_type === 'PRIMARY KEY' ? primaryKeydataTypes : dataTypes}
                  //value={columns[index].data_type}
                  onChange={(value) => {
                    setColumnIndex(value);
                    const prevColumns = { ...columns };
                    prevColumns[index].data_type = value.value;
                    setColumns(prevColumns);
                  }}
                  components={{ Option: CustomSelectOption }}
                  styles={CustomStyle}
                  formatOptionLabel={formatOptionLabel}
                />
              </div>
              <div className="col-3 m-0" data-cy="column-default-input-field">
                <input
                  onChange={(e) => {
                    e.persist();
                    const prevColumns = { ...columns };
                    prevColumns[index].column_default = e.target.value;
                    setColumns(prevColumns);
                  }}
                  value={columns[index].column_default}
                  type="text"
                  className="form-control"
                  data-cy="default-input-field"
                  placeholder="NULL"
                  disabled={columns[index].constraint_type === 'PRIMARY KEY' || columns[index].data_type === 'serial'}
                />
              </div>
              {columns[index].constraint_type === 'PRIMARY KEY' && (
                <div className="col-2">
                  <span
                    className={`badge badge-outline ${darkMode ? 'text-white' : 'text-indigo'}`}
                    data-cy="primary-key-text"
                  >
                    Primary Key
                  </span>
                </div>
              )}
              <div className="col-1 cursor-pointer" data-cy="column-delete-icon" onClick={() => handleDelete(index)}>
                {columns[index].constraint_type !== 'PRIMARY KEY' && <DeleteIcon />}
              </div>
            </div>
          </div>
        ))}
        <div
          onClick={() =>
            setColumns((prevColumns) => ({ ...prevColumns, [+Object.keys(prevColumns).pop() + 1 || 0]: {} }))
          }
          className="mt-2 btn border-0 card-footer add-more-columns-btn"
          data-cy="add-more-columns-button"
        >
          <AddColumnIcon />
          &nbsp;&nbsp; Add more columns
        </div>
      </div>
    </div>
  );
};

export default ColumnsForm;
