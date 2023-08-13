import React from 'react';

function InfoOrErrorBox({ active, message, isError }) {
  const boxStyle = {
    display: active ? 'flex' : 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '2px',
    flex: '1 0 0',
    color: isError ? 'red' : 'green', // You can adjust the color based on error or info
  };

  return <div style={boxStyle}>{message && <div>{message}</div>}</div>;
}

export default InfoOrErrorBox;
