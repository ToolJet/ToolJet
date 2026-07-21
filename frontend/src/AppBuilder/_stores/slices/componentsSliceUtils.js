import { TOP_ALIGNMENT_HEIGHT_INCREMENT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

export const calculateInputCanvasHeight = ({
  height,
  alignment,
  labelLength = 0,
  width = 0,
  auto = false,
  labelType,
  expandFieldIfLabelEmpty = false,
}) => {
  let resolvedLabelLength = labelLength;

  if (expandFieldIfLabelEmpty || labelType === 'auto') {
    resolvedLabelLength = 1;
  }

  if (
    alignment === 'top' &&
    ((resolvedLabelLength > 0 && width > 0) || (auto && width === 0 && resolvedLabelLength > 0))
  ) {
    return height + TOP_ALIGNMENT_HEIGHT_INCREMENT;
  }

  return height;
};
