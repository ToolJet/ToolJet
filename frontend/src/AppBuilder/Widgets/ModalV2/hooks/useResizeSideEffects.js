import { useState, useEffect, useRef } from 'react';

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
      for (let entry of entries) {
        // Update the height state when the element's height changes
        onShowSideEffects();

        // When modal is in fullscreen and width of browser changes, update the modal width
        if (size === 'fullscreen') {
          const width = entry.target.offsetWidth;
          setModalWidth(width);
        }
      }
    });

    // Observe the canvas element
    resizeObserver.observe(canvasElement);

    return () => {
      // Cleanup observer on component unmount
      resizeObserver.disconnect();
    };
  }, [size, onShowSideEffects]);

  useEffect(() => {
    if (showModal && parentRef.current) {
      if (size === 'fullscreen') {
        // First time modal is opened, the whole modal is part of the full body, later put into the canvas
        // This delay is to get the correct width of the modal

        const canvasElement = document.querySelector('.page-container.canvas-container');
        const width = canvasElement.offsetWidth;
        setModalWidth(width);
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
