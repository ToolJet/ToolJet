import _ from 'lodash';

const MODAL_HEADER = {
  HEIGHT: 80,
};
const MODAL_FOOTER = {
  HEIGHT: 80,
};
const DEFAULT_CUSTOM_MODAL_WIDTH = 600;
const BOOTSTRAP_MODAL_SIZES = ['sm', 'lg', 'xl', 'fullscreen'];

const parseModalWidthNumber = (value) => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string') {
    return NaN;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue || !/^\d+(?:\.\d+)?$/.test(trimmedValue)) {
    return NaN;
  }

  return Number(trimmedValue);
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

export const isCustomModalWidth = (value) => {
  const parsedValue = parseModalWidthNumber(value);
  return Number.isFinite(parsedValue) && parsedValue > 0;
};

export const getCustomModalWidth = (value) => {
  const parsedValue = parseModalWidthNumber(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return `${DEFAULT_CUSTOM_MODAL_WIDTH}px`;
  }

  return `${parsedValue}px`;
};

export const getBootstrapModalSize = (value) => {
  return BOOTSTRAP_MODAL_SIZES.includes(value) ? value : 'lg';
};

export function isFalsyOrMultipleZeros(value) {
  // Check if it's already falsy
  if (!value) return true;

  // Check if it's a string with only zeros
  if (_.isString(value)) {
    return /^0+$/.test(value);
  }

  // Check if it's a number that's zero
  if (_.isNumber(value)) {
    return value === 0;
  }

  return false;
}
