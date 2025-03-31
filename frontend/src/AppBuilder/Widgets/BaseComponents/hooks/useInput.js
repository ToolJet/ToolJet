import { useState, useRef, useEffect } from 'react';
import { useGridStore } from '@/_stores/gridStore';
//eslint-disable-next-line import/no-unresolved
import { getCountryCallingCode } from 'react-phone-number-input';

export const useInput = ({
  id,
  properties,
  styles,
  validation,
  validate,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  inputType,
}) => {
  const isInitialRender = useRef(true);
  const inputRef = useRef();
  const labelRef = useRef();

  const { loadingState, disabledState, label, visibility: initialVisibility } = properties;
  const isResizing = useGridStore((state) => state.resizingComponentId === id);

  const [value, setValue] = useState(properties.value ?? '');
  const [visibility, setVisibility] = useState(initialVisibility);
  const [loading, setLoading] = useState(loadingState);
  const [disable, setDisable] = useState(disabledState || loadingState);
  const [validationStatus, setValidationStatus] = useState(validate(value));
  const [showValidationError, setShowValidationError] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [labelWidth, setLabelWidth] = useState(0);
  const [iconVisibility, setIconVisibility] = useState(false);
  const [country, setCountry] = useState(properties.defaultCountry || 'US');

  const { isValid, validationError } = validationStatus;
  const isMandatory = validation?.mandatory ?? false;

  const getCountryCallingCodeSafe = (country) => {
    try {
      return getCountryCallingCode(country);
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    if (labelRef?.current) {
      const absolutewidth = labelRef?.current?.getBoundingClientRect()?.width;
      setLabelWidth(absolutewidth);
    } else setLabelWidth(0);
  }, [
    isResizing,
    styles.width,
    styles.auto,
    styles.alignment,
    styles.iconVisibility,
    label?.length,
    isMandatory,
    styles.padding,
    styles.direction,
    labelRef?.current?.getBoundingClientRect()?.width,
  ]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
  }, [label]);

  useEffect(() => {
    disable !== disabledState && setDisable(disabledState);
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState]);

  useEffect(() => {
    visibility !== properties.visibility && setVisibility(properties.visibility);
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    loading !== loadingState && setLoading(loadingState);
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const validationStatus = validate(value);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  }, [validate]);

  useEffect(() => {
    if (inputType === 'phone') {
      let code = getCountryCallingCodeSafe(country);
      setInputValue(`+${code}${properties.value}`);
    } else {
      setInputValue(properties.value ?? '');
    }
  }, [properties.value]);

  useEffect(() => {
    if (inputType !== 'phone') return;
    setExposedVariable('setValue', async function (value, countryCode = country) {
      const code = getCountryCallingCodeSafe(country);
      setInputValue(`+${code}${value}`);
      setCountry(countryCode);
      fireEvent('onChange');
    });
  }, [inputType, country]);

  useEffect(() => {
    const exposedVariables = {
      ...(inputType !== 'phone' && {
        setText: async function (text) {
          setInputValue(text);
          fireEvent('onChange');
        },
      }),
      clear: async function () {
        setInputValue('');
        fireEvent('onChange');
      },
      setFocus: async function () {
        inputRef.current.focus();
      },
      setBlur: async function () {
        inputRef.current.blur();
      },
      setVisibility: async function (state) {
        setVisibility(state);
        setExposedVariable('isVisible', state);
      },
      setDisable: async function (disable) {
        setDisable(disable);
        setExposedVariable('isDisabled', disable);
      },
      setLoading: async function (loading) {
        setLoading(loading);
        setExposedVariable('isLoading', loading);
      },
      label,
      isValid,
      value: properties.value ?? '',
      isMandatory,
      isLoading: loading,
      isVisible: visibility,
      isDisabled: disable,
    };

    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  const setInputValue = (value) => {
    setValue(value);
    setExposedVariable('value', value);
    const validationStatus = validate(value);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  };

  const handleChange = (e) => {
    setInputValue(e.target.value);
    fireEvent('onChange');
  };

  const handlePhoneCurrencyInputChange = (value) => {
    setInputValue(value);
    fireEvent('onChange');
  };

  const handleBlur = (e) => {
    setShowValidationError(true);
    setIsFocused(false);
    e.stopPropagation();
    fireEvent('onBlur');
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    e.stopPropagation();
    setTimeout(() => {
      fireEvent('onFocus');
    }, 0);
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      setInputValue(e.target.value);
      fireEvent('onEnterPressed');
    }
  };

  return {
    inputRef,
    labelRef,
    value,
    visibility,
    loading,
    disable,
    country,
    setCountry,
    validationStatus,
    showValidationError,
    isFocused,
    labelWidth,
    iconVisibility,
    setIconVisibility,
    isValid,
    validationError,
    isMandatory,
    setInputValue,
    handlePhoneCurrencyInputChange,
    handleChange,
    handleBlur,
    handleFocus,
    handleKeyUp,
  };
};
