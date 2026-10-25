import React from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { styleVars, px } from '../lib/ui2/display/lists/model';
import { LoadingBox, LoadingFrame, PillSkel, useLoadingLook } from '../lib/ui2/loading/look';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display.css';

const VARIANTS = ['default', 'secondary', 'outline', 'success', 'warning', 'destructive'];
// UI 2.0's badgeVariant: a known name in any case ("Success"), danger as destructive, anything else the default look.
const badgeVariant = (value: unknown) => {
  const name = String(value ?? '').trim().toLowerCase();
  if (name === 'danger') return 'destructive';
  return VARIANTS.includes(name) ? name : 'default';
};

export const Badge = () => {
  const [text] = ToolJet.useStateString({ name: 'text', label: 'Text', initialValue: 'Badge' });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['default', 'secondary', 'outline', 'success', 'warning', 'destructive'],
    initialValue: 'default',
    section: 'Appearance',
  });
  const [align] = ToolJet.useStateEnumeration({
    name: 'align',
    label: 'Alignment',
    enumDefinition: ['flex-start', 'center', 'flex-end'],
    enumLabels: { 'flex-start': 'Left', center: 'Center', 'flex-end': 'Right' },
    initialValue: 'flex-start',
    inspector: 'switch',
    section: 'Appearance',
  });
  const onClick = ToolJet.useEventCallback({ name: 'onClick' });
  // UI 2.0's Badge styles: unset, each variant keeps its own colours.
  const background = useThemeColor('backgroundColor', 'Badge background', TOKEN.brand);
  const textColor = useThemeColor('textColor', 'Badge text color', TOKEN.surface);
  const borderColor = useThemeColor('borderColor', 'Badge border color', 'transparent');
  const borderRadius = useThemeRadius('borderRadius', 'Badge radius');
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 4, defaultHeight: 3 });

  const vars = styleVars([
    [background, '--lk-bg'],
    [textColor, '--lk-fg'],
    [borderColor, '--lk-border'],
    [borderRadius, '--lk-radius', px],
  ]);
  return (
    <LoadingFrame loading={ld.loading} look={ld.skeleton ? <PillSkel /> : <LoadingBox />}>
      <div className="ui ui-badge-wrap" style={{ justifyContent: align, ...vars }}>
        <span className={cn('ui-badge', 'ui2-badge', `ui-badge--${badgeVariant(variant)}`, 'ui-badge--clickable')} title={String(text ?? '')} onClick={onClick}>
          <span className="ui2-truncate">{String(text ?? '')}</span>
        </span>
      </div>
    </LoadingFrame>
  );
};
