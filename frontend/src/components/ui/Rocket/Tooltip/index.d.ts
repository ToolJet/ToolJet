// Types for index.jsx, which TS infers with every destructured prop required.
// Delete this file once the Tooltip wrapper is converted to TypeScript.
import type { ReactElement, ReactNode } from 'react';

export interface TooltipCompProps {
  /** Must be a single element; it becomes the trigger via `asChild`. */
  children: ReactElement;
  /** Tooltip is skipped and `children` render alone when empty. */
  content?: ReactNode;
  classes?: { content?: string };
  arrow?: boolean;
  /** Wraps `children` so a disabled control can still trigger the tooltip. */
  isTooltipForInteractiveDisabledElement?: boolean;
  open?: boolean;
}

declare function TooltipComp(props: TooltipCompProps): ReactElement;

export default TooltipComp;
