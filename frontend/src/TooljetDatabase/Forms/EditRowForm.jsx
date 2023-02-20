import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import Select from '@/_ui/Select';
import _ from 'lodash';
import { useMounted } from '@/_hooks/use-mount';

const EditRowForm = ({ onCreate, onClose }) => {
  const { organizationId, selectedTable, columns, selectedTableData } = useContext(TooljetDatabaseContext);
  const [fetching, setFetching] = useState(false);

  const [selectedRow, setSelectedRow] = useState(null);
  const handleOnSelect = (selectedOption) => {
    setSelectedRow(selectedOption);
  };

  let data = {};
  columns.forEach(({ accessor, dataType }) => {
    if (dataType === 'boolean') {
      if (!accessor) {
        data[accessor] = false;
      }
    }
  });

  const handleChange = (columnName, value) => {
    const rowData = _.cloneDeep(data);

    rowData[columnName] = value;

    const shouldUpdate = _.get(rowData, columnName) !== _.get(data, columnName);

    if (shouldUpdate) {
      data = rowData;
    }
  };

  const handleSubmit = async () => {
    setFetching(true);
    console.log('--Selected Table--', { data });
    // const { error } = await tooljetDatabaseService.createRow(organizationId, selectedTable, data);
    setFetching(false);
    // if (error) {
    //   toast.error(error?.message ?? `Failed to create a new column table "${selectedTable}"`);
    //   return;
    // }
    toast.success(`Row created successfully`);
    // console.log('--Selected Table--', { data });
    // onCreate && onCreate();
  };

  const removeQuotes = (str) => {
    return str?.replace(/['"]+/g, '');
  };
  const RenderElement = ({ columnName, dataType, isPrimaryKey, defaultValue, value, callback }) => {
    const placeholder = defaultValue?.length > 0 ? removeQuotes(defaultValue.split('::')[0]) : '';

    const [inputValue, setInputValue] = useState(value ? value : '');

    const isMounted = useMounted();

    useEffect(() => {
      if (isMounted && inputValue !== undefined && inputValue !== null) {
        callback(columnName, inputValue);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [inputValue]);

    switch (dataType) {
      case 'character varying':
      case 'integer':
      case 'serial':
      case 'double precision':
        return (
          <input
            defaultValue={value ? value : ''}
            type="text"
            disabled={isPrimaryKey}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            className="form-control"
            autoComplete="off"
          />
        );

      case 'boolean':
        return (
          <label className={`form-switch`}>
            <input
              className="form-check-input"
              type="checkbox"
              defaultChecked={value ? value : defaultValue === 'true'}
              onChange={(e) => setInputValue(e.target.checked)}
            />
          </label>
        );

      default:
        break;
    }
  };

  const primaryColumn = columns.find((column) => column.isPrimaryKey)?.accessor || null;

  const options = selectedTableData.map((row) => {
    return {
      value: row[primaryColumn],
      label: row[primaryColumn],
    };
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Edit a row</h3>
      </div>
      <div className="card-body">
        <div>
          <div className="mb-3 row g-2 align-items-center">
            <div className="col-2 form-label">
              {primaryColumn}&nbsp;
              <span className="badge badge-outline text-blue"> SERIAL</span>
            </div>
            <div className="col-auto">
              <Select
                useMenuPortal={false}
                placeholder="Select a row to edit"
                value={selectedRow}
                options={options}
                onChange={handleOnSelect}
              />
            </div>
          </div>

          {selectedRow &&
            Array.isArray(columns) &&
            columns?.map(({ Header, accessor, dataType, isPrimaryKey, column_default }, index) => {
              const currentValue = selectedTableData.find((row) => row.id === selectedRow)?.[accessor];

              if (isPrimaryKey) return null;

              return (
                <div className="mb-3" key={index}>
                  <div className="form-label">
                    {Header}&nbsp;
                    <span className="badge badge-outline text-blue">{isPrimaryKey ? 'SERIAL' : dataType}</span>
                  </div>
                  <RenderElement
                    columnName={accessor}
                    dataType={dataType}
                    isPrimaryKey={isPrimaryKey}
                    defaultValue={column_default}
                    value={currentValue}
                    callback={handleChange}
                  />
                </div>
              );
            })}
        </div>
      </div>
      {selectedRow && <DrawerFooter isEditMode={true} fetching={fetching} onClose={onClose} onEdit={handleSubmit} />}
    </div>
  );
};

export default EditRowForm;
