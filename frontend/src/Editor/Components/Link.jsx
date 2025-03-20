import React, { useRef, useEffect, useState } from 'react';
import cx from 'classnames';

export const Link = ({ height, properties, styles, fireEvent, setExposedVariable, dataCy }) => {
  const { linkTarget, targetType } = properties;
  const [linkText, setLinkText] = useState(properties.linkText);
  console.log({ linkText });
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

    setExposedVariable('setLinkText', async function (text) {
      setExposedVariable('linkText', text);
      setLinkText(text);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log({ linkText });
    setExposedVariable('linkText', linkText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkText]);

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
