import React, { useState } from 'react';
import cx from 'classnames';
// eslint-disable-next-line import/no-unresolved
import Toggle from '@/_ui/Toggle';
import Select from '@/_ui/Select';
import AddColumnIcon from '../Icons/AddColumnIcon.svg';
// import DragIcon from '../Icons/DragIcon.svg';
import DeleteIcon from '../Icons/DeleteIcon.svg';
import { dataTypes } from '../constants';
import { isNull } from 'lodash';

const ColumnsForm = ({ columns, setColumns }) => {
  const [currentPrimaryKeyIndex, setCurrentPrimaryKeyIndex] = useState(0);

  const handleDelete = (index) => {
    const newColumns = { ...columns };
    delete newColumns[index];
    setColumns(newColumns);
  };

  const darkMode = localStorage.getItem('darkMode') === 'true';

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Add columns</h3>
      </div>
      <div className="card-body">
        <div
          className={cx('list-group-item', {
            'text-white': darkMode,
          })}
        >
          <div className="row align-items-center">
            <div className="col-3 m-0 p-0">
              <span>Name</span>
            </div>
            <div className="col-3 m-0 p-0">
              <span>Type</span>
            </div>
            <div className="col-3 m-0 p-0">
              <span>Default</span>
            </div>
            <div className="col-3 m-0 p-0">
              <span>Primary</span>
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
              <div className="col-3 m-0">
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
                />
              </div>
              <div className="col-3 m-0 p-0">
                <Select
                  useMenuPortal={false}
                  options={dataTypes}
                  value={columns[index].data_type}
                  onChange={(value) => {
                    const prevColumns = { ...columns };
                    prevColumns[index].data_type = value;
                    setColumns(prevColumns);
                  }}
                  width={120}
                />
              </div>
              <div className="col-3 m-0 p-0">
                <input
                  onChange={(e) => {
                    e.persist();
                    const prevColumns = { ...columns };
                    prevColumns[index].default = e.target.value;
                    setColumns(prevColumns);
                  }}
                  value={columns[index].default}
                  type="text"
                  className="form-control"
                  placeholder="NULL"
                  disabled={columns[index].constraint === 'PRIMARY KEY' || columns[index].data_type === 'serial'}
                />
              </div>
              <div className="col-2">
                <Toggle
                  checked={columns[index].constraint === 'PRIMARY KEY'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setColumns((prevColumns) => {
                        prevColumns[index].constraint = 'PRIMARY KEY';
                        if (!isNull(currentPrimaryKeyIndex)) delete prevColumns[currentPrimaryKeyIndex].constraint;
                        setCurrentPrimaryKeyIndex(index);
                        return prevColumns;
                      });
                    } else if (currentPrimaryKeyIndex === index) {
                      setColumns((prevColumns) => {
                        delete prevColumns[currentPrimaryKeyIndex].constraint;
                        setCurrentPrimaryKeyIndex(null);
                        return prevColumns;
                      });
                    }
                  }}
                />
              </div>
              <div className="col-1 cursor-pointer" onClick={() => handleDelete(index)}>
                {columns[index].constraint !== 'PRIMARY KEY' && <DeleteIcon />}
              </div>
            </div>
          </div>
        ))}
        <div
          onClick={() =>
            setColumns((prevColumns) => ({ ...prevColumns, [+Object.keys(prevColumns).pop() + 1 || 0]: {} }))
          }
          className="mt-2 btn border-0 card-footer add-more-columns-btn"
        >
          <AddColumnIcon />
          &nbsp;&nbsp; Add more columns
        </div>
      </div>
    </div>
  );
};

export default ColumnsForm;
