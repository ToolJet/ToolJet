// Side effects for modal, which include dom manipulation to hide overflow when opening
// And cleaning up dom when modal is closed

const getModalHostEl = () =>
  document.getElementsByClassName('tj-canvas-area')?.[0] || document.getElementsByClassName('real-canvas')?.[0];

// Modals logically open, independent of DOM/animation timing.
const openModalIds = new Set();

export const onShowSideEffects = (id) => {
  openModalIds.add(id);
  const canvasElement = document.getElementsByClassName('canvas-content')?.[0];
  const modalHostEl = getModalHostEl();
  const allModalContainers = modalHostEl?.querySelectorAll('.modal') || [];
  const modalContainer = allModalContainers[allModalContainers.length - 1];

  if (canvasElement && modalHostEl && modalContainer) {
    // Disable page scrolling when modal is opened
    canvasElement.style.setProperty('overflow', 'hidden', 'important');

    // Modal Container which contain the main modal should be of same height as the canvas element
    modalContainer.style.height = `${canvasElement.offsetHeight}px`;

    // Position the modal container such that it is in the current canvas viewport (even if scrolled)
    const currentScroll = canvasElement.scrollTop;
    modalContainer.style.top = `${currentScroll}px`;
  }
};

export const onHideSideEffects = (id) => {
  openModalIds.delete(id);
  const canvasElement = document.getElementsByClassName('canvas-content')?.[0];
  const modalHostEl = getModalHostEl();

  // Self-heal if the Set is stuck non-empty but nothing is actually rendered.
  const nothingRendered = !modalHostEl || modalHostEl.querySelectorAll('.modal').length === 0;

  // Enable page scrolling for the canvas if there is no modal open
  if (canvasElement && (openModalIds.size === 0 || nothingRendered)) {
    openModalIds.clear();
    canvasElement.style.setProperty('overflow', 'auto', 'important');
  }
};
