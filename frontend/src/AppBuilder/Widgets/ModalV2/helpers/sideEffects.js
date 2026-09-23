// Side effects for modal, which include dom manipulation to hide overflow when opening
// And cleaning up dom when modal is closed

const getModalHostEl = () =>
  document.getElementsByClassName('tj-canvas-area')?.[0] || document.getElementsByClassName('real-canvas')?.[0];

// Tracks which modals are logically open, independent of whether their DOM
// node has actually left the tree yet (a closing modal's node can linger
// mid-exit-animation). A Set keyed by id — rather than a raw counter — stays
// correct even if a show/hide fires twice for the same id (e.g. React
// StrictMode's dev-mode double-invoke of effects).
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

  // Fallback for any modal implementation that can unmount while open without
  // going through onHideSideEffects (e.g. a page navigation triggered from
  // inside it): if the Set is stuck non-empty but nothing is actually
  // rendered anymore, trust the DOM and self-heal instead of leaving the
  // canvas locked forever.
  const nothingRendered = !modalHostEl || modalHostEl.querySelectorAll('.modal').length === 0;

  // Enable page scrolling for the canvas if there is no modal open
  if (canvasElement && (openModalIds.size === 0 || nothingRendered)) {
    openModalIds.clear();
    canvasElement.style.setProperty('overflow', 'auto', 'important');
  }
};
