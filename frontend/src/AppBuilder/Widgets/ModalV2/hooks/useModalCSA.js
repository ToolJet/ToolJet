import { useEffect, useRef } from 'react';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/wave4';

export const useExposeState = ({
  id,
  componentType,
  moduleId,
  resolveIndex,
  loadingState,
  visibleState,
  disabledModalState,
  disabledTriggerState,
  setExposedVariables,
  setExposedVariable,
  onHideModal,
  onShowModal,
}) => {
  const isInitialRender = useRef(true);
  const exposedOpts = { resolveIndex, moduleId };
  const { csaShims, registerEffects } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
  });

  // Store is the source of truth for the trio; the resolved properties are
  // the pre-first-publish fallback (old useState initial values).
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibleState ?? true);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState ?? false);
  const isDisabledModal = useExposedVariable(id, 'isDisabledModal', exposedOpts, disabledModalState ?? false);
  const isDisabledTrigger = useExposedVariable(id, 'isDisabledTrigger', exposedOpts, disabledTriggerState ?? false);

  // Property-sync write-throughs (skip-initial).
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabledModal', disabledModalState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledModalState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabledTrigger', disabledTriggerState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledTriggerState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibleState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  // Bucket C: open/close mutate the widget's local showModal state and
  // trigger real DOM side effects — no store patch represents them.
  useEffect(() => {
    return registerEffects({
      open: async () => onShowModal(),
      close: async () => onHideModal(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers
  // for the trio (setVisibility/setLoading/setDisableTrigger/setDisableModal).
  useEffect(() => {
    setExposedVariables({
      isDisabledTrigger: disabledTriggerState ?? false,
      isDisabledModal: disabledModalState ?? false,
      isVisible: visibleState ?? true,
      isLoading: loadingState ?? false,
      ...csaShims(),
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isDisabledTrigger,
    isDisabledModal,
    isVisible,
    isLoading,
  };
};
