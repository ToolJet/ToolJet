import React from 'react';

export const Link = ({ properties, styles, fireEvent, registerAction }) => {
  const { linkTarget, linkText, targetType } = properties;
  const { textColor, textSize, textAlign, underline, disabledState, visibility } = styles;
  const computedStyles = {
    fontSize: textSize,
    textAlign,
    display: visibility ? '' : 'none',
  };

  registerAction('click', async function () {
    fireEvent('onClick');
  });

  return (
    <div data-disabled={disabledState} className={`link-widget ${underline}`} style={computedStyles}>
      <a
        href={linkTarget}
        target={targetType === 'new' && '_blank'}
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
        onMouseOver={(event) => {
          event.stopPropagation();
          fireEvent('onHover');
        }}
        style={{ color: textColor }}
      >
        {linkText}
      </a>
    </div>
  );
};
