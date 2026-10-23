import { useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useDynamicHeight as useDynamicHeightHook } from '@/_hooks/useDynamicHeight';
import useStore from '@/AppBuilder/_stores/store';
import { getDynamicLayoutKey } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import type { ContextSegment } from '@/AppBuilder/Widgets/Ui2/_shared/SubcontainerContext';

/** What _hooks/useDynamicHeight reads; any change to `value`, `width` or `componentCount` re-measures the widget. */
export interface DynamicHeightArgs {
  isDynamicHeightEnabled: boolean;
  id: string;
  height: number;
  value?: unknown;
  currentLayout?: string;
  width?: number;
  isContainer?: boolean;
  componentCount?: number;
  visibility?: boolean;
  skipAdjustment?: boolean;
  subContainerIndex?: number | number[];
  isRowSubcontainer?: boolean;
}

/** Whether the widget is drawn at its box's height rather than its content's: the editor draws every widget at its
 *  saved height, and the viewer keeps it when Dynamic height is off. The widget's surface then fills its box (its
 *  content scrolls inside it); otherwise the box follows the content (useAutoHeight), so a surface that stopped short
 *  of its box left a blank band under it in the editor. */
export const inFixedBox = ({
  componentType,
  properties,
  currentMode,
}: {
  componentType?: string;
  properties: Record<string, unknown>;
  currentMode?: string;
}): boolean => !(fitsContentInView(componentType, properties) && currentMode === 'view');

// useDynamicHeight.jsx is JavaScript, so TypeScript reads every argument as required: this gives them a type.
export const useDynamicHeight = useDynamicHeightHook as (args: DynamicHeightArgs) => void;

// dynamicHeightReflow.js is JavaScript (its context defaults to null, so TypeScript reads it as null only).
const layoutKey = getDynamicLayoutKey as (id: string, contextIndices: number[] | null) => string;

type TempStore = { temporaryLayouts?: Record<string, { height?: number } | undefined> };

/** A row (or card) of a per-row widget: `index` in the canvas `id` repeats, `value` its item, `height` its set height. */
export interface RowHeightArgs {
  id: string;
  /** The widget's own context path (useOwnContextPath): the row's context is this path plus `index`. */
  path: ContextSegment[];
  index: number;
  value: unknown;
  fit: boolean;
  height: number;
  currentLayout?: string;
}

/** The height a row or card is drawn at: `height`, or with `fit` the height the reflow found for it from its
 *  components' layouts (as the native Listview's rows). The row's context is the widget's own path plus `index`; the
 *  hook sizes the row on mount and when its item changes. */
export const useFittedRowHeight = ({ id, path, index, value, fit, height, currentLayout }: RowHeightArgs): number => {
  const indices = useMemo(() => [...path.map((segment) => segment.index), index], [path, index]);
  const key = layoutKey(id, indices);
  const fitted = useStore((state: TempStore) => state.temporaryLayouts?.[key]?.height);
  useDynamicHeight({
    isDynamicHeightEnabled: fit,
    id,
    isContainer: true,
    subContainerIndex: indices,
    isRowSubcontainer: true,
    value,
    currentLayout,
    height,
  });
  return fit ? fitted ?? height : height;
};

/** While a widget shows its loading look, its measured root keeps the height its content last had, so the box
 *  useAutoHeight fits neither moves to the look's size nor moves the page when the content comes back. The root is set
 *  to that height exactly (overflow hidden), and the look reads it as --ui2-held-height to draw inside it (LoadingBox,
 *  the block skeleton). Only the skeleton look was held before (a min-height): with the spinner, the default, a fitted
 *  widget jumped to its authored height while loading (a Card grid 119px to 620px). Earlier still the adjustment was
 *  skipped (useDynamicHeight's skipAdjustment), which held the box at a height that could be the authored one. A load
 *  before the first content holds nothing: there is no content height yet. */
export const useSkeletonHold = (
  ref: RefObject<HTMLElement>,
  properties: Record<string, unknown>,
  enabled: boolean
): void => {
  const held = useRef<number | null>(null);
  // Whether the root's height is the hold's: only that one is released, never one the widget set itself.
  const holding = useRef(false);
  const loading = enabled && properties.loadingState === true;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (loading) {
      if (held.current && !holding.current) {
        el.style.height = `${held.current}px`;
        el.style.overflow = 'hidden';
        el.style.setProperty('--ui2-held-height', `${held.current}px`);
        holding.current = true;
      }
      return;
    }
    if (holding.current) {
      el.style.height = '';
      el.style.overflow = '';
      el.style.removeProperty('--ui2-held-height');
      holding.current = false;
    }
    if (enabled) held.current = el.offsetHeight || held.current;
  });
};
