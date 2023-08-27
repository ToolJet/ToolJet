import React from 'react';

function OnBoardingInput({
  formData,
  setFormData,
  setPage,
  fieldType,
  setEmailError,
  placeholder,
  emailError = false,
  autoFocus = false,
  dataCy = '',
}) {
  return (
    <div className="wrap-onboard-input">
      <input
        defaultValue={formData?.[fieldType]}
        placeholder={placeholder}
        className="onboard-input"
        autoFocus={autoFocus} //update logic if more fields are added
        maxLength={(fieldType == 'workspace' || fieldType == 'companyName') && 25}
        onKeyUp={(e) => {
          fieldType == 'email' && setEmailError(false);
          setFormData({ ...formData, [fieldType]: e.target.value });
          if (e.key === 'Enter' && formData.companyName.trim().length !== 0) {
            setPage((currPage) => currPage + 1);
          }
        }}
        style={{ marginBottom: fieldType == 'email' && '0px' }}
        autoComplete="off"
        data-cy={dataCy}
      />
      {emailError && (
        <span className="tj-text-input-error-state" data-cy="email-error-message">
          Invalid email
        </span>
      )}
    </div>
  );
}

export default OnBoardingInput;
