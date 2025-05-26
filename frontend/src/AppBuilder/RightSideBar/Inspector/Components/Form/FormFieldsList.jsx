import React, { useState } from 'react';
import { FormField } from './FormField';
import { Button } from '@/components/ui/Button/Button';

export const FormFieldsList = ({ fields, isFormGenerated, onDeleteField, setIsModalOpen }) => {
  const [activeMenuField, setActiveMenuField] = useState(null);

  if (!isFormGenerated || fields.length === 0) {
    return (
      <span className="base-regular text-placeholder tw-block tw-p-3 tw-text-center">
        No fields yet. Generate a form from a data source or add custom fields.
      </span>
    );
  }

  return (
    <>
      <div className="tw-flex tw-flex-col tw-gap-1">
        {fields.map((field, index) => (
          <FormField
            key={field.name}
            field={field}
            activeMenu={activeMenuField}
            onMenuToggle={(fieldName) => setActiveMenuField(fieldName)}
            onDelete={onDeleteField}
          />
        ))}
      </div>

      <div className="tw-flex tw-justify-center tw-items-center tw-mt-3">
        <Button fill="#ACB2B9" leadingIcon="sliders" variant="outline" onClick={() => setIsModalOpen(true)}>
          Manage fields
        </Button>
      </div>
    </>
  );
};
