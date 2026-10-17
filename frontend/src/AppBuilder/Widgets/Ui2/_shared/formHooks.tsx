// State, validation and focus behaviour the UI 2.0 inputs share.
import React, { useEffect, useRef, useState } from 'react';
import { fromEffect, runNow, useExposed, useLatest, useStable } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { useFormClear, useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { truthy } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { isFilled, validationInput } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { CONTROL, FieldLabel, FieldNote, INVALID_VARS, controlAria, fieldName, fieldIdOf } from './field';
import { busy } from './Shell';
import type { ChangeEvent, Dispatch, RefObject, SetStateAction } from 'react';
import type { Exposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import type { ValidationResult, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';

/** What the value hooks read of the widget's props. */
export type ValueProps = Pick<WidgetProps, 'properties' | 'setExposedVariable' | 'setExposedVariables' | 'fireEvent'>;

/** Sets the value as the user does: publishes it, and everything derived from it (isValid, a selected option), then
 *  fires `event` (onChange by default), so the event's handlers read the new state (runNow). */
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
  // A new default (by content) resets the value, as the native inputs do.
  const seed = useStable(initial);
  useEffect(() => setValue(seed), [seed]);
  useExposed(setExposedVariables, properties, { value: toExposed(value) ?? '', ...actions(setValue) });
  const change: ChangeValue<T> = (v, event = 'onChange') =>
    runNow(() => {
      setValue(v);
      setExposedVariable('value', toExposed(v) ?? '');
      fireEvent(event);
    });
  return [value, change];
};

/** Runs `clear` when a Form around the control clears (clearForm), for every value control, validating or not, as the
 *  native inputs do. The signal arrives in an effect, so the change runs there without a flush (fromEffect). */
export const useFormClearNow = (clear?: () => void): void => {
  useFormClear(() => fromEffect(() => clear?.()));
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
  clear?: () => void,
  /** Whether the field holds a value, when that is not just "not empty": a Checkbox only once checked, a Select once
   *  an option is picked (an option's value can be ''). 0 and false are values (validationInput). */
  present: boolean = isFilled(value)
): Validation => {
  const { validate, validation, setExposedVariable } = props;
  const status: ValidationResult =
    (typeof validate === 'function' ? validate(validationInput(present, value)) : null) || {};
  const isValid = status.isValid !== false;
  const isMandatory = validation?.mandatory === true;
  const [touched, setTouched] = useState(false);
  useShowValidationOnFormSubmit(setTouched);
  useFormClearNow(() => {
    clear?.();
    setTouched(false);
  });
  const publish = useLatest(setExposedVariable);
  useEffect(() => {
    publish.current('isValid', isValid);
  }, [isValid, publish]);
  useEffect(() => {
    publish.current('isMandatory', isMandatory);
  }, [isMandatory, publish]);
  return {
    error: touched && !isValid ? status.validationError || 'Invalid value' : '',
    required: isMandatory,
    touch: () => setTouched(true),
    untouch: () => setTouched(false),
  };
};

/** onFocus a tick after focus, as the native inputs fire it (a click that focuses a box reads in order); a widget
 *  unmounted before the tick fires nothing. Call the returned function from the control's focus handler. */
export const useFocusEvent = (fireEvent: WidgetProps['fireEvent']): (() => void) => {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const fire = useLatest(fireEvent);
  useEffect(() => () => clearTimeout(timer.current), []);
  return () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fire.current('onFocus'), 0);
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
  const focusEvent = useFocusEvent(fireEvent);
  // The native inputs expose their label.
  useExposed(setExposedVariables, properties, { label: String(properties.label ?? '') });
  const publish = useLatest(setExposedVariables);
  useEffect(() => {
    publish.current({
      setFocus: async () => ref.current?.focus(),
      setBlur: async () => ref.current?.blur(),
    });
  }, [publish]);
  return {
    ref,
    onFocus: focusEvent,
    onBlur: () => {
      touch();
      fireEvent('onBlur');
    },
  };
};

/** A text field (Input, Textarea): its value with the setText and clear actions, validation, and the props its
 *  control takes (spread `fieldProps` on it). */
export const useTextField = <E extends HTMLInputElement | HTMLTextAreaElement>(props: WidgetProps) => {
  const { properties } = props;
  // The native setText and clear change the value as typing does (onChange) and show its validation message.
  const reveal = useRef(() => {});
  const [value, change] = useValue(props, String(properties.defaultValue ?? ''), () => ({
    setText: async (t: unknown) => {
      change(String(t ?? ''));
      reveal.current();
    },
    clear: async () => {
      change('');
      reveal.current();
    },
  }));
  const check = useValidation(props, value, () => change('', 'onChange'));
  reveal.current = check.touch;
  const box = useTextBox<E>(props, check.touch);
  const fieldProps = {
    ref: box.ref,
    id: fieldIdOf(props),
    className: CONTROL,
    value,
    ...controlAria(props, check.error),
    'aria-label': fieldName(props),
    onFocus: box.onFocus,
    onBlur: box.onBlur,
    placeholder: String(properties.placeholder ?? ''),
    disabled: busy(properties),
    onChange: (e: ChangeEvent<E>) => change(e.target.value),
  };
  return { check, fieldProps };
};

/** Sets the checked state as a click does; only `true` checks (Radix passes 'indeterminate' too). */
export type ChangeChecked = (checked: unknown) => void;

export const useChecked = (props: ValueProps & Pick<WidgetProps, 'componentType'>): [boolean, ChangeChecked] => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [checked, setChecked] = useState(!!properties.defaultChecked);
  useEffect(() => setChecked(!!properties.defaultChecked), [properties.defaultChecked]);
  const checkedRef = useRef(checked);
  checkedRef.current = checked;
  const change: ChangeChecked = (v) =>
    runNow(() => {
      checkedRef.current = v === true;
      setChecked(v === true);
      setExposedVariable('value', v === true);
      fireEvent('onChange');
      if (props.componentType === 'ShadCheckbox') fireEvent(v === true ? 'onCheck' : 'onUnCheck');
    });
  // The native Checkbox and Toggle switch actions, with the native events, every time: a Checkbox's setValue fires
  // onCheck or onUnCheck (not onChange) and its toggle fires onChange; a Switch's setValue fires nothing and its toggle
  // fires onChange.
  const set = (v: boolean, events: string[]) => {
    checkedRef.current = v;
    setChecked(v);
    setExposedVariable('value', v);
    events.forEach((event) => fireEvent(event));
  };
  const isCheckbox = props.componentType === 'ShadCheckbox';
  useExposed(setExposedVariables, properties, {
    value: checked,
    label: String(properties.label ?? ''),
    toggle: async () => set(!checkedRef.current, ['onChange']),
    setValue: async (v: unknown) => {
      const next = truthy(v);
      set(next, isCheckbox ? [next ? 'onCheck' : 'onUnCheck'] : []);
    },
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
  <div className="tw-flex tw-items-start tw-gap-3" style={error ? INVALID_VARS : undefined}>
    {control}
    <div className="tw-grid tw-gap-1.5 tw-leading-none">
      <FieldLabel id={id} text={String(label ?? '')} required={required} />
      <FieldNote error={error} description={description} size="tw-text-ui2-sm" controlId={id} />
    </div>
  </div>
);
