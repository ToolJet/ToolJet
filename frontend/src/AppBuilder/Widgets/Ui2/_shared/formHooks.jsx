// State, validation and focus behaviour the UI 2.0 inputs share.
import React, { useEffect, useRef, useState } from 'react';
import { useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Label, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { useFormClear, useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { truthy } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { ERROR, HELP, INVALID_VARS, LABEL } from './field';

// ---- Inputs --------------------------------------------------------------------------------------------------------

/** A single-value input: local state seeded from defaultValue, published as `value` (through `toExposed`, for
 *  controls that key options by string), plus actions built from the setter. */
export const useValue = (props, initial, actions = () => ({}), toExposed = (v) => v) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(initial);
  const key = stringify(initial ?? null);
  useEffect(() => setValue(initial), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useExposed(setExposedVariables, properties, { value: toExposed(value) ?? '', ...actions(setValue) });
  const change = (v, event = 'onChange') => {
    setValue(v);
    setExposedVariable('value', toExposed(v) ?? '');
    fireEvent(event);
  };
  return [value, change];
};

/** Validation the native way: validate(value) (the widget's Validation section) gives isValid and the message, both
 *  exposed with isMandatory; the message shows once the user has left the control (touch) or a form around it tried to
 *  submit. A form's clearForm calls `clear`. */
export const useValidation = (props, value, clear) => {
  const { validate, validation, setExposedVariable } = props;
  const status = (typeof validate === 'function' ? validate(value) : null) || {};
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
export const useTextBox = (props, touch) => {
  const { fireEvent, setExposedVariables, properties } = props;
  const ref = useRef(null);
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

export const useChecked = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [checked, setChecked] = useState(!!properties.defaultChecked);
  useEffect(() => setChecked(!!properties.defaultChecked), [properties.defaultChecked]);
  const checkedRef = useRef(checked);
  checkedRef.current = checked;
  const change = (v) => {
    checkedRef.current = v === true;
    setChecked(v === true);
    setExposedVariable('value', v === true);
    fireEvent('onChange');
    if (props.componentType === 'ShadCheckbox') fireEvent(v === true ? 'onCheck' : 'onUnCheck');
  };
  // The native Checkbox and Toggle switch actions: toggle(), setValue(value) and the Checkbox's setChecked(status)
  // change it as a click does, with its events (the native setValue fires onCheck or onUnCheck but not onChange, and
  // toggle the reverse; here each fires what a click fires). Setting the value it already has fires nothing.
  const set = (v) => {
    const next = truthy(v);
    if (next !== checkedRef.current) change(next);
  };
  useExposed(setExposedVariables, properties, {
    value: checked,
    label: String(properties.label ?? ''),
    toggle: async () => change(!checkedRef.current),
    setValue: async (v) => set(v),
  });
  return [checked, change];
};

export const CheckedRow = ({ id, control, label, description, error, required }) => (
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
