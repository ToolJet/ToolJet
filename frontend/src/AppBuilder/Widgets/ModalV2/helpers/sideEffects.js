// Side effects for modal, which include dom manipulation to hide overflow when opening
// And cleaning up dom when modal is closed

export const onShowSideEffects = () => {
  const canvasElement = document.getElementsByClassName('canvas-content')?.[0];
  const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
  const allModalContainers = realCanvasEl.querySelectorAll('.modal');
  const modalContainer = allModalContainers[allModalContainers.length - 1];

  if (canvasElement && realCanvasEl && modalContainer) {
    // Disable page scrolling when modal is opened
    canvasElement.style.setProperty('overflow', 'hidden', 'important');

    // Modal Container which contain the main modal should be of same height as the canvas element
    modalContainer.style.height = `${canvasElement.offsetHeight}px`;

    // Position the modal container such that it is in the current canvas viewport (even if scrolled)
    const currentScroll = canvasElement.scrollTop;
    modalContainer.style.top = `${currentScroll}px`;
  }
};

export const onHideSideEffects = () => {
  const canvasElement = document.getElementsByClassName('canvas-content')?.[0];
  const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
  if (!realCanvasEl) return;
  const allModalContainers = realCanvasEl.querySelectorAll('.modal');
  const hasManyModalsOpen = allModalContainers.length > 1;

  // Enable page scrolling for the canvas if there is no modal open
  if (canvasElement && !hasManyModalsOpen) {
    canvasElement.style.setProperty('overflow', 'auto', 'important');
  }
};
