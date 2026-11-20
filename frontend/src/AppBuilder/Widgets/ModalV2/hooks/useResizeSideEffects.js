import { useState, useEffect, useRef } from 'react';

// The space a fullscreen modal's slot grid can use: the canvas box without its side padding (editor) or a classic
// scrollbar (viewer). offsetWidth counted both, so a full-width child ran past the modal's edge. Borders stay in: the
// editor reserves a right border on the canvas while a modal is open, and the modal body spans it.
const getCanvasContentWidth = (canvasElement) => {
  const { paddingLeft, paddingRight, borderLeftWidth, borderRightWidth } = window.getComputedStyle(canvasElement);
  const px = (value) => parseFloat(value) || 0;
  return canvasElement.clientWidth + px(borderLeftWidth) + px(borderRightWidth) - px(paddingLeft) - px(paddingRight);
};

export function useModalEventSideEffects({
  showModal,
  size,
  id,
  onShowSideEffects,
  closeOnClickingOutside,
  onHideModal,
}) {
  const [modalWidth, setModalWidth] = useState();
  const parentRef = useRef(null);

  // When query panel opens or closes, the modal container height should change to
  // accomodate the new height of the canvas

  useEffect(() => {
    // Select the DOM element
    const canvasElement = document.querySelector('.page-container.canvas-container');
    if (!canvasElement) return; // Ensure the element exists
    // Create a ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      if (!showModal) return;
      for (let entry of entries) {
        // Update the height state when the element's height changes
        onShowSideEffects(id);

        // When modal is in fullscreen and width of browser changes, update the modal width
        if (size === 'fullscreen') {
          setModalWidth(getCanvasContentWidth(entry.target));
        }
      }
    });

    // Observe the canvas element
    resizeObserver.observe(canvasElement);

    return () => {
      // Cleanup observer on component unmount
      resizeObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, size, onShowSideEffects]);

  useEffect(() => {
    if (showModal && parentRef.current) {
      if (size === 'fullscreen') {
        // First time modal is opened, the whole modal is part of the full body, later put into the canvas
        // This delay is to get the correct width of the modal

        const canvasElement = document.querySelector('.page-container.canvas-container');
        setModalWidth(getCanvasContentWidth(canvasElement));
      } else {
        setModalWidth(parentRef.current.offsetWidth);
      }
    }
  }, [showModal, size, id]);

  useEffect(() => {
    if (closeOnClickingOutside) {
      const handleClickOutside = (event) => {
        const modalRef = parentRef?.current?.parentElement?.parentElement?.parentElement;

        if (modalRef && modalRef === event.target) {
          onHideModal();
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeOnClickingOutside, parentRef]);

  return { modalWidth, parentRef };
}
