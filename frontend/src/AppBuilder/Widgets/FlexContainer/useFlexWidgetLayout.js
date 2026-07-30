import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  measureWidth = false,
  dynamicHeight = false,
  temporaryHeight,
}) => {
  const wrapperRef = useRef(null);
  const [configWidgetTop, setConfigWidgetTop] = useState(0);
  const [measuredWidth, setMeasuredWidth] = useState(null);
  const flexLayoutData = layoutData ?? {};
  const gridDerivedWidthPx = gridWidth * (flexLayoutData?.width ?? 1);
  const isFlexRow = flexDirection === 'row';

  const { fillWidth, widthPx, height } = resolveFlexChildSizing(flexLayoutData, {
    widthPx: gridDerivedWidthPx,
    height: flexLayoutData.height ?? 100,
  });

  const effectiveWidthPx = widthPx ?? gridDerivedWidthPx ?? 100;
  // Flex children do not use WidgetWrapper's absolute-positioned grid style,
  // so they also do not automatically pick up `temporaryLayouts.height` via
  // the normal grid wrapper path. Dynamic-height widgets such as Table and
  // Listview still write their measured height into temporaryLayouts, though.
  // If the flex item keeps using the authored layout height here, the child
  // may visually grow internally while the flex item's basis stays stale; the
  // parent FlexContainer then computes the same old height and any widget below
  // it remains in place. In viewer mode, prefer the temporary height so flex
  // layout and dynamic-height reflow agree on the child's actual size.
  const visibleHeightPx = dynamicHeight
    ? temporaryHeight ?? height ?? flexLayoutData.height ?? 100
    : height ?? flexLayoutData.height ?? 100;
  const effectiveHeightPx = visibility ? visibleHeightPx : mode === 'edit' ? HIDDEN_COMPONENT_HEIGHT : 0;
  const availableWidth = containerWidth ?? effectiveWidthPx;
  let widgetWidth = fillWidth ? availableWidth : effectiveWidthPx;
  const widgetHeight = effectiveHeightPx;
  const flexMainFill = isFlexRow ? fillWidth : false;
  const flexMainPx = isFlexRow ? effectiveWidthPx : effectiveHeightPx;

  if (flexShouldStack && !isFlexRow) {
    if (fillWidth) {
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

  useLayoutEffect(() => {
    if (!enabled || !measureWidth) return undefined;
    const element = wrapperRef.current;
    if (!element) return undefined;
    const apply = () => {
      const nextWidth = wrapperRef.current?.clientWidth ?? 0;
      if (nextWidth > 0) {
        setMeasuredWidth((current) => (current === nextWidth ? current : nextWidth));
      }
    };
    apply(); // synchronous initial read — avoids a one-frame mis-scale on mount/drop
    const resizeObserver = new ResizeObserver(apply);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [enabled, measureWidth]);

  const outerStyle = {
    ...(flexShouldStack && !isFlexRow
      ? {
          flex: flexMainFill ? '1 0 auto' : `0 0 ${flexMainPx}px`,
          height: `${effectiveHeightPx}px`,
          minHeight: 0,
          ...(fillWidth
            ? { width: '100%', minWidth: 0 }
            : { width: `${Math.min(effectiveWidthPx, availableWidth)}px`, maxWidth: '100%', minWidth: 0 }),
        }
      : {
          flex: flexMainFill ? '1 0 auto' : `0 0 ${flexMainPx}px`,
          ...(isFlexRow
            ? {
                height: `${effectiveHeightPx}px`,
                minWidth: 0,
              }
            : {
                width: fillWidth ? '100%' : `${effectiveWidthPx}px`,
                minHeight: 0,
              }),
        }),
    position: 'relative',
    display: !visibility && mode === 'view' ? 'none' : 'block',
    boxSizing: 'content-box',
    borderTop: !visibility && mode === 'edit' ? `1px dashed var(--border-accent-strong)` : 'none',
  };

  return {
    outerStyle,
    widgetWidth,
    measuredWidth,
    widgetHeight,
    wrapperRef,
    configWidgetTop,
    configWidgetHeight: effectiveHeightPx || flexLayoutData.height,
    configHandleClassName: 'flex-child-config-handle',
    refreshConfigWidgetTop,
  };
};
