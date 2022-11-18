import React, { useState } from 'react';
// eslint-disable-next-line import/no-unresolved
import SortableList, { SortableItem } from 'react-easy-sort';
import Toggle from '@/_ui/Toggle';
import Select from 'react-select';
import AddColumnIcon from '../Icons/AddColumnIcon.svg';
import DragIcon from '../Icons/DragIcon.svg';
import DeleteIcon from '../Icons/DeleteIcon.svg';

const ColumnsForm = ({ columns, setColumns }) => {
  const defaults = { 0: {} };
  const [currentPrimaryKeyIndex, setCurrentPrimaryKeyIndex] = useState();

  const onSortEnd = (oldIndex, newIndex) => {
    const prevColumns = { ...columns };
    prevColumns[oldIndex] = columns[newIndex];
    prevColumns[newIndex] = columns[oldIndex];
    setColumns(prevColumns);
  };

  const types = [
    { value: 'character varying', label: 'varchar' },
    { value: 'serial', label: 'auto' },
    { value: 'integer', label: 'int' },
    { value: 'double precision', label: 'float' },
    { value: 'boolean', label: 'boolean' },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Add columns</h3>
      </div>
      <SortableList onSortEnd={onSortEnd} className="list-group list-group-flush" draggedItemClassName="dragged-column">
        {Object.keys(columns).map((index) => (
          <SortableItem key={index}>
            <div className="list-group-item bg-gray">
              <div className="row align-items-center">
                <div className="col-1">
                  <DragIcon />
                </div>
                <div className="col-4 m-0 p-0">
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
                    placeholder={index}
                  />
                </div>
                <div className="col-4 m-0 p-0">
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
                <div className="col-2">
                  <Toggle
                    checked={columns[index].constraint === 'PRIMARY KEY'}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setColumns((prevColumns) => {
                          prevColumns[index].constraint = 'PRIMARY KEY';
                          if (currentPrimaryKeyIndex) delete prevColumns[currentPrimaryKeyIndex].constraint;
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
                <div className="col-1">
                  <DeleteIcon />
                </div>
              </div>
            </div>
          </SortableItem>
        ))}
      </SortableList>
      <div
        onClick={() => setColumns((prevColumns) => ({ ...prevColumns, [Object.keys(prevColumns).length]: defaults }))}
        className="mt-2 btn no-border card-footer"
        style={{ backgroundColor: '#F0F4FF', color: '#3E63DD', fontWeight: 500, fontSize: 12, borderRadius: 6 }}
      >
        <AddColumnIcon />
        &nbsp;&nbsp; Add more columns
      </div>
    </div>
  );
};

export default ColumnsForm;
