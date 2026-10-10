import React, { useMemo, useRef } from 'react';
import { Container as ContainerCanvas } from '@/AppBuilder/AppCanvas/Container';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import { useDisableInert } from '@/AppBuilder/_hooks/useDisableInert';
import { SUBCONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { useShouldStackFlexRealCanvas } from './useFlexStackBelow';
import { flexCardHeaderPx } from './flexContainer.utils';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import Spinner from '@/_ui/Spinner';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import './flexContainer.scss';

export const FlexContainer = ({
  id,
  properties,
  styles,
  darkMode,
  height,
  width,
  setExposedVariables,
  setExposedVariable,
  adjustComponentPositions,
  currentLayout,
  componentCount = 0,
  currentMode,
  subContainerIndex,
}) => {
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState,
    properties.visibility,
    properties.disabledState,
    setExposedVariables,
    setExposedVariable
  );
  const containerRef = useRef(null);
  // Disabled flex container blocks the mouse via `pointer-events:none`; `inert` also removes the
  // child components from the tab order (runtime only — keeps the builder editable).
  useDisableInert(containerRef, isDisabled);

  const {
    gap,
    padding,
    justifyContent,
    alignItems,
    direction = 'column',
    flexWrap = false,
    stackBelow = 'none',
    cardStyle = 'none',
    cardTitle = '',
    cardExtra = '',
  } = properties;
  // Component packs (experiment): an Ant Design or shadcn/ui card, with its header above the flex body. The body
  // stays the same flex canvas, so nesting, child order and dynamic height are unchanged.
  const isAntCard = cardStyle === 'antCard';
  const isShadcnCard = cardStyle === 'shadcnCard';
  const isCard = isAntCard || isShadcnCard;
  const CARD_HEADER_PX = flexCardHeaderPx(properties);
  const { backgroundColor, borderColor, borderRadius, boxShadow } = styles;

  const shouldStack = useShouldStackFlexRealCanvas(stackBelow);
  const effectiveDirection = shouldStack ? 'column' : direction;

  const isRow = effectiveDirection === 'row';
  // A card (component packs) always fits its content in the viewer: it never scrolls inside or leaves a band. A row
  // is never a scroll area either: it grows to its tallest child (a fixed-height column may still scroll).
  const isCardSurface = ['antCard', 'shadcnCard'].includes(cardStyle);
  const isDynamicHeightEnabled =
    fitsContentInView('FlexContainer', { ...properties, direction: effectiveDirection }) && currentMode === 'view';

  const childIds = useStore((state) => state.containerChildrenMapping?.[id] ?? [], shallow);

  // Inside a row whose Align is Stretch, this container fills the line's height (its wrapper is stretched), so the
  // cards of a row share one height. Its own content height stays its floor and still drives the reflow.
  const { moduleId } = useModuleContext();
  const isStretched = useStore((state) => {
    const parentId = state.getComponentDefinition?.(id, moduleId)?.component?.parent;
    if (!parentId) return false;
    const parent = state.getResolvedComponent?.(parentId);
    return parent?.properties?.alignItems === 'stretch' && (parent?.properties?.direction ?? 'column') === 'row';
  }, shallow);

  useDynamicHeight({
    isDynamicHeightEnabled,
    id,
    height,
    adjustComponentPositions,
    currentLayout,
    isContainer: true,
    componentCount,
    value: useMemo(
      () =>
        JSON.stringify({
          effectiveDirection,
          flexWrap,
          gap,
          padding,
          justifyContent,
          alignItems,
          stackBelow,
          shouldStack,
          childCount: childIds.length,
        }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [effectiveDirection, flexWrap, gap, padding, justifyContent, alignItems, stackBelow, shouldStack, childIds.length]
    ),
    visibility: isVisible,
    subContainerIndex,
  });

  const overflowStyle = isDynamicHeightEnabled
    ? {
        ...(isRow && !flexWrap && !shouldStack ? { overflowX: 'auto' } : {}),
        overflowY: 'visible',
      }
    : shouldStack
    ? { overflowY: 'auto' }
    : flexWrap
    ? {}
    : isRow
    ? { overflowX: 'auto' }
    : { overflowY: 'auto' };

  const outerStyles = {
    height: isDynamicHeightEnabled ? 'auto' : '100%',
    ...(isDynamicHeightEnabled && !isCardSurface ? { minHeight: `${height}px` } : {}),
    ...(isDynamicHeightEnabled && isStretched ? { minHeight: isCardSurface ? '100%' : `max(100%, ${height}px)` } : {}),
    display: isVisible ? 'flex' : 'none',
    flexDirection: isCard ? 'column' : effectiveDirection,
    backgroundColor: isCard ? 'var(--cc-surface1-surface)' : backgroundColor,
    borderRadius: isAntCard ? 8 : isShadcnCard ? 14 : borderRadius ? parseFloat(borderRadius) : 0,
    border: isCard ? '1px solid var(--cc-weak-border)' : `${SUBCONTAINER_CANVAS_BORDER_WIDTH}px solid ${borderColor}`,
    boxShadow:
      isShadcnCard && (!boxShadow || /^0px 0px 0px 0px/.test(boxShadow)) ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : boxShadow,
    overflow: 'hidden',
    position: 'relative',
  };

  // Flex layout styles are passed into ContainerCanvas and applied to the real-canvas div
  const flexCanvasStyles = {
    display: 'flex',
    flexDirection: effectiveDirection,
    flexWrap: shouldStack ? 'nowrap' : flexWrap ? 'wrap' : 'nowrap',
    gap: `${gap ?? 8}px`,
    padding: `${padding ?? 12}px`,
    justifyContent: justifyContent ?? 'flex-start',
    alignItems: alignItems ?? 'flex-start',
    backgroundColor: 'transparent',
    height: isDynamicHeightEnabled ? 'auto' : CARD_HEADER_PX ? `calc(100% - ${CARD_HEADER_PX}px)` : '100%',
    ...(isDisabled && { opacity: 0.5, pointerEvents: 'none' }),
    ...overflowStyle,
  };
  const shadcnHeader = isShadcnCard ? (
    <div
      style={{
        height: CARD_HEADER_PX,
        // The title lines up with the card's content: its side padding is the body's (a 24px title inset over a 12px
        // body put the title and the table below it on different edges).
        padding: `20px ${Math.max(8, Number(padding ?? 12) || 12)}px 0`,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        flex: '0 0 auto',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          fontWeight: 600,
          fontSize: 16,
          lineHeight: 1,
          color: 'var(--cc-primary-text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {String(cardTitle ?? '')}
      </span>
      {cardExtra ? (
        <span style={{ fontSize: 14, lineHeight: '20px', color: 'var(--cc-placeholder-text)' }}>
          {String(cardExtra)}
        </span>
      ) : null}
    </div>
  ) : null;
  const cardHeader =
    isShadcnCard && CARD_HEADER_PX ? (
      shadcnHeader
    ) : CARD_HEADER_PX ? (
      <div
        style={{
          minHeight: CARD_HEADER_PX,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderBottom: '1px solid var(--cc-weak-border)',
          fontWeight: 600,
          fontSize: 16,
          color: 'var(--cc-primary-text)',
          flex: '0 0 auto',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(cardTitle ?? '')}
        </span>
        {cardExtra ? (
          <span style={{ fontWeight: 400, fontSize: 14, color: 'var(--cc-placeholder-text)' }}>
            {String(cardExtra)}
          </span>
        ) : null}
      </div>
    ) : null;

  return (
    <div
      ref={containerRef}
      style={outerStyles}
      className={`flex-container-widget ${isLoading ? 'jet-container-loading' : ''}`}
    >
      {cardHeader}
      {isLoading ? (
        <Spinner />
      ) : (
        <ContainerCanvas
          id={id}
          styles={flexCanvasStyles}
          canvasHeight={height - CARD_HEADER_PX}
          canvasWidth={width}
          darkMode={darkMode}
          componentType="FlexContainer"
          flexEffectiveDirection={effectiveDirection}
          flexShouldStack={shouldStack}
        />
      )}
    </div>
  );
};
