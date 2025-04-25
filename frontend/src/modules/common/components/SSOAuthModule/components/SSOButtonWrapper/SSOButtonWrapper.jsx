import React from 'react';
import './resources/styles/sso-button-wrapper.styles.scss';

const SSOButtonWrapper = ({ onClick, icon, text, dataCy }) => {
  return (
    <div className="sso-button-wrapper">
      <button onClick={onClick} className="sso-button" data-cy={dataCy}>
        <img src={icon} alt={`${text} icon`} className="sso-icon" />
        <span className="sso-text" data-cy={`${dataCy}-text`}>
          {text}
        </span>
      </button>
    </div>
  );
};

export default SSOButtonWrapper;
