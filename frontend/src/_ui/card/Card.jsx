import React from 'react';
import { allSvgs } from '@tooljet/plugins/client';

const Card = ({ title, src, handleClick, usepluginIcon = false }) => {
  const CardIcon = ({ src, height = 50, width = 50 }) => {
    if (usepluginIcon) {
      const Icon = allSvgs[src];
      return <Icon style={{ height, width }} />;
    }

    return <img src={src} width="50" height="50" alt={title} />;
  };

  return (
    <div style={{ height: '112px', width: '164px' }} className="col-md-2 mb-4">
      <div
        className="card"
        role="button"
        onClick={(e) => {
          e.preventDefault();
          handleClick();
        }}
      >
        <div className="card-body">
          <center>
            <CardIcon src={src} />
            <br></br>
            <br></br>
            {title}
          </center>
        </div>
      </div>
    </div>
  );
};

export default Card;
