import React, { useRef } from 'react';
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
const TONES: Record<string, string> = { destructive: 'destructive' };
export const alertTone = (variant: unknown): string | null => TONES[String(variant ?? '')] ?? null;
const toneVars = (tone: string | null): React.CSSProperties | undefined =>
  tone
    ? ({
        '--al-bg': `color-mix(in srgb, var(--sc-${tone}) 6%, var(--sc-background))`,
        '--al-border': `color-mix(in srgb, var(--sc-${tone}) 50%, transparent)`,
        '--al-ink': `var(--sc-${tone}-ink)`,
      } as React.CSSProperties)
    : undefined;

export const ShadAlert = (props: WidgetProps) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  // In a fixed box (the editor, or Dynamic height off) the card fills the box, its content scrolling inside: sized to
  // its content, the card ignored the box's height.
  const fixed = inFixedBox(props);
  return (
    <Shell {...props} innerRef={ref} className={cn(fixed && 'tw-h-full')}>
      <Alert
        style={toneVars(alertTone(properties.variant))}
        className={cn(
          fixed && 'tw-h-full tw-overflow-y-auto',
          'tw-bg-[color:var(--lk-bg,var(--al-bg,var(--sc-background)))]',
          'tw-border-[color:var(--lk-border,var(--al-border,var(--sc-border)))]',
          'tw-text-[color:var(--al-ink,var(--sc-foreground))]',
          'tw-rounded-[var(--lk-radius,var(--sc-radius))]'
        )}
      >
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
