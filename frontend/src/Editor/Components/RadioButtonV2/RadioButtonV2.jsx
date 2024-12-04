import React, { useEffect, useMemo, useState, useRef } from 'react';
import Label from '@/_ui/Label';
import cx from 'classnames';
import './radioButtonV2.scss';
import Loader from '@/ToolJetUI/Loader/Loader';
import { has, isObject } from 'lodash';

export const RadioButtonV2 = ({
  properties,
  styles,
  fireEvent,
  setExposedVariable,
  setExposedVariables,
  darkMode,
  componentName,
  validate,
  validation,
}) => {
  const { label, value, options, disabledState, advanced, schema, optionsLoadingState, loadingState } = properties;

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

  const isInitialRender = useRef(true);

  const [checkedValue, setCheckedValue] = useState(advanced ? findDefaultItem(schema) : value);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isLoading, setIsLoading] = useState(loadingState);
  const [isDisabled, setIsDisabled] = useState(disabledState);

  const isMandatory = validation?.mandatory ?? false;
  const [validationStatus, setValidationStatus] = useState(validate(checkedValue));
  const { isValid, validationError } = validationStatus;

  const labelRef = useRef();
  const radioBtnRef = useRef();

  const selectOptions = useMemo(() => {
    let _options = advanced ? schema : options;
    if (Array.isArray(_options)) {
      let _selectOptions = _options
        .filter((data) => data?.visible ?? true)
        .map((data) => ({
          ...data,
          label: data?.label,
          value: data?.value,
          isDisabled: data?.disable ?? false,
        }));
      return _selectOptions;
    } else {
      return [];
    }
  }, [advanced, schema, options]);

  function findDefaultItem(optionSchema) {
    if (!Array.isArray(optionSchema)) {
      return undefined;
    }
    const foundItem = optionSchema?.find((item) => item?.default === true && item?.visible === true);
    return foundItem?.value;
  }

  function onSelect(value) {
    const _value = isObject(value) && has(value, 'value') ? value?.value : value;
    setCheckedValue(_value);
    setExposedVariable('value', _value);
    const validationStatus = validate(_value);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  }

  useEffect(() => {
    if (isInitialRender.current) return;
    if (advanced) {
      onSelect(findDefaultItem(schema));
    } else onSelect(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, JSON.stringify(schema), value]);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isLoading !== loadingState) setIsLoading(loadingState);
    if (isDisabled !== disabledState) setIsDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, loadingState, disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const _options = selectOptions?.map(({ label, value }) => ({ label, value }));
    setExposedVariable('options', _options);

    setExposedVariable('selectOption', async function (value) {
      onSelect(value);
      fireEvent('onSelectionChange');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectOptions)]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const validationStatus = validate(checkedValue);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validate]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  useEffect(() => {
    const _options = selectOptions?.map(({ label, value }) => ({ label, value }));
    const exposedVariables = {
      value: checkedValue,
      label: label,
      options: _options,
      isValid: isValid,
      isMandatory: isMandatory,
      isLoading: loadingState,
      isVisible: properties.visibility,
      isDisabled: disabledState,
      selectOption: async function (value) {
        onSelect(value);
        fireEvent('onSelectionChange');
      },
      deselectOption: async function () {
        onSelect(null);
        fireEvent('onSelectionChange');
      },
      setVisibility: async function (value) {
        setVisibility(value);
        setExposedVariable('isVisible', value);
      },
      setDisable: async function (value) {
        setIsDisabled(value);
        setExposedVariable('isDisabled', value);
      },
      setLoading: async function (value) {
        setIsLoading(value);
        setExposedVariable('isLoading', value);
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const _width = (labelWidth / 100) * 70; // Max width which label can go is 70% for better UX calculate width based on this value

  return (
    <>
      <div
        data-cy={`label-${String(componentName).toLowerCase()} `}
        data-disabled={isDisabled}
        id={String(componentName)}
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
          top={alignment !== 'top' && '2px'}
        />

        <div className="px-0 h-100 w-100" ref={radioBtnRef}>
          {isLoading || optionsLoadingState ? (
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
                      onChange={() => {
                        onSelect(option.value);
                        fireEvent('onSelectionChange');
                      }}
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
