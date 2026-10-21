import React, { useRef } from 'react';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { iconFor, justify } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';
import { clampCoerce, own } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';

// ---- Icon ------------------------------------------------------------------------------------------------------------

const TONE_COLOR: Record<string, string> = {
  default: 'var(--sc-foreground)',
  muted: 'var(--sc-muted-foreground)',
  primary: 'var(--sc-primary)',
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  destructive: 'var(--sc-destructive)',
};

export const ShadIcon = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, fireEvent, height, id } = props;
  const latest = useRef(p);
  latest.current = p;
  useExposed(setExposedVariables, p, { click: async () => !busy(latest.current) && fireEvent('onClick') });
  const hasClick = useHasEvent(id, 'onClick');
  const Icon = iconFor(p.icon);
  const size = clampCoerce(p.size, 8, 512, 20);
  const stroke = clampCoerce(p.strokeWidth, 0.5, 4, 2);
  const chip = p.chip === 'circle' || p.chip === 'square' ? p.chip : 'none';
  const chipSize = chip === 'none' ? size : clampCoerce(p.chipSize, size, 1024, Math.round(size * 2));
  const clickable = hasClick && !busy(p);
  const click = () => !busy(p) && fireEvent('onClick');
  const shape = chip === 'circle' ? 'tw-rounded-full' : 'tw-rounded-[var(--lk-radius,var(--sc-radius))]';
  return (
    <Shell {...props}>
      <div
        className={cn('tw-flex tw-items-center', justify(props.styles))}
        style={{ minHeight: Math.min(height || 0, 2000) }}
      >
        {p.loadingState ? (
          wantsSkeleton(p) ? (
            <Skeleton
              className={cn('tw-shrink-0', chip === 'none' ? 'tw-rounded-ui2-md' : shape)}
              style={{ width: chipSize, height: chipSize }}
            />
          ) : (
            <span
              className="tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center"
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
              'tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-text-[color:var(--lk-icon,var(--ic-tone))]',
              chip !== 'none' &&
                cn(
                  shape,
                  'tw-bg-[color:var(--lk-chip,color-mix(in_srgb,var(--lk-icon,var(--ic-tone))_12%,transparent))]'
                ),
              clickable &&
                'tw-cursor-pointer tw-transition-opacity hover:tw-opacity-80 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring',
              p.disabledState && 'sc-self-dim tw-opacity-50'
            )}
            style={
              {
                width: chipSize,
                height: chipSize,
                '--ic-tone': own(TONE_COLOR, p.tone) || TONE_COLOR.default,
              } as StyleWithVars
            }
          >
            <Icon size={size} strokeWidth={stroke} aria-hidden="true" />
          </span>
        )}
      </div>
    </Shell>
  );
};

export default withControlState(ShadIcon);
