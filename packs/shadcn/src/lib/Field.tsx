import React from 'react';
import { cn } from './cn';

// Label + control + help text, the shared layout of every form component, with UI 2.0's anatomy (Ui2/_shared/field.tsx):
// a column with an 8px gap holding the label (14px, weight 500, line height 1), the control, then the note (0.8rem).
// Every field draws its label and note here, so a row of fields lines up label to label and control to control.
// Built in, the host gives the control an id (ToolJet.useFieldId) and its validation (ToolJet.useValidation): the label
// names the control, a mandatory field marks its label, and an error replaces the help text.

/** A field's label, with a mark when the field is mandatory. */
export const FieldLabel = ({ htmlFor, text, required }: { htmlFor?: string; text: React.ReactNode; required?: boolean }) => (
  <label className="ui-label" htmlFor={htmlFor}>
    {text}
    {required ? (
      <span className="ui-required" aria-hidden="true">
        *
      </span>
    ) : null}
  </label>
);

/** The validation message, else the help text, under a control. `size` "sm" is the check row's 14px note. */
export const FieldNote = ({ htmlFor, error, description, size }: { htmlFor?: string; error?: string; description?: string; size?: 'sm' }) => {
  const id = htmlFor ? `${htmlFor}-note` : undefined;
  const cls = cn('ui-note', size === 'sm' && 'ui-note--sm');
  return error ? (
    <p className={cn(cls, 'ui-error')} id={id} role="alert">
      {error}
    </p>
  ) : description ? (
    <p className={cn(cls, 'ui-description')} id={id}>
      {description}
    </p>
  ) : null;
};

export const Field = ({
  label,
  description,
  htmlFor,
  error,
  required,
  className,
  children,
}: {
  label?: string;
  description?: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn('ui-field', error && 'ui-field--invalid', className)}>
    {label ? <FieldLabel htmlFor={htmlFor} text={label} required={required} /> : null}
    {children}
    <FieldNote htmlFor={htmlFor} error={error} description={description} />
  </div>
);

/** UI 2.0's check row (Ui2/_shared/formHooks CheckedRow), the Checkbox's and Switch's layout: the control, then 12px on
 *  its right the label over the note, 6px apart, all top aligned. */
export const CheckedRow = ({
  control,
  label,
  description,
  htmlFor,
  error,
  required,
  className,
}: {
  control: React.ReactNode;
  label?: string;
  description?: string;
  htmlFor?: string;
  error?: string;
  required?: boolean;
  className?: string;
}) => (
  <div className={cn('ui-check-row uc-check-row', error && 'is-invalid', className)}>
    {control}
    <div className="ui-check-text">
      {label ? <FieldLabel htmlFor={htmlFor} text={label} required={required} /> : null}
      <FieldNote htmlFor={htmlFor} error={error} description={description} size="sm" />
    </div>
  </div>
);

/** aria for a control in a Field: its note, and whether it is invalid or required. */
export const fieldAria = (id: string | undefined, error?: string, required?: boolean, hasNote?: boolean) => ({
  id,
  'aria-invalid': error ? true : undefined,
  'aria-required': required || undefined,
  'aria-describedby': id && (error || hasNote) ? `${id}-note` : undefined,
});

export type Option = { label: string; value: string; disabled?: boolean };

// Options arrive from the Inspector as arbitrary JSON; keep only well-formed entries.
export const toOptions = (raw: unknown[]): Option[] =>
  (Array.isArray(raw) ? raw : [])
    .map((o) =>
      typeof o === 'string'
        ? { label: o, value: o }
        : o && typeof o === 'object'
          ? {
              label: String((o as Record<string, unknown>).label ?? (o as Record<string, unknown>).value ?? ''),
              value: String((o as Record<string, unknown>).value ?? (o as Record<string, unknown>).label ?? ''),
              disabled: Boolean((o as Record<string, unknown>).disabled),
            }
          : null
    )
    .filter((o): o is Option => !!o && o.value !== '');
