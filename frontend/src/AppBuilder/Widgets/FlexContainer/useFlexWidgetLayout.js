import { useCallback, useEffect, useRef, useState } from 'react';
import { HIDDEN_COMPONENT_HEIGHT } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { resolveFlexChildSizing } from './flexContainer.utils';

export const getFlexConfigWidgetTop = (widgetElement) => widgetElement?.offsetTop ?? 0;

export const useFlexWidgetLayout = ({
  layoutData,
  gridWidth,
  containerWidth,
  flexDirection,
  flexShouldStack,
  visibility,
  mode,
  isWidgetActive,
  enabled = true,
}) => {
  const wrapperRef = useRef(null);
  const [configWidgetTop, setConfigWidgetTop] = useState(0);
  const flexLayoutData = layoutData ?? {};
  const gridDerivedWidthPx = gridWidth * (flexLayoutData?.width ?? 1);
  const isFlexRow = flexDirection === 'row';
  const stackedWidthBehavior = flexLayoutData.stackedWidthBehavior ?? 'fill-parent';
  const { crossAlignSelf } = flexLayoutData;

  // Resolve per-axis sizing with backward-compat fallback to legacy fillMain.
  const { fillWidth, fillHeight, widthPx, heightPx } = resolveFlexChildSizing(flexLayoutData, flexDirection, {
    widthPx: gridDerivedWidthPx,
    heightPx: flexLayoutData.height ?? 100,
  });

  const effectiveWidthPx = widthPx ?? gridDerivedWidthPx ?? 100;
  const visibleHeightPx = heightPx ?? flexLayoutData.height ?? 100;
  const effectiveHeightPx = visibility ? visibleHeightPx : mode === 'edit' ? HIDDEN_COMPONENT_HEIGHT : 0;
  const availableWidth = containerWidth ?? effectiveWidthPx;
  let widgetWidth = fillWidth ? availableWidth : effectiveWidthPx;
  const widgetHeight = effectiveHeightPx;
  const flexMainFill = isFlexRow ? fillWidth : fillHeight;
  const flexMainPx = isFlexRow ? effectiveWidthPx : effectiveHeightPx;

  if (flexShouldStack && !isFlexRow) {
    if (fillWidth || stackedWidthBehavior === 'fill-parent') {
      widgetWidth = availableWidth;
    } else {
      widgetWidth = Math.min(effectiveWidthPx, availableWidth);
    }
  }

  const refreshConfigWidgetTop = useCallback(() => {
    const nextTop = getFlexConfigWidgetTop(wrapperRef.current);
    setConfigWidgetTop((currentTop) => (currentTop === nextTop ? currentTop : nextTop));
  }, []);

  useEffect(() => {
    if (!enabled || !isWidgetActive) return;
    refreshConfigWidgetTop();
  }, [
    enabled,
    isWidgetActive,
    refreshConfigWidgetTop,
    containerWidth,
    flexDirection,
    flexShouldStack,
    visibility,
    mode,
  ]);

  const outerStyle = {
    ...(flexShouldStack && !isFlexRow
      ? {
          flex: flexMainFill ? '1 0 auto' : `0 0 ${flexMainPx}px`,
          height: fillHeight ? '100%' : `${effectiveHeightPx}px`,
          minHeight: 0,
          ...(fillWidth
            ? { width: '100%', minWidth: 0 }
            : stackedWidthBehavior === 'keep-original'
            ? { width: `${effectiveWidthPx}px`, maxWidth: '100%', minWidth: 0 }
            : { width: '100%', minWidth: 0 }),
        }
      : {
          flex: flexMainFill ? '1 0 auto' : `0 0 ${flexMainPx}px`,
          ...(isFlexRow
            ? {
                height: fillHeight ? '100%' : `${effectiveHeightPx}px`,
                minWidth: 0,
              }
            : {
                width: fillWidth ? '100%' : `${effectiveWidthPx}px`,
                minHeight: 0,
              }),
        }),
    alignSelf: crossAlignSelf || undefined,
    position: 'relative',
    display: !visibility && mode === 'view' ? 'none' : 'block',
    boxSizing: 'content-box',
    borderTop: !visibility && mode === 'edit' ? `1px dashed var(--border-accent-strong)` : 'none',
  };

  return {
    outerStyle,
    widgetWidth,
    widgetHeight,
    wrapperRef,
    configWidgetTop,
    configWidgetHeight: effectiveHeightPx || flexLayoutData.height,
    configHandleClassName: 'flex-child-config-handle',
    refreshConfigWidgetTop,
  };
};
