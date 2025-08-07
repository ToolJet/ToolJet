/**
 * Utility functions for handling canvas scrolling to avoid sidebar overlap
 */

/**
 * Scrolls the canvas to ensure an element is not overlapped by the sidebar
 * @param {string} elementId - ID of the element to check for overlap
 * @param {string} canvasSelector - CSS selector for the canvas container (default: '.canvas-container')
 * @param {string} sidebarSelector - CSS selector for the sidebar (default: '.editor-sidebar')
 */
export const scrollToAvoidSidebarOverlap = (
  elementId,
  canvasSelector = '.canvas-container',
  sidebarSelector = '.editor-sidebar'
) => {
  const canvas = document.querySelector(canvasSelector);
  const sidebar = document.querySelector(sidebarSelector);
  const element = document.getElementById(elementId);

  if (!canvas || !sidebar || !element) return;

  const elementRect = element.getBoundingClientRect();
  const sidebarRect = sidebar.getBoundingClientRect();

  const isOverlapping = elementRect.right > sidebarRect.left && elementRect.left < sidebarRect.right;

  if (isOverlapping) {
    const overlap = elementRect.right - sidebarRect.left;
    canvas.scrollTo({
      left: canvas.scrollLeft + overlap,
      behavior: 'smooth',
    });
  }
};

/**
 * Scrolls the canvas to ensure a component is visible when selected
 * This function should be called when a component is clicked and the right sidebar opens
 * @param {string} componentId - ID of the selected component
 */
export const scrollToShowSelectedComponent = (componentId) => {
  // Small delay to ensure sidebar is rendered before calculating overlap
  setTimeout(() => {
    scrollToAvoidSidebarOverlap(componentId);
  }, 100);
};
