import React, { useRef } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { ExternalLink } from 'lucide-react';
import { useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { justify } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';
import { clampCoerce, own, safeUrl, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ---- Link ------------------------------------------------------------------------------------------------------------

const UNDERLINE: Record<string, string> = {
  always: 'underline',
  hover: 'on-hover',
  none: 'no-underline',
  never: 'no-underline',
};

export const WEIGHT: Record<string, string> = {
  normal: 'tw-font-normal',
  medium: 'tw-font-medium',
  semibold: 'tw-font-semibold',
  bold: 'tw-font-bold',
};

export const ShadLink = (props: WidgetProps) => {
  const { setExposedVariables, fireEvent, height } = props;
  // setLinkTarget and setLinkText hold until the Link target and Text properties themselves change.
  const [p, override] = useOverrides(props.properties);
  // A script URL (javascript:) is no link: the text shows without one.
  const href = safeUrl(p.linkTarget);
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const latest = useRef(p);
  latest.current = p;
  useExposed(setExposedVariables, p, {
    linkTarget: href,
    linkText: String(p.linkText ?? ''),
    setLinkTarget: async (v: unknown) => override('linkTarget', toText(v)),
    setLinkText: async (v: unknown) => override('linkText', toText(v)),
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
    'tw-inline-flex tw-max-w-full tw-items-center tw-gap-1 tw-rounded-ui2-sm tw-text-[color:var(--lk-fg,var(--sc-primary-ink))] tw-underline-offset-4 tw-transition-colors hover:tw-text-[color:var(--lk-hover,var(--lk-fg,var(--sc-primary)))] focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring',
    underline === 'underline' && 'tw-underline',
    underline === 'on-hover' && 'tw-no-underline hover:tw-underline',
    underline === 'no-underline' && 'tw-no-underline hover:tw-no-underline',
    own(WEIGHT, p.fontWeight) || WEIGHT.medium,
    disabled && 'sc-self-dim tw-pointer-events-none tw-opacity-50'
  );
  const style = { fontSize: clampCoerce(p.fontSize, 8, 96, 14), lineHeight: 1.4 };
  const content = (
    <>
      <span className="tw-truncate">{String(p.linkText ?? '')}</span>
      {p.showIcon === true ? (
        <ExternalLink className="tw-shrink-0" style={{ width: '0.85em', height: '0.85em' }} />
      ) : null}
    </>
  );
  const onHover = () => fireEvent('onHover');
  return (
    <Shell {...props}>
      <div
        className={cn('tw-flex tw-items-center', justify(props.styles))}
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
            className={cn(className, 'tw-cursor-pointer tw-bg-transparent tw-p-0')}
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
