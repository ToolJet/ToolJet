import React, { useEffect, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { displayText } from '../lib/displayText';

type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date';

type FormField = {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder: string;
  options: string[];
};

type Values = Record<string, unknown>;

const FIELD_TYPES: FieldType[] = ['text', 'email', 'number', 'textarea', 'select', 'checkbox', 'date'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Fields arrive from the Inspector as arbitrary JSON: keep entries with a name, default the rest.
const toFields = (raw: unknown[]): FormField[] =>
  (Array.isArray(raw) ? raw : [])
    .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object' && !!(f as Record<string, unknown>).name)
    .map((f) => ({
      name: String(f.name),
      label: displayText(f.label ?? f.name),
      type: FIELD_TYPES.includes(f.type as FieldType) ? (f.type as FieldType) : 'text',
      required: Boolean(f.required),
      placeholder: displayText(f.placeholder),
      options: Array.isArray(f.options) ? f.options.map(String) : [],
    }));

const emptyValue = (field: FormField) => (field.type === 'checkbox' ? false : '');

const initialValues = (fields: FormField[], defaults: Values): Values =>
  Object.fromEntries(fields.map((f) => [f.name, defaults?.[f.name] ?? emptyValue(f)]));

const validate = (fields: FormField[], values: Values): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.name];
    const empty = value === '' || value === undefined || value === null || value === false;
    if (field.required && empty) errors[field.name] = `${field.label} is required`;
    else if (!empty && field.type === 'email' && !EMAIL.test(String(value))) errors[field.name] = 'Enter a valid email';
    else if (!empty && field.type === 'number' && Number.isNaN(Number(value))) errors[field.name] = 'Enter a number';
  }
  return errors;
};

// Schema-driven form: fields come from the `fields` property; the form validates them and exposes
// `data` (the current values), `isValid` and `errors`. onSubmit fires only when every field is valid.
export const Form = () => {
  const [rawTitle] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Contact us' });
  const [rawFields] = ToolJet.useStateArray({
    name: 'fields',
    label: 'Fields',
    description:
      'Array of { name, label, type, required, placeholder, options }. type: text, email, number, textarea, select, checkbox or date.',
    initialValue: [
      { name: 'name', label: 'Name', type: 'text', required: true, placeholder: 'Jane Doe' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'jane@example.com' },
      { name: 'topic', label: 'Topic', type: 'select', options: ['Sales', 'Support', 'Other'] },
      { name: 'message', label: 'Message', type: 'textarea', placeholder: 'How can we help?' },
      { name: 'subscribe', label: 'Subscribe to updates', type: 'checkbox' },
    ],
  });
  const [defaults] = ToolJet.useStateObject({
    name: 'defaultValues',
    label: 'Default values',
    description: 'Object of field name → initial value.',
    initialValue: {},
  });
  const [rawSubmitLabel] = ToolJet.useStateString({ name: 'submitLabel', label: 'Submit button', initialValue: 'Submit' });
  const [showReset] = ToolJet.useStateBoolean({ name: 'showReset', label: 'Show reset button', initialValue: true });
  const [disabled] = ToolJet.useStateBoolean({ name: 'disabled', label: 'Disable', initialValue: false });

  const title = displayText(rawTitle);
  const submitLabel = displayText(rawSubmitLabel);
  const fields = toFields(rawFields);
  // A static initialValue: the builder stamps manifest defaults at drop time, and a computed one can't be
  // read statically. The field defaults are merged in below instead.
  const [data, setData] = ToolJet.useStateObject({ name: 'data', initialValue: {}, inspector: 'hidden' });
  const [, setIsValid] = ToolJet.useStateBoolean({ name: 'isValid', initialValue: false, inspector: 'hidden' });
  const [errors, setErrors] = ToolJet.useStateObject({ name: 'errors', initialValue: {}, inspector: 'hidden' });
  const onSubmit = ToolJet.useEventCallback({ name: 'onSubmit' });
  const onChange = ToolJet.useEventCallback({ name: 'onChange' });
  const onReset = ToolJet.useEventCallback({ name: 'onReset' });

  const accent = ToolJet.useStyleString({
    name: 'accentColor',
    label: 'Button',
    inspector: 'color',
    initialValue: 'var(--cc-primary-brand)',
  });
  const fieldGap = ToolJet.useStyleNumber({ name: 'fieldGap', label: 'Field spacing', initialValue: 12 });
  const labelPosition = ToolJet.useStyleEnumeration({
    name: 'labelPosition',
    label: 'Label position',
    enumDefinition: ['top', 'side'],
    enumLabels: { top: 'Top', side: 'Side' },
    initialValue: 'top',
    inspector: 'switch',
  });
  ToolJet.useComponentSettings({ defaultWidth: 16, defaultHeight: 66 });

  // Errors show for a field once it was touched, or for every field after a submit attempt.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const values: Values = {
    ...initialValues(fields, defaults),
    ...(data && typeof data === 'object' ? (data as Values) : {}),
  };
  const visibleErrors = errors as Record<string, string>;

  const apply = (next: Values) => {
    const nextErrors = validate(fields, next);
    setData(next);
    setErrors(nextErrors);
    setIsValid(Object.keys(nextErrors).length === 0);
  };

  const change = (name: string, value: unknown) => {
    apply({ ...values, [name]: value });
    onChange();
  };

  // Report the merged values (and their validity) on mount and whenever the field schema changes, so
  // `data` and `isValid` are right before the first edit.
  const schemaKey = JSON.stringify([fields, defaults]);
  useEffect(() => {
    apply(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemaKey]);

  const submit = () => {
    setSubmitted(true);
    const nextErrors = validate(fields, values);
    setErrors(nextErrors);
    setIsValid(Object.keys(nextErrors).length === 0);
    if (Object.keys(nextErrors).length === 0) onSubmit();
  };

  const reset = () => {
    setTouched({});
    setSubmitted(false);
    apply(initialValues(fields, defaults));
    onReset();
  };

  ToolJet.useAction({ name: 'submit', displayName: 'Submit' }, submit);
  ToolJet.useAction({ name: 'reset', displayName: 'Reset' }, reset);
  ToolJet.useAction(
    { name: 'setValues', displayName: 'Set values', params: [{ handle: 'values', displayName: 'Values (object)' }] },
    (next) => apply({ ...values, ...(typeof next === 'object' && next ? (next as Values) : {}) })
  );

  const renderControl = (field: FormField) => {
    const id = `ui-form-${field.name}`;
    const value = values[field.name];
    const invalid = Boolean((touched[field.name] || submitted) && visibleErrors?.[field.name]);
    const common = {
      id,
      disabled,
      'aria-invalid': invalid,
      onBlur: () => setTouched((t) => ({ ...t, [field.name]: true })),
    };
    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...common}
            className="ui-textarea"
            rows={3}
            placeholder={field.placeholder}
            value={String(value ?? '')}
            onChange={(e) => change(field.name, e.target.value)}
          />
        );
      case 'select':
        return (
          <select
            {...common}
            className="ui-input ui-native-select"
            value={String(value ?? '')}
            onChange={(e) => change(field.name, e.target.value)}
          >
            <option value="">{field.placeholder || 'Select…'}</option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <label className="ui-check-row">
            <input
              {...common}
              type="checkbox"
              className="ui-native-check"
              checked={Boolean(value)}
              onChange={(e) => change(field.name, e.target.checked)}
            />
            <span className="ui-check-text">{field.label}</span>
          </label>
        );
      default:
        return (
          <input
            {...common}
            className="ui-input"
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : 'text'}
            placeholder={field.placeholder}
            value={String(value ?? '')}
            onChange={(e) => change(field.name, field.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)}
          />
        );
    }
  };

  return (
    <form
      className={cn('ui ui-form ui-scroll', labelPosition === 'side' && 'ui-form--side')}
      style={{ ['--ui-primary' as string]: accent, gap: fieldGap }}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {title ? <div className="ui-card-title">{title}</div> : null}
      {fields.map((field) => {
        const error = (touched[field.name] || submitted) && visibleErrors?.[field.name];
        return (
          <div key={field.name} className="ui-form-row">
            {field.type !== 'checkbox' ? (
              <label className="ui-label" htmlFor={`ui-form-${field.name}`}>
                {field.label}
                {field.required ? <span className="ui-required">*</span> : null}
              </label>
            ) : (
              <span />
            )}
            <div className="ui-form-control">
              {renderControl(field)}
              {error ? <p className="ui-form-error">{error}</p> : null}
            </div>
          </div>
        );
      })}
      <div className="ui-form-actions">
        {showReset ? (
          <button type="button" className="ui-btn ui-btn--outline ui-btn--auto" disabled={disabled} onClick={reset}>
            Reset
          </button>
        ) : null}
        <button type="submit" className="ui-btn ui-btn--default ui-btn--auto" disabled={disabled}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
