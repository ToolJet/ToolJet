import React, { useState } from 'react';
import { TriangleAlert } from 'lucide-react';
import { Field, FieldError, FieldLabel } from '@/components/ui/Rocket/Field/Field';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { cn } from '@/lib/utils';

type NameFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (name: string) => void;
  /** What is wrong with a non-empty name, or null. */
  getError: (name: string) => string | null;
  /** Shown once the field was typed in or left empty. */
  emptyError: string;
  /** Helper line under the field while there is no error. */
  hint?: string;
  autoFocus?: boolean;
  className?: string;
  'data-cy': string;
  labelDataCy?: string;
};

// A labelled name input (Figma: label 12px medium, field 32px). A problem turns the field red and replaces the hint with
// the message under it.
export function NameField({
  id,
  label,
  placeholder,
  value,
  onChange,
  getError,
  emptyError,
  hint,
  autoFocus,
  className,
  'data-cy': dataCy,
  labelDataCy,
}: NameFieldProps) {
  // An empty name is only an error once the field was typed in or left.
  const [touched, setTouched] = useState(false);
  const error = getError(value) ?? (touched && value === '' ? emptyError : null);
  return (
    <Field className={cn('tw-gap-1', className)}>
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        <FieldLabel htmlFor={id} className="tw-pl-0.5 tw-font-title-default" data-cy={labelDataCy}>
          {label}
        </FieldLabel>
        <Input
          id={id}
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="tw-px-2 md:tw-text-base aria-[invalid=true]:focus-visible:!tw-border-border-danger-strong"
          onChange={(event) => {
            setTouched(true);
            onChange(event.target.value);
          }}
          onBlur={() => setTouched(true)}
          data-cy={dataCy}
        />
      </div>
      {error ? (
        <div className="tw-flex tw-items-center tw-gap-0.5">
          <TriangleAlert className="tw-size-3 tw-text-icon-danger" aria-hidden />
          <FieldError id={`${id}-error`} className="tw-font-body-small">
            {error}
          </FieldError>
        </div>
      ) : (
        hint && <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder">{hint}</p>
      )}
    </Field>
  );
}
