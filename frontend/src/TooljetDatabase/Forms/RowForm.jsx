import React, { useState, useContext } from 'react';
import { toast } from 'react-hot-toast';
import Toggle from '@/_ui/Toggle';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';

const RowForm = ({ onCreate, onClose }) => {
  const { organizationId, selectedTable, columns } = useContext(TooljetDatabaseContext);
  const [data, setData] = useState({});

  const handleInputChange = (columnName) => (e) => {
    setData({ ...data, [columnName]: e.target.value });
  };

  const handleToggleChange = (columnName) => (e) => {
    setData({ ...data, [columnName]: e.target.checked });
  };

  const handleSubmit = async () => {
    const { error } = await tooljetDatabaseService.createRow(organizationId, selectedTable, data);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new column table "${selectedTable}"`);
      return;
    }
    toast.success(`Row created successfully`);
    onCreate && onCreate();
  };

  const renderElement = (columnName, dataType) => {
    switch (dataType) {
      case 'character varying':
      case 'integer':
      case 'serial':
      case 'double precision':
        return (
          <input
            type="text"
            disabled={dataType === 'serial'}
            onChange={handleInputChange(columnName)}
            placeholder="Enter a column name"
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
                <div className="form-label">{Header}</div>
                {renderElement(accessor, dataType)}
              </div>
            );
          })}
      </div>
      <DrawerFooter onClose={onClose} onCreate={handleSubmit} />
    </div>
  );
};

export default RowForm;
