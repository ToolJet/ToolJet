import React, { useMemo, useRef } from 'react';

import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';
import { useSubcontainerContext } from '@/AppBuilder/_contexts/SubcontainerContext';
import { UI2_ROW_CHROME } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import {
  getDynamicLayoutKey,
  getEffectiveLayout,
  resolveWidgetVisibility,
} from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import { useMeasuredWidth } from './useMeasuredWidth';

const SubContainerComponent = SubContainer as React.ComponentType<any>;
// The reflow helpers are JS: the key's `contextIndices = null` default types that parameter as null alone, though the
// reflow passes a row's indices there too.
const dynamicLayoutKey = getDynamicLayoutKey as (
  componentId: string,
  contextIndices: number[] | null,
  suffix: string,
  moduleId: string
) => string;

// The corner radius a native Container gives its body canvas by default, so the drag outline matches.
const SLOT_CANVAS_RADIUS = 6;

interface LibrarySlotCanvasProps {
  id: string;
  darkMode: boolean;
  /** Its component fits its content (Dynamic height in a released app): the drop area takes its components' height. */
  fitContent?: boolean;
  currentLayout?: string;
}

interface LayoutBox {
  top?: number;
  height?: number;
}

// What fittedSlotHeight reads from the App Builder store.
interface SlotLayoutState {
  containerChildrenMapping?: Record<string, string[]>;
  temporaryLayouts?: Record<string, LayoutBox>;
  getCurrentPageComponents: (moduleId: string) => Record<string, unknown>;
  getResolvedComponent: (
    id: string,
    contextIndices: number[] | null,
    moduleId: string
  ) => { properties?: Record<string, unknown> } | undefined;
  getExposedPropertyForAdditionalActions: (
    id: string,
    contextIndices: number[] | null,
    property: string,
    moduleId: string
  ) => unknown;
  getComponentDefinition: (
    id: string,
    moduleId: string
  ) => { component?: { definition?: { styles?: unknown } } } | undefined;
  calculateMoveableBoxHeightWithId: (
    id: string,
    currentLayout: string,
    stylesDefinition: unknown,
    moduleId: string
  ) => number | undefined;
}

interface SlotPlace {
  slotId: string;
  currentLayout: string;
  contextIndices: number[] | null;
  moduleId: string;
}

/**
 * The height a drop area takes when its component fits its content: the lowest bottom of the components on it as the
 * reflow placed them (a Text that grew pushes the ones below it down), plus the space a UI 2.0 card keeps under its
 * lowest component. As in a native Container, a hidden component keeps its space unless it collapses when hidden, and
 * one the reflow has not sized is read at the height it is drawn at (an input's label row included).
 */
export const fittedSlotHeight = (
  state: SlotLayoutState,
  { slotId, currentLayout, contextIndices, moduleId }: SlotPlace
): number => {
  const components = state.getCurrentPageComponents(moduleId);
  const temporaryLayouts = state.temporaryLayouts;
  const bottom = (state.containerChildrenMapping?.[slotId] ?? []).reduce((lowest: number, childId: string) => {
    const layout: LayoutBox | null = getEffectiveLayout(
      childId,
      currentLayout,
      components,
      temporaryLayouts,
      contextIndices,
      moduleId
    );
    if (!layout) return lowest;
    const visible = resolveWidgetVisibility({
      componentId: childId,
      contextIndices,
      currentLayout,
      getResolvedComponent: (id: string, ctx: number[] | null) => state.getResolvedComponent(id, ctx, moduleId),
      getExposedPropertyForAdditionalActions: (id: string, ctx: number[] | null, property: string) =>
        state.getExposedPropertyForAdditionalActions(id, ctx, property, moduleId),
    });
    const collapses = state.getResolvedComponent(childId, contextIndices, moduleId)?.properties?.collapseWhenHidden;
    if (!visible && collapses === true) return lowest;
    const sized = temporaryLayouts?.[dynamicLayoutKey(childId, contextIndices, '', moduleId)]?.height != null;
    const drawn = sized
      ? 0
      : state.calculateMoveableBoxHeightWithId(
          childId,
          currentLayout,
          state.getComponentDefinition(childId, moduleId)?.component?.definition?.styles,
          moduleId
        );
    const height = Math.max(Number(layout.height) || 0, Number(drawn) || 0);
    return Math.max(lowest, (Number(layout.top) || 0) + height);
  }, 0);
  return Math.ceil(bottom + UI2_ROW_CHROME);
};

// The drop area for one ToolJet.Slot of a library component: an ordinary sub-canvas with id
// `<componentId>-<slotName>`, like a Tabs tab. Its size comes from the bundle's layout (the slot it is
// projected into), so the width the grid divides into columns is measured, not derived from the widget. When the
// component fits its content it is as tall as its components instead, and the bundle's layout follows it.
const LibrarySlotCanvas = ({ id, darkMode, fitContent = false, currentLayout = 'desktop' }: LibrarySlotCanvasProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const width = useMeasuredWidth(ref);
  const moduleId: string = useModuleId();
  const { contextPath } = useSubcontainerContext();
  const contextIndices = useMemo(() => {
    const indices = (contextPath as { index: number }[]).map((segment) => segment.index);
    return indices.length > 0 ? indices : null;
  }, [contextPath]);
  const fittedHeight = useStore((state: SlotLayoutState) =>
    fitContent ? fittedSlotHeight(state, { slotId: id, currentLayout, contextIndices, moduleId }) : undefined
  );

  return (
    // No frame of its own, like a native Container's body: while dragging, the sub-canvas draws its grid
    // and outline edge to edge, so a border here would sit 1px outside them as a second, offset frame.
    <div
      ref={ref}
      className={fitContent ? 'tw-w-full' : 'tw-w-full tw-h-full'}
      style={fitContent ? { height: fittedHeight } : undefined}
    >
      {width !== undefined && (
        <SubContainerComponent
          id={id}
          canvasWidth={width}
          allowContainerSelect={true}
          styles={{ overflow: 'hidden auto', borderRadius: `${SLOT_CANVAS_RADIUS}px` }}
          darkMode={darkMode}
          componentType="LibraryComponent"
        />
      )}
    </div>
  );
};

export default LibrarySlotCanvas;
