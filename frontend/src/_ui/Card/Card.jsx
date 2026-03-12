import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { allSvgs } from '@tooljet/plugins/client';
import AiBanner from '@/_ui/AiBanner';
import LegacyBanner from '@/_ui/LegacyBanner';

const Card = ({
  title,
  src,
  handleClick,
  height = 50,
  width = 50,
  usePluginIcon = false,
  className,
  cardClassName,
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
        className={`card ${cardClassName}`}
        role="button"
        onClick={(e) => {
          e.preventDefault();
          handleClick && handleClick();
        }}
        data-cy={`data-source-${String(title).toLocaleLowerCase()}`}
        style={{ position: 'relative' }}
      >
        {tags && tags.includes('legacy') && <LegacyBanner />}
        <div className="card-body">
          {tags && tags.includes('AI') && <AiBanner className="card-tag" />}
          <center style={{ marginTop: tags.includes('AI') ? '0px' : '15px' }}>
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
