import { useEffect, useRef } from 'react';
import { useGridStore } from '@/_stores/gridStore';

/**** Start - Logic to reset the zIndex of modal control box ****/
export const useResetZIndex = ({ showModal, id, mode }) => {
  const controlBoxRef = useRef(null);

  useEffect(() => {
    if (!showModal && mode === 'edit') {
      controlBoxRef.current?.classList?.remove('modal-moveable');
      controlBoxRef.current = null;
    }
    if (showModal) {
      useGridStore.getState().actions.setOpenModalWidgetId(id);
    } else {
      if (useGridStore.getState().openModalWidgetId === id) {
        useGridStore.getState().actions.setOpenModalWidgetId(null);
      }
    }
  }, [showModal, id, mode]);

  // If the modal unmounts while still open (e.g. a page switch fired from inside it), the effect above never
  // sees showModal flip to false. Clear the stale id, otherwise Grid keeps hiding every widget's resize controls.
  useEffect(() => {
    return () => {
      if (useGridStore.getState().openModalWidgetId === id) {
        useGridStore.getState().actions.setOpenModalWidgetId(null);
      }
    };
  }, [id]);
  /**** End - Logic to reset the zIndex of modal control box ****/

  return {
    controlBoxRef,
  };
};
