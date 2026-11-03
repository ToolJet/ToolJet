import { useMemo } from 'react';

const toCssWidth = (val) => {
  if (val === undefined || val === null) return null;
  if (typeof val === 'number') return `${val}px`;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
    return trimmed;
  }
  return null;
};

/**
 * Custom hook for calculating popover menu width styles based on different modes
 * @param {string} menuWidthMode - Mode: 'matchField', 'matchContent', 'custom'
 * @param {string|number} menuCustomWidth - Custom width value
 * @param {number} triggerWidth - Width of the trigger button in pixels
 * @returns {Object} CSS style object for the popover content width
 */
export const useMenuWidth = (menuWidthMode, menuCustomWidth, triggerWidth) => {
  const viewportClamp = 'calc(100vw - 24px)';
  const customWidth = toCssWidth(menuCustomWidth);
  const triggerWidthPx = triggerWidth ? `${triggerWidth}px` : undefined;

  return useMemo(() => {
    if (menuWidthMode === 'custom' && customWidth) {
      return { width: customWidth, maxWidth: viewportClamp };
    }

    if (menuWidthMode === 'matchContent') {
      // Let the popover size purely to its content's intrinsic width — no floor at the
      // trigger width, or a wide trigger (e.g. a full-width button) would defeat this mode.
      return { maxWidth: 'min(520px, calc(100vw - 24px))' };
    }

    // matchField (default): pin the menu to the trigger button's width.
    return { width: triggerWidthPx, minWidth: triggerWidthPx, maxWidth: viewportClamp };
  }, [menuWidthMode, customWidth, triggerWidthPx]);
};
