import React, { useRef } from 'react';
import { useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { ringGeometry } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { justify } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Circular progress -----------------------------------------------------------------------------------------------

export const ShadCircularProgress = (props) => {
  const { setExposedVariables } = props;
  // The native Circular progress bar's setValue: holds until the Value property itself changes.
  const [p, override] = useOverrides(props.properties);
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const g = ringGeometry(p.value, p.size, p.thickness);
  useExposed(setExposedVariables, p, {
    value: g.percent,
    setValue: async (v) => override('value', Number(v) || 0),
  });
  const mode = ['value', 'custom', 'none'].includes(p.centerText) ? p.centerText : 'value';
  const centre = mode === 'value' ? `${Math.round(g.percent)}%` : mode === 'custom' ? String(p.text ?? '') : '';
  const label = isSet(p.label) ? String(p.label) : '';
  const centreSize = Math.max(10, Math.round(g.size * 0.22));
  const labelSize = Math.max(9, Math.min(14, Math.round(g.size * 0.11)));
  const c = g.size / 2;
  return (
    <Shell {...props} innerRef={ref}>
      <div className={cn('flex', justify(props.styles, 'center'))}>
        {p.loadingState ? (
          wantsSkeleton(p) ? (
            <Skeleton className="rounded-full" style={{ width: g.size, height: g.size }} />
          ) : (
            <span className="flex items-center justify-center" style={{ width: g.size, height: g.size }}>
              <Spinner className={g.size >= 48 ? 'h-6 w-6' : undefined} />
            </span>
          )
        ) : (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(g.percent)}
            aria-label={label || 'Progress'}
            className="relative shrink-0"
            style={{ width: g.size, height: g.size }}
          >
            <svg width={g.size} height={g.size} viewBox={`0 0 ${g.size} ${g.size}`} className="-rotate-90">
              <circle
                cx={c}
                cy={c}
                r={g.radius}
                fill="none"
                strokeWidth={g.thickness}
                className="stroke-[color:var(--lk-track,color-mix(in_srgb,var(--sc-primary)_15%,transparent))]"
              />
              {g.percent > 0 ? (
                <circle
                  cx={c}
                  cy={c}
                  r={g.radius}
                  fill="none"
                  strokeWidth={g.thickness}
                  strokeLinecap={p.lineCap === 'flat' ? 'butt' : 'round'}
                  strokeDasharray={g.circumference}
                  strokeDashoffset={g.offset}
                  className="stroke-[color:var(--sc-primary)] transition-[stroke-dashoffset] duration-500 ease-out"
                />
              ) : null}
            </svg>
            {centre || label ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center leading-tight">
                {centre ? (
                  <span
                    className="max-w-full truncate font-semibold tabular-nums tracking-tight text-[color:var(--lk-fg,var(--sc-foreground))]"
                    style={{ fontSize: centreSize }}
                  >
                    {centre}
                  </span>
                ) : null}
                {label ? (
                  <span
                    className="max-w-full truncate text-[color:var(--lk-label,var(--sc-muted-foreground))]"
                    style={{ fontSize: labelSize }}
                  >
                    {label}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Shell>
  );
};

export default withControlState(ShadCircularProgress);
