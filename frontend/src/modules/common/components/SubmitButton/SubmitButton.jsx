import React from 'react';
import EnterIcon from './resources/images/enter-icon.svg';
import Spinner from './components/Spinner';
import './resources/styles/submit-button.styles.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import cx from 'classnames';

const SubmitButton = ({
  onClick = () => {},
  disabled,
  buttonText,
  dataCy = (buttonText || 'Get started for free').toLowerCase().replace(/\s+/g, '-'),
  isLoading,
  darkMode,
  isSignUpButtonDisabled,
  className = '',
}) => {
  const classes = cx('submit-button', {
    disabled: disabled,
    ...(className ? { [className]: true } : {}),
  });
  return (
    <div className="row">
      <ButtonSolid
        type="submit"
        className={classes}
        onClick={onClick}
        disabled={disabled || isLoading}
        data-cy={`${dataCy}-button`}
      >
        {isLoading ? (
          <div className="spinner-center">
            <Spinner />
          </div>
        ) : (
          <>
            <span className="button-text">{buttonText || 'Get started for free'}</span>
            <EnterIcon />
          </>
        )}
      </ButtonSolid>
    </div>
  );
};

export default SubmitButton;
