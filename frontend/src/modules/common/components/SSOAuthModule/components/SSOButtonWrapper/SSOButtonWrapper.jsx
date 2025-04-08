import React from 'react';
import './resources/styles/sso-button-wrapper.styles.scss';

const SSOButtonWrapper = ({ onClick, icon, text, dataCy }) => {
  return (
    <div className="sso-button-wrapper" data-cy={dataCy}>
      <button onClick={onClick} className="sso-button">
        <img src={icon} alt={`${text} icon`} className="sso-icon" />
        <span className="sso-text">{text}</span>
      </button>
    </div>
  );
};

export default SSOButtonWrapper;
