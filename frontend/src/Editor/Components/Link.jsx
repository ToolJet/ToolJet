import React, { useRef } from 'react';
import cx from 'classnames';
import MUILink from '@mui/material/Link';
import config from 'config';

export const Link = ({ height, properties, styles, fireEvent, registerAction, dataCy }) => {
  const { linkTarget, linkText, targetType } = properties;
  const { textColor, textSize, underline, visibility, boxShadow } = styles;
  const clickRef = useRef();

  const computedStyles = {
    fontSize: textSize,
    height,
    boxShadow,
  };

  registerAction(
    'click',
    async function () {
      clickRef.current.click();
    },
    []
  );
  return (
    <>
      {config.UI_LIB === 'tooljet' && (
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
      )}
      {config.UI_LIB === 'mui' && (
        <div
          className={cx('link-widget', { 'd-none': !visibility }, `${underline}`)}
          style={computedStyles}
          data-cy={dataCy}
        >
          <MUILink
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
          </MUILink>
        </div>
      )}
    </>
  );
};
