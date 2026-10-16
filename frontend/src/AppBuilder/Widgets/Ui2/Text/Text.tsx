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
  paragraph: 'leading-7',
  lead: 'text-xl text-muted-foreground',
  muted: 'text-sm text-muted-foreground',
  small: 'text-sm font-medium leading-none',
  large: 'text-lg font-semibold',
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
          'whitespace-pre-line',
          whenSet(props.styles, 'textColor', 'text-[color:var(--lk-fg)]'),
          typeClasses(props.styles),
          clickable && 'cursor-pointer'
        )}
        style={{ textAlign: textAlign(props.styles) }}
      >
        {String(properties.text ?? '')}
      </p>
    </Shell>
  );
};

export default withControlState(ShadText);
