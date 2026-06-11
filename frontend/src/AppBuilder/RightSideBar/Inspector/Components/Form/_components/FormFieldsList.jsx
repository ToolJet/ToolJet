import React, { useState } from 'react';
import { FormField } from './index';

export const FormFieldsList = ({ fields, onDeleteField, currentStatusRef, onSave }) => {
  const [activeMenuField, setActiveMenuField] = useState(null);

  if (fields.length === 0) {
    return (
      <span className="base-regular text-placeholder tw-block tw-p-3 tw-text-center">
        No fields yet. Generate a form from a data source or add custom fields.
      </span>
    );
  }

  return (
    <div className="tw-flex tw-flex-col" style={{ maxHeight: '400px' }}>
      <div className="tw-flex-grow tw-overflow-y-auto tw-max-h-[calc(100%-50px)]">
        <div className="tw-flex tw-flex-col tw-gap-1">
          {fields.map((field) => (
            <FormField
              key={field.name}
              field={field}
              activeMenu={activeMenuField}
              onMenuToggle={(fieldName) => {
                currentStatusRef.current = null;
                setActiveMenuField(fieldName);
              }}
              onDelete={onDeleteField}
              onSave={onSave}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
