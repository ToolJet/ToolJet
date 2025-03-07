// Side effects for modal, which include dom manipulation to hide overflow when opening
// And cleaning up dom when modal is closed

export const onShowSideEffects = () => {
  const canvasElement = document.querySelector('.page-container.canvas-container');
  const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
  const allModalContainers = realCanvasEl.querySelectorAll('.modal');
  const modalContainer = allModalContainers[allModalContainers.length - 1];

  if (canvasElement && realCanvasEl && modalContainer) {
    const currentScroll = canvasElement.scrollTop;
    canvasElement.style.overflowY = 'hidden';

    modalContainer.style.height = `${canvasElement.offsetHeight}px`;
    modalContainer.style.top = `${currentScroll}px`;
  }
};

export const onHideSideEffects = (callback = () => {}) => {
  const canvasElement = document.querySelector('.page-container.canvas-container');
  const realCanvasEl = document.getElementsByClassName('real-canvas')[0];
  const allModalContainers = realCanvasEl.querySelectorAll('.modal');
  const modalContainer = allModalContainers[allModalContainers.length - 1];
  const hasManyModalsOpen = allModalContainers.length > 1;

  if (canvasElement && realCanvasEl && modalContainer) {
    modalContainer.style.height = ``;
    modalContainer.style.top = ``;
    callback();
    // fireEvent('onClose');
  }
  if (canvasElement && !hasManyModalsOpen) {
    canvasElement.style.overflow = 'auto';
  }
};
