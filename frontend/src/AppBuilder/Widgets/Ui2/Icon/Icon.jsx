import React, { useRef } from 'react';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { clamp } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { iconFor, justify, onKeyActivate, own } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Icon ------------------------------------------------------------------------------------------------------------

const TONE_COLOR = {
  default: 'var(--sc-foreground)',
  muted: 'var(--sc-muted-foreground)',
  primary: 'var(--sc-primary)',
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  destructive: 'var(--sc-destructive)',
};

export const ShadIcon = (props) => {
  const { properties: p, setExposedVariables, fireEvent, height, id } = props;
  const latest = useRef(p);
  latest.current = p;
  useExposed(setExposedVariables, p, { click: async () => !busy(latest.current) && fireEvent('onClick') });
  const hasClick = useHasEvent(id, 'onClick');
  const Icon = iconFor(p.icon);
  const size = clamp(p.size, 8, 512, 20);
  const stroke = clamp(p.strokeWidth, 0.5, 4, 2);
  const chip = p.chip === 'circle' || p.chip === 'square' ? p.chip : 'none';
  const chipSize = chip === 'none' ? size : clamp(p.chipSize, size, 1024, Math.round(size * 2));
  const clickable = hasClick && !busy(p);
  const click = () => !busy(p) && fireEvent('onClick');
  const shape = chip === 'circle' ? 'rounded-full' : 'rounded-[var(--lk-radius,var(--sc-radius))]';
  return (
    <Shell {...props}>
      <div
        className={cn('flex items-center', justify(props.styles))}
        style={{ minHeight: Math.min(height || 0, 2000) }}
      >
        {p.loadingState ? (
          wantsSkeleton(p) ? (
            <Skeleton
              className={cn('shrink-0', chip === 'none' ? 'rounded-md' : shape)}
              style={{ width: chipSize, height: chipSize }}
            />
          ) : (
            <span
              className="inline-flex shrink-0 items-center justify-center"
              style={{ width: chipSize, height: chipSize }}
            >
              <Spinner />
            </span>
          )
        ) : (
          <span
            role={clickable ? 'button' : 'img'}
            aria-label={typeof p.icon === 'string' && p.icon ? p.icon : 'icon'}
            tabIndex={clickable ? 0 : undefined}
            onClick={click}
            onMouseEnter={() => fireEvent('onHover')}
            onKeyDown={clickable ? onKeyActivate(click) : undefined}
            className={cn(
              'inline-flex shrink-0 items-center justify-center text-[color:var(--lk-icon,var(--ic-tone))]',
              chip !== 'none' &&
                cn(shape, 'bg-[color:var(--lk-chip,color-mix(in_srgb,var(--lk-icon,var(--ic-tone))_12%,transparent))]'),
              clickable &&
                'cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              p.disabledState && 'opacity-50'
            )}
            style={{ width: chipSize, height: chipSize, '--ic-tone': own(TONE_COLOR, p.tone) || TONE_COLOR.default }}
          >
            <Icon size={size} strokeWidth={stroke} aria-hidden="true" />
          </span>
        )}
      </div>
    </Shell>
  );
};

export default withControlState(ShadIcon);
