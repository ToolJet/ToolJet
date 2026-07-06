import { useEffect, useRef, useState } from 'react';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/dateFamily';

const useDatetimeInput = ({
  id,
  componentType,
  moduleId,
  resolveIndex,
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
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [textInputFocus, setTextInputFocus] = useState(false);

  const exposedOpts = { resolveIndex, moduleId };
  const { csaShims, registerEffects } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Store is the source of truth for the trio (genuine Bucket B — pure
  // booleans, unlike the rest of this widget family's value/timestamp
  // state, which stays Bucket C).
  const visibility = useExposedVariable(id, 'isVisible', exposedOpts, properties.visibility);
  const loading = useExposedVariable(id, 'isLoading', exposedOpts, properties.loadingState);
  const disable = useExposedVariable(id, 'isDisabled', exposedOpts, properties.disabledState);

  const focus = isCalendarOpen || textInputFocus;

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', properties.label);
  }, [properties.label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', properties.loadingState);
  }, [properties.loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', properties.disabledState);
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

  // Bucket C: setFocus/setBlur are real DOM effects (ref.focus()/setOpen()).
  useEffect(() => {
    return registerEffects({
      setFocus: () => {
        setIsCalendarOpen(true);
        setTextInputFocus(true);
      },
      setBlur: () => {
        setIsCalendarOpen(false);
        setTextInputFocus(false);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers
  // for the trio.
  useEffect(() => {
    setExposedVariables({
      isVisible: properties.visibility,
      isLoading: properties.loadingState,
      isDisabled: properties.disabledState,
      label: properties.label,
      isMandatory: isMandatory,
      ...csaShims(),
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
