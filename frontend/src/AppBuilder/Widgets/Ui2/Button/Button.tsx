import React, { useRef } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Button, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { isSet, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { useModuleId } from '@/AppBuilder/_contexts/ModuleContext';

export const ShadButton = (props: WidgetProps) => {
  const { styles, setExposedVariables, fireEvent, id } = props;
  const moduleId = useModuleId();
  // setText changes the label until the Label property itself changes, like the native Button's.
  const [properties, override] = useOverrides(props.properties);
  const latest = useRef(properties);
  latest.current = properties;
  useExposed(setExposedVariables, properties, {
    buttonText: String(properties.text ?? ''),
    setText: async (text: unknown) => override('text', toText(text)),
    click: async () => {
      if (!busy(latest.current)) fireEvent('onClick');
    },
  });
  // Like ToolJet's Button, it fills its box's height, and its width when the box was sized for it (grid, or a
  // fixed-width flex child); as a flex fill child it keeps its own width. Full width always fills. A fixed 36px
  // button in a 36px box overflowed the box's padding and lost its bottom edge.
  const fillsBox = props.boxFit !== 'fill';
  // Each variant has its own colours, so a style replaces them only when set. A set background darkens a little on
  // hover unless the hover background is set too.
  const hover = isSet(styles?.hoverBackgroundColor)
    ? 'hover:tw-bg-[color:var(--lk-hover)]'
    : cn(
        'lk-theme-hoverBackgroundColor',
        isSet(styles?.backgroundColor) && 'hover:tw-bg-[color:color-mix(in_srgb,var(--lk-bg)_88%,#000)]'
      );
  return (
    <Shell {...props} className="tw-h-full">
      <Button
        variant={properties.variant || 'default'}
        size={properties.size || 'default'}
        className={cn(
          'tw-h-full',
          (properties.fullWidth === true || fillsBox) && 'tw-w-full',
          whenSet(styles, 'backgroundColor', 'tw-bg-[color:var(--lk-bg)]'),
          hover,
          whenSet(styles, 'textColor', 'tw-text-[color:var(--lk-fg)] hover:tw-text-[color:var(--lk-fg)]'),
          whenSet(styles, 'borderColor', 'tw-border tw-border-[color:var(--lk-border)]'),
          whenSet(styles, 'borderRadius', 'tw-rounded-[var(--lk-radius)]')
        )}
        // In a List view row its box fits its content (height auto), where h-full alone shrank the button to its
        // label's line (20px); it keeps the height it was drawn at.
        style={Number(props.height) > 0 ? { minHeight: Number(props.height) } : undefined}
        disabled={!!properties.disabledState || !!properties.loadingState}
        onClick={() => {
          // As the native Button: a click announces itself to a Form whose submit button (buttonToSubmit) this is, and
          // the Form submits. The click action fires onClick only, as the native one does.
          document.dispatchEvent(
            new CustomEvent('submitForm', { detail: { buttonComponentId: id, buttonModuleId: moduleId } })
          );
          fireEvent('onClick');
        }}
        onMouseEnter={() => fireEvent('onHover')}
      >
        {properties.loadingState ? (
          <span className="tw-h-4 tw-w-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-current tw-border-t-transparent" />
        ) : null}
        {String(properties.text ?? '')}
      </Button>
    </Shell>
  );
};

export default withControlState(ShadButton);
