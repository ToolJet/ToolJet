import _ from 'lodash';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Select, { components } from 'react-select';
import TriangleDownArrow from '@/_ui/Icon/bulkIcons/TriangleDownArrow';
import TriangleUpArrow from '@/_ui/Icon/bulkIcons/TriangleUpArrow';

import { getModifiedColor } from './utils';
import { useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormValidationContext';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/selectionB';

export const DropDown = function DropDown({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  darkMode,
  onComponentClick,
  id,
  dataCy,
  componentType,
  moduleId,
  resolveIndex,
}) {
  const isInitialRender = useRef(true);
  let { label, value, advanced, schema, placeholder, display_values, values } = properties;
  const { selectedTextColor, borderRadius, visibility, disabledState, justifyContent, boxShadow } = styles;

  function findDefaultItem(schema) {
    const foundItem = schema?.find((item) => item?.default === true);
    return !hasVisibleFalse(foundItem?.value) ? foundItem?.value : undefined;
  }

  if (advanced) {
    values = schema?.map((item) => item?.value);
    display_values = schema?.map((item) => item?.label);
    value = findDefaultItem(schema);
  } else if (!_.isArray(values)) {
    values = [];
  }

  const exposedOpts = { resolveIndex, moduleId };
  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Store is the source of truth for the exposed value; the resolved initial
  // value (advanced default item / plain `value`) is the pre-first-publish fallback.
  const storeValue = useExposedVariable(id, 'value', exposedOpts, undefined);
  const initialValue = advanced ? findDefaultItem(schema) : value;
  const currentValue = storeValue !== undefined ? storeValue : initialValue;

  const [showValidationError, setShowValidationError] = useState(false);
  useShowValidationOnFormSubmit(setShowValidationError);
  const validationStatus = useMemo(() => validate(currentValue), [currentValue, validate]);
  const { isValid, validationError } = validationStatus;

  // Latest-ref: the selectOption CSA (registered once at mount) must never
  // close over a stale values/display_values from the mount-time render.
  const optionsRef = useRef({ values, display_values });
  optionsRef.current = { values, display_values };

  let selectOptions = [];

  try {
    selectOptions = advanced
      ? [
          ...schema
            .filter((data) => data.visible)
            .map((value) => ({
              ...value,
              isDisabled: value.disable,
            })),
        ]
      : [
          ...values.map((value, index) => {
            return { label: display_values[index], value: value };
          }),
        ];
  } catch (err) {
    console.log(err);
  }

  // CSA path (RunJS / other components) — old selectOption() always fired
  // onSelect, exposing the value only when it's a member of `values`.
  const selectOption = async (value) => {
    const { values, display_values } = optionsRef.current;
    const index = values?.indexOf(value);
    const found = values?.includes(value);
    dispatch([
      {
        kind: 'INVOKE_CSA',
        componentId: id,
        action: 'selectOption',
        args: [found ? value : undefined, found ? display_values?.[index] : undefined],
      },
      { kind: 'FIRE_EVENT', componentId: id, event: 'onSelect' },
    ]);
  };

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValid]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const index = values?.indexOf(currentValue);
    setExposedVariable('selectedOptionLabel', display_values?.[index]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, JSON.stringify(display_values), JSON.stringify(values)]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (advanced) {
      setExposedVariable(
        'optionLabels',
        schema?.filter((item) => item?.visible)?.map((item) => item.label)
      );
      if (hasVisibleFalse(currentValue)) {
        setInputValue(findDefaultItem(schema));
      }
    } else setExposedVariable('optionLabels', display_values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(schema), advanced, JSON.stringify(display_values), currentValue]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatcher
  // (selectOption is overridden to keep the old label-lookup + event semantics).
  useEffect(() => {
    const index = values?.indexOf(currentValue);
    let optionLabels = display_values;
    if (advanced) {
      optionLabels = schema?.filter((item) => item?.visible)?.map((item) => item.label);
    }
    setExposedVariables({
      ...csaShims(),
      selectOption,
      isValid,
      value: currentValue,
      selectedOptionLabel: display_values?.[index],
      label,
      optionLabels,
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Not isInitialRender-gated: on mount these run in the same effect flush,
  // AFTER the snapshot effect below has already flipped the flag — old code
  // relied on this ordering to apply the membership filter the snapshot
  // itself skips (mount snapshot publishes `currentValue` unfiltered).
  useEffect(() => {
    let newValue = undefined;
    let index = null;
    if (values?.includes(value)) {
      newValue = value;
      index = values?.indexOf(value);
    }
    setInputValue(newValue, index === null ? undefined : display_values?.[index]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value), JSON.stringify(values)]);

  useEffect(() => {
    let newValue = undefined;

    if (values?.includes(currentValue)) newValue = currentValue;
    else if (values?.includes(value)) newValue = value;
    const index = values?.indexOf(newValue);
    setInputValue(newValue, index === undefined || index === -1 ? undefined : display_values?.[index]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  function hasVisibleFalse(value) {
    for (let i = 0; i < schema?.length; i++) {
      if (schema[i].value === value && schema[i].visible === false) {
        return true;
      }
    }
    return false;
  }

  const onSearchTextChange = (searchText, actionProps) => {
    if (actionProps.action === 'input-change') {
      setExposedVariable('searchText', searchText);
      fireEvent('onSearchTextChanged');
    }
  };

  // Internal property-sync auto-correction (schema/values changed) — writes
  // through directly, no dispatch/event (matches old setInputValue, which
  // never fired events on its own).
  const setInputValue = (value, label) => {
    setExposedVariables({ value, selectedOptionLabel: label });
  };

  const customStyles = {
    control: (provided, state) => ({
      ...provided,
      background: 'var(--cc-surface1-surface)',
      minHeight: height,
      height: height,
      boxShadow: state.isFocused ? boxShadow : boxShadow,
      borderRadius: Number.parseFloat(borderRadius),
      ':focus-within': {
        borderColor: 'var(--cc-primary-brand)',
      },
      border: '1px solid var(--cc-default-border)',
    }),
    valueContainer: (provided, _state) => ({
      ...provided,
      height: height,
      padding: '0 6px',
      justifyContent,
      color: 'var(--cc-primary-text)',
    }),

    singleValue: (provided, _state) => ({
      ...provided,
      color: disabledState ? 'grey' : selectedTextColor ? selectedTextColor : darkMode ? 'white' : 'black',
    }),

    input: (provided, _state) => ({
      ...provided,
      color: darkMode ? 'white' : 'black',
      margin: '0px',
    }),
    indicatorSeparator: (_state) => ({
      display: 'none',
    }),
    indicatorsContainer: (provided, _state) => ({
      ...provided,
      height: height,
    }),
    option: (provided, state) => {
      const hoverBgColorValue = getModifiedColor('var(--cc-primary-brand)', 'hover');

      const styles = darkMode
        ? {
            color: 'white',
            backgroundColor: state.value === currentValue ? 'var(--cc-primary-brand)' : 'var(--cc-surface1-surface)',
            ':hover': {
              backgroundColor: state.isDisabled
                ? 'transparent'
                : state.value === currentValue
                ? hoverBgColorValue
                : getModifiedColor(
                    state.value === currentValue ? 'var(--cc-primary-brand)' : 'var(--cc-surface1-surface)',
                    'hover'
                  ),
            },
            maxWidth: 'auto',
            minWidth: 'max-content',
          }
        : {
            backgroundColor: state.value === currentValue ? 'var(--cc-primary-brand)' : 'var(--cc-surface1-surface)',
            color: state.value === currentValue ? 'white' : 'var(--cc-primary-text)',
            ':hover': {
              backgroundColor: state.isDisabled
                ? 'transparent'
                : state.value === currentValue
                ? hoverBgColorValue
                : getModifiedColor(
                    state.value === currentValue ? 'var(--cc-primary-brand)' : 'var(--cc-surface1-surface)',
                    'hover'
                  ),
            },
            maxWidth: 'auto',
            minWidth: 'max-content',
          };
      return {
        ...provided,
        justifyContent,
        height: 'auto',
        display: 'flex',
        flexDirection: 'rows',
        alignItems: 'center',
        ...styles,
      };
    },
    menu: (provided, _state) => ({
      ...provided,
      backgroundColor: 'var(--cc-surface1-surface)',
    }),
  };

  return (
    <>
      <div
        className="dropdown-widget row g-0"
        style={{ height, display: visibility ? '' : 'none' }}
        onClick={(event) => {
          event.stopPropagation();
          onComponentClick(id);
        }}
        data-cy={dataCy}
      >
        <div className="col-auto my-auto">
          <label
            data-cy={`${String(dataCy).toLowerCase()}-label`}
            style={{ marginRight: label !== '' ? '1rem' : '0.001rem', color: 'var(--cc-primary-text)' }}
            className="form-label py-0 my-0"
            id={`${id}-label`}
          >
            {label}
          </label>
        </div>
        <div className="col px-0 h-100">
          <Select
            isDisabled={disabledState}
            value={selectOptions.filter((option) => option.value === currentValue)[0] ?? null}
            onChange={(selectedOption, actionProps) => {
              setShowValidationError(true);
              if (actionProps.action === 'select-option') {
                setInputValue(selectedOption.value, selectedOption.label);
                fireEvent('onSelect');
              }
            }}
            aria-hidden={!visibility}
            aria-disabled={disabledState}
            aria-invalid={!isValid}
            id={`component-${id}`}
            aria-labelledby={`${id}-label`}
            options={selectOptions}
            styles={customStyles}
            isLoading={properties.loadingState}
            onInputChange={onSearchTextChange}
            onFocus={(event) => onComponentClick(id)}
            menuPortalTarget={document.body}
            placeholder={placeholder}
          />
        </div>
      </div>
      <div className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}>
        {showValidationError && validationError}
      </div>
    </>
  );
};
