import { useEffect, useState } from 'react';

export const useExposeState = ({
  loadingState,
  visibleState,
  disabledModalState,
  disabledTriggerState,
  setExposedVariables,
  setExposedVariable,
  onHideModal,
  onShowModal,
}) => {
  const [isVisible, setVisibility] = useState(visibleState || true);
  const [isLoading, setLoading] = useState(loadingState || false);
  const [isDisabledModal, setDisabledModal] = useState(disabledModalState || false);
  const [isDisabledTrigger, setDisabledTrigger] = useState(disabledTriggerState || false);

  // Effect to conditionally update state from properties passed to widget
  useEffect(() => {
    setDisabledModal(disabledModalState);
  }, [disabledModalState]);

  useEffect(() => {
    setDisabledTrigger(disabledTriggerState);
  }, [disabledTriggerState]);

  useEffect(() => {
    setVisibility(visibleState);
  }, [visibleState]);

  useEffect(() => {
    setLoading(loadingState);
  }, [loadingState]);

  // exposed variables with state and async setters, happens on first time load
  useEffect(() => {
    setExposedVariables({
      setDisableTrigger: async (value) => setDisabledTrigger(value),
      setDisableModal: async (value) => setDisabledModal(value),
      setVisibility: async (value) => setVisibility(value),
      setLoading: async (value) => setLoading(value),
      open: async () => onShowModal(),
      close: async () => onHideModal(),
    });
  }, [setExposedVariables]);

  //Side effect to state variables, these will run after the state is set and the values will be exposed
  useEffect(() => {
    setExposedVariable('isDisabledModal', isDisabledModal);
  }, [isDisabledModal, setExposedVariable]);

  useEffect(() => {
    setExposedVariable('isDisabledTrigger', isDisabledTrigger);
  }, [isDisabledTrigger, setExposedVariable]);

  useEffect(() => {
    setExposedVariable('isVisible', isVisible);
  }, [isVisible, setExposedVariable]);

  useEffect(() => {
    setExposedVariable('isLoading', isLoading);
  }, [isLoading, setExposedVariable]);

  return {
    isDisabledTrigger,
    setDisabledTrigger,
    isDisabledModal,
    setDisabledModal,
    isVisible,
    setVisibility,
    isLoading,
    setLoading,
  };
};
