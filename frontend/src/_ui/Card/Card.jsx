import React from 'react';
// eslint-disable-next-line import/no-unresolved
import { allSvgs } from '@tooljet/plugins/client';

const Card = ({ title, src, handleClick, height = 50, width = 50, usePluginIcon = false }) => {
  const DisplayIcon = ({ src }) => {
    if (typeof src !== 'string') return;

    if (usePluginIcon) {
      const Icon = allSvgs[src];
      return <Icon style={{ height, width }} />;
    }

    return <img src={src} width={width} height={height} alt={title} />;
  };

  return (
    <div style={{ height: '112px', width: '164px' }} className="col-md-2  mb-4">
      <div
        className="card"
        role="button"
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
        data-cy={`data-source-${String(title).toLocaleLowerCase()}`}
      >
        <div style={!usePluginIcon ? { marginTop: '20px' } : {}} className="card-body">
          <center>
            <DisplayIcon src={src} />
            <br></br>
            <br></br>
            <span>{title}</span>
          </center>
        </div>
      </div>
    </div>
  );
};

export default Card;
