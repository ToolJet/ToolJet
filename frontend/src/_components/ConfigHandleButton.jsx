import React from 'react';
import { ToolTip } from '@/_components/ToolTip';
import './_styles/config-handle-button.scss';

const ConfigHandleButton = ({
  message = '',
  show = false,
  className = '',
  customStyles = {},
  children = null,
  onClick = () => {},
  dataCy = '',
}) => {
  return (
    <span className={`config-handle-button ${className}`}>
      <ToolTip message={message} show={show}>
        <button
          style={{
            background: 'var(--background-inverse)',
            color: 'var(--text-inverse)',
            ...customStyles,
          }}
          className="badge text-truncate"
          onClick={onClick}
          data-cy={dataCy}
        >
          {children}
        </button>
      </ToolTip>
    </span>
  );
};

export default ConfigHandleButton;
