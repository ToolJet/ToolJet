import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { allSvgs } from '@tooljet/plugins/client';

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
}) => {
  const DisplayIcon = ({ src }) => {
    if (typeof src !== 'string') return;

    if (usePluginIcon) {
      const Icon = allSvgs[src];
      return <Icon style={{ height, width }} className="card-icon" />;
    }

    return <img src={src} width={width} height={height} alt={title} />;
  };

  return (
    <div style={{ height: '180px', width: '156px' }} className={`${className}`}>
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
          <center>
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
