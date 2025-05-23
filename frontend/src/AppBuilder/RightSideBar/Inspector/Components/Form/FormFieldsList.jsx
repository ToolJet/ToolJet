import React, { useState } from 'react';
import { FormField } from './FormField';

export const FormFieldsList = ({ fields, onDeleteField }) => {
  const [activeMenuField, setActiveMenuField] = useState(null);

  if (fields.length === 0) {
    return (
      <span className="base-regular text-placeholder tw-block tw-p-3 tw-text-center">
        No fields yet. Generate a form from a data source or add custom fields.
      </span>
    );
  }

  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      {fields.map((field, index) => (
        <FormField
          key={field.name}
          field={field}
          activeMenu={activeMenuField}
          onMenuToggle={(fieldName) => setActiveMenuField(fieldName)}
          onDelete={() => onDeleteField(index)}
        />
      ))}
    </div>
  );
};
