import React from 'react';
function Label({ label, width, labelRef, darkMode, color, defaultAlignment, direction, auto, isMandatory, _width }) {
  return (
    <>
      {label && (width > 0 || auto) && (
        <label
          ref={labelRef}
          style={{
            color: darkMode && color === '#11181C' ? '#fff' : color,
            width: label?.length === 0 ? '0%' : auto ? 'auto' : defaultAlignment === 'side' ? `${_width}%` : '100%',
            maxWidth: defaultAlignment === 'side' ? '70%' : '100%',
            marginRight: label?.length > 0 && direction === 'left' && defaultAlignment === 'side' ? '12px' : '',
            marginLeft: label?.length > 0 && direction === 'right' && defaultAlignment === 'side' ? '12px' : '',
            display: 'flex',
            fontWeight: 500,
            justifyContent: direction == 'right' ? 'flex-end' : 'flex-start',
            fontSize: '12px',
            height: defaultAlignment === 'top' && '20px',
          }}
        >
          <p
            style={{
              position: 'relative',
              overflow: label?.length > 18 && 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              display: 'block',
              margin: '0px',
            }}
          >
            {label}
            {isMandatory && <span style={{ color: '#DB4324', position: 'absolute' }}>*</span>}
          </p>
        </label>
      )}
    </>
  );
}

export default Label;
