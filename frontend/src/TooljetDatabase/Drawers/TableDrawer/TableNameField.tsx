import React, { useState } from 'react';
import { Field, FieldError, FieldLabel } from '@/components/ui/Rocket/Field/Field';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { getTableNameError, NAME_EMPTY_ERROR, TABLE_NAME_HINT } from './tableNameRules';

type TableNameFieldProps = {
  value: string;
  onChange: (name: string) => void;
  autoFocus?: boolean;
  /** Tables already in the workspace. */
  existingNames?: string[];
};

// 400px wide, as in the design: label 12px medium, field 32px, helper 11px under it.
export function TableNameField({ value, onChange, autoFocus, existingNames }: TableNameFieldProps) {
  // An empty name is only an error once the field was typed in or left.
  const [touched, setTouched] = useState(false);
  const error = getTableNameError(value, existingNames) ?? (touched && value === '' ? NAME_EMPTY_ERROR : null);
  return (
    <Field className="tw-w-[400px] tw-max-w-full tw-gap-1">
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        <FieldLabel htmlFor="table-name" className="tw-pl-0.5 tw-font-title-default" data-cy="table-name-label">
          Table name
        </FieldLabel>
        <Input
          id="table-name"
          value={value}
          autoFocus={autoFocus}
          placeholder="Enter table name"
          aria-invalid={!!error}
          className="tw-px-2 md:tw-text-base"
          onChange={(event) => {
            setTouched(true);
            onChange(event.target.value);
          }}
          onBlur={() => setTouched(true)}
          data-cy="table-name-input-field"
        />
      </div>
      {error ? (
        <FieldError className="tw-font-body-small">{error}</FieldError>
      ) : (
        <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder">{TABLE_NAME_HINT}</p>
      )}
    </Field>
  );
}
