import React from 'react';

function OnBoardingRadioInput(props) {
  const { formData, setFormData, setButtonState, field, fieldType } = props;
  return (
    <label className={`onboard-input ${formData[fieldType] === field && 'onboarding-radio-checked'}`}>
      <input
        type="radio"
        name={field}
        value={field}
        checked={formData[fieldType] === field}
        onChange={(e) => {
          setFormData({ ...formData, [fieldType]: e.target.value });
          setButtonState(false);
        }}
      />
      <p>{field}</p>
    </label>
  );
}

export default OnBoardingRadioInput;
