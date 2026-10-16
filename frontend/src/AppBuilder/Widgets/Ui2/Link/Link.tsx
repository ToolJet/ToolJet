import React, { useRef } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { ExternalLink } from 'lucide-react';
import { useOverrides, textArg } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { clamp } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { justify, own } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Link ------------------------------------------------------------------------------------------------------------

const UNDERLINE: Record<string, string> = {
  always: 'underline',
  hover: 'on-hover',
  none: 'no-underline',
  never: 'no-underline',
};

export const WEIGHT: Record<string, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const ShadLink = (props: WidgetProps) => {
  const { setExposedVariables, fireEvent, height } = props;
  // setLinkTarget and setLinkText hold until the Link target and Text properties themselves change.
  const [p, override] = useOverrides(props.properties);
  const href = String(p.linkTarget ?? '').trim();
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const latest = useRef(p);
  latest.current = p;
  useExposed(setExposedVariables, p, {
    linkTarget: href,
    linkText: String(p.linkText ?? ''),
    setLinkTarget: async (v: unknown) => override('linkTarget', textArg(v)),
    setLinkText: async (v: unknown) => override('linkText', textArg(v)),
    // click() follows the link as a click does (onClick fires, the target opens).
    click: async () => {
      if (busy(latest.current)) return;
      if (anchorRef.current) anchorRef.current.click();
      else fireEvent('onClick');
    },
  });
  // A migrated target of '_self' reads as the same tab.
  const sameTab = p.targetType === 'same' || p.targetType === '_self';
  const underline = own(UNDERLINE, p.underline) || (typeof p.underline === 'string' && p.underline) || 'on-hover';
  const disabled = busy(p);
  const className = cn(
    'inline-flex max-w-full items-center gap-1 rounded-sm text-[color:var(--lk-fg,var(--sc-primary-ink))] underline-offset-4 transition-colors hover:text-[color:var(--lk-hover,var(--lk-fg,var(--sc-primary)))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    underline === 'underline' && 'underline',
    underline === 'on-hover' && 'no-underline hover:underline',
    underline === 'no-underline' && 'no-underline hover:no-underline',
    own(WEIGHT, p.fontWeight) || WEIGHT.medium,
    disabled && 'pointer-events-none opacity-50'
  );
  const style = { fontSize: clamp(p.fontSize, 8, 96, 14), lineHeight: 1.4 };
  const content = (
    <>
      <span className="truncate">{String(p.linkText ?? '')}</span>
      {p.showIcon === true ? <ExternalLink className="shrink-0" style={{ width: '0.85em', height: '0.85em' }} /> : null}
    </>
  );
  const onHover = () => fireEvent('onHover');
  return (
    <Shell {...props}>
      <div
        className={cn('flex items-center', justify(props.styles))}
        style={{ minHeight: Math.min(height || 0, 2000) }}
      >
        {href ? (
          <a
            ref={anchorRef}
            href={href}
            target={sameTab ? '_self' : '_blank'}
            rel={sameTab ? undefined : 'noopener noreferrer'}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
            className={className}
            style={style}
            onMouseEnter={onHover}
            onClick={(e) => {
              if (disabled) {
                e.preventDefault();
                return;
              }
              fireEvent('onClick');
            }}
          >
            {content}
          </a>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className={cn(className, 'cursor-pointer bg-transparent p-0')}
            style={style}
            onMouseEnter={onHover}
            onClick={() => fireEvent('onClick')}
          >
            {content}
          </button>
        )}
      </div>
    </Shell>
  );
};

export default withControlState(ShadLink);
