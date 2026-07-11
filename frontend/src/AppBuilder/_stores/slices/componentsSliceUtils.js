import { TOP_ALIGNMENT_HEIGHT_INCREMENT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

export const INPUT_LABEL_HEIGHT_MODE_PROPERTY = '__inputLabelHeightMode';
export const INPUT_LABEL_HEIGHT_MODE_FIXED = 'fixed';

export const calculateInputCanvasHeight = ({
  height,
  alignment,
  labelLength = 0,
  width = 0,
  auto = false,
  labelType,
  preserveLegacyTopAlignment = true,
}) => {
  let resolvedLabelLength = labelLength;

  // Legacy components reserve space for a top label even when their label property is empty.
  // New components opt into the corrected behavior through the compatibility marker.
  if (preserveLegacyTopAlignment || labelType === 'auto') {
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
