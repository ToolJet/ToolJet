import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';

const RowForm = ({ onCreate, onClose }) => {
  const { organizationId, selectedTable, columns } = useContext(TooljetDatabaseContext);
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

  useEffect(() => {
    toast.dismiss();
  }, []);

  const handleInputChange = (columnName) => (e) => {
    setData({ ...data, [columnName]: e.target.value });
  };

  const handleToggleChange = (columnName) => (e) => {
    setData({ ...data, [columnName]: e.target.checked });
  };

  const handleSubmit = async () => {
    setFetching(true);
    const { error } = await tooljetDatabaseService.createRow(organizationId, selectedTable.id, data);
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
  const renderElement = (columnName, dataType, isPrimaryKey, defaultValue) => {
    switch (dataType) {
      case 'character varying':
      case 'integer':
      case 'bigint':
      case 'serial':
      case 'double precision':
        return (
          <input
            defaultValue={!isPrimaryKey && defaultValue?.length > 0 ? removeQuotes(defaultValue.split('::')[0]) : ''}
            type="text"
            disabled={isPrimaryKey}
            onChange={handleInputChange(columnName)}
            placeholder={isPrimaryKey ? 'Auto-generated' : 'Enter a value'}
            className="form-control"
            data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-input-field`}
            autoComplete="off"
          />
        );

      case 'boolean':
        return (
          <label className={`form-switch`}>
            <input
              className="form-check-input"
              data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-check-input`}
              type="checkbox"
              defaultChecked={defaultValue === 'true'}
              onChange={handleToggleChange(columnName)}
            />
          </label>
        );

      default:
        break;
    }
  };

  return (
    <div className="drawer-card-wrapper ">
      <div className="card-header">
        <h3 className="card-title" data-cy="create-new-row-header">
          Create a new row
        </h3>
      </div>
      <div className="card-body tj-app-input">
        {Array.isArray(columns) &&
          columns?.map(({ Header, accessor, dataType, isPrimaryKey, column_default }, index) => {
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
                {renderElement(accessor, dataType, isPrimaryKey, column_default)}
              </div>
            );
          })}
      </div>
      <DrawerFooter fetching={fetching} onClose={onClose} onCreate={handleSubmit} />
    </div>
  );
};

export default RowForm;
