import React, { useState, useEffect } from 'react';
import CustomInput from '@/_ui/CustomInput';
import throttle from 'lodash/throttle';

function Slider1({ value, onChange, component }) {
  const [sliderValue, setSliderValue] = useState(value ? value : 33); // Initial value of the slider

  const handleSliderChange = (event) => {
    setSliderValue(event.target.value);
    onChange(`{{${event.target.value}}}`);
  };

  // Throttle function to handle input changes
  const onInputChange = throttle((e) => {
    let inputValue = parseInt(e.target.value, 10) || 0;
    inputValue = Math.min(inputValue, 100);
    setSliderValue(inputValue);
    onChange(`{{${inputValue}}}`);
  }, 300);

  useEffect(() => {
    return () => {
      // Clear the throttle timeout when the component unmounts
      onInputChange.cancel();
    };
  }, [onInputChange]);

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
