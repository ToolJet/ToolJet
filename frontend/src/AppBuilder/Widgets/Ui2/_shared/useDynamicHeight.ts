import { useMemo } from 'react';
import { useDynamicHeight as useDynamicHeightHook } from '@/_hooks/useDynamicHeight';
import useStore from '@/AppBuilder/_stores/store';
import { getDynamicLayoutKey } from '@/AppBuilder/_stores/utils/dynamicHeightReflow';
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
