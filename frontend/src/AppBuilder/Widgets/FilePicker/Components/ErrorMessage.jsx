import React from 'react';
import PropTypes from 'prop-types';
import Information from '@/_ui/Icon/solidIcons/Information';

const ErrorMessage = ({ message }) => {
  return (
    <div className="file-picker-error-message">
      <span className="error-icon">
        <Information fill="var(--status-error-strong)" width="16" />
      </span>
      <span className="error-text">{message}</span>
    </div>
  );
};

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
};

export default ErrorMessage; 