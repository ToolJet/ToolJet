import { useDynamicHeight as useDynamicHeightHook } from '@/_hooks/useDynamicHeight';

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
