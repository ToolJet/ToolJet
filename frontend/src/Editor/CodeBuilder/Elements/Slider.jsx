import React, { useState } from 'react';
import CustomInput from '@/_ui/CustomInput';

function Slider1({ value, onChange, disabled }) {
  const [sliderValue, setSliderValue] = useState(value ? value : 33); // Initial value of the slider

  const handleSliderChange = (event) => {
    setSliderValue(event.target.value);
    onChange(`{{${event.target.value}}}`);
  };

  const onInputChange = (e) => {
    let inputValue = parseInt(e.target.value, 10) || 0; // Parse the value as an integer, default to 0 if parsing fails
    inputValue = Math.min(inputValue, 100);
    setSliderValue(inputValue);
    onChange(`{{${inputValue}}}`);
  };
  return (
    <div className="d-flex flex-column" style={{ width: '142px' }}>
      <CustomInput disabled={disabled} value={sliderValue} staticText="% of the field" onInputChange={onInputChange} />
      <input type="range" min="0" max="100" disabled={disabled} value={sliderValue} onChange={handleSliderChange} />
    </div>
  );
}

export default Slider1;
