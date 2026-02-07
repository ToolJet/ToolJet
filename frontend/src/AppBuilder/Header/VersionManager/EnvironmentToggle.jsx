import React from 'react';
import cx from 'classnames';
import { capitalize } from 'lodash';
import '@/AppBuilder/Header/VersionManager/environment-toggle.scss';

const EnvironmentToggle = ({ environments, selectedEnvironment, onEnvironmentChange, disabled = false }) => {
  return (
    <div className="environment-toggle" data-cy="environment-toggle">
      <div className="environment-toggle__bar d-flex align-items-center">
        {environments?.map((env) => {
          const isSelected = selectedEnvironment?.id === env.id;
          return (
            <button
              key={env.id}
              className={cx('flex-grow-1 btn btn-sm tj-text-xsm environment-toggle__btn', {
                'disabled-action-tooltip': disabled,
                selected: isSelected,
                disabled: disabled,
              })}
              onClick={() => !disabled && onEnvironmentChange(env)}
              disabled={disabled}
              data-cy={`${env.name}-environment-name`}
            >
              {capitalize(env.name)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EnvironmentToggle;
