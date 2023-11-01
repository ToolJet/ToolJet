import React, { useState } from 'react';
import CustomInput from '@/_ui/CustomInput';

function Slider1({ value, onChange, component }) {
  const [sliderValue, setSliderValue] = useState(value ? value : 33); // Initial value of the slider

  const handleSliderChange = (event) => {
    setSliderValue(event.target.value);
    onChange(`{{${event.target.value}}}`);
  };
  const onInputChange = (e) => {
    setSliderValue(e.target.value);
    onChange(`{{${e.target.value}}}`);
  };

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
      />
    </div>
  );
}

export default Slider1;
