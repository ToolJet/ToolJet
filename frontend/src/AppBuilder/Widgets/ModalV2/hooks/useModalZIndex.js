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
  /**** End - Logic to reset the zIndex of modal control box ****/

  return {
    controlBoxRef,
  };
};
