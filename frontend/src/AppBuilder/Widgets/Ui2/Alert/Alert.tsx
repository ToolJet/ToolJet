import React, { useRef } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Alert, AlertDescription, AlertTitle, Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { inFixedBox } from '@/AppBuilder/Widgets/Ui2/_shared/useDynamicHeight';
import { isSet, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// A variant's look, as variables every part reads after its own style: a style that is set overrides its part only,
// and each part whose style is blank keeps the variant's look (its tint, border, title and text). Destructive drew only
// a border and a text colour, with no background of its own, so once the background, border and title were set it
// showed only in the description's colour.
// Info, Success and Warning are the status looks beside Destructive, each from the theme's own colour, with its icon.
const TONES: Record<string, string> = {
  info: 'primary',
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
};
const ICONS: Record<string, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleAlert,
};
/** The variant, now that it can be bound to data: a known name in any case ("Warning"), danger or error as
 *  destructive, and anything else the default look. */
export const alertVariant = (value: unknown): string => {
  const name = String(value ?? '')
    .trim()
    .toLowerCase();
  if (name === 'danger' || name === 'error') return 'destructive';
  return name in TONES || name === 'custom' ? name : 'default';
};
// Custom is a status look in the author's own colour: the Custom accent style (the theme's primary while blank) gives
// the tint, the border and the ink the way a theme colour does for Info or Warning. Each part's own style still wins.
const CUSTOM_TONE = 'var(--lk-accent,var(--sc-primary))';
const toneVars = (variant: string): React.CSSProperties | undefined => {
  const token = TONES[variant];
  if (!token && variant !== 'custom') return undefined;
  const tone = token ? `var(--sc-${token})` : CUSTOM_TONE;
  return {
    '--al-bg': `color-mix(in srgb, ${tone} 6%, var(--sc-background))`,
    '--al-border': `color-mix(in srgb, ${tone} 50%, transparent)`,
    '--al-ink': token ? `var(--sc-${token}-ink)` : `color-mix(in srgb, ${tone} 60%, var(--sc-foreground))`,
  } as React.CSSProperties;
};

export const ShadAlert = (props: WidgetProps) => {
  const { setExposedVariables, fireEvent } = props;
  // setTitle, setDescription and setVariant change the alert until the property itself changes, like the Button's
  // setText.
  const [properties, override] = useOverrides(props.properties);
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {
    title: toText(properties.title),
    description: toText(properties.description),
    variant: alertVariant(properties.variant),
    setTitle: async (text: unknown) => override('title', toText(text)),
    setDescription: async (text: unknown) => override('description', toText(text)),
    setVariant: async (variant: unknown) => override('variant', alertVariant(variant)),
  });
  // Disabled or loading, the action and the close button take no click and fire nothing, as every UI 2.0 action does.
  const idle = !busy(properties);
  // The close button hides the alert, as its setVisibility action does (Collapse when hidden decides its space).
  const close = () => {
    if (!idle) return;
    props.setVisibility?.(false);
    fireEvent('onClose');
  };
  // In a fixed box (the editor, or Dynamic height off) the card fills the box, its content scrolling inside: sized to
  // its content, the card ignored the box's height.
  const fixed = inFixedBox(props);
  const Icon = ICONS[alertVariant(properties.variant)];
  return (
    <Shell {...props} innerRef={ref} className={cn(fixed && 'tw-h-full')}>
      <Alert
        style={toneVars(alertVariant(properties.variant))}
        className={cn(
          fixed && 'tw-h-full tw-overflow-y-auto',
          'tw-bg-[color:var(--lk-bg,var(--al-bg,var(--sc-background)))]',
          'tw-border-[color:var(--lk-border,var(--al-border,var(--sc-border)))]',
          'tw-text-[color:var(--al-ink,var(--sc-foreground))]',
          'tw-rounded-[var(--lk-radius,var(--sc-radius))]',
          '[&>svg]:tw-text-[color:var(--al-ink,var(--sc-foreground))]'
        )}
      >
        {properties.dismissible ? (
          // First, so the icon's indent (the siblings after it) leaves it in the corner.
          <button
            type="button"
            aria-label="Close"
            disabled={!idle}
            onClick={close}
            className="tw-absolute tw-right-3 tw-top-3 tw-rounded-ui2-sm tw-border-0 tw-bg-transparent tw-p-0.5 tw-text-current tw-opacity-70 hover:tw-opacity-100 disabled:tw-pointer-events-none"
          >
            <X className="tw-h-4 tw-w-4" aria-hidden />
          </button>
        ) : null}
        {Icon ? <Icon className="tw-h-4 tw-w-4" aria-hidden /> : null}
        <AlertTitle
          className={cn(
            'tw-text-[color:var(--lk-title,var(--al-ink,var(--sc-foreground)))]',
            properties.dismissible && 'tw-pr-6'
          )}
        >
          {String(properties.title ?? '')}
        </AlertTitle>
        {properties.description ? (
          <AlertDescription
            className={cn(
              'tw-text-[color:var(--lk-fg,var(--al-ink,var(--sc-foreground)))]',
              isSet(props.styles?.textColor) && 'tw-opacity-100'
            )}
          >
            {String(properties.description)}
          </AlertDescription>
        ) : null}
        {properties.actionLabel ? (
          <div className="tw-mt-3">
            <Button
              size="sm"
              variant="outline"
              disabled={!idle}
              onClick={() => {
                if (idle) fireEvent('onActionClicked');
              }}
            >
              {String(properties.actionLabel)}
            </Button>
          </div>
        ) : null}
      </Alert>
    </Shell>
  );
};

export default withControlState(ShadAlert);
