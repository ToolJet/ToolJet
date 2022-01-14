import React from 'react';

const Card = ({ title, src, handleClick }) => {
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
            <img src={src} width="50" height="50" alt={title} />

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
