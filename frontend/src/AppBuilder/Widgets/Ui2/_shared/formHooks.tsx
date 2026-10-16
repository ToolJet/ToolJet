// State, validation and focus behaviour the UI 2.0 inputs share.
import React, { useEffect, useRef, useState } from 'react';
import { useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Label, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { useFormClear, useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { truthy } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { ERROR, HELP, INVALID_VARS, LABEL } from './field';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import type { Exposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { ValidationResult, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** What the value hooks read of the widget's props. */
export type ValueProps = Pick<WidgetProps, 'properties' | 'setExposedVariable' | 'setExposedVariables' | 'fireEvent'>;

/** Sets the value as the user does: publishes it and fires `event` (onChange by default). */
export type ChangeValue<T> = (value: T, event?: string) => void;

/** A single-value input: local state seeded from defaultValue, published as `value` (through `toExposed`, for
 *  controls that key options by string), plus actions built from the setter. */
export const useValue = <T,>(
  props: ValueProps,
  initial: T,
  actions: (set: Dispatch<SetStateAction<T>>) => Exposed = () => ({}),
  toExposed: (value: T) => unknown = (v) => v
): [T, ChangeValue<T>] => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(initial);
  const key = stringify(initial ?? null);
  useEffect(() => setValue(initial), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useExposed(setExposedVariables, properties, { value: toExposed(value) ?? '', ...actions(setValue) });
  const change: ChangeValue<T> = (v, event = 'onChange') => {
    setValue(v);
    setExposedVariable('value', toExposed(v) ?? '');
    fireEvent(event);
  };
  return [value, change];
};

/** Validation the native way: validate(value) (the widget's Validation section) gives isValid and the message, both
 *  exposed with isMandatory; the message shows once the user has left the control (touch) or a form around it tried to
 *  submit. A form's clearForm calls `clear`. */
/** The field's validation state: the message to show ('' for none), whether it is mandatory, and touch/untouch for
 *  when the message may show. */
export interface Validation {
  error: string;
  required: boolean;
  touch: () => void;
  untouch: () => void;
}

export const useValidation = (
  props: Pick<WidgetProps, 'validate' | 'validation' | 'setExposedVariable'>,
  value: unknown,
  clear?: () => void
): Validation => {
  const { validate, validation, setExposedVariable } = props;
  const status: ValidationResult = (typeof validate === 'function' ? validate(value) : null) || {};
  const isValid = status.isValid !== false;
  const isMandatory = validation?.mandatory === true;
  const [touched, setTouched] = useState(false);
  useShowValidationOnFormSubmit(setTouched);
  useFormClear(() => {
    clear?.();
    setTouched(false);
  });
  useEffect(() => {
    setExposedVariable('isValid', isValid);
  }, [isValid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    error: touched && !isValid ? status.validationError || 'Invalid value' : '',
    required: isMandatory,
    touch: () => setTouched(true),
    untouch: () => setTouched(false),
  };
};

/** Text box events and actions shared by Input and Textarea: focus and blur (events and actions), and blur marks
 *  the field touched for validation. */
export interface TextBox<E extends HTMLElement> {
  ref: RefObject<E>;
  onFocus: () => void;
  onBlur: () => void;
}

export const useTextBox = <E extends HTMLElement = HTMLInputElement>(
  props: Pick<WidgetProps, 'fireEvent' | 'setExposedVariables' | 'properties'>,
  touch: () => void
): TextBox<E> => {
  const { fireEvent, setExposedVariables, properties } = props;
  const ref = useRef<E>(null);
  // The native inputs expose their label.
  useExposed(setExposedVariables, properties, { label: String(properties.label ?? '') });
  useEffect(() => {
    setExposedVariables({
      setFocus: async () => ref.current?.focus(),
      setBlur: async () => ref.current?.blur(),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    ref,
    onFocus: () => setTimeout(() => fireEvent('onFocus'), 0),
    onBlur: () => {
      touch();
      fireEvent('onBlur');
    },
  };
};

/** Sets the checked state as a click does; only `true` checks (Radix passes 'indeterminate' too). */
export type ChangeChecked = (checked: unknown) => void;

export const useChecked = (props: ValueProps & Pick<WidgetProps, 'componentType'>): [boolean, ChangeChecked] => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [checked, setChecked] = useState(!!properties.defaultChecked);
  useEffect(() => setChecked(!!properties.defaultChecked), [properties.defaultChecked]);
  const checkedRef = useRef(checked);
  checkedRef.current = checked;
  const change: ChangeChecked = (v) => {
    checkedRef.current = v === true;
    setChecked(v === true);
    setExposedVariable('value', v === true);
    fireEvent('onChange');
    if (props.componentType === 'ShadCheckbox') fireEvent(v === true ? 'onCheck' : 'onUnCheck');
  };
  // The native Checkbox and Toggle switch actions: toggle(), setValue(value) and the Checkbox's setChecked(status)
  // change it as a click does, with its events (the native setValue fires onCheck or onUnCheck but not onChange, and
  // toggle the reverse; here each fires what a click fires). Setting the value it already has fires nothing.
  const set = (v: unknown) => {
    const next = truthy(v);
    if (next !== checkedRef.current) change(next);
  };
  useExposed(setExposedVariables, properties, {
    value: checked,
    label: String(properties.label ?? ''),
    toggle: async () => change(!checkedRef.current),
    setValue: async (v: unknown) => set(v),
  });
  return [checked, change];
};

export interface CheckedRowProps {
  id?: string;
  /** The checkbox or switch. */
  control: React.ReactNode;
  /** Bound values, shown as text. */
  label?: unknown;
  description?: unknown;
  error?: string;
  required?: boolean;
}

export const CheckedRow = ({ id, control, label, description, error, required }: CheckedRowProps) => (
  <div className="flex items-start gap-3" style={error ? INVALID_VARS : undefined}>
    {control}
    <div className="grid gap-1.5 leading-none">
      <Label htmlFor={id} className={LABEL}>
        {String(label ?? '')}
        {required ? <span className={cn('ml-0.5', ERROR)}>*</span> : null}
      </Label>
      {error ? (
        <p role="alert" className={cn('text-sm font-medium', ERROR)}>
          {String(error)}
        </p>
      ) : description ? (
        <p className={cn('text-sm', HELP)}>{String(description)}</p>
      ) : null}
    </div>
  </div>
);
