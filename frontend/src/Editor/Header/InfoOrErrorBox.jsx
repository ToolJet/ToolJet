import React from 'react';

function InfoOrErrorBox({ active, message, isError, isWarning, darkMode, additionalClassName }) {
  const color = isError ? 'var(--light-tomato-10, #DB4324)' : isWarning ? '#ED5F00' : 'var(--slate-light-10, #7E868C)';
  const boxStyle = {
    display: active ? 'flex' : 'none',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '2px',
    width: '200px',
    height: '32px',
    borderRadius: '6px',
    border: `1px solid ${darkMode ? 'var(--dark-border-color, #2D3748)' : 'var(--light-border-color, #E0E0E0)'}`,
    background: darkMode ? 'var(--dark-bg-01, #1E293B)' : 'var(--base-white-00, #FFF)',
    boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
    color: color,
    zIndex: 10000,
    position: 'absolute',
    fontFamily: 'IBM Plex Sans',
    fontSize: '10px',
    fontStyle: 'normal',
    fontWeight: 500,
    lineHeight: '16px',
    padding: '2px 8px',
    ...(additionalClassName && {
      ...additionalClassName.split(' ').reduce((acc, cls) => ({ ...acc, [cls]: true }), {}),
    }),
  };

  return (
    <div className={additionalClassName} style={boxStyle}>
      {message && <div>{message}</div>}
    </div>
  );
}

export default InfoOrErrorBox;
