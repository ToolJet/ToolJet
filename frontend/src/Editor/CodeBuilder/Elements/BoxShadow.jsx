import React, { useState, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import Slider from 'rc-slider';
import { Color } from './Color';
import FxButton from './FxButton';

export const BoxShadow = ({ value, onChange, forceCodeBox, cyLabel }) => {
  const defaultValue = { X: 0, Y: 0, Blur: 0, Spread: 0, Color: '#00000040' };

  const popoverLabelstyle = {
    display: 'flex',
    zIndex: 4,
    fontSize: '87.7%',
    minWidth: '3.5rem',
  };

  const popoverInputstyle = {
    paddingLeft: '3.5rem',
    paddingRight: '1.5rem',
  };

  const input = ['X', 'Y', 'Blur', 'Spread'];

  const [boxShadow, setBoxShadow] = useState(defaultValue);
  const [debouncedShadow, setDebouncedShadow] = useState(defaultValue);

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const colorPickerStyle = {
    position: 'absolute',
    bottom: '260px',
  };

  useEffect(() => {
    if (value) {
      const valueArr = value.split('px ');
      const newValue = {
        X: valueArr[0],
        Y: valueArr[1],
        Blur: valueArr[2],
        Spread: valueArr[3],
        Color: valueArr[4],
      };
      setBoxShadow(newValue);
      setDebouncedShadow(newValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (boxShadow !== debouncedShadow) {
      onChange(Object.values(debouncedShadow).join('px '));
      setBoxShadow(debouncedShadow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedShadow]);

  const setBoxShadowValue = (item, value, debounced = false) => {
    const newValue = { ...boxShadow };
    if (item === 'Blur' && value < 0) {
      newValue[item] = 0;
      debounced ? setDebouncedShadow(newValue) : setBoxShadow(newValue);
    } else {
      newValue[item] = value;
      debounced ? setDebouncedShadow(newValue) : setBoxShadow(newValue);
    }
  };

  const clearBoxShadow = () => setDebouncedShadow(defaultValue);

  const renderSlider = (item, value) => {
    return (
      <div className="range-slider">
        {
          <Slider
            min={item === 'Blur' || item === 'Spread' ? 0 : -20}
            max={20}
            defaultValue={0}
            value={value}
            onChange={(updatedValue) => setBoxShadowValue(item, updatedValue)}
            onAfterChange={(updatedValue) => setBoxShadowValue(item, updatedValue, true)}
            trackStyle={{ backgroundColor: '#4D72FA' }}
            railStyle={{ backgroundColor: '#E9E9E9' }}
            handleStyle={{
              backgroundColor: '#4D72FA',
              borderColor: '#4D72FA',
            }}
          />
        }
      </div>
    );
  };

  const eventPopover = () => {
    return (
      <Popover
        id="popover-basic"
        style={{ width: '350px', maxWidth: '350px' }}
        className={`${darkMode && 'popover-dark-themed theme-dark'} shadow`}
      >
        <Popover.Body>
          <>
            {input.map((item) => (
              <div className="row" key={item}>
                <div className="col">
                  <div className="input-icon input-group mb-3">
                    <small
                      className="input-icon-addon"
                      style={popoverLabelstyle}
                      data-cy={`box-shadow-patam-${item.toLowerCase()}-label`}
                    >
                      {item}
                    </small>
                    <input
                      data-cy={`box-shadow-${item.toLowerCase()}-input-field`}
                      type="number"
                      value={boxShadow[item]}
                      className="form-control hide-input-arrows"
                      placeholder="10"
                      style={popoverInputstyle}
                      onChange={(e) => setBoxShadowValue(item, e.target.value, true)}
                    />
                    <span className="input-group-text">px</span>
                  </div>
                </div>
                <div className="col my-2 py-1">{renderSlider(item, boxShadow[item])}</div>
              </div>
            ))}
            <Color
              onChange={(hexCode) => setBoxShadowValue('Color', hexCode, true)}
              value={boxShadow.Color}
              hideFx
              pickerStyle={colorPickerStyle}
              cyLabel={'box-shadow-color'}
            />
            <button
              data-cy={'box-shadow-clear-button'}
              className="btn btn-sm btn-outline-danger mt-2 col"
              onClick={clearBoxShadow}
            >
              Clear
            </button>
          </>
        </Popover.Body>
      </Popover>
    );
  };
  const _value = `#${value.split('#')[1]}`;
  return (
    <div className="row fx-container">
      <div className="col">
        <div className="field">
          <OverlayTrigger trigger="click" placement={'left'} rootClose={true} overlay={eventPopover()}>
            <div
              className="row mx-0 form-control color-picker-input d-flex align-items-center"
              style={{ width: '144px', padding: '5px 8px' }}
              data-cy={`${cyLabel}-picker`}
            >
              <div
                className="col-auto"
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: boxShadow.Color,
                  border: `0.25px solid ${['#ffffff', '#fff', '#1f2936'].includes(boxShadow.Color) && '#c5c8c9'}`,
                  marginRight: '4px',
                }}
                data-cy={`${cyLabel}-picker-icon`}
              ></div>
              <small className="col p-0" data-cy={`${cyLabel}-value`}>
                {_value}
              </small>
            </div>
          </OverlayTrigger>
        </div>
      </div>
    </div>
  );
};
