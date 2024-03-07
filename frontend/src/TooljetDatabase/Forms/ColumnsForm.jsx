import React, { useState } from 'react';
import cx from 'classnames';
//import Select from '@/_ui/Select';
import Select, { components } from 'react-select';
import AddColumnIcon from '../Icons/AddColumnIcon.svg';
import DeleteIcon from '../Icons/DeleteIcon.svg';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel, primaryKeydataTypes } from '../constants';
import Tick from '../Icons/Tick.svg';

const ColumnsForm = ({ columns, setColumns }) => {
  const [columnSelection, setColumnSelection] = useState({ index: 0, value: '' });

  const handleDelete = (index) => {
    const newColumns = { ...columns };
    delete newColumns[index];
    setColumns(newColumns);
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { Option } = components;

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
  const lightFocussedBorder = '#90B5E2 !important';
  const darkFocussedBorder = '#90b5e2 !important';
  const lightBorder = '#dadcde';
  const darkBorder = '#dadcde';
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
          {columns[columnSelection.index].data_type === props.data.value ? (
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
            <div className="col-3 m-0 pe-0">
              <span data-cy="name-input-field-label">Name</span>
            </div>
            <div className="col-3 m-0 pe-0">
              <span data-cy="type-input-field-label">Type</span>
            </div>
            <div className="col-3 m-0 pe-0">
              <span data-cy="default-input-field-label">Default</span>
            </div>
          </div>
        </div>
        {Object.keys(columns).map((index) => (
          <div
            key={index}
            className={cx('list-group-item mb-1', {
              'bg-gray': !darkMode,
            })}
          >
            <div className="row align-items-center">
              {/* <div className="col-1">
                  <DragIcon />
                </div> */}
              <div className="col-3 m-0 pe-0 ps-1" data-cy="column-name-input-field">
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
                  disabled={columns[index]?.constraints_type?.is_primary_key === true}
                />
              </div>
              <div className="col-3 pe-0 ps-1" data-cy="type-dropdown-field">
                <Select
                  width="120px"
                  height="36px"
                  isDisabled={columns[index]?.constraints_type?.is_primary_key === true}
                  //useMenuPortal={false}
                  options={columns[index]?.constraints_type?.is_primary_key === true ? primaryKeydataTypes : dataTypes}
                  onChange={(value) => {
                    setColumnSelection((prevState) => ({
                      ...prevState,
                      index: index,
                      value: value.value,
                    }));
                    const prevColumns = { ...columns };
                    prevColumns[index].data_type = value ? value.value : null;
                    setColumns(prevColumns);
                  }}
                  components={{ Option: CustomSelectOption, IndicatorSeparator: () => null }}
                  styles={customStyles}
                  formatOptionLabel={formatOptionLabel}
                  placeholder={
                    columns[index]?.constraints_type?.is_primary_key === true ? columns[0].data_type : 'Select...'
                  }
                  onMenuOpen={() => {
                    setColumnSelection((prevState) => ({
                      ...prevState,
                      index: index,
                      value: columns[index]?.data_type,
                    }));
                  }}
                  onMenuClose={() => {
                    setColumnSelection({ index: 0, value: '' });
                  }}
                />
              </div>
              <div className="col-2 m-0 pe-0 ps-1" data-cy="column-default-input-field">
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
                  disabled={
                    columns[index]?.constraints_type?.is_primary_key === true || columns[index].data_type === 'serial'
                  }
                />
              </div>
              {columns[index]?.constraints_type?.is_primary_key === true && (
                <div className="col-3">
                  <div
                    className={`badge badge-outline ${darkMode ? 'text-white' : 'text-indigo'}`}
                    data-cy="primary-key-text"
                  >
                    Primary Key
                  </div>
                </div>
              )}
              {columns[index]?.constraints_type?.is_primary_key !== true && (
                <div className="col-3 d-flex">
                  <label className={`form-switch`}>
                    <input
                      className="form-check-input"
                      data-cy={`${String(columns[index]?.constraints_type?.is_not_null ?? false ? 'NOT NULL' : 'NULL')
                        .toLowerCase()
                        .replace(/\s+/g, '-')}-checkbox`}
                      type="checkbox"
                      checked={columns[index]?.constraints_type?.is_not_null ?? false}
                      onChange={(e) => {
                        const prevColumns = { ...columns };
                        const columnConstraints = prevColumns[index]?.constraints_type ?? {};
                        columnConstraints.is_not_null = e.target.checked;
                        prevColumns[index].constraints_type = { ...columnConstraints };
                        setColumns(prevColumns);
                      }}
                    />
                  </label>
                  <span
                    data-cy={`${String(columns[index]?.constraints_type?.is_not_null ?? false ? 'NOT NULL' : 'NULL')
                      .toLowerCase()
                      .replace(/\s+/g, '-')}-text`}
                  >
                    {columns[index]?.constraints_type?.is_not_null ?? false ? 'NOT NULL' : 'NULL'}
                  </span>
                </div>
              )}
              <div
                className="col-1 cursor-pointer d-flex"
                data-cy="column-delete-icon"
                onClick={() => handleDelete(index)}
              >
                {columns[index]?.constraints_type?.is_primary_key !== true && <DeleteIcon width="16" height="16" />}
              </div>
            </div>
          </div>
        ))}
        <div
          onClick={() => {
            setColumns((prevColumns) => ({ ...prevColumns, [+Object.keys(prevColumns).pop() + 1 || 0]: {} })),
              setColumnSelection({ index: 0, value: '' });
          }}
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
