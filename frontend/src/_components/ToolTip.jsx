import React from 'react';
import PropTypes from 'prop-types';
import OverlayTrigger from 'react-bootstrap/esm/OverlayTrigger';
import Tooltip from 'react-bootstrap/esm/Tooltip';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Tooltip as RocketTooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Rocket/Tooltip/Tooltip';
import { useAppBuilderTooltip } from '@/AppBuilder/_contexts/AppBuilderTooltipContext';

export function ToolTip({
  message,
  children,
  placement = 'top',
  trigger = ['hover', 'focus'],
  delay = { show: 50, hide: 100 },
  show = true,
  tooltipClassName = '',
  ...rest
}) {
  const appBuilderTooltip = useAppBuilderTooltip();
  const useIntentAwareTooltip = appBuilderTooltip && !trigger.includes('click');

  if (!show) {
    return children;
  }
  if (useIntentAwareTooltip) {
    return (
      <RocketTooltip
        delayDuration={appBuilderTooltip.delayDuration}
        onOpenChange={(open) => !open && appBuilderTooltip.markTooltipClosed()}
      >
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent
          side={placement === 'left' || placement === 'right' || placement === 'bottom' ? placement : 'top'}
          sideOffset={7}
          showArrow={false}
          className={`app-builder-tooltip !tw-rounded-[5px] !tw-px-2 !tw-py-[5px] !tw-text-xs !tw-font-normal !tw-leading-4 !tw-shadow-elevation-200 ${tooltipClassName}`}
          style={{ width: rest?.width ?? 'auto', maxWidth: rest?.maxWidth ?? undefined }}
        >
          {message}
        </TooltipContent>
      </RocketTooltip>
    );
  }
  return (
    <OverlayTrigger
      trigger={trigger}
      placement={placement}
      delay={delay}
      popperConfig={rest?.popperConfig}
      overlay={
        <Tooltip
          className={tooltipClassName}
          style={{ width: rest?.width ?? 'auto', maxWidth: rest?.maxWidth ?? undefined }}
        >
          {message}
        </Tooltip>
      }
    >
      {children}
    </OverlayTrigger>
  );
}
ToolTip.propTypes = {
  message: PropTypes.node.isRequired,
  children: PropTypes.object.isRequired,
  placement: PropTypes.string,
  trigger: PropTypes.array,
};
