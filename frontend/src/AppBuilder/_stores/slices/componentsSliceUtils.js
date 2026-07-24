import { TOP_ALIGNMENT_HEIGHT_INCREMENT } from '@/AppBuilder/AppCanvas/appCanvasConstants';

export const resolveInputCanvasAlignment = ({
  alignment,
  hasLegacyInputSizeProperty = false,
  legacyInputSize = false,
  resolveValue,
}) => {
  const isDynamicAlignment = alignment !== 'top' && alignment !== 'side';
  // Widgets without the compatibility toggle must retain their existing dynamic alignment resizing.
  const shouldResolveDynamicAlignment = isDynamicAlignment && (!hasLegacyInputSizeProperty || !legacyInputSize);

  return {
    alignment: shouldResolveDynamicAlignment ? resolveValue(alignment) : alignment,
    isDynamicAlignment,
  };
};

export const calculateInputCanvasHeight = ({
  height,
  alignment,
  labelLength = 0,
  width = 0,
  auto = false,
  labelType,
  legacyInputSize = false,
  isDynamicAlignment = false,
}) => {
  let resolvedLabelLength = labelLength;

  // Legacy components did not resize when an fx expression changed the alignment to top.
  if (legacyInputSize && isDynamicAlignment) {
    return height;
  }

  if (legacyInputSize || labelType === 'auto') {
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
