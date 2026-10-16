import React, { useRef } from 'react';
import { useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { useSizedBox } from '@/AppBuilder/Widgets/Ui2/_shared/boxFit';
import { textArg, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const ShadButton = (props) => {
  const { styles, setExposedVariables, fireEvent } = props;
  // setText changes the label until the Label property itself changes, like the native Button's.
  const [properties, override] = useOverrides(props.properties);
  const latest = useRef(properties);
  latest.current = properties;
  useExposed(setExposedVariables, properties, {
    buttonText: String(properties.text ?? ''),
    setText: async (text) => override('text', textArg(text)),
    click: async () => {
      if (!busy(latest.current)) fireEvent('onClick');
    },
  });
  // Like ToolJet's Button, it fills its box's height, and its width when the box was sized for it (grid, or a
  // fixed-width flex child); as a flex fill child it keeps its own width. Full width always fills. A fixed 36px
  // button in a 36px box overflowed the box's padding and lost its bottom edge.
  const boxRef = useRef(null);
  const fillsBox = useSizedBox(boxRef);
  // Each variant has its own colours, so a style replaces them only when set. A set background darkens a little on
  // hover unless the hover background is set too.
  const hover = isSet(styles?.hoverBackgroundColor)
    ? 'hover:bg-[color:var(--lk-hover)]'
    : whenSet(styles, 'backgroundColor', 'hover:bg-[color:color-mix(in_srgb,var(--lk-bg)_88%,#000)]');
  return (
    <Shell {...props} innerRef={boxRef} className="h-full">
      <Button
        variant={properties.variant || 'default'}
        size={properties.size || 'default'}
        className={cn(
          'h-full',
          (properties.fullWidth === true || fillsBox) && 'w-full',
          whenSet(styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
          hover,
          whenSet(styles, 'textColor', 'text-[color:var(--lk-fg)] hover:text-[color:var(--lk-fg)]'),
          whenSet(styles, 'borderColor', 'border border-[color:var(--lk-border)]'),
          whenSet(styles, 'borderRadius', 'rounded-[var(--lk-radius)]')
        )}
        // In a List view row its box fits its content (height auto), where h-full alone shrank the button to its
        // label's line (20px); it keeps the height it was drawn at.
        style={Number(props.height) > 0 ? { minHeight: Number(props.height) } : undefined}
        disabled={!!properties.disabledState || !!properties.loadingState}
        onClick={() => fireEvent('onClick')}
        onMouseEnter={() => fireEvent('onHover')}
      >
        {properties.loadingState ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {String(properties.text ?? '')}
      </Button>
    </Shell>
  );
};
