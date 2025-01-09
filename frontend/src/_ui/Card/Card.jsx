import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { allSvgs } from '@tooljet/plugins/client';
import AiBanner from '@/_ui/AiBanner';

const Card = ({
  title,
  src,
  handleClick,
  height = 50,
  width = 50,
  usePluginIcon = false,
  className,
  titleClassName,
  actionButton,
  darkMode,
  tags = [],
}) => {
  const DisplayIcon = ({ src }) => {
    if (typeof src !== 'string') return;

    if (usePluginIcon) {
      //Fetch darkMode svgs

      if (darkMode) {
        const darkSrc = `${src}Dark`;
        if (allSvgs[darkSrc]) {
          src = darkSrc;
        }
      }
      const Icon = allSvgs[src];
      return <Icon style={{ height, width }} className="card-icon" />;
    }
    return <img src={src} width={width} height={height} alt={title} className="card-icon" />;
  };

  return (
    <div style={{ height: '112px', width: '164px' }} className={`col-md-2  mb-4 ${className}`}>
      <div
        className="card"
        role="button"
        onClick={(e) => {
          e.preventDefault();
          handleClick && handleClick();
        }}
        data-cy={`data-source-${String(title).toLocaleLowerCase()}`}
      >
        <div className="card-body">
          {tags && tags.includes('AI') && <AiBanner className="card-tag" />}
          <center style={{ marginTop: tags.length > 0 ? '0px' : '15px' }}>
            <DisplayIcon src={src} />
            <br></br>
            <br></br>
            <span className={titleClassName}>{title}</span>
            {actionButton}
          </center>
        </div>
      </div>
    </div>
  );
};

export default Card;
