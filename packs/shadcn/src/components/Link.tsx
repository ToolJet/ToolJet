import React, { useRef } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { ExternalLink } from 'lucide-react';
import { cn } from '../lib/cn';
import { clampInt, own, safeUrl } from '../lib/ui2/nav/model';
import { lookVars } from '../lib/ui2/nav/look';
import { LineSkel, LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor } from '../lib/styleDefaults';
import '../styles/ui2-nav.css';

// The underline values UI 2.0 and the pack's earlier names map to.
const UNDERLINE: Record<string, string> = {
  underline: 'underline',
  always: 'underline',
  'on-hover': 'on-hover',
  hover: 'on-hover',
  'no-underline': 'no-underline',
  never: 'no-underline',
  none: 'no-underline',
};
const WEIGHT: Record<string, number> = { normal: 400, medium: 500, semibold: 600, bold: 700 };
const JUSTIFY: Record<string, string> = { left: 'n2-justify-left', center: 'n2-justify-center', right: 'n2-justify-right' };

// UI 2.0 Link: an anchor (a script URL is no link: the text shows as a button instead).
export const Link = () => {
  const [linkText, setLinkText] = ToolJet.useStateString({ name: 'linkText', label: 'Link text', initialValue: 'View details' });
  const [linkTarget, setLinkTarget] = ToolJet.useStateString({ name: 'linkTarget', label: 'Link target (URL)', initialValue: 'https://tooljet.com' });
  const [targetType] = ToolJet.useStateEnumeration({
    name: 'targetType',
    label: 'Open in',
    enumDefinition: ['new', 'same'],
    enumLabels: { new: 'New tab', same: 'Same tab' },
    initialValue: 'new',
    inspector: 'switch',
  });
  const [underline] = ToolJet.useStateEnumeration({
    name: 'underline',
    label: 'Underline',
    enumDefinition: ['underline', 'on-hover', 'no-underline'],
    enumLabels: { underline: 'Always', 'on-hover': 'On hover', 'no-underline': 'Never' },
    initialValue: 'on-hover',
    inspector: 'switch',
  });
  const [showIcon] = ToolJet.useStateBoolean({ name: 'showIcon', label: 'External-link icon', initialValue: false });
  const [fontSize] = ToolJet.useStateNumber({ name: 'fontSize', label: 'Font size (px)', initialValue: 14, min: 8, max: 96 });
  const [fontWeight] = ToolJet.useStateEnumeration({
    name: 'fontWeight',
    label: 'Weight',
    enumDefinition: ['normal', 'medium', 'semibold', 'bold'],
    enumLabels: { normal: 'Normal', medium: 'Medium', semibold: 'Semibold', bold: 'Bold' },
    initialValue: 'medium',
    inspector: 'switch',
  });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  const onHover = ToolJet.useEventCallback({ name: 'onHover' });
  const { disabled } = ToolJet.useControlState();
  const textColor = useThemeColor('textColor', 'Link color', TOKEN.brand);
  const hoverColor = useThemeColor('hoverColor', 'Link hover color', TOKEN.brand);
  const alignment = ToolJet.useStyleEnumeration({
    name: 'alignment',
    label: 'Alignment',
    enumDefinition: ['left', 'center', 'right'],
    initialValue: 'left',
    inspector: 'switch',
  });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 6, defaultHeight: 3 });

  // setLinkTarget and setLinkText hold until the Link target and Text properties themselves change (the state hooks).
  const href = safeUrl(linkTarget);
  const label = String(linkText ?? '');
  const anchorRef = useRef<HTMLAnchorElement>(null);
  const busy = useRef(disabled);
  busy.current = disabled;
  ToolJet.useAction({ name: 'click', displayName: 'Click' }, () => {
    if (busy.current) return;
    // click() follows the link as a click does (onClick fires, the target opens).
    if (anchorRef.current) anchorRef.current.click();
    else onClick();
  });
  ToolJet.useAction({ name: 'setLinkTarget', displayName: 'Set link target', params: [{ handle: 'linkTarget', displayName: 'URL' }] }, (u) =>
    setLinkTarget(u === undefined || u === null ? '' : String(u))
  );
  ToolJet.useAction({ name: 'setLinkText', displayName: 'Set link text', params: [{ handle: 'linkText', displayName: 'Text' }] }, (t) =>
    setLinkText(t === undefined || t === null ? '' : String(t))
  );

  const sameTab = targetType === 'same' || (targetType as string) === '_self';
  const line = own(UNDERLINE, underline) ?? 'on-hover';
  const size = clampInt(fontSize, 8, 96, 14);
  const className = cn('n2-link', `is-${line}`, disabled && 'is-disabled');
  const style = { fontSize: size, fontWeight: own(WEIGHT, fontWeight) ?? 500 };
  const content = (
    <>
      <span className="n2-truncate">{label}</span>
      {showIcon ? <ExternalLink className="n2-link-icon" /> : null}
    </>
  );
  return (
    <LoadingFrame loading={ld.loading} look={ld.skeleton ? <LineSkel /> : <LoadingBox />}>
      <div
        className={cn('ui n2-link-box', own(JUSTIFY, alignment) ?? JUSTIFY.left)}
        style={lookVars([
          [textColor, '--lk-fg'],
          [hoverColor, '--lk-hover'],
        ])}
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
              onClick();
            }}
          >
            {content}
          </a>
        ) : (
          <button type="button" disabled={disabled} className={className} style={style} onMouseEnter={onHover} onClick={onClick}>
            {content}
          </button>
        )}
      </div>
    </LoadingFrame>
  );
};
