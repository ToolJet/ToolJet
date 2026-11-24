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
  }, [showModal, mode]);

  // Owns the editor open-modal record. The cleanup runs both when the modal closes
  // and when it unmounts while still open (e.g. a page switch fired from inside it).
  useEffect(() => {
    if (!showModal) return;
    useGridStore.getState().actions.setOpenModalWidgetId(id);
    return () => {
      if (useGridStore.getState().openModalWidgetId === id) {
        useGridStore.getState().actions.setOpenModalWidgetId(null);
      }
    };
  }, [showModal, id]);
  /**** End - Logic to reset the zIndex of modal control box ****/

  return {
    controlBoxRef,
  };
};
