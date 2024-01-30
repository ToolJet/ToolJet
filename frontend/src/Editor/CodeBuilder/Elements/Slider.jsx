import React, { useState, useEffect } from 'react';
import CustomInput from '@/_ui/CustomInput';
// eslint-disable-next-line import/no-unresolved
import * as Slider from '@radix-ui/react-slider';
import './Slider.scss';

function Slider1({ value, onChange, component }) {
  console.log('type', typeof value);
  const [sliderValue, setSliderValue] = useState(value ? value : 33); // Initial value of the slider

  useEffect(() => {
    setSliderValue(value);
  }, [value]);

  useEffect(() => {
    console.log('sliderValue--', sliderValue);
  }, [sliderValue]);

  const handleSliderChange = (value) => {
    console.log('Slider Value Changed:', value);
    setSliderValue(value);
    onChange(value);
  };

  // Throttle function to handle input changes
  const onInputChange = (e) => {
    let inputValue = parseInt(e.target.value, 10) || 0;
    inputValue = Math.min(inputValue, 100);
    setSliderValue(inputValue);
    onChange(inputValue);
  };

  return (
    <div className="d-flex flex-column" style={{ width: '142px' }}>
      <CustomInput
        disabled={component.component.definition.styles.auto.value == true}
        value={sliderValue}
        staticText="% of the field"
        onInputChange={onInputChange}
      />

      <div style={{ margin: '4px' }}>
        <Slider.Root
          className="SliderRoot"
          defaultValue={[33]}
          min={0}
          max={100}
          step={1}
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          disabled={component.component.definition.styles.auto.value == true}
        >
          <Slider.Track className="SliderTrack">
            <Slider.Range className="SliderRange" />
          </Slider.Track>
          <Slider.Thumb className="SliderThumb" aria-label="Volume" />
        </Slider.Root>
      </div>
    </div>
  );
}

export default Slider1;
