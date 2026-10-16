import React, { useRef } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useAutoHeight, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { typeClasses } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { textAlign } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { useTextActions } from '@/AppBuilder/Widgets/Ui2/_shared/textActions';

export const TONE: Record<string, string> = {
  paragraph: 'tw-leading-7',
  lead: 'tw-text-ui2-xl tw-text-ui2-muted-foreground',
  muted: 'tw-text-ui2-sm tw-text-ui2-muted-foreground',
  small: 'tw-text-ui2-sm tw-font-medium tw-leading-none',
  large: 'tw-text-ui2-lg tw-font-semibold',
};

export const ShadText = (props: WidgetProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const { properties, handlers, clickable } = useTextActions(props);
  return (
    <Shell {...props} innerRef={ref}>
      <p
        {...handlers}
        className={cn(
          TONE[properties.tone] || TONE.paragraph,
          'tw-whitespace-pre-line',
          whenSet(props.styles, 'textColor', 'tw-text-[color:var(--lk-fg)]'),
          typeClasses(props.styles),
          clickable && 'tw-cursor-pointer'
        )}
        style={{ textAlign: textAlign(props.styles) }}
      >
        {String(properties.text ?? '')}
      </p>
    </Shell>
  );
};

export default withControlState(ShadText);
