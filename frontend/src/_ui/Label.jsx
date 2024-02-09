import React from 'react';

function Label({ label, width, labelRef, darkMode, color, defaultAlignment, direction, auto, isMandatory }) {
  console.log('label---');
  return (
    <div>
      {label && (width > 0 || auto) && (
        <label
          ref={labelRef}
          style={{
            color: darkMode && color === '#11181C' ? '#fff' : color,
            width: label?.length === 0 ? '0%' : auto ? 'auto' : defaultAlignment === 'side' ? `${width}%` : '100%',
            maxWidth: auto && defaultAlignment === 'side' ? '70%' : '100%',
            marginRight: label?.length > 0 && direction === 'left' && defaultAlignment === 'side' ? '9px' : '',
            marginLeft: label?.length > 0 && direction === 'right' && defaultAlignment === 'side' ? '9px' : '',
            display: 'flex',
            fontWeight: 500,
            justifyContent: direction == 'right' ? 'flex-end' : 'flex-start',
            fontSize: '12px',
            height: '20px',
          }}
        >
          <span
            style={{
              overflow: label?.length > 18 && 'hidden', // Hide any content that overflows the box
              textOverflow: 'ellipsis', // Display ellipsis for overflowed content
              whiteSpace: 'nowrap',
              display: 'block',
            }}
          >
            {label}
          </span>{' '}
          <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
        </label>
      )}
    </div>
  );
}

export default Label;
