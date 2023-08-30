import React, { useState } from 'react';
import { SketchPicker } from 'react-color';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

export const Color = ({
  value,
  onChange,
  forceCodeBox,
  hideFx = false,
  pickerStyle = {},
  cyLabel,
  customStyle = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const coverStyles = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };
  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const outerStyles = {
    width: '142px',
    height: '32px',
    border: !isHovering ? `1px solid var(--slate7)` : `1px solid var(--slate8)`,
    borderRadius: ' 6px',
    display: 'flex',
    paddingLeft: '4px',
    alignItems: 'center',
    gap: '4px',
    background: showPicker ? 'var(--indigo2)' : !isHovering ? 'var(--slate1)' : 'var(--slate4)',
    outline: showPicker && '1px solid var(--indigo9)',
    boxShadow: showPicker && '0px 0px 0px 1px #C6D4F9',
  };

  const decimalToHex = (alpha) => {
    let aHex = Math.round(255 * alpha).toString(16);
    return alpha === 0 ? '00' : aHex.length < 2 ? `0${aHex}` : aHex;
  };
  const handleColorChange = (color) => {
    const hexCode = `${color.hex}${decimalToHex(color?.rgb?.a ?? 1.0)}`;
    onChange(hexCode);
  };
  const eventPopover = () => {
    return (
      <Popover className={`${darkMode && ' dark-theme'}`}>
        <Popover.Body className={customStyle && 'boxshadow-picker'}>
          <>
            {showPicker && (
              <div>
                <div style={coverStyles} onClick={() => setShowPicker(false)} />
                <div style={pickerStyle}>
                  <SketchPicker
                    onFocus={() => setShowPicker(true)}
                    color={value}
                    onChangeComplete={handleColorChange}
                    style={{ bottom: 0 }}
                  />
                </div>
              </div>
            )}
          </>
        </Popover.Body>
      </Popover>
    );
  };
  return (
    <div className="row fx-container" data-cy="color-picker-parent">
      <div className="col">
        <div className="field">
          <OverlayTrigger
            onToggle={(showPicker) => {
              setShowPicker(showPicker);
            }}
            show={showPicker}
            trigger="click"
            placement={'left'}
            rootClose={true}
            overlay={eventPopover()}
          >
            <div
              className="row mx-0 color-picker-input d-flex"
              onClick={() => setShowPicker(true)}
              data-cy={`${String(cyLabel)}-picker`}
              style={outerStyles}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div
                className="col-auto"
                style={{
                  float: 'right',
                  width: '24px',
                  height: '24px',
                  borderRadius: ' 6px',
                  border: `1px solid var(--slate7, #D7DBDF)`,
                  boxShadow: `0px 1px 2px 0px rgba(16, 24, 40, 0.05)`,
                  backgroundColor: value,
                }}
                data-cy={`${String(cyLabel)}-picker-icon`}
              ></div>

              <div className="col tj-text-xsm p-0 color-slate12" data-cy={`${String(cyLabel)}-value`}>
                {value}
              </div>
            </div>
          </OverlayTrigger>
        </div>
      </div>
    </div>
  );
};
