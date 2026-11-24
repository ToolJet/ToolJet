import { useEffect } from 'react';

// Closes an open menu on a mousedown outside `menuSelector`, and on Escape (RP-30).
export const useMenuDismiss = (show, onDismiss, menuSelector) => {
  useEffect(() => {
    if (!show) return undefined;
    const onMouseDown = (event) => {
      if (event.target.closest(menuSelector) === null) onDismiss();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onDismiss();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [show, onDismiss, menuSelector]);
};
