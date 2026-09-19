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

export const resolveInputCanvasLabelLength = (label, resolveValue) => {
  if (label == null) return 0;

  const isDynamicLabel = typeof label === 'string' && (label.includes('{{') || label.includes('%%'));
  const resolvedLabel = isDynamicLabel ? resolveValue(label) : label;
  return resolvedLabel == null ? 0 : String(resolvedLabel).length;
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

/**
 * Non-deletable component types. The ModuleContainer is the root container of
 * a module and must never be removed — doing so breaks the module.
 */
const NON_DELETABLE_TYPES = new Set(['ModuleContainer']);

/**
 * Pure predicate: returns `true` when a component definition represents a
 * component that the user (or an automated caller) is allowed to delete.
 *
 * @param {{ component?: { component?: string } } | null | undefined} def
 *   The component definition object as returned by `getComponentDefinition`.
 */
export const isComponentDeletable = (def) => {
  const type = def?.component?.component;
  return !type || !NON_DELETABLE_TYPES.has(type);
};
