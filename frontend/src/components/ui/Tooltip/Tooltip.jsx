import React from 'react';
import PropTypes from 'prop-types';
import { cn } from '@/lib/utils';
import { Arrow } from './TooltipUtils/Arrow';
import { arrowVariants, tooltipVariants } from './TooltipUtils/TooltipUtils';

const Tooltip = ({ tooltipLabel, supportingText, theme, arrow, children, width, className }) => {
  return (
    <div className={cn(arrowVariants({ arrow }), className)}>
      <div
        className={cn(
          tooltipVariants({ arrow, theme }),
          `${
            supportingText && 'tw-max-w-[320px]'
          } tw-flex tw-flex-col tw-py-[8px] tw-px-[12px] tw-items-start tw-self-stretch tw-rounded-[8px] tw-shadow-[0px_12px_16px_-4px_rgba(16,24,40,0.08),0px_4px_6px_-2px_rgba(16,24,40,0.03)]`
        )}
        style={{ width: width }}
      >
        {children && children}
        {!children && (
          <div
            className={`tw-text-[12px] ${
              supportingText ? 'tw-font-medium tw-leading-[18px]' : 'tw-text-center tw-font-normal tw-leading-[20px]'
            }
            ${(theme === 'light' && 'tw-text-[#11181C]') || (theme === 'dark' && 'tw-text-[#FFFFFF]')}`}
          >
            {tooltipLabel}
          </div>
        )}
        {supportingText && (
          <div
            className={`tw-text-[12px]/[20px] tw-font-normal ${
              (theme === 'light' && 'tw-text-[#687076]') || (theme === 'dark' && 'tw-text-[#FFFFFF]')
            }`}
          >
            {supportingText}
          </div>
        )}
      </div>
      {arrow && <Arrow side={arrow} theme={theme} />}
    </div>
  );
};

export default Tooltip;

Tooltip.propTypes = {
  tooltipLabel: PropTypes.string.isRequired,
  supportingText: PropTypes.string,
  theme: PropTypes.oneOf(['light', 'dark']),
  arrow: PropTypes.oneOf(['Bottom Center', 'Bottom Left', 'Bottom Right', 'Top Center', 'Left', 'Right']),
  children: PropTypes.node,
  width: PropTypes.string,
  className: PropTypes.string,
};

Tooltip.defaultProps = {
  supportingText: '',
  theme: 'light',
  arrow: '',
  children: null,
  width: '',
  className: '',
};
