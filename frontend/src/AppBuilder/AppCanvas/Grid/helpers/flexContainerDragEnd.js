import { useGridStore } from '@/_stores/gridStore';
import useStore from '@/AppBuilder/_stores/store';
import { NO_OF_GRIDS } from '../../appCanvasConstants';
import { getDroppableSlotIdOnScreen, getParentFromSlotId } from './dragEnd';
import {
  computeFlexInsertIndex,
  getEffectiveFlexDirectionForFlexContainer,
  getOrderedFlexChildrenFromSnapshot,
} from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';

const GRID_HEIGHT = 10;
const DEFAULT_GRID_WIDTH_CELLS = 10;

const buildFlexMappingFromDom = (parentId) => {
  if (typeof document === 'undefined') return [];
  const inner = document.querySelector(`[data-parentId="${parentId}"]`);
  if (!inner) return [];
  const children = inner.querySelectorAll(':scope > .flex-child-wrapper');
  return Array.from(children)
    .map((el) => el?.id)
    .filter(Boolean);
};

/**
 * Handles dragEnd for a widget whose source parent is a FlexContainer.
 * Returns true if handled (caller should skip normal dragEnd logic).
 * Returns false if source is not a FlexContainer child.
 *
 * Three cases:
 *   1. Dropped into the SAME FlexContainer → reorder parent childOrder.
 *   2. Dropped into a DIFFERENT FlexContainer → reparent and update both childOrder arrays.
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
    const parentDir = getEffectiveFlexDirectionForFlexContainer(getResolvedComponent, sourceParentId, moduleId, null);
    // Prefer the slot last published to flexContainerDropTarget so the drop matches what
    // the indicator showed; fall back to live compute if the store target is stale/missing.
    const lockedTarget = useStore.getState().flexContainerDropTarget;
    const lockedIndex = lockedTarget?.flexContainerId === sourceParentId ? lockedTarget.index : null;
    const newIndex = lockedIndex ?? computeFlexInsertIndex(sourceParentId, e.clientX, e.clientY, parentDir, widgetId);
    const snapshot = useStore.getState().getCurrentPageComponents?.(moduleId) ?? {};
    let mapping = useStore.getState().containerChildrenMapping?.[sourceParentId] ?? [];
    if (!Array.isArray(mapping) || !mapping.includes(widgetId)) {
      mapping = getOrderedFlexChildrenFromSnapshot(snapshot, sourceParentId);
      if (!mapping.includes(widgetId)) {
        mapping = buildFlexMappingFromDom(sourceParentId);
      }
    }

    e.target.style.transform = '';
    if (mapping.includes(widgetId)) {
      useStore.getState().moveFlexContainerChild({
        childId: widgetId,
        sourceContainerId: sourceParentId,
        targetContainerId: sourceParentId,
        targetIndex: newIndex,
        moduleId,
      });
      setReorderContainerChildren(sourceParentId);
    }
    incrementCanvasUpdater();
    return true;
  }

  // ── Case 2: different FlexContainer → reparent at the locked slot ──────────
  if (targetParentType === 'FlexContainer') {
    const targetComponents = useStore.getState().getCurrentPageComponents?.(moduleId) ?? {};
    const targetMapping = getOrderedFlexChildrenFromSnapshot(
      targetComponents,
      targetParentId,
      useStore.getState().containerChildrenMapping?.[targetParentId] ?? []
    );

    // Honor the slot the indicator displayed; append at end if no live target.
    const lockedTarget = useStore.getState().flexContainerDropTarget;
    const targetIndex = lockedTarget?.flexContainerId === targetParentId ? lockedTarget.index : targetMapping.length;

    // Carry forward the dragged widget's per-axis sizing so reparenting preserves
    // its current Fill/Fixed state across both axes.
    const sourceLayout = currentWidget.layouts?.[currentLayout] ?? {};
    const carriedSizing = {};
    if (sourceLayout.fillWidth !== undefined) carriedSizing.fillWidth = sourceLayout.fillWidth;
    if (sourceLayout.widthPx !== undefined) carriedSizing.widthPx = sourceLayout.widthPx;
    if (sourceLayout.height !== undefined) carriedSizing.height = sourceLayout.height;

    useStore.getState().moveFlexContainerChild({
      childId: widgetId,
      sourceContainerId: sourceParentId,
      targetContainerId: targetParentId,
      targetIndex,
      moduleId,
      layoutPatch: carriedSizing,
    });

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

  // Synthesize a grid height from the widget's current rendered height.
  const sourceLayoutOnDragOut = currentWidget.layouts?.[currentLayout] ?? {};
  const synthesizedHeight = sourceLayoutOnDragOut.height ?? 100;

  setComponentLayout(
    { [widgetId]: { top: newTop, left: newLeft, width: newWidth, height: synthesizedHeight } },
    targetParentId,
    undefined,
    { updateParent: sourceParentId !== targetParentId }
  );

  incrementCanvasUpdater();
  if (targetParentId) setReorderContainerChildren(targetParentId);

  return true;
}
