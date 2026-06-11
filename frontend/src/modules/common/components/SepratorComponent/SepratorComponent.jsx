import React from 'react';
const SepratorComponent = ({ sepratorText = 'OR' }) => {
  return (
    <div className="separator-signup">
      <div className="mt-2 separator" data-cy="onboarding-separator">
        <h2>
          <span data-cy="onboarding-separator-text">{sepratorText}</span>
        </h2>
      </div>
    </div>
  );
};

export default SepratorComponent;
