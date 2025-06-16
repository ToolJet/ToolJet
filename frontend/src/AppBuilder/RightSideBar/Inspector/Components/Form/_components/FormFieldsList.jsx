import React, { useState } from 'react';
import { FormField } from './FormField';
import { Button } from '@/components/ui/Button/Button';
import { FORM_STATUS } from '../constants';

export const FormFieldsList = ({ fields, onDeleteField, setIsModalOpen, currentStatusRef, onSave }) => {
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

      <div className="tw-flex tw-justify-center tw-items-center tw-mt-3">
        <Button
          fill="#ACB2B9"
          leadingIcon="sliders"
          variant="outline"
          onClick={() => {
            currentStatusRef.current = FORM_STATUS.MANAGE_FIELDS;
            setIsModalOpen(true);
          }}
        >
          Manage fields
        </Button>
      </div>
    </div>
  );
};
