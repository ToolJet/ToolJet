import React, { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import Select from '@/_ui/Select';

const EditRowForm = ({ onCreate, onClose }) => {
  const { organizationId, selectedTable, columns, selectedTableData } = useContext(TooljetDatabaseContext);
  const [fetching, setFetching] = useState(false);

  const [data, setData] = useState(() => {
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

  const [selectedRow, setSelectedRow] = useState(null);
  const handleOnSelect = (selectedOption) => {
    setSelectedRow(selectedOption);
  };

  const handleInputChange = (columnName) => (e) => {
    setData({ ...data, [columnName]: e.target.value });
  };

  const handleToggleChange = (columnName) => (e) => {
    setData({ ...data, [columnName]: e.target.checked });
  };

  const handleSubmit = async () => {
    setFetching(true);
    const { error } = await tooljetDatabaseService.createRow(organizationId, selectedTable, data);
    setFetching(false);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new column table "${selectedTable}"`);
      return;
    }
    toast.success(`Row created successfully`);
    onCreate && onCreate();
  };

  const removeQuotes = (str) => {
    return str?.replace(/['"]+/g, '');
  };
  const renderElement = (columnName, dataType, isPrimaryKey, defaultValue, value) => {
    const placeholder = defaultValue?.length > 0 ? removeQuotes(defaultValue.split('::')[0]) : '';

    // console.log('--Selected Table--', { value });

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
            onChange={handleInputChange(columnName)}
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
              onChange={handleToggleChange(columnName)}
            />
          </label>
        );

      default:
        break;
    }
  };

  const RenderSelectionDropdown = () => {
    const primaryColumn = columns.find((column) => column.isPrimaryKey)?.accessor || null;

    const options = selectedTableData.map((row) => {
      return {
        value: row[primaryColumn],
        label: row[primaryColumn],
      };
    });

    return (
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
                {renderElement(accessor, dataType, isPrimaryKey, column_default, currentValue)}
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Edit a row</h3>
      </div>
      <div className="card-body">
        <RenderSelectionDropdown />
      </div>
      {selectedRow && <DrawerFooter isEditMode={true} fetching={fetching} onClose={onClose} onEdit={handleSubmit} />}
    </div>
  );
};

export default EditRowForm;
