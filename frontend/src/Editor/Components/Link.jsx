import React, { useRef } from 'react';
import { resolveWidgetFieldValue } from '@/_helpers/utils';

export const Link = ({ height, properties, styles, fireEvent, registerAction, currentState }) => {
  const { linkTarget, linkText, targetType, hidden } = properties;
  const { textColor, textSize, underline } = styles;
  const clickRef = useRef();

  const parsedHidden = typeof hidden !== 'boolean' ? resolveWidgetFieldValue(hidden, currentState) : hidden;

  const computedStyles = {
    fontSize: textSize,
    display: parsedHidden ? 'none' : '',
    height,
  };

  registerAction('click', async function () {
    clickRef.current.click();
  });

  return (
    <div className={`link-widget ${underline}`} style={computedStyles}>
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
        ref={clickRef}
      >
        {linkText}
      </a>
    </div>
  );
};
