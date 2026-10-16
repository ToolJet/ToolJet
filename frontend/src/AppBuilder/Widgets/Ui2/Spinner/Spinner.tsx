import React from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { clamp } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { justify, own } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Spinner ---------------------------------------------------------------------------------------------------------

const SPINNER_SIZE: Record<string, number> = { sm: 16, default: 24, lg: 32 };

export const ShadSpinner = (props: WidgetProps) => {
  const { properties: p, setExposedVariables } = props;
  useExposed(setExposedVariables, p, {});
  const size = own(SPINNER_SIZE, p.size) ?? clamp(p.size, 8, 200, 24);
  const label = isSet(p.label) ? String(p.label) : '';
  const below = p.labelPosition === 'bottom';
  const stroke = Math.max(2, Math.round(size / 10));
  const r = (size - stroke) / 2;
  const indicator =
    p.variant === 'dots' ? (
      <span className="inline-flex shrink-0 items-center" style={{ height: size, gap: Math.max(2, size / 8) }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-bounce rounded-full bg-[color:var(--sc-primary)]"
            style={{ width: size / 4, height: size / 4, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    ) : (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 animate-spin"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[color:var(--lk-track,color-mix(in_srgb,var(--sc-primary)_18%,transparent))]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * r * 0.5} ${Math.PI * r * 2}`}
          className="stroke-[color:var(--sc-primary)]"
        />
      </svg>
    );
  return (
    <Shell {...props}>
      <div className={cn('flex', justify(props.styles))}>
        <div
          role="status"
          aria-label={label || 'Loading'}
          className={cn('inline-flex items-center', below ? 'flex-col gap-2' : 'flex-row gap-2')}
        >
          {indicator}
          {label ? (
            <span className="text-sm text-[color:var(--lk-label,var(--sc-muted-foreground))]">{label}</span>
          ) : null}
        </div>
      </div>
    </Shell>
  );
};

export default withControlState(ShadSpinner);
