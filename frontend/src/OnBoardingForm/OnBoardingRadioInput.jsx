import React from 'react';

function OnBoardingRadioInput(props) {
  const { formData, setFormData, field, fieldType, index } = props;
  const className = 'onboard-input-radio-focus';

  const handleTabKey = (event) => {
    if (event.key === 'Tab' && index !== null) {
      let lastFocus = document.getElementById(`custom-radio-${index}`);
      let currentFocus = document.getElementById(`custom-radio-${index + 1}`);

      const elements = document.getElementsByClassName('onboard-input');
      const totoalChoices = elements?.length;

      const removeSelections = () => {
        lastFocus?.classList?.remove(className);
        currentFocus?.classList?.remove(className);
      };

      const activeElement = document.activeElement;
      if (!activeElement.classList.contains('onboard-input')) {
        removeSelections();
      }

      if (currentFocus && lastFocus) {
        lastFocus.classList.remove(className);
        currentFocus.classList.add(className);
      } else if (currentFocus) {
        currentFocus.classList.add(className);
      } else if (lastFocus && index === totoalChoices - 1) {
        removeSelections();
        const firstChoice = document.getElementById(`custom-radio-0`);
        firstChoice?.classList?.add(className);
      }
    }
  };

  return (
    <label
      id={index !== null ? `custom-radio-${index}` : ''}
      className={`onboard-input ${formData[fieldType] === field && 'onboarding-radio-checked'}`}
    >
      <input
        type="radio"
        name={field}
        value={field}
        checked={formData[fieldType] === field}
        onKeyDown={handleTabKey}
        onChange={(e) => {
          setFormData({ ...formData, [fieldType]: e.target.value });
        }}
        data-cy={`${field.toLowerCase().replace(/\s+/g, '-')}-radio-button`}
      />
      <p data-cy={`${field.toLowerCase().replace(/\s+/g, '-')}-role`}>{field}</p>
    </label>
  );
}

export default OnBoardingRadioInput;
