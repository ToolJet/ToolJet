import React from 'react';

export const EmailComponent = ({ prefilledEmail, email, handleChange, emailError, t }) => {
  if (prefilledEmail) {
    return (
      <div className="signup-inputs-wrap">
        <label className="tj-text-input-label" data-cy="email-label">
          Email
        </label>
        <p className="tj-text-input onbaording-disabled-field" data-cy="invited-user-email">
          {prefilledEmail}
        </p>
      </div>
    );
  } else {
    return (
      <div className="signup-password-wrap">
        <label className="tj-text-input-label" data-cy="email-input-label">
          Email address
        </label>
        <input
          onChange={handleChange}
          name="email"
          type="email"
          className="tj-text-input"
          placeholder={t('loginSignupPage.enterWorkEmail', 'Enter your email')}
          style={{ marginBottom: '0px' }}
          value={email || ''}
          data-cy="email-input-field"
          autoComplete="off"
        />
        {emailError && <span className="tj-text-input-error-state">{emailError}</span>}
      </div>
    );
  }
};
