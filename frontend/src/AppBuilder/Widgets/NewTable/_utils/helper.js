export const getMaxHeight = (isMaxRowHeightAuto, maxRowHeightValue, cellHeight) => {
  if (isMaxRowHeightAuto) {
    return 'fit-content';
  }
  if (maxRowHeightValue) {
    return `${maxRowHeightValue}px`;
  }
  if (cellHeight === 'condensed') {
    return '39px';
  }
  return '45px';
};
