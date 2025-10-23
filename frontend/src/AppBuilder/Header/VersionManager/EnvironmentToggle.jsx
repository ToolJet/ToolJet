import React from 'react';
import cx from 'classnames';
import { capitalize } from 'lodash';

const EnvironmentToggle = ({ environments, selectedEnvironment, onEnvironmentChange, disabled = false }) => {
  return (
    <div className="environment-toggle" style={{ padding: '8px' }}>
      <div
        className="d-flex align-items-center"
        style={{
          backgroundColor: 'var(--slate3)',
          borderRadius: '6px',
          padding: '2px',
          gap: '4px',
        }}
      >
        {environments?.map((env) => {
          const isSelected = selectedEnvironment?.id === env.id;
          return (
            <button
              key={env.id}
              className={cx('flex-grow-1 btn btn-sm tj-text-xsm', {
                'disabled-action-tooltip': disabled,
              })}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                backgroundColor: isSelected ? 'white' : 'transparent',
                color: isSelected ? 'var(--text-default)' : 'var(--text-placeholder)',
                fontWeight: isSelected ? 500 : 400,
                transition: 'all 0.2s ease',
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: isSelected ? '0px 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
              }}
              onClick={() => !disabled && onEnvironmentChange(env)}
              disabled={disabled}
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
