const MODAL_HEADER = {
  HEIGHT: 80,
};
const MODAL_FOOTER = {
  HEIGHT: 80,
};

export const getCanvasHeight = (height) => {
  const parsedHeight = height.includes('px') ? parseInt(height, 10) : height;

  return Math.ceil(parsedHeight);
};

export const getModalBodyHeight = (
  height,
  showHeader,
  showFooter,
  headerHeight = MODAL_HEADER.HEIGHT,
  footerHeight = MODAL_FOOTER.HEIGHT
) => {
  let modalHeight = height ? parseInt(height, 10) : 0;
  let parsedHeaderHeight = showHeader ? parseInt(headerHeight, 10) : 0;
  let parsedFooterHeight = showFooter ? parseInt(footerHeight, 10) : 0;

  if (showHeader) {
    modalHeight = modalHeight - parsedHeaderHeight;
  }
  if (showFooter) {
    modalHeight = modalHeight - parsedFooterHeight;
  }
  return `${Math.max(modalHeight, 40)}px`;
};

export const getModalHeaderHeight = (showHeader, headerHeight = MODAL_FOOTER.HEIGHT) => {
  let parsedHeight = showHeader ? parseInt(headerHeight, 10) : 0;

  return `${parsedHeight}px`;
};

export const getModalFooterHeight = (showFooter, footerHeight = MODAL_FOOTER.HEIGHT) => {
  let parsedHeight = showFooter ? parseInt(footerHeight, 10) : 0;

  return `${parsedHeight}px`;
};
