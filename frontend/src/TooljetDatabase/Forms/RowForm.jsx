import React, { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import Toggle from '@/_ui/Toggle';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';

const RowForm = ({ onCreate, onClose }) => {
  const { organizationId, selectedTable, columns } = useContext(TooljetDatabaseContext);
  const [fetching, setFetching] = useState(false);
  const [data, setData] = useState(
    // if the column is of type boolean, set the default value to false
    columns.reduce((acc, { accessor, dataType }) => {
      if (dataType === 'boolean') {
        acc[accessor] = false;
      }
      return acc;
    }, {})
  );

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

  const renderElement = (columnName, dataType, isPrimaryKey) => {
    switch (dataType) {
      case 'character varying':
      case 'integer':
      case 'serial':
      case 'double precision':
        return (
          <input
            type="text"
            disabled={isPrimaryKey}
            onChange={handleInputChange(columnName)}
            placeholder={isPrimaryKey ? 'Auto-generated' : 'Enter a value'}
            className="form-control"
            autoComplete="off"
          />
        );

      case 'boolean':
        return <Toggle onChange={handleToggleChange(columnName)} />;

      default:
        break;
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Create a new row</h3>
      </div>
      <div className="card-body">
        {Array.isArray(columns) &&
          columns?.map(({ Header, accessor, dataType, isPrimaryKey }, index) => {
            // if (accessor === 'id' && isPrimaryKey) return null;
            return (
              <div className="mb-3" key={index}>
                <div className="form-label">
                  {Header}&nbsp;
                  <span className="badge badge-outline text-blue">{isPrimaryKey ? 'SERIAL' : dataType}</span>
                </div>
                {renderElement(accessor, dataType, isPrimaryKey)}
              </div>
            );
          })}
      </div>
      <DrawerFooter fetching={fetching} onClose={onClose} onCreate={handleSubmit} />
    </div>
  );
};

export default RowForm;
