import { useEffect, useState, useRef } from 'react';

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
  const [isVisible, setVisibility] = useState(visibleState ?? true);
  const [isLoading, setLoading] = useState(loadingState ?? false);
  const [isDisabledModal, setDisabledModal] = useState(disabledModalState ?? false);
  const [isDisabledTrigger, setDisabledTrigger] = useState(disabledTriggerState ?? false);

  // Track previous values to prevent redundant updates
  const prevValues = useRef({});

  // Effect to sync state with props (only when props change)
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

  // Expose state-modifying functions only once
  useEffect(() => {
    setExposedVariables({
      setDisableTrigger: async (value) => setDisabledTrigger(value),
      setDisableModal: async (value) => setDisabledModal(value),
      setVisibility: async (value) => setVisibility(value),
      setLoading: async (value) => setLoading(value),
      open: async () => onShowModal(),
      close: async () => onHideModal(),
    });
  }, []);

  // Prevent redundant updates to `setExposedVariable`
  const updateExposedVariable = (key, value) => {
    if (prevValues.current[key] !== value) {
      prevValues.current[key] = value;
      setExposedVariable(key, value);
    }
  };

  useEffect(() => {
    updateExposedVariable('isDisabledModal', isDisabledModal);
  }, [isDisabledModal]);

  useEffect(() => {
    updateExposedVariable('isDisabledTrigger', isDisabledTrigger);
  }, [isDisabledTrigger]);

  useEffect(() => {
    updateExposedVariable('isVisible', isVisible);
  }, [isVisible]);

  useEffect(() => {
    updateExposedVariable('isLoading', isLoading);
  }, [isLoading]);

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
