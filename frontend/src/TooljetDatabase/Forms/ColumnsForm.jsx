import React, { useState } from 'react';
import cx from 'classnames';
//import Select from '@/_ui/Select';
import Select, { components } from 'react-select';
import AddColumnIcon from '../Icons/AddColumnIcon.svg';
import DeleteIcon from '../Icons/DeleteIcon.svg';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel, primaryKeydataTypes } from '../constants';
import Tick from '../Icons/Tick.svg';
import Serial from '../Icons/Serial.svg';

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
        <h3 className={cx('card-sub-title', { 'card-sub-title-light': !darkMode })} data-cy="add-columns-header">
          Table schema
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

        <TableSchema
          columns={columns}
          editColumns={editColumns}
          setColumns={setColumns}
          darkMode={darkMode}
          columnSelection={columnSelection}
          setColumnSelection={setColumnSelection}
          handleDelete={handleDelete}
          isEditMode={isEditMode}
          isActiveForeignKey={
            !isEmpty(foreignKeyDetails?.column_names) &&
            !isEmpty(foreignKeyDetails?.referenced_column_names) &&
            !isEmpty(foreignKeyDetails?.referenced_table_name) &&
            !isEmpty(foreignKeyDetails?.on_delete) &&
            !isEmpty(foreignKeyDetails?.on_update)
          }
          indexHover={hoveredColumn}
          foreignKeyDetails={foreignKeyDetails}
          existingForeignKeyDetails={existingForeignKeyDetails} // foreignKeys from context state
        />

        <div className="d-flex mb-2 mt-2 border-none" style={{ maxHeight: '32px' }}>
          <ButtonSolid
            variant="ghostBlue"
            size="sm"
            style={{ fontSize: '14px' }}
            onClick={() => {
              setColumns((prevColumns) => ({ ...prevColumns, [+Object.keys(prevColumns).pop() + 1 || 0]: {} })),
                setColumnSelection({ index: 0, value: '' });
            }}
            data-cy="add-more-columns-button"
          >
            <AddRectangle width="14" height="14" fill="#3E63DD" opacity="1" secondaryFill="#ffffff" />
            <span className="add-text">Add more columns</span>
          </ButtonSolid>
        </div>
      </div>
    </div>
  );
};

export default ColumnsForm;
