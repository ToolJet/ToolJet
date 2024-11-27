import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import Label from '@/_ui/Label';
import cx from 'classnames';
import './radioButtonV2.scss';
import Loader from '@/ToolJetUI/Loader/Loader';
import { has, isObject } from 'lodash';

export const RadioButtonV2 = ({ properties, styles, fireEvent, setExposedVariable, darkMode, component, validate }) => {
  const { label, value, disabledState, advanced, schema, optionsLoadingState, loadingState } = properties;

  const {
    activeColor,
    direction,
    auto: labelAutoWidth,
    labelWidth,
    optionsTextColor,
    borderColor,
    switchOffBackgroundColor,
    handleColor,
    switchOnBackgroundColor,
    labelColor,
    alignment,
  } = styles;

  const [checkedValue, setCheckedValue] = useState(advanced ? findDefaultItem(schema) : value);
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const options = component?.definition?.properties?.options?.value;
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);
  const validationData = validate(checkedValue);
  const { isValid, validationError } = validationData;
  const labelRef = useRef();
  const radioBtnRef = useRef();

  function findDefaultItem(schema) {
    let _schema = schema;
    if (!Array.isArray(schema)) {
      _schema = [];
    }
    const foundItem = _schema?.find((item) => item?.default === true);
    return !hasVisibleFalse(foundItem?.value) ? foundItem?.value : undefined;
  }

  const selectOptions = useMemo(() => {
    let _options = advanced ? schema : options;
    if (Array.isArray(_options)) {
      let _selectOptions = _options
        .filter((data) => resolveReferences(advanced ? data?.visible : data?.visible?.value, currentState))
        .map((data) => ({
          ...data,
          label: resolveReferences(data?.label, currentState),
          value: resolveReferences(data?.value, currentState),
          isDisabled: resolveReferences(advanced ? data?.disable : data?.disable?.value, currentState),
        }));
      return _selectOptions;
    } else {
      return [];
    }
  }, [advanced, schema, options]);

  function onSelect(value) {
    let _value = value;
    if (isObject(value) && has(value, 'value')) _value = value?.value;
    setCheckedValue(_value);
    fireEvent('onSelectionChange');
  }

  function deselectOption() {
    setCheckedValue(null);
    fireEvent('onSelectionChange');
  }

  function hasVisibleFalse(value) {
    for (let i = 0; i < schema?.length; i++) {
      if (schema[i].value === value && schema[i].visible === false) {
        return true;
      }
    }
    return false;
  }

  useEffect(() => {
    if (advanced) {
      setCheckedValue(findDefaultItem(schema));
    } else setCheckedValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, value, JSON.stringify(schema)]);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isLoading !== loadingState) setIsLoading(loadingState);
    if (isDisabled !== disabledState) setIsDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState]);

  useEffect(() => {
    setExposedVariable('isVisible', properties.visibility);
    setExposedVariable('isLoading', loadingState);
    setExposedVariable('isDisabled', disabledState);
    setExposedVariable('isMandatory', isMandatory);
    setExposedVariable('label', label);
    setExposedVariable('options', selectOptions);
    setExposedVariable('isValid', isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState, isMandatory, label, isValid]);

  useEffect(() => {
    const _options = selectOptions?.map(({ label, value }) => ({ label, value }));
    setExposedVariable('options', _options);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectOptions]);

  useEffect(() => {
    setExposedVariable('value', checkedValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedValue]);

  useEffect(() => {
    setExposedVariable('setVisibility', async function (value) {
      setVisibility(value);
    });
    setExposedVariable('setLoading', async function (value) {
      setIsLoading(value);
    });
    setExposedVariable('setDisabled', async function (value) {
      setIsDisabled(value);
    });
    setExposedVariable('selectOption', onSelect);
    setExposedVariable('deselectOption', deselectOption);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _width = (labelWidth / 100) * 70; // Max width which label can go is 70% for better UX calculate width based on this value

  return (
    <>
      <div
        data-cy={`label-${String(component.name).toLowerCase()} `}
        data-disabled={disabledState}
        id={String(component.name)}
        className={cx('radio-button,', 'd-flex', {
          [alignment === 'top' &&
          ((labelWidth != 0 && label?.length != 0) ||
            (labelAutoWidth && labelWidth == 0 && label && label?.length != 0))
            ? 'flex-column'
            : '']: true,
          'flex-row-reverse': direction === 'right' && alignment === 'side',
          'text-right': direction === 'right' && alignment === 'top',
          invisible: !visibility,
          visibility: visibility,
        })}
        style={{
          position: 'relative',
          width: '100%',
          paddingLeft: '0px',
        }}
      >
        <Label
          label={label}
          width={labelWidth}
          labelRef={labelRef}
          darkMode={darkMode}
          color={labelColor}
          defaultAlignment={alignment}
          direction={direction}
          auto={labelAutoWidth}
          isMandatory={isMandatory}
          _width={_width}
        />

        <div className="px-0 h-100 w-100" ref={radioBtnRef}>
          {loadingState || optionsLoadingState ? (
            <Loader style={{ right: '50%', zIndex: 3, position: 'absolute' }} width="20" />
          ) : (
            <div className="">
              {selectOptions.map((option, index) => {
                const isChecked = checkedValue == option.value;
                return (
                  <label key={index} className="radio-button-container">
                    <span
                      style={{
                        color:
                          optionsTextColor !== '#1B1F24'
                            ? optionsTextColor
                            : isDisabled || isLoading
                            ? 'var(--text-disabled)'
                            : 'var(--text-primary)',
                      }}
                    >
                      {option.label}
                    </span>
                    <input
                      style={{
                        marginTop: '1px',
                        backgroundColor: checkedValue === option.value ? `${activeColor}` : 'white',
                      }}
                      checked={checkedValue == option.value}
                      type="radio"
                      value={option.value}
                      onChange={() => onSelect(option.value)}
                      disabled={option.isDisabled}
                    />
                    <span
                      className="checkmark"
                      style={{
                        backgroundColor:
                          !isChecked && (option.isDisabled ? 'var(--surfaces-surface-03)' : switchOffBackgroundColor),
                        '--selected-background-color': option.isDisabled
                          ? 'var(--surfaces-surface-03)'
                          : switchOnBackgroundColor,
                        '--selected-border-color': borderColor,
                        '--selected-handle-color': option.isDisabled ? 'var(--icons-default)' : handleColor,
                        border:
                          !isChecked && (option.isDisabled ? 'var(--surfaces-surface-03)' : `1px solid ${borderColor}`),
                      }}
                    ></span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div
        className={`${isValid ? '' : visibility ? 'd-flex' : 'none'}`}
        style={{
          color: 'var(--status-error-strong)',
          justifyContent: direction === 'right' ? 'flex-start' : 'flex-end',
          fontSize: '11px',
          fontWeight: '400',
          lineHeight: '16px',
        }}
      >
        {!isValid && validationError}
      </div>
    </>
  );
};
