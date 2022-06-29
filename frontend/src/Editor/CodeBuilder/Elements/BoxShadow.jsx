import React, { useState, useEffect } from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import Slider from 'rc-slider';
import { Color } from './Color';
import FxButton from './FxButton';

export const BoxShadow = ({ value, onChange, forceCodeBox }) => {
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

  const [boxShadow, setBoxShadow] = useState(() => computeBoxShadow());

  const darkMode = localStorage.getItem('darkMode') === 'true';

  const colorPickerStyle = {
    position: 'absolute',
    bottom: '260px',
  };

  useEffect(() => {
    onChange(Object.values(boxShadow).join('px '));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxShadow]);

  function computeBoxShadow() {
    if (value) {
      const valueArr = value.split('px ');
      return { X: valueArr[0], Y: valueArr[1], Blur: valueArr[2], Spread: valueArr[3], Color: valueArr[4] };
    }
    return defaultValue;
  }

  const setBoxShadowValue = (item, value) => {
    const newValue = { ...boxShadow };
    newValue[item] = value;
    setBoxShadow(newValue);
  };

  const clearBoxShadow = () => setBoxShadow(defaultValue);

  const renderSlider = (item, value) => {
    return (
      <div className="range-slider">
        {
          <Slider
            min={0}
            max={20}
            defaultValue={5}
            value={value}
            onChange={(updatedValue) => setBoxShadowValue(item, updatedValue)}
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
        data-cy="popover-card"
      >
        <Popover.Content>
          <>
            {input.map((item) => (
              <div className="row" key={item}>
                <div className="col">
                  <div className="input-icon input-group mb-3">
                    <small className="input-icon-addon" style={popoverLabelstyle}>
                      {item}
                    </small>
                    <input
                      type="text"
                      value={boxShadow[item]}
                      className="form-control"
                      placeholder="10"
                      style={popoverInputstyle}
                      onChange={(e) => setBoxShadowValue(item, e.target.value)}
                    />
                    <span className="input-group-text">px</span>
                  </div>
                </div>
                <div className="col my-2 py-1">{renderSlider(item, boxShadow[item])}</div>
              </div>
            ))}
            <Color
              onChange={(hexCode) => setBoxShadowValue('Color', hexCode)}
              value={boxShadow.Color}
              hideFx
              pickerStyle={colorPickerStyle}
            />
            <button className="btn btn-sm btn-outline-danger mt-2 col" onClick={clearBoxShadow}>
              Clear
            </button>
          </>
        </Popover.Content>
      </Popover>
    );
  };

  return (
    <div className="row fx-container">
      <div className="col">
        <div className="field mb-2">
          <OverlayTrigger trigger="click" placement={'left'} rootClose={true} overlay={eventPopover()}>
            <div className="row mx-0 form-control color-picker-input">
              <div
                className="col-auto"
                style={{
                  float: 'right',
                  width: '20px',
                  height: '20px',
                  backgroundColor: boxShadow.Color,
                  border: `0.25px solid ${['#ffffff', '#fff', '#1f2936'].includes(boxShadow.Color) && '#c5c8c9'}`,
                }}
              ></div>
              <small className="col p-0">{value}</small>
            </div>
          </OverlayTrigger>
        </div>
      </div>
      <div className="col-auto pt-0 style-fx fx-common">
        <FxButton active={false} onPress={forceCodeBox} />
      </div>
    </div>
  );
};
