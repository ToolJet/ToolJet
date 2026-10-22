import React, { useRef } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Alert, AlertDescription, AlertTitle, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { inFixedBox } from '@/AppBuilder/Widgets/Ui2/_shared/useDynamicHeight';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/values';

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
  const { properties, setExposedVariables } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
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
        {Icon ? <Icon className="tw-h-4 tw-w-4" aria-hidden /> : null}
        <AlertTitle className="tw-text-[color:var(--lk-title,var(--al-ink,var(--sc-foreground)))]">
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
      </Alert>
    </Shell>
  );
};

export default withControlState(ShadAlert);
