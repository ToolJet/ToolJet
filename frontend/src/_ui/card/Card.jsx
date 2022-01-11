import React from 'react';

const Card = ({ cardProps }) => {
  return (
    <div className="col-md-3 mb-4" onClick={cardProps?.handleClick}>
      <div className="card datasource-card-item">
        <div className="card-body">
          <center>
            <img src={cardProps?.src} width="50" height="50" alt="" />
            <p className="mt-2">{cardProps?.text}</p>
          </center>
        </div>
      </div>
    </div>
  );
};

const Group = ({ list = [], heading = '' }) => {
  return (
    <>
      <div className="row row-deck card-group-deck mt-2">
        <h4 className="mb-2">{heading}</h4>
        {list.map((item, index) => (
          <Card key={index} cardProps={item} />
        ))}
      </div>
    </>
  );
};

Card.Group = Group;

export default Card;
