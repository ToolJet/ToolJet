import React from 'react';

function InfoOrErrorBox({ active, message, isError }) {
  const boxStyle = {
    display: active ? 'flex' : 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '2px',
    width: '200px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid var(--tomato-03, #FFF0EE)',
    background: 'var(--base-white-00, #FFF)',
    boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
    color: isError ? 'var(--light-tomato-10, #DB4324)' : 'var(--slate-light-10, #7E868C)',
    zIndex: 10000,
    position: 'absolute',
    fontFamily: 'IBM Plex Sans',
    fontSize: '10px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '16px',
    padding: '0 8px',
  };

  return <div style={boxStyle}>{message && <div>{message}</div>}</div>;
}

export default InfoOrErrorBox;
