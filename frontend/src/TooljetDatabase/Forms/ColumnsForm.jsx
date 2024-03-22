import React, { useState } from 'react';
import cx from 'classnames';
//import Select from '@/_ui/Select';
import AddColumnIcon from '../Icons/AddColumnIcon.svg';
import ColumnName from '../Icons/ColumnName.svg';
import TableSchema from './TableSchema';
import { dataTypes } from '../constants';

const ColumnsForm = ({ columns, setColumns, isEditMode }) => {
  const [columnSelection, setColumnSelection] = useState({ index: 0, value: '' });

  const handleDelete = (index) => {
    const newColumns = { ...columns };
    delete newColumns[index];
    setColumns(newColumns);
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="create-column-drawer">
      <div className="card-header">
        <h3 className="card-title" data-cy="add-columns-header">
          Table schema
        </h3>
      </div>
      <div className="card-body">
        <div
          className={cx('list-group-item', {
            'text-white': darkMode,
          })}
        >
          <div className="row">
            <div className="m-0 d-flex align-items-center  column-name-description">
              <ColumnName />
              <span style={{ marginLeft: '6px' }} data-cy="name-input-field-label">
                Column name
              </span>
            </div>
            <div className="m-0 dataType-description">
              <span data-cy="type-input-field-label">Type</span>
            </div>
            <div className="m-0 defaultValue-description">
              <span data-cy="default-input-field-label">Default value</span>
            </div>
            <div className="m-0 primaryKey-description">
              <span data-cy="default-input-field-label">Primary</span>
            </div>
          </div>
        </div>

        <TableSchema
          columns={columns}
          setColumns={setColumns}
          darkMode={darkMode}
          columnSelection={columnSelection}
          setColumnSelection={setColumnSelection}
          handleDelete={handleDelete}
          isEditMode={isEditMode}
        />

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
