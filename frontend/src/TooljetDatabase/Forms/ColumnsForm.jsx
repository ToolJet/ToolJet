import React, { useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import Toggle from '@/_ui/Toggle';
import Select from 'react-select';
import AddColumnIcon from '../Icons/AddColumnIcon.svg';
// import DragIcon from '../Icons/DragIcon.svg';
import DeleteIcon from '../Icons/DeleteIcon.svg';
import { types } from '../dataTypes';
import { isNull } from 'lodash';

const ColumnsForm = ({ columns, setColumns }) => {
  const defaults = { 0: {} };
  const [currentPrimaryKeyIndex, setCurrentPrimaryKeyIndex] = useState(0);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Add columns</h3>
      </div>
      <div className="card-body">
        <div className="list-group-item">
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
          <div key={index} className="list-group-item bg-gray mb-2">
            <div className="row align-items-center">
              {/* <div className="col-1">
                  <DragIcon />
                </div> */}
              <div className="col-3 m-0 p-0">
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
                  placeholder="Enter column name"
                />
              </div>
              <div className="col-3 m-0 p-0">
                <Select
                  options={types}
                  value={types.find((type) => type.value === columns[index].data_type)}
                  onChange={({ value }) => {
                    const prevColumns = { ...columns };
                    prevColumns[index].data_type = value;
                    setColumns(prevColumns);
                  }}
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
              <div className="col-1">{columns[index].constraint !== 'PRIMARY KEY' && <DeleteIcon />}</div>
            </div>
          </div>
        ))}
        <div
          onClick={() => setColumns((prevColumns) => ({ ...prevColumns, [Object.keys(prevColumns).length]: defaults }))}
          className="mt-2 btn no-border card-footer"
          style={{ backgroundColor: '#F0F4FF', color: '#3E63DD', fontWeight: 500, fontSize: 12, borderRadius: 6 }}
        >
          <AddColumnIcon />
          &nbsp;&nbsp; Add more columns
        </div>
      </div>
    </div>
  );
};

export default ColumnsForm;
