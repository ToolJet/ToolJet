import React from 'react';

function InfoOrErrorBox({ active, message, isError }) {
  const boxStyle = {
    display: active ? 'flex' : 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '2px',
    width: '200px', // Set the width to 200 pixels
    height: '32px', // Set the height to 32 pixels
    borderRadius: '6px', // Apply the border-radius
    border: '1px solid var(--tomato-03, #FFF0EE)', // Apply the border
    background: 'var(--base-white-00, #FFF)', // Apply the background color
    boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)', // Apply the box-shadow
    color: isError ? 'var(--light-tomato-10, #DB4324)' : 'var(--slate-light-10, #7E868C)', // Apply the text color
    zIndex: 10000,
    position: 'absolute', // You can adjust the position based on your layout
    fontFamily: 'IBM Plex Sans', // Apply the font family
    fontSize: '10px', // Apply the font size
    fontStyle: 'normal', // Apply the font style
    fontWeight: 500, // Apply the font weight
    lineHeight: '16px', // Apply the line height
    padding: '0 8px', // Apply padding
  };

  return <div style={boxStyle}>{message && <div>{message}</div>}</div>;
}

export default InfoOrErrorBox;
