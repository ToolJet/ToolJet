import { useGridStore } from '@/_stores/gridStore';
import useStore from '@/AppBuilder/_stores/store';
import { NO_OF_GRIDS } from '../../appCanvasConstants';
import { getDroppableSlotIdOnScreen, getParentFromSlotId } from './dragEnd';
import {
  computeFlexContainerReorder,
  computeFlexInsertIndex,
} from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';

const GRID_HEIGHT = 10;
const DEFAULT_GRID_WIDTH_CELLS = 10;

/**
 * Handles dragEnd for a widget whose source parent is a FlexContainer.
 * Returns true if handled (caller should skip normal dragEnd logic).
 * Returns false if source is not a FlexContainer child.
 *
 * Three cases:
 *   1. Dropped into the SAME FlexContainer → reorder-only via computeFlexContainerReorder + setComponentLayout.
 *   2. Dropped into a DIFFERENT FlexContainer → reparent with a new order value.
 *   3. Dropped onto a grid canvas → synthesize absolute {top, left, width, height}.
 *
 * Grid coordinates are NEVER written for cases 1 or 2.
 */
export function handleFlexContainerDragEnd({
  e,
  boxList,
  currentLayout,
  gridWidth,
  setComponentLayout,
  getComponentTypeFromId,
  incrementCanvasUpdater,
  setReorderContainerChildren,
  moduleId,
  getResolvedComponent,
}) {
  const widgetId = e.target.id;
  const currentWidget = boxList.find((b) => b.id === widgetId);
  if (!currentWidget) return false;

  const sourceParentId = currentWidget.component?.parent ?? null;
  const sourceParentType = sourceParentId ? getComponentTypeFromId(sourceParentId) : null;
  if (sourceParentType !== 'FlexContainer') return false;

  // No actual movement — reset transform and bail
  if (!e.lastEvent) {
    e.target.style.transform = '';
    return true;
  }

  const targetSlotId = getDroppableSlotIdOnScreen(e, boxList) || 'real-canvas';
  const targetParentId = getParentFromSlotId(targetSlotId);
  const targetParentType = targetParentId ? getComponentTypeFromId(targetParentId) : null;

  // ── Case 1: same FlexContainer → reorder only, no grid writes ──────────────
  if (targetSlotId === sourceParentId || targetParentId === sourceParentId) {
    const parentDir = getResolvedComponent?.(sourceParentId, null, moduleId)?.properties?.direction ?? 'column';
    // Prefer the slot last published to flexContainerDropTarget so the drop matches what
    // the indicator showed; fall back to live compute if the store target is stale/missing.
    const lockedTarget = useStore.getState().flexContainerDropTarget;
    const lockedIndex = lockedTarget?.flexContainerId === sourceParentId ? lockedTarget.index : null;
    const newIndex = lockedIndex ?? computeFlexInsertIndex(sourceParentId, e.clientX, e.clientY, parentDir, widgetId);
    const snapshot = useStore.getState().getCurrentPageComponents?.(moduleId) ?? {};
    const mapping = useStore.getState().containerChildrenMapping?.[sourceParentId] ?? [];
    const computed = computeFlexContainerReorder({
      components: snapshot,
      mapping,
      currentLayout,
      componentId: widgetId,
      newIndex,
    });

    e.target.style.transform = '';
    if (computed) {
      setComponentLayout(computed.layoutPatch, undefined, moduleId, {
        reorderFlexContainerMapping: {
          containerId: sourceParentId,
          childIds: computed.reorderedChildIds,
        },
      });
      setReorderContainerChildren(sourceParentId);
    }
    incrementCanvasUpdater();
    return true;
  }

  // ── Case 2: different FlexContainer → reparent at the locked slot ──────────
  if (targetParentType === 'FlexContainer') {
    const targetMapping = useStore.getState().containerChildrenMapping?.[targetParentId] ?? [];
    const targetComponents = useStore.getState().getCurrentPageComponents?.(moduleId) ?? {};

    // Honor the slot the indicator displayed; append at end if no live target.
    const lockedTarget = useStore.getState().flexContainerDropTarget;
    const targetIndex = lockedTarget?.flexContainerId === targetParentId ? lockedTarget.index : targetMapping.length;

    const beforeId = targetMapping[targetIndex - 1];
    const afterId = targetMapping[targetIndex];
    const beforeOrder = beforeId ? targetComponents[beforeId]?.layouts?.[currentLayout]?.flexOrder ?? 0 : 0;
    const afterOrder = afterId ? targetComponents[afterId]?.layouts?.[currentLayout]?.flexOrder ?? null : null;

    const newFlexOrder = afterOrder === null ? beforeOrder + 1000 : (beforeOrder + afterOrder) / 2;
    const gapTooSmall = afterOrder !== null && (newFlexOrder - beforeOrder < 1 || afterOrder - newFlexOrder < 1);

    const mainSize = currentWidget.layouts?.[currentLayout]?.mainSize ?? 100;

    if (gapTooSmall) {
      // Rebase all target children + dragged widget onto multiples of 1000 to restore gaps.
      const reordered = [...targetMapping];
      reordered.splice(targetIndex, 0, widgetId);
      const layoutPatch = {};
      reordered.forEach((id, idx) => {
        if (id === widgetId) {
          layoutPatch[id] = { flexOrder: (idx + 1) * 1000, mainSize };
        } else if (targetComponents[id]?.layouts?.[currentLayout]) {
          layoutPatch[id] = { flexOrder: (idx + 1) * 1000 };
        }
      });
      setComponentLayout(layoutPatch, targetParentId, undefined, { updateParent: true });
    } else {
      setComponentLayout({ [widgetId]: { flexOrder: newFlexOrder, mainSize } }, targetParentId, undefined, {
        updateParent: true,
      });
    }

    e.target.style.transform = '';
    incrementCanvasUpdater();
    if (targetParentId) setReorderContainerChildren(targetParentId);
    return true;
  }

  // ── Case 3: dragged out to grid canvas → synthesize absolute layout ─────────
  const canvasElId = targetSlotId === 'real-canvas' ? 'real-canvas' : `canvas-${targetSlotId}`;
  const canvasEl = document.getElementById(canvasElId);
  const canvasRect = canvasEl?.getBoundingClientRect() ?? { left: 0, top: 0 };
  const widgetRect = e.target.getBoundingClientRect();

  const _gridWidth = useGridStore.getState().subContainerWidths[targetSlotId] || gridWidth;
  const rawLeft = widgetRect.left - canvasRect.left;
  const rawTop = widgetRect.top - canvasRect.top + (canvasEl?.scrollTop ?? 0);

  let newLeft = Math.round(Math.max(0, rawLeft) / _gridWidth);
  let newTop = Math.max(0, Math.round(rawTop / GRID_HEIGHT) * GRID_HEIGHT);
  let newWidth = DEFAULT_GRID_WIDTH_CELLS;

  if (newLeft + newWidth > NO_OF_GRIDS) {
    newLeft = Math.max(0, NO_OF_GRIDS - newWidth);
  }

  const mainSize = currentWidget.layouts?.[currentLayout]?.mainSize ?? 100;
  setComponentLayout(
    { [widgetId]: { top: newTop, left: newLeft, width: newWidth, height: mainSize } },
    targetParentId,
    undefined,
    { updateParent: sourceParentId !== targetParentId }
  );

  incrementCanvasUpdater();
  if (targetParentId) setReorderContainerChildren(targetParentId);

  return true;
}
