import { useMemo } from 'react';

/**
 * Custom hook for calculating menu width styles based on different modes
 * @param {string} menuWidthMode - Mode: 'matchField', 'matchContent', 'custom'
 * @param {string|number} menuCustomWidth - Custom width value
 * @param {number} triggerWidth - Width of the trigger element in pixels
 * @param {string} menuContentWidth - Calculated content width
 * @returns {Object} CSS style object for menu width
 */
export const useMenuWidth = (menuWidthMode, menuCustomWidth, triggerWidth, menuContentWidth) => {
  const viewportClamp = 'calc(100vw - 24px)';

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

  const customWidth = toCssWidth(menuCustomWidth);

  return useMemo(() => {
    if (menuWidthMode === 'matchField' && triggerWidth) {
      const widthPx = `${triggerWidth}px`;
      return { width: widthPx, minWidth: widthPx, maxWidth: viewportClamp };
    }

    if (menuWidthMode === 'matchContent' && menuContentWidth) {
      const contentPx = Number.parseFloat(menuContentWidth) || 0;
      const triggerPx = triggerWidth != null && Number.isFinite(triggerWidth) ? triggerWidth : 0;
      const effectivePx = Math.max(contentPx, triggerPx);
      const widthStr = effectivePx > 0 ? `${effectivePx}px` : menuContentWidth;
      return {
        width: widthStr,
        minWidth: widthStr,
        maxWidth: 'min(520px, calc(100vw - 24px))',
      };
    }

    if (menuWidthMode === 'custom' && customWidth) {
      return { width: customWidth, maxWidth: viewportClamp };
    }

    return { maxWidth: viewportClamp };
  }, [menuWidthMode, customWidth, triggerWidth, menuContentWidth]);
};
