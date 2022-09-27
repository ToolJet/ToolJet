import React, { useRef } from 'react';
import cx from 'classnames';

export const Link = ({ height, properties, styles, fireEvent, registerAction }) => {
  const { linkTarget, linkText, targetType } = properties;
  const { textColor, textSize, underline, visibility } = styles;
  const clickRef = useRef();

  const computedStyles = {
    fontSize: textSize,
    height,
  };

  registerAction(
    'click',
    async function () {
      clickRef.current.click();
    },
    [clickRef]
  );

  return (
    <div className={cx('link-widget', { 'd-none': !visibility }, `${underline}`)} style={computedStyles}>
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
