import React from 'react';
const TermsAndPrivacyInfo = ({ className }) => {
  return (
    <div className={`terms-and-privacy-info ${className || ''}`}>
      <p className="onboard d-block" data-cy="signup-terms-helper">
        By signing up you are agreeing to the
        <br />
        <span>
          <a href="https://www.tooljet.com/terms" data-cy="terms-of-service-link">
            Terms of Service{' '}
          </a>
          &
          <a href="https://www.tooljet.com/privacy" data-cy="privacy-policy-link">
            {' '}
            Privacy Policy
          </a>
        </span>
      </p>
    </div>
  );
};

export default TermsAndPrivacyInfo;
