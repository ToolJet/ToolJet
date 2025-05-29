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
  let modalHeight = height ? Number.parseInt(height, 10) : 0;
  const parsedHeaderHeight = showHeader ? Number.parseInt(headerHeight, 10) : 0;
  const parsedFooterHeight = showFooter ? Number.parseInt(footerHeight, 10) : 0;

  if (showHeader) {
    modalHeight = modalHeight - parsedHeaderHeight;
  }
  if (showFooter) {
    modalHeight = modalHeight - parsedFooterHeight;
  }
  return `${Math.max(modalHeight, 40)}px`;
};

export const getModalHeaderHeight = (showHeader, headerHeight = MODAL_FOOTER.HEIGHT) => {
  const parsedHeight = showHeader ? Number.parseInt(headerHeight, 10) : 0;

  return `${parsedHeight}px`;
};

export const getModalFooterHeight = (showFooter, footerHeight = MODAL_FOOTER.HEIGHT) => {
  const parsedHeight = showFooter ? Number.parseInt(footerHeight, 10) : 0;

  return `${parsedHeight}px`;
};
