import React from 'react';

function OnBoardingInput({ formData, setFormData, setButtonState, setPage }) {
  return (
    <input
      defaultValue={formData.companyName}
      placeholder="Enter your company name"
      className="onboard-input"
      maxLength="25"
      onKeyUp={(e) => {
        setFormData({ ...formData, companyName: e.target.value });
        if (e.target.value !== '') setButtonState(false);
        else setButtonState(true);
        if (e.key === 'Enter' && formData.companyName.trim().length !== 0) {
          setPage((currPage) => currPage + 1);
        }
      }}
    />
  );
}

export default OnBoardingInput;
