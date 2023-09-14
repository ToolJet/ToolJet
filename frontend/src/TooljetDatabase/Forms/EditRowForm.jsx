import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import Select from '@/_ui/Select';
import _ from 'lodash';
import { useMounted } from '@/_hooks/use-mount';

const EditRowForm = ({ onEdit, onClose }) => {
  const { organizationId, selectedTable, columns, selectedTableData } = useContext(TooljetDatabaseContext);
  const [fetching, setFetching] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  useEffect(() => {
    toast.dismiss();
  }, []);
  const handleOnSelect = (selectedOption) => {
    setSelectedRow(selectedOption);
  };

  const [rowData, setRowData] = useState(() => {
    const data = {};
    columns.forEach(({ accessor, dataType }) => {
      if (dataType === 'boolean') {
        if (!accessor) {
          data[accessor] = false;
        }
      }
    });

    return data;
  });

  const handleChange = (columnName, value) => {
    const _rowData = _.cloneDeep(rowData);

    _rowData[columnName] = value;

    const shouldUpdate = _.get(_rowData, columnName) !== _.get(rowData, columnName);

    if (shouldUpdate) {
      setRowData(_rowData);
    }
  };

  const debouncedHandleChange = _.debounce(handleChange, 500);

  const handleSubmit = async () => {
    setFetching(true);
    const query = `id=eq.${selectedRow}&order=id`;
    const { error } = await tooljetDatabaseService.updateRows(organizationId, selectedTable.id, rowData, query);

    if (error) {
      toast.error(error?.message ?? `Failed to create a new column table "${selectedTable.table_name}"`);
      return;
    }
    setFetching(false);
    toast.success(`Row edited successfully`);
    onEdit && onEdit();
  };

  const primaryColumn = columns.find((column) => column.isPrimaryKey)?.accessor || null;

  const options = selectedTableData.map((row) => {
    return {
      value: row[primaryColumn],
      label: row[primaryColumn],
    };
  });

  return (
    <div className="">
      <div className="drawer-card-title">
        <h3 className="card-title" data-cy="edit-row-header">
          Edit a row
        </h3>
      </div>
      <div className="card-body">
        <div>
          <div className="mb-3 row g-2 align-items-center">
            <div className="col-2" data-cy={`${primaryColumn}-column-name-label`}>
              {primaryColumn}&nbsp;
              <span className="badge badge-outline text-blue"> SERIAL</span>
            </div>
            <div className="col-auto row-edit-select-container" data-cy="select-row-dropdown">
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
                  <div
                    className="form-label"
                    data-cy={`${String(Header).toLocaleLowerCase().replace(/\s+/g, '-')}-column-name-label`}
                  >
                    {Header}&nbsp;
                    <span
                      className="badge badge-outline text-blue"
                      data-cy={`${String(dataType).toLocaleLowerCase().replace(/\s+/g, '-')}-data-type-label`}
                    >
                      {isPrimaryKey ? 'SERIAL' : dataType}
                    </span>
                  </div>
                  <RenderElement
                    columnName={accessor}
                    dataType={dataType}
                    isPrimaryKey={isPrimaryKey}
                    defaultValue={column_default}
                    value={currentValue}
                    callback={debouncedHandleChange}
                    onFocused={() => setFetching(false)}
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

const removeQuotes = (str) => {
  return str?.replace(/['"]+/g, '');
};
const RenderElement = ({ columnName, dataType, isPrimaryKey, defaultValue, value, callback, onFocused }) => {
  const placeholder = defaultValue?.length > 0 ? removeQuotes(defaultValue.split('::')[0]) : '';

  const [inputValue, setInputValue] = useState(value ? value : '');

  const isMounted = useMounted();

  useEffect(() => {
    if (isMounted && inputValue !== undefined && inputValue !== null) {
      console.log('shouldUpdate', { columnName, inputValue, value });
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
          data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-input-field`}
          autoComplete="off"
          onFocus={onFocused}
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

export default EditRowForm;
