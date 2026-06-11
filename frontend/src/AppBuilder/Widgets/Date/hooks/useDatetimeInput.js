import { useEffect, useRef, useState } from 'react';

const useDatetimeInput = ({
  properties,
  setExposedVariable,
  setExposedVariables,
  validation = {},
  fireEvent,
  dateInputRef,
  datePickerRef,
}) => {
  const isInitialRender = useRef(true);
  const { mandatory: isMandatory } = validation;
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loading, setLoading] = useState(properties.loadingState);
  const [disable, setDisable] = useState(properties.disabledState);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [textInputFocus, setTextInputFocus] = useState(false);

  const focus = isCalendarOpen || textInputFocus;

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', properties.label);
  }, [properties.label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
    setVisibility(properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', properties.loadingState);
    setLoading(properties.loadingState);
  }, [properties.loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', properties.disabledState);
    setDisable(properties.disabledState);
  }, [properties.disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (textInputFocus) dateInputRef?.current.focus();
    else dateInputRef?.current.blur();
  }, [textInputFocus]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (isCalendarOpen) datePickerRef?.current.setOpen(true);
    else datePickerRef?.current.setOpen(false);
  }, [isCalendarOpen]);

  useEffect(() => {
    if (isInitialRender.current) return;
    if (focus) {
      fireEvent('onFocus');
    } else {
      fireEvent('onBlur');
    }
  }, [focus]);

  useEffect(() => {
    const exposedVariables = {
      isVisible: properties.visibility,
      isLoading: properties.loadingState,
      isDisabled: properties.disabledState,
      label: properties.label,
      isMandatory: isMandatory,
      setVisibility: (visibility) => {
        setExposedVariable('isVisible', visibility);
        setVisibility(visibility);
      },
      setLoading: (loading) => {
        setExposedVariable('isLoading', loading);
        setLoading(loading);
      },
      setDisable: (disable) => {
        setExposedVariable('isDisabled', disable);
        setDisable(disable);
      },
      setFocus: () => {
        setIsCalendarOpen(true);
        setTextInputFocus(true);
      },
      setBlur: () => {
        setIsCalendarOpen(false);
        setTextInputFocus(false);
      },
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  return {
    visibility,
    loading,
    disable,
    isMandatory,
    textInputFocus,
    setTextInputFocus,
    setIsCalendarOpen,
    focus,
  };
};

export default useDatetimeInput;
