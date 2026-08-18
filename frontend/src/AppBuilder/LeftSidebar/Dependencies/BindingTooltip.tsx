import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/Rocket/shadcn/tooltip';
import type { TooltipBinding } from './types';

type TooltipSide = 'top' | 'right' | 'bottom' | 'left';

export type BindingTooltipProps = {
  id?: string;
  title?: string;
  bindings?: TooltipBinding[];
  placement?: TooltipSide | `${TooltipSide}-start` | `${TooltipSide}-end`;
  /** A single element — TooltipTrigger clones it via asChild. */
  children: React.ReactElement;
};

const sideOf = (placement: BindingTooltipProps['placement']): TooltipSide => {
  if (!placement) return 'right';
  if (placement.startsWith('top')) return 'top';
  if (placement.startsWith('bottom')) return 'bottom';
  if (placement.startsWith('left')) return 'left';
  return 'right';
};

/**
 * Dark card shown on hover over a relationship row: a sentence describing the
 * relationship, then one `label / expression` pair per binding behind it.
 * Renders the child untouched when there is nothing to explain.
 */
export const BindingTooltip = ({
  id,
  title,
  bindings,
  placement = 'right',
  children,
}: BindingTooltipProps): React.ReactElement => {
  const resolved = (bindings ?? []).filter((binding) => binding.expression);
  if (!title || resolved.length === 0) return children;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          id={id}
          side={sideOf(placement)}
          sideOffset={8}
          className="dependency-binding-tooltip tw-bg-transparent tw-p-0 tw-shadow-none tw-overflow-visible tw-text-inherit"
        >
          <div className="dependency-binding-card">
            <div className="dependency-binding-title">{title}</div>
            <div className="dependency-binding-body">
              {resolved.map((binding) => (
                <div className="dependency-binding-entry" key={binding.label}>
                  <div className="dependency-binding-label">{binding.label}</div>
                  <div className="dependency-binding-expression">{binding.expression}</div>
                </div>
              ))}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BindingTooltip;
