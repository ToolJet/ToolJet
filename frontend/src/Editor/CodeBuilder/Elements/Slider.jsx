import React, { useState, useEffect } from 'react';
import CustomInput from '@/_ui/CustomInput';
// eslint-disable-next-line import/no-unresolved
import * as Slider from '@radix-ui/react-slider';
import './Slider.scss';
import { debounce } from 'lodash';

function Slider1({ value, onChange, component }) {
  const [sliderValue, setSliderValue] = useState(value ? value : 33); // Initial value of the slider

  useEffect(() => {
    setSliderValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component.id]);

  const debouncedOnChange = debounce((value) => {
    onChange(value);
  }, 150);

  const handleSliderChange = (value) => {
    setSliderValue(value);
  };

  // debounce function to handle input changes
  const onInputChange = (e) => {
    let inputValue = parseInt(e.target.value, 10) || 0;
    inputValue = Math.min(inputValue, 100);
    setSliderValue(inputValue);
    debouncedOnChange(inputValue);
  };

  return (
    <div className="d-flex flex-column " style={{ width: '142px', position: 'relative' }}>
      <CustomInput
        disabled={component.component.definition.styles.auto.value}
        value={sliderValue}
        staticText="% of the field"
        onInputChange={onInputChange}
        dataCy="width"
      />
      <div style={{ position: 'absolute', top: '34px' }}>
        <Slider.Root
          className="SliderRoot"
          defaultValue={sliderValue ? [sliderValue] : [33]}
          min={0}
          max={100}
          step={1}
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          onValueCommit={(value) => {
            onChange(value);
          }}
          disabled={component.component.definition.styles.auto.value}
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
