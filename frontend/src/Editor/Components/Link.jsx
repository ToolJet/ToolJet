import React, { useRef, useEffect } from 'react';
import cx from 'classnames';

export const Link = ({ height, properties, styles, fireEvent, setExposedVariable, dataCy }) => {
  const { linkTarget, linkText, targetType } = properties;
  const { textColor, textSize, underline, visibility, boxShadow } = styles;
  const clickRef = useRef();

  const computedStyles = {
    fontSize: textSize,
    height,
    boxShadow,
  };

  useEffect(() => {
    setExposedVariable('click', async function () {
      clickRef.current.click();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={cx('link-widget', { 'd-none': !visibility }, `${underline}`)}
      style={computedStyles}
      data-cy={dataCy}
    >
      <a
        {...(linkTarget != '' ? { href: linkTarget } : {})}
        target={targetType === 'new' && '_blank'}
        onClick={(event) => {
          event.stopPropagation();
          fireEvent('onClick');
        }}
        onMouseOver={() => {
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
