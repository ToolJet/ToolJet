import React from 'react';
import type { CSSProperties } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../lib/cn';
import { px, styleVars } from '../lib/ui2/display/lists/model';
import { LoadingFrame, blockLook, useLoadingLook } from '../lib/ui2/loading/look';
import '../styles/ui2-display.css';

// UI 2.0's status looks: Info, Success, Warning and Destructive each from a theme colour, Custom from the Custom
// accent style. Each part's own style still wins over the tone.
const TONES: Record<string, string> = {
  info: 'var(--ui-primary)',
  success: 'var(--ui-success)',
  warning: 'var(--ui-warning)',
  destructive: 'var(--ui-destructive)',
};
const ICONS: Record<string, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleAlert,
};

/** A known variant in any case ("Warning"), danger or error as destructive, anything else the default look. */
const alertVariant = (value: unknown): string => {
  const name = String(value ?? '').trim().toLowerCase();
  if (name === 'danger' || name === 'error') return 'destructive';
  return name in TONES || name === 'custom' ? name : 'default';
};

const toneVars = (variant: string): CSSProperties | undefined => {
  const token = TONES[variant];
  if (!token && variant !== 'custom') return undefined;
  const tone = token ?? 'var(--lk-accent, var(--ui-primary))';
  return {
    ['--al-bg' as string]: `color-mix(in srgb, ${tone} 6%, var(--ui-bg))`,
    ['--al-border' as string]: `color-mix(in srgb, ${tone} 50%, transparent)`,
    ['--al-ink' as string]: variant === 'info' ? tone : `color-mix(in srgb, ${tone} ${token ? 50 : 60}%, var(--ui-fg))`,
  };
};

const toText = (v: unknown) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));

export const Alert = () => {
  const [title, setTitle] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Heads up' });
  const [description, setDescription] = ToolJet.useStateString({ name: 'description', label: 'Description', initialValue: '' });
  const [actionLabel] = ToolJet.useStateString({ name: 'actionLabel', label: 'Action label', initialValue: '' });
  const [dismissible] = ToolJet.useStateBoolean({ name: 'dismissible', label: 'Show close button', initialValue: false });
  const [variant, setVariant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['default', 'info', 'success', 'warning', 'destructive', 'custom'],
    enumLabels: { default: 'Default', info: 'Info', success: 'Success', warning: 'Warning', destructive: 'Destructive', custom: 'Custom' },
    initialValue: 'default',
    section: 'Appearance',
  });
  // The pack's own: hide the variant's icon.
  const [showIcon] = ToolJet.useStateBoolean({ name: 'showIcon', label: 'Show icon', initialValue: true, section: 'Appearance' });
  const [dismissed, setDismissed] = ToolJet.useStateBoolean({ name: 'dismissed', initialValue: false, inspector: 'hidden' });
  const onActionClicked = ToolJet.useEventCallback({ name: 'onActionClicked' });
  // UI 2.0's name only: the pack's earlier onDismiss fired alongside it.
  const onClose = ToolJet.useEventCallback({ name: 'onClose' });

  const close = () => {
    setDismissed(true);
    onClose();
  };
  // UI 2.0's Alert actions, plus the pack's show and dismiss.
  ToolJet.useAction(
    { name: 'setTitle', displayName: 'Set title', params: [{ handle: 'title', displayName: 'Title', defaultValue: 'New title' }] },
    (next) => setTitle(toText(next))
  );
  ToolJet.useAction(
    { name: 'setDescription', displayName: 'Set description', params: [{ handle: 'description', displayName: 'Description', defaultValue: 'New description' }] },
    (next) => setDescription(toText(next))
  );
  ToolJet.useAction(
    { name: 'setVariant', displayName: 'Set variant', params: [{ handle: 'variant', displayName: 'Variant', defaultValue: 'info' }] },
    (next) => setVariant(alertVariant(next) as typeof variant)
  );
  ToolJet.useAction({ name: 'show', displayName: 'Show' }, () => setDismissed(false));
  ToolJet.useAction({ name: 'dismiss', displayName: 'Dismiss' }, close);
  const background = ToolJet.useStyleString({ name: 'backgroundColor', label: 'Alert background', inspector: 'color', initialValue: '' });
  const borderColor = ToolJet.useStyleString({ name: 'borderColor', label: 'Alert border color', inspector: 'color', initialValue: '' });
  const accentColor = ToolJet.useStyleString({ name: 'accentColor', label: 'Custom accent', inspector: 'color', initialValue: '' });
  const titleColor = ToolJet.useStyleString({ name: 'titleColor', label: 'Alert title color', inspector: 'color', initialValue: '' });
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Alert description color', inspector: 'color', initialValue: '' });
  const borderRadius = ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Alert radius', initialValue: '' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 20, defaultHeight: 6 });

  if (dismissed) return null;
  const look = alertVariant(variant);
  const Icon = showIcon ? ICONS[look] : undefined;
  const vars = styleVars([
    [background, '--lk-bg'],
    [borderColor, '--lk-border'],
    [accentColor, '--lk-accent'],
    [titleColor, '--lk-title'],
    [textColor, '--lk-fg'],
    [borderRadius, '--lk-radius', px],
  ]);

  return (
    <LoadingFrame loading={ld.loading} look={blockLook(ld.skeleton)}>
      <div className="ui" style={vars}>
        <div className={cn('ui2-alert', Icon && 'has-icon', textColor && 'has-text-color')} role="alert" style={toneVars(look)}>
          {dismissible ? (
            <button type="button" className="ui2-alert-close" aria-label="Close" onClick={close}>
              <X size={16} aria-hidden />
            </button>
          ) : null}
          {Icon ? <Icon className="ui2-alert-icon" size={16} aria-hidden /> : null}
          <div className="ui2-alert-body">
            <h5 className={cn('ui2-alert-title', dismissible && 'has-close')}>{toText(title)}</h5>
            {description ? <div className="ui2-alert-desc">{toText(description)}</div> : null}
            {actionLabel ? (
              <div className="ui2-alert-actions">
                <button type="button" className="ui-btn ui-btn--outline ui-btn--sm ui-btn--auto" onClick={onActionClicked}>
                  {toText(actionLabel)}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </LoadingFrame>
  );
};

