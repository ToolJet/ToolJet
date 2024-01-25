import React, { useState } from 'react';
import CustomInput from '@/_ui/CustomInput';
import debounce from 'lodash/debounce';

function Slider1({ value, onChange, component }) {
  const [sliderValue, setSliderValue] = useState(value ? value : 33); // Initial value of the slider

  const handleSliderChange = (event) => {
    setSliderValue(event.target.value);
    onChange(`{{${event.target.value}}}`);
  };

  // Debounce function to handle input changes
  const onInputChange = debounce((e) => {
    let inputValue = parseInt(e.target.value, 10) || 0;
    inputValue = Math.min(inputValue, 100);
    setSliderValue(inputValue);
    onChange(`{{${inputValue}}}`);
  }, 300);

  return (
    <div className="d-flex flex-column" style={{ width: '142px' }}>
      <CustomInput
        disabled={component.component.definition.styles.auto.value == true}
        value={sliderValue}
        staticText="% of the field"
        onInputChange={onInputChange}
      />
      <input
        type="range"
        min="0"
        max="100"
        disabled={component.component.definition.styles.auto.value == true}
        value={sliderValue}
        onChange={handleSliderChange}
        style={{ margin: '4px' }}
      />
    </div>
  );
}

export default Slider1;
