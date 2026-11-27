import React from 'react';
import { capitalize } from 'lodash';
import cx from 'classnames';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './environment-toggle.scss';

export default function EnvironmentSwitcherContent({
  environmentsWithMeta = [],
  selectedEnvironment,
  onEnvironmentChange,
}) {
  const handleEnvironmentClick = ({ environment, disabled }) => {
    if (!disabled) onEnvironmentChange(environment);
  };
  if (!environmentsWithMeta.length) {
    return null;
  }

  return (
    <div className="environment-toggle">
      <div className="environment-toggle__bar d-flex align-items-center">
        {environmentsWithMeta.map(({ environment, disabled, tooltipMessage, showTooltip, showEnterpriseIcon }) => {
          const isSelected = selectedEnvironment?.id === environment.id;

          const btnClass = cx('flex-grow-1 btn btn-sm tj-text-xsm environment-toggle__btn', {
            selected: isSelected,
            disabled: disabled,
          });

          const button = (
            <button
              className={btnClass}
              onClick={() => handleEnvironmentClick({ environment, disabled })}
              disabled={disabled}
              key={environment.id}
              data-cy={`${environment.name}-environment-name`}
            >
              {capitalize(environment.name)}
              {showEnterpriseIcon && <SolidIcon name="enterprisesmall" />}
            </button>
          );

          if (!showTooltip) {
            return <React.Fragment key={environment.id}>{button}</React.Fragment>;
          }

          return (
            <ToolTip key={environment.id} message={tooltipMessage} placement="bottom" show={showTooltip}>
              <div>{button}</div>
            </ToolTip>
          );
        })}
      </div>
    </div>
  );
}
