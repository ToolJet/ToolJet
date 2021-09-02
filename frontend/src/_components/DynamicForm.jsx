import React from 'react';

const DynamicForm = ({ schema, optionchanged, createDataSource, options, isSaving, hideModal, selectedDataSource }) => {
  // if(schema.properties)  todo add empty check
  return (
    <div className="row">
      {Object.keys(schema.properties).map((key) => {
        const { $label, $key, description, type } = schema.properties[key];

        return (
          <div className="col-md-12">
            <label className="form-label">{$label}</label>
            <input
              type={type}
              placeholder={description}
              className="form-control"
              onChange={(e) => optionchanged($key, e.target.value)}
              value={options[$key].value}
            />
          </div>
        );
      })}
    </div>
  );
};

export default DynamicForm;
